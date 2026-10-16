#!/usr/bin/env python3
"""Original arcade 2D v2.6: stage landmarks and crouched firing regression."""
import hashlib, json
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/"sprite-manifest.json").read_text("utf-8"))
assert manifest["hero"]["duckFire"]==4
assert len(manifest["props"])==10
names=["forestPost","ruinHouse","factoryMachinery","fortressGate"]
digests=[]
for name in names:
    path=root/"public/assets/sprites/props"/(name+".png")
    assert path.is_file(),f"Missing stage artwork {name}"
    with Image.open(path) as art:
        assert art.size==(480,320),f"Wrong stage dimensions for {name}"
        assert art.getpixel((0,0))[3]==0,f"{name} must have transparent background"
        opaque=sum(1 for x in range(60,440,8) for y in range(70,306,8) if art.getpixel((x,y))[3]>100)
        assert opaque>280,f"{name} has too little authored artwork: {opaque}"
    assert path.stat().st_size>3500,f"{name} unexpectedly tiny or blank"
    digests.append(hashlib.sha256(path.read_bytes()).digest())
assert len(set(digests))==4,"Different stage landmarks cannot be the same recycled art"
duck=root/"public/assets/sprites/hero/duckFire.png"
with Image.open(duck) as im:
    assert im.size==(960,210),"Crouched fire needs four PNG frames"
    opaque=sum(1 for x in range(72,139,3) for y in range(80,171,3) if im.getpixel((x,y))[3]>100)
    assert opaque>200,"Crouched torso is absent"
    framehash=[hashlib.sha256(im.crop((i*240,0,(i+1)*240,210)).tobytes()).digest() for i in range(4)]
    assert len(set(framehash))>1,"Crouched muzzle and recoil animation must change per frame"
print("PASS: four unique authored stage structures, transparent PNGs, four real crouch-fire animation frames.")
