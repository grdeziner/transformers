#!/usr/bin/env python3
"""Ingest James's source art -> web-ready assets.

Usage:
  python3 tools/process_assets.py [SOURCE_DIR]

SOURCE_DIR defaults to the chat attachment folder. Files are matched by the
hash prefix of their original filename (or by an already-friendly name placed in
assets/originals/). Originals are copied untouched into assets/originals/;
optimized WebP (+ PNG fallback for cut-outs) are written to assets/img/.

Character art gets its white background removed by an edge-connected flood fill
(so white highlights *inside* the figure are kept), a soft 1px feather, and a trim.
"""
import sys, shutil
from pathlib import Path
from collections import deque
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ORIG = ROOT / "assets" / "originals"
OUT = ROOT / "assets" / "img"
DEFAULT_SRC = Path("/home/box/agent-data/agents/c78d9397-570c-4b81-aed1-5379c28f4722/attachments")

# prefix -> (friendly name, kind)
MAP = {
    "23ef3bb2": ("optimus-closeup", "cutout"),    # marker art, fist raised (art: Dalaympic)
    "6fa53f20": ("optimus-full", "cutout"),       # full body w/ rifle (vectormz.deviantart.com)
    "9680c748": ("bumblebee-full", "cutout"),     # hands on hips
    "97076428": ("bumblebee-tire", "cutout"),     # tire on shoulder
    "9dc30dad": ("bg-hex", "photo"),              # navy->red hex grid
    "54dc18a9": ("bg-pattern", "photo"),          # red TRANSFORMERS repeat pattern
    "458d1a73": ("autobot-insignia", "cutout"),
    "a10c55c6": ("transformers-wordmark", "cutout"),
}

def knock_out_white(im, tol=28):
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    def is_bg(p):
        r, g, b, a = p
        return a < 10 or (r > 255 - tol and g > 255 - tol and b > 255 - tol)
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    mask = Image.new("L", (w, h), 255)
    mp = mask.load()
    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        if not is_bg(px[x, y]):
            continue
        mp[x, y] = 0
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    # already transparent? keep original alpha
    alpha = Image.composite(im.getchannel("A"), Image.new("L", (w, h), 0), mask)
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    im.putalpha(alpha)
    bbox = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
    return im.crop(bbox) if bbox else im

def fit(im, max_side):
    w, h = im.size
    s = min(1.0, max_side / max(w, h))
    return im.resize((round(w * s), round(h * s)), Image.LANCZOS) if s < 1 else im

def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    ORIG.mkdir(parents=True, exist_ok=True); OUT.mkdir(parents=True, exist_ok=True)
    found = 0
    for prefix, (name, kind) in MAP.items():
        cands = list(src.glob(prefix + "*")) + list(ORIG.glob(name + ".*"))
        if not cands:
            print(f"  missing: {name} ({prefix}…)"); continue
        f = cands[0]; found += 1
        dst = ORIG / f"{name}{f.suffix.lower()}"
        if f.resolve() != dst.resolve():
            shutil.copy2(f, dst)
        im = Image.open(dst)
        if kind == "cutout":
            im = fit(knock_out_white(im), 1600)
            im.save(OUT / f"{name}.webp", "WEBP", quality=88, method=6)
            im.save(OUT / f"{name}.png", optimize=True)
        else:
            im = fit(im.convert("RGB"), 2000)
            im.save(OUT / f"{name}.webp", "WEBP", quality=82, method=6)
            im.save(OUT / f"{name}.jpg", "JPEG", quality=85, optimize=True, progressive=True)
        print(f"  ok: {name} {im.size}")
    print(f"{found}/{len(MAP)} assets processed")

if __name__ == "__main__":
    main()
