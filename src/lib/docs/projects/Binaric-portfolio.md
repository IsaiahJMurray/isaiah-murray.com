# Binaric

## Overview

Binaric is an experimental audio-based data transmission protocol that treats sound itself as the transport layer. Instead of sending bytes over a socket, I encode structured “requests” (file metadata + payload + footer) into multi-tone audio, write them into WAV files, and then decode those recordings back into the original data.

Conceptually, it sits somewhere between a dial‑up modem, a simple application-layer protocol, and a signal-processing playground. Each logical part of the message—header, content, footer, and protocol “mode”—has its own frequency bands. A separate clock tone uses a Manchester-style scheme to keep sender and receiver synchronized, even over noisy acoustic channels.

The project is heavily inspired by the fictional “Binaric” of the Adeptus Mechanicus in Warhammer 40k and, more concretely, by the harsh, modem-like sounds from Space Marine 2. I wanted to build a real, working version of that idea: a protocol that sounds like it belongs in a gothic sci‑fi universe, but is grounded in real-world DSP and communication theory.

## My Role

I built this project end to end:

- Designed the protocol format (headers, payload, footers, and mode negotiation concept).
- Implemented the base‑N encodings and `BinaricRequest` structures.
- Wrote the audio synthesis and analysis tools using NumPy and standard Python libraries.
- Implemented both v1 and v2 architectures, refactoring from a monolithic experiment into a more modular system.
- Created visualization tools (spectrograms with protocol overlays) to debug and tune the system.

Every line of code and every conceptual layer—from JSON configs to waveform generation and decoding—was implemented by me.

## Tech Stack

- **Language:** Python
- **Signal Processing & Numerics:** NumPy, SciPy-style operations
- **Visualization:** Matplotlib (for spectrograms and protocol overlays)
- **Audio I/O:** Standard WAV read/write utilities (16‑bit PCM)
- **Configuration:** JSON (frequency frameworks, operating modes, test requests)

## Architecture & Key Features

Binaric is structured in layers, similar to a networking stack but tailored to audio.

### 1. Data & Encoding Layer: The Binaric Request

At the top is the **BinaricRequest** abstraction (v1’s `binaric_data.py`):

- A request contains:
  - **Header**: file metadata (name, size, type, base, etc.)
  - **Content**: raw file bytes (often base64-encoded for JSON friendliness)
  - **Footer**: optional metadata or checksums.
- I convert this structured object into a compact **base‑N representation** with configurable bit depths for header, content, and footer.
- This gives me a clean separation between:
  - *What* I want to send (file + metadata).
  - *How* it is mapped into bits and symbols (base‑N digits, bit groups).

This layer makes it easy to plug in different modulation schemes or frequency layouts without changing how requests are represented.

### 2. Modulation Layer: Mapping Bits to Frequency Bands

Next is the modulation logic, where bits become tones.

- **Frequency frameworks** are defined in JSON:
  - `freq_bands_stable.json`, `freq_bands_lite.json`, `freq_bands_max.json` in v1.
  - `binaric2/config/freq_config.json` in v2 (more structured).
- These configs define:
  - Discrete **frequency sets** for:
    - Clock
    - Mode selection
    - Header bits
    - Content bits
    - Footer bits
  - Different **modes** (e.g., `stable`, `standard`, `dense`) that trade:
    - **Robustness** (fewer, more isolated frequencies, easier to decode).
    - **Bandwidth** (more frequencies and shorter symbols, higher throughput).

In v1, scripts like `binaric_to_audio.py` and `binaric_test.py` take a `BinaricRequest`, convert it into bit sequences, and:

- Group bits into symbols mapped to specific frequencies.
- Generate multi-tone waves for each segment (header/content/footer).
- Add mode-selection tones to signal which framework is in use.

In v2, `binaric2/scripts/transmit.py` generalizes this idea:

- Converts strings or integer arrays into bit streams.
- Maps bits onto configured basis frequencies.
- Produces normalized mono PCM that can be saved via an `AudioBuffer`.

### 3. Timing & Clocking: Manchester-Style Synchronization

Reliable decoding over an acoustic channel requires solid timing.

I use a **Manchester-like encoding** on a dedicated clock band:

- A **clock frequency band** carries alternating patterns that encode clock edges.
- The encoder (`binaric_to_audio.py`, `binaric_test.py`, and v2’s `transmit.py`) generates:
  - A clean clock tone overlay aligned with symbol boundaries.
- The decoder (`audio_to_binaric.py`, `decode_binaric.py`) uses:
  - Spectrogram analysis to detect where the clock power rises and falls.
  - Those transitions to sample data frequencies at consistent points in time.

This clocking strategy is crucial in the presence of:

- **Room acoustics** (reverb, echoes).
- **Playback/recording delays**.
- **Non‑ideal speakers and microphones**.

### 4. Audio Engine & Buffers

In v2, I refactored audio handling into reusable components:

- `AudioHelper.py`:
  - Generates sine, square, and noise waveforms.
  - Performs mixing, concatenation, normalization, fades, and trimming.
  - Loads and saves 16‑bit PCM WAV files.
- `AudioBuffer.py`:
  - Manages in-memory sample buffers for streaming and offline processing.
  - Can append chunks, retrieve windows, and flush to disk.
  - Encapsulates sample rate and channel metadata.

This separation makes it easier to:

- Swap in different carriers (e.g., square waves for a “harsher” aesthetic).
- Experiment with pre‑/post‑processing like filtering or gain control.
- Move toward real-time streaming rather than only file-based workflows.

### 5. Analysis & Visualization

For debugging and tuning, I rely heavily on spectrograms:

- v1’s `core/spectogram.py` and v2’s `scripts/spectogram.py`:
  - Compute high-resolution time–frequency views of recordings.
  - Overlay:
    - Clock frequencies.
    - Header/content/footer bands.
    - Mode bands and clock-cycle gridlines.
  - Constrain the view to the relevant band ranges from the JSON config.

This lets me visually inspect:

- Whether each symbol is clearly separated.
- How room acoustics smudge or distort tones.
- Where the clock edges fall relative to data.

## Challenges & Solutions

### 1. Clock Edge Detection Misalignment

**Challenge:**  
Clock transitions weren’t aligning with the data sampling points. In noisy or reverberant recordings, the **clock rises were offset** and not being detected reliably.

**What I did:**

- Used spectrogram-based power tracking around the clock frequency:
  - Averaged power across bins near the configured clock band.
  - Applied thresholds and smoothing to find consistent transitions.
- Tuned:
  - Window sizes and hop lengths based on the clock frequency (config-driven).
  - Detection thresholds to be robust without being overly sensitive to noise.
- Visualized clock-state overlays directly on the spectrogram to iteratively refine detection.

**Result:**  
Decoding became significantly more stable, especially in less-than-ideal recording environments.

### 2. Robustness vs Bandwidth

**Challenge:**  
There’s a built-in trade-off between how dense the frequency packing is and how robust decoding is in real rooms.

- **Dense modes**:
  - More frequencies, closer together.
  - Higher throughput but more susceptible to interference and spectral leakage.
- **Stable modes**:
  - Fewer, more widely spaced frequencies.
  - Lower throughput but easier to decode.

**What I did:**

- Encoded operating modes directly in the frequency frameworks (`freq_bands_*` and `freq_config.json`).
- Allowed the **same code** to operate under:
  - Low‑bandwidth but robust modes.
  - Higher-bandwidth, more experimental modes.
- Used the spectrogram tools to empirically test how each mode behaved under:
  - Different speakers/headphones.
  - Different recording setups and room acoustics.

### 3. Architectural Refactor (v1 → v2)

**Challenge:**  
v1 grew organically as an experiment: test encoders/decoders, ad hoc audio handling, and large scripts.

**What I did:**

- Introduced:
  - `AudioHelper` and `AudioBuffer` as core utilities.
  - A cleaner config-driven design (`binaric2/config/freq_config.json`).
- Split responsibilities more cleanly:
  - **Core classes** for low-level audio and buffering.
  - **Scripts** for user-facing tasks (transmit, spectrogram, etc.).

**Result:**  
The project is now easier to extend—for example, adding error-correction schemes or different modulation strategies without rewriting core audio logic.

## Results & Impact

Binaric achieves its primary goal:

- I can take a structured description of a file (header + payload + footer),  
- Encode it into audio using a chosen operating mode,  
- Save the audio as a WAV file, play or transmit it,  
- And then decode that recording back into the original structured request.

Along the way, I:

- Built a practical understanding of:
  - Frequency planning.
  - Symbol timing and clock recovery.
  - Trade-offs between robustness