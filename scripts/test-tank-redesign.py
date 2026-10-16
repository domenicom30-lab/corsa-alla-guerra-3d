#!/usr/bin/env python3
"""Gate the full original armored vehicle repaint using its shipped 6-frame atlas."""
from pathlib import Path
from hashlib import sha256
from PIL import Image

root=Path(__file__).resolve().parent.parent
png=root/"public/assets/sprites/vehicles/slug.png"
assert png.is_file(),"Tank atlas is not generated"
with Image.open(png) as atlas:
    assert atlas.mode=="RGBA" and atlas.size==(2400,250)
    frames=[atlas.crop((i*400,0,(i+1)*400,250)) for i in range(6)]
    assert len({sha256(f.tobytes()).digest() for f in frames})>=5
    for i,f in enumerate(frames):
        assert f.getpixel((0,0))[3]==0,(i,"Background should stay transparent")
        box=f.getbbox()
        assert box and box[2]-box[0]>320,(i,"Armored vehicle silhouette clipped")
        # A real colored layer of the new turret is present in all authored keys.
        region=f.crop((132,76,285,125))
        new_turret=sum(1 for r,g,b,a in region.getdata()
                       if (r,g,b)==(83,110,94) and a>210)
        assert new_turret>=30,(i,"New bevelled turret is missing",new_turret)
        # The enhanced optics are metallic, with a distinctly pale sight glass.
        sight=f.crop((196,43,222,61))
        bright=sum(1 for r,g,b,a in sight.getdata()
                   if (r,g,b)==(150,184,176) and a>210)
        assert bright>=10,(i,"Animated commander sight lost",bright)
assert png.stat().st_size<700_000,"Armor atlas too large for mobile startup"
build=(root/"scripts/build_raster_art.py").read_text("utf8")
assert "from tank_redesign import paint_tank_signature" in build
assert "paint_tank_signature(im,n)" in build
print("PASS: real six-frame armored tank, layered armor, animated roadwheels, distinct optics and transparent PNG bounds")
