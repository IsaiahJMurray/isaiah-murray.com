---
title: Bragi Master
subtitle: BRAGI is an XR simulation platform that combines a Unity-based Meta/Oculus
  experience with a SvelteKit web app and YOLOv5-powered vision backend. Built for
  researchers and developers experimenting with immersive interactions, spatial audio/haptics,
  and real-time object detection, it showcases a full-stack pipeline from headset
  input to ML inference via REST APIs and containerized services.
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
maturity: polished
featured: true
visibility: public
heroImage: /generated/logos/bragi-master.png
---
## Overview

BRAGI-master is an experimental mixed-reality simulation environment that combines a Unity-based XR experience with a modern SvelteKit web stack and Python/YOLOv5 computer vision components. I used it as a sandbox to explore how real-time spatial interaction, computer vision, and web-based orchestration can be wired together into a cohesive prototype.

The repository is intentionally broad: it includes a Unity XR project (targeting Oculus/Meta devices), a Svelte/SvelteKit-based web front-end with a Node backend, and a Python-based YOLOv5 REST API example. Together they form a playground for testing ideas in interactive simulations and mixed-reality systems.

## Role & Context

I owned this project end-to-end as a solo developer:

- Defined the goals and architecture.
- Integrated Unity’s XR stack (Oculus/Meta SDK, interaction, haptics, spatial audio).
- Assembled a SvelteKit front-end with a small Node-based backend.
- Experimented with YOLOv5 and a Flask REST API for model-serving.
- Built the infrastructure pieces (Docker, scripts) to make the system more repeatable.

The project started as a personal R&D effort rather than a production application. The primary aim was to explore tooling and patterns for future, more focused XR/simulation work.

## Tech Stack

- Unity (C#) – XR/Meta SDKs, interaction, haptics, spatial audio
- C++ / CMake – native/engine-adjacent components and build tooling
- ShaderLab / HLSL – custom shaders for visual effects
- Svelte / SvelteKit – web UI and front-end app shell
- Node.js / JavaScript – backend services and APIs
- Python – computer vision and ML integration (YOLOv5, Flask REST API)
- HTML / CSS – UI layout and styling
- Docker / Dockerfile – containerization of backend/ML services
- Shell / Batch / VBScript – build and tooling automation
- Java / Objective-C++ / GAP – ancillary experiments and libraries

## Problem

I wanted a realistic environment to answer a few questions:

- How to stitch together a Unity-based XR simulation with web-based controls and dashboards.
- How to serve ML models (like YOLOv5) over a REST API and feed results into an interactive experience.
- How to structure a repository that spans multiple ecosystems (Unity, Node, Python, Svelte) without everything collapsing into unmanageable chaos.

There was no single product feature to build; the challenge was to design something flexible enough to try many ideas while still being understandable and reproducible.

## Approach / Architecture

I structured BRAGI-master as a multi-part system:

- **Unity XR project**  
  A Unity project (Unity-Phanto-main) configured with Oculus/Meta XR plugins, interaction SDK, haptics, spatial audio, and Unity UI. This is the primary mixed-reality “world” where interactions happen.

- **Web front-end (Svelte/SvelteKit)**  
  A Svelte app provides a web-based interface for controlling simulations, viewing telemetry, or interacting with backend services. SvelteKit conventions help keep routing and state management simple.

- **Backend services (Node)**  
  A Node-based backend supports the Svelte app with REST endpoints, integration utilities (e.g., axios-based HTTP calls), and general server-side glue. This is where I can proxy requests to ML services, persist small bits of state, and manage configuration.

- **ML & Computer Vision service (Python + YOLOv5)**  
  The `yolov5-master` directory includes a Flask-based REST API that exposes YOLOv5 object detection over HTTP. The service can receive an image, run inference, and respond with a JSON payload of detected objects.

- **Infrastructure & tooling**  
  Dockerfiles and shell/batch scripts are used to make the backend/ML stack reproducible and easier to spin up without manually managing Python environments on each machine.

This architecture let me iterate independently on the XR experience, web UI, and ML backend, while still having clear paths to integrate them over HTTP.

## Key Features

- Unity XR setup using Meta/Oculus plugins, interaction SDK, and haptics.
- Spatial audio and environment-aware sound leveraging the Meta XR Audio SDK.
- Svelte/SvelteKit front-end for dashboards, controls, and experimentation UIs.
- Node.js backend with modular helpers (axios, middleware, etc.) for API orchestration.
- YOLOv5 Flask REST API for image-based object detection with JSON responses.
- Dockerized workflows for backend/ML services to keep environments reproducible.
- Cross-platform build and tooling scripts (Shell, Batch, VBScript) to automate setup.

## Technical Details

The Unity project is configured around the Meta/Oculus XR stack:

- **XR & Interaction**  
  I used packages such as `com.meta.xr.sdk.core`, `com.unity.xr.oculus`, and `com.meta.xr.sdk.interaction` to handle headset, controllers, and hand-tracking. Interaction SDK components provide tracked pose drivers and body pose detection that can be bound directly to in-scene objects.

- **Haptics & Spatial Audio**  
  With `com.meta.xr.sdk.haptics` and `com.meta.xr.sdk.audio`, I wired haptic clips and spatial audio sources into Unity scenes. The haptics SDK abstracts over controller specifics; spatial audio uses HRTFs and room acoustics to provide a more convincing mixed-reality effect.

- **UI and Logic**  
  Unity UI (`com.unity.ugui`) and Visual Scripting (`com.unity.visualscripting`) are present in the project to make it easier to experiment both with C# and graph-based logic. Code coverage tooling is set up (`com.unity.testtools.codecoverage`) to provide feedback on test completeness when I add more automated tests.

On the web side:

- **Svelte/SvelteKit frontend**  
  The Svelte app uses standard SvelteKit conventions to manage routes and data loading. Node dependencies inside `backend/node_modules` show typical Express-style helpers, axios for HTTP calls, and small utilities (`array-flatten`, `deep-extend`, `object-assign`, etc.) used by the ecosystem.

- **Backend integration**  
  The backend can call out to the Flask YOLOv5 API using axios. The typical flow is:
  1. Receive a request from the Svelte front-end.
  2. Forward or transform payloads for the ML service.
  3. Normalize and return results in a front-end-friendly schema.

On the ML side:

- **YOLOv5 REST API**  
  The included `utils/flask_rest_api` example exposes the YOLOv5s model via Flask:
  - `POST /v1/object-detection/yolov5s` accepts an image file.
  - The service runs YOLOv5 inference and returns JSON with bounding boxes, class names, and confidence scores.
  I use this as a pattern for integrating model inference as a service, not as a tight in-process dependency.

Infrastructure and tooling:

- **Docker**  
  Dockerfiles are used for packaging backend and ML services. This keeps Python and Node dependencies isolated and aligns well with deploying the system (or subsets of it) to different machines.

- **Build & automation scripts**  
  Batch, Shell, and VBScript utilities help with:
  - Installing dependencies.
  - Running Unity in batch mode where appropriate.
  - Starting/stopping services in a consistent order.

## Results

Because this is a research and learning project rather than a shipped product, I measured success differently:

- I validated that Unity XR, a SvelteKit web UI, and a Python/YOLOv5 service can be combined using clean HTTP boundaries.
- I built a reusable skeleton I can fork for more focused XR or simulation projects.
- I gained practical experience with Meta XR plugins (interaction, haptics, audio) and how they behave together in a real Unity project.
- I established a cross-language repo structure that remains navigable despite spanning C#, C++, JS/TS, and Python.

## Lessons Learned

- Unity’s package ecosystem (XR, interaction, haptics, audio, UI, visual scripting) is powerful but can become opaque; keeping packages at known-good versions and documenting them is crucial.
- Separating ML serving (Flask/YOLOv5) behind a simple REST API is an effective way to integrate Python into a primarily C#/JS codebase.
- SvelteKit is a good fit for quickly building control panels and dashboards for simulations—especially when paired with a small Node backend.
- A multi-language repository needs strong conventions: clear folder layouts, consistent naming, and minimal cross-layer coupling.
- Investing in containerization early helps avoid “it works on my machine” problems when switching devices or sharing the project.

## Links

- Code: [GitHub – IsaiahJMurray/BRAGI-master](https://github.com/IsaiahJMurray/BRAGI-master)
- Demo: _TBD_ (to be added when a stable interactive build or video is available)