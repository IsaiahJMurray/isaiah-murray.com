---
title: Visual Vs. Geometric Autonomy Comparison
subtitle: >
  A comparison of visual vs. lidar-based sensing methods to train an obstacle avoiding autonomous drone control model
slug: drone-reinforcement-learning
date: '2026'
updated: '2026-11-21'
tags:
- autonomy
- flight-control
- sensors
- isaac-sim
maturity: prototype
featured: false
visibility: unlisted
order: 10
heroImage: 
---

## Overview
For my Computational Robotics final project at Olin College of Engineering I'm developing and evaluating quadrotor autonomy in NVIDIA Isaac Sim. I'm interested in how the choice of sensor impacts a quadrotor's ability to navigate through a cluttered environment. My earlier swarm project was all about communication between the robots. This project is an extension of that work, looking at how an individual robot uses perception to control its motion.

The MVP is a simulated quadrotor capable of navigating a simple course with static obstacles using a single sensor modality. For the camera based approach I'm proposing to train a reinforcement learning policy that maps camera observations to motor commands. My proposal included ROS 2 for data passing between the various components. I'm thinking of doing the observations and motor commands entirely in Isaac Sim to minimise the amount of integration work I have to do for the initial tests. I'm also contemplating adding a depth head to the model.

My first stretch goal is to compare camera-based and depth-based navigation as I increase obstacle density. I'll be running both approaches on the same courses, same start and goal positions and just see how often each one gets to the goal and how often each one collides with an obstacle. Forest mapping is one application in that scenario as you need the drone to be able to navigate between the trees whilst collecting the imagery. A second stretch goal would be to take the imagery from a simulated flight and use that to reconstruct the scene via 3D Gaussian splatting.

## Milestone 1
My first milestone was to check that my home PC could run Isaac Sim and support RL. I logged in remotely, trained a locomotion policy for the example Ant robot and then ran the trained policy in simulation. The video shows the resulting locomotion.
<video controls playsinline preload="metadata">
  <source src="\images\projects\drone_reinforcement_learning\rl-video-step-0.mp4" type="video/mp4">
</video>
The project repo, baseline obstacle scene and quadrotor model are all ready to upload when I get home. The upload was hampered by a poor connection to my home PC whilst I was out and this in turn limited the amount of remote iteration I could do.

## Milestone 2
For milestone 2 I'll train and test a quadrotor policy to go from waypoint to waypoint in an empty scene with no camera input at all. I'll evaluate it by seeing whether it successfully reaches each waypoint in sequence within the required distance. That will give ne a flight control baseline before I start adding in visual sensing and obstacle avoidance.