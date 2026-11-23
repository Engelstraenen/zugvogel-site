#!/usr/bin/env python3
"""4K-Startbilder -> WebP für die Seite (Desktop 3840 px, Handy 1800 px), mit Cache.

Start: python3 tools/assets.py
Quelle: assets-roh/img/zv-*.jpg (sjinn 5504x3072)  Ziel: site/assets/img/zv-*.webp + zv-*-m.webp
Cache (tools/.assets_cache.json): unveränderte Quellen (Größe + Änderungszeit) werden nicht geöffnet
(Dropbox lädt ausgelagerte Bilder sonst bei jedem Öffnen neu). Nie hochskalieren.
"""
import glob
import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-roh", "img")
OUT = os.path.join(ROOT, "site", "assets", "img")
CACHE = os.path.join(ROOT, "tools", ".assets_cache.json")
SIZES = (("", 3840, 82), ("-m", 1800, 80))


def main():
    os.makedirs(OUT, exist_ok=True)
    try:
        cache = json.load(open(CACHE))
    except Exception:
        cache = {}
    for src in sorted(glob.glob(os.path.join(SRC, "zv-*.jpg"))):
        name = os.path.splitext(os.path.basename(src))[0]
        st = os.stat(src)
        key = "%d-%d" % (st.st_size, int(st.st_mtime))
        outs = [os.path.join(OUT, name + suf + ".webp") for suf, _, _ in SIZES]
        if cache.get(name, {}).get("key") == key and all(os.path.exists(o) for o in outs):
            print("unverändert", name, cache[name]["px"])
            continue
        im = Image.open(src).convert("RGB")
        w, h = im.size
        for (suf, tw, q), o in zip(SIZES, outs):
            tw = min(tw, w)
            r = im if tw == w else im.resize((tw, round(h * tw / w)), Image.LANCZOS)
            r.save(o, "WEBP", quality=q, method=5)
        cache[name] = {"key": key, "px": "%dx%d" % (w, h)}
        print("neu", name, "%dx%d" % (w, h), [os.path.getsize(o) // 1024 for o in outs], "KB")
    json.dump(cache, open(CACHE, "w"), indent=1)


if __name__ == "__main__":
    main()
