---
title: Desk Projector
subtitle: Interactive desk-mounted projector system that aligns a camera feed with
  projected imagery to turn your desk surface into a calibrated, clickable workspace.
  Built for hardware tinkerers and computer-vision enthusiasts, it combines OpenCV-based
  homography calibration, real-time perspective-warped video, and PyQt projection
  control, plus fabrication-ready SVGs for the physical mount.
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

Desk-Projector is an experimental firmware and calibration toolkit for a desk-mounted projector and camera rig. The goal is to treat my desk surface as an interactive projection area: the camera observes the desk, and the projector renders calibrated visuals that line up with the physical surface, enabling things like click-to-illuminate and projected UI elements.

The repository contains both the Python-side “firmware” for camera/projector calibration and interaction, and hardware SVGs for the laser-cut / CNC’d mount that holds the projector above the desk.

## Role & Context

I built this project end-to-end:

- I designed the physical mount (in CAD, exported as SVG) for holding the projector and camera at a fixed geometry over my desk.
- I implemented the calibration workflows to compute a perspective transform between the camera’s view and the projector’s coordinate system.
- I wrote the interaction prototypes, such as clicking on the camera feed to illuminate the corresponding region on the desk.

This started as a personal exploration into spatial augmented reality and projector–camera systems, with the goal of turning my desk into an interactive canvas for future applications.

## Tech Stack

- Python
- OpenCV (cv2)
- NumPy
- PyQt5
- Pickle (for persisting calibration data)
- Custom SVG hardware designs (exported from Fusion 360 / Shaper Origin workflow)

## Problem

To make a desk-surface projector useful, the projected pixels must align precisely with the physical desk area as seen by the camera. Out of the box, the camera and projector each have their own perspective and coordinate system, so:

- A point seen by the camera does not trivially map to a point on the projector.
- Any misalignment makes interactive features (like “click here to light this spot on the desk”) inaccurate and frustrating.

I needed a robust but lightweight way to:

1. Calibrate the geometry between the camera and the projector.
2. Persist that calibration so that other scripts could:
   - Transform the camera’s live video into “desk coordinates”.
   - Project content back down to the desk at the correct location.
3. Experiment with interaction techniques without constantly re-writing calibration code.

## Approach / Architecture

I split the project into three main layers:

1. **Calibration utilities**
   - `camera_calibration.py`: interactively collects corresponding points between the camera image and a projected calibration grid, then computes and saves a perspective transform.
   - `calibration_box.py` and `calibration_lines.py`: generate calibration patterns (checkerboard / chessboard) for more automated or visual calibration.

2. **Runtime projection and interaction**
   - `projection_stream.py`: opens a camera stream, warps frames using the stored transform, and displays a perspective-correct view.
   - `click_to_illuminate.py`: combines a PyQt-based full-screen projection window with an OpenCV camera view; mouse movement in the camera window updates a projected “spotlight” on the desk.

3. **Region-of-interest tools**
   - `square_of_interest.py`: lets me draw and save rectangular regions on the transformed camera image, making it easy to define “widgets” or active areas on the desk.

Shared calibration data flows through the system via a pickled `perspective_matrix.pkl`, which stores a 3×3 homography computed from hand-picked or detected correspondences. Every runtime script loads this matrix and uses `cv2.warpPerspective` to map images between spaces.

Hardware designs in the `hardware/` directory define the physical enclosure and mounting parts to keep the projector and camera rigid, which is critical for the homography to remain valid over time.

## Key Features

- **Interactive point selection for calibration** between camera and projector images using OpenCV mouse callbacks.
- **Persistent homography storage** (`perspective_matrix.pkl`) for reuse across multiple scripts and sessions.
- **Perspective-warped camera stream** to visualize the desk from a top-down, projector-aligned perspective.
- **Click/hover-to-illuminate demo**, where mouse motion over the camera view drives a live projected spotlight on the desk.
- **Region-of-interest selection and export**, allowing quick definition of squares/rectangles on the surface for future UI experiments.
- **Calibration pattern generators** (checkerboard windows and chessboard images) for easier corner detection and alignment.
- **Custom hardware SVGs** for laser-cuttable projector/camera mounts that maintain stable geometry.

## Technical Details

### Calibration Workflow

I used a two-step, mostly manual calibration approach:

1. **Collecting corresponding points (`camera_calibration.py`)**
   - Load a sample camera image of the desk with a projected calibration grid:
     ```python
     camera_img = cv2.imread(r'...camera\\WIN_20240420_23_02_07_Pro.jpg')
     ```
   - Display the image in an OpenCV window and use a mouse callback to capture clicked points:
     ```python
     selected_camera_points = []

     def select_camera_point(event, x, y, flags, param):
         if event == cv2.EVENT_LBUTTONDOWN:
             selected_camera_points.append((x, y))
     ```
   - Repeat the process for a reference projector image of the calibration grid, building `selected_projector_points`.

2. **Computing and saving the homography**
   - Once I have 4 corresponding camera and projector points:
     ```python
     camera_grid_corners = np.array(selected_camera_points, dtype=np.float32)
     projector_grid_corners = np.array(selected_projector_points, dtype=np.float32)

     perspective_matrix = cv2.getPerspectiveTransform(
         camera_grid_corners,
         projector_grid_corners
     )
     ```
   - The matrix is serialized for reuse:
     ```python
     with open('perspective_matrix.pkl', 'wb') as f:
         pickle.dump(perspective_matrix, f)
     ```

This homography maps points from the camera’s image plane to the projector’s plane. Other scripts invert or apply it as needed using `cv2.warpPerspective`.

### Calibration Patterns

To help align the system and experiment with more automated calibration:

- **`calibration_box.py` (PyQt5 full-screen checkerboard)**  
  Creates a 5×5 checkerboard window on the projector monitor (assumed at `(0, 2160)` with `1920×1080` resolution). Each cell is numbered, which makes it easy to verbally/visually align physical features on the desk.

- **`calibration_lines.py` (OpenCV chessboard homography)**  
  - Generates a synthetic checkerboard image at projector resolution:
    ```python
    projector_image = generate_checkerboard(800, 600, checkerboard_size)
    ```
  - Uses `cv2.findChessboardCorners` and `cv2.cornerSubPix` to detect corners in a camera capture of that projection.
  - Builds a grid of “ideal” projector points and computes a homography with `cv2.findHomography`.

This script demonstrates a path to fully automated geometric calibration.

### Perspective-Warped Camera Stream

`projection_stream.py` is a simple but important piece:

- Loads the saved matrix:
  ```python
  with open('perspective_matrix.pkl', 'rb') as f:
      perspective_matrix = pickle.load(f)
  ```
- Opens the camera, optionally normalizing frame size:
  ```python
  cap = cv2.VideoCapture(0)
  cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
  cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 360)
  ```
- For each frame, warps it into projector resolution:
  ```python
  output_size = (1920, 1080)
  transformed_frame = cv2.warpPerspective(frame, perspective_matrix, output_size)
  ```
- Handles mouse clicks on the transformed view and overlays a marker:
  ```python
  cv2.circle(transformed_frame, mousepos, 10, (255, 0, 0), -1)
  ```

This gives an immediate, visual check that the homography is reasonable and stable.

### Click-to-Illuminate Interaction

`click_to_illuminate.py` demonstrates live interaction between the camera feed and the projection:

- **Projection window (PyQt5)**
  - Full-screen black window on the projector monitor:
    ```python
    class CheckerboardWindow(QMainWindow):
        def paintEvent(self, event):
            qp = QPainter(self)
            qp.setBrush(QBrush(QColor(0, 0, 0)))
            qp.drawRect(self.rect())
            if self.pointxy:
                qp.setPen(QColor(255, 255, 255))
                qp.setBrush(QBrush(QColor(255, 255, 255)))
                qp.drawEllipse(*self.pointxy, 50, 50)
    ```
  - The `pointxy` attribute defines where a bright circle is drawn.

- **Camera thread (OpenCV)**
  - Runs in a separate Python thread, continuously reading frames and warping them using `perspective_matrix` to `1920×1080`.
  - Mouse movement in the transformed camera window:
    ```python
    def mouse_callback(event, x, y, flags, param):
        if event == cv2.EVENT_MOUSEMOVE:
            projection_window.pointxy = (x - 30, y - 30)
            projection_window.update()
    ```
  - This effectively maps mouse coordinates in the corrected camera view into projector-space coordinates and updates the projection.

The combination creates the illusion that you are “painting with light” directly on the desk, even though interaction is technically happening through the camera window.

### Region of Interest Selection

`square_of_interest.py` is a utility to define rectangular regions on the transformed camera stream:

- After applying the homography, it lets me drag a rectangle with the mouse.
- On pressing `s`, it crops that region and saves it to `square_image.jpg`:
  ```python
  square_img = transformed_frame[
      min(pt1[1], pt2[1]):max(pt1[1], pt2[1]),
      min(pt1[0], pt2[0]):max(pt1[0], pt2[0])
  ]
  cv2.imwrite('square_image.jpg', square_img)
  ```

This is handy for capturing “widgets” or test patches from the desk surface for later analysis or as assets.

### Hardware

The `hardware/` directory contains multiple SVG files such as:

- `Frontside.svg`, `Backside.svg`, `Topside.svg`
- `Projector Siding.svg`, `Siding 2.svg`
- `Smallclamp.svg`, `Largerclamp.svg`
- Tab and backplate designs (`TabX8.svg`, `TabX22.svg`, etc.)

These are exported from Fusion 360 via the Shaper Origin plugin and define:

- Side panels and top/bottom plates for the projector enclosure.
- Clamps and tabs to attach the system securely to the desk.
- Cutouts for cable routing, projector lens, and camera mounting.

Maintaining a rigid, repeatable physical geometry is crucial: any movement between the camera and projector invalidates the homography and degrades the interaction accuracy.

## Results

- Established a working calibration pipeline that reliably produces a usable camera-to-projector homography and persists it for reuse.
- Verified alignment with:
  - A perspective-corrected camera stream that lines up visually with the projected area.
  - A functioning click/hover-to-illuminate demo where the projected light closely tracks mouse motion over the desk area.
- Produced a reusable set of calibration and interaction scripts that I can extend into more advanced desk-projected interfaces (e.g., projected buttons, sliders, or gesture-driven zones).
- Created a hardware design set that can be re-cut or modified for different projectors/cameras while keeping the software approach the same.

## Lessons Learned

- **Rigid hardware matters as much as software.** Even a well-computed homography fails if the projector or camera moves slightly; solid mounting and consistent setup are essential.
- **Manual point selection is a good first step.** Starting with 4–8 carefully chosen correspondences made debugging easier before trying more automated chessboard-based calibration.
- **Coordinate systems are easy to confuse.** Being explicit about which space each script operated in (camera pixels, projector pixels, desk/”world” pixels) helped avoid inverted transforms and misalignment.
- **Simple interaction demos expose calibration flaws quickly.** The click-to-illuminate prototype was a powerful diagnostic tool: any jitter or offset was immediately visible and helped highlight where calibration could be improved.
- **Separation of calibration and runtime logic pays off.** Persisting the matrix and treating calibration as a one-time (or infrequent) step made it much easier to iterate on runtime features.

## Links

- GitHub repository: [https://github.com/IsaiahJMurray/Desk-Projector](https://github.com/IsaiahJMurray/Desk-Projector)
- Demo video (placeholder): _Coming soon_