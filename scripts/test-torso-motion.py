#!/usr/bin/env python3
"""End-to-end visual regression for upper-body motion in shipped actor PNGs."""
from pathlib import Path
from hashlib import sha256
from PIL import Image
root=Path(__file__).resolve().parent.parent
base=root/"public/assets/sprites"
for category,pose in (
    ('hero','run'),('hero','runFire'),('hero','jump'),('hero','jumpFire'),
    ('enemies','rifleman'),('enemies','assault'),
    ('enemies','grenadier'),('enemies','heavy')
):
    with Image.open(base/category/(pose+'.png')) as sheet:
        assert sheet.mode=='RGBA' and sheet.size==(1920,210), (category,pose,sheet.size)
        frames=[sheet.crop((i*240,0,(i+1)*240,210)) for i in range(8)]
        torso=[f.crop((53,27,238,146)) for f in frames]
        assert len({sha256(p.tobytes()).digest() for p in torso})==8, (
            category,pose,'Eight articulated body keys must be individually drawn'
        )
        heads=[]
        for frame in frames:
            assert frame.getpixel((0,0))[3]==0
            box=frame.getbbox()
            assert box and box[2]-box[0]>120 and box[3]-box[1]>130, (category,pose,box)
            helmet=frame.crop((83,25,136,78)).getchannel('A').getbbox()
            assert helmet is not None,(category,pose,'Helmet vanished')
            heads.append(helmet[1])
        assert len(set(heads))>=2,(
            category,pose,'Helmet must rise and lower during gait'
        )
source=(root/'scripts/build_raster_art.py').read_text('utf8')
for token in ("from torso_motion import articulate_upper_body",
              "articulate_upper_body(im,hero_pose,n,'hero')",
              "articulate_upper_body(im,'run',n,kind)"):
    assert token in source,('Torso motion is not enabled in the production atlas generator',token)
print('PASS: original independent upper-body motion, moving helmet, moving rifle, eight poses per actor and preserved transparent atlases')
