#!/usr/bin/env python3
"""Scroll-Videos für ein Filmkapitel bauen, OHNE Verkleinern.

Start: python3 tools/video.py <roh.mp4> <kapitel> [--t <sekunden>]   (kapitel = lift | sofa | crew)
Ziel:  site/assets/vid/<kapitel>.mp4    Desktop: volle Quellauflösung, All-Intra (jedes Bild Keyframe -> ruckelfreies Spulen)
       site/assets/vid/<kapitel>-p.mp4  Handy hochkant: Ausschnitt 3:4 in voller Quellhöhe, Lage wie object-position
       site/assets/vid/<kapitel>-m.mp4  Handy quer: ganzes Bild, höchstens 1280 breit
Trägt das Kapitel in site/assets/js/vid.js ein (Versionsstempel). Nie hochskalieren.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "site", "assets", "vid")
RAW = os.path.join(ROOT, "assets-roh", "vid")
VJS = os.path.join(ROOT, "site", "assets", "js", "vid.js")
POS = {"lift": 0.42, "sofa": 0.5, "crew": 0.3}  # x-Lage des Handy-Ausschnitts (wie object-position in style.css)


def size(src):
    o = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0",
                                 "-show_entries", "stream=width,height", "-of", "csv=p=0", src]).decode()
    w, h = (int(x) for x in o.strip().split(",")[:2])
    return w, h


def enc(src, dst, vf, crf, t=None):
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", src]
    if t:
        cmd += ["-t", str(t)]
    cmd += ["-an", "-vf", vf + ",format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", str(crf),
            "-tune", "film", "-g", "1", "-keyint_min", "1", "-sc_threshold", "0", "-movflags", "+faststart", dst]
    subprocess.check_call(cmd)
    return os.path.getsize(dst) // 1024


def main():
    a = sys.argv[1:]
    t = None
    if "--t" in a:
        i = a.index("--t")
        t = float(a[i + 1])
        del a[i:i + 2]
    src, ch = a[0], a[1]
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(RAW, exist_ok=True)
    keep = os.path.join(RAW, ch + "-roh" + os.path.splitext(src)[1])
    if os.path.abspath(src) != os.path.abspath(keep):
        shutil.copy2(src, keep)
    w, h = size(src)
    k1 = enc(src, os.path.join(OUT, ch + ".mp4"), "null", 20, t)
    pw = (h * 3 // 4) // 2 * 2
    x = int(max(0, min(w - pw, POS.get(ch, .5) * w - pw / 2)))
    k2 = enc(src, os.path.join(OUT, ch + "-p.mp4"), "crop=%d:%d:%d:0" % (pw, h, x), 21, t)
    mw = min(1280, w)
    k3 = enc(src, os.path.join(OUT, ch + "-m.mp4"), "scale=%d:-2:flags=lanczos" % mw if mw < w else "null", 22, t)
    try:
        cur = json.loads(re.search(r"=\s*(\{.*\})", open(VJS).read()).group(1))
    except Exception:
        cur = {}
    cur[ch] = "%dx%d" % (w, h)
    cur["_v"] = int(time.time())
    open(VJS, "w").write("window.ZV_VID = " + json.dumps(cur) + ";\n")
    print(ch, "%dx%d" % (w, h), "Desktop %d KB, hochkant %dx%d %d KB, quer %d KB" % (k1, pw, h, k2, k3))


if __name__ == "__main__":
    main()
