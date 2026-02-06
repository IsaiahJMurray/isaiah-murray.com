#!/usr/bin/env python3
"""
Image compression script for isaiah-murray.com
================================================
Compresses all images under static/images/projects:
  - Hero/title images  → max 2 MB
  - All other images    → max 1 MB

Originals are cached in .image-cache/ (git-ignored) so you
can roll back any time.

Usage:
  python scripts/compress-images.py              # compress all
  python scripts/compress-images.py --dry-run    # preview what would happen
  python scripts/compress-images.py --rollback   # restore all originals
  python scripts/compress-images.py --status     # show cache status
"""

import os
import sys
import json
import shutil
import hashlib
import argparse
import re
import glob
from pathlib import Path
from datetime import datetime
from io import BytesIO

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent
STATIC_IMAGES = ROOT / "static" / "images" / "projects"
DOCS_DIR = ROOT / "src" / "lib" / "docs" / "projects"
CACHE_DIR = ROOT / ".image-cache"
MANIFEST = CACHE_DIR / "manifest.json"

HERO_MAX_BYTES = 2 * 1024 * 1024   # 2 MB
OTHER_MAX_BYTES = 1 * 1024 * 1024  # 1 MB

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

# Quality step-down for iterative compression
QUALITY_START = 90
QUALITY_MIN = 20
QUALITY_STEP = 5

# ---------------------------------------------------------------------------
# Pillow import (with helpful error)
# ---------------------------------------------------------------------------
try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow is required.  Install with:")
    print("  pip install Pillow")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()


def human_size(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if abs(n) < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def load_manifest() -> dict:
    if MANIFEST.exists():
        return json.loads(MANIFEST.read_text(encoding="utf-8"))
    return {}


def save_manifest(data: dict):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(data, indent=2), encoding="utf-8")


def collect_hero_images() -> set:
    """Parse every .md frontmatter to find heroImage paths (relative to /static)."""
    heroes: set[str] = set()
    for md in DOCS_DIR.glob("*.md"):
        text = md.read_text(encoding="utf-8", errors="replace")
        m = re.search(r"heroImage:\s*['\"]?([^\s'\"]+)", text)
        if m:
            raw = m.group(1).replace("\\", "/")
            # heroImage is like /images/projects/foo/bar.png
            # resolve to absolute under static/
            resolved = (ROOT / "static" / raw.lstrip("/")).resolve()
            heroes.add(str(resolved))
    return heroes


def collect_images() -> list[Path]:
    imgs = []
    for ext in IMAGE_EXTENSIONS:
        imgs.extend(STATIC_IMAGES.rglob(f"*{ext}"))
        imgs.extend(STATIC_IMAGES.rglob(f"*{ext.upper()}"))
    # dedupe
    seen = set()
    unique = []
    for p in imgs:
        rp = p.resolve()
        if rp not in seen:
            seen.add(rp)
            unique.append(rp)
    return sorted(unique)


def compress_image(src: Path, max_bytes: int, dry_run: bool = False) -> tuple[bool, int, int]:
    """
    Compress an image to fit under max_bytes.
    Returns (was_compressed, original_size, new_size).
    """
    import tempfile

    original_size = src.stat().st_size
    if original_size <= max_bytes:
        return False, original_size, original_size

    if dry_run:
        return True, original_size, -1  # signal: would compress

    suffix = src.suffix.lower()
    is_gif = suffix == ".gif"

    img = Image.open(src)
    is_animated = getattr(img, "is_animated", False) and getattr(img, "n_frames", 1) > 1

    # ── Animated GIF: extract first frame, save as static JPEG ──
    if is_gif and is_animated:
        img.seek(0)
        frame = img.copy()
        if frame.mode not in ("RGB", "L"):
            frame = frame.convert("RGB")

        quality = QUALITY_START
        while quality >= QUALITY_MIN:
            buf = BytesIO()
            frame.save(buf, format="JPEG", quality=quality, optimize=True)
            if buf.tell() <= max_bytes:
                src.write_bytes(buf.getvalue())
                return True, original_size, buf.tell()
            quality -= QUALITY_STEP

        # Downscale if still too big
        scale = 0.8
        while scale >= 0.2:
            w, h = frame.size
            resized = frame.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
            buf = BytesIO()
            resized.save(buf, format="JPEG", quality=50, optimize=True)
            if buf.tell() <= max_bytes:
                src.write_bytes(buf.getvalue())
                return True, original_size, buf.tell()
            scale -= 0.1

        buf = BytesIO()
        w, h = frame.size
        frame.resize((max(1, w // 4), max(1, h // 4)), Image.LANCZOS).save(
            buf, format="JPEG", quality=QUALITY_MIN, optimize=True
        )
        src.write_bytes(buf.getvalue())
        return True, original_size, buf.tell()

    # ── Static images ──

    # Preserve EXIF orientation but strip for size
    try:
        from PIL import ExifTags
        exif = img.getexif()
        orientation = None
        for k, v in ExifTags.TAGS.items():
            if v == "Orientation" and k in exif:
                orientation = exif[k]
                break
        if orientation:
            rotations = {3: 180, 6: 270, 8: 90}
            if orientation in rotations:
                img = img.rotate(rotations[orientation], expand=True)
    except Exception:
        pass

    # Convert to RGB for JPEG output (handles RGBA, P, LA, etc.)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    # Strategy 1: Iteratively lower JPEG/WebP quality
    quality = QUALITY_START
    while quality >= QUALITY_MIN:
        buf = BytesIO()
        if suffix == ".webp":
            img.save(buf, format="WEBP", quality=quality)
        else:
            img.save(buf, format="JPEG", quality=quality, optimize=True)

        if buf.tell() <= max_bytes:
            src.write_bytes(buf.getvalue())
            return True, original_size, buf.tell()
        quality -= QUALITY_STEP

    # Strategy 2: Downscale progressively
    scale = 0.9
    while scale >= 0.2:
        w, h = img.size
        new_w, new_h = max(1, int(w * scale)), max(1, int(h * scale))
        resized = img.resize((new_w, new_h), Image.LANCZOS)

        buf = BytesIO()
        q = max(QUALITY_MIN + 10, 50)
        if suffix == ".webp":
            resized.save(buf, format="WEBP", quality=q)
        else:
            resized.save(buf, format="JPEG", quality=q, optimize=True)

        if buf.tell() <= max_bytes:
            src.write_bytes(buf.getvalue())
            return True, original_size, buf.tell()
        scale -= 0.1

    # Last resort: heavy downscale
    w, h = img.size
    resized = img.resize((max(1, w // 4), max(1, h // 4)), Image.LANCZOS)
    buf = BytesIO()
    resized.save(buf, format="JPEG", quality=QUALITY_MIN, optimize=True)
    src.write_bytes(buf.getvalue())
    return True, original_size, buf.tell()


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------
def cmd_compress(dry_run: bool = False):
    heroes = collect_hero_images()
    images = collect_images()

    if not images:
        print("No images found under", STATIC_IMAGES)
        return

    manifest = load_manifest()
    total_saved = 0
    compressed_count = 0
    skipped_count = 0
    already_cached = 0

    print(f"{'[DRY RUN] ' if dry_run else ''}Scanning {len(images)} images...")
    print(f"  Hero images detected: {len(heroes)}")
    print()

    for img_path in images:
        rel = img_path.relative_to(ROOT)
        key = str(rel)
        is_hero = str(img_path) in heroes
        max_bytes = HERO_MAX_BYTES if is_hero else OTHER_MAX_BYTES
        label = "HERO" if is_hero else "    "
        size = img_path.stat().st_size

        if size <= max_bytes:
            skipped_count += 1
            continue

        # Cache original if not already cached
        if key not in manifest and not dry_run:
            cache_path = CACHE_DIR / rel
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(img_path, cache_path)
            manifest[key] = {
                "original_hash": sha256(img_path),
                "original_size": size,
                "cached_at": datetime.now().isoformat(),
                "cache_path": str(cache_path),
                "is_hero": is_hero,
            }
            save_manifest(manifest)  # persist cache entry immediately
        elif key in manifest:
            already_cached += 1

        was_compressed, orig_size, new_size = compress_image(img_path, max_bytes, dry_run)

        if was_compressed:
            compressed_count += 1
            if dry_run:
                print(f"  {label} {rel}")
                print(f"        {human_size(orig_size)} → needs compression (max {human_size(max_bytes)})")
            else:
                saved = orig_size - new_size
                total_saved += saved
                manifest[key]["compressed_size"] = new_size
                manifest[key]["compressed_at"] = datetime.now().isoformat()
                save_manifest(manifest)  # save after each image
                print(f"  {label} {rel}")
                print(f"        {human_size(orig_size)} → {human_size(new_size)}  (saved {human_size(saved)})")

    if not dry_run:
        save_manifest(manifest)

    print()
    print(f"  Compressed: {compressed_count}")
    print(f"  Already OK: {skipped_count}")
    if already_cached:
        print(f"  Already cached: {already_cached}")
    if not dry_run:
        print(f"  Total saved: {human_size(total_saved)}")
    print()


def cmd_rollback():
    manifest = load_manifest()
    if not manifest:
        print("Nothing to roll back — cache is empty.")
        return

    restored = 0
    for key, info in manifest.items():
        cache_path = Path(info["cache_path"])
        target = ROOT / key
        if cache_path.exists():
            shutil.copy2(cache_path, target)
            restored += 1
            print(f"  Restored: {key}")
        else:
            print(f"  WARNING: cache missing for {key}")

    print(f"\nRestored {restored} images to originals.")
    print("Cache preserved. Run --clear-cache to delete it.")


def cmd_status():
    manifest = load_manifest()
    if not manifest:
        print("No cached originals. Run compress first.")
        return

    total_orig = 0
    total_compressed = 0
    print(f"{'File':<70} {'Original':>10} {'Current':>10} {'Saved':>10} {'Hero':>5}")
    print("-" * 110)

    for key, info in sorted(manifest.items()):
        orig = info["original_size"]
        comp = info.get("compressed_size", orig)
        saved = orig - comp
        hero = "✓" if info.get("is_hero") else ""
        total_orig += orig
        total_compressed += comp

        # Truncate key for display
        display_key = key if len(key) <= 68 else "..." + key[-65:]
        print(f"  {display_key:<68} {human_size(orig):>10} {human_size(comp):>10} {human_size(saved):>10} {hero:>5}")

    print("-" * 110)
    print(f"  {'TOTAL':<68} {human_size(total_orig):>10} {human_size(total_compressed):>10} {human_size(total_orig - total_compressed):>10}")
    print(f"\n  Cache location: {CACHE_DIR}")


def cmd_clear_cache():
    if CACHE_DIR.exists():
        shutil.rmtree(CACHE_DIR)
        print("Cache cleared.")
    else:
        print("No cache to clear.")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Compress project images (hero → 2 MB, others → 1 MB)"
    )
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--dry-run", action="store_true",
                       help="Preview what would be compressed, don't modify files")
    group.add_argument("--rollback", action="store_true",
                       help="Restore all originals from cache")
    group.add_argument("--status", action="store_true",
                       help="Show cache/compression status")
    group.add_argument("--clear-cache", action="store_true",
                       help="Delete the original-image cache")
    args = parser.parse_args()

    if args.rollback:
        cmd_rollback()
    elif args.status:
        cmd_status()
    elif args.clear_cache:
        cmd_clear_cache()
    else:
        cmd_compress(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
