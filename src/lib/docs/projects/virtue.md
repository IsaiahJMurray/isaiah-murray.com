---
title: Virtue
subtitle: "A Python framework for building multimodal personal assistants that can\
  \ see, listen, and speak, aimed at hobbyist AI tinkerers and home-automation enthusiasts.\
  \ It combines an OpenAI-based \u201Ccore\u201D with a LINKER integration layer for\
  \ tools like Google Search and LIFX lighting, plus real-time audio I/O, eye-contact\
  \ triggers via OpenCV, and custom Pygame visualizations driven by live audio levels."
slug: virtue
date: '2024-06-23'
updated: '2024-07-21'
tags:
- python
- simulation
maturity: prototype
featured: false
visibility: public
heroImage: /generated/logos/virtue.png
---
## Overview

VIRTUE is a framework for building a multimodal personal assistant that can see, listen, think, speak, and act on the physical environment. It connects an LLM “core” to a pluggable integration layer (LINKER) for devices, web APIs, and real-time voice and visual feedback. The codebase explores end‑to‑end assistant behavior: from wake/trigger, through speech and vision input, to LLM tool-calling and device control, and back to expressive audio/visual output.

## Role & Context

I designed and implemented VIRTUE as a personal project to experiment with:

- Treating an LLM assistant as a long‑lived system (threads, tools, external state) rather than a single chat completion.
- Building a modular integration layer (LINKER) that decouples the LLM core from concrete device and API implementations.
- Exploring “embodiment” for assistants via real‑time audio capture and custom Pygame visualizations.

I handled architecture, implementation, and integration with third‑party APIs and SDKs.

## Tech Stack

- Python
- OpenAI Assistants API
- Google Cloud Speech‑to‑Text
- Google Cloud Text‑to‑Speech (legacy; now primarily ElevenLabs)
- ElevenLabs TTS
- Google Custom Search JSON API
- LIFX HTTP API (smart lighting)
- PyAudio
- NumPy
- OpenCV (webcam / eye‑contact trigger)
- Pygame (visualizations and event loop)
- dotenv / environment‑based configuration

## Problem

Most personal assistant demos are either:

- Simple, one‑shot LLM wrappers with no real world integrations, or
- Monolithic, hard‑to‑extend codebases tightly coupling wake‑word logic, speech, device control, and model logic.

I wanted a framework where:

- The **core reasoning engine** (LLM) is cleanly separated from:
  - **Input modalities** (speech, webcam, keyboard),
  - **Output modalities** (voice, visualizations),
  - **Tools** (web search, smart lights, etc.).
- The assistant can:
  - Maintain **long‑lived context** over a session.
  - Use **structured tools** (function calling) to act on APIs and IoT devices.
  - Expose different “cores” (e.g., different OpenAI assistants and voices) behind the same interface.

## Approach / Architecture

I split the system into several layers:

1. **Core Abstraction (CoreSystem + OpenAICore)**  
   - `CoreSystem` encapsulates which “system” is in use (currently OpenAI) and which logical core/assistant is active.
   - `OpenAICore` wraps the OpenAI Assistants API:
     - Initializes an assistant per configured “core” (e.g., GLaDOS‑style or other personas) using `openai_assistant_dict`.
     - Updates the assistant with a set of tools defined in `LINKER/core/functions/functions.py`.
     - Manages a persistent `thread` for conversation continuity.
     - Implements `prompt()` which sends user messages, polls runs, and handles `requires_action` for tool calls.

2. **Integration Layer (LINKER)**  
   - **Functions / Tools**  
     - `functions.py` builds an OpenAI tools schema for:
       - `set_light` (smart light control via LIFX HTTP API).
       - `search` (web search via Google Custom Search).
     - Tool parameters are dynamically enriched (e.g., `light_selectors` built from live LIFX API results).
   - **Device APIs**
     - `controller_lifx.py` wraps the LIFX REST API for listing and controlling lights.
     - `request_google_search.py` wraps Google Custom Search and exposes `search_template()` for summarized results.

3. **Voice Layer (STT/TTS)**
   - `SpeechToText` wraps Google Cloud Speech‑to‑Text:
     - Takes recorded audio (16kHz LINEAR16) and returns transcripts.
   - `TextToSpeech` wraps ElevenLabs (primary) and Google TTS (fallback):
     - Selects ElevenLabs voice settings based on the active core (e.g., different personas).
     - Streams TTS output and writes MP3 files to a temp directory.
   - `play_file.py` provides simple MP3 playback via Pygame.

4. **Frontend / Orchestration**
   - `PersonalAssistant` orchestrates:
     - Live microphone capture via PyAudio with basic silence detection.
     - State machine: `idle → listening → thinking → speaking`.
     - Calling `CoreSystem.generate_response()` and feeding the output to `TextToSpeech` + audio playback.
     - Driving the `Visualizer` with real‑time audio levels and state.
   - `main.py` wires everything up, supporting:
     - Keyboard trigger (`spacebar`).
     - Optional webcam‑based “eye‑contact” trigger via OpenCV (`--trigger eye_contact`).

5. **Visual Layer**
   - `Visualizer` (Pygame) renders animated states:
     - Uses Perlin noise and time‑based animation to create smooth, organic motion.
     - Delegates to `default_visualizations` to draw different scenes for idle/listening/thinking/speaking.
   - Additional patterns (`concentric_visualizations.py`) explore more complex, eye‑like visuals.

Deprecated directories keep older experimental pipelines (wake‑word detection, alternate TTS engines, legacy VIRTUE class) for reference.

## Key Features

- Modular **LLM core system** with swappable “cores” (personas, assistants, voices) via a single `CoreSystem` interface.
- **Tool‑calling integration** with OpenAI Assistants API, enabling:
  - Smart light control through LIFX.
  - Web search via Google Custom Search.
- End‑to‑end **voice pipeline**:
  - Live microphone input → Google STT → OpenAI Assistant → ElevenLabs TTS → Pygame playback.
- **Real‑time visualizations** driven by assistant state and audio levels, implemented in Pygame.
- Optional **webcam eye‑contact trigger** for hands‑free activation of the assistant.
- Environment‑driven configuration for API keys and secret management via `.env`.
- Debug utilities for exercising subsystems independently (core‑only, STT‑only, TTS‑only, full pipeline).

## Technical Details

### Core System and Assistants

- `CoreProperties` encapsulates the active system (`"openai"`) and core name (e.g., `"glados"`).
- `CoreSystem`:
  - Reads API keys from environment (`OPENAI_KEY`).
  - Lazily initializes an `OpenAICore` when the system is `"openai"`.
  - Exposes `generate_response(prompt)` which:
    - Delegates to the active `OpenAICore`.
    - Logs responses when `debug=True`.

- `OpenAICore`:
  - Uses `assistants` mapping (`openai_assistant_dict.py`) to select:
    - Assistant ID.
    - ElevenLabs voice ID and settings associated with that assistant.
  - On init:
    - Calls `client.beta.assistants.update()` to attach the `tools` schema.
    - Creates a persistent thread (`thread_init()`).
  - `prompt()`:
    - Uses `asyncio.run()` to call `submit_message()`.
    - `submit_message()`:
      - Appends a user message to the thread.
      - Creates and polls a run (`create_and_poll`).
      - Handles `run.status == 'requires_action'`:
        - Iterates `run.required_action.submit_tool_outputs.tool_calls`.
        - Parses arguments using `eval` (not ideal; I’d move to `json.loads` in a future revision).
        - Dispatches to:
          - `search_template()` for Google search.
          - `LIFXController.set_light()` for light control.
        - Collects tool outputs and submits them back to OpenAI as required.
      - Returns the assistant’s final text response.

### Tools and Integrations

- `functions.py`:
  - Builds an OpenAI tools array with two function tools:
    - `set_light`:
      - Parameters: `selector`, `power`, `color`, `brightness`, `duration`, `effect`, `period`, `cycles`, `peak`.
      - `selector` enum is computed at runtime by querying all LIFX lights:
        - Adds `all`, `label:<label>`, and `id:<id>` for convenience.
    - `search`:
      - Parameter: `query` (string).
- `controller_lifx.py`:
  - Uses `LIFX_TOKEN` from `.env`.
  - `list_lights()` → `GET /v1/lights/all`.
  - `set_light()`:
    - If power/color/brightness/duration is provided:
      - `PUT /state`.
    - If `effect` is provided:
      - `POST /effects/breathe`.
- `request_google_search.py`:
  - Reads `SEARCH_KEY` and `CX_KEY` from environment.
  - `search(query)`:
    - Performs a GET to Google Custom Search and returns raw JSON.
  - `search_template(query)`:
    - Wraps the above with:
      - Error handling.
      - Extraction of the top 3 results (title, snippet, link) into a formatted string for the assistant.

### Voice I/O

- `SpeechToText`:
  - Uses Google Cloud Speech (`google.cloud.speech`).
  - `recognize_speech(audio_file, raw_path=False)`:
    - Reads from `audio_path` by default or a raw path.
    - Configures recognition for 16kHz LINEAR16, `en-US`.
    - Returns the top alternative transcript.
- `TextToSpeech`:
  - Initializes a Google TTS client (legacy path) and an ElevenLabs client via the `ELEVENLABS` API key.
  - `synthesize_speech(text, output_file="output.mp3", raw_path=False)`:
    - Resolves a file path in the responses directory.
    - Delegates to `elevenlabs_speech()`.
  - `elevenlabs_speech(text, save_file_path)`:
    - Uses `assistants[self.core.core]` to look up:
      - `voice`, `voice_model`, and `voice_settings`.
    - Streams MP3 output to disk.
- `play_file.py`:
  - Simple Pygame mixer playback loop that blocks until playback is finished.

### Personal Assistant Orchestration

- `PersonalAssistant`:
  - Initializes:
    - PyAudio input stream (16kHz mono, small chunks).
    - Silence thresholds and counters for basic VAD‑style behavior.
    - `CoreSystem`, `TextToSpeech`, and `SpeechToText`.
    - Response directory for saving generated audio files.
    - A `Visualizer` instance.
    - Pygame mixer for playback.
  - `run()` (async loop):
    - Processes Pygame events (quit, spacebar to trigger listening).
    - Updates audio levels (`update_audio_level()`; truncated in the snippet but reads from PyAudio).
    - Updates visualization state and frame.
  - `trigger_listen()`:
    - Guarded by state (`idle` → `listen()`).
  - `listen()` (async):
    - Switches state to `listening`.
    - Reads raw audio from the PyAudio stream into `audio_data` until silence or stop condition.
    - (Not fully shown in snippet, but structured to then hand off recorded audio to STT.)
  - End‑to‑end behavior:
    - Capture → STT transcript → `CoreSystem.generate_response()` → TTS → `play_mp3()` → back to `idle`.

### Visualizations

- `Visualizer`:
  - Manages a simple state machine (`idle`, `listening`, `thinking`, `speaking`).
  - Uses Perlin noise (`pnoise1`) to create smoothly varying `dynamic_scalars` that modulate animations.
  - On `run()`:
    - Processes Pygame events (including a key to cycle states in debug).
    - Clears the screen and delegates to:
      - `idle_visualization`
      - `listening_visualization`
      - `thinking_visualization`
      - `speaking_visualization`
    - Updates the display at 60 FPS.
- `default_visualizations.py`:
  - Implements:
    - Idle: breathing circles and orbiting squares with time‑based color interpolation.
    - Listening: concentric circles and waveform‑like patterns responding to `dynamic_scalar` (audio level).
    - Thinking/Speaking: additional dynamic patterns (truncated in snippet but follow a similar approach).
- `concentric_visualizations.py`:
  - Implements “eye”‑like visuals with layered circles and animated elements for each state.

### Triggers and Eye Contact

- `main.py`:
  - `detect_eye_contact()`:
    - Uses OpenCV’s `haarcascade_frontalface_default.xml` to detect faces from webcam frames.
    - Returns `True` when any face is detected.
  - `run_eye_contact_detection(assistant)`:
    - Periodically checks for `detect_eye_contact()` while the assistant is running.
    - Calls `assistant.trigger_listen()` when a face is detected.
  - CLI:
    - `--trigger spacebar` (default) or `--trigger eye_contact`.

## Results

- Built a working prototype of a **multimodal assistant** that:
  - Listens via microphone and optionally triggers on webcam face detection.
  - Maintains conversational context through OpenAI threads.
  - Uses OpenAI tools to control real hardware (LIFX lights) and fetch web information.
  - Responds with synthesized speech using persona‑specific voices, paired with live visualizations.
- Established a **clean separation of concerns** between:
  - Core reasoning (OpenAICore / CoreSystem).
  - Tools (LIFX, Google Search).
  - Voice I/O.
  - UI / visualization.
- Created a foundation that I can extend with additional tools (e.g., calendar, local file system) and modalities (e.g., gesture, additional sensors).

## Lessons Learned

- **Assistant tools need careful schema design.** Including real selectors (e.g., `label:` and `id:` for lights) in tool enums dramatically reduces LLM confusion and mis‑calls.
- **Threaded assistants behave very differently from stateless chat completions.** Persisting state at the API level simplifies a lot of logic but also requires mindful thread lifecycle management.
- **Audio and visualization loops must be coordinated.** Having Pygame drive both visualization and event handling, while PyAudio runs concurrently, pushed me to use asyncio and non‑blocking calls carefully.
- **API key management is critical in local experiments.** Centralizing all credentials in `.env` and loading with `dotenv` made it easy to swap between environments and providers.
- **Eval is dangerous.** For parsing tool arguments, I used `eval` initially; in a production‑ready version I would switch to strict `json.loads` and robust schema validation.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/VIRTUE)
- Demo: _TBD (placeholder for video / live demo link)_