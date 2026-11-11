"""Build the standalone hands-on demo: inline the photos as data URIs into template.html.

Usage: python docs/demo/highlights/build.py <image_dir>
Writes docs/demo/livestage-highlights.html (one file, opens offline in any browser).
"""
import base64
import json
import sys
from pathlib import Path

here = Path(__file__).parent
img_dir = Path(sys.argv[1])
images = {}
for f in sorted(img_dir.iterdir()):
    if f.suffix.lower() in (".jpg", ".jpeg", ".webp", ".png"):
        mime = {"jpg": "jpeg"}.get(f.suffix[1:].lower(), f.suffix[1:].lower())
        images[f.stem] = f"data:image/{mime};base64," + base64.b64encode(f.read_bytes()).decode()
html = (here / "template.html").read_text(encoding="utf-8").replace("__IMAGES__", json.dumps(images), 1)
out = here.parent / "livestage-highlights.html"
out.write_text(html, encoding="utf-8")
print(f"{out} · {len(images)} images · {out.stat().st_size / 1024:.0f} KB")
