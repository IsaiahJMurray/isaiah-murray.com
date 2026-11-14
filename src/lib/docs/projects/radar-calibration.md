---
title: Radar Calibration Automation
subtitle: >
  An automated gain and phase calibration program for a phased-array radar at
  Cherish. It sets every antenna element through the board's FPGA, measures the
  result on a spectrum analyzer, and iterates, cutting calibration from multiple
  hours by hand to about 30 minutes, raising received power 310% and cutting
  sidelobe interference 20% (TX) and 30% (RX) against the legacy phase offset.
slug: radar-calibration
date: '2024-06-01'
updated: '2026-11-14'
tags:
- rf
- radar
- calibration
- fpga
- signal-processing
- automation
- embedded
maturity: prototype
featured: true
visibility: public
heroImage: /images/projects/radar-calibration/image.png
---

## Overview

At **Cherish**, every newly fabricated radar board needed the gain and phase of
each antenna element tuned by hand. With the number of elements on a board, that
took multiple hours per board.

I wrote the program that replaced it. From a PC, it sets each element's gain and
phase through the onboard FPGA, measures the effect on a spectrum analyzer while
the board sits in an RF isolation enclosure, and adjusts until the array is
aligned.

**Results:**
- Calibration time went from **multiple hours** by hand to a **~30 minute**
  automated run.
- **Received power up 310%** on the calibrated receive array.
- **Sidelobe interference down 20% (TX) and 30% (RX).**
- Each receive subarray on its own improved by up to **142%** after local
  calibration.

The baseline for these comparisons is the legacy configuration: before this
work, every board got the same fixed phase offset rather than a per-board
calibration.

---

## Measurement Chain

The radar has two antenna arrays driven by four beamformer chips:
- **Transmit array:** one beamformer
- **Receive array:** three beamformers, each controlling a subset of elements

All four beamformers are controlled by an onboard FPGA. My program talked to the
FPGA from a PC to write phase and gain settings for each element, then read the
result from the instruments:

- **RF isolation enclosure** around the board, so the measurement only sees the
  board's own emissions.
- **Spectrum analyzer** at a fixed receiver position, measuring signal strength
  after each phase or gain change.
- **Radiation-pattern check:** after calibration, I rotated the board in fixed
  angular increments, recorded signal intensity at each step, and plotted the
  result as a polar chart.

---

## Receive Array: Diagnosing a Combined-Array Failure

I calibrated each of the three receive subarrays locally, using the same
phase-minimization method as the transmit array (below). Each subarray looked
good in isolation, improving by up to 142%. Combined, though, the full receive
array performed worse: the three subarrays were phase-misaligned relative to
each other and were interfering destructively.

Because every subarray passed on its own, the problem had to be in how they were
combined rather than in the per-element calibration. I traced it to a
configuration override that was silently bypassing the global phase offsets
meant to align the subarrays to each other. Applying the global offsets directly
at the antenna level, instead of through that configuration path, fixed it.

The final receive array showed a **310% increase in received power** over the
legacy phase offset.

![Final receive array azimuth distribution (censored)](/images/projects/radar-calibration/Screenshot_(3).png)

![Final receive array azimuth and elevation distribution (logarithmic)](/images/projects/radar-calibration/image.png)

---

## Transmit Array

Each transmit element has a configurable **gain** (output power) and **phase**
(the offset of its transmitted sine wave, which is what makes beamforming work).

### Gain

- The FPGA reported the power draw of each antenna.
- I picked a reference antenna and adjusted every other element to match its
  power level.
- Legal emission limits set a floor on attenuation, so gains could only be
  matched within that bound.

My first gain calibration used an aggressive simulated-annealing search. It
overfit the gains to the board's geometry and made the measured radiation
pattern worse, even though the optimization itself looked good. Switching to a
gentler approximation produced a much cleaner pattern.

### Phase

Trace length and PCB material vary from board to board, so each element's phase
has to be measured rather than assumed.

With the board in the enclosure, I swept each element's phase against the
reference and looked for the setting that **minimized** received power at the
fixed receiver: the point where the element's signal cancels the reference.
Shifting that setting by 180° then puts the element in phase with the reference.

Searching for the minimum instead of the maximum worked better for two reasons.
Near the in-phase peak, received power changes slowly with phase, so the peak is
broad and hard to locate precisely; near the null it changes quickly, so the
null is sharp. And at the minimum, distortion from radiation-pattern lobes, which
scales with signal amplitude, is smallest.

---

## Takeaways

- Calibrate in stages, but test the combined system. Every subarray passing on
  its own hid a configuration bug that only showed up when they were combined.
- Finding a null and shifting 180° is more precise than finding a peak.
- An aggressive optimizer can overfit to its model and make the physical result
  worse.
- Tying FPGA control, RF instruments and software together into one loop is what
  turned hours of manual work into a single automated run.
