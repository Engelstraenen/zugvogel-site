#!/usr/bin/env python3
"""Prüft Rechner (Zimmer + Sessel → LKW wächst), Halteverbot-LKW, Leistungen, Versicherung. Screens nach /private/tmp/claude-501/zv-neu/"""
import os, sys
from playwright.sync_api import sync_playwright
W, H = (int(x) for x in (sys.argv[1] if len(sys.argv) > 1 else "1440x900").split("x"))
OUT = "/private/tmp/claude-501/zv-neu/"; os.makedirs(OUT, exist_ok=True)
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": W, "height": H})
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None); pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("http://localhost:4395/?v=%d" % os.getpid(), wait_until="domcontentloaded"); pg.wait_for_timeout(1500)
    tag = "%dx%d" % (W, H)
    pg.evaluate("document.getElementById('rechner').scrollIntoView()"); pg.wait_for_timeout(3200)
    for z in ["1", "2", "3", "4"]:
        pg.click("[data-preset='%s']" % z); pg.wait_for_timeout(1800)
        print(z, pg.evaluate("[document.getElementById('m3').textContent,document.getElementById('truckSize').textContent,document.getElementById('loadTxt').textContent,document.getElementById('truckMsg').textContent]"))
        pg.locator(".calc-out").screenshot(path=OUT + "%s_calc_z%s.jpg" % (tag, z), type="jpeg", quality=75)
    for k in range(1, 13):
        pg.click("button[aria-label='Sessel mehr']"); pg.wait_for_timeout(250)
        if k in (2, 6, 12):
            pg.wait_for_timeout(1500)
            print("sessel+%d" % k, pg.evaluate("[document.getElementById('m3').textContent,document.getElementById('truckSize').textContent,document.getElementById('truckMsg').textContent]"))
            pg.locator(".calc-out").screenshot(path=OUT + "%s_calc_s%02d.jpg" % (tag, k), type="jpeg", quality=75)
    hh = pg.evaluate("document.getElementById('halteverbot').offsetHeight")
    for f in [0.1, 0.5, 0.7, 0.85, 1.0]:
        pg.evaluate("f=>{const s=document.getElementById('halteverbot');window.scrollTo(0,s.offsetTop+(s.offsetHeight-innerHeight)*f)}", f); pg.wait_for_timeout(900)
        pg.screenshot(path=OUT + "%s_hvz_%03d.jpg" % (tag, f * 100), type="jpeg", quality=75)
    pg.evaluate("document.getElementById('leistungen').scrollIntoView()"); pg.wait_for_timeout(1500)
    pg.click("[data-sv='lager']"); pg.wait_for_timeout(700)
    pg.screenshot(path=OUT + "%s_leist.jpg" % tag, type="jpeg", quality=75)
    pg.evaluate("document.getElementById('versichert').scrollIntoView()"); pg.wait_for_timeout(1200)
    pg.screenshot(path=OUT + "%s_vers.jpg" % tag, type="jpeg", quality=75)
    print("hdr", pg.evaluate("()=>{let m=0;document.querySelectorAll('.top a,.top button').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&getComputedStyle(e).visibility!='hidden')m=Math.max(m,r.right)});return [Math.round(m),innerWidth,document.documentElement.scrollWidth]}"))
    b.close()
print("errs", errs[:5])
