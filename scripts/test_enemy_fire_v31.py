#!/usr/bin/env python3
"""Four original enemy attack atlases: every frame distinct and nonempty."""
import hashlib,json
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/"sprite-manifest.json").read_text("utf8"))
for kind in ("rifleman","assault","grenadier","heavy"):
    name=kind+("Throw" if kind=="grenadier" else "Fire")
    assert manifest["enemies"][name]==4,name
    file=root/"public/assets/sprites/enemies"/(name+".png")
    assert file.exists(),name
    with Image.open(file) as im:
        assert im.size==(960,210) and im.mode=="RGBA",name
        hashes=[]
        for i in range(4):
            frame=im.crop((240*i,0,(i+1)*240,210))
            bbox=frame.getchannel("A").getbbox()
            assert bbox and bbox[2]-bbox[0]>=110 and bbox[3]-bbox[1]>=90,(name,i,bbox)
            assert frame.getpixel((0,0))[3]==0,name
            hashes.append(hashlib.sha256(frame.tobytes()).hexdigest())
        assert len(set(hashes))==4,f"No real gun recoil or grenade-release progression: {name}"
    assert file.stat().st_size>2000,f"Empty attack image: {name}"
print("PASS: four original enemy attack atlases, 16 distinct firing/grenade keyframes.")
