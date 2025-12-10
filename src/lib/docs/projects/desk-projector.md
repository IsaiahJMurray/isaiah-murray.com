---
title: Desk Projector
subtitle: Interactive desk-mounted projection system that aligns a depth camera and
  projector to turn your tabletop into a responsive surface. Built for makers and
  HCI tinkerers exploring augmented workspaces, it features custom homography calibration,
  OpenCV-based perspective correction, and PyQt-driven projection feedback loops.
slug: desk-projector
date: '2024-04-15'
updated: '2024-06-13'
tags:
- python
maturity: prototype
featured: false
visibility: public
heroImage: /generated/logos/desk-projector.png
---
## Overview

Desk-Projector is an experimental setup where I mount a projector and a camera above my desk and use computer vision to align the projected image with the physical desktop surface. The project focuses on the firmware and Python tooling needed to:

- Calibrate the camera–projector pair
- Warp the camera feed into the projector’s coordinate space
- Interactively illuminate regions on the desk based on user input

It’s a foundation for desk-scale augmented reality, where the projector can react in real time to what the camera sees.

## Role & Context

I built this project entirely myself as a personal hardware/software exploration. I wanted to understand, end-to-end, how to:

- Calibrate a camera and projector so they share a consistent perspective
- Drive interactive projections based on depth/camera imagery
- Design the physical housing needed to rigidly couple the camera and projector

The code in this repository captures the early-stage firmware and calibration tooling that make the system usable.

## Tech Stack

- Python
- OpenCV (`cv2`)
- NumPy
- PyQt5
- Pickle (for persisting calibration matrices)
- Custom hardware (laser-cut/ CNC-cut parts exported from Fusion 360 as SVG)

## Problem

A projector and a camera pointed at the same desk surface do not naturally “agree” on coordinates. Even small misalignments or perspective distortions mean that:

- A point seen at location `(x, y)` in the camera image will not land at the same physical location when projected.
- Any interactive application (e.g., “click here and project a highlight there”) requires accurate mapping between camera pixels and projector pixels.

I needed a repeatable calibration and runtime pipeline that:

1. Computes a robust perspective transformation between the camera image and the projector’s display space.
2. Applies that transformation in real time to the camera stream.
3. Allows interactive control over what is projected, using either mouse interactions or camera-based selections on the warped image.

## Approach / Architecture

I structured the project around a calibration–transform–interact flow:

1. **Calibration image acquisition**
   - Use a projected checkerboard or grid pattern and capture corresponding camera images.
   - Alternatively, display calibration UIs that make it easy to select matching points in both spaces.

2. **Homography / perspective matrix computation**
   - Collect 4+ corresponding points between the camera image and the projector image.
   - Compute a perspective transform matrix (`3x3` homography) using OpenCV.
   - Persist the resulting matrix (`perspective_matrix.pkl`) to disk.

3. **Runtime transformation**
   - Load the persisted matrix on startup.
   - Capture frames from the camera and apply `cv2.warpPerspective` to map them into projector coordinates (e.g., 1920×1080).

4. **Interactive projection**
   - Use mouse callbacks on the transformed camera feed to select or track points.
   - Mirror those coordinates into a fullscreen PyQt5 window displayed on the projector monitor.
   - Render simple primitives (circles, rectangles) to test and visualize alignment on the physical desk.

5. **Hardware integration**
   - Use custom-designed mounting hardware (SVGs exported from Fusion 360) to hold the projector and camera rigidly over the desk, reducing calibration drift.

## Key Features

- Camera–projector calibration via interactive point selection (`camera_calibration.py`).
- Perspective warping of live camera feed into projector resolution (`projection_stream.py`).
- Fullscreen calibration/checkerboard pattern generator for the projector (`calibration_box.py`).
- Click-and-drag selection of a region of interest on the warped image, with export to image (`square_of_interest.py`).
- Real-time “click to illuminate” prototype that projects a moving highlight on the desk (`click_to_illuminate.py`).
- Experimental checkerboard-based homography computation workflow (`calibration_lines.py`).
- Hardware CAD exports (SVG) for the projector/camera mount and clamps.

## Technical Details

### Calibration: Camera ↔ Projector Mapping

In `camera_calibration.py`, I implemented a manual, but explicit, calibration flow:

1. **Point selection on camera image**
   - Load a captured camera photo of the desk with the calibration pattern.
   - Open an OpenCV window (`Select Camera Points`) and register a mouse callback.
   - On left-click, append `(x, y)` to `selected_camera_points` and visualize points as green circles.
   - Allow resetting points with `'r'`, advancing with `'n'`.

2. **Point selection on projector image**
   - Load the corresponding projector screenshot (the exact image that was projected).
   - Mirror the same interaction to collect `selected_projector_points`.

3. **Homography computation**
   - Convert both point lists to `np.float32` arrays.
   - Ensure there are at least 4 points and then call:
     ```python
     perspective_matrix = cv2.getPerspectiveTransform(
         camera_grid_corners,
         projector_grid_corners
     )
     ```
   - Persist to `perspective_matrix.pkl` using `pickle.dump`.

This homography maps coordinates from the camera’s pixel space into the projector’s pixel space.

### Projection of Transformed Video

`projection_stream.py` demonstrates real-time warping of the camera feed:

- Initialize the camera and enforce a consistent capture size (e.g., 640×360) using:
  ```python
  cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
  cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 360)
  ```

- Load the precomputed `perspective_matrix` from disk.
- For each frame:
  - Call `cv2.warpPerspective(frame, perspective_matrix, output_size)` with `output_size = (1920, 1080)` to align to the projector’s resolution.
  - Use a mouse callback on the transformed window to track `mousepos` and draw a 10-pixel radius circle:
    ```python
    cv2.circle(transformed_frame, mousepos, 10, (255, 0, 0), -1)
    ```

This provides immediate visual feedback on how points in the transformed camera space map to projector coordinates.

### Projection-Side Rendering with PyQt5

In `click_to_illuminate.py`, I integrated OpenCV and PyQt5 using threads:

- **Projection window**:
  - `CheckerboardWindow` is a `QMainWindow` positioned on the projector monitor (e.g., `(0, 2160)` with size `1920×1080`) and set to `showFullScreen()`.
  - The `paintEvent` renders a black background and optionally draws a white ellipse centered at `self.pointxy`.

- **Camera thread**:
  - A daemon thread (`camera_thread`) runs `stream_transformed_image()`, which:
    - Captures frames from the camera.
    - Applies the same perspective transformation to map into the projector’s coordinate space.
    - Displays the transformed stream in an OpenCV window.

- **Mouse interaction**:
  - A `mouse_callback` on the OpenCV window continuously updates `mousepos`.
  - On mouse movement, it updates the projection window’s `pointxy` and calls `projection_window.update()` to repaint.
  - Result: moving the mouse over the warped camera view causes a bright circle to move across the physical desk via the projector, validating alignment.

This pattern shows how to bridge OpenCV’s event loop with a Qt GUI while keeping the GUI on the main thread.

### Region of Interest Selection

`square_of_interest.py` implements a lightweight ROI tool:

- Load `perspective_matrix` and open a camera stream.
- Warp each frame into desk/projector coordinates.
- Use a mouse callback on the transformed window to:
  - Record `pt1` on mouse-down and `pt2` on mouse-up.
  - Draw a live rectangle while dragging.
- When the user presses `'s'`, crop the rectangle from `transformed_frame` and save it as `square_image.jpg`.

Technically, this demonstrates:

- Coordinate-consistent selection in the warped space.
- Simple image extraction from a calibrated view of the desk surface.

### Calibration Patterns & Homography Exploration

`calibration_box.py` and `calibration_lines.py` contain alternative calibration aids:

- `calibration_box.py`:
  - A PyQt5 fullscreen window outputting a 5×5 checkerboard with labeled cells (0–24).
  - Helpful for visually correlating camera and projector coordinates and for manual point selection.

- `calibration_lines.py`:
  - Generates a checkerboard using NumPy.
  - Detects corners using `cv2.findChessboardCorners` and refines them with `cv2.cornerSubPix`.
  - Computes a homography (`cv2.findHomography`) between synthetic projector grid points and detected camera points, logging the resulting matrix.

These scripts let me experiment with different calibration strategies (automatic vs. manual) and compare the resulting transforms.

### Hardware Design Exports

The `hardware/` directory includes SVGs defining:

- Front and back plates for the projector housing.
- Siding and topside elements.
- Clamps and tabs to mount and stabilize the assembly to the desk.

I exported these from Fusion 360 using the Shaper Origin plugin. While not executable code, they are critical to:

- Maintaining a rigid baseline between camera and projector.
- Minimizing drift, which in turn improves calibration stability and long-term accuracy.

## Results

- Established a working camera–projector calibration pipeline using manual point selection and homography.
- Verified that the warped camera feed aligns closely with the physical desktop when projected at 1920×1080.
- Demonstrated interactive control: moving the cursor in the transformed camera window results in a projected highlight moving over the same physical location on the desk.
- Built tools to quickly test regions of interest and save desk-aligned patches as images.

The project is intentionally exploratory, but it now provides a solid base for more advanced applications such as gesture-driven interactions or depth-aware projection.

## Lessons Learned

- **Homography is powerful but sensitive**: small errors in point selection or camera distortion can noticeably degrade alignment; more points and careful selection matter.
- **Hardware rigidity is as important as software**: any flex in the mount changes the transform; the custom housing significantly improved stability.
- **GUI and CV loops need careful threading**: keeping Qt on the main thread and running OpenCV capture in a background thread avoids deadlocks and makes interaction smooth.
- **Resolution choices matter**: fixing both capture and projection resolutions early simplifies the warp logic and reduces unexpected scaling artifacts.
- **Prototyping with simple primitives helps**: circles, rectangles, and checkerboards are enough to debug most alignment and interaction issues before building richer UIs.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/Desk-Projector)
- [Live Demo / Video (placeholder)](https://example.com/desk-projector-demo)