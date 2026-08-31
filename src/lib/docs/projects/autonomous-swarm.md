---
title: Autonomous Swarm
subtitle: >
  A four-vehicle autonomous drone swarm project, built in two stages: a
  single physical quadrotor (custom SLS/SLA-printed frame, offboard
  perception, PX4 flight stack) and a four-vehicle swarm coordination
  layer, currently proven out in Isaac Sim while the other three
  airframes are funded.
slug: autonomous-swarm
tags:
- autonomy
- robotics
- swarm
- px4
- isaac-sim
- stm32
- perception
maturity: wip
featured: true
visibility: public
order: 1
heroImage: /images/projects/autonomous-swarm/final-prototype-side.jpg
---

## Overview

This project splits into two halves that are being developed in parallel:
building one physical autonomous quadrotor, and proving out multi-vehicle
swarm coordination in simulation. The end goal is a four-drone swarm that
can map out an indoor room together. Right now, one physical drone is
built and flying (autonomy tuning still in progress), the swarm layer is
demonstrated with four vehicles in simulation, and the other three
physical airframes are waiting on funding.

---

## Frame & Mechanical Design

The frame went through two real design generations:

**First pass** was a straightforward flat-sheet-cut frame with standard
mounting hardware for the FC/ESC stack and motors — functional, but not
a design I felt I learned much from.

**Second pass** took advantage of being at Formlabs to prototype on their
SLS printers instead. I ran the frame through Fusion 360's generative
design tool, targeting an impact-resistant structure that holds the
motors on the center-of-mass line, under four independent load cases
(static thrust, aggressive-maneuver thrust with a lateral component,
motor torque reaction, and a crash/impact proxy at the arm tips). I also
ran a separate modal-frequency simulation on the GD output, since
generative design in Fusion doesn't optimize for that on its own —
the arm's bending frequency needed to clear the full motor RPM sweep,
not just cruise RPM.

The **first printed frame was Tough 2000** (SLA, on a Form printer). It
shattered on the first crash, so I switched the production frame to
**SLS-printed Nylon 12** — more flexible and impact-tolerant, at the cost
of needing softer vibration isolation (grommets/standoffs) under the FC
stack to compensate for the material's flex compared to a rigid carbon
frame.

Arms are separate, bolted pieces rather than a unibody print, so a
crashed arm is a cheap individual reprint during autonomy tuning rather
than a full-frame loss.

**Prop guards** — I designed two variants: one that shields just the
flight controller/electronics, and one that rings the entire propeller
for full protection. The controller-shielding guard (printed in Rigid
10K) has held up through the build so far. The full-ring guard broke the
one time I tested it — it was printed in Fast Model resin, which turned
out to be too rigid and brittle for an impact part. Next attempt will be
SLS Nylon 12 or Tough 2000.

---

## Perception & Sensing

- **Global-shutter camera** — an innomaker OV9281 (720p/120fps, USB/UVC)
  streams video off the drone to a ground PC for asynchronous visual SLAM.
  Global shutter avoids the rolling-shutter distortion that would
  otherwise corrupt fast-motion SLAM tracking.
- **Optical flow + rangefinder** — a MicoAir MTF-02P handles lateral
  position tracking and altitude via optical flow, working indoors and
  outdoors (rated to 70 klux), MAVLink over serial to the flight
  controller.
- **Obstacle sensing (reflex layer)** — a VL53L5CX 8×8 multi-zone ToF
  sensor provides fast, always-available obstacle avoidance that's kept
  independent of the camera/SLAM stack, so a slow or dropped perception
  pipeline can't take out basic collision avoidance with it.

Camera and ToF sensor are both mounted at a forward-and-down tilt matched
to the drone's assumed cruise pitch, so their fields of view agree on
"forward" during aggressive flight rather than during hover.

---

## Flight Stack

| Component | Part | Notes |
|---|---|---|
| FC + ESC | AERO SELFIE H743 (STM32H743, dual IMU, integrated 60A 4-in-1 ESC) | Official PX4 support; 7 UART for the camera link, optical flow sensor, and RC receiver on separate buses |
| Motors | HGLRC Specter 1804-3500KV ×4 | Sized for 3-3.5" props on 4S |
| Props | Gemfan Hurricane 3520, 3-blade | Chosen small (3.5") specifically to keep the drone compact for indoor room-mapping |
| Battery | Ovonic 4S 1300mAh 120C | ~156g per pack |
| RC link | RadioMaster Pocket (ELRS) + RP1 receiver | Wired to a UART kept separate from the camera/telemetry link, so the manual-override safety path doesn't share a failure mode with the autonomy data link |
| Companion computer | Raspberry Pi Zero 2 W | Bridges MAVLink telemetry and camera capture over WiFi |

The architecture keeps flight stabilization (rate/attitude PID) onboard
the FC regardless of link status, with the camera/SLAM compute offloaded
to a ground PC — and an onboard dead-reckoning failsafe (IMU + optical
flow) to hold position briefly if that link drops. The design principle
throughout: the fast, safety-critical loops never depend on a link or
subsystem that can fail independently.

Aggressive autonomous maneuvering (the drone flying and pitching hard
under computer control, not hand-flown) is commanded through PX4's MAVSDK
`Offboard` API rather than manual sticks, with `MPC_TILTMAX_AIR` raised
past its conservative default to allow steeper commanded pitch.

One design constraint I've been idly considering (untested, just a
for-fun challenge with a friend, not something I've built or tried) is
whether the same maneuverability-first architecture — favoring
acceleration and redirection over top speed — would also help evade a
tracked laser dazzle threat, purely through unpredictable flight paths
rather than any hardening against the beam itself. It hasn't shaped any
implementation yet, but it's part of why maneuverability was prioritized
over top speed from the start.

---

## Swarm Simulation

The multi-vehicle side runs in **Isaac Sim + Pegasus Simulator + PX4
SITL**, with each simulated vehicle controlled over MAVSDK from Python.
Working today: **four-vehicle concurrent autonomous flight in
simulation** — each vehicle gets its own gRPC port and PX4 SITL instance,
armed only after polling real vehicle-health telemetry rather than a
fixed timer, with `asyncio.gather()` running one control task per vehicle
concurrently. That concurrency pattern is the first real piece of swarm
coordination logic (not just a synchronized-takeoff demo), and the plan
is to extend it into actual search/task-allocation behavior for the room
mapping goal.

---

## Status

**Working:**
- One physical quadrotor built and flying.
- Four-vehicle concurrent autonomous flight in simulation.
- Controller-shielding prop guard (Rigid 10K) validated through normal
  build/crash cycles.

**In progress:**
- Autonomous flight on the physical drone has been rough so far —
  currently retuning the PID loops and correcting weight distribution.
- Costing down the current drone, focused on the flight controller
  choice, since the other three airframes aren't funded yet.
- Full-ring prop guard: redesigning in a tougher material (SLS Nylon 12
  or Tough 2000) after the first attempt broke.

---

## Media

**Frame prototypes:**

![Assembly prototype, Tough 2000 frame with a red resin mockup standing in for the battery and electronics](/images/projects/autonomous-swarm/assembly-prototype-tough2000.jpg)

![Midstage prototype, populated with electronics, showing the Rigid 10K controller-shielding prop guard](/images/projects/autonomous-swarm/midstage-prototype-rigid10k-guard.jpg)

**Final prototype:**

![Final prototype, side view, held in hand](/images/projects/autonomous-swarm/final-prototype-side.jpg)

![Final prototype, bottom view showing the four-arm SLS Nylon 12 frame](/images/projects/autonomous-swarm/final-prototype-bottom.jpg)

**First flight:**

<video controls preload="metadata" poster="/images/projects/autonomous-swarm/first-flight-poster.jpg">
  <source src="/images/projects/autonomous-swarm/first-flight.mp4" type="video/mp4">
</video>
