---
title: Limen
subtitle: "An iOS SwiftUI client for orchestrating conversational \u201Cassistant\u201D\
  \ sessions backed by a custom API. Built for developers integrating tool-calling\
  \ and async workflows on mobile, it models heterogeneous JSON payloads with a type-safe\
  \ `CodableValue` enum and a reactive `SessionViewModel` that drives navigation and\
  \ UI state."
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

Limen is an experimental iOS client for a tool-augmented AI assistant. The app focuses on a minimal SwiftUI interface that talks to a backend “assistant” service, sends user queries, and renders structured responses that can include tool calls, async tool results, and free-form text.

This project is an early scaffold rather than a fully polished product, but it already encodes patterns I use for strongly typed networking with dynamic JSON payloads in Swift.

## Role & Context

I built Limen as a solo project to explore:

- How to structure a SwiftUI client around an LLM-style backend that can trigger tools and async flows.
- How to decode heterogeneous, schema-lite JSON into strongly typed Swift models using `Codable`.
- How to keep the UI layer simple while experimenting quickly with backend contracts.

The repository is intentionally lightweight and focused on the core session screen and networking model.

## Tech Stack

- Swift
- SwiftUI
- Combine
- URLSession (networking)
- XCTest / XCUITest
- Xcode’s `Testing` framework (for async tests)
- iOS SDK

## Problem

I wanted a small, focused iOS app that could:

- Talk to a backend “assistant” API that returns more than just plain text (tool calls, tool results, async calls).
- Handle dynamic JSON values without losing type safety across the rest of the codebase.
- Provide a clear test bed for experimenting with prompt flows and tool orchestration while keeping the UI straightforward.

The main challenges were:

- Designing Codable models flexible enough to represent nested, mixed-type fields like `args` without sacrificing compile-time safety.
- Keeping the networking layer simple but robust enough to support iterative changes in the backend schema.
- Structuring the SwiftUI view and view model so the assistant session state remained easy to reason about.

## Approach / Architecture

I implemented a fairly standard MVVM-style structure:

- **View layer (SwiftUI)**  
  `ContentView` owns navigation and passes a configured `SessionViewModel` into `SessionView`, which displays the active session state.

- **View model (`SessionViewModel`)**  
  `ObservableObject` that:
  - Holds published properties for user input, assistant responses, and any choice options.
  - Builds and sends HTTP requests to the backend.
  - Decodes the JSON response into typed models and updates published state on the main thread.

- **Model layer**  
  Swift `Codable` structs mirror the backend contract:

  - `AssistantResponse` (top-level envelope)
  - `ToolResult`
  - `ToolCall`
  - `AsyncCall`
  - `CodableValue` (a dynamic, type-erased, yet Codable enum for arbitrary JSON values used in `args`).

Networking is intentionally kept close to the view model, using `URLSession` directly, to reduce indirection while I iterate on the backend interface.

## Key Features

- Minimal SwiftUI UI with a simple navigation flow and dark-background container.
- Strongly typed models for complex assistant responses (`tool_results`, `tool_calls`, `async_calls`).
- `CodableValue` enum to decode arbitrary JSON value types into a single Swift type.
- Session-based request payloads including `session_id`, `user_id`, and `content`.
- Configurable base URL to easily switch between local and production backend environments.
- Basic test scaffolding with unit and UI test targets set up in Xcode.

## Technical Details

### SwiftUI structure

The main app entry is `LimenApp`:

- Wraps everything in a `WindowGroup`.
- Applies a black background and extends it to ignore safe areas to control the visual framing.

`ContentView` contains:

- A `NavigationView` with a welcome message.
- A `NavigationLink` that instantiates a `SessionView` with a `SessionViewModel` configured with:
  - A hardcoded `sessionId`.
  - A hardcoded `userId`.
  - A `baseURL` pointing at `https://api.yourproductiondomain.com`.

This keeps the “shell” of the app trivial and makes the session screen the core of the experience.

### Assistant response models

I defined a set of `Codable` structs that directly map to the backend JSON:

```swift
struct AssistantResponse: Codable {
    let status: String
    let message: String?
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

The key design decision is the use of `CodableValue` for `args`, since those fields can be mixed-type.

### Dynamic JSON with `CodableValue`

`CodableValue` is a custom enum conforming to `Codable` that can represent:

- `String`
- `Int`
- `Double`
- `Bool`
- Arrays of `CodableValue`
- Dictionaries of `String` to `CodableValue`
- `null`

The `init(from:)` implementation attempts to decode in order:

1. `nil`
2. `String`
3. `Int`
4. `Double`
5. `Bool`
6. `[CodableValue]`
7. `[String: CodableValue]`

If all fail, it throws a `DecodingError.dataCorruptedError`. The `encode(to:)` implementation mirrors this by switching on the case and encoding the underlying value.

This gives me:

- The ability to work with arbitrary JSON structures in `args` without resorting to `Any` or manual `JSONSerialization` everywhere.
- Enough structure to add computed helpers (e.g., `stringValue`) for the types I care about in the UI or higher-level logic.

### SessionViewModel and networking

`SessionViewModel` is an `ObservableObject` with:

- `@Published var userText: String`
- `@Published var responseText: String`
- `@Published var choices: [String]`

It also stores the identifiers and base URL needed for session-scoped API calls:

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
}
```

#### Submitting a user message

`submitUserMessage()`:

1. Builds the endpoint: `baseURL.appendingPathComponent("ios_session/query")`.
2. Creates a request payload:

   ```swift
   let requestData: [String: Any] = [
       "session_id": sessionId,
       "user_id": userId,
       "content": userText
   ]
   ```

3. Serializes it to JSON with `JSONSerialization`.
4. Configures a `URLRequest` with `POST` and sets `Content-Type: application/json`.
5. Executes a `URLSession.shared.dataTask`.

On response:

- Handles network errors and empty data.
- Uses `JSONDecoder` to decode `AssistantResponse`.
- Dispatches back to the main queue to call `handleResponse(_:)` and update UI-facing state.

#### Handling responses

Although the provided snippet truncates inside `handleResponse`, the intent is:

- Check `status` (e.g., `"completed"`).
- Use `message`, `tool_results`, and/or `async_calls` to build `responseText` and possibly populate `choices`.
- Update published properties so SwiftUI re-renders automatically.

This pattern keeps the network and decoding logic out of the SwiftUI view, while still being small and easy to trace.

### Testing setup

I generated separate targets for:

- **Unit tests** (`LimenTests`), currently scaffolded using Xcode’s `Testing` package with an empty `example()` test.
- **UI tests** (`LimenUITests`, `LimenUITestsLaunchTests`) using XCTest/XCUITest, including:
  - A basic launch test that takes and stores a screenshot.
  - A performance test measuring app launch time.

These are placeholders but allow me to gradually add coverage around JSON decoding, view model logic, and basic UI flows.

## Results

Because Limen is an early-stage experiment rather than a shipped app, the “results” are primarily architectural and developmental:

- I established a reusable `CodableValue` pattern for dynamic JSON fields that I can now copy into other projects.
- I validated a simple MVVM structure that keeps SwiftUI screens thin while letting me iterate rapidly on the backend schema.
- I set up a small, end-to-end path from input text on iOS to a tool-augmented AI backend and back to rendered content, which is enough to prototype new assistant flows quickly.

## Lessons Learned

- **Dynamic JSON in Swift is manageable with a small amount of infrastructure.** A single `CodableValue` enum dramatically simplifies dealing with varied payloads from LLM-style backends.
- **Type safety and flexibility can coexist.** By pushing the untyped boundary to a small, explicit part of the model (`args`), the rest of the app stays strongly typed.
- **Start simple with MVVM