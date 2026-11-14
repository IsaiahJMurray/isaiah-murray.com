---
title: Tracking Gimbal
subtitle: >
  A three-axis camera gimbal that stabilizes a professional camera and tracks
  its subject from the camera's own video feed, so framing follows what the lens
  actually sees. Built by a team of five at Olin; I own the motors and ESCs.
  Single-axis stabilization works, and camera-to-tracker latency is down from
  290 ms to 112 ms.
slug: tracking-gimbal
date: '2026-10-19'
updated: '2026-11-14'
tags:
- computer-vision
- object-detection
- robotics
- embedded
- python
- simulation
- tracking
- control-systems
maturity: wip
featured: true
visibility: public
order: 2.5
accent: '#e0407a'
heroImage: /images/projects/tracking-gimbal/hero-tracking-comparison.jpg
---

## Overview

Auto-tracking gimbals usually find their subject with a separate,
side-mounted wide-angle camera. That works at short range, but on a telephoto
lens the tracker sees a wide scene while the lens sees a tight one, and the
subject gets lost long before it leaves the shot.

This gimbal tracks from **the recording camera's own feed** instead, captured
over HDMI. What the tracker sees is exactly what's in frame, at whatever focal
length the lens is set to.

The final goal is a three-axis gimbal that stabilizes a professional camera and
tracks people and objects. The stretch goal is support for multiple cameras and
lenses, with live focal-length adjustment.

**Progress so far:**
- **MVP done (Nov 6):** the gimbal stabilizes in one axis.
- **Latency: 290 ms → 112 ms** from camera to tracker, a 61% cut
  (Reja's work on the HDMI capture path).
- **In simulation,** latency-compensated control halves the median framing
  error compared with feedback alone (details below).

<video controls playsinline preload="metadata" poster="/images/projects/tracking-gimbal/tracking-basketball-poster.jpg">
  <source src="/images/projects/tracking-gimbal/tracking-basketball.mp4" type="video/mp4">
</video>

*Early hardware tracking test: the one-axis MVP (background) turning to follow a basketball.*

It's an 8-week build (October to mid-December 2026) by a team of five Olin
engineers.

| Person | Role |
|---|---|
| [Isaiah Murray](https://www.linkedin.com/in/isa-murray/) | Motors and ESCs: selection, ordering, wiring and PWM outputs |
| [Reja Haddad](https://www.linkedin.com/in/reja-haddad/) | Project manager; controls (PID, filtering, camera latency) |
| [Hugo Delasnerie](https://www.linkedin.com/in/hugo-delasnerie-7287b2266/) | Mechanical design and fabrication |
| [Chengyue (Leo) Liao](https://www.linkedin.com/in/chengyue-liao-61930a384/) | Computer vision and tracking software |
| [Spencer Ng](https://www.linkedin.com/in/spencer-t-ng/) | Wiring, power distribution, flashing the Jetson Nano |

---

## Motors and ESCs

My part of the build is the actuation: choosing the motors and ESCs, getting
them ordered, and wiring the motors and coordinating the PWM outputs that drive
them.

At the MVP stage my role was integration: testing the Nano, getting camera
input, and setting up the IMU, motors and power.

![A camera on a red mount above a cylindrical gimbal motor, wired to an STM32 board on a wooden bench](/images/projects/tracking-gimbal/mvp-hardware.jpg)

*The one-axis MVP with the camera mounted.*

![Gimbal motor under the red camera mount, connected by colored leads to the driver and STM32 board](/images/projects/tracking-gimbal/motor-wiring.jpg)

*Gimbal motor and driver wiring.*

I negotiated a **15% sponsor discount** on the motors. The motor order for the
three-axis build was finalized the week of November 6, with delivery expected
November 18.

---

## Latency and the Pivot to Slower Subjects

Tracking from the camera's own feed has a cost: the video has to leave the
camera, pass through a capture card, and go through inference before the gimbal
can react. With uncompensated delay, framing error is roughly the target's
angular speed times the latency, and a longer lens makes the same error a bigger
share of the frame.

Before hardware, we estimated this for sports at 150 ms of latency:

| Target (30 m away) | Angular speed | Error at 150 ms | Share of a 50 mm frame | Share of a 200 mm frame |
|---|---|---|---|---|
| Player sprinting (8 m/s) | ~15°/s | 2.3° | ~6% | ~22% |
| Ball on a pass (20 m/s) | ~38°/s | 5.7° | ~14% | ~55% |

On the real hardware, camera and processing latency came in higher than we
expected. Reja brought the HDMI path from **290 ms down to 112 ms**. A constant
delay can be compensated for, but the system still struggles with fast
acceleration. Sports are full of sudden, unpredictable changes, so we **pivoted
from sports to tracking slower-moving people and objects**.

---

## Vision Prototype

Before any motors existed, the tracking stack ran on recorded footage from an
Olin Baja drive day, driving a **virtual gimbal**: a crop window that moves like
a real motor loop, with rate and acceleration limits plus simulated capture and
inference latency.

<video controls preload="metadata" poster="/images/projects/tracking-gimbal/tracking-demo-poster.jpg">
  <source src="/images/projects/tracking-gimbal/tracking-demo.mp4" type="video/mp4">
</video>

*Left: tracker view of the full frame. Middle: virtual gimbal with
prediction. Right: the same gimbal using feedback only. Both gimbals see
the tracker's output 150 ms late.*

The tracker is a single-target pipeline:

1. **Detection:** YOLO11n at 1280 px. The Baja car comes back as "truck"
   or "motorcycle" depending on the angle, so every vehicle class is a
   candidate.
2. **Motion gating:** a constant-velocity Kalman filter on the bounding
   box. A detection only counts if it lands near the predicted position
   with a plausible size change.
3. **Appearance re-identification:** each candidate is embedded with an
   ImageNet classifier's penultimate layer and compared against a gallery
   of exemplars collected while tracking was confident.
4. **States:** TRACK, then COAST (up to 0.7 s on the Kalman prediction
   through occlusions), then LOST (hold position and re-acquire anywhere
   in frame by appearance).

The appearance step is what makes it hold the right target. A color model
was the first attempt, and it failed: the Subaru parked at the end of the
clip has red taillights that partly match the car's magenta frame. The
learned embedding separates them cleanly. The Baja car scores 0.92 to 0.99
against its gallery, while the Subaru scores about 0.86. Over the
22-second clip, the tracker:

- holds the car through a tree occlusion and re-acquires it when it
  reappears small in the distance,
- re-acquires it after it passes behind spectators,
- ignores the Subaru for the final eight seconds, and finds the buggy
  parked in the background behind people instead.

![Re-acquiring the buggy behind spectators while the Subaru, which the detector also reports as a vehicle, is ignored](/images/projects/tracking-gimbal/reacquire-behind-spectators.jpg)

### Compensating for latency

The controller compensates for delay in two ways. It aims at where the Kalman
filter says the target is *now* (the delayed estimate plus velocity times
latency), and it feeds the target's velocity forward into the loop so a steady
pan has no lag. On the Baja clip, with 150 ms of simulated latency at 1.8x zoom:

| Gimbal mode | Median framing error | 95th percentile |
|---|---|---|
| Feedback only | 0.24 | 0.57 |
| Predictive | 0.12 | 0.35 |

*Framing error is the target's offset from the crop center as a fraction
of the half-crop (0 is centered, 1 is at the edge).*

That halves the typical error and cuts the worst moments by about 40%.
The difference is easiest to see when the car crosses the frame: the
feedback-only gimbal trails behind and clips the front of the car.

![Predictive gimbal (middle) keeps the car centered while the feedback-only gimbal (right) trails it](/images/projects/tracking-gimbal/latency-comparison.jpg)

The predictive gimbal's view on its own:

<video controls preload="metadata" poster="/images/projects/tracking-gimbal/gimbal-view-poster.jpg">
  <source src="/images/projects/tracking-gimbal/gimbal-view.mp4" type="video/mp4">
</video>

Two design ideas from the prototype carry forward to the hardware:

- **Pose history:** timestamp and buffer the gimbal's angles, so each
  detection is interpreted against where the gimbal was pointing when
  that frame was captured, not where it points now. Without this, the
  gimbal's own motion during the delay looks like target motion and the
  loop oscillates.
- **Online focal-length estimation (planned):** comparing how far the
  gimbal rotated with how far the image shifted (from optical flow) gives
  pixels per degree, which is the current focal length. The loop gains and
  prediction can then scale with zoom automatically.

---

## Hardware

The build moved away from the original plan (ESP32 with SimpleFOC drivers and a
laptop for vision) to an onboard stack:

| Component | Part | Notes |
|---|---|---|
| Vision compute | NVIDIA Jetson Nano | Runs detection and tracking on the captured feed |
| Controller | STM32 board | Wiring documented and organized by Spencer; a smaller ESP32 build is being considered to cut the electronics footprint |
| Actuation | Brushless motors with ESCs, PWM-driven | My subsystem; three-axis motors ordered with a 15% sponsor discount |
| Video in | HDMI capture card | Camera-to-tracker latency 290 ms → 112 ms |
| Sensing | IMU | Stabilization feedback |

---

## Timeline

| Milestone | Date | Status |
|---|---|---|
| MVP: one-axis stabilization | Nov 6 | Done |
| All parts ordered | Nov 13 | |
| Stationary three-axis actuation | Nov 20 | Motors arrive Nov 18 |
| Computer vision pipeline done | Dec 1 | |
| Full integration test | Dec 8 | |
| Demo and write-up | Dec 1 to 15 | |

---

## Status

**Working:**
- One-axis stabilization on hardware (MVP).
- HDMI capture latency reduced from 290 ms to 112 ms.
- Single-target tracking with occlusion handling and appearance
  re-identification on recorded footage; predictive control halves median
  framing error in simulation.

**In progress:**
- Motor wiring and PWM output coordination for three axes (me).
- Faster object tracking on the Nano (Leo).
- PID and filtering tuning with added vibration, to keep tracking stable when
  both camera and subject move (Reja).
- Printing the three-axis prototype (Hugo).
- Shrinking the electronics footprint (Spencer).
