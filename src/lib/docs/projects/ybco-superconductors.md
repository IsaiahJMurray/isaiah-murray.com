---
title: YBCO Superconductors
subtitle: >
  YBa₂Cu₃O₇ ceramic pellets made by solid-state synthesis, then cooled in liquid
  nitrogen to levitate a magnet (the Meissner effect) and measured with a
  four-terminal probe. EDS showed the composition missed the 1:2:3 target, which
  sets up the next batch. A team lab for Olin materials science.
slug: ybco-superconductors
date: '2026-11'
updated: '2026-11-14'
tags:
- materials-science
- fabrication
- superconductors
- characterization
- sem
- xrd
- electrical-testing
maturity: polished
featured: false
visibility: public
heroImage: /images/projects/ybco-superconductors/hero.jpg
---

## Overview

YBCO (yttrium barium copper oxide) is a high-temperature superconductor: below
about 93 K, warmer than liquid nitrogen's 77 K, it carries current with no
measurable voltage drop and expels magnetic fields. We made YBCO pellets from
powders, then tested whether they superconducted.

This was a team lab with Aryan Banerjee, Ben Rha and Zahra Lari (Team BIZA) for
Olin's materials science course. We shared fabrication, testing and analysis.

**Results:**
- **Levitation:** a magnet stayed suspended above a pellet cooled in liquid
  nitrogen, the Meissner effect.
- **Resistance:** four-terminal resistance fell from about **4.8 mΩ** near
  158 K to about **1.2 mΩ** at 84 K, the coldest point recorded, dropping
  fastest below about 100 K. It never reached zero.
- **Composition:** EDS measured roughly **13 : 43 : 44 atomic %** Y : Ba : Cu,
  against **17 : 33 : 50** for the 1 : 2 : 3 target. The pellets were barium-rich
  and short on yttrium and copper.

---

## Why Structure Matters

YBCO's metals sit in a fixed **1 : 2 : 3** ratio of Y : Ba : Cu. When fully
oxygenated, the crystal is **orthorhombic**, with unequal a and b lattice
parameters, CuO₂ planes and Cu–O chains. That structure is what supports
superconductivity. If oxygen content drops, the lattice shifts to a
**tetragonal** form that doesn't superconduct. Both the metal ratio and the
oxygen content have to be right.

---

## Fabrication

1. **Mix:** ground BaCO₃, Y₂O₃ and CuO together for **1 hour**.
2. **Press:** added a few drops of **4 wt% PVA** binder, loaded the die, and
   compacted the powder in an Instron.
3. **Sinter:** heated the pellets to **930 °C** and held for **10 hours**,
   ramping up and down at **5 °C/min**, about 16 hours in the furnace in total.

The pellets came out fragile after pressing, a sign the binder wasn't enough to
hold the powder together.

![Four dark YBCO pellets on a white plate; two are cracked, with loose powder around them](/images/projects/ybco-superconductors/hero.jpg)

*Sintered pellets. Two have cracked, and loose powder has broken off the edges.*

---

## Testing

### Meissner effect

We submerged a pellet in liquid nitrogen and placed a magnet above it. The magnet
stayed suspended over the pellet, the clearest evidence that at least part of the
pellet went superconducting.

<video controls playsinline preload="metadata" poster="/images/projects/ybco-superconductors/meissner-2-poster.jpg">
  <source src="/images/projects/ybco-superconductors/meissner-2.mp4" type="video/mp4">
</video>

*The magnet levitating above the cooled pellet.*

<video controls playsinline preload="metadata" poster="/images/projects/ybco-superconductors/meissner-1-poster.jpg">
  <source src="/images/projects/ybco-superconductors/meissner-1.mp4" type="video/mp4">
</video>

*Placing the magnet with tweezers over the pellet in liquid nitrogen.*

### Four-terminal resistance

Four silver contacts on the pellet separated the current-source leads from the
voltage-sense leads, so contact and lead resistance don't show up in the
reading. A thermocouple on the pellet surface logged temperature while the
pellet warmed from liquid-nitrogen temperature.

![Four probe needles and a taped thermocouple on a YBCO pellet in a foam dish](/images/projects/ybco-superconductors/four-point.jpg)

*Four-point probe and thermocouple on the pellet.*

Resistance fell from about 4.8 mΩ near 158 K to about 1.2 mΩ at 84 K, the
coldest point we recorded, and dropped fastest below about 100 K. It never
reached zero, so the resistance data supports superconductivity less directly
than the levitation test does.

![Resistance versus temperature from 84 to 199 K: about 1.2 milliohms at 84 K rising to about 4.8 milliohms near 158 K](/images/projects/ybco-superconductors/rt.png)

*Four-terminal resistance while the pellet warmed.*

### Composition and structure

- **SEM / EDS** (10 kV) showed a granular surface with larger features and
  darker gaps between them. EDS on that region gave Y : Ba : Cu of
  13.0 : 43.2 : 43.9 atomic %, normalized over the three metals. The spectrum
  also shows oxygen and a small carbon peak.

![EDS spectrum on a log scale with labeled peaks for C, O, Cu, Y and Ba](/images/projects/ybco-superconductors/eds.png)

*EDS spectrum at 10 kV.*
- **XRD** (powder, Cu source at 40 kV / 30 mA, 2θ from 20° to 80°, 0.02° steps)
  showed distinct diffraction peaks.

---

## What We'd Change

- **Composition:** the measured ratio missed 1 : 2 : 3. Ball milling, or another
  more thorough mixing method, should give a more uniform powder.
- **Strength:** use more binder so pellets survive handling after pressing.
