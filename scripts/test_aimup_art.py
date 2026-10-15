#!/usr/bin/env python3
"""Aim-up visual regression: the rifle actually rotates in the authored PNG frame."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent.parent
p=root/"public/assets/sprites/hero/aimUp.png"
if not p.is_file():raise SystemExit("Hero aim-up sprite sheet is missing")
with Image.open(p) as im:
    if im.size!=(240*4,210):raise SystemExit("Aim-up atlas dimensions invalid")
    for frame in range(4):
        x=frame*240
        # Vertical barrel is visible above the helmet.
        if im.getpixel((x+135,17))[3]<150:raise SystemExit(f"Vertical rifle absent from pose {frame}")
        # Horizontal muzzle at 200px must NOT remain when pointing up.
        if im.getpixel((x+200,92))[3]>100:raise SystemExit(f"Horizontal weapon ghosted in pose {frame}")
print("PASS: four new upward aiming frames with raised rifle and no horizontal rifle ghost.")
