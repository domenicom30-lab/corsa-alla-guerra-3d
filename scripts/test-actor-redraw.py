#!/usr/bin/env python3
"""Gate the original articulated 2D redraw against visual and gameplay regressions."""
from pathlib import Path
from PIL import Image
from hashlib import sha256
import json
root=Path(__file__).resolve().parent.parent
base=root/"public/assets/sprites"
manifest=json.loads((root/"sprite-manifest.json").read_text("utf8"))
assert manifest["hero"]["run"]==8

def atlas_frames(group,kind):
    n=manifest[group][kind]
    path=base/group/(kind+".png")
    assert path.is_file(),f"Missing mandatory atlas {group}/{kind}"
    with Image.open(path) as sheet:
        assert sheet.mode=="RGBA" and sheet.size==(n*240,210),(group,kind,sheet.size)
        return [sheet.crop((i*240,0,(i+1)*240,210)).copy() for i in range(n)]

hero={kind:atlas_frames("hero",kind)
      for kind in ("idle","run","runFire","fire","jump","jumpFire")}
for kind,frames in hero.items():
    assert len({sha256(frame.tobytes()).digest() for frame in frames})==len(frames), (
        kind,"Reused or still duplicated original character frames"
    )
    for i,frame in enumerate(frames):
        assert frame.getpixel((0,0))[3]==0,(kind,i,"No opaque sky")
        region=frame.crop((72,80,139,140))
        assert len(set(region.getdata()))>=38,(kind,i,"Torso still overly flat")
        if kind not in ("jump","jumpFire"):
            feet=frame.crop((36,164,199,207))
            assert sum(1 for px in feet.getdata() if px[3]>195)>375,(
                kind,i,"Articulated legs vanished"
            )
# Feet and knees must move through actual authored positions, not one standing stencil.
lower=[frame.crop((34,145,202,208)) for frame in hero["run"]]
assert len({sha256(region.tobytes()).hexdigest() for region in lower})==8
assert sum(1 for a,b in zip(lower[0].getdata(),lower[4].getdata())
           if a!=b)>150,"Half-cycle run silhouette barely moves"
for kind in ("rifleman","assault","grenadier","heavy"):
    frames=atlas_frames("enemies",kind)
    assert len({sha256(f.tobytes()).hexdigest() for f in frames})==8
    for n,frame in enumerate(frames):
        assert frame.getpixel((0,0))[3]==0
        crop=frame.crop((75,78,150,140))
        assert len(set(crop.getdata()))>=33,(kind,n,"Body armor has too few material planes")
        legs=frame.crop((36,160,212,209))
        assert sum(1 for px in legs.getdata() if px[3]>195)>350,(kind,n)
# Special poses and forbidden sprite dimensions remain untouched.
for kind in ("aimUp","duck","slide","throw"):
    atlas_frames("hero",kind)
build=(root/"scripts/build_raster_art.py").read_text("utf8")
for marker in ("from actor_redraw import polish_hero, polish_enemy",
               "polish_hero(im,hero_pose,n)","polish_enemy(im,kind,n)"):
    assert marker in build,("Redraw not included in offline production art",marker)
print("PASS: original keyed infantry articulation and shaded armor, four distinct enemy silhouettes, leg visibility and transparency")
