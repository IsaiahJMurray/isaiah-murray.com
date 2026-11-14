---
title: Autonomous Swarm
subtitle: >
  A custom quadrotor and a multi-vehicle autonomy stack, aimed at a group of
  drones that map an indoor room together. One physical drone is built and
  flying on PX4 with a generatively designed SLS Nylon 12 frame; four vehicles
  fly concurrently in Isaac Sim with PX4 SITL; the other three airframes are
  waiting on funding.
slug: autonomous-swarm
updated: '2026-11-14'
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

The goal is a group of four drones that can map an indoor room together. I'm
building it in two halves in parallel: one physical autonomous quadrotor, and
the multi-vehicle control layer in simulation.

| | Status |
|---|---|
| **Physical hardware** | 1 quadrotor built and flying; autonomous flight still being tuned |
| **Simulation** | 4 vehicles flying concurrently in Isaac Sim + Pegasus + PX4 SITL |
| **Planned** | Room mapping; cooperative task allocation; 3 more airframes (unfunded) |

The four simulated vehicles each fly their own control task at the same time.
They don't yet divide up work or share a map, so this is concurrent control,
not cooperative swarm behavior yet.

---

## Frame & Mechanical Design

The frame went through two design generations.

**First pass** was a flat-sheet-cut frame with standard mounting hardware for the
FC/ESC stack and motors. It worked, but it was a stock design.

**Second pass** took advantage of being at Formlabs to prototype on their
printers. I ran the frame through Fusion 360's generative design tool, targeting
an impact-resistant structure that holds the motors on the center-of-mass line,
under four load cases:
- static thrust
- aggressive-maneuver thrust with a lateral component
- motor torque reaction
- a crash/impact proxy at the arm tips

Generative design in Fusion doesn't optimize for vibration, so I ran a separate
modal-frequency simulation on the output. The arm's bending frequency had to
clear the full motor RPM sweep, not just cruise RPM.

### Material: learning from the first crash

The **first printed frame was Tough 2000** (SLA). It shattered on the first
crash. I switched the frame to **SLS-printed Nylon 12**, which is more flexible
and impact-tolerant. The trade-off is that the frame flexes more than a rigid
carbon frame, so the FC stack needs softer vibration isolation (grommets and
standoffs) to compensate.

The arms are separate bolted pieces rather than one unibody print, so a crash
during autonomy tuning costs one arm reprint instead of a whole frame.

### Prop guards

I designed two variants: one that shields just the flight controller and
electronics, and one that rings the entire propeller.

- **Electronics guard (Rigid 10K):** has held up through normal build and crash
  cycles so far.
- **Full-ring guard (Fast Model resin):** broke the one time I tested it. The
  resin was too rigid and brittle for an impact part. The next version will be
  SLS Nylon 12 or Tough 2000.

![Assembly prototype, Tough 2000 frame with a red resin mockup standing in for the battery and electronics](/images/projects/autonomous-swarm/assembly-prototype-tough2000.jpg)

![Midstage prototype, populated with electronics, showing the Rigid 10K controller-shielding prop guard](/images/projects/autonomous-swarm/midstage-prototype-rigid10k-guard.jpg)

---

## Flight Architecture

The design rule throughout: **the fast, safety-critical loops never depend on a
link or subsystem that can fail independently.**

- **Onboard stabilization.** Rate and attitude PID loops run on the flight
  controller regardless of link status.
- **Offboard perception.** Camera and SLAM compute is offloaded to a ground PC,
  so the drone stays small and light.
- **Independent manual override.** The ELRS RC receiver sits on its own UART,
  separate from the camera and telemetry link, so the manual-override path
  doesn't share a failure mode with the autonomy data link.
- **Link-loss fallback (designed, not yet tested).** If the ground link drops,
  the plan is to hold position briefly by dead reckoning on IMU and optical
  flow.

Autonomous maneuvers are commanded through PX4's MAVSDK `Offboard` API rather
than manual sticks, with `MPC_TILTMAX_AIR` raised past its conservative default
to allow steeper commanded pitch.

### Sensing (selected for the design)

- **Global-shutter camera** (innomaker OV9281, 720p/120 fps, USB/UVC) for
  visual SLAM on the ground PC. Global shutter avoids the rolling-shutter
  distortion that corrupts SLAM tracking during fast motion.
- **Optical flow + rangefinder** (MicoAir MTF-02P) for lateral position and
  altitude, rated to 70 klux, MAVLink over serial to the flight controller.
- **Multi-zone ToF** (VL53L5CX, 8×8) as a reflex-level obstacle layer kept
  independent of the camera/SLAM stack, so a slow or dropped perception pipeline
  can't take basic collision avoidance down with it.

The camera and ToF sensor are tilted forward and down to match the drone's
expected cruise pitch, so their fields of view agree on "forward" in aggressive
flight rather than in hover.

---

## Flight Stack

| Component | Part | Notes |
|---|---|---|
| FC + ESC | AERO SELFIE H743 (STM32H743, dual IMU, integrated 60A 4-in-1 ESC) | Official PX4 support; 7 UARTs so the camera link, optical flow sensor and RC receiver sit on separate buses |
| Motors | HGLRC Specter 1804-3500KV ×4 | Sized for 3 to 3.5" props on 4S |
| Props | Gemfan Hurricane 3520, 3-blade | Kept small (3.5") so the drone stays compact for indoor mapping |
| Battery | Ovonic 4S 1300mAh 120C | ~156 g per pack |
| RC link | RadioMaster Pocket (ELRS) + RP1 receiver | On its own UART, separate from the autonomy link |
| Companion computer | Raspberry Pi Zero 2 W | Bridges MAVLink telemetry and camera capture over WiFi |

---

## Multi-Vehicle Simulation

The multi-vehicle side runs in **Isaac Sim + Pegasus Simulator + PX4 SITL**, with
each simulated vehicle controlled over MAVSDK from Python.

- **Four vehicles fly concurrently.** Each gets its own PX4 SITL instance and
  gRPC port.
- **Health-gated arming.** Each vehicle is armed only after polling its real
  health telemetry, rather than waiting on a fixed timer.
- **One control task per vehicle**, run concurrently with `asyncio.gather()`.

This is the base for the room-mapping goal. The next step is actual task
allocation: dividing the room between vehicles and merging what they see.

---

## Status

**Working:**
- One physical quadrotor built and flying.
- Four-vehicle concurrent autonomous flight in simulation.
- Rigid 10K electronics guard holding up through build and crash cycles.

**In progress:**
- Autonomous flight on the physical drone has been rough so far. I'm retuning
  the PID loops and correcting weight distribution.
- Costing down the drone, mainly the flight controller choice, since the other
  three airframes aren't funded yet.
- Redesigning the full-ring prop guard in SLS Nylon 12 or Tough 2000.

**Next:**
- Bring up and flight-test the perception sensors and the link-loss fallback.
- Cooperative task allocation and shared mapping in simulation.

---

## Media

**Final prototype:**

![Final prototype, side view, held in hand](/images/projects/autonomous-swarm/final-prototype-side.jpg)

![Final prototype, bottom view showing the four-arm SLS Nylon 12 frame](/images/projects/autonomous-swarm/final-prototype-bottom.jpg)

**First flight:**

<video controls preload="metadata" poster="/images/projects/autonomous-swarm/first-flight-poster.jpg">
  <source src="/images/projects/autonomous-swarm/first-flight.mp4" type="video/mp4">
</video>
