"""Cut the food photos and the logo out of the printed menu board artwork.

    python tools/extract_images.py --board "C:/Users/huzai/Downloads/Al-BAIK/rest (2).png"

Every crop box below is in pixels of the original 10220x3523 board. If the artwork is ever
redrawn, re-measure the boxes - nothing else in the site needs to change, because each section
loads `assets/img/<section id>.webp`.

The logo keeps an alpha channel: the black board behind it is keyed out by luminance so the
logo can sit on top of a photo.
"""
import argparse
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img")

# name -> (crop box on the board, output width)
REGIONS = {
    "hero":           ((2650, 40, 3660, 1090), 1100),
    "fried-chicken":  ((2650, 40, 3660, 1090), 800),
    "wings":          ((3310, 1160, 3805, 1790), 800),
    "fries":          ((4470, 1170, 5045, 2010), 800),
    "roast":          ((2600, 2230, 3250, 2795), 800),
    "noodles":        ((4410, 2140, 5045, 2785), 800),
    "spaghetti":      ((3560, 2890, 5040, 3505), 900),
    "pizza":          ((5090, 0, 6420, 690), 1000),
    "cheezy-pizza":   ((5230, 3010, 5800, 3450), 800),
    "breadsticks":    ((7090, 3000, 7660, 3460), 800),
    "burgers":        ((7785, 50, 8385, 675), 800),
    "salads":         ((9065, 50, 9565, 675), 800),
    "kabob":          ((7800, 700, 8660, 1450), 900),
    "wraps":          ((9090, 1490, 10160, 2040), 900),
}

LOGO_BOX = (7930, 2470, 9720, 2980)
LOGO_WIDTH = 900


def resized(img: Image.Image, width: int) -> Image.Image:
    if img.width <= width:
        return img
    return img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)


def cut_logo(board: Image.Image) -> None:
    import numpy as np

    logo = resized(board.crop(LOGO_BOX).convert("RGB"), LOGO_WIDTH)
    rgb = np.asarray(logo).astype(np.float32)
    # the board behind the logo is near black; fade it out by luminance so the edges stay soft
    alpha = np.clip((rgb.max(axis=2) - 18) / 55.0, 0, 1)
    out = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")
    path = os.path.join(OUT, "logo.webp")
    out.save(path, "WEBP", quality=90, method=6, exact=True)
    print(f"{'logo':<15} {out.width}x{out.height}  {os.path.getsize(path) // 1024} KB (transparent)")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--board", required=True, help="path to the menu board PNG")
    args = ap.parse_args()

    board = Image.open(args.board).convert("RGB")
    os.makedirs(OUT, exist_ok=True)

    for name, (box, width) in REGIONS.items():
        img = resized(board.crop(box), width)
        path = os.path.join(OUT, name + ".webp")
        img.save(path, "WEBP", quality=84, method=6)
        print(f"{name:<15} {img.width}x{img.height}  {os.path.getsize(path) // 1024} KB")

    cut_logo(board)


if __name__ == "__main__":
    main()
