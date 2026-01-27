---
title: CLASP
subtitle: >
  CLASP is a Bluetooth Low Energy (BLE) wearable project exploring proximity-based
  interaction logging through a bracelet form factor. Built around Nordic
  Semiconductor nRF52-series hardware, the system investigates low-power RF design,
  PCB iteration, enclosure design, and future synchronization with a mobile app to
  visualize real-world social connections over time.
slug: clasp
date: '2025-01-06'
updated: '2025-01-06'
tags:
- hardware
- pcb
- embedded
- ble
- rf
- wearables
- electronics
maturity: polished
featured: true
visibility: public
heroImage: /images/projects/clasp/IMG_4305-min.jpg
---

## Overview

CLASP is an exploration of Bluetooth Low Energy (BLE) in wearable devices. The goal is
to create a bracelet that detects when it is in proximity to other CLASP bracelets
and logs those interactions over time.

Rather than functioning as another social media platform, CLASP is intended to
encourage real-world interaction while providing a way to visualize and reflect on
the connections formed through everyday life.

While the long-term vision includes a bracelet form factor and a companion mobile
application for syncing and displaying interaction data, the initial technical goal
was to reliably detect proximity between multiple BLE devices using Nordic nRF52
microcontrollers.

---

## Initial Prototypes

This project began as a learning exercise in PCB design through rough prototype
circuits.

Early boards were designed in Autodesk Fusion 360 with an emphasis on low-power
energy harvesting. Before refining the project toward social interaction logging,
these prototypes focused on demonstrating basic PCB layout skills and powering LEDs
using thermoelectric generator (TEG) plates.

![Initial prototype – layout view](/images/projects/clasp/Screenshot_2025-01-06_at_3.58.46_PM.png)

![Initial prototype – alternate view](/images/projects/clasp/Screenshot_2025-01-06_at_9.49.19_AM.png)

---

## Refined Prototype

After gaining confidence in PCB design, I developed a full BLE-enabled board. This
iteration was built around the **nRF52832-QFAA-R**, a low-power RF microcontroller
well-suited for wearable applications.

Additional components included:
- **ADXL345** accelerometer for tap and motion detection
- **M95P08 EEPROM** for non-volatile storage
- Three onboard LEDs for status indication
- A 2.4 GHz radar component for RF experimentation

The PCB was fabricated through OSH Park, with components sourced from Digi-Key. At
home, I laser-cut a solder-paste stencil from mylar and assembled the board using a
homemade toaster-oven reflow setup.

This revision did not function as intended. Major issues included an improperly
designed and untuned chip antenna, as well as excessive solder deposition caused by
poor stencil tolerances.

![Refined prototype – top view](/images/projects/clasp/IMG_4130-min.jpg)

![Refined prototype – bottom view](/images/projects/clasp/IMG_4095-min.jpg)

---

## Final Board

Incorporating lessons learned from earlier revisions, I designed **Clasp V2.0**. This
board retained the nRF52832 microcontroller and ADXL345 accelerometer while introducing
significant improvements:

- NPM1300 low-energy power management IC
- Support for LiPo batteries with USB-C charging
- PCB trace antenna replacing the chip antenna
- Smaller EEPROM package
- Improved layout for RF and power integrity

This revision functioned successfully and served as a stable development platform for
the nRF52832, running Nordic example firmware without issue.

![Final board – top view](/images/projects/clasp/IMG_4305-min.jpg)

![Final board – bottom view](/images/projects/clasp/IMG_4316-min.jpg)

---

## Enclosure

The current enclosure design is intended for a keychain-mounted form factor. The
enclosure was designed to protect the electronics while keeping the device compact
and wearable.

![Enclosure – top](/images/projects/clasp/IMG_4516-min.jpg)

![Enclosure – bottom](/images/projects/clasp/IMG_4523-min.jpg)

![Enclosure – side view](/images/projects/clasp/IMG_4518-min.jpg)

![Enclosure – alternate view](/images/projects/clasp/IMG_4526-min.jpg)
