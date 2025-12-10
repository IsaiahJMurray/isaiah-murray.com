---
title: Rowing Form Detection
subtitle: "A computer-vision \u201Cdigital coach\u201D that analyzes rowing videos\
  \ and scores technique, aimed at athletes who want objective, frame-by-frame feedback\
  \ on their form. Uses Google Cloud Video Intelligence for person detection and pose\
  \ landmarks, forming the backbone for neural-network\u2013driven form grading and\
  \ automated coaching cues."
slug: rowing-form-detection
date: '2024-06-07'
updated: '2024-06-09'
tags: []
maturity: prototype
featured: false
visibility: public
heroImage: /generated/logos/rowing-form-detection.png
---
## Overview

Rowing-Form-Detection is an experiment in using computer vision as a “digital coach” to analyze my rowing technique. I built a small pipeline around Google Cloud Video Intelligence to detect people and pose landmarks in rowing videos, with the long‑term goal of grading form and providing targeted feedback on stroke quality.

This project is an early prototype: it proves out the ability to ingest video, detect my body position over time, and expose enough structured data to eventually compute metrics like back angle, leg drive sequence, and consistency across strokes.

## Role & Context

I designed and implemented this project end‑to‑end:

- Defined the goal of using ML‑driven analysis to improve my rowing technique.
- Selected cloud video analysis tools and wired them into a simple Python workflow.
- Implemented the initial analysis script and experimented with sample rowing footage.
- Evaluated the feasibility of extending the output into form grading and coaching feedback.

This is a personal project focused on learning and experimentation rather than production readiness.

## Tech Stack

- Python
- Google Cloud Video Intelligence API
- Google Cloud Storage (for hosting input videos)
- Command‑line / local execution environment

## Problem

I wanted a way to get objective, frame‑by‑frame feedback on my rowing form without needing a coach to review every video. Specifically, I needed:

- Automated detection of my body and pose over the entire video.
- Access to pose landmarks (keypoints) rather than just bounding boxes.
- A structured output format that could later be used to compute movement metrics (angles, symmetry, timing).

The challenge was to move beyond “simple video playback” and extract enough reliable motion data to build a digital rowing coach over time.

## Approach / Architecture

I started by leveraging Google Cloud’s Video Intelligence API, focusing on its person detection and pose landmark capabilities. The high‑level flow is:

1. Upload a rowing video to a Google Cloud Storage bucket.
2. Run a Python script that calls the Video Intelligence API with `PERSON_DETECTION` enabled, including pose landmarks and attributes.
3. Wait for the long‑running annotation operation to complete.
4. Iterate through the results:
   - For each detected person and track, traverse timestamped objects.
   - For each timestamp, log the pose landmarks (x, y, z) and metadata.
5. Use the console output (and potentially later, structured output) as the basis for calculating form‑related metrics.

At this stage, the architecture is intentionally simple: a single script encapsulates the API call and result traversal, which I treat as the “feature extraction” phase of a larger coaching system I plan to build.

## Key Features

- Person detection on rowing videos using Google Cloud Video Intelligence.
- Pose landmark extraction (x, y, z coordinates) for key body points.
- Time‑aligned tracking of pose across the video timeline.
- Configurable request to include bounding boxes and attributes.
- Console‑based inspection of detected keypoints to validate data quality.
- Extensible foundation for future form scoring and feedback logic.

## Technical Details

The core of the project is a Python script (`analyze-video`) that wraps the Google Cloud Video Intelligence client:

- I instantiate a `VideoIntelligenceServiceClient` from `google.cloud.videointelligence_v1`.
- I request the `PERSON_DETECTION` feature with a `PersonDetectionConfig` that:
  - `include_bounding_boxes=True`
  - `include_pose_landmarks=True`
  - `include_attributes=True`

This configuration ensures I get both spatial context (where the rower is in the frame) and fine‑grained pose information.

The workflow:

1. **Request construction**

   ```python
   features = [videointelligence.Feature.PERSON_DETECTION]
   request = videointelligence.AnnotateVideoRequest(
       input_uri=video_uri,
       features=features,
       person_detection_config=videointelligence.PersonDetectionConfig(
           include_bounding_boxes=True,
           include_pose_landmarks=True,
           include_attributes=True,
       ),
   )
   ```

2. **Long‑running operation**

   ```python
   operation = client.annotate_video(request=request)
   result = operation.result(timeout=600)
   ```

3. **Result traversal**

   I walk through the nested response structure:

   - `result.annotation_results`
   - `person_detection_annotations`
   - `tracks`
   - `timestamped_objects`

   For each `timestamped_object` I compute the timestamp in seconds:

   ```python
   t = timestamped_object.time_offset
   ts_seconds = t.seconds + t.nanos / 1e9
   ```

   Then I iterate over `pose_landmarks`:

   ```python
   for keypoint in timestamped_object.pose_landmarks:
       print(
           f" - Landmark {keypoint.name}: "
           f"(x: {keypoint.x}, y: {keypoint.y}, z: {keypoint.z})"
       )
   ```

The coordinates are normalized floats (0–1 range in image space) with depth information, which makes them suitable for later conversion into angles and distances, such as hip hinge angle or shoulder symmetry.

This script currently prints to stdout for rapid prototyping. The next iteration will serialize this data (e.g., JSON or CSV) to feed into analytic and visualization tools.

## Results

- Verified that Google Cloud Video Intelligence can reliably detect my body and provide a full set of pose landmarks across rowing strokes.
- Established a working pipeline from raw rowing video (in GCS) to time‑stamped pose data.
- Confirmed that the API output is sufficiently detailed to support future metrics like joint angles and movement sequencing.

While there is no production “grading” system yet, this prototype validates the technical foundation needed for a digital rowing coach.

## Lessons Learned

- Cloud video analysis APIs significantly reduce the complexity of building pose‑aware applications; the primary challenge moves to post‑processing and interpretation.
- Working with long‑running video annotation operations requires careful handling of timeouts and result traversal but is manageable with a clean, layered script.
- Pose landmarks alone do not equal coaching insight—designing meaningful metrics (e.g., ideal back angle ranges, catch/finish timing) will be the main value‑add in subsequent iterations.
- Structuring output early (beyond console prints) is important to support experimentation with visualization and form‑grading algorithms.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/Rowing-Form-Detection)
- Demo: _TBD_