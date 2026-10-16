#!/usr/bin/env python3
"""Distinct, 4-frame original slide and melee artwork regression."""
from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/"sprite-manifest.json").read_text("utf8"))
for pose in ("slide","melee","land"):
    frames={"slide":6,"melee":5,"land":4}[pose]
    if manifest["hero"].get(pose)!=frames:raise SystemExit(f"{pose} must have {frames} frames")
    p=root/"public/assets/sprites/hero"/(pose+".png")
    if not p.is_file():raise SystemExit(f"Missing hero pose {pose}")
    with Image.open(p) as im:
        if im.size!=(frames*240,210) or im.mode!="RGBA":raise SystemExit("Invalid hero art format")
        frames=[im.crop((i*240,0,(i+1)*240,210)) for i in range(frames)]
        if len({hashlib.sha256(f.tobytes()).digest() for f in frames})<min(len(frames),4):
            raise SystemExit(f"{pose} frames are not sufficiently animated")
        if any(f.getbbox() is None or f.getbbox()[2]-f.getbbox()[0]<140 for f in frames):
            raise SystemExit(f"{pose} has missing / undersized frames")
with Image.open(root/"public/assets/sprites/hero/slide.png") as slide:
    # Helmet is lower than in a standard standing run; boots remain near the floor.
    bbox=slide.crop((0,0,240,210)).getbbox()
    if bbox is None or bbox[1]<65 or bbox[3]<180:
        raise SystemExit("Slide must visibly lower head and keep shoes grounded")
print("PASS: 4 unique animated low-slide frames and 4 bayonet melee frames.")
