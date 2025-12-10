---
title: Business Card
subtitle: "Embedded firmware for a custom PCB business card that turns simple hardware\
  \ into an interactive demo platform. Written in C++/Arduino, it drives an 8x8 LED\
  \ matrix, reads a BMA400 accelerometer over I2C, and powers features like a tilt-driven\
  \ \u201Csand\u201D simulation and on-board diagnostics. Designed for hardware enthusiasts\
  \ and recruiters who appreciate hands-on electronics and low-level sensor integration."
slug: business-card
date: '2024-09-27'
updated: '2024-11-04'
tags:
- cpp
- simulation
maturity: prototype
featured: false
visibility: public
heroImage: /generated/logos/business-card.png
---
## Overview

This project contains the firmware for a custom PCB “business card” that doubles as an interactive hardware demo. The card integrates an 8×8 LED matrix and a BMA400 accelerometer to run simple animations and a sand simulation that responds to device tilt and shaking. I wrote the Arduino-based sketches to exercise each hardware subsystem (I2C devices, accelerometer, LED matrix) and then combined them into a playful, physics-inspired experience.

## Role & Context

I designed and implemented the embedded software for the card:

- Brought up and validated the hardware interfaces (I2C, GPIO).
- Wrote test sketches for the LED matrix and the BMA400 accelerometer.
- Implemented a tilt- and shake-responsive “sand simulation” on the 8×8 LED matrix.
- Structured the code so it could be reused for additional visual effects in the future.

This was a personal project to explore low-power embedded graphics and sensor-driven interaction on a very constrained form factor.

## Tech Stack

- C++ (Arduino-style sketches / `.ino`)
- Arduino core (Wire, Serial, pinMode/digitalWrite APIs)
- I2C (via `Wire.h`)
- BMA400 accelerometer (I2C)
- Custom 8×8 LED matrix (row/column multiplexing)

## Problem

I wanted a business card that was more than static contact information: it should demonstrate embedded systems skills in a visually interesting way, on very limited hardware and power. The key challenges were:

- Bringing up a custom PCB with a non-trivial LED matrix and an I2C accelerometer.
- Validating all pins and connections without dedicated lab equipment.
- Implementing an interactive, physics-like effect (“falling sand”) on an 8×8 LED matrix with no frame buffer hardware, only GPIO.
- Keeping the code simple and robust enough to run reliably on a tiny microcontroller in a pocket-sized form factor.

## Approach / Architecture

I broke the work into focused sketches, each validating a layer of the system:

1. **I2C_scanner**  
   A generic I2C bus scanner to confirm that the BMA400 (and any future I2C peripherals) were wired correctly and responding at the expected address.

2. **BMA400_* sketches (polling, yaw)**  
   Minimal drivers that:
   - Initialize the BMA400 into normal mode.
   - Read raw 16-bit acceleration data from X, Y, Z registers.
   - Convert readings into simplified angles (e.g., Z-axis tilt).

3. **matrix_test**  
   A pure GPIO test for the 8×8 LED matrix:
   - Validated row/column mapping.
   - Implemented simple row/column scanning logic.
   - Provided patterns to visually confirm no shorts, opens, or swapped lines.

4. **sand_sim**  
   The main “business card demo”:
   - Maintains an 8×8 Boolean grid representing sand particles.
   - Uses accelerometer readings to infer tilt and shaking.
   - On tilt, updates the sand grid to simulate gravity in a particular direction.
   - On shake, resets the sand distribution for a fresh pattern.
   - Continuously refreshes the matrix via row/column multiplexing.

This modular approach made it easy to debug hardware and then layer on higher-level behavior.

## Key Features

- I2C device scanner to detect and verify connected sensors.
- BMA400 accelerometer initialization and raw data polling.
- Simple yaw/tilt angle computation from accelerometer readings.
- 8×8 LED matrix test harness (per-LED, per-row, and per-column tests).
- Interactive sand simulation that reacts to tilt and shake events.
- Time-based update loop for smooth sand motion without blocking the display refresh.
- Reusable utility functions for matrix control and I2C register reads.

## Technical Details

### I2C and BMA400 Integration

- I used the Arduino `Wire` library to manage I2C communication, explicitly specifying SDA/SCL pins:

  ```cpp
  Wire.begin(11, 12); // SDA on pin 11, SCL on pin 12
  ```

- The BMA400 accelerometer is addressed at `0x14`. I configured it into normal mode by writing to its power mode register:

  ```cpp
  Wire.beginTransmission(BMA400_ADDRESS);
  Wire.write(0x19);   // Power mode register
  Wire.write(0x01);   // Normal mode
  Wire.endTransmission();
  ```

- To read 16-bit accelerometer values, I used a small helper that:
  - Writes the register address.
  - Requests 2 bytes.
  - Combines them into a signed 16-bit integer:

  ```cpp
  int16_t readRegister16(uint8_t reg) {
    Wire.beginTransmission(BMA400_ADDRESS);
    Wire.write(reg);
    Wire.endTransmission();
    Wire.requestFrom(BMA400_ADDRESS, 2);

    int16_t value = 0;
    if (Wire.available() >= 2) {
      value = (Wire.read() | (Wire.read() << 8));
    }
    return value;
  }
  ```

- A simplified tilt “angle” is computed by scaling the raw acceleration:

  ```cpp
  int16_t calculateZAngle(int16_t accelZ) {
    return accelZ / 256; // Approximate, integer-only scaling
  }
  ```

  This keeps computation cheap and avoids floating point.

### I2C Scanner

- The I2C scanner iterates addresses 1–126, calling `Wire.beginTransmission()` and checking `endTransmission()` error codes:
  - `error == 0` → device acknowledged.
  - `error == 4` → unknown error logged for debugging.
- Results are printed via `Serial` for use over USB, which was essential during early hardware bring-up.

### LED Matrix Control

- The 8×8 LED matrix is driven via two arrays of pins:

  ```cpp
  int rowPins[8] = {1, 2, 3, 4, 5, 6, 8, 10};
  int colPins[8] = {13, 14, 15, 16, 17, 18, 19, 20};
  ```

- Each LED is addressed by setting one row pin HIGH (anode) and one column pin LOW (cathode):

  ```cpp
  void lightUpLED(int row, int col) {
    digitalWrite(rowPins[row], HIGH);
    digitalWrite(colPins[col], LOW);
  }

  void turnOffLED(int row, int col) {
    digitalWrite(rowPins[row], LOW);
    digitalWrite(colPins[col], HIGH);
  }
  ```

- I added row and column helper functions to:
  - Exercise entire rows/columns for diagnostics.
  - Simplify multiplexed rendering in the sand simulation.

### Sand Simulation Logic

- The sand state is represented as a 2D Boolean grid:

  ```cpp
  const int MATRIX_SIZE = 8;
  bool sandMatrix[MATRIX_SIZE][MATRIX_SIZE] = {false};
  ```

- Initialization clears the grid, then seeds a region (e.g., top-left quarter) with “sand”:

  ```cpp
  void initializeSand() {
    for (int i = 0; i < MATRIX_SIZE; i++) {
      for (int j = 0; j < MATRIX_SIZE; j++) {
        sandMatrix[i][j] = false;
      }
    }

    for (int i = 0; i < MATRIX_SIZE / 2; i++) {
      for (int j = 0; j < MATRIX_SIZE / 2; j++) {
        sandMatrix[i][j] = true;
      }
    }
  }
  ```

- Tilt handling:
  - I read `accelX`, `accelY`, and `accelZ`, then derive a coarse tilt angle from the accelerometer data.
  - Every `updateInterval` milliseconds (100 ms), I call `updateSand(tiltAngle)` to move particles “downhill” relative to the current tilt.
  - The implementation uses simple rules (e.g., try to move sand cells in the dominant direction if the target cell is empty), giving a discrete, cellular-automaton feel.

- Shake detection:
  - I approximate the acceleration magnitude using the squared sum:

    ```cpp
    bool detectShake(int16_t accelX, int16_t accelY, int16_t accelZ) {
      int magnitude = accelX * accelX + accelY * accelY + accelZ * accelZ;
      return magnitude > SHAKE_THRESHOLD;
    }
    ```

  - When a shake is detected, I reset the sand pattern, which feels like flipping a physical sand timer.

- To avoid blocking, the main loop uses `millis()`-based timing:

  ```cpp
  unsigned long lastUpdate = 0;
  const int updateInterval = 100;

  void loop() {
    unsigned long currentMillis = millis();

    // read accelerometer ...

    if (detectShake(accelX, accelY, accelZ)) {
      initializeSand();
    } else if (currentMillis - lastUpdate >= updateInterval) {
      int tiltAngle = calculateZAngle(accelX, accelY, accelZ);
      updateSand(tiltAngle);
      lastUpdate = currentMillis;
    }

    displaySand(); // continuous multiplexed rendering
  }
  ```

- `displaySand()` repeatedly scans rows and lights LEDs according to `sandMatrix`, providing persistence of vision for the animation.

## Results

- Successfully brought up a custom PCB with an 8×8 LED matrix and BMA400 accelerometer using only Arduino tooling and serial logs.
- Verified all matrix pins and I2C lines with dedicated test sketches, reducing debugging time.
- Delivered an interactive “sand” animation that:
  - Visibly reacts to tilt (sand flows in a direction).
  - Resets on a strong shake.
- Created a compact, self-contained example of sensor-driven embedded graphics suitable to showcase on a business card.

## Lessons Learned

- Simple, focused sketches (scanner, matrix test, sensor test) dramatically speed up hardware validation compared to building everything into one “final” program.
- Using integer-only arithmetic for sensor processing is often sufficient and keeps code smaller and more predictable on microcontrollers.
- Designing clear hardware abstraction layers (e.g., `readRegister16`, `initializeMatrix`, `initializeSand`) pays off when iterating on behavior and experimenting with new effects.
- Time-based loops using `millis()` are essential for combining smooth animations with responsive input on constrained devices.
- Even with just 8×8 pixels, careful use of patterns and motion can create engaging, intuitive interactions.

## Links

- [GitHub Repository – Business-Card](https://github.com/IsaiahJMurray/Business-Card)
- Demo (TBD)