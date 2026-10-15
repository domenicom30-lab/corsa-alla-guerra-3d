#!/usr/bin/env python3
"""Visual regression tests for Corsa alla Guerra 2.1 art built from original sources."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parent.parent
forest=root/"public/assets/sprites/backgrounds"
far=forest/"forest-far.png"
near=forest/"forest-near.png"
tower=root/"public/assets/scenery/watchtower.png"
for p in (far,near,tower):
    if not p.is_file():raise SystemExit(f"ERROR: missing improved artwork: {p}")
with Image.open(far) as img:
    if img.size!=(1400,540):raise SystemExit("Invalid far forest dimensions")
    # Any giant field of bright random squares on the upper horizon is a regression.
    sky=img.crop((0,0,1400,145)).convert("RGB")
    bright=0;count=0
    for y in range(0,145,2):
        for x in range(0,1400,2):
            R,G,B=sky.getpixel((x,y))
            if R>185 and G>170 and B>140:bright+=1
            count+=1
    if bright/count>.015:raise SystemExit(f"Too many glaring sky speckles: {bright/count:.1%}")
with Image.open(near) as img:
    if img.size!=(1400,540):raise SystemExit("Invalid foreground forest dimensions")
    if not any(img.getpixel((x,300))[3]>200 for x in range(0,1400,40)):
        raise SystemExit("New forest crowns not rendered")
with Image.open(tower) as img:
    if img.size!=(600,960):raise SystemExit("Invalid illustrated watchtower dimensions")
    if img.getpixel((0,0))[3]!=0:raise SystemExit("Tower background must be transparent")
    if img.getpixel((300,300))[3]<200:raise SystemExit("Tower structure missing")
    if tower.stat().st_size<9000:raise SystemExit("Tower too simple")
hero=root/"public/assets/sprites/hero/run.png"
with Image.open(hero) as img:
    if img.size!=(240*8,210):raise SystemExit("Hero run sprite sheet invalid")
    opaque=sum(1 for x in range(55,180,3) for y in range(40,170,3)
               if img.getpixel((x,y))[3]>220)
    if opaque<200:raise SystemExit("Detailed protagonist missing")
print("PASS: clean atmospheric forest sky, natural canopy, detailed watchtower and raster hero.")
