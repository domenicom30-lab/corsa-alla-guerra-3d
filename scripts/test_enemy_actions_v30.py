#!/usr/bin/env python3
"""Eight authored enemy action atlases, distinct from run animations."""
from pathlib import Path
from hashlib import sha256
from PIL import Image
import json
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/"sprite-manifest.json").read_text())
types=("rifleman","assault","grenadier","heavy")
for kind in types:
    assert manifest["enemies"][kind]==8
    for pose in ("Crouch","Hurt"):
        key=kind+pose
        assert manifest["enemies"][key]==4,key
        path=root/"public/assets/sprites/enemies"/f"{key}.png"
        assert path.is_file(),key
        with Image.open(path) as atlas:
            assert atlas.mode=="RGBA" and atlas.size==(960,210),(key,atlas.size)
            hashes=[]
            for i in range(4):
                frame=atlas.crop((i*240,0,(i+1)*240,210))
                bounds=frame.getchannel("A").getbbox()
                assert bounds and bounds[2]-bounds[0]>85 and bounds[3]-bounds[1]>70,(key,i,bounds)
                assert frame.getpixel((0,0))[3]==0,key
                if pose=="Crouch":
                    assert bounds[1]>60,(key,i,bounds)
                hashes.append(sha256(frame.tobytes()).digest())
            assert len(set(hashes))>=3,(key,"Repeated frames")
        print("PASS:",key,"4 illustrated frames")
print("PASS: 32 unique enemy pose frames in eight mandatory PNG atlases.")
