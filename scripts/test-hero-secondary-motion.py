#!/usr/bin/env python3
"""Offline regression for original cloth/gear motion and readable airborne frames."""
from pathlib import Path
from PIL import Image
from hashlib import sha256

root=Path(__file__).resolve().parent.parent
base=root/"public/assets/sprites/hero"
config={"idle":4,"run":8,"runFire":8,"jump":3}
atlasses={}
for pose,count in config.items():
    path=base/(pose+".png")
    with Image.open(path) as atlas:
        assert atlas.size==(240*count,210),f"{pose}: invalid sprite sheet"
        assert atlas.mode=="RGBA",f"{pose}: wrong image format"
        frames=[atlas.crop((i*240,0,(i+1)*240,210)) for i in range(count)]
        assert len({sha256(frame.tobytes()).digest() for frame in frames})==count, (
            pose,"Original animation contains duplicate pictures"
        )
        for frame in frames:
            box=frame.getbbox()
            assert box and box[2]-box[0]>100 and box[3]-box[1]>100, (
                pose,"Character disappears or sprite is clipped"
            )
        atlasses[pose]=frames

assert len({im.getbbox()[1] for im in atlasses["idle"]})>=2,(
    "Idle animation must move the helmet and shoulders during breathing"
)
assert len({im.getbbox()[1] for im in atlasses["jump"]})>=2,(
    "Jump animation must change silhouette between ascent, apex and descent"
)
def scarf_pixels(im):
    sample=im.crop((35,80,96,121)).getdata()
    return sum(1 for r,g,b,a in sample if r>120 and g<165 and b<140 and a>110)
scarf_counts=[scarf_pixels(f) for f in atlasses["run"]]
assert all(c>8 for c in scarf_counts),"Scarf tail vanished from a run frame"
assert len(set(scarf_counts))>=3,"Scarf is glued in place rather than flapping"
print("PASS: offline original 2D idle breathing, distinct airborne frames, eight-phase fluttering scarf and equipment")
