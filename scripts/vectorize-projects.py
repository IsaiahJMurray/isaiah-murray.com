#!/usr/bin/env python3
"""
Vectorize Project Markdown Files
================================
Generates embeddings for all project markdown files using OpenAI's text-embedding-3-small model.
Outputs:
  - static/generated/project_embeddings.json: Full embeddings + metadata
  - static/generated/project_vectors_2d.json: PCA-reduced 2D coords for scatterplot
  - static/generated/project_similarities.json: Top 3 similar projects per project

Usage:
    pip install openai numpy scikit-learn pyyaml
    export OPENAI_API_KEY=your_key
    python scripts/vectorize-projects.py

Alternatively, set ANTHROPIC_API_KEY to use Claude's embeddings via Voyager.
"""

import os
import sys
import json
import re
from pathlib import Path
from typing import Any
from  dotenv import load_dotenv
load_dotenv()

import numpy as np

# ---------- Config ----------
DOCS_DIR = Path(__file__).resolve().parent.parent / "src" / "lib" / "docs" / "projects"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "static" / "generated"
EMBEDDING_MODEL = "text-embedding-3-small"  # OpenAI
EMBED_DIM = 1536  # text-embedding-3-small dimension

# ---------- Utilities ----------

def parse_frontmatter(content: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and body from markdown."""
    if not content.startswith("---"):
        return {}, content
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}, content
    
    import yaml
    try:
        meta = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        meta = {}
    body = parts[2].strip()
    return meta, body


def clean_text(text: str) -> str:
    """Remove markdown syntax, links, images for cleaner embedding input."""
    # Remove images
    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)
    # Remove links but keep text
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    # Remove code blocks
    text = re.sub(r"```[\s\S]*?```", "", text)
    # Remove inline code
    text = re.sub(r"`[^`]+`", "", text)
    # Remove headers markdown
    text = re.sub(r"^#+\s*", "", text, flags=re.MULTILINE)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def load_projects() -> list[dict]:
    """Load all public project markdown files."""
    projects = []
    for md_file in DOCS_DIR.glob("*.md"):
        content = md_file.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(content)
        
        # Skip hidden projects
        if meta.get("visibility") == "hidden":
            continue
        
        slug = meta.get("slug") or md_file.stem
        title = meta.get("title") or slug
        
        # Build text for embedding: title + subtitle + tags + body
        embed_text_parts = [title]
        if meta.get("subtitle"):
            embed_text_parts.append(meta["subtitle"])
        if meta.get("tags"):
            embed_text_parts.append(" ".join(meta["tags"]))
        embed_text_parts.append(clean_text(body))
        
        embed_text = " ".join(embed_text_parts)
        
        projects.append({
            "slug": slug,
            "title": title,
            "subtitle": meta.get("subtitle", ""),
            "tags": meta.get("tags", []),
            "heroImage": meta.get("heroImage", f"/generated/logos/{slug}.png"),
            "embed_text": embed_text[:8000],  # Truncate for API limits
            "maturity": meta.get("maturity", ""),
            "date": meta.get("date", ""),
        })
    
    return projects


# ---------- Embedding Providers ----------

def get_openai_embeddings(texts: list[str]) -> np.ndarray:
    """Get embeddings using OpenAI API."""
    from openai import OpenAI
    
    client = OpenAI()
    
    # Batch requests (OpenAI allows up to 2048 texts per request)
    all_embeddings = []
    batch_size = 100
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=batch
        )
        batch_embeddings = [item.embedding for item in response.data]
        all_embeddings.extend(batch_embeddings)
        print(f"  Embedded {min(i + batch_size, len(texts))}/{len(texts)} projects...")
    
    return np.array(all_embeddings)


def get_voyager_embeddings(texts: list[str]) -> np.ndarray:
    """
    Get embeddings using Anthropic's Voyager (if available).
    Falls back to OpenAI if not configured.
    """
    # Voyager isn't publicly available yet, use OpenAI
    return get_openai_embeddings(texts)


# ---------- Dimensionality Reduction ----------

def reduce_to_2d(embeddings: np.ndarray) -> np.ndarray:
    """Reduce embeddings to 2D using PCA."""
    from sklearn.decomposition import PCA
    
    n_samples = embeddings.shape[0]
    n_components = min(2, n_samples)
    
    pca = PCA(n_components=n_components)
    coords_2d = pca.fit_transform(embeddings)
    
    print(f"  PCA explained variance: {pca.explained_variance_ratio_.sum():.2%}")
    
    return coords_2d


def compute_similarities(embeddings: np.ndarray, slugs: list[str], top_k: int = 3) -> dict:
    """Compute cosine similarity and return top-k similar projects for each."""
    from sklearn.metrics.pairwise import cosine_similarity
    
    sim_matrix = cosine_similarity(embeddings)
    
    similarities = {}
    for i, slug in enumerate(slugs):
        # Get similarities for this project, excluding itself
        sims = sim_matrix[i].copy()
        sims[i] = -1  # Exclude self
        
        # Get top-k indices
        top_indices = np.argsort(sims)[::-1][:top_k]
        
        similarities[slug] = [
            {
                "slug": slugs[idx],
                "score": float(sims[idx])
            }
            for idx in top_indices
        ]
    
    return similarities


# ---------- Main ----------

def main():
    print("=" * 50)
    print("Project Vectorizer")
    print("=" * 50)
    
    # Check for API key
    if not os.environ.get("OPENAI_API_KEY"):
        print("\nError: OPENAI_API_KEY environment variable not set.")
        print("Set it with: export OPENAI_API_KEY=your_key")
        sys.exit(1)
    
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load projects
    print("\n1. Loading project markdown files...")
    projects = load_projects()
    print(f"   Found {len(projects)} public projects")
    
    if len(projects) < 2:
        print("   Need at least 2 projects for similarity. Exiting.")
        sys.exit(1)
    
    # Get embeddings
    print("\n2. Generating embeddings with OpenAI...")
    texts = [p["embed_text"] for p in projects]
    embeddings = get_openai_embeddings(texts)
    print(f"   Embedding shape: {embeddings.shape}")
    
    # Reduce to 2D
    print("\n3. Reducing to 2D with PCA...")
    coords_2d = reduce_to_2d(embeddings)
    
    # Normalize 2D coords to [0, 1] range for easier plotting
    coords_min = coords_2d.min(axis=0)
    coords_max = coords_2d.max(axis=0)
    coords_range = coords_max - coords_min
    coords_range[coords_range == 0] = 1  # Avoid division by zero
    coords_2d_norm = (coords_2d - coords_min) / coords_range
    
    # Compute similarities
    print("\n4. Computing project similarities...")
    slugs = [p["slug"] for p in projects]
    similarities = compute_similarities(embeddings, slugs, top_k=3)
    
    # Build output data
    print("\n5. Saving output files...")
    
    # Full embeddings (for future use)
    full_data = {
        "model": EMBEDDING_MODEL,
        "dimension": EMBED_DIM,
        "projects": [
            {
                "slug": p["slug"],
                "title": p["title"],
                "embedding": embeddings[i].tolist()
            }
            for i, p in enumerate(projects)
        ]
    }
    
    # 2D coordinates for scatterplot
    vectors_2d = {
        "projects": [
            {
                "slug": p["slug"],
                "title": p["title"],
                "subtitle": p["subtitle"],
                "tags": p["tags"],
                "heroImage": p["heroImage"],
                "x": float(coords_2d_norm[i, 0]),
                "y": float(coords_2d_norm[i, 1]),
            }
            for i, p in enumerate(projects)
        ]
    }
    
    # Similarities for "related projects" feature
    similarities_data = {
        "similarities": similarities
    }
    
    # Write files
    embeddings_path = OUTPUT_DIR / "project_embeddings.json"
    vectors_path = OUTPUT_DIR / "project_vectors_2d.json"
    similarities_path = OUTPUT_DIR / "project_similarities.json"
    
    with open(embeddings_path, "w", encoding="utf-8") as f:
        json.dump(full_data, f)
    print(f"   Wrote {embeddings_path}")
    
    with open(vectors_path, "w", encoding="utf-8") as f:
        json.dump(vectors_2d, f, indent=2)
    print(f"   Wrote {vectors_path}")
    
    with open(similarities_path, "w", encoding="utf-8") as f:
        json.dump(similarities_data, f, indent=2)
    print(f"   Wrote {similarities_path}")
    
    print("\n" + "=" * 50)
    print("Done! Generated files:")
    print(f"  - {vectors_path.name}: 2D scatter coordinates")
    print(f"  - {similarities_path.name}: Similar projects lookup")
    print(f"  - {embeddings_path.name}: Full embeddings (optional)")
    print("=" * 50)


if __name__ == "__main__":
    main()
