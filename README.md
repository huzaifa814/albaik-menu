# AL BAIK - QR menu + review site

A static site. No server, no database, no monthly cost. It runs on GitHub Pages, so the link
works for anyone, anywhere - it is not tied to the restaurant's wifi or to any one computer.

Live URL: **https://albaik.dpdns.org/**  (the GitHub Pages address `huzaifa814.github.io/albaik-menu` redirects here)

## What it does

- **Menu QR -> the menu.** A customer scans the code on the table (or opens a shared link) and
  the full menu opens on their phone: photos, descriptions, prices, search, and a category rail.
  Tapping a dish opens a bigger photo with its sizes and options.
- **Viewing only.** There is no cart and no online ordering - the waiter takes the order at the
  table exactly as before.
- **Review QR -> Google.** A second code goes to `review.html`, one tap from the Google review box.

## Setup (one file)

Everything the restaurant changes lives in [`assets/js/config.js`](assets/js/config.js):

| Field | What to put |
|---|---|
| `phoneDisplay` | Number shown on the "Call us" button |
| `reviewUrl` | Google review link (Business Profile -> Read reviews -> Get more reviews -> Share review form) |
| `placeId` | Alternative to `reviewUrl` - the Google Place ID |
| `whatsapp` | Optional. Number for the "Message us" button on the review page; leave empty to hide it |
| `currency` | Symbol shown next to prices |

Prices and dishes live in [`assets/js/menu-data.js`](assets/js/menu-data.js) - one line per item.

## Printing the QR codes

```bash
pip install qrcode pillow
python tools/make_qr.py --base https://albaik.dpdns.org/
```

That writes `qr/menu.png` and `qr/review.png`. Then open `print.html`, choose which card to print
and how many, and print on card stock - four cards per A4 sheet.

## Ordering, and why it is Toast's job

`config.orderUrl` puts an "Order & Pay" bar on the menu that hands the customer to Toast's own
ordering page. Empty by default, which is correct while the waiter takes every order.

The tempting alternative - a cart on this site that injects orders into Toast over the Partner
API - is not worth it for one restaurant. That API is gated behind an eight-stage partner process
with compliance, privacy, security and legal sign-off, a signed agreement, an assigned Toast rep
and a certification call before production, plus a revenue share. It exists for software companies
shipping to hundreds of locations. It would also mean a backend, card handling and a second menu
to keep in sync with this one.

Toast already generates an ordering site and a QR code for every live restaurant, takes the
payment, and drops the order into the POS with the menu kept in sync. So this site stays the front
door - photos, halal badge, hours, Google reviews - and Toast is the till.

Find the URL in Toast Web: Takeout & delivery -> Toast order sources -> Restaurant info.

## The admin dashboard

`admin.html` lets the restaurant change prices themselves without touching code or waiting on
anyone. It is at **albaik.dpdns.org/admin.html** - noindex, not linked from the menu.

They can change any price, mark a dish **Sold out**, flag a section **Coming soon**, and edit the
opening hours. They cannot add or remove dishes or edit descriptions - that keeps the blast radius
small, and those changes are rare enough to do by hand.

### How it is secured

There is no server, so there is nothing that can check a Google password. What actually publishes
a change is a GitHub token, and that token is never stored in the clear: it is encrypted with
AES-GCM under a key derived from the restaurant's password (PBKDF2-SHA256, 600k rounds) and kept
in `localStorage`. Signing in decrypts it. A wrong password fails to decrypt - it cannot be
bypassed by editing the page, because the ciphertext genuinely will not open.

The email is the username; the password is the protection. Use a fine-grained token limited to
**this repository only**, with **Contents: Read and write** and nothing else - then the worst a
leak can do is edit this menu, and revoking it on GitHub kills access instantly.

Setup is per device: open `admin.html`, paste the token, choose the password. After that the
restaurant only ever types a password.

### What happens on publish

One commit containing every changed file, so the site is never live half-updated:

- `assets/js/menu-data.js` regenerated from the edited menu
- `assets/js/config.js` if the hours changed
- **the `?v=` stamps in the HTML**, recomputed from the new file hashes

That last one is the part that is easy to miss. Without it the pages keep pointing at the old
asset URL, phones serve the copy they already have, and the new prices stay invisible for hours.
The dashboard computes the same SHA-1 stamp that `tools/stamp_version.py` does, so the two agree.

The commit message lists every change with its old and new price, so the git history doubles as
a price log and anything can be reverted.

## After any change: stamp the version

GitHub Pages serves everything with `Cache-Control: max-age=600`, and phones hold assets
longer than that in practice. Without a version stamp a price change can stay invisible for
hours to someone who scanned the QR earlier - the worst possible failure for a menu.

```bash
python tools/stamp_version.py      # then commit
```

It hashes the CSS, the JS and the logo and rewrites the `?v=` on every reference, so the URL
changes whenever the content does and browsers fetch the new copy. Run it after editing
`config.js`, `menu-data.js`, `app.js` or `style.css`, before committing.

## Menu images for Google

Google's listing wants menu photos. Do NOT photograph the printed board for this - the board
carries whatever prices were current when it was printed, and stale prices on a Google listing
are hard to get taken down. `tools/menu-sheets.html` renders the menu from `menu-data.js`
instead, so the images always match the site.

Open it with `?only=1`, `?only=2` and so on - one sheet at a time, flush to the top-left, which is
the only reliable way to screenshot it. Grabbing one element out of the full page came back offset
and clipped, and on a display whose devicePixelRatio is below 1 the sheet is drawn into fewer real
pixels than its CSS size, so `?only=` also scales by 1/dpr to get one CSS pixel onto one real pixel.
Crop the capture to `rect.width * devicePixelRatio` by `rect.height * devicePixelRatio`.

Sections are packed across two columns, the last sheet trims to its content so there is no
half-black page, and the header carries the address, phone and hours from `config.js`.

Re-run it after any price change and re-upload.

## The logo

The pages use the restaurant's own logo render, from `Update/images (11).pdf` - the file the
designer produced, not the copy printed on the board. The board copy is a soft photograph of a
sign (edges fading over ~9 pixels, only 1216px wide) and could never print crisply; the designer's
render has 2-3 pixel edges.

That render sits on black with a warm glow. On the black site the glow is invisible, but on white
sign stock it prints as a muddy haze, so `tools/build_logo_from_original.py` keys it out by
luminance and writes `assets/img/logo.png` (full res, transparent, used by the print sheet at
about 425 dpi) and `assets/img/logo.webp` (sized for the largest the site ever shows it).

```bash
python tools/build_logo_from_original.py    # rewrites assets/img/logo.png + logo.webp
```

`tools/build_logo.py` is the earlier fallback: it traces the same design as real vector art
(Archivo Black for the wordmark, Montserrat 800 for the tagline, both converted to outlines so no
font is needed) into `assets/img/logo.svg`. It is close but not the designer's exact letterforms,
so it is only worth reaching for at sizes past what the raster covers - a storefront banner, say.

## Photography

The food photos in `assets/img/` were cut out of the printed menu board artwork and re-encoded as
WebP - the restaurant's own imagery, no stock photos. `tools/extract_images.py` regenerates them
if the board is ever redrawn.

## Files

```
index.html          the menu
review.html         Google review landing page
print.html          printable QR cards
manifest.webmanifest  lets the menu be added to a phone home screen
assets/js/config.js   restaurant settings  <- edit this
assets/js/menu-data.js  the menu           <- edit prices here
assets/js/app.js    rendering, search, category rail, dish detail
assets/css/style.css
assets/img/         food photos + logo, cut from the menu board
tools/make_qr.py    QR generator
tools/extract_images.py  re-cuts the photos out of the board artwork
qr/                 generated QR codes
```

## Deploying a change

Push to `main`. GitHub Pages redeploys in about a minute. The QR codes point at the site root,
not at a version, so menu and price edits never require reprinting them.
