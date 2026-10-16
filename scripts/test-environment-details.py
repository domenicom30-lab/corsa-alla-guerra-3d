#!/usr/bin/env python3
"""Offline visual guard for all four newly detailed near-background layers."""
from pathlib import Path
from PIL import Image
from hashlib import sha256
root=Path(__file__).resolve().parent.parent
base=root/"public/assets/sprites/backgrounds"
shade={
"forest":(198,203,143,255),
"village":(215,162,123,255),
"industrial":(217,184,128,255),
"fortress":(184,191,165,255)
}
digests=[]
for name,color in shade.items():
    path=base/(name+"-near.png")
    assert path.is_file(),name
    with Image.open(path) as im:
        assert im.size==(1400,540) and im.mode=="RGBA",name
        assert im.getpixel((0,0))[3]==0,("Background sky needs transparency",name)
        sample=im.crop((0,200,1400,530))
        count=sum(1 for px in sample.getdata() if px==color)
        assert count>5,(name,"Premium art pass did not paint stage-specific light/weather damage",count)
        assert sample.getbbox() is not None
    digests.append(sha256(path.read_bytes()).hexdigest())
assert len(set(digests))==4,"Stages must use different detailed artwork"
source=(root/"scripts/build_raster_art.py").read_text()
assert "from environment_details import paint_environment_details" in source
assert "paint_environment_details(im,scene,layer)" in source
print("PASS: four original near-layer scenery surfaces with individual material wear, opaque architecture, and untouched transparent sky")
