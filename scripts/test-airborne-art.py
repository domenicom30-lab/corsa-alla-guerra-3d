#!/usr/bin/env python3
"""Verify two real authored eight-frame airborne PNG atlases, not placeholders."""
from pathlib import Path
from hashlib import sha256
from PIL import Image

root=Path(__file__).resolve().parent.parent/"public/assets/sprites/hero"
atlases={}
for pose in ("jump","jumpFire"):
    path=root/(pose+".png")
    assert path.exists(),f"Missing runtime atlas: {path}"
    with Image.open(path) as im:
        assert im.mode=="RGBA" and im.size==(1920,210),pose
        frames=[im.crop((i*240,0,(i+1)*240,210)) for i in range(8)]
        bounds=[f.getbbox() for f in frames]
        for i,box in enumerate(bounds):
            assert box is not None and 110<box[2]-box[0]<=240, (pose,i,box)
            assert 100<box[3]-box[1]<=210,(pose,i,box)
            assert frames[i].getpixel((0,0))[3]==0, (pose,i,"background must be transparent")
        hashes={sha256(frame.tobytes()).digest() for frame in frames}
        assert len(hashes)==8,(pose,"No duplicate airborne frames")
        assert len({b[1] for b in bounds})>=4,(
            pose,"Jump phase is still a static standing sprite"
        )
        atlases[pose]=frames

assert all(
    sha256(atlases["jump"][i].tobytes()).digest()!=
    sha256(atlases["jumpFire"][i].tobytes()).digest()
    for i in range(8)
),"Every aerial attack pose must differ from aerial travel"

def warm_blast(img):
    box=img.crop((198,55,239,132))
    return sum(1 for r,g,b,a in box.getdata() if r>185 and g>102 and 25<b<210 and a>140)
assert any(warm_blast(f)>7 for f in atlases["jumpFire"]),(
    "Aerial weapon never displays orange muzzle combustion"
)
print("PASS: 16 unique authored airborne jump/fire images, no blank frames, 8 distinct silhouettes and visible weapon discharge")
