#!/usr/bin/env python3
"""Offline regression for newly authored premium sprite surface material details."""
from pathlib import Path
from PIL import Image
from hashlib import sha256

root=Path(__file__).resolve().parent.parent
prefix=root/"public/assets/sprites"

def frames(category,name,columns,width,height):
    with Image.open(prefix/category/(name+".png")) as sheet:
        assert sheet.mode=="RGBA" and sheet.size==(columns*width,height), (
            category,name,"source image atlas missing or malformed"
        )
        return [sheet.crop((i*width,0,(i+1)*width,height)).copy() for i in range(columns)]

def diverse(frame,area,minimum):
    colors=set(frame.crop(area).getdata())
    assert len(colors)>=minimum, ("Flat-color sprite regressed",len(colors),minimum)

hero=frames("hero","idle",4,240,210)
runner=frames("hero","run",8,240,210)
gunner=frames("hero","aimUp",4,240,210)
for im in hero+runner+gunner:
    assert im.getpixel((0,0))[3]==0,"Sprite background must stay transparent"
    assert any(im.getpixel((60,y))[3]>160 for y in range(51,101)), (
        "Radio aerial must remain visible within the animated equipment region"
    )
    diverse(im,(75,65,136,145),28)
    assert im.getbbox() is not None

# No ghost of a forward-pointing rifle while looking straight up.
for im in gunner:
    assert im.getpixel((200,92))[3]<100,"Upward aim must not ghost a horizontal rifle"

for kind in ("rifleman","assault","grenadier","heavy"):
    soldiers=frames("enemies",kind,8,240,210)
    for im in soldiers:
        diverse(im,(75,70,141,145),26)
        assert im.getpixel((0,0))[3]==0
    assert len({sha256(im.tobytes()).digest() for im in soldiers})>=7, (
        kind,"Enemy movement frames are duplicated"
    )

for category,name,count,width,height,region in (
    ("vehicles","slug",6,400,250,(75,125,335,188)),
    ("boss","commander",6,340,240,(65,125,268,190))
):
    sheets=frames(category,name,count,width,height)
    for im in sheets:
        assert im.getpixel((0,0))[3]==0
        diverse(im,region,38)
        assert im.getbbox()
    assert len({sha256(im.tobytes()).digest() for im in sheets})>=5, (
        category,name,"Vehicle track animations disappeared"
    )

gen=(root/"scripts/build_raster_art.py").read_text("utf8")
for marker in ("from sprite_materials import soldier_surface, armored_surface",
               "soldier_surface(im,hero_pose,n)",
               "armored_surface(im,n,boss=True)",
               "armored_surface(im,n,boss=False)"):
    assert marker in gen,"Premium art pass missing from offline pack builder: "+marker

print("PASS: illustrated gear, silhouette-preserving hero/enemy materials, armored seams, wheels, engraved detail and offline rendering")
