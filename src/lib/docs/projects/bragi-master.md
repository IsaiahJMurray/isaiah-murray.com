---
title: Bragi Master
subtitle: Multi-component XR simulation platform combining a Unity-based Meta/Oculus
  experience with a SvelteKit web interface and Python/YOLOv5 backend services. Designed
  for researchers or developers exploring immersive simulations, it integrates spatial
  audio, haptics, gesture interaction, and REST-exposed computer vision models in
  a containerizable, multi-language stack.
slug: bragi-master
date: '2024-04-10'
updated: '2024-05-07'
tags:
- batchfile
- c#
- cpp
- cmake
- css
- dockerfile
- gap
- hlsl
- html
- java
- javascript
- objective-c++
- python
- shaderlab
- shell
- svelte
- vbscript
- sveltekit
- simulation
maturity: prototype
featured: false
visibility: public
heroImage: /generated/logos/bragi-master.png
---
## Overview

BRAGI-master is an experimental mixed-reality simulation platform that combines a Unity-based XR experience with a modern SvelteKit web interface and supporting backend services. I used it as a playground to explore spatial interaction, real-time visual effects, and service orchestration across multiple runtimes and languages. The project integrates Unity’s XR ecosystem with a web stack, making it possible to prototype both immersive in-headset experiences and complementary dashboard or control surfaces in the browser.

## Role & Context

I worked on this project as a solo developer, using it to deepen my understanding of:

- Unity’s XR stack (Meta/Oculus plugins, interaction and haptics SDKs).
- Authoring shaders and spatial effects for immersive environments.
- Building a Svelte/SvelteKit-based web UI with a Node backend.
- Structuring a polyglot repo with C#, C++, Python, Java, and JavaScript components.

The codebase is also a staging area for experiments, such as integrating computer vision models (YOLOv5) and REST APIs that could feed data into the XR experience.

## Tech Stack

- Unity (C#, ShaderLab, HLSL)
- Meta / Oculus XR SDKs and Interaction SDK
- Svelte / SvelteKit
- Node.js (Express-style backend and middleware ecosystem)
- Docker (containerization)
- Python (YOLOv5 utilities and REST API example)
- C++ / CMake (native utilities and build scripts)
- HTML / CSS / JavaScript
- Shell / Batch scripts for tooling and automation

## Problem

I wanted a single sandbox project where I could:

- Prototype XR mechanics using Unity and Meta’s SDKs.
- Experiment with spatial audio, haptics, and interaction patterns.
- Build a complementary web-based UI that could act as a controller, monitor, or companion experience.
- Try out service boundaries between game engine code, backend APIs, and optional ML inference services.

Commercial tools and tutorials typically focus on either the XR side or the web/backend side, but rarely on how these pieces might live together in one cohesive system. BRAGI-master addresses that gap for my own learning and experimentation.

## Approach / Architecture

I structured the repository as a multi-project workspace:

- **Unity XR project**  
  A full Unity project (based on `Unity-Phanto-main`) configured for Meta/Oculus devices. It uses:
  - Meta XR Core, Interaction, Audio, and Haptics SDKs.
  - Unity’s XR Management, Timeline, UGUI, and Visual Scripting packages.
  - C# scripts and shaders for interactivity and visual feedback.

- **Svelte web app**  
  A Svelte/SvelteKit front-end with a Node-based backend:
  - Svelte for building reactive UI panels, debug views, and control surfaces.
  - Node/Express-style backend, leveraging standard middleware (axios, bcrypt, cookie handling, etc.).
  - REST-style endpoints that could be consumed by the Unity app or external tools.

- **ML / Simulation utilities**  
  - YOLOv5 utilities and a sample Flask REST API for ML inference.
  - Intended as a pattern for how external ML services could feed object detection or scene understanding into the XR environment.

- **Tooling and automation**  
  - Shell/Batch scripts and Dockerfiles to standardize environment setup and build workflows.
  - CMake-based utilities for any native components.

Communication between layers is intentionally loose-coupled via HTTP/REST and file- or stream-based interfaces, making it easy to swap out services or run them independently.

## Key Features

- Unity-based XR scene configured for Meta/Oculus devices using official SDKs.
- Interaction system leveraging Meta’s Interaction SDK for hands/controllers and body pose.
- Spatial audio and haptic feedback via Meta XR Audio and Haptics SDKs.
- Svelte/SvelteKit UI that can serve as a dashboard, controller, or debug overlay.
- Node backend exposing REST-style endpoints and integrating common middleware utilities.
- Example Flask REST API for running YOLOv5 inference as an external service.
- Containerization and scripting for repeatable development environments.

## Technical Details

- **Unity XR integration**
  - Enabled XR through `com.unity.xr.management` and the Oculus XR plugin (`com.unity.xr.oculus`).
  - Used Interaction SDK packages (`com.meta.xr.sdk.interaction`, `com.meta.xr.sdk.interaction.ovr`) to wire up tracked pose drivers and interaction components.
  - Integrated spatial audio via `com.meta.xr.sdk.audio` and haptics via `com.meta.xr.sdk.haptics` to add rich feedback to interactions.
  - Leveraged Unity Timeline and UGUI for coordinated sequences and in-world UI elements.
  - Used Unity’s Visual Scripting package to quickly prototype behaviors without always writing C#.

- **Web frontend & backend**
  - Svelte/SvelteKit used for lightweight, reactive frontends that can be built into static assets or run in SSR mode.
  - The Node backend relies on a standard ecosystem of small utilities (axios for HTTP, bcrypt.js for hashing, various polyfills and helpers), creating an Express-like environment for REST APIs and integration endpoints.
  - File-system helpers (like steno and low-level FS utilities) are available for safe, concurrent file writes, useful for logging and diagnostics when coordinating with the Unity app.

- **ML integration pattern**
  - The YOLOv5 Flask REST API example (under `yolov5-master/utils/flask_rest_api`) demonstrates:
    - A simple `POST /v1/object-detection/yolov5s` endpoint that accepts an image and returns structured detections (class, confidence, normalized bounding boxes).
    - How to decouple heavy ML inference from the game loop by placing it behind a network boundary.
  - This pattern can be replicated for other models, with Unity or the Node backend calling out to the Flask service and ingesting JSON responses.

- **Polyglot and build tooling**
  - CMake and C++ support are prepared for native extensions or performance-sensitive utilities.
  - Batch and Shell scripts help normalize builds across Windows and *nix environments.
  - Dockerfiles are present to encapsulate runtime dependencies (Node, Python/Flask, possibly Unity build agents) for reproducible deployments.

## Results

- I established a working baseline XR project that targets Meta devices with interaction, audio, and haptic support wired through official SDKs.
- I validated a full-stack pattern where:
  - Unity handles real-time, immersive rendering and interaction.
  - Svelte/Node provide web UIs and REST integration points.
  - External ML services (e.g., YOLOv5 via Flask) can be called over HTTP and integrated without blocking the main XR loop.
- The repository now serves as a reference blueprint for future experiments in XR + web + ML integration.

## Lessons Learned

- Unity’s XR stack is powerful but can become complex when many packages are involved; explicit version and dependency management is essential to keep the project stable.
- Decoupling heavy compute (like ML inference) behind REST APIs greatly simplifies integration and preserves frame rate in real-time applications.
- Svelte/SvelteKit is a strong fit for quickly building companion tools and dashboards for XR experiences.
- Keeping a polyglot repo organized requires clear boundaries between concerns (engine, web, ML, tooling) and consistent naming and directory conventions.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/BRAGI-master)
- [Live Demo (placeholder)](https://example.com/bragi-demo)