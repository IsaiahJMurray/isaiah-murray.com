---
title: Lego Sorter
subtitle: A configurable CNN-based image classifier that learns to distinguish between
  different LEGO pieces from photos. Built for students and ML practitioners exploring
  TensorFlow pipelines, it supports randomized architecture generation, automated
  training/evaluation, and rich logging of run histories for comparative experiments.
slug: lego-sorter
date: '2024-04-13'
updated: '2024-04-20'
tags:
- python
- simulation
- ml
maturity: production
featured: false
visibility: public
heroImage: /generated/logos/lego-sorter.png
---
## Overview

Lego-Sorter is an image-classification project that trains convolutional neural networks to recognize different LEGO brick types from photos. The goal of the project was to explore neural architecture design, automated model search, and experiment tracking in a constrained, real-world dataset, as part of a CSCI E-80 exploratory assignment.

Rather than handcrafting a single CNN, I built a small framework that can generate, train, and evaluate many randomized TensorFlow models on a LEGO image dataset, and persist detailed results for later analysis.

## Role & Context

I owned this project end-to-end:

- Collected and preprocessed LEGO brick images.
- Designed the training pipeline and evaluation metric.
- Implemented the model-randomization utility.
- Built the experiment harness that runs, logs, and saves each training run.

This was done as an exploratory assignment in Harvard’s CS50 AI (CSCI E-80), focused on gaining intuition about CNN behavior and hyperparameter sensitivity on a computer-vision task.

## Tech Stack

- Python
- TensorFlow / Keras
- NumPy / Pandas
- Matplotlib
- scikit-learn
- OpenCV
- Pillow
- Conda (environment management)

## Problem

The core problem was: how can I design and compare different CNN architectures for LEGO brick classification without laboriously hand-tuning each configuration?

Specifically, I wanted to:

- Classify LEGO pieces into multiple classes from RGB images.
- Explore how architectural choices (number of conv layers, filters, kernel sizes, pooling, dense layers, dropout) affect accuracy, training time, and generalization.
- Automate experiment logging so runs are reproducible and comparable.

The constraints were:

- A relatively small, fixed image dataset.
- GPU resources available but limited training time.
- Need for a repeatable environment that others could set up (course requirement).

## Approach / Architecture

I split the project into three main pieces:

1. **Data pipeline**
   - Use `tf.keras.utils.image_dataset_from_directory` to load images from a directory-structured dataset.
   - Apply a train/validation split via `validation_split` and `subset`, with a fixed seed for reproducibility.
   - Standardize input shape using global constants (`HEIGHT`, `WIDTH`, `DEPTH`) and leverage dataset caching, shuffling, and prefetching.

2. **Model search via randomization**
   - Implement `generate_random_model` to programmatically build CNNs with randomized hyperparameters (number of conv layers, filters, kernel sizes, pooling, dense layers, dropout).
   - Use a consistent input pipeline and loss function (sparse categorical cross-entropy with logits) so architectures are directly comparable.

3. **Training and experiment tracking**
   - Implement `run_training_and_save_all` to:
     - Train a given model.
     - Evaluate it on the validation set.
     - Compute a custom “effectiveness” score combining loss, accuracy, and training duration.
     - Persist model artifacts, weights, training curves, scalar metrics, and history CSVs into a timestamped run directory.

This setup allowed me to repeatedly generate and train new architectures, then analyze runs offline to see which designs offered the best trade-offs.

## Key Features

- Random CNN architecture generator for LEGO image classification.
- Reproducible data loading with standardized image dimensions and validation split.
- Custom effectiveness metric combining accuracy, loss, and training time.
- Automated run directory creation with embedded hyperparameter/metric metadata in the path.
- Persisted model artifacts (full model + weights) for later reuse or analysis.
- Training history export to CSV for plotting and offline comparison.
- Conda environment definition to make the entire stack reproducible on other machines.

## Technical Details

### Data pipeline

I centralized image dimensions and validation split in `constants.py`:

```python
HEIGHT = 180
WIDTH = 180
DEPTH = 3
VALIDATION_SPLIT = 0.2
```

In `train.py`, I used `image_dataset_from_directory` to build datasets directly from a folder hierarchy:

```python
training_data = tf.keras.utils.image_dataset_from_directory(
    data_dir,
    validation_split=VALIDATION_SPLIT,
    subset="training",
    seed=123,
    image_size=(HEIGHT, WIDTH),
    batch_size=batch_size
)

validation_data = tf.keras.utils.image_dataset_from_directory(
    data_dir,
    validation_split=VALIDATION_SPLIT,
    subset="validation",
    seed=123,
    image_size=(HEIGHT, WIDTH),
    batch_size=batch_size
)
```

To keep the GPU busy and avoid I/O bottlenecks, I applied:

```python
AUTOTUNE = tf.data.AUTOTUNE
training_data = training_data.cache().shuffle(1000).prefetch(buffer_size=AUTOTUNE)
validation_data = validation_data.cache().prefetch(buffer_size=AUTOTUNE)
```

Earlier in the project (now in `deprecated/`), I had a more manual pipeline using CSV-based file lists, `tf.data.Dataset.from_tensor_slices`, and `tf.py_function` to load and preprocess images. I moved away from that after the image-directory API proved cleaner and less error-prone.

### Model randomization

The heart of the architecture exploration lives in `model_randomization.py`:

```python
def generate_random_model(input_shape=(HEIGHT, WIDTH, DEPTH)):
    model = tf.keras.Sequential()
    model.add(tf.keras.layers.Rescaling(1./255, input_shape=input_shape))
    
    # Randomly decide the number of convolutional layers
    num_conv_layers = random.randint(1, 5)
    
    for _ in range(num_conv_layers):
        filters = 2 ** random.randint(0, 7)     # 1–128 filters
        kernel_size = random.choice([3, 5])
        padding = random.choice(['same', 'valid'])
        model.add(tf.keras.layers.Conv2D(filters, kernel_size, padding=padding, activation='relu'))
        
        if random.random() < 0.5:
            pool_size = random.choice([2, 3])
            model.add(tf.keras.layers.MaxPooling2D(pool_size=pool_size)
    ...
```

Key design decisions:

- Always start with a `Rescaling(1./255)` layer so raw pixel values are normalized.
- Vary:
  - Number of conv layers: 1–5.
  - Filters: powers of 2 up to 128.
  - Kernel size: 3 or 5.
  - Pooling presence and size.
  - Dense layer count (1–3) and width (64/128/256).
  - Optional dropout (0–0.5 rate).
- Use a fixed output dimension (`Dense(16)`) corresponding to the number of LEGO classes in the dataset; loss uses `from_logits=True`.

This generator gives a wide but still reasonable search space that is quick to experiment with in a course context.

### Training and evaluation

In `train.py`, I wrapped training, evaluation, and logging in `run_training_and_save_all`:

```python
model.compile(
    optimizer='adam',
    loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
    metrics=['accuracy']
)

start_time = time.time()
history = model.fit(
    training_data,
    validation_data=validation_data,
    epochs=epochs
)
training_time = time.time() - start_time

loss, accuracy = model.evaluate(validation_data)
```

I introduced a custom “effectiveness” scalar to compare runs that have different training times:

```python
def model_effectiveness(loss, accuracy, duration):
    correctness = (1 - loss) * accuracy
    return correctness * 100 / (duration ** 0.25)
```

This is not a formal metric, but it helped me reason about “bang for the buck”: high accuracy and low loss are rewarded, while excessively long training runs are softly penalized.

### Experiment tracking and artifacts

Each run optionally writes to a `base_run_dir`:

- I build a directory name that embeds key metadata:

  - Run name (CLI argument `--name`).
  - Timestamp.
  - Epoch count.
  - Final validation loss.
  - Final validation accuracy.
  - Effectiveness score.

  (e.g. `train_19_20-49-55_epochs-10_loss-0.3_accuracy-0.89_E-28.77`)

- Inside each run directory I save:
  - The trained model and separate weights.
  - A textual summary (`model.summary()` redirected to a file).
  - `loss_accuracy.txt` containing final metrics.
  - `training_history.csv` containing the full epoch-wise history (`loss`, `accuracy`, `val_loss`, `val_accuracy`).

These exports made it easy to inspect, plot, and compare multiple runs. For example, some of the better randomized models reached:

- Validation accuracy around 0.94–0.95 with moderate loss (~0.40–0.42).
- More conservative architectures yielding ~0.90+ accuracy with lower loss.

### Environment & reproducibility

To ensure the project is reproducible, I defined an explicit Conda environment in `environment.yml`:

- Pins Python to 3.9 and TensorFlow to 2.10.1 with matching CUDA and cuDNN versions.
- Lists all relevant Python dependencies under `pip:`.

Users can recreate the environment via:

```bash
conda env create -f environment.yml
conda activate tf
```

Alternatively, `requirements.txt` can be used directly with `pip` if Conda is not preferred.

## Results

Across multiple randomized architectures:

- Many models achieved **~88–92%** validation accuracy after 10 epochs.
- Several high-capacity models achieved **~94–95%** validation accuracy, at the cost of longer training and some overfitting indications (training loss near zero, validation loss plateauing).
- Effective architectures tended to:
  - Use 2–4 convolutional layers.
  - Moderate filter counts (often in the 32–64 range per layer).
  - Include some pooling and at least one dense layer with 128–256 units.

Using the custom effectiveness metric, I could see that the “best” model was not always the one with the highest raw accuracy; some smaller, faster models scored competitively once runtime was factored in.

The framework successfully generated and evaluated dozens of distinct CNN architectures, and the saved histories and metrics gave me a clear picture of how design choices influenced performance.

## Lessons Learned

- **Random search is surprisingly strong.** Even a simple randomized generator often found architectures within a few percentage points of the best models I would have hand-designed for this dataset.
- **Experiment tracking matters.** Automatically saving models, metrics, and training histories turned this from a throwaway assignment into something I could revisit and reason about.
- **Overfitting is easy with small image datasets.** Some models drove training loss essentially to zero while validation loss flattened or worsened, emphasizing the importance of regularization, data augmentation (a next-step improvement), and early stopping.
- **Data APIs evolve.** Moving from a CSV + `tf.py_function` pipeline to `image_dataset_from_directory` dramatically simplified code and reduced bugs.
- **Environment pinning saves time.** Defining a full Conda environment with matching CUDA/cuDNN eliminated the usual TensorFlow compatibility friction, especially for others running the project.

## Links

- GitHub Repository: [https://github.com/IsaiahJMurray/Lego-Sorter](https://github.com/IsaiahJMurray/Lego-Sorter)
- Live Demo (placeholder): _TBD – link to hosted demo or notebook if/when available_