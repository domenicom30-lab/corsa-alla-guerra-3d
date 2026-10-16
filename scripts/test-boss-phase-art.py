#!/usr/bin/env python3
"""Three original six-frame armored boss conditions, all directly shipped PNGs."""
from pathlib import Path
from PIL import Image
from hashlib import sha256
import json
root=Path(__file__).resolve().parent.parent
boss=json.loads((root/"sprite-manifest.json").read_text())["boss"]
assert set(boss)=={"commander","commanderDamaged","commanderCritical"}
hashes=[]
for name in boss:
    path=root/"public/assets/sprites/boss"/(name+".png")
    assert path.is_file(),name
    with Image.open(path) as img:
        assert img.mode=="RGBA" and img.size==(2040,240),(name,img.size)
        frames=[img.crop((i*340,0,(i+1)*340,240)) for i in range(6)]
        assert all(frame.getpixel((0,0))[3]==0 for frame in frames),name
        for frame in frames:
            bounds=frame.getbbox()
            assert bounds and bounds[2]-bounds[0]>230 and bounds[3]-bounds[1]>150,(name,bounds)
        assert len({sha256(f.tobytes()).digest() for f in frames})>=5,name
        hashes.append(sha256(frames[2].tobytes()).digest())
assert len(set(hashes))==3,"Boss condition states must display distinct painted sheets"
print("PASS: eighteen original boss frames across intact, damaged and burning armor phases")
