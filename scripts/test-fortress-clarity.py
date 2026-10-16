#!/usr/bin/env python3
"""The fourth stage must render a recognisable fortress, not a giant pale disc."""
from pathlib import Path
from PIL import Image
from hashlib import sha256

root=Path(__file__).resolve().parent.parent
base=root/"public/assets/sprites/backgrounds"
with Image.open(base/"fortress-far.png") as far:
    assert far.mode=="RGBA" and far.size==(1400,540)
    # Original far sky placed a 175px moon here; on a phone it exceeded 300px.
    # This region is now clear blue/grey cloud, without an opaque luminous disc.
    for px,py in ((1120,65),(1160,100),(1210,110),(1180,155)):
        r,g,b,a=far.getpixel((px,py))
        assert r<126 and g<144 and b<158,(px,py,"giant pale disc regressed",r,g,b)
        assert a==255
    assert len(set(far.crop((0,170,1400,500)).getdata()))>35,(
        "Fortress distance lost its tower and terrain detail"
    )
with Image.open(base/"fortress-near.png") as near:
    assert near.mode=="RGBA" and near.size==(1400,540)
    assert near.getpixel((0,0))[3]==0,"Near sky must stay transparent"
    distinct=len(set(near.crop((60,310,1350,510)).getdata()))
    assert distinct>24,("Concrete, embrasures and masonry look flat",distinct)
    assert near.getbbox() is not None
    solid=sum(1 for px in near.crop((100,355,1300,510)).getdata() if px[3]>220)
    assert solid>45000,("Not enough legible fortress architecture",solid)
    assert sha256(near.tobytes()).digest()!=sha256(far.tobytes()).digest()
build=(root/"scripts/build_raster_art.py").read_text("utf8")
assert "from fortress_repaint import paint_fortress_scene" in build
assert "paint_fortress_scene(im,layer)" in build
print("PASS: actual fortress PNG art, reduced sky glare, detailed dark battlements, intact transparency")
