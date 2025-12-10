---
title: Binaric
subtitle: "Audio-based data transmission protocol that turns files and messages into\
  \ structured tone sequences, inspired by dial\u2011up but built for modern devices.\
  \ Aimed at developers and researchers exploring acoustic modems, offline communication,\
  \ or playful data-over-sound channels. Technically, it features layered modulation,\
  \ Manchester-clocked multi-tone encoding, adaptive error correction, and spectrogram-driven\
  \ decoding tools in Python."
slug: binaric
date: '2025-02-24'
updated: '2025-03-06'
tags:
- python
- simulation
- ml
maturity: polished
featured: false
visibility: public
heroImage: /generated/logos/binaric.png
---
## Overview

Binaric (Binary INterfaced Audio Relay for Intelligent Communication) is an experimental audio modem and protocol stack that encodes digital data as audible tones. Inspired by dial‑up modems, I use modern signal processing techniques, layered protocol design, and adaptive configuration to transmit files and structured messages over ordinary audio channels (e.g., speakers/microphones, recorded WAV files).

The project explores how far I can push data integrity, framing, and negotiation in a noisy, low‑bandwidth environment, while also making the handshake and transfer audibly distinctive and “musical”.

## Role & Context

I designed and implemented Binaric end‑to‑end:

- Defined the protocol, frame formats, and layered architecture.
- Built the encoding/decoding pipeline from data to tones and back.
- Implemented helper utilities for configuration, logging, analysis, and visualization.
- Iterated through two major versions (`binaric v1` and `binaric2`) to refine the modulation model and tooling.

This is a personal R&D project focused on systems thinking, DSP, and protocol design, not a production modem. It’s structured so I can extend it toward ML‑assisted decoding and adaptive channel estimation later.

## Tech Stack

- Python
- NumPy
- SciPy
- librosa
- Matplotlib
- Wave / standard library audio I/O
- JSON for configuration and message formats

## Problem

Transmitting structured data over audio is straightforward in principle—map bits to tones—but difficult in practice:

- Audio channels are noisy, bandwidth‑limited, and highly variable across devices and environments.
- Naive tone‑per‑bit schemes are fragile and don’t scale: they’re slow, easy to mis‑detect, and hard to evolve.
- I wanted a protocol that:
  - Negotiates capabilities (modulation density, modes, error‑correction profile).
  - Structures transfers (headers, payload, footers) so files and metadata can be reconstructed.
  - Provides enough tooling to debug what’s happening in the frequency and time domains.

Binaric is my attempt to build such a system from scratch and understand the trade‑offs.

## Approach / Architecture

I organized Binaric into a layered architecture, closely mirroring a network stack:

- **Physical Layer**
  - Converts bitstreams into audio tones and back.
  - Uses frequency sets for clock, header, content, and footer bands.
  - Supports multi‑tone symbols where each symbol encodes multiple bits by toggling specific frequencies.

- **Data Link Layer**
  - Frames data, manages packetization, and annotates packets with checksums/CRCs.
  - Provides basic ARQ‑style semantics (detect errors and retry or discard).

- **Session Layer**
  - Handles preamble generation and handshake routines.
  - Negotiates modulation mode (e.g., “stable” vs “dense”), symbol timing, and error‑correction level.
  - Manages session headers, collision prevention, and heartbeats.

- **Optional Transport Layer**
  - Segments and reassembles larger files.
  - Provides a place for future encryption / higher‑level semantics.

I versioned the implementation in two trees:

- **`binaric v1`**: First full pipeline with Manchester‑encoded clock, multi‑band modulation, and more exploratory decoding scripts.
- **`binaric2`**: A cleaner, more modular core, with reusable audio primitives (`AudioBuffer`, `AudioHelper`), frequency configuration via JSON, and scripts focused on content generation and visualization.

Configuration (frequency bands, modes, timing) is externalized as JSON so I can quickly tune and compare different modulation schemes without rewriting core logic.

## Key Features

- Layered, modular protocol for audio‑based data transmission.
- Manchester‑encoded clock channel for robust symbol timing.
- Multi‑tone symbol encoding using configurable frequency bands and density modes.
- File‑oriented framing: JSON headers, content, and footer with metadata and size information.
- Pluggable error‑detection and correction utilities (CRC, ARQ pattern).
- Rich spectrogram visualization tools with overlays for clock and data bands.
- Reusable audio utilities (`AudioBuffer`, `AudioHelper`) for generating, buffering, and saving WAV data.

## Technical Details

### Frequency Configuration & Modes

I define frequency plans in JSON, with separate bands for:

- `clock`: typically a low pair of tones (e.g., `[250, 450] Hz`) used for Manchester‑encoded timing.
- `modes`: tones indicating which modulation/profile is in use.
- `header`, `content`, `footer`: distinct frequency sets to visually and algorithmically separate protocol phases.

Multiple presets (`freq_bands_lite`, `freq_bands_stable`, `freq_bands_max` and `binaric2/config/freq_config.json`) let me trade off density vs robustness. In `binaric2`, I group these under modes like `stable`, `standard`, and `dense`, each defining:

- A small “fingerprint” frequency set to identify the mode.
- A `content` frequency set governing how many bits per symbol I can pack.

### Encoding Pipeline

In v1, the `binaric_to_audio.py` and related scripts follow a consistent pattern:

1. **Data → Bits**
   - Strings or bytes are converted to a bitstring (`string_to_bits`, `bytes_to_bits`).
   - For higher‑radix experiments, I also convert bytes to arbitrary bases (`int_to_base`) and then map “digits” to tones.

2. **Clock Channel**
   - A Manchester encoder (`manchester_encode`) maps each logical clock bit into a 2‑bit pattern (“0”→“10”, “1”→“01”).
   - `generate_manchester_clock_wave` then builds a waveform by assigning one of two frequencies per Manchester sub‑bit, ensuring a clear alternating structure for timing recovery.

3. **Symbol Generation**
   - Given a group of bits and a list of content frequencies, `generate_symbol_wave` creates a symbol:
     - Each position in the symbol corresponds to a specific frequency.
     - If the bit is `1`, that frequency is added as a sine wave; if `0`, it’s omitted.
   - `encode_segment_from_bits` splits the bitstring into groups of length `len(freqs)` and concatenates the generated symbols.

4. **Framing**
   - Headers and footers are encoded using distinct frequency bands to visually separate them in the spectrogram.
   - For file transfers, I serialize a `BinaricHeader` object to JSON, encode it to bytes, then to digits in a chosen base; the same process is mirrored at decode time.

5. **WAV Output**
   - Segments (clock + header + content + footer) are combined and written as 16‑bit PCM WAV files.

In `binaric2/scripts/transmit.py`, I simplified content generation:

- `string_to_bitset` converts text into an array of bit chunks.
- For each chunk, `build_content_sequence_from_bits`:
  - Generates one segment of duration `1 / clock_frequency`.
  - Pre‑generates tone segments for each frequency.
  - Sums active tones where the bit is `1`, normalizing by active count to avoid clipping.
  - Returns a float32 waveform in `[-1, 1]` for further processing and saving.

### Decoding Pipeline

Decoding focuses on robust timing and frequency extraction:

1. **Spectrogram Computation**
   - I use `scipy.signal.spectrogram` to compute `Sxx` (power), `f` (frequencies), and `t` (time bins).
   - Spectrograms are log‑scaled and normalized to enhance contrast.

2. **Clock Edge Detection**
   - I identify the indices of the clock frequencies, average their power over time, and normalize the signal.
   - I compute the gradient of this power series; peaks in the gradient correspond to rising edges in the Manchester‑encoded clock.
   - `find_peaks` (SciPy) recovers these transitions; in some variants I interpolate falling edges to produce a complete timing grid.
   - The result is a list of transition times that define symbol boundaries.

3. **Bit Extraction**
   - Around each transition window, I inspect the power at each content frequency.
   - Comparing power against thresholds lets me reconstruct which frequencies were “on”, turning them back into bits.
   - `bits_to_string` and `bits_to_bytes` then reconstruct the original payload.

4. **Header / Footer Parsing**
   - For file transfers, I decode the header band first:
     - Rebuild the digit sequence based on the chosen base.
     - Convert digits back to bytes (`base_to_int`) and parse the JSON header (`BinaricHeader.from_raw`).
   - This provides content length, type, and any metadata needed to interpret the remaining stream.

### Helper Modules & Utilities

- **`audio_processing.py` (v1)**
  - Handles recording/reading audio, noise filtering, and frequency extraction.
  - Serves as the bridge between live microphone input and offline WAV processing.

- **`AudioHelper` and `AudioBuffer` (v2)**
  - `AudioHelper` provides reusable primitives for generating sine/square waves and white noise, mixing waveforms, and normalizing/clipping.
  - `AudioBuffer` manages streaming audio data in memory, supports appending chunks, slicing recent samples, and saving/loading WAV files.

- **`packet_manager.py`**
  - Handles fragmentation/reassembly of files into packets, adding sequence numbers and integrity metadata.

- **`error_correction.py`**
  - Provides CRC generation and verification, allowing trade‑offs between overhead and robustness.

- **Visualization**
  - `binaric v1/core/spectogram.py` and `binaric2/scripts/spectogram.py`:
    - Plot spectrograms with overlaid frequency bands for clock/header/content/footer.
    - Add predicted bit timing lines (based on configured data rate).
    - Provide interactive controls (sliders, checkboxes) to toggle overlays and adjust power thresholds.
  - These tools were critical to tuning frequency choices and symbol timing.

## Results

- Implemented a working end‑to‑end audio transmission pipeline that:
  - Encodes arbitrary text and structured file metadata into WAV files using multi‑tone symbols and a dedicated clock channel.
  - Recovers timing and reconstructs payloads from spectrograms in controlled environments.
- Built a flexible configuration system to experiment with:
  - Different frequency allocations and symbol densities.
  - Multiple operational modes tuned for stability vs throughput.
- Developed reusable audio utilities and visualization tools that I can apply to other DSP or protocol experiments.
- Identified clear bottlenecks (e.g., decoding robustness in high noise, real‑time performance) and paved the way for ML‑assisted demodulation and adaptive filters.

## Lessons Learned

- **Clock design is crucial.** A reliable timing signal (Manchester‑encoded clock) dramatically simplifies decoding; without it, symbol recovery quickly degrades.
- **Visualization accelerates protocol work.** High‑resolution spectrograms with overlays made it easy to debug framing issues and see where signals were colliding or too close.
- **Config‑driven design pays off.** Keeping all frequency and mode definitions in JSON allowed me to iterate on modulation schemes without rewriting DSP code.
- **Multi‑tone encoding has non‑obvious trade‑offs.** Packing more bits per symbol via additional frequencies increases throughput but complicates decoding and raises sensitivity to noise and device response curves.
- **Modularity enables experimentation.** Separating physical, link, and session concerns, plus isolating helpers, made it straightforward to evolve from v1 to v2 without breaking everything.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/Binaric)
- Demo / audio samples: _TBD_