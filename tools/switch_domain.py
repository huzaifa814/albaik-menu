"""Move the site to a different domain, in one go.

    python tools/switch_domain.py albaikchickenpizza.com

The domain is written into more places than is obvious, and two of them are in
the Cloudflare worker rather than the site:

  * worker MENU_URL   - where the order desk reads prices from
  * worker ALLOWED    - which origins may place an order

Miss those and ordering breaks silently. The site looks perfectly normal, the
customer taps Place order, and CORS refuses it. So this script does the whole
set together and prints the deploy step you still have to run by hand.

The OLD origin is deliberately kept in the worker's allowlist. A customer whose
phone is still holding the old page can then finish the order they started
instead of being told to go to the counter.

Old printed QR codes keep working: GitHub Pages 301s any other domain pointing
at the same site over to the canonical one in CNAME, so long as the old DNS
records are left alone.
"""
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# every file that names the domain, found with:
#   grep -rn "albaik\.dpdns\.org" --include='*.html' --include='*.js' --include='*.toml'
FILES = (
    "CNAME",
    "index.html",
    "print.html",
    "admin.html",
    "README.md",
    "tools/menu-sheets.html",
    "orders/src/worker.js",
    "orders/wrangler.toml",
)


def current_domain() -> str:
    with open(os.path.join(ROOT, "CNAME"), encoding="utf-8") as fh:
        return fh.read().strip()


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("usage: python tools/switch_domain.py <new-domain>")

    new = sys.argv[1].strip().lower().lstrip("/")
    new = re.sub(r"^https?://", "", new).rstrip("/")
    if not re.fullmatch(r"[a-z0-9.-]+\.[a-z]{2,}", new):
        sys.exit(f"that does not look like a domain: {new}")

    old = current_domain()
    if old == new:
        sys.exit(f"already on {new}")

    print(f"{old}  ->  {new}\n")

    touched = 0
    for rel in FILES:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            continue
        text = open(path, encoding="utf-8").read()
        if old not in text:
            continue
        hits = text.count(old)
        out = text.replace(old, new)
        open(path, "w", encoding="utf-8", newline="\n").write(out)
        print(f"  {hits:>2} x  {rel}")
        touched += 1

    # Let the old origin keep ordering while DNS and phone caches catch up.
    worker = os.path.join(ROOT, "orders", "src", "worker.js")
    src = open(worker, encoding="utf-8").read()
    keep = f'  "https://{old}",'
    if keep not in src:
        src = src.replace(f'  "https://{new}",', f'  "https://{new}",\n{keep}', 1)
        open(worker, "w", encoding="utf-8", newline="\n").write(src)
        print(f"\n  kept https://{old} in the worker allowlist for the changeover")

    print(f"\n{touched} file(s) rewritten")

    # QR codes point at the site root, so they have to be regenerated
    subprocess.run([sys.executable, os.path.join(ROOT, "tools", "make_qr.py"),
                    "--base", f"https://{new}/"], cwd=ROOT, check=True)
    subprocess.run([sys.executable, os.path.join(ROOT, "tools", "stamp_version.py")],
                   cwd=ROOT, check=True)

    print(f"""
Still to do by hand:

  1. cd orders && npx wrangler deploy
     Until this runs, the new domain CANNOT place orders - CORS will refuse it.

  2. GitHub repo -> Settings -> Pages -> Custom domain = {new}
     Tick Enforce HTTPS once the certificate is issued.

  3. DNS for {new} (Cloudflare):
       A     @    185.199.108.153
       A     @    185.199.109.153
       A     @    185.199.110.153
       A     @    185.199.111.153
       CNAME www  huzaifa814.github.io
     Leave the {old} records alone - GitHub then 301s the old QR codes here.

  4. Reprint the table cards from print.html, and update the website and menu
     links on the Google Business Profile and the Apple Maps listing.
""")


if __name__ == "__main__":
    main()
