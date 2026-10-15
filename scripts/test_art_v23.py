#!/usr/bin/env python3
"""Ensure the four areas retain clean sky and original layered explosion animation."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/"sprite-manifest.json").read_text("utf8"))
scene_root=root/"public/assets/sprites/backgrounds"
for name in manifest["backgrounds"]:
    with Image.open(scene_root/(name+"-far.png")) as bg:
        assert bg.size==(1400,540),name
        # Upper region should be clean color gradients, never 2400 random rectangles.
        diffs=0
        for y in (15,40,70):
            for x in range(4,1396,7):
                a=bg.getpixel((x-1,y))[:3];b=bg.getpixel((x+1,y))[:3]
                if max(abs(v-w) for v,w in zip(a,b))>38:diffs+=1
        assert diffs<60, f"Unwanted scattered sky noise in {name}: {diffs} harsh edges"
fx=root/"public/assets/sprites/fx/explosion.png"
with Image.open(fx) as img:
    assert img.size==(1280,128)
    frames=[img.crop((i*128,0,(i+1)*128,128)).convert("RGBA") for i in range(10)]
    alphas=[sum(fr.getchannel("A").getdata()) for fr in frames]
    assert min(alphas)>25000, "Missing detailed animation frame"
    assert max(alphas)>min(alphas)*1.15, "Explosion must grow/change substantially"
    core=frames[0].getpixel((64,64))
    assert core[0]>core[2]+50,"Ignition core not warm-colored"
print("PASS: four clean-zone skies, ten authored fire/soot frames, visible animation progression.")
