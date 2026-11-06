#!/usr/bin/env python3
"""Bundle the game into one HTML file that needs no server and no network.

Run from anywhere:  python3 tools/build-offline.py

The result is offline/LittleSpeller.html — copy that single file onto a tablet
and open it in a browser. Nothing is fetched at runtime.
"""

import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent.parent
public = root / "public"

html = (public / "index.html").read_text(encoding="utf-8")
css = (public / "styles.css").read_text(encoding="utf-8")
js = (public / "game.js").read_text(encoding="utf-8")

# A closing tag inside the inlined code would end the block early.
for name, text, closer in (("styles.css", css, "</style"), ("game.js", js, "</script")):
    if closer in text.lower():
        sys.exit(f"Refusing to inline {name}: it contains {closer}")

replacements = [
    ('<link rel="stylesheet" href="styles.css" />', f"<style>\n{css}\n</style>"),
    ('<script src="game.js"></script>', f"<script>\n{js}\n</script>"),
]
for old, new in replacements:
    if old not in html:
        sys.exit(f"Refusing to inline: could not find {old}")
    html = html.replace(old, new)

out = root / "offline" / "LittleSpeller.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf-8")
print(f"wrote {out.relative_to(root)} ({out.stat().st_size:,} bytes)")
