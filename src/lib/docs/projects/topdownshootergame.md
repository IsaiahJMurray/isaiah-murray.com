---
title: Topdownshootergame
subtitle: "A lighthearted top\u2011down shooter built in Unity for quick, chaotic\
  \ matches with friends. Focused on simple controls and fast feedback, it experiments\
  \ with top\u2011down camera design, collision handling, and prototype\u2011friendly\
  \ project structure."
slug: topdownshootergame
date: '2024-01-18'
updated: '2024-01-21'
tags: []
maturity: prototype
featured: false
visibility: public
heroImage: /generated/logos/topdownshootergame.png
---
## Overview

This project is a small, goofy top‑down shooter I built for my friends. The goal wasn’t to make a polished commercial game but to quickly prototype a playable experience, experiment with Unity’s 2D tooling, and practice structuring a simple game loop, entity interactions, and input handling.

## Role & Context

I designed and implemented the game on my own as a personal side project. I treated it as a sandbox to:

- Refresh and deepen my Unity skills
- Iterate rapidly on gameplay ideas based on friends’ feedback
- Experiment with code organization for a small but complete game

## Tech Stack

- Unity (2D)
- C#
- Git & GitHub

## Problem

I wanted a light, quick-to-play game that my friends could pick up without explanation. From a development perspective, the challenge was to:

- Implement basic top‑down shooter mechanics (movement, shooting, enemies) in a maintainable way
- Keep iteration time fast so I could tweak gameplay based on informal playtesting
- Keep the scope small enough to finish a vertical slice rather than leave another prototype unfinished

## Approach / Architecture

I structured the game around a traditional Unity component-based architecture:

- The player, enemies, and projectiles are all GameObjects with specialized C# components.
- Movement, input, health, damage, and shooting are separated into focused scripts so I could reuse them across different entities.
- Simple managers (e.g., for spawning enemies or resetting the game state) coordinate scene-level behavior without turning into a “god object.”

I also leaned on Unity’s editor tooling to quickly tune parameters like movement speed, fire rate, and health via serialized fields, which made balancing much easier than hard-coding constants.

## Key Features

- Top‑down movement with responsive WASD/arrow-key controls
- Directional shooting with simple projectile behavior
- Basic enemy AI (chasing or targeting the player)
- Hit detection and health/damage system for player and enemies
- Simple game loop with player death and restart flow

## Technical Details

Most of the game logic is expressed through small, single-purpose C# MonoBehaviour scripts. Conceptually, it breaks down as follows:

- **Player controller**: Reads input each frame, moves the player using Unity’s physics or direct transform manipulation, and triggers shooting actions.
- **Shooting system**: Spawns projectile prefabs from a defined fire point, with configurable rate of fire, projectile speed, and lifetime.
- **Enemy behavior**: Uses basic AI patterns (e.g., move toward player position) to create pressure on the player without complex pathfinding.
- **Health & damage**: Encapsulates health state in a reusable component; projectiles signal damage on collision, and entities react (e.g., play effects, destroy on death).
- **Game management**: Handles starting, ending, and restarting the game. This keeps scene transitions and high-level state separate from individual entities.

Even though this is a small project, I aimed to keep scripts decoupled enough that I could swap out behaviors (for example, adding new enemy types) without rewriting the core systems.

## Results

The final result is a small but complete top‑down shooter that my friends can play locally. It served its purpose as:

- A quick, humorous game for friends
- A practical exercise in Unity 2D game structure
- A reference I can build on for future prototypes (new weapons, enemy types, or levels)

## Lessons Learned

- Keeping systems modular (movement, shooting, health) pays off even in very small games.
- Exposing parameters in the Unity Inspector is crucial for rapid iteration and balance tuning.
- Scoping aggressively—focusing on a single level and core loop—helps actually finish a playable build.
- Even simple enemy AI and feedback (hit reactions, sound, or effects) dramatically improves how “alive” the game feels.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/TopDownShooterGame)
- Demo (coming soon)