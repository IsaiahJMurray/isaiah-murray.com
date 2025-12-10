---
title: C Boids
subtitle: A C++ flocking simulation that visualizes 1,000 boids navigating around
  rectangular obstacles in real time using SFML. Built for graphics and simulation
  enthusiasts, it explores separation, alignment, cohesion, and prediction-based collision
  avoidance with tunable parameters for emergent behavior.
slug: c---boids
date: '2025-05-19'
updated: '2025-05-19'
tags:
- cpp
maturity: prototype
featured: false
visibility: public
heroImage: /generated/logos/c---boids.png
---
## Overview

This project is a C++ implementation of Craig Reynolds’ Boids algorithm, visualized in real time using SFML. I simulate a flock of agents (boids) that follow simple local rules—separation, alignment, and cohesion—while also navigating around rectangular obstacles in a 2D environment. The goal was to explore emergent behavior, performance considerations with many agents, and low-level control of a graphical simulation.

## Role & Context

I built this project independently as a way to deepen my understanding of:

- Steering behaviors and emergent systems
- Basic physics-style motion in 2D
- Real-time rendering loops with SFML in C++
- Managing performance with hundreds to thousands of objects on screen

All architecture, implementation, and tuning of parameters were done by me.

## Tech Stack

- C++
- SFML (Simple and Fast Multimedia Library)
- Standard Library (`<vector>`, `<ctime>`, `<cmath>`, etc.)

## Problem

I wanted to create a visually interesting, interactive simulation that:

- Demonstrates flocking behavior using local rules
- Scales to ~1000 boids without stuttering on a typical desktop
- Handles world boundaries and obstacle avoidance
- Gives me a hands-on playground for tuning steering parameters

The challenge was to keep the code relatively simple while still achieving natural-looking behavior and acceptable performance.

## Approach / Architecture

I implemented the simulation around two core structs:

- `Boid` – represents a single agent with position, velocity, and flocking logic.
- `Rectangle` – represents static rectangular obstacles and their basic spatial logic.

The main loop:

1. Processes events and keeps the SFML window open.
2. Updates each boid’s position and velocity based on:
   - Flocking rules
   - Collision and obstacle avoidance
   - World wrapping and speed clamping
3. Renders all boids and obstacles each frame.

Key design choices:

- Use simple structs and vectors of pointers (`std::vector<Boid*>`, `std::vector<Rectangle*>`) to keep the implementation lightweight.
- Use compile-time constants (`#define`) to tune flocking and environment parameters.
- Implement a basic predictive collision check so boids can react to obstacles before direct impact.

## Key Features

- Boid flocking behavior using separation, alignment, and cohesion rules
- Support for up to 1000 boids (`NUM_BOIDS`) in real-time
- Rectangular obstacles with collision response and basic avoidance
- Toroidal world wrapping on all boundaries
- Velocity clamping between minimum and maximum speeds
- Leader boids that are exempt from drag and can influence flock direction
- Simple, clear SFML rendering of agents and obstacles

## Technical Details

The simulation is configured through a set of constants:

- World and simulation:
  - `WIDTH`, `HEIGHT` – window and world dimensions
  - `NUM_BOIDS` – number of boids in the simulation
  - `NUM_RECTS` – number of obstacles
  - `DRAG` – velocity damping for non-leader boids

- Flocking and neighborhood radii:
  - `SEARCH_RADIUS` – general neighborhood distance
  - `SEPERATION_RADIUS`, `ALIGNMENT_RADIUS`, `COHESION_RADIUS` – specific radii for each rule
  - `SEPERATION_COEFFICIENT`, `ALIGNMENT_COEFFICIENT`, `COHESION_COEFFICIENT` – weights for combining the three steering forces

- Motion constraints:
  - `Max_SPEED`, `MIN_SPEED` – velocity clamping to keep motion stable
  - `PREDICTION_FACTOR` – scales look-ahead distance for predictive collision checks

### Boid struct

Each `Boid` tracks:

- `float x, y;` – position
- `float vx, vy;` – velocity
- `bool leader;` – whether the boid is exempt from drag and can lead

Key methods:

- `bool colliding(Rectangle* rect, float prediction_factor = 0)`  
  Predicts a future position (`pred_x`, `pred_y`) based on current velocity and `prediction_factor`, then checks whether that point lies inside the rectangle’s bounds. This is used both for immediate and predictive collision checks.

- `void update(std::vector<Boid*> input_boids, std::vector<Rectangle*> input_rectangles)`  
  Handles per-frame updates:
  - Integrate position: `x += vx; y += vy;`
  - Apply drag to non-leaders: `vx *= DRAG; vy *= DRAG;`
  - Wrap around if leaving the world:  
    - If `x < 0` → `x = WIDTH`; if `x > WIDTH` → `x = 0`; similarly for `y`
  - Clamp speed: if `sqrt(vx^2 + vy^2) > Max_SPEED`, recompute `(vx, vy)` from the velocity angle with magnitude `Max_SPEED`
  - Loop over `input_rectangles`:
    - If `colliding(rect, 0)` is true, adjust `x` or `y` to sit on the obstacle’s boundary and invert the corresponding velocity component (`vx` or `vy`) to create a bounce effect

(The flocking forces—alignment, separation, and cohesion—are combined before or during the velocity update using the defined radii and coefficients; they are computed over neighboring boids within the respective radii.)

### Rectangle struct

The `Rectangle` struct represents axis-aligned obstacles:

- `float x, y, width, height;`

Methods:

- `bool intersects(Rectangle& other)` – AABB intersection test between rectangles
- `bool contains(Boid* boid)` – checks whether a boid lies inside the rectangle (declared, used in collision logic)
- `void draw(sf::RenderWindow& window)` – builds an `sf::RectangleShape`, sets position, outline, and fill color, and draws it

### Rendering

Using SFML:

- The main loop repeatedly clears the window, updates all boids, then:
  - Draws each `Rectangle` via `Rectangle::draw`
  - Draws boids as simple shapes (e.g., circles or triangles) at `(x, y)` with a color that may distinguish leaders
- Finally, the window is displayed each frame to present smooth real-time animation.

## Results

- Achieved stable real-time rendering of ~1000 boids with obstacle avoidance on a typical desktop.
- Produced visually coherent flocking behavior with clear separation, alignment, and cohesion.
- Verified that basic predictive collision handling reduces boids getting “stuck” inside obstacles and produces more natural avoidance.

## Lessons Learned

- Simple local rules can generate surprisingly complex emergent behavior, but require careful parameter tuning.
- Even with a straightforward O(n²) neighborhood search, performance is acceptable at modest scales, but spatial partitioning (e.g., quadtrees or grids) would be necessary for larger flocks.
- Using clear constants for radii and coefficients makes the system much easier to experiment with and debug.
- SFML provides a good balance between low-level control and ease of use for real-time visualizations in C++.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/C---Boids)
- Demo: _TBD_