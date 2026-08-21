# AL BAIK - QR menu + review site

A static site. No server, no database, no monthly cost. It runs on GitHub Pages, so the link
works for anyone, anywhere - it is not tied to the restaurant's wifi or to any one computer.

Live URL: `https://huzaifa814.github.io/albaik-menu/`

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
python tools/make_qr.py --base https://huzaifa814.github.io/albaik-menu/
```

That writes `qr/menu.png` and `qr/review.png`. Then open `print.html`, choose which card to print
and how many, and print on card stock - four cards per A4 sheet.

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
