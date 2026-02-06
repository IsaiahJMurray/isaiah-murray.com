---
title: Exotic Produce Packing Optimization
subtitle: 'MATLAB-based modeling and simulation of optimal packing for three categories
  of exotic produce under spatial and combinatorial constraints.

  '
slug: exoticproducepackingoptimization
date: '2025-11-11'
updated: '2026-02-06'
tags:
- matlab
- simulation
- optimization
maturity: prototype
featured: false
visibility: public
heroImage: /generated/logos/exoticproducepackingoptimization.png
---

## Overview

I built a MATLAB-based modeling and simulation system to explore optimal packing strategies for exotic produce in warehouse environments. The system treats the warehouse as a 2D lattice and uses sparse Gaussian-weighted adjacency matrices to model spatial interactions between storage locations. I implemented exhaustive pattern enumeration to explore configuration spaces that would be infeasible to reason about manually.

The project translates an abstract logistics problem into concrete mathematical objects that can be simulated, analyzed, and iterated on. I focused on building robust spatial interaction models and combinatorial pattern generators that could serve as the foundation for more complex optimization routines.

---

## Role & Context

I developed this project as a solo effort for a modeling and simulation coursework assignment. My primary goals were to frame a realistic logistics problem as a mathematical model, implement core computations using vectorized MATLAB methods, and experiment with how different neighborhood structures affect feasible packing configurations.

The work represents my approach to bridging theoretical optimization concepts with practical warehouse management challenges.

---

## Tech Stack

- MATLAB
- MATLAB Project (.prj) structure
- MATLAB sparse matrix utilities
- Combinatorial optimization algorithms

---

## Problem

I wanted to study how to optimally pack multiple categories of exotic produce in a grid-like storage area. The core challenges were:

- Representing spatial interactions between locations (cooling influence, handling proximity, cross-contamination risk)
- Enumerating viable packing patterns under categorical constraints
- Building a structure suitable for optimization objectives like minimizing damage risk or temperature variance

I needed a robust way to build spatial weight matrices that decay smoothly with distance and can be truncated beyond a practical radius, plus a method to generate all possible category assignments for fixed slot counts.

---

## Approach / Architecture

I decomposed the problem into two core modeling components:

**Spatial Interaction Modeling**
- Represent the warehouse as an `Nside × Nside` grid
- Construct a Gaussian-based weight matrix `W` defining interaction strength between cells
- Apply distance-based decay and radius truncation for computational efficiency
- Normalize weights row-wise for probabilistic interpretation

**Combinatorial Packing Patterns**
- Model scenarios with three produce categories and `n` items of each type
- Encode packing configurations as label vectors of length `3n`
- Generate complete pattern sets using combinatorics while respecting count constraints

The entire project uses MATLAB Project structure to maintain organized environments and support reproducible simulations.

---

## Key Features

- Gaussian-based spatial weight matrix generator with distance truncation
- Efficient sparse matrix implementation for large grid networks
- Exhaustive pattern generator for equal-count tri-category packing
- Clear separation between spatial modeling and combinatorial assignments
- MATLAB Project integration for reproducible workflows
- Scalable architecture supporting future optimization extensions

---

## Technical Details

### Spatial Weight Matrix Generation

I implemented `makeW_gaussian.m` to construct normalized, sparse interaction matrices over 2D grids:

```matlab
function W = makeW_gaussian(Nside, r, sigma)
    N = Nside*Nside;
    [JJ,II] = meshgrid(1:Nside,1:Nside);
    xy = [II(:), JJ(:)];
    D = pdist2(xy,xy,'euclidean');

    A = exp(-(D./sigma).^2); 
    A(D==0) = 0;             % remove self-interaction
    A(D>r)  = 0;             % truncate beyond radius
    A = sparse(A);

    rowSum = sum(A,2);
    W = spdiags(1./max(rowSum,1),0,N,N)*A;
end
```

### Grid Encoding Strategy

I flatten the 2D grid into `N = Nside^2` nodes while preserving coordinate information in the `xy` matrix. This allows efficient pairwise distance computation using `pdist2` and supports reusable interaction kernels.

### Gaussian Kernel Design

The interaction strength follows `A_ij = exp(-(d_ij / sigma)^2)`, providing smooth distance-based decay. The `sigma` parameter controls influence dropoff rate, while radius truncation (`D > r`) creates realistic local-interaction patterns and improves computational efficiency.

### Sparsity and Normalization

After truncation, I convert to sparse format to dramatically reduce memory usage for large grids. Row normalization ensures `sum_j W_ij = 1` for interpretability as stochastic matrices or influence weights, with division-by-zero protection via `max(rowSum,1)`.

### Pattern Enumeration System

The `patterns3.m` function generates all possible tri-category assignments with equal counts:

```matlab
function P = patterns3(n)
% P is (3n) x K where K = (3n)!/(n!)^3
m = 3*n;
K = factorial(m)/(factorial(n)^3);
P = zeros(m, K, 'uint8');

col = 1;
idx1 = nchoosek(1:m, n);           % choose positions for label 1
for i = 1:size(idx1,1)
    rest = setdiff(1:m, idx1(i,:));    % remaining positions
    idx2 = nchoosek(rest, n);          % choose positions for label 2
    for j = 1:size(idx2,1)
        v = uint8(3*ones(m,1));        % default label 3
        v(idx1(i,:)) = 1;
        v(idx2(j,:)) = 2;
        P(:,col) = v;
        col = col + 1;
    end
end
end
```

### Combinatorial Construction

I build patterns by first selecting positions for label 1 using `nchoosek`, then choosing label 2 positions from remaining slots. All other positions default to label 3. This systematic approach ensures complete enumeration while making the combinatorial explosion explicit through `K = (3n)! / (n!)^3`.

### Memory Optimization

Using `uint8` for categorical labels minimizes memory usage while supporting sufficient label ranges. Each column in the output matrix `P` represents a complete packing configuration across `3n` slots with fixed type counts.

---

## Results

The project delivered two reusable components:

**Spatial Interaction Generator**
- Parameterized system applicable to packing, layout, and diffusion problems
- Support for Markov processes on grid structures
- Flexible kernel parameters for different physical scenarios

**Combinatorial Pattern Generator**
- Complete enumeration of feasible tri-category layouts
- Ground-truth basis for validating optimization heuristics
- Benchmark capability for studying layout-neighborhood interactions

I can now combine these components to analyze how different radius and sigma values affect neighborhood structures, and study how specific packing patterns interact with spatial coupling for future objective function development.

---

## Lessons Learned

**Sparse Linear Algebra is Critical** - For grid-based models, applying sparsity early keeps simulations tractable and maintains performance at scale.

**Kernel Parameters Drive System Behavior** - The choice of `sigma` and truncation radius `r` fundamentally changes system structure. Modeling assumptions must tie clearly to physical intuition like cooling or handling radii.

**Enumeration vs. Optimization Tradeoffs** - Exhaustive pattern listing provides complete search space understanding but becomes computationally infeasible quickly, pushing toward optimization or sampling approaches in production.

**Project Structure Enables Growth** - Using MATLAB Project infrastructure, even for small assignments, significantly eases expansion into complex simulation frameworks.

---

## Links

- [GitHub Repository](https://github.com/IsaiahJMurray/ExoticProducePackingOptimization)