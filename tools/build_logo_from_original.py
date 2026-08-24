"""Key the restaurant's original logo render onto a transparent background.

The board photo of the logo was soft (edges fading over ~9 px). The owner later sent
the designer's actual render - Update/images (11).pdf, a 1254x1254 raw RGB image whose
edges rise in 2-3 px. That is the real artwork, so the site uses it instead of the
traced rebuild in build_logo.py (kept for banner-size work where vector still wins).

The render sits on black with a warm glow. On the black site that glow is invisible,
but on white sign stock it prints as a muddy haze, so it is keyed out by luminance.
Edge pixels are un-premultiplied first, otherwise they darken toward the black backdrop
and leave the maroon rim the board crop suffered from.

    python tools/build_logo_from_original.py

Writes assets/img/logo.png (full res, transparent, for the print sheet) and
logo.webp (sized for the largest the site ever shows it).
"""
import os
import re

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "Update", "images (11).pdf")
OUT_PNG = os.path.join(ROOT, "assets", "img", "logo.png")
OUT_WEBP = os.path.join(ROOT, "assets", "img", "logo.webp")

WEB_W = 800            # widest the site ever renders it, at 3x device pixels
LO, HI = 46.0, 112.0   # luminance below LO is glow (drop it), above HI is solid artwork


def load_from_pdf(path):
    """Pull the single uncompressed DeviceRGB image the PDF wraps."""
    data = open(path, "rb").read()
    m = re.search(rb"/Width (\d+)\s*/Height (\d+)\s*/ColorSpace /DeviceRGB\s*"
                  rb"/BitsPerComponent 8\s*/Length (\d+)\s*>>\s*stream\r?\n", data)
    if not m:
        raise SystemExit(f"no raw RGB image found in {path}")
    w, h = int(m.group(1)), int(m.group(2))
    return Image.frombytes("RGB", (w, h), data[m.end():m.end() + w * h * 3])


def main() -> None:
    a = np.asarray(load_from_pdf(PDF), dtype=np.float32)

    # max channel, not mean: gold and red stay strong while the glow falls away
    t = np.clip((a.max(axis=2) - LO) / (HI - LO), 0, 1)
    alpha = t * t * (3 - 2 * t)

    rgb = np.clip(a / np.maximum(alpha, 0.14)[..., None], 0, 255)
    img = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")

    ys, xs = np.where(np.asarray(img)[..., 3] > 8)
    pad = 10
    img = img.crop((max(0, xs.min() - pad), max(0, ys.min() - pad),
                    min(img.width, xs.max() + pad), min(img.height, ys.max() + pad)))

    img.save(OUT_PNG, optimize=True)
    print(f"{'logo.png':<11} {img.width}x{img.height}  {os.path.getsize(OUT_PNG) // 1024} KB  (print)")

    # RGB under fully-transparent pixels is un-premultiply noise; zeroing it roughly
    # halves the WebP. 800 px covers the hero at 250 css px on a 3x screen.
    px = np.asarray(img).astype(np.uint8).copy()
    px[..., :3][px[..., 3] < 1] = 0
    web = Image.fromarray(px, "RGBA")
    web = web.resize((WEB_W, round(web.height * WEB_W / web.width)), Image.LANCZOS)
    web.save(OUT_WEBP, quality=88, method=6, alpha_quality=60)
    print(f"{'logo.webp':<11} {web.width}x{web.height}  {os.path.getsize(OUT_WEBP) // 1024} KB  (site)")


if __name__ == "__main__":
    main()
