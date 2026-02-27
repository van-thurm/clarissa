#!/usr/bin/env python3
"""
pixel_to_cli.py
───────────────────────────────────────────────────────────────────────────────
Converts a PNG image to a Bash array of terminal block characters.
Part of the Clarissa icon pipeline.

Each image pixel becomes "██" (filled) or "  " (empty space),
using Unicode U+2588 FULL BLOCK × 2 for correct aspect ratio
in monospace terminal fonts (chars are ~2:1 tall:wide, so 2 chars = 1 square).

USAGE
  python3 pixel_to_cli.py <image.png>                   # auto-name, 32×32
  python3 pixel_to_cli.py <image.png> RABBIT            # named, 32×32
  python3 pixel_to_cli.py <image.png> RABBIT 16         # named, 16×16

OUTPUT
  Bash array declaration printed to stdout.
  Append to your icons file like this:
    python3 pixel_to_cli.py rabbit.png RABBIT >> clarissa_icons.sh

BATCH (process a whole folder)
  for f in icons/*.png; do
    name=$(basename "$f" .png | tr '[:lower:]' '[:upper:]' | tr '-' '_')
    python3 pixel_to_cli.py "$f" "$name" >> clarissa_icons.sh
  done

REQUIREMENTS
  pip3 install Pillow

FIGMA EXPORT SETTINGS (for best results)
  - Export each IconFrame at exactly 32×32 px  (suffix: @0.0625x from 512px frame)
  - Format: PNG
  - No background / white background both work
───────────────────────────────────────────────────────────────────────────────
"""

import sys
import os

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required. Run: pip3 install Pillow", file=sys.stderr)
    sys.exit(1)


# ── Constants ─────────────────────────────────────────────────────────────────

FILLED    = "\u2588\u2588"  # ██  dark pixel
EMPTY     = "  "            #     light pixel (2 spaces)
THRESHOLD = 128             # 0–255 brightness; below this = filled


# ── Image helpers ─────────────────────────────────────────────────────────────

def load_image(path: str) -> Image.Image:
    """Open a PNG and normalize to RGB, compositing transparency onto white."""
    img = Image.open(path)

    if img.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        alpha = img.split()[-1] if "A" in img.mode else None
        bg.paste(img.convert("RGB"), mask=alpha)
        return bg

    return img.convert("RGB")


def resize_pixel_perfect(img: Image.Image, size: int) -> Image.Image:
    """Resize with nearest-neighbor — preserves hard pixel edges, no blur."""
    return img.resize((size, size), Image.NEAREST)


def image_to_rows(img: Image.Image) -> list:
    """Convert each pixel row to a string of block/space characters."""
    rows = []
    w, h = img.size
    for y in range(h):
        row = ""
        for x in range(w):
            r, g, b = img.getpixel((x, y))
            brightness = (r + g + b) / 3
            row += FILLED if brightness < THRESHOLD else EMPTY
        rows.append(row)
    return rows


# ── Name helper ───────────────────────────────────────────────────────────────

def make_icon_name(path: str) -> str:
    """Generate a safe Bash variable name from a filename."""
    base = os.path.splitext(os.path.basename(path))[0]
    return base.upper().replace("-", "_").replace(" ", "_").replace(".", "_")


# ── Output ────────────────────────────────────────────────────────────────────

def output_bash(icon_name: str, rows: list, source: str, size: int):
    """Print a Bash-compatible array declaration to stdout."""
    width_chars = size * 2
    sep = "─" * max(1, 44 - len(icon_name))
    print(f"# ── ICON_{icon_name} {sep}")
    print(f"# Source : {os.path.basename(source)}")
    print(f"# Canvas : {size}×{size} logical px  →  {width_chars} chars wide in terminal")
    print(f'# Display: printf "%s\\n" "${{ICON_{icon_name}[@]}}"')
    print(f"ICON_{icon_name}=(")
    for row in rows:
        print(f'  "{row}"')
    print(")")
    print()


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    args = sys.argv[1:]

    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        sys.exit(0)

    path = args[0]
    icon_name = args[1].upper().replace("-", "_") if len(args) > 1 else make_icon_name(path)
    size = int(args[2]) if len(args) > 2 else 32

    if not os.path.exists(path):
        print(f"Error: file not found — {path}", file=sys.stderr)
        sys.exit(1)

    img  = load_image(path)
    img  = resize_pixel_perfect(img, size)
    rows = image_to_rows(img)
    output_bash(icon_name, rows, path, size)


if __name__ == "__main__":
    main()
