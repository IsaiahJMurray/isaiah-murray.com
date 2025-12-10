---
title: Rowing Form Detection
subtitle: "Neural-network-powered \u201Cdigital coach\u201D that analyzes rowing videos\
  \ to grade form and surface detailed pose feedback. Uses Google Cloud Video Intelligence\
  \ person detection and pose landmarks to extract keypoints and timestamps, forming\
  \ the foundation for automated technique assessment and real-time coaching insights."
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

Rowing-Form-Detection is an experiment in using machine learning as a “digital rowing coach.” I wanted a system that could analyze footage of my rowing sessions, detect my body pose over time, and eventually provide objective feedback on my technique. This initial iteration focuses on extracting person and pose information from video using Google Cloud’s Video Intelligence API as the foundation for more advanced form grading models.

## Role & Context

I built this project independently as a personal R&D effort to blend my interest in rowing with practical experience in applied computer vision. The primary goals were to:

- Explore end-to-end video analysis, from raw footage to structured pose data.
- Prototype a pipeline that could later support scoring, feedback, and coaching logic.
- Learn and evaluate Google Cloud’s Video Intelligence API for person and pose detection.

## Tech Stack

- Python
- Google Cloud Video Intelligence API
- Google Cloud Storage (for video input)
- Command-line tooling / scripts

## Problem

Rowing technique is hard to self-evaluate, especially without constant access to a coach. Filming sessions helps, but manually scrubbing through video and trying to judge posture, timing, and stroke consistency is tedious and subjective.

I wanted a way to:

- Automatically detect my body in rowing videos.
- Extract pose landmarks (e.g., shoulders, hips, knees) frame-by-frame.
- Build a machine-readable representation of my motion that could later be used for form grading and feedback.

## Approach / Architecture

I designed a simple, cloud-centric pipeline:

1. **Video capture & upload**  
   I record rowing sessions and upload the video files to a Google Cloud Storage bucket.

2. **Video analysis script**  
   A Python script calls the Google Cloud Video Intelligence API with `PERSON_DETECTION` enabled and pose landmarks configured. The script runs asynchronously and waits for the long-running operation to finish.

3. **Pose and person extraction**  
   The API returns a structured response with detected persons, tracks, timestamps, and pose landmarks (x, y, z coordinates for key body points). I iterate over these annotations to inspect the raw pose data and understand how consistent and detailed it is.

4. **Foundation for future grading**  
   In this first version, I primarily log and inspect the results. The data schema (tracks, timestamps, keypoints) is intentionally designed to be a foundation for future steps like calculating joint angles, timing phases of the stroke, and scoring technique against a reference.

## Key Features

- Person detection on rowing videos using Google Cloud Video Intelligence.
- Extraction of detailed pose landmarks (3D-ish x, y, z coordinates).
- Timestamped tracking of detected persons across the video.
- Configurable Google Cloud Storage URI for input videos.
- Scripted workflow that can be integrated into a larger analysis pipeline.

## Technical Details

The core logic lives in a Python script that:

1. **Initializes the Video Intelligence client**

   ```python
   from google.cloud import videointelligence_v1 as videointelligence

   client = videointelligence.VideoIntelligenceServiceClient()
   ```

2. **Configures the request for person and pose detection**

   I use the `PERSON_DETECTION` feature with a `PersonDetectionConfig` that asks for bounding boxes, pose landmarks, and attribute metadata:

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

3. **Handles long-running video annotation**

   Video analysis is asynchronous. I trigger the operation and block until the result is ready (with a generous timeout for longer clips):

   ```python
   operation = client.annotate_video(request=request)
   result = operation.result(timeout=600)
   ```

4. **Iterates through annotation results**

   The response structure is hierarchical: annotation results → person detection annotations → tracks → timestamped objects → pose landmarks. I walk this tree and log the most relevant parts:

   ```python
   for annotation in result.annotation_results:
       for person_detection in annotation.person_detection_annotations:
           print(f"Person detected with confidence: {person_detection.confidence}")

           for track in person_detection.tracks:
               for timestamped_object in track.timestamped_objects:
                   ts = (
                       timestamped_object.time_offset.seconds
                       + timestamped_object.time_offset.nanos / 1e9
                   )
                   print(f"Timestamp: {ts} seconds")

                   for keypoint in timestamped_object.pose_landmarks:
                       print(
                           f" - Landmark {keypoint.name}: "
                           f"(x: {keypoint.x}, y: {keypoint.y}, z: {keypoint.z})"
                       )
   ```

This structure gives me a detailed time series of body landmarks that I can later convert into more meaningful rowing metrics (e.g., back angle at catch/finish, knee extension timing).

## Results

- Successfully implemented an end-to-end pipeline from cloud-hosted video to structured pose landmark data.
- Verified that the Video Intelligence API can reliably detect a rower and output a rich set of pose points suitable for further kinematic analysis.
- Established a clear path for the next phase: transforming raw landmark sequences into domain-specific rowing metrics and automated coaching feedback.

## Lessons Learned

- Cloud video APIs provide a fast path to high-quality pose data without training custom models, which is ideal for early prototypes.
- Understanding the structure and granularity of the returned annotations is critical before designing downstream analytics or grading logic.
- Long-running video analysis workflows benefit from robust timeout handling and clear logging, especially when experimenting with different video lengths and resolutions.
- Starting with a simple script and clear data inspection was the right way to de-risk the more complex “digital coach” logic I plan to build next.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/Rowing-Form-Detection)
- Demo (coming soon)