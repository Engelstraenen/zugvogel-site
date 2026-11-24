#!/usr/bin/env python3
"""Desktop-Prüfung: Screenshots je Kapitel (4 Scroll-Stände), Konsolenfehler, Kopfzeilen-Kante, Kontaktbogen.
Start: python3 tools/desk_check.py [BxH] [url]"""
import os, sys
from playwright.sync_api import sync_playwright
from PIL import Image
W, H = (int(x) for x in (sys.argv[1] if len(sys.argv) > 1 else "1440x900").split("x"))
URL = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:4395/"
OUT = "/private/tmp/claude-501/zv-check/"; os.makedirs(OUT, exist_ok=True)
CH = ["lift", "festpreis", "rechner", "besichtigung", "halteverbot", "live", "karriere", "bewertungen", "termin"]
shots, errs = [], []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": W, "height": H})
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None); pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="domcontentloaded"); pg.wait_for_timeout(2500)
    for ch in CH:
        hh = pg.evaluate("(id)=>document.getElementById(id).offsetHeight", ch)
        for f in ([0, .35, .7, 1] if hh > H * 1.3 else [.5]):
            pg.evaluate("([id,f])=>{const s=document.getElementById(id);window.scrollTo(0,s.offsetTop+Math.max(0,s.offsetHeight-innerHeight)*f)}", [ch, f]); pg.wait_for_timeout(600)
            fn = OUT + "d_%s_%03d.jpg" % (ch, f * 100); pg.screenshot(path=fn, type="jpeg", quality=70); shots.append(fn)
    hdr = pg.evaluate("()=>{let m=0;document.querySelectorAll('.top a,.top button').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&getComputedStyle(e).visibility!='hidden')m=Math.max(m,r.right)});return [Math.round(m),innerWidth,document.documentElement.scrollWidth]}")
    b.close()
TW = 360; TH = int(TW * H / W); per = 5; rows = (len(shots) + per - 1) // per
sh = Image.new("RGB", (per * (TW + 6), rows * (TH + 6)), (30, 30, 30))
for i, fn in enumerate(shots):
    r, c = divmod(i, per); sh.paste(Image.open(fn).resize((TW, TH)), (c * (TW + 6), r * (TH + 6)))
sh.save(OUT + "desk_%dx%d.jpg" % (W, H), quality=75)
print("errs", errs[:5]); print("kopfzeile rechts/breite/scrollW", hdr)
