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

from PIL import Image, ImageFilter

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

LOGO_BOX = (7810, 2380, 9900, 3080)   # generous - the alpha bounding box trims it exactly
LOGO_WIDTH = 1400                     # ~3x the largest on-screen size, so it stays crisp on retina


def resized(img: Image.Image, width: int) -> Image.Image:
    if img.width <= width:
        return img
    return img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)


def cut_logo(board: Image.Image) -> None:
    """Lift the wordmark off the black board into a tight, transparent WebP + a print PNG.

    The board art has a soft dark-red drop shadow behind the letters. Keyed with a low black
    point it survives as ~124/255 alpha pixels of RGB(55,16,3): invisible on the site's black
    background, but on white paper it composites into a maroon halo that reads as both
    "bloody" and "blurry". So the black point sits well above the shadow, and the alpha ramp
    is then tightened with a smoothstep so edges land crisp instead of feathered.
    """
    import numpy as np

    logo = board.crop(LOGO_BOX).convert("RGB")
    rgb = np.asarray(logo).astype(np.float32)
    lum = rgb.max(axis=2)

    alpha = np.clip((lum - 95) / 55.0, 0, 1)     # above the drop shadow, below the letters
    alpha[alpha < 0.06] = 0.0                     # board film-grain speckle
    alpha = np.clip((alpha - 0.30) / 0.45, 0, 1)  # tighten the ramp
    alpha = alpha * alpha * (3 - 2 * alpha)       # smoothstep, so it is tight but not jagged

    out = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")

    bbox = out.getbbox()                          # trim to the artwork itself
    if bbox:
        pad = 6
        out = out.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad),
                        min(out.width, bbox[2] + pad), min(out.height, bbox[3] + pad)))

    out = resized(out, LOGO_WIDTH)
    out = out.filter(ImageFilter.UnsharpMask(radius=0.8, percent=30, threshold=2))

    path = os.path.join(OUT, "logo.webp")
    out.save(path, "WEBP", quality=92, method=6, exact=True)
    print(f"{'logo':<15} {out.width}x{out.height}  {os.path.getsize(path) // 1024} KB (screen)")

    # print gets lossless - WebP's lossy pass softens the bevel gradients
    ppath = os.path.join(OUT, "logo-print.png")
    out.save(ppath, "PNG", optimize=True)
    print(f"{'logo-print':<15} {out.width}x{out.height}  {os.path.getsize(ppath) // 1024} KB (print, lossless)")


def write_icons() -> None:
    """Home-screen / tab icons, built from the trimmed logo so they stay sharp too."""
    logo = Image.open(os.path.join(OUT, "logo.webp")).convert("RGBA")
    for size in (180, 192, 512):
        bg = Image.new("RGBA", (size, size), (13, 11, 9, 255))
        w = int(size * 0.88)
        lg = logo.resize((w, max(1, round(logo.height * w / logo.width))), Image.LANCZOS)
        bg.alpha_composite(lg, ((size - lg.width) // 2, (size - lg.height) // 2))
        name = "apple-touch-icon.png" if size == 180 else f"icon-{size}.png"
        bg.convert("RGB").save(os.path.join(OUT, name), "PNG", optimize=True)
        print(f"{name:<15} {size}x{size}")


# Sections that now use the restaurant's own photos instead of the board artwork.
# Re-running this script must not silently overwrite them - pass --force if you really mean to.
REAL_PHOTOS = {"hero", "fried-chicken", "pizza", "cheezy-pizza"}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--board", required=True, help="path to the menu board PNG")
    ap.add_argument("--force", action="store_true", help="also overwrite sections using real photos")
    args = ap.parse_args()

    board = Image.open(args.board).convert("RGB")
    os.makedirs(OUT, exist_ok=True)

    for name, (box, width) in REGIONS.items():
        if name in REAL_PHOTOS and not args.force:
            print(f"{name:<15} skipped - real photo in place (use --force to overwrite)")
            continue
        img = resized(board.crop(box), width)
        path = os.path.join(OUT, name + ".webp")
        img.save(path, "WEBP", quality=84, method=6)
        print(f"{name:<15} {img.width}x{img.height}  {os.path.getsize(path) // 1024} KB")

    cut_logo(board)
    write_icons()


if __name__ == "__main__":
    main()
