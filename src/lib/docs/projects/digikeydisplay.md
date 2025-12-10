---
title: Digikeydisplay
subtitle: Treemap visualizer that turns DigiKey cart CSVs into a quick, glanceable
  cost breakdown of your components. Built with Python, pandas, matplotlib, and squarify
  to help electronics designers see which parts dominate their BOM spend.
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

DigikeyDisplay is a tiny utility I built to quickly visualize the cost distribution of components in a DigiKey cart. It reads a DigiKey-exported `.csv` cart file and renders a treemap using matplotlib and squarify, making it immediately obvious which parts dominate the total spend.

## Role & Context

I created this project as a small, focused tool to support electronics work, where I often wanted a fast visual sense of where money was going in a bill of materials. Existing workflows required manual inspection of line items; I wanted a one-command visualization that I could run locally on any exported DigiKey cart.

I acted as the sole developer, handling everything from CSV parsing to data aggregation and visualization.

## Tech Stack

- Python
- pandas
- matplotlib
- squarify

## Problem

When working on electronics projects, I regularly export DigiKey carts to CSV to review parts and prices. However, scanning through line items in a spreadsheet makes it hard to:

- See which components contribute most to the total cost
- Spot expensive outliers quickly
- Communicate cost structure to collaborators at a glance

I needed a lightweight, scriptable visualization that could transform a DigiKey cart CSV into a clear cost breakdown without any additional tooling or setup overhead.

## Approach / Architecture

I took a minimal, script-first approach:

1. Use `pandas` to read the DigiKey cart CSV and extract the relevant columns: description, unit price, and quantity.
2. Compute total line-item cost as `unit_price * quantity` for each row.
3. Feed the resulting series of costs and labels (descriptions) into `squarify` to build a treemap.
4. Render the treemap via `matplotlib`, apply a simple title, and hide axes for a cleaner presentation.

The entire workflow is contained in a single `main.py` script, making it easy to adapt or extend for other BOM or cart formats.

## Key Features

- Visual treemap of DigiKey cart costs
- Automatic cost calculation (`Unit Price * Quantity`) per line item
- Uses part descriptions directly as treemap labels
- Simple, single-file implementation easy to customize
- CSV files ignored via `.gitignore` to keep carts out of version control

## Technical Details

The core logic lives in `main.py` and follows this sequence:

- **Data loading**  
  I read the DigiKey cart file with:

  ```python
  df = pd.read_csv('2024-09-16T091030.csv')
  ```

  This assumes the CSV has at least the columns `Description`, `Unit Price`, and `Quantity`, which are standard in DigiKey exports.

- **Data extraction and transformation**  
  I map the CSV columns into variables for clarity:

  ```python
  items = df['Description']
  prices = df['Unit Price'] * df['Quantity']
  ```

  `prices` becomes the list of rectangle sizes in the treemap, representing the total spend per line item.

- **Treemap generation**  
  I set up the figure and invoke `squarify`:

  ```python
  plt.figure(figsize=(12, 8))
  squarify.plot(sizes=prices, label=items, alpha=.8)
  plt.title('Digikey Cart Treemap')
  plt.axis('off')
  plt.show()
  ```

  - `sizes=prices` controls the relative area of each rectangle.
  - `label=items` uses each item description as the label.
  - `alpha=.8` gives a slightly transparent fill for visual softness.
  - `axis('off')` removes chart clutter and focuses attention on the treemap itself.

- **Repository hygiene**  
  I added a `.gitignore` that excludes `.csv` files and `.venv/` so that:

  - Personal or sensitive cart data doesn’t enter version control.
  - Local virtual environment artifacts remain untracked.

This design keeps the project trivial to understand while still being useful and easy to adapt (e.g., changing the filename, color maps, or label formatting).

## Results

- I can now inspect a DigiKey cart’s cost distribution visually in seconds.
- High-cost components and outliers are immediately obvious, which helps guide part substitutions or design changes.
- The script serves as a minimal, clear example of using `pandas` + `matplotlib` + `squarify` for quick one-off data visualizations.

## Lessons Learned

- Even very small scripts can significantly improve everyday workflows when they target a specific pain point.
- Treemaps are effective for communicating relative cost contribution without requiring much configuration or UI.
- Keeping the implementation minimal encourages future reuse; this script can easily evolve into a more general BOM visualization tool by parameterizing the CSV path or wrapping it in a CLI.

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/DigikeyDisplay)
- Demo: _TBD_