"""Stamp a content hash onto every CSS/JS link so updates reach phones immediately.

GitHub Pages serves everything with Cache-Control: max-age=600, and phones routinely
hold assets longer than that. Without this, a price change can stay invisible to a
customer who scanned the QR earlier in the day - the worst possible failure for a menu.

Appending ?v=<hash of the file> makes the URL itself change whenever the content does,
so browsers fetch the new copy rather than reusing the old one. Only the HTML needs to
expire, and that is the one thing max-age=600 handles fine.

Run before committing any change to the CSS, the menu data, the config or the app:

    python tools/stamp_version.py
"""
import hashlib
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ("index.html", "print.html", "review.html")
ASSETS = ("assets/css/style.css", "assets/js/config.js",
          "assets/js/menu-data.js", "assets/js/app.js",
          "assets/img/logo.webp", "assets/img/logo.png")


def digest(rel):
    path = os.path.join(ROOT, rel)
    if not os.path.exists(path):
        return None
    return hashlib.sha1(open(path, "rb").read()).hexdigest()[:8]


def main() -> None:
    stamps = {rel: digest(rel) for rel in ASSETS}
    changed = 0

    for page in PAGES:
        path = os.path.join(ROOT, page)
        text = open(path, encoding="utf-8").read()
        before = text
        for rel, ver in stamps.items():
            if ver is None:
                continue
            # match the asset with or without an existing ?v=, in href or src
            text = re.sub(r'(?<=["\'])' + re.escape(rel) + r'(\?v=[0-9a-f]+)?(?=["\'])',
                          f"{rel}?v={ver}", text)
        if text != before:
            open(path, "w", encoding="utf-8", newline="\n").write(text)
            changed += 1
        print(f"{page:<12} stamped")

    for rel, ver in stamps.items():
        print(f"  {ver or '--------'}  {rel}")
    print(f"{changed} page(s) rewritten")


if __name__ == "__main__":
    main()
