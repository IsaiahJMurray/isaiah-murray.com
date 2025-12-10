---
title: Digikeydisplay
subtitle: A tiny Python tool that turns DigiKey cart CSVs into a treemap so you can
  instantly see where your budget is going. Ideal for hardware engineers and hobbyists
  optimizing BOM costs, it uses pandas, matplotlib, and squarify to visualize line-item
  spend by description.
slug: digikeydisplay
date: '2024-09-27'
updated: '2024-09-27'
tags:
- python
- visualization
maturity: production
featured: false
visibility: public
heroImage: /generated/logos/digikeydisplay.png
---
## Overview

DigikeyDisplay is a tiny, single-purpose tool I built to visualize DigiKey shopping cart exports as a treemap. Given a DigiKey cart `.csv` file, the script parses each line item and produces a matplotlib treemap where the area of each rectangle represents the total cost of that item (unit price × quantity). This makes it easy to see at a glance which components dominate the overall BOM cost.

## Role & Context

I built this project as a personal utility while preparing a bill of materials for electronics work. DigiKey’s cart interface is great for managing parts, but it doesn’t make it obvious which line items are driving cost. I wanted a quick, disposable script that I could point at a cart export and immediately get a visual breakdown of spending.

I acted as the sole developer, handling everything from CSV parsing and data transformation to visualization and basic usability decisions (e.g., labels, layout, and figure sizing).

## Tech Stack

- Python
- pandas
- matplotlib
- squarify (treemap layout library)

## Problem

When working with a DigiKey cart that contains dozens or hundreds of line items, it’s hard to answer questions like:

- Which parts account for most of the cost?
- Are there any surprisingly expensive items hiding in the list?
- How does cost distribute across the cart at a glance?

DigiKey’s native tools are text- and table-based, which makes it tedious to gain this kind of high-level insight. I needed a way to transform a raw `.csv` export into a visual summary in seconds, without setting up a full analytics stack.

## Approach / Architecture

I chose the simplest possible architecture: a single Python script that reads a CSV, computes item totals, and passes them into a treemap layout.

1. **Input**: A DigiKey cart exported as a CSV file.
2. **Processing**:
   - Load the CSV into a pandas DataFrame.
   - Extract each line’s description.
   - Compute total cost per line as `Unit Price * Quantity`.
3. **Visualization**:
   - Use `squarify` to generate a treemap based on the per-line total costs.
   - Render the result with matplotlib, labeling each rectangle with its description.
4. **Output**:
   - A fullscreen treemap plot that quickly reveals cost distribution across the cart.

There is intentionally no additional infrastructure: no CLI framework, no configuration files, and no external dependencies beyond the plotting and data libraries. The goal is fast time-to-insight with minimal friction.

## Key Features

- Visual treemap of DigiKey cart items sized by total cost.
- Automatic calculation of line-item totals from unit price and quantity.
- Direct use of item descriptions as labels for quick identification.
- Simple, single-file script that’s easy to run and modify.
- Sensible default figure size for readable, presentation-ready plots.

## Technical Details

The core logic lives in `main.py` and is organized procedurally for clarity:

- **CSV ingestion**

  ```python
  import pandas as pd

  df = pd.read_csv('2024-09-16T091030.csv')
  ```

  The script expects a standard DigiKey cart export and relies on specific column names like `Description`, `Unit Price`, and `Quantity`.

- **Cost computation**

  ```python
  items = df['Description']
  prices = df['Unit Price'] * df['Quantity']
  ```

  `prices` is a numeric sequence representing the total spend per line item. This becomes the `sizes` parameter for the treemap.

- **Treemap generation**

  ```python
  import matplotlib.pyplot as plt
  import squarify

  plt.figure(figsize=(12, 8))
  squarify.plot(sizes=prices, label=items, alpha=.8)
  plt.title('Digikey Cart Treemap')
  plt.axis('off')
  plt.show()
  ```

  - `squarify.plot` handles the rectangle layout so that larger totals get proportionally larger areas.
  - `alpha` provides slight transparency to help with overlapping labels and visual comfort.
  - The axis is hidden to keep the focus on the treemap itself.

The `.gitignore` excludes virtual environments and CSVs to keep the repository focused on code rather than local data.

## Results

- I can now export any DigiKey cart and get a visual breakdown of cost distribution in a few seconds.
- The treemap immediately highlights a small number of high-cost items that dominate total spend, which is much less obvious from a raw table.
- The simplicity of the script makes it easy to adapt—for example, to group items by category or manufacturer in future iterations.

## Lessons Learned

- Even a very small amount of code can dramatically improve usability over a raw CSV, especially when paired with the right visualization.
- Libraries like `squarify` make it trivial to experiment with nonstandard visualizations (like treemaps) without writing layout algorithms from scratch.
- Enforcing consistent column naming and file formats is important; real-world CSV exports can change structure, so future enhancements should include simple validation and error handling.
- Keeping the script minimal encourages experimentation—I’m more likely to extend or repurpose it because there’s almost no complexity overhead.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/DigikeyDisplay)
- [Live Demo](#)