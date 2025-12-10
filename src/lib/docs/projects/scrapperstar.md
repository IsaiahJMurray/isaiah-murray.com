---
title: Scrapperstar
subtitle: "A Unity-based project tentatively set up for building a game or interactive\
  \ experience called ScrapperStar. Aimed at players or prototypes needing rapid iteration,\
  \ it\u2019s structured with a clean Unity-specific .gitignore for streamlined collaboration\
  \ and build management."
slug: scrapperstar
date: '2023-08-07'
updated: '2023-08-22'
tags: []
maturity: prototype
featured: false
visibility: public
heroImage: /generated/logos/scrapperstar.png
---
## Overview

ScrapperStar is a Unity-based prototype I created to explore data collection, content “scraping,” and aggregation mechanics inside a game-like environment. Rather than being a traditional web scraper, the project experiments with simulating scraping behavior as a gameplay loop: finding, extracting, and organizing pieces of information in a 3D space. The goal was to practice structuring a Unity project, experimenting with systems design, and iterating quickly on an idea without focusing on polish or production visuals.

## Role & Context

I built ScrapperStar as a solo side project. It originated as a sandbox for testing Unity workflows and experimenting with abstractions for data-driven gameplay:

- I handled the concept, design, and implementation.
- I set up the Unity project structure and environment.
- I explored patterns for separating “data” from presentation and interaction.

The repository is intentionally small and experimental, serving more as a playground than a complete game.

## Tech Stack

- Unity (C#)
- .NET / Mono runtime (via Unity)
- Git & GitHub for version control

## Problem

I wanted a small, constrained project where I could:

- Prototype a “collection/scraping” mechanic without building a full game.
- Practice organizing a Unity project for iterative experimentation.
- Try out patterns for representing and updating in-game data items that behave like web-scraped entities (discrete items with properties, states, and relationships).

The challenge was to keep scope small but still build something interactive enough to test ideas around data collection and state changes.

## Approach / Architecture

I structured the project as a standard Unity project with clear separation between core logic and presentation:

- **Scene-centric organization:** Core test scenes for quickly iterating on mechanics, each focused on a specific idea or interaction pattern.
- **Component-based systems:** C# MonoBehaviours encapsulate individual responsibilities—data items, collectors, visual markers, and UI feedback.
- **Data-first thinking:** Even though the data is local and simulated, I treated each collectible/scrap as if it were a scraped record, with fields and state transitions (e.g., discovered, collected, processed).
- **Iteration over architecture:** Given the prototype nature, I optimized for speed of change over heavy abstraction, using simple, composable components instead of complex frameworks.

## Key Features

- Simulated “scrapable” data items represented as interactive objects in the scene.
- Collection mechanics that let a player or agent “scrape” items and move them into an inventory/state store.
- Simple state transitions for data items (e.g., unscanned → scanned → collected).
- Visual feedback for collected vs. uncollected items.
- Basic project structure set up with a clean Unity `.gitignore` to support ongoing iteration.

## Technical Details

From a technical standpoint, the project focuses on Unity workflows rather than production-ready systems:

- **Unity project hygiene:** I used a tailored `.gitignore` optimized for Unity to keep the repository lightweight, excluding build artifacts, Library/Temp/Obj folders, IDE caches, and other generated content. This keeps the repo clean and reduces noise in version control.
- **Componentization:** Each interactable object in the scene is intended to be controlled by a small, focused script—responsible for:
  - Storing basic data properties (acting like a “scraped record”).
  - Handling interactions such as “scan” or “collect.”
  - Communicating status changes to other components (e.g., simple event calls or inspector-assigned references).
- **Iteration-centric workflow:** Because the project is a sandbox, I kept the architecture flexible:
  - Minimal coupling between systems to avoid refactor pain.
  - Use of prefabs for quick duplication and variation of “scrapable” objects.
  - Scenes meant as experiments rather than polished levels.

Given the early stage of the project, much of the work is foundational: project setup, ignoring the right files, and preparing the environment for more complex data-driven and scraping-inspired mechanics.

## Results

ScrapperStar served its purpose as a quick Unity sandbox:

- I established a clean Unity repository baseline with proper version control practices.
- I validated a lightweight approach to modeling “scraped” data as in-game objects with state.
- I identified patterns I want to refine in future Unity work, such as more formal data models (ScriptableObjects) and decoupled event systems.

The project is intentionally small and unfinished, but it gave me a practical space to try ideas and confirm which directions are worth pursuing in more serious prototypes.

## Lessons Learned

- A clean `.gitignore` and project structure dramatically reduce friction when experimenting in Unity.
- Treating in-game objects as “records” with explicit states helps when designing data-centric mechanics, even for small prototypes.
- It’s better to keep architecture light and adaptable in early explorations; over-designing too soon slows down experimentation.
- Using small, focused scenes and prefabs makes it much easier to test new mechanics without breaking existing experiments.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/ScrapperStar)
- Demo: _TBD_