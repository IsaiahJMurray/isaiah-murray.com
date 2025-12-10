---
title: Topdownshootergame
subtitle: A lighthearted top-down shooter built in Unity for fast, chaotic matches
  with friends. Focused on arcade-style gameplay and quick iteration, it explores
  input handling, 2D movement, and shooting mechanics from a top-down perspective.
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

TopDownShooterGame is a small, goofy top-down shooter I built for a group of friends. The goal was to quickly prototype a lighthearted game night experience rather than a polished commercial release. I focused on fast iteration, simple controls, and enough visual and gameplay feedback to make it fun in short bursts.

## Role & Context

I was the sole developer on this project, responsible for game design, programming, basic art integration, and project setup in Unity. I built it as a short sprint side project, prioritizing gameplay feel and rapid experimentation over long-term architecture.

## Tech Stack

- Unity (project structure, scene management, assets)
- C# (gameplay scripting)
- Git & GitHub (version control)

## Problem

I wanted a quick way to play a custom, inside-joke–filled game with friends without relying on existing titles or complex modding tools. The challenge was to stand up a fully playable top-down shooter in a short timeframe, with:

- Simple, learnable controls
- Responsive player movement and shooting
- Enemies that felt chaotic and fun without complex AI
- A codebase I could easily tweak before game nights

## Approach / Architecture

I structured the project using standard Unity patterns:

- A core gameplay scene containing the player, enemies, and basic environment.
- Separate components for movement, input, shooting, and health to keep scripts focused and reusable.
- Unity’s built-in physics and collision system to handle bullet impacts and player-enemy interactions.
- Simple scriptable settings (where helpful) for tuning speed, fire rate, and enemy stats without code changes.

This approach let me iterate quickly on gameplay feel while keeping the architecture straightforward enough for a small hobby project.

## Key Features

- Top-down player movement with keyboard or gamepad-style input
- Directional shooting with independent movement and aim
- Basic enemy spawning and pursuit behavior
- Health and damage system for player and enemies
- Simple win/lose conditions to complete or restart a session
- Lightweight visual and audio feedback for hits and deaths

## Technical Details

On the gameplay side, I used modular C# MonoBehaviour scripts to keep responsibilities narrow—e.g., one script for reading input and setting direction vectors, another for moving the character, and another for handling firing logic and projectile spawning.

Enemy behavior is intentionally simple, focusing on:

- Spawning at set intervals or from designated spawn points.
- Moving toward the player using vector math rather than complex pathfinding.
- Applying damage on collision or when in attack range.

Projectiles are handled as pooled or short-lived objects to avoid cluttering the scene; they move on a fixed trajectory and destroy themselves on impact or after a timeout. Unity’s physics and collision callbacks drive hit detection, which then updates health components.

I leaned on Unity’s prefab system to quickly duplicate and tweak enemies, bullets, and environmental objects without writing new code, keeping iteration time low.

## Results

The game achieved its main goal: it was playable, easy to pick up, and entertaining for the group it was built for. I was able to:

- Go from blank project to a working prototype in a short period.
- Rapidly tune movement speed, fire rate, and enemy behavior based on feedback.
- Use the project as a sandbox for experimenting with Unity workflow and small gameplay tweaks.

## Lessons Learned

- Small, well-scoped features make it much easier to hit a short deadline and still have a complete game loop.
- Separating movement, input, and combat logic into different components keeps the code easier to tweak.
- Even simple enemy AI can feel engaging if movement speed, spawn rate, and feedback are tuned carefully.
- A good Unity-specific `.gitignore` is crucial to keep the repo clean and the project easy to share.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/TopDownShooterGame)
- Demo: _TBD_