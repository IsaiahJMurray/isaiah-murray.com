---
title: Canopy
subtitle: >
  A telemetry, power distribution and diagnostics system for the Olin Baja
  Racing car, built around an STM32H743 network supervisor and a CAN bus,
  with a ride-height suspension sensor for damper tuning. I designed the
  system and its boards.
slug: canopy
updated: '2026-11-14'
tags:
- hardware
- embedded
- can-bus
- stm32
- telemetry
- pcb
- automotive
maturity: wip
featured: true
visibility: public
order: 2
heroImage: /images/projects/canopy/carrier-both-cards-inserted.png
---

## Overview

Canopy is Olin Baja Racing's telemetry, power distribution and control system.
Its goal is to centralize data collection across the car and support electronic
diagnostics during testing and races. I designed the system: its boards, its
CAN network and its sensors.

The system has three parts: a **network supervisor board (NSB)**, a **power
distribution board (PDB)**, and a **CAN network** connecting them to sensors
around the car.

**Status:** the NSB is on physical boards after five design iterations; the
PDB and ride-height sensor are in progress; the CAN message rates below are
design targets, not measurements.

---

## Ride-Height Sensor

The ride-height sensor's job is to give the team suspension travel data for
**damper tuning**.

The signal chain is simple on purpose: the sensing element sits in a
**Wheatstone bridge**, and an **ADC** reads the bridge output. The bridge turns a
small change in the sensor's resistance into a differential voltage the ADC can
resolve.

On the network, it publishes suspension activation as a **percentage (float)**,
with a target rate of **50 Hz** at priority 2, the second-highest on the bus
after wheel-speed RPM. Because the NSB logs every CAN message with a
per-session timestamp, ride height lands in the same log as RPM and GPS.

---

## Network Supervisor Board

The NSB is built around an **STM32H743ZITx** (Arm Cortex-M7, up to 480 MHz,
2 MB Flash / 1 MB SRAM). It manages the CAN network and collects data from runs.
It connects to:
- a CAN transceiver
- an SD card and flash memory
- an SPI bus for LoRa telemetry
- an I2C chain with a temperature sensor and accelerometer
- an SWD debug header and a USB connector for wired runtime communication

### Data paths

The NSB runs in either a recording or a passive state, with four data paths
depending on what's connected:

- **USB:** if a computer is connected, the NSB streams CAN packets regardless of
  recording state.
- **LoRa:** if the transmitter is connected and enabled, CAN packets stream over
  LoRa regardless of recording state.
- **SD card:** while recording, CAN packets are logged to the card as CSV,
  timestamped per session.
- **Fallback:** if none of the above are available while recording, the NSB
  logs to onboard memory at a reduced rate and raises a status-LED warning.

Recording state and the active storage medium are published on the CAN network
alongside all other telemetry.

### Planned message map

These are the **design targets** for each message, not measured rates from the
car.

| Module | Data | Type | Target rate | Priority |
|---|---|---|---|---|
| Hall Effect | RPM | Int | 100 Hz | 1 |
| Ride Height | Activation % | Float | 50 Hz | 2 |
| GPS | Position | Vector2 | 5 Hz | 3 |
| Wheel | Record Instance | Event | — | 2 |
| Wheel | Highlight | Event | — | 2 |
| NSB | Network Overhead | Float | 1 Hz | 5 |
| NSB | Record Status | Bool Array | 0.1 Hz + Event | 3 |
| NSB | LoRa Status | Float | 1 Hz | 3 |
| PDB | Circuit Load | Float | 10 Hz | 4 |
| PDB | Battery Status | Float | 0.1 Hz | 5 |

---

## CAN Physical Layer

The MCU's CAN2 lines route to an **MCP2561-E-SN** transceiver, which converts the
STM32's single-ended TX/RX to differential CANH/CANL (ISO 11898-2, up to
1 Mbps). Bus protection:
- a Würth WE-CNSW **common-mode choke** to reject noise on the differential pair
- **NUP2105L TVS/ESD diode arrays** on CANH and CANL
- a 3-pad solder jumper that selects hardware or software control of the
  transceiver's standby line

---

## Power Distribution Board

The PDB regulates and distributes power to every
component on the car. It draws from the battery, provides auxiliary rails at
12 V, 5 V and 3.3 V, feeds the NSB's sensitive power rails, and joins the CAN
network as a sensor node reporting circuit load and battery status. It is still
in progress.

---

## Hardware Iterations

The NSB has moved from schematics onto physical boards, with a separate power
supply board standing in for the PDB. In order:

1. **Prototype board:** an STM32H7 dev-kit-style board, used to validate the
   core design before laying out a dedicated PCB.
2. **Carrier board (v2):** routes communication from a series of slot
   connectors to the edge-connector types used on the car.
3. **Compute card:** carries the SD card, CAN buses, status LEDs and the STM32.
4. **LoRa add-on board:** plugs into the carrier for wireless telemetry. It can
   also run standalone, with pads for a waterproof connector when the antenna
   needs to sit away from the compute enclosure.
5. **Compact card:** a smaller compute card that trims the status and debug
   hardware for a tighter footprint.

---

## Status

**Built:** the NSB is on physical hardware, powered from a separate supply
board.

**In progress:** the PDB and the ride-height sensor.

**Open items from the last schematic review:** discrete regulator stages for the
3.3 V rails, a termination resistor across CANH/CANL, the LoRa module's interface
pins and antenna path, and the USB and SWD debug connectors.

---

## Media

**Prototype board:** an STM32H7 dev-kit-style board used to validate the core
NSB design.

![Prototype NSB board, dev-kit style, top-down PCB layout](/images/projects/canopy/protodev-board.png)

**Carrier board (v2):** shown with both the compute card and LoRa board
attached.

![Carrier board with compute card and LoRa board inserted, 3D render](/images/projects/canopy/carrier-both-cards-inserted.png)

![Carrier board with LoRa board attached, 3D render, alternate angle](/images/projects/canopy/carrier-lora-board-attached.png)

**LoRa add-on board:**

![LoRa telemetry board, 3D render](/images/projects/canopy/lora-board-render.png)

![LoRa telemetry board, top-down PCB layout](/images/projects/canopy/lora-board-top-down.png)

**Compute card:** SD card storage, dual CAN buses, status LEDs and the STM32.

![Compute card, top-down PCB layout](/images/projects/canopy/compute-card.png)

**Compact card:** reduced status and debug hardware.

![Compact card, reduced status/debug, top-down PCB layout](/images/projects/canopy/compact-card.png)
