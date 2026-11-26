#!/usr/bin/env python3
"""720P-Clip (Dreamina Unlimited) kostenlos auf 1920x1080 hochskalieren (Lanczos), Schärfe vorher/nachher messen.
Start: python3 tools/upscale.py <roh.mp4> <ziel.mp4>
Danach: python3 tools/video.py <ziel.mp4> lift|sofa|crew  (schärft dort mit unsharp 0.7 nach, All-Intra)."""
import subprocess, sys
import numpy as np
from PIL import Image, ImageFilter


def frame(src, t):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-ss", str(t), "-i", src, "-frames:v", "1",
                                   "-vf", "scale=1920:1080:flags=lanczos", "-f", "rawvideo", "-pix_fmt", "gray", "-"])
    return np.frombuffer(raw, np.uint8).reshape(1080, 1920).astype(np.float32)


def lap(a):
    k = a[1:-1, 1:-1] * -4 + a[:-2, 1:-1] + a[2:, 1:-1] + a[1:-1, :-2] + a[1:-1, 2:]
    return float(k.var())


src, dst = sys.argv[1], sys.argv[2]
subprocess.check_call(["ffmpeg", "-y", "-v", "error", "-i", src, "-an", "-vf",
                       "scale=1920:1080:flags=lanczos,format=yuv420p",
                       "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-movflags", "+faststart", dst])
for t in (1, 5, 9):
    print("t=%ds Schärfe vorher %.0f  nachher %.0f" % (t, lap(frame(src, t)), lap(frame(dst, t))))
