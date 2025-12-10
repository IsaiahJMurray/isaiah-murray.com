---
title: Egg Lathe
subtitle: Automated CNC-style lathe for decorating Ukrainian Pysanky eggs, from hardware
  and laser-cut parts through firmware and a desktop control app. Built for makers
  and digital artists who want repeatable, programmable patterns on curved egg surfaces,
  it combines STM32/Arduino-style motion control, serial command queuing, and Python/PyQt
  simulation and visualization of complex bands, grids, and single-line art.
slug: egg-lathe
date: '2024-03-26'
updated: '2025-10-12'
tags:
- c
- cpp
- python
- shell
- stm32
- embedded
- simulation
maturity: production
featured: false
visibility: public
heroImage: /generated/logos/egg-lathe.png
---
## Overview

Egg-Lathe is my end-to-end attempt to automate the Ukrainian egg-dyeing tradition of Pysanky. The project spans custom hardware (a small CNC-like lathe for eggs), embedded firmware for motor control, and a desktop application that lets me define, simulate, and execute decorative patterns on real eggs.

The repository contains:

- Fusion 360 designs and laser-cutting files for the mechanical assembly.
- STM32/Arduino-style firmware that exposes a serial command protocol.
- A Python-based control and visualization application with a PyQt5 GUI.
- Pattern-generation and simulation scripts, plus experimental image-to-pattern tooling.

## Role & Context

I built Egg-Lathe as a personal side project to explore the full stack of a small CNC system: CAD, embedded firmware, communication protocol, host-side UI, and algorithmic pattern generation.

I was responsible for:

- Designing and iterating on the mechanical hardware in Fusion 360.
- Implementing the firmware command set and motion logic.
- Designing the serial command protocol between host and microcontroller.
- Writing the Python control application, queueing layer, and PyQt5 GUI.
- Implementing pattern generators (sine bands, zig-zags, grids, and circles).
- Building experimental tooling for visualizing firmware and serial data.

## Tech Stack

- C / C++ (embedded firmware and protocol mappings)
- Python (host application, pattern generation, visualization)
- Shell (utility scripts)
- PyQt5 (desktop GUI)
- PySerial (microcontroller communication)
- NumPy, Matplotlib, Pillow, SciPy (simulation and image tooling)
- STM32 / Arduino-style environment (microcontroller target)
- Fusion 360 (mechanical design)
- SVG (laser-cutting fabrication files)

## Problem

Traditional Pysanky egg decoration is precise, time-consuming, and hard to reproduce programmatically:

- Patterns must wrap accurately around a fragile, curved surface.
- Repeating bands, grids, and continuous line art are tedious by hand.
- There was no straightforward way for me to prototype algorithmically generated patterns and then reliably transfer them onto a physical egg.

I wanted a system where I could script or design a pattern in software, preview it, and then press “go” to draw it automatically on an egg with repeatable precision.

## Approach / Architecture

I designed Egg-Lathe as a mini CNC system with clear separation between:

1. **Hardware (Lathe Mechanism)**  
   - Two axes: egg rotation and linear pen/carriage motion.
   - Laser-cut acrylic parts and 3D-printed components exported from Fusion 360.
   - Stepper motors and a microcontroller (STM32/Arduino-like) for motion.

2. **Firmware (Egg_Lathe)**  
   - A simple, line-oriented serial protocol.  
   - Commands to move each axis, calibrate, and manage motion timing.
   - Status and completion responses so the host can queue commands safely.

3. **Host Application (Python / PyQt5)**  
   - A `Command` abstraction that maps high-level moves into protocol strings.
   - A `Queue` object to layer and sequence commands reliably.
   - A desktop GUI to connect over serial, simulate the pattern, and monitor execution.

4. **Pattern Generation & Simulation**  
   - Parameterized pattern functions (e.g., sine bands, zig-zags, circles, bands).
   - A simulation layer (using turtle/pygame-style drawing) to visualize the resulting pattern in 2D.
   - Experimental pipelines to turn images and binary files into visual patterns.

The architecture centers on generating a high-level command queue in Python, simulating it locally, and then streaming the same queue to the firmware over a thin text-based protocol.

## Key Features

- Parameterized pattern primitives: sine bands, zig-zag bands, circles, and grid/band structures.
- Text-based serial protocol with clear prefixes for commands, configuration, and status.
- Python command queue that supports layering, position tracking, and calibration resets.
- PyQt5 GUI for connecting to the device, simulating patterns, and monitoring progress.
- Simulation environment using turtle/pygame-style drawing for previewing egg patterns.
- Hardware fabrication files (SVG) for laser cutting the lathe components.
- Experimental tools for converting files and hex/color data into images and spectrogram-like visualizations.

## Technical Details

### Command Protocol & Firmware Integration

On the firmware side, I defined a small command vocabulary in `Production/Lathe Firmware/Egg_Lathe/CommandMapping.h`:

```cpp
String CommandPrefix = "C-";
String CommandComplete = "-CC"; 
String ResponsePrefix = "R-";
String StatusPrefix = "S-";

String ConfigPrefix = "CONF";
String SetPrefix = "SET:";

String SteptypePrefix = "stept";
String SpeedPrefix = "speed";
String InputPrefix = "input";

String CalibratePrefix = "CB";
String MovementPrefix = "M";
String XString = "X";
String YString = "Y";
String WaitPrefix = "W";
String BreakwaitPrefix = "BW";
String FORCEBREAKWAIT = "FB";
```

On the Python side, I mapped this protocol to a higher-level `Command` abstraction in `Production/Lathe Application/structure.py`:

- `type == "move"` translates into:
  - `C-MX <dx>`
  - `C-MY <dy>`
- `type in ["cal", "calibrate"]` translates into `C-CB`.
- Raw command strings can be injected and split using a regex-based delimiter.

The `Command.execute()` method writes each command string over serial, then blocks until it receives the `-CC` completion token from the firmware or a timeout occurs:

```python
def send_command(self, command, ser):
    print(f"Sending: {command}")
    ser.write((command + "\n").encode())
    start_time = time.time()
    while True:
        if abs(start_time-time.time()) > 5:
            print("Breaktime")
            return
        if ser.in_waiting > 0:
            response = ser.readline().decode().strip()
            if response == "-CC":
                print(f"{response} recieved")
                return response
```

This keeps the host in control while ensuring the device never overruns its motion buffer.

### Queueing, Layers, and Position Tracking

The `Queue` class in `structure.py` is responsible for aggregating and sequencing `Command` objects:

- Accepts either single `Command` instances or lists of them.
- Auto-assigns `layer` indices when not provided, allowing layered patterns.
- Tracks a running `position = (x, y)` to know where the virtual pen is.
- Resets the position to `(0, 0)` on calibration commands.

Conceptually:

```python
class Queue():
    def __init__(self):
        self.queue = []
        self.length = 0
        self.layers = set()
        self.position = (0,0)
    
    def add(self, commandset):
        if isinstance(commandset, list):
            # flatten list of Commands
            ...
        elif isinstance(commandset, Command):
            ...
            if commandset.type == "move":
                self.position = (
                    self.position[0] + commandset.value[0],
                    self.position[1] + commandset.value[1]
                )
            elif commandset.type == "calibrate":
                self.position = (0,0)
```

This provides a clean mental model: pattern functions build lists of `Command` objects, then the queue executes them in order, optionally visualizing progress.

### Pattern Generators

In `Production/Lathe Application/commands.py`, I implemented several parametric pattern generators that output lists of `Command` objects.

**Sine Band**

Generates a sinusoidal band around the egg by incrementally moving in X and Y:

```python
def SineBand(amplitude, frequency, layer = 0, steps = STEPS):
    queue = []
    for i in range(0, steps):
        queue.append(
            Command(
                "move",
                (math.cos(i/200*frequency*2*math.pi)*amplitude/4, 1),
                layer
            )
        )
    return queue
```

Here:

- X is modulated by a cosine term for the sine-wave profile.
- Y is incremented by 1 step per iteration, wrapping the pattern around the egg.

**Circle**

A more sophisticated generator that approximates a circle using parametric derivatives and handles rounding error:

```python
def Circle(radius, layer=0, resolution=None, center=True):
    if resolution is None:
        resolution = max(12, round(radius * 2 * math.pi))

    mult = radius / (2 * (resolution / (4 * math.pi)))
    
    def circleCoordinates(angle):
        return (-math.sin(angle) * mult, math.cos(angle) * mult)
    
    queue = []
    circle_completion = 0
    movement_overflow = (0, 0)
    totalMovement = (0, 0)

    if center:
        initial_move = (radius/2, 0)
        queue.append(Command("move", initial_move, layer))
        totalMovement = initial_move

    while circle_completion < 2 * math.pi:
        circle_completion += 2 * math.pi / resolution
        if circle_completion > 2 * math.pi:
            circle_completion = 2 * math.pi
        circle_coords = circleCoordinates(circle_completion)

        movement = (
            movement_overflow[0] + circle_coords[0],
            movement_overflow[1] + circle_coords[1]
        )
        rounded_movement = (round(movement[0]), round(movement[1]))
        movement_overflow = (
            movement[0] - rounded_movement[0],
            movement[1] - rounded_movement[1]
        )

        if rounded_movement != (0, 0):
            queue.append(Command("move", rounded_movement, layer))
            totalMovement = (
                totalMovement[0] + rounded_movement[0],
                totalMovement[1] + rounded_movement[1]
            )

    if center:
        correction_move = (
            initial_move[0] - totalMovement[0],
            initial_move[1] - totalMovement[1]
        )
        if correction_move != (0, 0):
            queue.append(Command("move", correction_move, layer))

    return queue
```

Highlights:

- Dynamically chooses resolution based on radius to keep circles smooth.
- Accumulates floating-point deltas, but only moves in integer steps, tracking leftover `movement_overflow` so the path stays accurate.
- Computes a final correction move when `center=True` to end exactly where it started.

**Zig-Zag Bands and Bands**

For simpler geometric patterns:

```python
def ZigZagBand(amplitude, frequency, layer = 0, steps = STEPS):
    queue = []
    direction = 1
    movement = 0
    for i in range(steps):
        if i % frequency == 0:
            direction *= -1
        movement += amplitude * direction / (frequency)
        if abs(round(movement)) > 0:
            print(f"moving {movement}")
            queue.append(Command("move", (movement/2, 1), layer))
            movement = 0
        else:
            queue.append(Command("move", (0, 1), layer))
    return queue

def Band(thickness = 1, steps = STEPS):
    queue = []
    for i in range(0, thickness):
        queue.append(Command("move", (0, steps)))
        queue.append(Command("move", (1, 0)))
    queue.append(Command("move", (-thickness, 0)))
    return queue
```

These primitives can be composed in `Production/Lathe Application/main.py` into more complex programs.

### Application & GUI

The main host application in `Production/Lathe Application/application.py` is a PyQt5 `MainWindow` that:

- Holds a `Queue` of commands and a serial connection.
- Provides a preview area (`QLabel`) where I can render simulated patterns.
- Includes controls for connecting over serial and starting simulation:

```python
self.movementPanel = self.MovementControlPanel(self)
self.executeButton = QPushButton("Connect")
self.executeButton.clicked.connect(self.connectSerial)

self.simulateButton = QPushButton("Simulate")
self.simulateButton.clicked.connect(self.startSimulation)
```

I use a `QTimer` (`self.simulationTimer`) to step through the queue and draw each movement command in a simulated view (with pygame/turtle-style drawing) to approximate how the pattern will look on the egg before committing it to hardware.

### Communication Utilities & Experiments

Several supporting scripts explore serial and data visualization:

- `init test/pyserial.py` and `init test/communication.py`  
  Early experiments in sending motion commands (`moveLinear`, `rotateEgg`) and polling for status.

- `seriallisten.py`  
  Records numeric serial data, splits it into segments based on inactivity, and plots each segment with Matplotlib. Useful for monitoring sensors or motion traces.

- `filetoimage.py` and `hexToRGB.py`  
  Map arbitrary binary or hex data to RGB pixels and spectrogram-like images. I used these to visualize firmware binaries and other data streams.

### Pattern-from-Image Prototypes

Under `patterntest/Single-Line-Portrait-Drawing-master`, I included a third-party line-drawing pipeline as a reference:

- Uses weighted Voronoi stippling to generate dot distributions from an image.
- Converts stipples into single-line paths using either straight segments or Bézier curves.
- Implemented with NumPy, Pillow, SciPy, and OpenGL.

This served as a conceptual foundation for mapping 2D images to continuous toolpaths that could, in a later iteration, be wrapped onto the egg coordinate system.

## Results

- Built a working, automated egg-decorating lathe combining custom hardware, firmware, and a desktop application.
- Established a robust text-based serial protocol that reliably coordinates motion between host and microcontroller.
- Implemented reusable pattern primitives (sine bands, circles, zig-zags, bands) that I can compose into more complex egg designs.
- Created a simulation pipeline that mirrors the physical motion, enabling me to iterate on patterns without risking hardware or eggs.
- Packaged fabrication assets (SVGs) so the hardware can be rebuilt or modified once the Fusion 360 design is updated.

## Lessons Learned

- **Design the protocol first.** Having a clear and minimal serial command set made both firmware and host application code much simpler to evolve.
- **Quantization matters.** When generating smooth paths (e.g., circles), careful management of floating-point deltas vs. integer steps is crucial to avoid visible drift.
- **Simulate aggressively.** A 2D simulation of toolpaths caught mistakes long before they could damage hardware or produce bad patterns.
- **Small CNCs are full-stack projects.** Even a “simple” egg lathe touches CAD, control theory, firmware, UI, and data visualization; keeping boundaries between layers explicit pays off.
- **Leaning on existing research is powerful.** Adapting ideas from stippling and single-line drawing research opened up more ambitious pattern-generation possibilities.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/Egg-Lathe)
- Demo / Video (coming soon)