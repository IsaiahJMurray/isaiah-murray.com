---
title: Virtue
subtitle: A modular Python framework for building an always-on, multimodal personal
  assistant that can see, hear, speak, and control devices. It integrates OpenAI Assistants
  with Google STT, ElevenLabs TTS, LIFX smart lighting, webcam eye-contact triggers,
  and real-time Pygame visualizations into a single event-driven system.
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

VIRTUE is an experimental framework for building a multimodal personal assistant that feels more like a “character” than a utility. It combines large language models, speech recognition, high‑quality text‑to‑speech, a device integration layer, and real‑time visualizations into a single loop: listen → understand → act → speak → visualize.

The project currently focuses on:
- A pluggable “core” system for different assistants/voices.
- A LINKER layer for connecting the core to external devices and APIs.
- A desktop‑style assistant with audio I/O, visual feedback, and optional eye‑contact triggering via webcam.

## Role & Context

I designed and built VIRTUE end‑to‑end as a personal project to explore:
- How far I could push the OpenAI Assistants API with real tool calling.
- How to wrap LLMs in a repeatable “assistant core” that can swap systems and personalities.
- How to make a local assistant feel alive with audio‑reactive visualizations and presence cues.

I was responsible for:
- Overall architecture and system design.
- Implementing the LINKER device/API integration layer.
- Implementing the OpenAI core wrapper and tool‑calling flow.
- Building the audio pipeline (PyAudio + Google STT + ElevenLabs/Google TTS).
- Creating the visualization system with pygame.
- Prototyping various triggers (keyboard, wake word, and webcam eye‑contact).

## Tech Stack

- Python
- OpenAI Assistants API
- Google Cloud Speech‑to‑Text
- Google Cloud Text‑to‑Speech (fallback)
- ElevenLabs TTS
- PyAudio
- pygame
- OpenCV (eye‑contact / face detection)
- Google Custom Search API
- LIFX HTTP API
- dotenv for configuration

## Problem

Most consumer “assistants” are either:

- Thin wrappers around APIs (no real reasoning, limited tools), or  
- Chatbots with no real-world integration, voice, or presence.

I wanted a framework that:

1. Treats an LLM assistant as a long‑lived “core” with memory, tools, and a personality.
2. Can call into real devices and services (e.g., LIFX lights, Google Search) using tool calling.
3. Feels embodied: it should have a voice, respond to audio, and react visually as it listens/thinks/speaks.
4. Is hackable: easy to swap cores, voices, visualizations, and integration targets.

## Approach / Architecture

I structured VIRTUE into three primary layers:

1. **Core Layer (LLM “brain”)**  
   - `CoreSystem` + `OpenAICore` manage the connection to the OpenAI Assistants API.  
   - Each “core” (e.g., `glados`, `AM`) is defined by a configuration in `openai_assistant_dict.py` (assistant ID, voice, settings).  
   - The core uses OpenAI’s tool‑calling to execute external functions for search and device control.

2. **LINKER Layer (integration fabric)**  
   - Provides concrete implementations of tools the assistant can call:
     - `LIFXController` for home lighting control via LIFX’s REST API.
     - `InfoLookup` and `search_template` for Google Custom Search.
     - A `tools` schema (`functions.py`) wired into the OpenAI assistant definition.
   - Conceptually, any device/API can join this network and be exposed as a tool.

3. **Frontend / Experience Layer**  
   - `PersonalAssistant` orchestrates:
     - Audio input via PyAudio.
     - Speech‑to‑text with Google Cloud Speech.
     - Text‑to‑speech via ElevenLabs (primary) or Google TTS.
     - Real‑time visual feedback with a pygame‑based `Visualizer`.
   - `main.py` wires it together and optionally uses OpenCV to trigger listening when the webcam detects a face (eye‑contact trigger).
   - Visual states (`idle`, `listening`, `thinking`, `speaking`) are rendered with custom visualizations in `visualizations/default_visualizations.py` and related modules.

The runtime loop is:

1. Trigger (spacebar or eye contact) →  
2. Record + transcribe audio →  
3. Send text to `CoreSystem.generate_response` →  
4. Core may call tools (LIFX / search) and returns a response →  
5. TTS speaks the response →  
6. Visualizer reflects state and audio intensity throughout.

## Key Features

- Voice‑driven personal assistant with continuous listen–think–speak loop.
- Swappable assistant “cores” with different OpenAI assistants and voices.
- Tool‑calling integration with:
  - LIFX smart lights (on/off, color, brightness, effects).
  - Google Custom Search for richer information retrieval.
- High‑quality TTS using ElevenLabs, with support for core‑specific voices.
- Audio‑reactive, stateful visualizations using pygame.
- Optional webcam‑based “eye contact” trigger using OpenCV.
- Debug scripts to exercise the core, TTS, and STT components independently.

## Technical Details

### Core System & OpenAI Integration

The core entry point is `CoreSystem`:

```python
class CoreSystem():
    def __init__(self, properties=CoreProperties(), debug=True):
        self.properties = properties
        self.system = properties.system  # e.g. "openai"
        self.core = properties.core      # e.g. "glados"
        ...
        if self.system == "openai":
            self.openai_key = os.getenv("OPENAI_KEY")
            from LINKER.core.systems.openai.openai_core import OpenAICore
            self.core = OpenAICore(core=self.core, key=self.openai_key, debug=self.debug)
```

`OpenAICore`:

- Wraps the OpenAI Python SDK.
- On init, updates the remote assistant (`beta.assistants.update`) with the current `tools` schema from `functions.py`.
- Creates a long‑lived `thread` to maintain context.
- Provides a synchronous `prompt()` method that internally uses `asyncio` to:
  - Post messages to the thread.
  - Run `create_and_poll`.
  - Handle `requires_action` runs by executing tools locally and submitting tool outputs, then poll until completion.
- Dispatches tool calls by name:
  - `"search"` → `search_template(...)` (Google Custom Search).
  - `"set_light"` → operations via `LIFXController`.

This gives the assistant the ability to decide when to search or control lights, rather than hard‑coding those calls client‑side.

### LINKER Functions & Device Control

`LINKER/core/functions/functions.py` declares the tool schema:

- `get_light_selectors()` queries LIFX at startup to build a dynamic list of selectors (`all`, labels, IDs), which is injected into the tool’s `enum`.
- `tools` is a list of function descriptors matching the OpenAI tools format:

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "set_light",
            "description": "Set the state of LIFX lights...",
            "parameters": { ... }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search",
            "description": "Search information using Google",
            "parameters": { ... }
        }
    }
]
```

`LIFXController` encapsulates REST calls:

- `list_lights()` returns metadata about all bulbs.
- `set_light(...)` can:
  - PUT `/state` for power, color, brightness, duration.
  - POST `/effects/breathe` for breathing effects.

### Audio Pipeline

Inside `PersonalAssistant`:

- PyAudio is configured for mono, 16 kHz input, with small chunks for responsiveness.
- A silence‑based VAD is implemented with:
  - `silence_threshold` and `silence_limit` derived from the audio rate and chunk size.
- `listen()` (truncated in the snippet but conceptually):
  - Reads from the input stream in an async loop.
  - Accumulates frames while sound is above the threshold.
  - Stops when sustained silence is detected.
  - Writes audio to a temp file under `LINKER/core/temp_files`.
  - Calls `SpeechToText.recognize_speech(...)` to get the transcript.

`SpeechToText`:

- Uses `google.cloud.speech.SpeechClient`.
- Reads raw audio, constructs `RecognitionAudio` and `RecognitionConfig`, and synchronously returns the best transcript.

### Text‑to‑Speech

The runtime TTS path (`LINKER/voice/TTS/tts.py`):

- Uses ElevenLabs as the primary TTS backend:
  - Voice, model, and `VoiceSettings` are looked up from `assistants[self.core.core]`.
  - Streams audio chunks to disk as an MP3 in the responses directory.
- Optionally, Google Cloud TTS is available through `google_speech()` as a fallback.
- Output files are then played via pygame (`play_file.py`) or through the assistant’s audio player.

### Visualizer & State Machine

`Visualizer`:

- Manages a small pygame window (240x240).
- Maintains:
  - `state`: `"idle"`, `"listening"`, `"thinking"`, `"speaking"`.
  - `dynamic_scalars`: primarily used for audio intensity.
  - A Perlin‑noise‑based `update_dynamic_scalar()` for idle “breathing”.

`visualizations/default_visualizations.py` defines visual functions:

- `idle_visualization(...)`: concentric circles + orbiting elements, with breathing motion based on time.
- `listening_visualization(...)`: concentric circles and wave patterns whose amplitude depends on `dynamic_scalar` (audio level).
- `thinking_visualization(...)` and `speaking_visualization(...)`: more complex animations that convey processing or speech activity.

The `PersonalAssistant` keeps the visualizer in sync:

```python
def update_visualization(self):
    self.visualizer.state = self.state
    self.visualizer.dynamic_scalars[0] = self.audio_level
    self.visualizer.run()
```

### Eye‑Contact Trigger

`main.py` includes an optional OpenCV‑based trigger:

- `detect_eye_contact()`:
  - Opens the webcam, runs a Haar‑cascade frontal face detector.
  - Returns `True` when any face is detected.
- `run_eye_contact_detection(assistant)`:
  - Async task that periodically (every second) calls `detect_eye_contact()`.
  - When a face is detected, calls `assistant.trigger_listen()`.

This allows running the assistant in a passive mode where it wakes up when someone sits in front of the camera, instead of relying solely on the spacebar trigger.

## Results

- Built a working end‑to‑end assistant framework that:
  - Listens via microphone, transcribes speech, and responds via TTS.
  - Calls real tools (Google Search, LIFX) via OpenAI tool‑calling.
  - Provides clear visual feedback on what state the assistant is in.
- Validated that OpenAI Assistants + local tool runners can cleanly orchestrate multi‑step interactions (e.g., “set the lights to a blue pulsing effect”).
- Created a reusable structure (CoreSystem + LINKER + frontends) that I can adapt for other modalities or devices.

## Lessons Learned

- **Tool‑calling ergonomics**: It’s critical to keep tool schemas stable and explicit; generating selectors dynamically (from LIFX) is powerful but also means the assistant’s capabilities depend on runtime environment.
- **Audio UX is unforgiving**: Small details like chunk sizes, latency, and silence detection thresholds dramatically affect how “snappy” the assistant feels.
- **Threaded assistants help**: Using OpenAI threads for persistent context simplifies multi‑turn interactions and reduces the amount of context I need to send from the client.
- **Visual feedback matters**: Even simple visual states (idle/listening/thinking/speaking) make the system feel more trustworthy and interactive.
- **Separation of concerns pays off**: Having a clear split between the core (LLM + tools), LINKER (integrations), and frontend (audio + visuals) made it much easier to iterate on each without breaking everything.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/VIRTUE)
- [Live Demo (coming soon)](#)