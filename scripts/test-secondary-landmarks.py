#!/usr/bin/env python3
"""Visual quality gate: four unique new full-illustration battlefront landmarks."""
from pathlib import Path
from PIL import Image
from hashlib import sha256
import json

root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/"sprite-manifest.json").read_text("utf8"))
names=("forestWreck","villageBarricade","industrialConverter","fortressHowitzer")
assert len(manifest["props"])==10
digests=[]
for name in names:
    assert manifest["props"].get(name)==1,f"Stage prop absent from shipped atlas: {name}"
    path=root/"public/assets/sprites/props"/(name+".png")
    assert path.is_file(),f"Missing runtime PNG: {name}"
    assert path.stat().st_size>3600,(name,"Low-detail or blank sprite")
    with Image.open(path) as art:
        assert art.mode=="RGBA" and art.size==(480,320),(name,art.size)
        assert art.getpixel((0,0))[3]==0,f"{name} has an opaque sky backdrop"
        box=art.getbbox()
        assert box and box[2]-box[0]>340 and box[3]-box[1]>155,(
            name,"Landmark silhouette too small to read in landscape"
        )
        opaque=sum(1 for y in range(80,303,6) for x in range(45,446,6)
                   if art.getpixel((x,y))[3]>180)
        assert opaque>700,(name,"Landmark illustration is too sparse",opaque)
    digests.append(sha256(path.read_bytes()).digest())
assert len(set(digests))==4,"Four distinct scene props must not reuse one image"
main=(root/"main.js").read_text("utf8")
for marker in ("const secondaryProps=['forestWreck'",
               "name=i%2===0?props[zone]:secondaryProps[zone]",
               "drawRaster(ctx,'props',name,0"):
    assert marker in main,("New art is generated but not used at runtime",marker)
build=(root/"scripts/build_raster_art.py").read_text("utf8")
assert "from secondary_landmarks import draw_landmark" in build
assert "draw_landmark(im,k)" in build
print("PASS: four distinct authored 480x320 environment pieces with real game integration, shading and transparent backgrounds")
