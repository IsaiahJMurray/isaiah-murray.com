---
title: Skin Motion Map
subtitle: >
  A tool that turns phone video of ink dots on my back into measured stretch,
  compression and bend radius at every dot. I built it to decide where a
  skin-mounted EMG recorder can be rigid, which way it has to bend, and how far
  its interconnect has to stretch.
slug: skin-motion-map
date: '2026-10-26'
updated: '2026-10-28'
tags:
- computer-vision
- opencv
- python
- typescript
- wearables
- pcb-design
- visualization
- signal-processing
- photogrammetry
- emg
maturity: prototype
featured: true
visibility: public
order: 2.6
accent: '#e8763a'
heroImage: /images/projects/skin-motion-map/hero.jpg
---

## Overview

I'm designing a skin-mounted EMG recorder that sits on my lower back. A rigid
circuit board glued to skin has to survive the skin stretching underneath it.
If it can't, it shears the adhesive and peels. So before laying out a board I
needed numbers for every patch of skin: how far it stretches, in which
direction, and how tightly it bends during ordinary movement.

Ink dots and phones turned out to be enough to measure that. Skin Motion Map
is a local web app that tracks a few hundred dots through a range-of-motion
session, measures the skin's deformation at every dot, rebuilds the surface in
3D from three phones, and turns the result into rules a board layout can use.

<video controls preload="metadata" poster="/images/projects/skin-motion-map/3d-side-by-side-poster.jpg">
  <source src="/images/projects/skin-motion-map/3d-side-by-side.mp4" type="video/mp4">
</video>

*The same ten seconds, two ways. Left: the center phone. Right: the skin
surface rebuilt in 3D from three phones, coloured by true surface strain
(brighter is more stretch). Real speed.*

| Measurement | Value | Conditions |
|---|---|---|
| Dots tracked per camera | 440 to 569 | three ink colours about 15 mm apart |
| Tracking coverage | 96 / 93 / 84 % | center / left / right phone, 161 s of arm and torso movement |
| 3D reprojection error | 0.20 px median, 0.94 px P95 | 4,831 frames; 87 % of dot-frames triangulated |
| Scale agreement | 1.8 % | the 6-inch ink line, measured independently by each phone |
| Strain noise floor | 0.009 median, 0.032 P95 | a still second at the neutral pose |
| Single-camera error | compression 1.8× too high | 2D image-plane strain against 3D surface strain, same dots |
| Bend radius reached | 75 mm median, 49 mm tightest tenth | 95th percentile of curvature over the session |

---

## How It Works

![The six steps: film the dotted back, track every dot, compute strain, match the dots across phones, rebuild the surface in 3D, and turn it into board rules](/images/projects/skin-motion-map/pipeline.jpg)

The app has a video pane, a map pane and a timeline of every measurement
under both. Each tab is one step of the pipeline, and every step caches its
result against its inputs, so changing one thing only re-runs what depends on
it. The backend is Python (OpenCV, NumPy, SciPy, FastAPI) and the front end is
React and TypeScript, and the whole thing runs locally on a laptop.

---

## Tracking Through Lost Regions

<video controls preload="metadata" poster="/images/projects/skin-motion-map/ui-track-poster.jpg">
  <source src="/images/projects/skin-motion-map/ui-track.mp4" type="video/mp4">
</video>

*569 dots followed through an arm raise. The ring colour is each dot's
tracking state: observed, flow-only or re-found.*

Each dot is followed with optical flow and snapped to the detected ink, and
every dot is checked against its neighbours so it can't quietly swap places
with one.

The hard case was whole regions dropping out: a blurred shoulder blade, or an
arm across the flank. The tracker now predicts where the lost dots should be
from the reference network and matches them as a constellation. A random dot
pattern only lines up at the right offset, so lost regions come back, and
dots that had slipped onto a neighbour get put back. On the center camera
that raised coverage from 80 % to 96 %, and the number of dots lost most of
the time fell from 63 to 2. On real video, 95 % of deliberately hidden dots
were re-found, and 212 of 219 dots pushed onto a neighbour were corrected.

![Each dot coloured by the share of the session it was tracked, before and after regional relocalisation](/images/projects/skin-motion-map/tracking-before-after.jpg)

*Each dot coloured by the share of the session it was tracked (green always,
red rarely), before and after.*

![Tracking coverage for all three phones](/images/projects/skin-motion-map/tracking-coverage.jpg)

---

## Scale From a Line on the Skin

![The calibration tab: the reference frame, the traced 6-inch line and anatomy guides](/images/projects/skin-motion-map/calibrate.jpg)

A 6-inch (152.4 mm) line drawn down the spine sets the scale. In the
single-phone recording it measures 119 px at the neutral frame, which is
1.28 mm per pixel. With three phones, each one finds the line's two ends on
its own and locates them on the 3D line. The three lengths agree within
1.8 %.

---

## Stretch Maps

<video controls preload="metadata" poster="/images/projects/skin-motion-map/ui-deformation-poster.jpg">
  <source src="/images/projects/skin-motion-map/ui-deformation.mp4" type="video/mp4">
</video>

*The strain map follows the skin. Faded areas are uncertain; hatched areas
have no support.*

Each dot gets a local deformation gradient from its neighbours, which gives
stretch, compression, shear and area change. The colour fades where the
uncertainty, propagated from the dot positions, is too high to trust. Frames
where leaning or twisting makes one camera unreliable are flagged rather than
corrected, and the timeline shows strain, tracking quality and those flags
for the whole session at once.

In the single-phone session, the median dot's 95th-percentile principal
stretch was 0.29.

<video controls preload="metadata" poster="/images/projects/skin-motion-map/strain-export-poster.jpg">
  <source src="/images/projects/skin-motion-map/strain-export.mp4" type="video/mp4">
</video>

*The strain-video export from the single-phone session: abduction to
overhead reach.*

---

## Three Phones, One Surface

<video controls preload="metadata" poster="/images/projects/skin-motion-map/ui-3d-poster.jpg">
  <source src="/images/projects/skin-motion-map/ui-3d.mp4" type="video/mp4">
</video>

*Playing the session while rotating the reconstructed surface.*

One camera can't tell stretch from the back leaning toward it or curving
away. So I recorded a second session with three iPhones (17 Pro Max, 15 Pro
and 13 Pro) at once. A clap in the audio synced them, and reprojection error
then corrected the offsets by another 5 to 15 ms. The cameras were calibrated
from the dots themselves, by bundle adjustment over poses across the session,
and scaled by the ink line.

![506 dots matched across the three phones, each keeping its colour in every view it appears in](/images/projects/skin-motion-map/matched-dots.jpg)

From 3D positions, strain is measured on the skin surface itself, and
curvature comes out too. Compared on the same dots and frames, a single
camera overstated compression 1.8× and slightly understated stretch. Point by
point the two agree only loosely (correlation 0.42 to 0.49), so every board
number below uses 3D wherever it exists.

![Single-camera image-plane strain against 3D surface strain on the same dots](/images/projects/skin-motion-map/strain-2d-vs-3d.jpg)

---

## How Tightly a Board Has to Bend

![Smallest local radius of the skin at each dot, from 40 mm patches of the 3D surface](/images/projects/skin-motion-map/bend-radius-map.jpg)

At rest, the tighter principal radius is 117 mm at the median dot. During the
session half the dots reach 75 mm and a tenth reach 49 mm, mostly across the
upper back. So flex sections need to take about a 50 mm radius, and rigid
islands belong where the radius stays large.

![Distribution of the tightest bend radius per dot, at rest and over the session](/images/projects/skin-motion-map/bend-radius-chart.jpg)

---

## From Strain to Board Rules

![The design view: edge slip of a rigid 30 × 40 mm board at its best orientation, with rectangles showing that orientation at each spot](/images/projects/skin-motion-map/design-view.jpg)

The design view turns the whole strain history into numbers a layout can
use: how far a rigid board's edge slides against the skin at its best
orientation, the largest rigid island that stays under an allowed slip, and
which way the skin stretches most, so serpentine traces can run across it.

In the single-phone session, a rigid disc stays under 0.5 mm of edge slip
only up to 3.4 mm across at a typical spot, and a rigid 30 × 40 mm board
slips 4 to 6 mm. That argues for small
rigid islands joined by stretchable interconnect, not one board.

![The placement tab: footprints, electrode sites and routes scored against the strain maps](/images/projects/skin-motion-map/placement.jpg)

---

## Hand-off to PCB Layout

The last step exports everything a layout tool needs, in true millimetres on
the skin. The 3D surface is flattened into board coordinates (lengths within
3.6 % at the 95th percentile; the 6-inch line measures 153.6 mm), with the
origin at the top of the ink line. The package holds:

- a KiCad board with mechanical layers only: where a rigid island of each
  size fits, bend axes with radii, stretch and flex directions, and my draft
  islands and links with verdicts;
- the same layers as DXF, a JSON file of every rule and result, and the
  fields on a 5 mm grid;
- a standalone checker (Python and NumPy) that re-runs the island and link
  checks on any placement, read from JSON or from outlines drawn in KiCad;
- the recorder's electrical requirements: 16 independent differential EMG
  channels, eight of them already assigned by the arm and chest harnesses.

![Largest rigid island that stays bonded at each spot, in board coordinates, with my draft placement and the electrode sites on top](/images/projects/skin-motion-map/handoff-island-size.jpg)

The biggest lever is how much slip the adhesive layer under an island can
take:

| Allowed edge slip | Largest rigid island, typical spot |
|---|---|
| 0.25 mm | 1.5 mm |
| 0.5 mm | 3.1 mm |
| 1 mm | 6.1 mm |
| 2 mm | 10.3 mm |
| 3 mm | 11.3 mm |

Curvature alone caps islands near 11 mm however soft the adhesive. Every
island in my draft was too large for the skin under it, and the links
between them need 7 to 51 % stretch. That points the recorder toward
component-scale rigid islands joined by serpentine traces, or larger sections
on an interlayer that lets them slide.

![Skin stretch in its most-stretched direction, with ticks showing that direction](/images/projects/skin-motion-map/handoff-stretch.jpg)

---

## Checking the Numbers

Every measurement step has a test with a known answer, and the real data
carries its own internal checks. There are 41 automated tests in all.

| Check | Result |
|---|---|
| Synthetic video | Rendered dot fields with known motion: tracking without identity swaps, recovery after occlusion and after total loss, strain recovered |
| Synthetic 3D | Three virtual cameras on a 150 mm-radius cylinder stretched 10 %: triangulation within 0.5 mm, strain and curvature recovered |
| Between the dots | Hidden dots predicted from their neighbours: 0.34 px median error with a thin-plate spline against 0.54 px for a linear mesh. Adding optical flow made it worse (0.87 px), so it was left out |
| Re-finding lost regions | On real frames: 95 % of hidden dots re-found, 212 of 219 slipped dots put back, and no corrections at all in the 250 frames after the reference, where the tracker is known to be right |
| 3D consistency | 0.20 px median reprojection error; the three phones agree on the ink line within 1.8 %; strain noise 0.009 median over a still second |
| Board hand-off | Known answers on a synthetic cylinder for flattening, directional stretch, curvature, island slip and lift, and link stretch; the standalone checker reproduces the export's island slip within 0.01 mm |

![The whole three-phone session: 95th-percentile strain per frame, measured in 3D and by the center camera alone](/images/projects/skin-motion-map/strain-timeline.jpg)

One test caught a real bug. The dots' surface coordinate frames don't all
share the same handedness, and forcing the map into board coordinates to be
a pure rotation mirrored diagonal stretch at about two thirds of the dots. A
test with skin stretched along a diagonal and half the frames flipped now
fails on the old code and passes on the fix.

---

## Limits

- One back, two recording sessions. The numbers describe me, not a
  population.
- Single-camera strain is image-plane strain. It's flagged as such
  everywhere, and the 3D results replace it wherever three phones were used.
- The right phone loses the back when I turn away from it, so its coverage
  stops at 84 %.
- Slip and lift limits are lines to stay under, not predictions of failure.
  Adhesion life, interconnect fatigue and skin tolerance aren't tested.

---

## Status

**Working:**
- Tracking, 2D and 3D strain, curvature, design maps and placement scoring
  on two recorded sessions.
- The board hand-off package, with a standalone layout checker.

**Next:**
- Laying out the 16-channel recorder as islands and stretchable
  interconnect, checked against the measured skin.
- Tape-measure checks of dot spacing in stretched poses, and a side-view
  recording for the profile tool.
