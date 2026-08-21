# AL BAIK - QR menu + review site

A static site. No server, no database, no monthly cost. It runs on GitHub Pages.

Live URL: `https://huzaifa814.github.io/albaik-menu/`

## What it does

- **Table QR -> menu.** A customer scans the QR on the table, the full menu opens on their phone.
  The QR carries the table number (`?t=7`), so the site already knows where they are sitting.
- **Order.** They tap items, pick size / flavour / side, add notes, then either
  **Send order on WhatsApp** (opens WhatsApp with the whole order typed out, addressed to the
  restaurant's number) or **Show this order to the waiter** (a clean ticket on screen).
  Nothing is charged online - the customer pays at the table as usual.
- **Review QR -> Google.** A second QR goes to `review.html`, one tap from the Google review box.

## Setup (one file)

Everything the restaurant changes lives in [`assets/js/config.js`](assets/js/config.js):

| Field | What to put |
|---|---|
| `whatsapp` | The number orders go to, international format, digits only (`923123456789`) |
| `phoneDisplay` | The number shown on the page |
| `reviewUrl` | Google review link (Business Profile -> Read reviews -> Get more reviews -> Share review form) |
| `placeId` | Alternative to `reviewUrl` - the Google Place ID |
| `currency` | Symbol shown next to prices |
| `tables` | How many table QRs to print |

Prices and dishes live in [`assets/js/menu-data.js`](assets/js/menu-data.js) - one line per item.

## Printing the QR codes

```bash
pip install qrcode pillow
python tools/make_qr.py --base https://huzaifa814.github.io/albaik-menu/ --tables 20
```

That writes `qr/table-01.png` ... `qr/table-20.png`, `qr/menu.png` and `qr/review.png`.

Then open `print.html` in a browser, pick **Table menu QR** or **Google review QR**, and print on
card stock. Four cards per A4 page.

## Files

```
index.html          menu + cart + order handoff
review.html         Google review landing page
print.html          printable QR cards
assets/js/config.js restaurant settings  <- edit this
assets/js/menu-data.js  the menu         <- edit prices here
assets/js/app.js    menu rendering, cart, WhatsApp handoff
assets/css/style.css
tools/make_qr.py    QR generator
qr/                 generated QR codes
```

## Deploying a change

Push to `main`. GitHub Pages redeploys in about a minute. The QR codes never change -
they point at the site root, not at a version - so re-printing is only needed if the domain changes.
