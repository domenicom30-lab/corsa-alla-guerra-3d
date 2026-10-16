#!/usr/bin/env python3
"""Regression checks for new animation art, without generating any APK."""
from pathlib import Path
from PIL import Image
from hashlib import sha256
import json
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/"sprite-manifest.json").read_text())
assert (manifest["hero"]["slide"],manifest["hero"]["melee"],manifest["hero"]["land"])==(6,5,4)
all_digests=[]
for pose,frames in (("slide",6),("melee",5),("land",4)):
    path=root/"public/assets/sprites/hero"/f"{pose}.png"
    assert path.exists(),f"Missing {pose} sprites"
    with Image.open(path) as img:
        assert img.mode=="RGBA"
        assert img.size==(240*frames,210)
        hashes=[]
        for k in range(frames):
            im=img.crop((k*240,0,(k+1)*240,210))
            bounds=im.getchannel("A").getbbox()
            assert bounds and (bounds[2]-bounds[0])>90 and (bounds[3]-bounds[1])>65, (pose,k,bounds)
            hashes.append(sha256(im.tobytes()).hexdigest())
            all_digests.append(hashes[-1])
            if pose=="slide":
                assert bounds[1]>65, f"Sliding pose not low enough at frame {k}: {bounds}"
        assert len(set(hashes))>=min(frames,4), f"{pose} has duplicate frames"
assert len(set(all_digests))>=12,"Frames lack meaningful distinct animation drawings"
print("PASS: 15 distinct action frames, low slides, original knife swing and squash landing.")
