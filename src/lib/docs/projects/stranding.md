---
title: Stranding
subtitle: "Stranding is an early-stage SwiftUI iOS app exploring a \u201Cstrand-based\u201D\
  \ approach to structuring workouts and exercise routines. It\u2019s set up with\
  \ unit and UI test targets, making it a foundation for experimenting with fitness-focused\
  \ interactions, UI, and architecture in native Swift."
slug: stranding
date: '2025-08-11'
updated: '2025-08-11'
tags:
- swift
maturity: prototype
featured: false
visibility: public
heroImage: /generated/logos/stranding.png
---
## Overview

Stranding is an experimental iOS exercise app concept built with SwiftUI. The idea is to explore “strand‑based” workouts: instead of thinking in terms of isolated sessions, users build continuous strands of activity over time (e.g., daily movement streaks, micro‑workouts, and habit chains).  

This repository is the seed of that idea—a clean, minimal SwiftUI app skeleton set up for fast iteration, testability, and future expansion into a full fitness experience.

## Role & Context

I created Stranding as a personal project to experiment with:

- A lightweight SwiftUI app architecture.
- Modern Xcode testing tools (`Testing` package and XCTest UI tests).
- A foundation on which I can iterate quickly toward a richer fitness workflow.

At this stage the UI is intentionally minimal (“Hello, world!”) while the project structure, targets, and tests are ready for feature development.

## Tech Stack

- Swift
- SwiftUI
- Xcode project / Workspace
- XCTest (UI tests)
- Swift `Testing` package (for unit-style tests)
- iOS (UIKit under the hood via SwiftUI lifecycle)

## Problem

I wanted a space to prototype an exercise app with a different mental model: tracking continuous “strands” of behavior instead of just workouts on a calendar.  

Before investing in complex data models and design, I needed:

- A clean, SwiftUI-first app template.
- Properly configured unit and UI test targets.
- A structure that can evolve into a more opinionated architecture without fighting Xcode defaults.

Stranding solves this initial problem by giving me a well-structured sandbox that is still small and easy to refactor.

## Approach / Architecture

I started from the SwiftUI App lifecycle template and focused on:

- **Single entry point** via `StrandingApp` using `@main` and a `WindowGroup`.
- **Composable root view**: a simple `ContentView` that I can later replace with navigation, state management, and dependency injection.
- **Multi-target project setup**: app, unit tests, and UI tests are all configured as separate targets in the Xcode project.
- **Testing-first mindset**: created a test harness using both the new `Testing` framework and traditional XCTest UI tests so I can grow features with safety.

The architecture is intentionally flat and minimal right now, with the expectation that I’ll introduce modules (e.g., “WorkoutStrands”, “Profile”, “Insights”) once the core domain model is clearer.

## Key Features

- SwiftUI app entry point using the modern `App` protocol (`StrandingApp`).
- Clean, minimal `ContentView` ready to be turned into the main exercise dashboard.
- Separate targets for unit-style tests (`StrandingTests`) and UI tests (`StrandingUITests`).
- Baseline UI test that launches the app and captures a screenshot of the launch screen.
- Xcode workspace and scheme configuration checked into source control for reproducible builds.
- Asset catalogs and app icon setup to support expansion into a shippable app.

## Technical Details

### App Entry and Composition

The app uses SwiftUI’s `App` protocol:

```swift
@main
struct StrandingApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

This keeps the entry point declarative and makes it trivial to inject environment objects or root navigation later.

The initial `ContentView` is a simple vertical stack:

```swift
struct ContentView: View {
    var body: some View {
        VStack {
            Image(systemName: "globe")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Hello, world!")
        }
        .padding()
    }
}
```

I rely on this as a placeholder container; as features mature, this view will likely become a tab bar or navigation entry for different exercise strands.

### Project & Targets

The Xcode project defines three main products:

- `Stranding.app` – the main iOS app.
- `StrandingTests.xctest` – a test bundle for logic and model tests.
- `StrandingUITests.xctest` – a UI test bundle for end-to-end scenarios.

The `PBXFileSystemSynchronizedRootGroup` configuration in the `.pbxproj` ensures that the file system and Xcode’s logical groups stay aligned, which is helpful as the project grows and folders are reorganized.

### Unit-Style Tests with `Testing`

The `StrandingTests` target uses the new `Testing` package:

```swift
import Testing
@testable import Stranding

struct StrandingTests {

    @Test func example() async throws {
        // Write your test here and use APIs like `#expect(...)` to check expected conditions.
    }
}
```

This gives me modern, Swift-native test declarations (`@Test`) and expressive assertions (`#expect`) once I introduce real business logic such as strand progression, streak retention, or workout scoring.

### UI Tests with XCTest

The UI test targets are based on Xcode’s template but wired to support baseline coverage:

```swift
@MainActor
func testLaunch() throws {
    let app = XCUIApplication()
    app.launch()

    let attachment = XCTAttachment(screenshot: app.screenshot())
    attachment.name = "Launch Screen"
    attachment.lifetime = .keepAlways
    add(attachment)
}
```

This ensures:

- The app launches correctly under automated conditions.
- I can capture and track launch screen regressions visually as the UI evolves.

Another test measures launch performance:

```swift
@MainActor
func testLaunchPerformance() throws {
    if #available(macOS 10.15, iOS 13.0, tvOS 13.0, watchOS 7.0, *) {
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            XCUIApplication().launch()
        }
    }
}
```

This provides a performance baseline I can compare against as I add more complex startup logic (e.g., loading cached strands, syncing with HealthKit or a backend).

### Assets & Theming

The project includes standard asset catalogs:

- `AppIcon.appiconset` – configured for iOS with multiple appearance variants (including dark and tinted luminosity).
- `AccentColor.colorset` – a placeholder for the app’s primary tint color.

Keeping these in place from the start simplifies theming and gives me a clear path to branding later.

## Results

At this stage, Stranding delivers:

- A functional SwiftUI app that builds and runs on iOS.
- Validated launch flow via UI tests and screenshot capture.
- A ready-to-extend test harness for both logic and UI.
- A small, clean codebase that I can reshape into a strand-based exercise experience without wrestling with setup details.

Even though the current UI is intentionally minimal, the groundwork is in place to iterate quickly on the core exercise concepts.

## Lessons Learned

- Starting with a **testing-aware template** (unit + UI) pays off later; it’s easier than retrofitting tests into a grown codebase.
- Even a “Hello, world” app benefits from **clear project organization** and checked-in schemes, especially when moving between machines or collaborators.
- SwiftUI’s `App` lifecycle keeps the entry point concise, but it’s important to think early about how you’ll introduce environment dependencies and navigation to avoid refactoring churn.
- Establishing **performance tests early** gives a useful baseline when experimenting with data loading and background work.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/Stranding)
- [Live Demo (placeholder)](https://example.com/stranding-demo)