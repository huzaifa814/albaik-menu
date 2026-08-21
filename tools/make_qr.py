"""Generate the two QR codes for AL BAIK.

    python tools/make_qr.py --base https://huzaifa814.github.io/albaik-menu/

Writes into qr/:
    menu.png      opens the menu
    review.png    opens the Google review page
"""
import argparse
import os

import qrcode
from qrcode.constants import ERROR_CORRECT_H

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "qr")


def write(url: str, path: str) -> None:
    qr = qrcode.QRCode(version=None, error_correction=ERROR_CORRECT_H, box_size=16, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    qr.make_image(fill_color="black", back_color="white").save(path)
    print(f"{os.path.basename(path):<12} {url}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True, help="site root, e.g. https://user.github.io/albaik-menu/")
    args = ap.parse_args()

    base = args.base if args.base.endswith("/") else args.base + "/"
    os.makedirs(OUT, exist_ok=True)

    write(base, os.path.join(OUT, "menu.png"))
    write(base + "review.html", os.path.join(OUT, "review.png"))


if __name__ == "__main__":
    main()
