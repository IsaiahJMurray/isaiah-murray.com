---
title: Limen
subtitle: "A SwiftUI iOS client for orchestrating AI assistant \u201Csessions\u201D\
  \ that send user queries to a configurable backend and render dynamic responses.\
  \ Built for developers integrating tool-calling/async workflows, it features a flexible\
  \ `CodableValue` model for arbitrary JSON payloads and a clean MVVM structure around\
  \ `SessionViewModel`."
slug: limen
date: '2025-04-13'
updated: '2025-04-15'
tags:
- swift
maturity: prototype
featured: false
visibility: public
heroImage: /generated/logos/limen.png
---
## Overview

Limen is an experimental iOS client that talks to a custom AI “assistant” backend. I built it to explore how to model assistant-style responses (messages, tool calls, async work) in a clean SwiftUI architecture, and to have a concrete playground for iterating on my backend API design.

The app is intentionally minimal in UI: it focuses on wiring a real session, exchanging JSON payloads, and surfacing results in a SwiftUI view model that can be extended later.

## Role & Context

I designed and implemented Limen end to end:

- Defined the data models for assistant responses, tool calls, and async calls.
- Implemented the networking layer and view model to drive a SwiftUI session screen.
- Set up a basic navigation shell and placeholder UI for testing flows.
- Added a small utilities layer (`CodableValue`) to support flexible JSON from the backend.
- Bootstrapped test targets and a basic XCTest-based launch flow.

This is a solo project I use as a sandbox for iterating on an AI-assistant backend and iOS client patterns.

## Tech Stack

- Swift
- SwiftUI
- Combine
- URLSession
- XCTest / Xcode UI Tests

## Problem

I wanted an iOS app that could:

- Maintain a “session” with my AI assistant backend.
- Send user queries and receive rich responses that may include:
  - Simple text replies.
  - Immediate tool outputs.
  - Tool calls that the client may want to display or act on.
  - Asynchronous tool calls that may complete later.
- Handle backend payloads whose shape is not strictly fixed, while still using Swift’s `Codable` system safely.

Existing chat/assistant examples are often tightly coupled to a specific provider or assume a fixed schema. I needed something small, testable, and flexible that matched my own backend’s contract.

## Approach / Architecture

I used a simple, layered approach:

- **Models** represent exactly what the backend sends:
  - `AssistantResponse` with status, message, run ID, tool results, tool calls, and async calls.
  - `ToolResult`, `ToolCall`, and `AsyncCall` for more granular data.
- **Dynamic JSON handling** through a `CodableValue` enum so the client can parse arbitrary argument payloads from the backend without losing type safety.
- **View model** (`SessionViewModel`) as an `ObservableObject` that:
  - Manages user input (`userText`), system output (`responseText`), and UI choices.
  - Holds immutable session context (`sessionId`, `userId`, `baseURL`).
  - Encapsulates all networking with `URLSession`.
- **SwiftUI views**:
  - `ContentView` acts as a simple entry point with navigation into a `SessionView`.
  - `SessionView` (not fully shown in the snippet) binds directly to the view model.
- **Testing**:
  - Lightweight unit test scaffold using the new `Testing` library in `LimenTests`.
  - Launch and UI tests using XCTest to verify the app boots and can be profiled.

This keeps the core logic testable and makes it straightforward to swap environments by changing the `baseURL`.

## Key Features

- Simple navigation shell to drive a session-based assistant flow.
- `SessionViewModel` that encapsulates session context and networking.
- `AssistantResponse` model capturing multiple tool-related concepts in one response.
- `CodableValue` enum to decode arbitrary JSON argument payloads.
- POST-based query submission to `/ios_session/query` with structured JSON.
- Basic state published to SwiftUI (`userText`, `responseText`, `choices`) for easy UI binding.
- XCTest-based UI launch tests to validate that the app starts and renders.

## Technical Details

The app starts in `LimenApp`, which sets a black background and hosts `ContentView` in a `WindowGroup`. `ContentView` displays a title and a `NavigationLink` wired to an instance of `SessionView`:

```swift
NavigationLink(
    destination: SessionView(
        viewModel: SessionViewModel(
            sessionId: "4657f217-adcd-46e2-b1a2-4fe07dbc5b2b",
            userId: "1",
            baseURL: URL(string: "https://api.yourproductiondomain.com")!
        )
    )
) {
    Text("Go to Second View")
        .padding()
        .background(Color.blue)
        .foregroundColor(.white)
        .cornerRadius(10)
}
```

### Data Models

`SessionView.swift` defines the core models:

```swift
struct AssistantResponse: Codable {
    let status: String
    let message: String?          // Text response from the assistant
    let run_id: String
    let tool_results: [ToolResult]?
    let tool_calls: [ToolCall]?
    let async_calls: [AsyncCall]?
}

struct ToolResult: Codable {
    let tool_call_id: String
    let output: String
}

struct ToolCall: Codable {
    let tool_call_id: String
    let tool_type: String
    let args: [String: CodableValue]
}

struct AsyncCall: Codable {
    let tool_id: String
    let tool_type: String
    let args: [String: CodableValue]
    let status: String
}
```

The `args` fields on `ToolCall` and `AsyncCall` are intentionally generic: they can carry different payloads depending on the tool type. To model this, I added `CodableValue`.

### Dynamic JSON: `CodableValue`

`CodableValue` is an enum that can represent several primitive and composite JSON types while still conforming to `Codable`:

```swift
enum CodableValue: Codable {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)
    case array([CodableValue])
    case dictionary([String: CodableValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let str = try? container.decode(String.self) {
            self = .string(str)
        } else if let int = try? container.decode(Int.self) {
            self = .int(int)
        } else if let dbl = try? container.decode(Double.self) {
            self = .double(dbl)
        } else if let bool = try? container.decode(Bool.self) {
            self = .bool(bool)
        } else if let array = try? container.decode([CodableValue].self) {
            self = .array(array)
        } else if let dict = try? container.decode([String: CodableValue].self) {
            self = .dictionary(dict)
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Unknown type"
            )
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .int(let value): try container.encode(value)
        case .double(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .array(let values): try container.encode(values)
        case .dictionary(let dict): try container.encode(dict)
        case .null: try container.encodeNil()
        }
    }
}

extension CodableValue {
    var stringValue: String? {
        if case let .string(value) = self { return value }
        return nil
    }
}
```

This lets me decode nested JSON structures while deferring strict type interpretation to higher layers when needed.

### View Model and Networking

`SessionViewModel` is the main bridge between UI and backend:

```swift
class SessionViewModel: ObservableObject {
    @Published var userText: String = ""
    @Published var responseText: String = "System text placeholder"
    @Published var choices: [String] = []

    let sessionId: String
    let userId: String
    let baseURL: URL

    init(sessionId: String, userId: String, baseURL: URL) {
        self.sessionId = sessionId
        self.userId = userId
        self.baseURL = baseURL
    }

    func submitUserMessage() {
        let queryURL = baseURL.appendingPathComponent("ios_session/query")
        let requestData: [String: Any] = [
            "session_id": sessionId,
            "user_id": userId,
            "content": userText
        ]

        guard let jsonData = try? JSONSerialization.data(withJSONObject: requestData) else {
            print("Error converting query request to JSON")
            return
        }

        var request = URLRequest(url: queryURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = jsonData

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Query network error: \(error)")
                return
            }

            guard let data = data else {
                print("Empty query response data")
                return
            }

            do {
                let decoded = try JSONDecoder().decode(AssistantResponse.self, from: data)
                DispatchQueue.main.async {
                    self.handleResponse(decoded)
                }
            } catch {
                print("Query decoding error: \(error)")
            }
        }.resume()
    }

    func handleResponse(_ ar: AssistantResponse) {
        // Implementation (partially truncated in snippet) would:
        // - Update responseText from ar.message or tool_results
        // - Populate choices from async_calls or tool_calls when relevant
        // - Potentially drive additional follow-up requests
    }
}
```

Key points:

- I pass `sessionId`, `userId`, and `baseURL` into the view model so it is environment-agnostic and easy to test.
- The query request is encoded with `JSONSerialization` to support the lightweight `[String: Any]` structure.
- Responses are decoded with `JSONDecoder` into `AssistantResponse`, then processed on the main thread before updating published properties.

### Testing and UI Scaffolding

The project includes:

- `LimenTests` with a placeholder test using the new `Testing` framework, ready to be expanded into model and view-model tests.
- `LimenUITests` and `LimenUITestsLaunchTests` using XCTest to:
  - Launch the app.
  - Capture a screenshot of the launch screen.
  - Support launch performance measurements with `XCTApplicationLaunchMetric`.

These tests are minimal but provide a base to automate regression checks as I evolve the API and UI.

## Results

- Established a working SwiftUI client wired to a real assistant-style backend endpoint.
- Validated an API design that supports:
  - Synchronous text responses.
  - Tool outputs and tool calls.
  - Asynchronous calls that may produce follow-up UI.
- Proved out the `CodableValue` pattern for handling mixed-type JSON payloads without resorting to untyped dictionaries everywhere.
- Created a small, extensible codebase that I can use to prototype new assistant behaviors and session flows on iOS.

## Lessons Learned

- Modeling “tool calls” and “async calls” explicitly in the response object makes the client architecture cleaner than overloading a single text field.
- A generic `CodableValue` type is a practical compromise between strict typing and real-world JSON flexibility, especially when integrating with experimental backends.
- Keeping session context (`sessionId`, `userId`, environment `baseURL`) inside the view model constructor makes it much easier to spin up previews, local-dev builds, and production builds with different configurations.
- Even a minimal UI benefits from having UI and logic separated via `ObservableObject`, particularly when adding tests later.
- Starting with simple networking via `URLSession` and JSON payloads is enough to validate protocols before introducing more complex patterns like streaming or WebSockets.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/Limen)
- Demo: _TBD_