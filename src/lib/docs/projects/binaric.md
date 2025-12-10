---
title: Binaric
subtitle: "A modular, Python-based audio modem that turns binary data and files into\
  \ structured sound for device-to-device communication, inspired by dial\u2011up\
  \ but built with modern signal processing. Aimed at developers and researchers exploring\
  \ acoustic data links, it features configurable frequency maps, Manchester-encoded\
  \ clocks, adaptive error correction, and spectrogram-based decoding tools."
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

Binaric (Binary INterfaced Audio Relay for Intelligent Communication) is an experimental audio modem and protocol stack implemented in Python. I built it to explore how to send structured digital data over plain audio in a way that is:

- Robust to noise
- Adaptively tuned to the channel
- Modular and inspectable
- Audibly distinctive and fun to listen to

The project includes both a first-generation prototype (“binaric v1”) and a second pass (“binaric2”) focused on cleaner abstractions, real‑time buffering, and better tooling (spectrogram visualization and configuration‑driven modulation).

## Role & Context

I was solely responsible for:

- Designing the protocol (layers, framing, modulation, negotiation)
- Implementing the encoder/decoder, error handling, and helper utilities
- Building spectrogram and debugging tools
- Iterating on a second architecture with clearer separation of concerns

I treated this as a playground for signal processing, protocol design, and tooling around offline and near‑real‑time audio transmission.

## Tech Stack

- Python
- NumPy
- SciPy (spectrogram, signal processing)
- Librosa (audio loading and analysis)
- Matplotlib (visualization & interactive spectrograms)
- Wave (WAV file I/O)
- JSON (frequency and protocol configuration)
- Command‑line tooling / small scripts

## Problem

I wanted a way to reliably send structured data (files, messages) between devices using only audio, inspired by legacy dial‑up and modem tones, but with:

- Configurable modulation schemes and symbol sets
- Explicit session and capability negotiation
- Tunable trade‑offs between throughput and robustness
- Good introspection: being able to “see” what’s happening in the signal

Existing projects tend to be either research prototypes, very specific formats, or black‑box libraries. I wanted something I fully understood, could reconfigure via JSON, and could evolve from offline WAV‑based experiments toward interactive use.

## Approach / Architecture

I organized Binaric as a layered protocol:

- **Physical layer**  
  Converts bits / symbols to audio and back. Uses multi‑tone schemes (parallel sine waves per symbol), a configurable clock, and Manchester‑encoded timing where appropriate.

- **Data link layer**  
  Frames packets, applies CRC, and implements ARQ‑style retransmission hooks. Focuses on integrity, symbol grouping, and base‑N conversions for denser encodings.

- **Session layer**  
  Handles preambles, capability exchange (supported modulation, error correction, bitrate ranges), and basic collision avoidance. This is where the audio “handshake” lives.

- **Optional transport/file layer**  
  Segments and reassembles files, wraps content with headers/footers, and defines a portable “binaric file” representation.

Implementation‑wise:

- **binaric v1** is a more exploratory codebase with standalone scripts:
  - `binaric_to_audio.py` / `audio_to_binaric.py` for encoding/decoding
  - Spectrogram and decode helpers for inspecting the signal
  - Data and header converters to/from custom representations

- **binaric2** refactors key ideas into:
  - Reusable classes like `AudioBuffer` and `AudioHelper`
  - A JSON‑driven frequency configuration (`freq_config.json`)
  - Transmission scripts that work in terms of bitsets and frequency sets

This split let me experiment freely in v1 and then “harden” the patterns that worked into cleaner abstractions in v2.

## Key Features

- Configurable multi‑tone modulation with JSON‑defined frequency bands and modes
- Manchester‑encoded clocking and timing grid reconstruction from the spectrogram
- Session preamble, fingerprint tones, and capability negotiation hooks
- Header/footer encoding for file metadata and framing
- Packet fragmentation/reassembly with checksums and CRC‑based integrity checks
- Interactive spectrogram tooling with overlays for clock and content bands
- Utility classes for buffer‑based audio generation, manipulation, and I/O

## Technical Details

### Frequency and Mode Configuration

In `binaric v1`, I use several frequency band presets (`freq_bands_lite.json`, `freq_bands_stable.json`, `freq_bands_max.json`) that define:

- `clock`: two frequencies for Manchester clock encoding
- `modes`: mode selection tones
- `header`, `content`, `footer`: sets of discrete carrier frequencies for multi‑tone symbols

In `binaric2/config/freq_config.json`, I consolidated this into:

- A `framework` section:
  - `basis_freq`: core frequencies used across modes
  - `clock`: clock tone pair
  - `init_sequence` / `end_sequence`: symbolic sequences for session start/stop
  - `clock_frequency`: logical symbol rate in Hz
- A `modes` section with named modes (`stable`, `standard`, `dense`), each defining:
  - `fingerprint_freq`: recognizable audio “signature” for that mode
  - `content`: the set of content carrier frequencies for that mode

This config is consumed by multiple scripts so that modulation, decoding, and visualization stay in sync.

### Encoding: Bits to Audio

Across both versions, the core pattern is:

1. **Convert data to bits**  
   - Text: `string_to_bits` / `string_to_bitset` (8 bits per character).
   - Integers and structured content: base‑N converters (`int_to_base`, `RawData`) to take advantage of high‑arity symbol alphabets.

2. **Group bits into symbols**  
   - In v1: `encode_segment_from_bits` uses `len(freqs)` as bits‑per‑symbol; each symbol is a bitstring over that many frequencies.
   - In v2: `string_to_bitset(text, chunk_length)` converts to nested lists of bits, each list representing a symbol.

3. **Map symbols to tones**  
   For a given symbol:
   - For each bit and matching frequency, if bit == 1, add that sine wave; else silence.
   - Normalize by the number of active tones to avoid clipping.

   Example in `binaric2/scripts/transmit.py`:

   - Precompute one‑segment sine waves per frequency using `AudioHelper.create_sine_wave`.
   - Scale each tone to `[-1, 1]` float.
   - For each bitset, sum active waves and normalize, then concatenate across symbols.

4. **Clock signal**  
   In v1, I generate a dedicated Manchester‑encoded clock:

   - A repeating bit pattern is Manchester‑encoded (`"0" -> "10"`, `"1" -> "01"`).
   - Each encoded bit maps to one of the two `clock` frequencies.
   - Tones are concatenated into a continuous clock waveform for the duration of the payload.

   This clock is mixed with the data segment so the receiver can reconstruct timing edges from the spectrogram.

5. **WAV output / buffering**  
   - v1: write raw NumPy arrays to WAV using `wave`.
   - v2: use `AudioBuffer` to accumulate streaming data, support chunked reads (`get_latest_chunk`), and save/load WAVs as needed.

### Decoding: Audio to Bits

Decoding reverses the process and relies heavily on spectrogram analysis:

1. **Load audio & compute spectrogram**  
   - With `librosa.load` and SciPy’s `spectrogram`.
   - Use relatively large `nperseg` and tuned `noverlap` for good frequency resolution at the targeted data rate (e.g., `FFTSIZE = 2048`, `HOP_LEN = 1500`).

2. **Detect clock transitions**  
   Example: `detect_clock_edges` in `decode_binaric.py` / `audio_to_binaric.py`:

   - Extract the power over the two `clock` frequencies across time.
   - Normalize and compute the gradient, then use `scipy.signal.find_peaks` to detect rising edges.
   - Optionally interpolate falling edges between detected peaks to reconstruct the full edge grid.
   - Convert peak indices back to actual times.

   These transition times define sampling points for symbol decisions.

3. **Sample content bands**  
   - For each transition window, look at the spectrogram bins around each content frequency.
   - Decide whether each frequency was “on” or “off” (presence/absence or thresholding on magnitude).
   - This yields a bitset per symbol, which is flattened into a bitstring.

4. **Reassemble payload**  
   - Join bits, then map:
     - To bytes and strings (`bits_to_string`, `bits_to_bytes`).
     - Back from base‑N digits to integers or structured content (using `base_to_int` and the `RawData` abstraction).
   - Rebuild headers/footers and content from `BinaricHeader` and `RawData`.

Debug functions can optionally plot the gradient, detected peaks, and overlay them on the spectrogram so I can visually confirm that my timing grid lines up with the tones.

### Framing, Headers, and File Transfer

In v1’s `binaric_data.py` and related scripts:

- `BinaricHeader` encapsulates:
  - `file_name`, `file_size`, `file_type`
  - `content_base` (base used for the main payload)
  - Arbitrary `metadata`

Encoding:

- Serialize header as JSON, UTF‑8 encode, then convert each byte into digits in a chosen base using `int_to_base`.
- Wrap this in a `RawData` object (`base`, `data[]`), which is then mapped to symbols and tones.

For file transfer:

- `packet_manager