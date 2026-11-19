---
title: Resin Cure Monitoring at Formlabs
subtitle: >
  A dielectric sensing experiment that tracked resin cure state during SLA
  printing, built in a 3-day hackathon at Formlabs headquarters with an
  oscilloscope and waveform generator standing in for an impedance analyzer that
  a snowstorm kept from arriving.
slug: advanced-resin-cure-monitoring-with-formlabs
date: '2026-01-15'
updated: '2026-11-14'
tags:
- dielectric-sensing
- sla-printing
- impedance-analysis
- resin-chemistry
- real-time-monitoring
- pcb-design
- signal-processing
maturity: polished
featured: true
visibility: public
heroImage: /images/projects/advanced_resin_cure_monitoring_with_formlabs/IMG_5213_929d9e.png
accent: '#ff5a00'
order: 5
---

## Overview

SLA printers cure liquid photopolymer layer by layer with UV light, but nothing
reports cure state while a print is running. An undercured layer or a failed
print is usually found only when the part comes off the build plate.

Over a three-day hackathon at Formlabs' Somerville headquarters, my team tested
whether dielectric sensing could see that cure happening. We put interdigitated
electrodes in contact with the resin, drove them with a test signal, and watched
how the amplitude and phase of the response changed as resin cured.

**Results:**
- Measured a difference between fully cured and uncured resin across a
  100 to 400 kHz sweep, largest between 200 and 300 kHz.
- Tracked a full print of about 800 seconds and picked out distinct signal
  signatures for build-plate finishing, individual layer starts and print
  completion.
- In glass-slide tests, saw the signal shift within seconds of UV exposure.

<video controls playsinline preload="metadata">
  <source src="/images/projects/advanced_resin_cure_monitoring_with_formlabs/IMG_5176.mp4" type="video/mp4" />
  Undercured sample removal showing liquid resin layer
</video>

*An undercured sample: the liquid layer isn't visible until the part is removed.*

---

## Team & Role

I was team captain and handled the electrical side, working with Crawford
Phillips, Mason Vogt and Trevor McDonald. The team was invited to the hackathon
after earlier research caught Formlabs' attention.

- **Me:** designed the sensor PCB and the measurement setup, built the data
  collection pipeline, and ran the experiments with Mason.
- **Crawford, Mason and Trevor:** mechanical integration with the printer.
- **Mason:** data visualization in MATLAB.

---

## Sensor Design

I designed a PCB with several **interdigitated electrode** patterns. The
electrodes set up fringing electric fields that reach into the resin, so a
change in the resin's dielectric properties as it cures shows up as a change in
the electrodes' impedance.

The board carried a range of comb spacings and electrode widths. Tighter spacing
concentrates the field near the surface, which suits thin layers; wider patterns
sample more volume and give a better signal-to-noise ratio for bulk
measurements.

![Hardware setup showing PCB integration](/images/projects/advanced_resin_cure_monitoring_with_formlabs/IMG_5213_929d9e.png)

---

## Measurement Without an Impedance Analyzer

The impedance analyzer we planned to use was delayed by a snowstorm. I rebuilt
the measurement around a **waveform generator and oscilloscope**: drive the
electrodes with a sine wave and compare the output against the input.

From each measurement I extracted:
- **Phase offset** between input and output
- **Amplitude change** (ΔV<sub>pp</sub>), which tracks the impedance magnitude
- **Frequency response** across 100 to 400 kHz, to find where cured and uncured
  resin differ most

Preliminary sweeps showed the strongest response to cure state in the low
hundreds of kHz, so I ran the print-monitoring tests at a single **245 kHz** test
signal.

The signal changes being measured were small, so shielding and grounding
mattered, particularly against noise from the printer's UV LED array and
mechanics.

---

## Experiments

**Glass-slide samples.** To get uniform sample thickness, we pressed a glass
slide over a drop of resin on the PCB, which also kept contact between resin and
electrodes consistent.

<video controls playsinline preload="metadata">
  <source src="/images/projects/advanced_resin_cure_monitoring_with_formlabs/IMG_5169.mp4" type="video/mp4" />
  Glass slide application process
</video>

**Cured vs. uncured.** Across the 100 to 400 kHz sweep, the mean amplitude
difference between fully cured and uncured samples was about **7.8 mV**, with the
largest differences between 200 and 300 kHz.

![Frequency response of cured and uncured samples, 100 to 400 kHz](/images/projects/advanced_resin_cure_monitoring_with_formlabs/Freq_100-400cureduncured_0d8e65.png)

**Cure in real time.** In the glass-slide tests, the signal shifted within
seconds of UV exposure, so the measurement follows cure as it happens rather than
only before and after.

**Full print.** With the PCB mounted in a custom build plate, we tracked a
complete print of about 800 seconds. Build-plate finishing, the start of each
layer, and print completion each produced a distinct voltage signature.

![Sample analysis showing cure progression](/images/projects/advanced_resin_cure_monitoring_with_formlabs/IMG_5204_c3aec6.png)

---

## What I'd Do Next

**Multi-frequency measurement.** The frequency sweeps showed that cured and
uncured resin have distinct spectral signatures, differing most across a band
rather than at one frequency. Measuring several frequencies at once would make
detection more robust than relying on a single 245 kHz signal.

---

## Lessons Learned

**Have a backup measurement plan.** When the impedance analyzer didn't arrive,
reframing the measurement around a scope and a waveform generator kept the
experiment running.

**Benchtop isn't the printer.** Mounting electrodes in a build plate without
disturbing the print process brought mechanical and electrical constraints that
never showed up on the bench.

**Split roles early.** With EE and ME work running in parallel on a three-day
clock, clear ownership and frequent check-ins kept the two halves converging.
