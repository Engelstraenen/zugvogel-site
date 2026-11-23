#!/usr/bin/env python3
"""Farbwelt-Vorschau: je Farbwelt 6 echte Screenshots der Seite (Desktop) + 2 Handy auf einem Board.
Start: python3 tools/farb_board.py tanne graphit aubergine"""
import sys, os
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
URL = "http://localhost:4395/"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vorschau")
SH = [("lift", .0), ("lift", .5), ("festpreis", .76), ("rechner", .5), ("besichtigung", .85), ("karriere", .9), ("halteverbot", .9), ("bewertungen", .5)]
MOB = [("lift", .0), ("rechner", .6)]
font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 34)
for i, th in enumerate(sys.argv[1:], 1):
    shots, mshots = [], []
    with sync_playwright() as p:
        b = p.chromium.launch()
        for vp, lst, dst in (((1440, 900), SH, shots), ((390, 844), MOB, mshots)):
            pg = b.new_page(viewport={"width": vp[0], "height": vp[1]}, device_scale_factor=1)
            pg.goto(URL + "?farbe=" + th, wait_until="networkidle"); pg.wait_for_timeout(1500)
            for ch, f in lst:
                pg.evaluate("([id,f])=>{const s=document.getElementById(id);window.scrollTo(0,s.offsetTop+Math.max(0,s.offsetHeight-innerHeight)*f)}", [ch, f])
                pg.wait_for_timeout(1300 if ch == "bewertungen" else 700)
                fn = "/private/tmp/claude-501/zv-check/fb_%s_%s_%d_%d.jpg" % (th, ch, f * 100, vp[0]); pg.screenshot(path=fn, type="jpeg", quality=82); dst.append(fn)
            pg.close()
        b.close()
    TW, TH = 720, 450; MW, MH = 208, 450
    W = 4 * TW + 5 * 12 + MW * 2 + 12 * 2; H = 2 * TH + 3 * 12 + 60
    bd = Image.new("RGB", (W, H), (16, 16, 18)); d = ImageDraw.Draw(bd)
    d.text((14, 12), "%d · %s" % (i, {"tanne": "Tanne & Messing", "graphit": "Graphit & Neongelb", "aubergine": "Aubergine & Mint"}.get(th, th)), fill=(240, 240, 240), font=font)
    for k, fn in enumerate(shots):
        r, c = divmod(k, 4); bd.paste(Image.open(fn).resize((TW, TH)), (12 + c * (TW + 12), 60 + r * (TH + 12)))
    for k, fn in enumerate(mshots):
        x = 12 + 4 * (TW + 12) + k * (MW + 12); bd.paste(Image.open(fn).resize((MW, MH)), (x, 60 + (TH + 12) // 2))
    out = os.path.join(OUT, "farbe-%d-%s.jpg" % (i, th)); bd.save(out, quality=85); print(out, bd.size)
