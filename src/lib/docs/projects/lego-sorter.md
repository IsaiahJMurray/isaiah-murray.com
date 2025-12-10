---
title: Lego Sorter
subtitle: Neural-network-powered classifier that identifies LEGO bricks from images
  using configurable convolutional models. Built for students and ML tinkerers, it
  provides a `train.py` CLI to train, benchmark, and log experiments on both handcrafted
  and randomly generated TensorFlow architectures.
slug: lego-sorter
date: '2024-04-13'
updated: '2024-04-20'
tags:
- python
- simulation
- lora
- ml
maturity: production
featured: false
visibility: public
heroImage: /generated/logos/lego-sorter.png
---
## Overview

Lego-Sorter is an image classification project that uses convolutional neural networks to identify LEGO pieces from images. I built it as an exploratory project for Harvard Extension’s CSCI E-80 (CS50 AI), focusing on experimenting with CNN architectures, data pipelines, and model evaluation at scale.

The core of the project is a flexible training script that can either use a baseline CNN architecture or automatically generate randomized TensorFlow models and benchmark their performance on a dataset of LEGO brick images.

## Role & Context

I designed and implemented this project end-to-end:

- Set up the TensorFlow environment and project structure.
- Built the image loading and preprocessing pipeline.
- Implemented the training script with configurable hyperparameters and automated result capture.
- Developed a random model generator to explore different CNN architectures.
- Ran and analyzed many training runs to understand the trade-offs between model depth, regularization, and training time.

This was done in the context of an academic exploratory assignment where the goal was not just to “get a good model,” but to learn how different architectural choices affect performance.

## Tech Stack

- Python
- TensorFlow / Keras
- NumPy
- Pandas
- Matplotlib
- OpenCV (in deprecated preprocessing pipeline)
- Conda (for environment management)

## Problem

I wanted to answer two related questions:

1. How can I build a robust pipeline to train CNNs for LEGO piece classification from directory-based image datasets?
2. Given the same dataset and training setup, how do different CNN architectures (depth, filter sizes, pooling, dropout, dense layers) impact classification accuracy, loss, and training efficiency?

The assignment provided the high-level task (image classification with CNNs), but left model design and experimentation up to me. I needed tooling that made it easy to:

- Load and split LEGO image data consistently.
- Define and train many different CNNs with minimal manual code changes.
- Systematically save and compare results across runs.

## Approach / Architecture

I structured the project around a single, configurable training entry point and a supporting set of utilities:

- **Data loading & preprocessing**  
  - Use `tf.keras.utils.image_dataset_from_directory` to load images directly from a directory structure where each subfolder corresponds to a LEGO class.
  - Apply a fixed image size (180×180×3) defined in `constants.py`.
  - Split into training and validation sets with a fixed validation split and seed for reproducibility.
  - Use `.cache()`, `.shuffle()`, and `.prefetch(AUTOTUNE)` to optimize data input throughput.

- **Model architecture exploration**
  - Implement `generate_random_model` in `model_randomization.py` to build random CNNs (1–5 conv layers, optional pooling, optional dropout, 1–3 dense layers).
  - Keep the final dense layer size fixed (16 outputs) to match the dataset’s number of classes, using logits + SparseCategoricalCrossentropy.

- **Training orchestration**
  - Encapsulate training and logging in `run_training_and_save_all` within `train.py`.
  - Compile models with Adam, track loss and accuracy, and evaluate on the validation set.
  - Compute a custom “effectiveness” metric that combines loss, accuracy, and training duration.

- **Experiment tracking**
  - Generate a unique run directory name including timestamp, epochs, loss, accuracy, and effectiveness.
  - Save model artifacts (architecture, weights), training history (CSV), and summary statistics to disk for later analysis.

Earlier, I experimented with a custom CSV- and OpenCV-based preprocessing pipeline (in `deprecated/`), but ultimately moved to the directory-based image loader to simplify and standardize the flow.

## Key Features

- Randomized CNN architecture generation for automated model exploration.
- Reproducible training/validation split with configurable image size and batch size.
- Optimized TensorFlow `tf.data` pipeline with caching, shuffling, and prefetching.
- Central `train.py` script with CLI options for epochs, batch size, data directory, run naming, and verbosity.
- Automatic per-run result directories containing:
  - Model files and weights
  - Training history (loss/accuracy curves)
  - Final loss, accuracy, and custom effectiveness score
- Support for both “baseline” and “random” models to compare hand-designed vs. auto-generated architectures.

## Technical Details

### Data pipeline

I defined constants in `constants.py`:

```python
HEIGHT = 180
WIDTH = 180
DEPTH = 3
VALIDATION_SPLIT = 0.2
```

In `train.py`, I used these to create TensorFlow datasets:

```python
training_data = tf.keras.utils.image_dataset_from_directory(
    data_dir,
    validation_split=VALIDATION_SPLIT,
    subset="training",
    seed=123,
    image_size=(HEIGHT, WIDTH),
    batch_size=batch_size,
)

validation_data = tf.keras.utils.image_dataset_from_directory(
    data_dir,
    validation_split=VALIDATION_SPLIT,
    subset="validation",
    seed=123,
    image_size=(HEIGHT, WIDTH),
    batch_size=batch_size,
)
```

To improve throughput and stability during training:

```python
AUTOTUNE = tf.data.AUTOTUNE

training_data = training_data.cache().shuffle(1000).prefetch(buffer_size=AUTOTUNE)
validation_data = validation_data.cache().prefetch(buffer_size=AUTOTUNE)
```

### Random model generator

The `generate_random_model` function builds a Keras `Sequential` model with randomized structure:

- Initial `Rescaling(1./255)` layer for normalization.
- A random number of convolutional blocks (1–5), each with:
  - Filters as powers of two: `filters = 2 ** random.randint(0, 7)` (1–128).
  - Kernel size randomly chosen from `[3, 5]`.
  - Padding randomly chosen from `['same', 'valid']`.
  - Optional `MaxPooling2D` with `pool_size` of 2 or 3, added with 50% probability.
- Flatten layer.
- Optional `Dropout` (up to 0.5 rate), added with 50% probability.
- 1–3 dense layers with 64, 128, or 256 units each and ReLU activation.
- Final dense layer with 16 outputs (logits over 16 LEGO classes).

This allowed me to quickly generate a diverse set of CNN architectures and compare their outcomes using the same dataset and training procedure.

### Training & evaluation

The core training function `run_training_and_save_all`:

- Accepts:
  - A compiled or uncompiled Keras model.
  - Run configuration: `base_run_dir`, `epochs`, `batch_size`, `data_dir`, `verbose`, `name`.
- Compiles the model with:

```python
model.compile(
    optimizer='adam',
    loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
    metrics=['accuracy'],
)
```

- Trains with:

```python
history = model.fit(
    training_data,
    validation_data=validation_data,
    epochs=epochs,
)
```

- Measures wall-clock training time and computes a custom effectiveness score:

```python
def model_effectiveness(loss, accuracy, duration):
    correctness = (1 - loss) * accuracy
    return correctness * 100 / (duration ** 0.25)
```

I used this heuristic metric to balance performance and speed when comparing models: high accuracy and low loss are rewarded, while longer training times are mildly penalized.

- Evaluates on the validation set via `model.evaluate`.
- Logs a human-readable report and writes all artifacts into a timestamped directory under `train_results`.

Training history is saved as CSV, making it easy to later plot learning curves or aggregate statistics across runs.

### Experiment history

I ran a large batch of experiments, both with:

- Manually tuned architectures.
- Randomized architectures using `generate_random_model`.

Some runs achieved:

- Validation accuracies in the ~0.90–0.95 range.
- Loss values typically in the 0.23–0.5 range for higher-performing models.
- Outlier runs (e.g., with pathological random configurations) with very poor accuracy and high loss, which were helpful to see the downside of some model choices.

All of these runs were captured under `train_results/`, with subfolders like:

- `R_params/` and `R_params_2/` for randomized model configurations.
- Timestamped folders that include epochs, loss, accuracy, and effectiveness in the directory name (e.g., `train_19_20-52-23_epochs-20_loss-0.24_accuracy-0.9_E-27.22`).

## Results

- Built a reusable, configurable training script for image classification tasks based on directory-structured datasets.
- Achieved strong validation performance on LEGO classification:
  - Multiple runs with validation accuracy in the 0.90–0.95 range.
  - Best runs balancing accuracy and training time using the “effectiveness” metric.
- Demonstrated that:
  - Deeper or more complex random models do not always outperform simpler ones.
  - Proper data pipeline configuration (caching, shuffling, prefetching) makes a tangible difference in training stability and speed.
- Produced a library of logged experiments that I can revisit to study architectural choices and hyperparameter sensitivities.

## Lessons Learned

- **Random search is powerful but noisy.** Randomly sampling architectures uncovered some surprisingly strong models, but also many weak ones; good logging was essential to identify and reproduce the best runs.
- **Data pipeline optimizations matter.** Using the `tf.data` APIs correctly (cache/prefetch/shuffle) significantly improved throughput and reduced training hiccups compared to my initial, more manual pipeline.
- **Standard tools beat ad-hoc preprocessing for most cases.** My original OpenCV- and CSV-based pipelines (now in `deprecated/`) gave way to `image_dataset_from_directory`, which was simpler, more maintainable, and less error-prone for this use case.
- **Metrics should reflect real constraints.** Accuracy alone wasn’t enough; integrating training time into the effectiveness score gave a more realistic picture of “good” models under limited compute.
- **Reproducible environments pay off.** Pinning versions in `environment.yml` and `requirements.txt` saved time when revisiting the project and ensured that experiments could be rerun consistently.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/Lego-Sorter)
- [Live Demo (placeholder)](https://example.com/lego-sorter-demo)