#!/usr/bin/env python3
"""Validate six authored enemy defeat keyframes for four troop classes."""
from pathlib import Path
from hashlib import sha256
from PIL import Image
import json

root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/"sprite-manifest.json").read_text("utf8"))
for kind in ("rifleman","assault","grenadier","heavy"):
    key=kind+"Fall"
    assert manifest["enemies"].get(key)==6,(key,"atlas manifest missing")
    source=root/"public/assets/sprites/enemies"/(key+".png")
    assert source.exists(),f"Missing death sprite: {key}"
    with Image.open(source) as sheet:
        assert sheet.mode=="RGBA" and sheet.size==(1440,210),(key,sheet.size)
        frames=[sheet.crop((i*240,0,(i+1)*240,210)) for i in range(6)]
        hashes=[]
        for i,frame in enumerate(frames):
            box=frame.getbbox()
            assert box and box[2]-box[0]>85 and box[3]-box[1]>40,(key,i,box)
            assert frame.getpixel((0,0))[3]==0,(key,i,"backdrop unexpectedly opaque")
            hashes.append(sha256(frame.tobytes()).digest())
        assert len(set(hashes))==6,(key,"original death frames repeated")
        # Final ground-contact silhouette must be notably shorter than first.
        start=frames[0].getbbox()
        finish=frames[5].getbbox()
        assert (finish[3]-finish[1])<(start[3]-start[1])*.95,(
            key,"fall never folds onto the ground",start,finish
        )
print("PASS: 24 distinct original enemy fall frames, four types, real transparency and ground impact")
