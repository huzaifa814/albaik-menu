"""Build the AL BAIK wordmark as real vector art.

The logo on the printed menu board is a soft 3D render - its letter edges fade over ~9
pixels, so no amount of sharpening makes it crisp. This rebuilds the same design as
outlines: red faces, gold bevel, gold underline bar, tagline and swoosh, all as SVG paths
with no font dependency, so it stays sharp at any size including a banner.

    python tools/build_logo.py

Writes assets/img/logo.svg. Run tools/render_logo.py afterwards to rasterise the PNG/WebP
copies the site and the print sheet use.
"""
import os

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# display face for the wordmark, lighter face for the tagline (as on the original board)
FONT = os.path.join(ROOT, "tools", os.environ.get("LOGO_FONT", "archivoblack.ttf"))
TAG_FONT = os.path.join(ROOT, "tools", os.environ.get("LOGO_TAG_FONT", "montserrat800.ttf"))
OUT = os.path.join(ROOT, "assets", "img", os.environ.get("LOGO_OUT", "logo.svg"))

SLANT = -11          # degrees of italic lean, measured off the original
GOLD_TOP = "#ffd94a"
GOLD_MID = "#f5a01c"
GOLD_DEEP = "#b96f06"
RED_TOP = "#ff5c38"
RED_MID = "#ee2a17"
RED_DEEP = "#c2150b"


def glyph_paths(text, size, tracking=0.0, font_path=None):
    """Return (svg path data, advance width) for a string, laid out at `size` units em."""
    font = TTFont(font_path or FONT)
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font["head"].unitsPerEm
    scale = size / upm

    parts, x = [], 0.0
    for ch in text:
        name = cmap.get(ord(ch))
        if name is None:
            x += size * 0.3
            continue
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        d = pen.getCommands()
        if d:
            # glyph space is y-up, SVG is y-down: flip while scaling
            parts.append(f'<path transform="translate({x:.2f},0) scale({scale:.5f},{-scale:.5f})" d="{d}"/>')
        x += glyphs[name].width * scale + tracking
    return "".join(parts), x - tracking


def layer(paths, width, dx, dy, fill, extrude=0):
    """One pass of the wordmark. `extrude` repeats it to fake the 3D side wall."""
    out = []
    if extrude:
        for i in range(extrude, 0, -1):
            ox, oy = dx - i * 0.9, dy + i * 0.9
            out.append(f'<g transform="translate({ox:.2f},{oy:.2f})" fill="{GOLD_DEEP}">{paths}</g>')
    out.append(f'<g transform="translate({dx:.2f},{dy:.2f})" fill="{fill}">{paths}</g>')
    return "".join(out)


def main() -> None:
    word, word_w = glyph_paths("AL BAIK", 300, tracking=9)
    tag, tag_w = glyph_paths("CHICKEN N PIZZA", 82, tracking=14, font_path=TAG_FONT)

    W, H = 1400, 700
    cx = W / 2

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{GOLD_TOP}"/><stop offset="55%" stop-color="{GOLD_MID}"/>
      <stop offset="100%" stop-color="{GOLD_DEEP}"/>
    </linearGradient>
    <linearGradient id="red" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{RED_TOP}"/><stop offset="58%" stop-color="{RED_MID}"/>
      <stop offset="100%" stop-color="{RED_DEEP}"/>
    </linearGradient>
    <linearGradient id="barGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{GOLD_TOP}"/><stop offset="60%" stop-color="{GOLD_MID}"/>
      <stop offset="100%" stop-color="{GOLD_DEEP}"/>
    </linearGradient>
  </defs>

  <g transform="skewX({SLANT})">

    <!-- WORDMARK: extruded side wall, gold rim, red face -->
    <g transform="translate({cx - word_w / 2 + 78:.1f},300)">
      {layer(word, word_w, 0, 0, "url(#gold)", extrude=23)}
      <g fill="none" stroke="url(#gold)" stroke-width="42" stroke-linejoin="round">{word}</g>
      <g fill="url(#red)" stroke="{RED_DEEP}" stroke-width="4" stroke-linejoin="round">{word}</g>
    </g>

    <!-- UNDERLINE BAR, same extrusion -->
    <g transform="translate({cx + 78:.1f},352)">
      <g fill="{GOLD_DEEP}"><rect x="{-word_w / 2 - 24:.1f}" y="10" width="{word_w + 48:.1f}" height="30" rx="8"/></g>
      <rect x="{-word_w / 2 - 24:.1f}" y="0" width="{word_w + 48:.1f}" height="30" rx="8" fill="url(#barGold)"/>
    </g>

    <!-- TAGLINE -->
    <g transform="translate({cx - tag_w / 2 + 92:.1f},478)">
      {layer(tag, tag_w, 0, 0, "url(#gold)", extrude=6)}
      <g fill="url(#gold)" stroke="{GOLD_DEEP}" stroke-width="3.5" stroke-linejoin="round">{tag}</g>
    </g>
  </g>

  <!-- SWOOSH: gold crescent over a red underside, as on the board -->
  <g transform="translate(700,545)">
    <path d="M -320 -26 Q 0 132 320 -46 Q 0 78 -320 -26 Z" fill="{RED_MID}" transform="translate(0,14)"/>
    <path d="M -320 -34 Q 0 124 320 -54 Q 0 62 -320 -34 Z" fill="url(#gold)"/>
  </g>
</svg>
'''
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(svg)
    print(f"wrote {OUT}  ({os.path.getsize(OUT) // 1024} KB, text converted to outlines)")


if __name__ == "__main__":
    main()
