---
title: Business Card
subtitle: "Embedded firmware for a PCB \u201Cbusiness card\u201D that turns a tiny\
  \ accelerometer-driven 8\xD78 LED matrix into an interactive sand simulation and\
  \ motion display. Built in C++/Arduino for hardware hackers and PCB designers, it\
  \ showcases direct I2C sensor interfacing, custom matrix scanning, and real-time\
  \ physics-inspired animation on severely constrained hardware."
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

This repository contains the firmware I wrote for a custom PCB business card that doubles as an interactive hardware demo. The card combines an 8×8 LED matrix with a BMA400 accelerometer over I²C to showcase simple simulations (like a “digital sand” toy), sensor interaction, and general embedded programming skills in a business-card-sized form factor.

## Role & Context

I designed and implemented the embedded software for this project myself. My focus was to:

- Bring up and test the hardware interfaces (I²C, LED matrix pins).
- Build small, self-contained sketches for each subsystem.
- Integrate them into an engaging interaction: a tilt- and shake-responsive sand simulation.

This project sits somewhere between a hardware bring-up exercise and a portfolio piece meant to be physically handed out.

## Tech Stack

- C++ (Arduino-style sketches)
- Arduino toolchain / AVR-style microcontroller (via `.ino` files)
- I²C (Wire library)
- BMA400 accelerometer
- 8×8 LED matrix (row/column scanning)

## Problem

I wanted a business card that did more than display my name and contact information. The PCB already provided:

- A small MCU.
- An 8×8 LED matrix.
- A BMA400 accelerometer via I²C.

The challenge was to write firmware that:

- Reliably initialized and talked to the BMA400 over I²C on non-default pins.
- Drove the 8×8 LED matrix without ghosting, using simple row/column multiplexing.
- Implemented a visually interesting, physics-inspired “sand” simulation that responded to tilt and shake—within the tight resource and power constraints of a business card form factor.

## Approach / Architecture

I organized the code into focused sketches:

- **I2C_scanner**: Generic I²C bus scanner to verify wiring and confirm the BMA400 address.
- **BMA400_polling**: Basic accelerometer polling/printing to validate register access and data format.
- **BMA400_yaw**: Simple Z-axis “angle” calculation to explore orientation-based interactions.
- **matrix_test**: Row/column scanning tests to exercise every LED, row, and column.
- **sand_sim**: The main interactive demo that fuses matrix control and accelerometer readings.

The architectural idea was to treat each `.ino` as a small experiment, then converge the designs into `sand_sim.ino`, which:

- Continuously reads accelerometer data.
- Detects “shake” events to reset the simulation.
- Computes a simple tilt angle and updates a boolean 2D grid of “sand” cells.
- Continuously multiplexes the LED matrix to render the grid.

This modular progression let me debug hardware in isolation before attempting the more complex simulation.

## Key Features

- I²C bus scanner to discover and validate connected devices.
- BMA400 accelerometer initialization and 16-bit register reading on custom SDA/SCL pins.
- Continuous accelerometer polling with raw X/Y/Z streaming over serial for diagnostics.
- 8×8 LED matrix driver using direct pin control and row/column multiplexing.
- “Digital sand” simulation with a boolean grid representing particles.
- Shake detection to reset the sand distribution when the card is shaken.
- Simple tilt-based update logic to move sand over time, creating a dynamic effect.

## Technical Details

### I²C / BMA400 Integration

For all accelerometer-based sketches, I used the `Wire` library, but explicitly set the SDA/SCL pins since they are not on the default hardware I²C pins:

```cpp
Wire.begin(11, 12);  // SDA on pin 11, SCL on pin 12
```

The BMA400 is addressed at `0x14`:

```cpp
#define BMA400_ADDRESS 0x14
```

To bring the sensor into a usable state, I write to its power mode register:

```cpp
void initializeBMA400() {
  Wire.beginTransmission(BMA400_ADDRESS);
  Wire.write(0x19);  // Power mode register
  Wire.write(0x01);  // Normal mode
  Wire.endTransmission();
  delay(10);
}
```

16-bit register reads are handled with a small helper that requests two bytes and combines them:

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

Separate sketches (`BMA400_polling`, `BMA400_yaw`) print raw X/Y/Z and a scaled Z-axis “angle” to verify that orientation changes are measurable and stable enough for the sand simulation.

### I²C Bus Scanning

The `I2C_scanner` sketch walks through all valid 7-bit addresses (1–126), attempting a transmission to each and checking the error code from `Wire.endTransmission()`:

```cpp
for (address = 1; address < 127; address++) {
  Wire.beginTransmission(address);
  error = Wire.endTransmission();

  if (error == 0) {
    // Device found at address
  } else if (error == 4) {
    // Unknown error
  }
}
```

This allowed me to confirm that the BMA400 responded at `0x14` and that there were no bus conflicts.

### LED Matrix Control

The 8×8 LED matrix is driven directly via GPIO:

```cpp
int rowPins[8] = {1, 2, 3, 4, 5, 6, 8, 10};
int colPins[8] = {13, 14, 15, 16, 17, 18, 19, 20};
```

The `matrix_test` sketch exercises:

- Individual LEDs:
  ```cpp
  void lightUpLED(int row, int col) {
    digitalWrite(rowPins[row], HIGH);
    digitalWrite(colPins[col], LOW);
  }
  ```
- Entire rows and columns with helper functions like `lightUpRow`, `turnOffRow`, `lightUpColumn`, `turnOffColumn`.

This verified that pin mapping, polarity (row as source, column as sink), and basic multiplexing worked across all 64 pixels.

### Sand Simulation

The `sand_sim.ino` sketch is the main demo. It uses:

- A boolean grid to represent sand:

  ```cpp
  #define MATRIX_SIZE 8
  bool sandMatrix[MATRIX_SIZE][MATRIX_SIZE] = {false};
  ```

- A periodic update mechanism:

  ```cpp
  unsigned long lastUpdate = 0;
  const int updateInterval = 100;  // ms
  ```

- Initialization of the matrix and starting sand distribution:

  ```cpp
  void initializeSand() {
    for (int i = 0; i < MATRIX_SIZE; i++) {
      for (int j = 0; j < MATRIX_SIZE; j++) {
        sandMatrix[i][j] = false;
      }
    }

    // Fill a quarter of the matrix with sand
    for (int i = 0; i < MATRIX_SIZE / 2; i++) {
      for (int j = 0; j < MATRIX_SIZE / 2; j++) {
        sandMatrix[i][j] = true;
      }
    }
  }
  ```

- A simple tilt calculation using accelerometer values:

  ```cpp
  int calculateZAngle(int16_t accelX, int16_t accelY, int16_t accelZ) {
    return accelZ / 256;  // Scaled approximation
  }
  ```

- Shake detection based on the magnitude of the acceleration vector:

  ```cpp
  #define SHAKE_THRESHOLD 2000

  bool detectShake(int16_t accelX, int16_t accelY, int16_t accelZ) {
    int magnitude = accelX * accelX + accelY * accelY + accelZ * accelZ;
    return /* magnitude comparison vs SHAKE_THRESHOLD */;
  }
  ```

Conceptually, on each update tick:

1. I read `accelX`, `accelY`, and `accelZ`.
2. If `detectShake` returns true, I reinitialize the sand grid.
3. Otherwise, I derive a tilt direction and move sand cells one step “downhill” in the grid.
4. In parallel, I continuously scan over the matrix pins and light LEDs where `sandMatrix[row][col]` is `true`.

The end result is a simple, resource-light simulation that noticeably shifts when you tilt the card and “resets” when you shake it.

## Results

- Validated custom I²C wiring and confirmed proper BMA400 communication on non-standard pins.
- Verified the behavior of all 64 LEDs in the 8×8 matrix and established a reliable multiplexing pattern.
- Produced a compact, interactive “digital sand” demo that visually responds to tilt and shake.
- Created a reusable codebase of small sketches (scanner, sensor tests, matrix tests) that can be applied to other PCB prototypes or sensor boards.

## Lessons Learned

- Small, single-purpose sketches are extremely effective for hardware bring-up and debugging.
- Explicitly specifying SDA/SCL pins with `Wire.begin` is crucial on custom boards; assuming defaults can silently fail.
- Even very simple physics approximations (like integer-scaled tilt) are enough to create engaging visual effects on low-resource microcontrollers.
- Maintaining clear helper functions for matrix control (`lightUpLED`, `lightUpRow`, etc.) simplifies later simulations and animations.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/Business-Card)
- Demo: _(TBD – link to video or live demo if available)_