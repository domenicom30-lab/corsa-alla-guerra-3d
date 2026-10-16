#!/usr/bin/env python3
"""Six full original grenade-throw keys, each framed and visibly changing."""
from pathlib import Path
from hashlib import sha256
from PIL import Image
import json

root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/"sprite-manifest.json").read_text("utf8"))
assert manifest["hero"]["throw"]==6
p=root/"public/assets/sprites/hero/throw.png"
assert p.exists(),"Grenade throw atlas must be shipped"
with Image.open(p) as img:
    assert img.mode=="RGBA" and img.size==(1440,210),img.size
    keys=[img.crop((i*240,0,(i+1)*240,210)) for i in range(6)]
    boxes=[]
    for i,frame in enumerate(keys):
        box=frame.getbbox()
        assert box and box[2]-box[0]>125 and box[3]-box[1]>145,(i,box)
        assert frame.getpixel((0,0))[3]==0,(i,"opaque sky")
        boxes.append(box)
    assert len({sha256(frame.tobytes()).digest() for frame in keys})==6,(
        "Grenade arm must move through six unique action keys"
    )
    assert len(set(boxes))>=3,("Grenade pose silhouette stays identical",boxes)
    assert any(box[2]>188 for box in boxes),"Release arc needs a visible grenade"
print("PASS: six original PNG grenade throw frames with moving hand, projectile and release silhouettes")
