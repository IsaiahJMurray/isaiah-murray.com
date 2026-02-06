---
title: Boxed Memories
subtitle: 'An AR sandbox-powered escape room installation that challenges players
  to recreate terrain maps through physical sand manipulation, unlocking digital codes
  when landscape similarity thresholds are met.

  '
slug: boxed-memories
date: '2024-01-15'
updated: '2024-01-15'
tags:
- computer-vision
- arduino
- opencv
- kinect
- augmented-reality
- escape-room
- installation-art
maturity: production
featured: true
visibility: public
heroImage: /images/projects/boxed_memories/island_final_image_presentation_good_looking_no_user.webp
accent: '#8B4513'
---

# Boxed Memories

![AR sandbox hardware setup with Kinect and projector mounted overhead](/images/projects/boxed_memories/projector_kinect_alignment_setup2.webp)
![Complete wooden frame system showing projector and sensor mounting](/images/projects/boxed_memories/projector_kinect_alignment_setup.webp)

## Overview

Boxed Memories is an interactive AR sandbox installation designed for escape rooms, combining physical terrain manipulation with computer vision to create an engaging puzzle experience. Players must recreate specific landscape patterns in a sand-filled box while an overhead Kinect sensor and projector provide real-time augmented reality feedback.

The system uses advanced image similarity algorithms to compare the current sandbox terrain against target maps displayed in the escape room. When players achieve sufficient landscape similarity (within a defined threshold), the system triggers audio feedback and displays a digital code on an LCD screen—the combination needed to unlock the next stage of the escape room.

This project bridges the gap between digital puzzles and physical interaction, creating a memorable tactile experience that engages multiple senses and encourages collaborative problem-solving.

---

## Role & Context

I developed this installation primarily as a solo project, with my partner Milin Chhabra handling the Arduino embedded code for the lock box display system. The project was created as a proof-of-concept for Red Fox Escape Rooms, demonstrating how emerging technologies could enhance traditional escape room experiences.

The motivation came from wanting to create something more engaging than typical digital interfaces—giving players the satisfaction of physically shaping terrain while incorporating cutting-edge computer vision technology. The goal was to prove that AR sandbox technology could be adapted for commercial entertainment applications.

---

## Tech Stack

- **Computer Vision**: OpenCV, scikit-image (SSIM), NumPy
- **Hardware Interface**: PyAutoGUI, PyWinCtl for screen capture and window management
- **AR Sandbox**: Linux-based system with Kinect 360 sensor and overhead projector
- **Embedded System**: Arduino with LCD display
- **Communication**: Serial connection between Linux box and Arduino
- **Image Processing**: K-means clustering for color quantization, structural similarity indexing

---

## Problem

Traditional escape rooms rely heavily on mechanical locks, hidden objects, and paper-based puzzles. While engaging, these approaches limit the potential for dynamic, technology-enhanced experiences that can adapt to player behavior or provide real-time feedback.

AR sandbox technology existed primarily in educational and research contexts, but hadn't been adapted for entertainment applications. The challenge was creating a system that could reliably detect terrain similarity in real-time while being robust enough for commercial use with diverse groups of players.

---

## Approach / Architecture

The system consists of three main components working in concert:

1. **AR Sandbox Station**: A Linux box running the terrain detection software, connected to a Kinect 360 for depth sensing and an overhead projector for visual feedback
2. **Computer Vision Engine**: Real-time image processing that captures the current sandbox state, compares it against reference terrain maps, and calculates similarity scores
3. **Reward System**: An Arduino-based lock box that receives serial commands and displays unlock codes when similarity thresholds are met

![Arduino display system showing red LCD with unlock codes](/images/projects/boxed_memories/arduino_layout_incomplete_w_screen.webp)

The computer vision pipeline captures screenshots of the projected sandbox area, applies optional color quantization to reduce noise, and uses structural similarity indexing (SSIM) to compare against reference images. When similarity exceeds the threshold, a serial command triggers the Arduino to display the unlock code.

---

## Key Features

- Real-time terrain similarity detection using SSIM algorithms
- Configurable similarity thresholds for different difficulty levels
- Audio feedback system for immediate player response
- Robust calibration system for different room setups
- Color quantization options to improve matching reliability
- Serial communication protocol for hardware integration
- Modular design allowing easy reference map updates

---

## Technical Details

### Computer Vision Pipeline

The core similarity detection system uses a multi-step process:

```python
def quantize_image(image, k):
    pixels = image.reshape((-1, 3))
    pixels = np.float32(pixels)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)
    _, labels, centers = cv2.kmeans(pixels, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
    centers = np.uint8(centers)
    segmented_image = centers[labels.flatten()]
    return segmented_image.reshape(image.shape)
```

The system first captures the sandbox area through screen region selection, allowing operators to calibrate for different projector positions and sandbox sizes. Optional k-means color quantization reduces the image to 8 primary colors, improving similarity matching by eliminating lighting variations and minor color differences.

### User Experience

![AR sandbox showing topographical projection with blue water and colored elevation zones](/images/projects/boxed_memories/island_final_image_presentation_good_looking_no_user.webp)

The AR sandbox provides immediate visual feedback through color-coded topographical projection. Blue areas represent water or low elevations, green indicates medium elevations, and warmer colors (yellow, orange, red) show higher terrain. Players can use their hands or tools to sculpt the kinetic sand, watching the projection adapt in real-time to their modifications.

![Users actively manipulating sand terrain with real-time AR feedback](/images/projects/boxed_memories/playtesting_from_presentation_final_image.webp)

### Prototyping and Testing

![Early prototype testing with foam blocks to validate heightmap detection](/images/projects/boxed_memories/user_prototype_testing_heightmap_with_foam_blocks.webp)

During development, I tested the system with foam blocks to validate the heightmap detection algorithms before moving to the final sand medium. This approach allowed for rapid iteration on the computer vision pipeline without the mess and complexity of sand manipulation.

![Stress testing the system with extreme mountain formations](/images/projects/boxed_memories/stress_testing_heightmap_with_mountain.webp)

### Calibration System

The calibration process uses mouse callbacks to define the region of interest:

```python
def mouse_callback(event, x, y, flags, param):
    global rectangle_points
    if event == cv2.EVENT_LBUTTONUP:
        if len(rectangle_points) < 2:
            rectangle_points.append((x, y))
```

Operators click two points to define the sandbox boundary, and the system automatically crops all subsequent captures to this region. This approach ensures consistent comparison areas regardless of room setup variations.

### Real-time Processing Loop

The main processing loop captures screenshots at video frame rates, processes them through the similarity pipeline, and communicates with the Arduino:

```python
while True:
    stream = pyautogui.screenshot(region=(x1, y1, x2 - x1, y2 - y1))
    image_np = np.array(stream)
    captured_image = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
    
    similarity_index, similarity_text = compare.compare_images(
        captured_image, reference_image, resized_image, win_size=3
    )
```

### Hardware Integration

The Arduino component receives serial commands when similarity thresholds are met, displaying unlock codes on an LCD screen. Milin Chhabra developed this embedded system to be responsive and reliable, with clear visual feedback for players.

---

## Results

The installation was successfully demonstrated to Red Fox Escape Rooms, where it achieved remarkable engagement metrics. Approximately 80% of attendees actively participated in the demonstration, with many staying beyond the scheduled time to experiment with the terrain manipulation.

The system performed reliably during the presentation, accurately detecting terrain matches and providing consistent feedback. Red Fox Escape Rooms expressed strong interest in the concept and requested detailed schematics and implementation plans, though the ultimate deployment status remains unknown.

The technical performance met all design goals: real-time processing maintained smooth interaction, similarity detection proved accurate enough for gameplay, and the hardware integration operated without technical issues during the demonstration.

---

## Lessons Learned

Computer vision in uncontrolled lighting environments requires robust preprocessing—the color quantization approach proved essential for consistent similarity detection across different lighting conditions. The calibration system was crucial for deployment flexibility, allowing quick setup in various room configurations.

The combination of immediate audio feedback with delayed visual rewards (the unlock code) created an effective engagement pattern. Players understood when they were close to the solution through audio cues, maintaining motivation during the puzzle-solving process.

Hardware integration complexity shouldn't be underestimated. While the serial communication protocol was straightforward, ensuring reliable operation across different system configurations required careful attention to timing and error handling.

The project demonstrated that AR sandbox technology has significant potential beyond educational applications, opening possibilities for location-based entertainment, interactive museums, and experiential marketing installations.

---

## Links

- **Red Fox Escape Rooms**: [https://redfoxescapes.com/](https://redfoxescapes.com/)
- **NuVu Portfolio**: [https://cambridge.nuvustudio.com/projects/115893-boxed-memories/tabs/106964-portfolio](https://cambridge.nuvustudio.com/projects/115893-boxed-memories/tabs/106964-portfolio)