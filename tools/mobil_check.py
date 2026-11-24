#!/usr/bin/env python3
"""Handy-Prüfung aller Kapitel, Menü, Modal, Bewerbungs-Tool und Footer.

Start: python3 tools/mobil_check.py [url] [ausgabeordner] [--nur 390x844,844x390]
Macht je Viewport (390x844, 360x740, 430x932, quer 844x390) Screenshots von jedem Kapitel bei
9 Scroll-Ständen, prüft automatisch Querscroll, abgeschnittene Texte, zu kleine Schrift (<14 px),
zu kleine Tipp-Flächen (<44 px), überlappende Texte und Konsolenfehler, baut je Viewport Kontaktbögen.
"""
import json
import os
import sys
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

a = sys.argv[1:]
nur = None
if "--nur" in a:
    i = a.index("--nur")
    nur = a[i + 1].split(",")
    del a[i:i + 2]
URL = a[0] if a else "http://localhost:4395/"
OUT = a[1] if len(a) > 1 else "/private/tmp/claude-501/zv-check/mobil/"
os.makedirs(OUT, exist_ok=True)
VPS = [(390, 844), (360, 740), (430, 932), (844, 390)]
if nur:
    VPS = [tuple(int(x) for x in v.split("x")) for v in nur]
CH = ["lift", "festpreis", "rechner", "besichtigung", "halteverbot", "live", "karriere", "bewertungen", "termin"]
STEPS = [0, .125, .25, .375, .5, .625, .75, .875, 1]

PROBE = r"""
() => {
  const W = innerWidth, H = innerHeight, out = {clip: [], small: [], tap: [], over: []};
  const eff = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return 0; o *= +s.opacity; } return o; };
  const name = el => (el.className && typeof el.className === 'string' ? el.tagName.toLowerCase() + '.' + el.className.split(' ')[0] : el.tagName.toLowerCase()) + ' "' + (el.innerText || el.value || '').trim().slice(0, 28).replace(/\s+/g, ' ') + '"';
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < H && eff(el) > .15 ? r : null; };
  const dlg = document.querySelector('dialog[open]');
  const scope = dlg || document;
  const texts = [...scope.querySelectorAll('h1,h2,h3,h4,p,blockquote,figcaption,label,button,a,span,b,small,output,.word,.stars')]
    .filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1));
  const boxes = [];
  for (const el of texts) {
    const r = vis(el); if (!r) continue;
    if (el.closest('.marquee')) continue;  // Laufband läuft gewollt über den Rand
    // abgeschnitten: Text ragt über den Bildschirmrand oder wird vom Elternteil mit overflow:hidden gekappt
    if (r.left < -1 || r.right > W + 1) out.clip.push(name(el) + ' x ' + Math.round(r.left) + '..' + Math.round(r.right));
    else if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible') out.clip.push(name(el) + ' überläuft');
    const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 14) out.small.push(name(el) + ' ' + fs.toFixed(1) + 'px');
    boxes.push([el, r]);
  }
  for (const el of scope.querySelectorAll('button,a,input,select,label.shot,label.shot2,[role=radio]')) {
    const r = vis(el); if (!r) continue; if (el.type === 'hidden') continue;
    if (r.height < 44 && r.width < 200 || r.height < 30) out.tap.push(name(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  }
  const blocks = boxes.filter(([el]) => /^(H1|H2|H3|H4|P|BLOCKQUOTE|BUTTON|LABEL)$/.test(el.tagName));
  for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) {
    const [a, ra] = blocks[i], [b, rb] = blocks[j];
    if (a.contains(b) || b.contains(a)) continue;
    if (a.closest('.deck') && b.closest('.deck')) continue;  // gestapelte Wisch-Karten sind gewollt
    const ix = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left)), iy = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
    const m = Math.min(ra.width * ra.height, rb.width * rb.height);
    if (ix * iy > .12 * m) out.over.push(name(a) + ' <> ' + name(b));
  }
  out.qs = document.documentElement.scrollWidth - W;
  return out;
}
"""

font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 18)
alle = {}
for (w, h) in VPS:
    tag = "%dx%d" % (w, h)
    issues = {}
    shots = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=2, is_mobile=True, has_touch=True)
        errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL, wait_until="domcontentloaded")
        try:
            pg.wait_for_function("!(window.ZV_VID||{}).lift || document.querySelector('[data-key=lift]').closest('.media').classList.contains('has-vid')", timeout=180000)
        except Exception:
            errs.append("videos nicht geladen")
        pg.wait_for_timeout(800)

        def snap(label):
            pg.wait_for_timeout(700)
            fn = OUT + "%s_%s.jpg" % (tag, label)
            pg.screenshot(path=fn, type="jpeg", quality=72)
            r = pg.evaluate(PROBE)
            for k in ("clip", "small", "tap", "over"):
                for x in r[k]:
                    issues.setdefault(k + ": " + x, []).append(label)
            if r["qs"] > 0:
                issues.setdefault("querscroll %d px" % r["qs"], []).append(label)
            shots.append((label, fn))

        for ch in CH:
            hh = pg.evaluate("(id)=>{const s=document.getElementById(id);return s.offsetHeight}", ch)
            steps = STEPS if hh > h * 1.3 else [0, .5, 1]
            for f in steps:
                pg.evaluate("([id,f])=>{const s=document.getElementById(id);window.scrollTo(0,s.offsetTop+Math.max(0,s.offsetHeight-innerHeight)*f)}", [ch, f])
                snap("%s-%03d" % (ch, int(f * 100)))
        pg.evaluate("window.scrollTo(0,document.documentElement.scrollHeight)")
        snap("footer")
        # Menü
        pg.evaluate("window.scrollTo(0,0)")
        if pg.is_visible("#burger"):
            pg.click("#burger")
            snap("menue")
            pg.click("#burger")
        # Festpreis-Anfrage + Bewerbung durchklicken
        for mid in ("anfrage", "job"):
            pg.evaluate("(id)=>{const m=document.getElementById(id);m.querySelectorAll('.step').forEach((s,i)=>s.classList.toggle('on',i===0));m.showModal()}", mid)
            snap(mid + "-1")
            for k in range(3):
                try:
                    pg.click("#%s .step.on [data-next]" % mid, timeout=3000)
                except Exception:
                    break
                snap("%s-%d" % (mid, k + 2))
            pg.evaluate("(id)=>document.getElementById(id).close()", mid)
        b.close()
    if errs:
        issues["konsole: " + " | ".join(errs[:3])] = ["seite"]
    alle[tag] = issues
    # Kontaktbogen
    TW = 180 if h > w else 300
    TH = int(TW * h / w)
    per = 9 if h > w else 5
    rows = (len(shots) + per - 1) // per
    sheet = Image.new("RGB", (per * (TW + 8) + 8, rows * (TH + 30) + 8), (24, 24, 24))
    d = ImageDraw.Draw(sheet)
    for i, (lab, fn) in enumerate(shots):
        r, c = divmod(i, per)
        x, y = 8 + c * (TW + 8), 8 + r * (TH + 30)
        d.text((x, y), lab, fill=(255, 220, 80), font=font)
        sheet.paste(Image.open(fn).resize((TW, TH)), (x, y + 24))
    sheet.save(OUT + "bogen_%s.jpg" % tag, quality=78)

for tag, iss in alle.items():
    print("==", tag, len(iss), "Befunde")
    for k, v in sorted(iss.items()):
        print("  ", k, "@", ",".join(v[:6]) + (" …+%d" % (len(v) - 6) if len(v) > 6 else ""))
json.dump(alle, open(OUT + "befunde.json", "w"), ensure_ascii=False, indent=1)
