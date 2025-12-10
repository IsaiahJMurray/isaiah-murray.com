---
title: Stranding
subtitle: An in-progress strand-based exercise app for iOS, built with Swift and SwiftUI.
  The project is structured with unit and UI test targets from day one, laying groundwork
  for a testable, modular fitness experience as features are added.
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

Stranding is an experimental, strand-based exercise app that I started as a SwiftUI playground. At this stage it is a minimal iOS app scaffold with the goal of eventually guiding users through “strands” of workouts—linked, progressive sessions instead of isolated routines.

This project is currently in an early prototype phase. The main value lies in the clean SwiftUI/Xcode project setup, testing targets, and the architectural foundation for future fitness-specific features.

## Role & Context

I am the sole developer and designer on Stranding. I created the project to:

- Explore SwiftUI app structure in a focused, single-purpose app.
- Set up a testing-friendly Xcode project from day one.
- Prepare a foundation for experimenting with different ways to model progressive workouts.

This is a personal side project, built outside of any company context.

## Tech Stack

- Swift
- SwiftUI
- Xcode (iOS app + unit tests + UI tests)
- XCTest (UI tests)
- Swift Testing package (for unit-style tests where available)

## Problem

Most exercise apps treat workouts as flat lists: you pick a routine, complete it, and you’re done. I wanted an app that thinks in “strands”—sequences of related sessions where each workout is contextually linked to the previous one.

Before building out complex features, I needed a solid, testable SwiftUI app skeleton that:

- Launches cleanly on iOS.
- Has separate targets for unit and UI testing.
- Uses modern SwiftUI app lifecycle patterns.
- Can easily evolve into a more complex fitness experience.

## Approach / Architecture

I followed the SwiftUI App lifecycle and a layered Xcode project structure:

- **App entry point** via `StrandingApp` using `@main`, hosting a single `WindowGroup`.
- **Root view** (`ContentView`) as a placeholder UI that will later host navigation and workout strands.
- **Separated targets** for app code, unit tests, and UI tests to enforce good testing discipline.
- **Asset catalogs** prepared for app icon, accent color, and preview content so visual work can grow without restructuring.

This keeps the architecture simple while still following best practices for scaling later.

## Key Features

- SwiftUI-based app entry using `@main` and `WindowGroup`.
- Minimal, self-contained `ContentView` for quick UI iteration.
- Dedicated **unit test target** (`StrandingTests`) using the new `Testing` APIs.
- Dedicated **UI test target** (`StrandingUITests`) using XCTest.
- Asset catalogs already wired for app icons, accent colors, and previews.
- Xcode schemes and workspace configured for smooth development and running tests.

## Technical Details

### App entry

The app uses the SwiftUI app protocol:

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

This avoids `AppDelegate` boilerplate and makes it easy to inject shared state or environment objects later (e.g., workout strand stores, persistence, or health data managers).

### Root view

`ContentView` is currently a simple placeholder:

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

This gives me a live canvas for experimentation (via `#Preview`) and a single place to start adding:

- Navigation stacks.
- Strand list views.
- Workout detail views.

### Testing setup

I created two separate testing layers:

- **Unit-style tests** (`StrandingTests`):

  ```swift
  import Testing
  @testable import Stranding

  struct StrandingTests {
      @Test func example() async throws {
          // #expect(...) assertions will go here.
      }
  }
  ```

  This is ready for future logic around scheduling, progression, and validation of workout strands.

- **UI tests** (`StrandingUITests` and `StrandingUITestsLaunchTests`):

  - Launch the app using `XCUIApplication`.
  - Validate basic behaviors and capture a launch screenshot.
  - Include a launch performance test using `XCTApplicationLaunchMetric`.

This separation will let me test both the business logic of strand progression and the user-facing flows.

### Project structure

The Xcode project contains:

- Main app target: `Stranding`
- Unit test target: `StrandingTests`
- UI test target: `StrandingUITests`
- Asset catalogs and preview assets for design iteration.
- Scheme and workspace data checked in so the project is reproducible on other machines.

## Results

- Created a clean SwiftUI iOS app scaffold for the Stranding concept.
- Established unit and UI testing targets at project inception.
- Confirmed the app launches and runs in the simulator with a minimal UI.
- Lined up a structure that will make it straightforward to add real workout strand models and flows.

## Lessons Learned

- Starting with tests and multiple targets from day one avoids painful restructuring later, even for small experiments.
- The SwiftUI `@main` app lifecycle keeps the entry point simple and makes it easier to plan for injecting state and services.
- Having asset catalogs and preview content wired early helps streamline future design work and makes it easier to iterate visually.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/Stranding)
- Demo: _TBD_