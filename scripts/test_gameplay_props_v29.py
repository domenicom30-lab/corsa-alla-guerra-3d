#!/usr/bin/env python3
"""Mandatory frame-by-frame art checks for original prisoners and destructible cover."""
from pathlib import Path
from hashlib import sha256
from PIL import Image
import json
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/"sprite-manifest.json").read_text("utf-8"))
props=manifest["props"]
assert props["sandbagCover"]==3
assert props["prisonerIdle"]==4
for key,frames in (("sandbagCover",3),("prisonerIdle",4)):
    p=root/"public/assets/sprites/props"/f"{key}.png"
    assert p.exists(),f"Required gameplay illustration missing: {p}"
    assert p.stat().st_size>5000,f"Gameplay sprite is empty/too simple: {key}"
    with Image.open(p) as sheet:
        assert sheet.size==(480*frames,320),f"Incorrect atlas size for {key}"
        assert sheet.mode=="RGBA"
        hashes=[]
        for i in range(frames):
            im=sheet.crop((480*i,0,480*(i+1),320))
            bb=im.getchannel("A").getbbox()
            assert bb and bb[2]-bb[0]>50 and bb[3]-bb[1]>75,(key,i,bb)
            assert im.getpixel((0,0))[3]==0,(key,i,"not transparent")
            hashes.append(sha256(im.tobytes()).digest())
        assert len(set(hashes))==frames,f"Animation/damage states are duplicated: {key}"
    print(f"PASS: {key} {frames} original, distinct transparent frames")
print("PASS: 2 new original gameplay sprite atlases, 7 unique frames and mandatory manifest entries.")
