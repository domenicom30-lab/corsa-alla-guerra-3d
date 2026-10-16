#!/usr/bin/env python3
"""Produce an inspectable ORIGINAL sprite contact sheet as a GitHub Actions artifact.

The sheet shows the actual 2D game atlases, never generated promotional art.
"""
from pathlib import Path
from PIL import Image,ImageDraw
from datetime import date
import json

root=Path(__file__).resolve().parent.parent
m=json.loads((root/"sprite-manifest.json").read_text("utf8"))
out=root/"artifacts/actor-review.png"
rows=[
 ("SOLDATO — CORSA","hero","run",8),
 ("SOLDATO — SPARO IN CORSA","hero","runFire",8),
 ("SOLDATO — SALTO","hero","jump",8),
 ("SOLDATO — SPARO IN VOLO","hero","jumpFire",8),
 ("NEMICO — FUCILIERE","enemies","rifleman",8),
 ("NEMICO — ASSALTO","enemies","assault",8),
 ("NEMICO — GRANATIERE","enemies","grenadier",8),
 ("NEMICO — PESANTE","enemies","heavy",8),
]
TILE_W=213
ROW_H=210
canvas=Image.new("RGB",(1750,len(rows)*ROW_H+100),(19,27,29))
d=ImageDraw.Draw(canvas)
d.text((22,17),"CORSA ALLA GUERRA 2D — ACTUAL RASTER SPRITES / REVISONE PERSONAGGI",
       fill=(231,214,167))
d.text((22,37),"8 photograms per pose | pixel art original | no APK produced",fill=(160,178,167))
for line,(label,group,pose,count) in enumerate(rows):
    y=78+line*ROW_H
    d.rectangle((17,y,1732,y+ROW_H-11),fill=(31,42,41))
    d.text((23,y+5),label,fill=(239,210,155))
    path=root/"public/assets/sprites"/group/(pose+".png")
    with Image.open(path) as strip:
        strip=strip.convert("RGBA")
        assert strip.size==(240*count,210),(group,pose)
        for i in range(count):
            frame=strip.crop((i*240,0,(i+1)*240,210))
            x=23+i*TILE_W
            d.line((x+5,y+180,x+205,y+180),fill=(95,109,90),width=1)
            # Actual sprite pixels, cropped only to maximize on-screen visibility.
            crop=frame.crop((25,20,233,200))
            canvas.paste(crop,(x,y+20),crop)
            d.text((x+193,y+3),str(i+1),fill=(169,190,172))
out.parent.mkdir(parents=True,exist_ok=True)
canvas.save(out,optimize=True)
assert out.stat().st_size>200000,("Preview must contain real detailed art",out.stat().st_size)
print(f"PASS: {out} ({out.stat().st_size} bytes, eight 8-frame original sprite rows)")
