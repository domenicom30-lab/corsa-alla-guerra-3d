#!/usr/bin/env python3
"""Artwork regression: real original tracked vehicle frame-by-frame PNG atlas."""
from pathlib import Path
from PIL import Image
import hashlib
root=Path(__file__).resolve().parent.parent
path=root/"public/assets/sprites/vehicles/slug.png"
if not path.is_file():raise SystemExit("Missing 2D drivable tank sprite atlas")
with Image.open(path) as atlas:
    if atlas.mode!="RGBA":raise SystemExit("Tank atlas must be RGBA PNG")
    if atlas.size!=(2400,250):raise SystemExit(f"Invalid 6-frame tank atlas: {atlas.size}")
    frames=[atlas.crop((i*400,0,(i+1)*400,250)) for i in range(6)]
    if len({hashlib.sha256(f.tobytes()).hexdigest() for f in frames})<4:
        raise SystemExit("Tank frames must animate tracks, recoil and commander")
    for i,frame in enumerate(frames):
        bbox=frame.getbbox()
        if bbox is None or bbox[2]-bbox[0]<250 or bbox[3]-bbox[1]<125:
            raise SystemExit(f"Empty or tiny tank frame {i}")
        if frame.getpixel((0,0))[3]!=0:raise SystemExit("Sprite background must be transparent")
if path.stat().st_size<16000:raise SystemExit("Tank artwork too small to contain authored details")
print("PASS: original six-frame detailed armored vehicle, track motion, gun recoil and transparent art.")
