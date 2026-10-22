---
title: Tracking Gimbal
subtitle: >
  A 2-axis camera gimbal for sports filming that tracks its subject from the
  main camera's own video feed, so framing stays tight even on a long lens
  from the sideline. Vision and predictive control are prototyped on Olin
  Baja footage; the hardware build is underway with a team of five.
slug: tracking-gimbal
date: '2026-10-19'
updated: '2026-10-21'
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
side-mounted wide-angle camera. That works at short range, but on a
telephoto lens from the sideline the tracker sees a wide scene while the
lens sees a tight one, and the subject gets lost long before it leaves the
shot.

This gimbal tracks from **the recording camera's own feed** instead. What
the tracker sees is exactly what's in frame, at whatever focal length the
lens is set to. That makes it zoom-aware by construction.

It's an 8-week build (October to early December 2026) by a team of five
Olin engineers: [Isaiah Murray](https://www.linkedin.com/in/isa-murray/),
[Hugo Delasnerie](https://www.linkedin.com/in/hugo-delasnerie-7287b2266/),
[Reja Haddad](https://www.linkedin.com/in/reja-haddad/),
[Spencer Ng](https://www.linkedin.com/in/spencer-t-ng/) and
[Chengyue Liao](https://www.linkedin.com/in/chengyue-liao-61930a384/). The vision and
control stack is already running on recorded footage. The pan/tilt
hardware is next.

---

## Vision Prototype

Before any motors exist, the full tracking stack runs on recorded footage
from an Olin Baja drive day, driving a **virtual gimbal**: a crop window
that moves like a real motor loop (rate and acceleration limits, plus
simulated capture and inference latency).

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

---

## Latency and Prediction

Tracking from the camera's own feed has a cost: the video has to come out
of the camera, through a capture card, and through inference before the
gimbal can react. On HDMI out from a mirrorless body, that chain is
realistically 100 to 250 ms. With uncompensated delay, framing error is
roughly the target's angular speed times the latency, and a longer lens
makes the same error a bigger fraction of the frame.

| Target (30 m away) | Angular speed | Error at 150 ms | Share of a 50 mm frame | Share of a 200 mm frame |
|---|---|---|---|---|
| Player sprinting (8 m/s) | ~15°/s | 2.3° | ~6% | ~22% |
| Ball on a pass (20 m/s) | ~38°/s | 5.7° | ~14% | ~55% |

The gimbal controller compensates in two ways. It aims at where the
Kalman filter says the target is *now* (the delayed estimate plus velocity
times latency), and it feeds the target's velocity forward into the loop
so a steady pan has no lag. On the Baja clip, with 150 ms of simulated
latency at 1.8x zoom:

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

Two pieces of the control design carry over directly to the real
hardware:

- **Pose history:** encoder angles are timestamped and buffered, so each
  detection is interpreted against where the gimbal was pointing when
  that frame was captured, not where it points now. Without this, the
  gimbal's own motion during the delay looks like target motion and the
  loop oscillates.
- **Online focal-length estimation (planned):** comparing how far the
  gimbal rotated (from the encoders) with how far the image shifted (from
  optical flow) gives pixels per degree, which is the current focal
  length. The loop gains and prediction then scale with zoom
  automatically, without any camera integration.

---

## Hardware

![System block diagram. The laptop closes the visual loop at 30 to 60 Hz, the ESP32 runs the motor loop at about 1 kHz, and timestamped encoder angles flow back so each detection is matched to where the gimbal pointed when the frame was captured.](/images/projects/tracking-gimbal/block-diagram.svg)

| Component | Part | Notes |
|---|---|---|
| Motors | iPower GM5208-12 with AS5048A encoders ×2 | Direct drive, 0.18 to 0.25 N·m, sized for a DSLR with a small lens. Encoders give real FOC commutation and a drift-free absolute pan angle. |
| Motor drivers | SimpleFOC Mini (DRV8313) ×2 | 2.5 A per phase against roughly 1 A of real draw, run in voltage mode |
| Controller | ESP32-S3 running SimpleFOC | Both axes on one MCU and one clock: one SPI bus shared by both encoders, native USB to the laptop |
| Video in | HDMI to USB capture | Clean HDMI out from the camera, 60p, audio off to cut camera-side latency |
| Vision compute | Laptop | Detection, tracking and prediction; sends position and velocity setpoints at 30 to 60 Hz |
| Power | 20 V USB-C PD with a trigger board | Inline fuse and bulk capacitor at the driver input |
| IMU | 6-axis IMU on the camera plate | Fused with the encoders later for bump rejection |

The fast loop (FOC, about 1 kHz) runs on the ESP32 and never depends on
the laptop. The laptop only closes the slow visual loop, so an operating
system hiccup costs a smoothly extrapolated setpoint, not a jerk on
camera.

---

## Timeline

| Week | Dates | Milestone |
|---|---|---|
| 1 | Oct 19 to 25 | Vision prototype on recorded footage (done). Order parts. |
| 2 to 3 | Oct 26 to Nov 8 | Frame CAD and print. Single-axis closed-loop FOC bring-up. |
| 4 to 5 | Nov 9 to 22 | Both axes closed-loop. HDMI capture into the laptop. Close the visual loop. |
| 6 | Nov 23 to 29 | Field tests filming the Olin Baja SAE team |
| 7 | Nov 30 to Dec 6 | Tuning; online focal-length estimation |
| 8 | Early December | Demo and write-up |

---

## Status

**Working:**
- Single-target tracking with occlusion handling and appearance
  re-identification on recorded Baja footage.
- Virtual gimbal with simulated latency; predictive control halves median
  framing error against feedback only.

**In progress:**
- Ordering and bring-up of the motors, drivers and controller.
- Pan/tilt frame design.

**Next:**
- Closing the visual loop on real hardware, then field testing with Olin
  Baja.
- Testing on multi-car competition footage, where several look-alike
  vehicles share the frame.
