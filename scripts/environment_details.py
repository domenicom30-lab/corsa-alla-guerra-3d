"""Hand-authored scenery surface pass for mandatory original 2D PNG backgrounds.

The pass works on already-painted architecture or foliage only, leaving sky
pixels transparent. It is applied OFFLINE during CI, never every game frame.
"""
from PIL import ImageDraw
import random
import math

def paint_environment_details(im,scene,layer):
    if layer!="near":
        return
    d=ImageDraw.Draw(im,"RGBA")
    W,H=im.size
    rng=random.Random(74171+sum(ord(c)*37 for c in scene))
    colors={
      "forest":((198,203,143,255),(24,43,35,255),(109,135,95,255)),
      "village":((215,162,123,255),(53,47,42,255),(156,109,83,255)),
      "industrial":((217,184,128,255),(27,43,43,255),(114,141,139,255)),
      "fortress":((184,191,165,255),(23,41,47,255),(110,139,136,255))
    }
    highlight,shadow,mid=colors[scene]
    pix=im.load()
    def painted(x,y):
        return 0<=x<W and 0<=y<H and pix[x,y][3]>210
    # Physical material chatter: small chipped edge, exposed mortar, moss.
    # Every mark is confined to existing painted surfaces, so nothing speckles sky.
    for k in range(1900):
        x=rng.randrange(4,W-7);y=rng.randrange(145,H-6)
        if not (painted(x,y) and painted(x+3,y+2)):
            continue
        length=rng.randrange(2,10)
        tone=(highlight if k%7==0 else shadow if k%5==0 else mid)
        d.line([(x,y),(min(W-2,x+length),y+(k%3==0))],
               fill=tone,width=1 if k%4 else 2)
        if k%19==0:
            d.point((x+2,y+3),fill=highlight)
    # Original material-specific architecture, not one repeated stamped texture.
    if scene=="forest":
        # Hand-cut bark hatching and overhanging foliage clusters.
        for k in range(120):
            x=rng.randrange(4,W-8);y=rng.randrange(195,H-15)
            if not painted(x,y) or not painted(x,y+12):
                continue
            d.line([(x,y),(x-3,y+10)],fill=shadow,width=3)
            d.line([(x+2,y+2),(x+1,y+7)],fill=highlight,width=1)
        for k in range(86):
            x=rng.randrange(7,W-11);y=rng.randrange(188,410)
            if not painted(x,y):continue
            d.ellipse((x-3,y-1,x+7,y+3),fill=mid)
            d.point((x+2,y),fill=highlight)
    elif scene=="village":
        # Layered brick courses: broken mortar lines and chipped window sills.
        for k in range(135):
            x=rng.randrange(7,W-21);y=rng.randrange(240,H-16)
            if not (painted(x,y) and painted(x+14,y)):continue
            d.line([(x,y),(x+12,y)],fill=shadow,width=2)
            d.line([(x,y-2),(x+10,y-2)],fill=mid,width=1)
            if k%4==0:
                d.line([(x+6,y),(x+6,y+7)],fill=highlight,width=1)
        for k in range(44):
            x=rng.randrange(11,W-17);y=rng.randrange(253,H-23)
            if not all(painted(x+a,y+b) for a,b in ((0,0),(7,6))):continue
            d.line([(x,y),(x+2,y+7),(x+8,y+11)],fill=shadow,width=2)
            d.line([(x+2,y+7),(x+5,y+7)],fill=highlight,width=1)
    elif scene=="industrial":
        # Conduits, rivets and luminous transformer control plates.
        for k in range(94):
            x=rng.randrange(7,W-27);y=rng.randrange(270,H-16)
            if not all(painted(x+a,y+b) for a,b in ((0,0),(18,0),(18,8))):
                continue
            d.rectangle((x,y,x+18,y+6),fill=(41,60,58,255))
            d.line([(x+1,y+1),(x+17,y+1)],fill=highlight,width=2)
            d.point((x+3,y+4),fill=(244,214,147,255))
            d.point((x+15,y+4),fill=(232,211,161,255))
        for k in range(52):
            x=rng.randrange(7,W-15);y=rng.randrange(240,H-20)
            if not (painted(x,y) and painted(x+4,y+9)):continue
            d.line([(x,y),(x+2,y+10)],fill=shadow,width=3)
            d.line([(x+3,y),(x+4,y+9)],fill=mid,width=2)
    else:
        # Fortress block seams, fastening pins and spalling concrete.
        for k in range(120):
            x=rng.randrange(8,W-28);y=rng.randrange(217,H-12)
            if not (painted(x,y) and painted(x+20,y+2)):continue
            d.line([(x,y),(x+20,y)],fill=shadow,width=3)
            d.line([(x+3,y-3),(x+18,y-3)],fill=highlight,width=1)
            if k%3==0:
                d.line([(x+7,y),(x+7,y+9)],fill=mid,width=2)
        for k in range(65):
            x=rng.randrange(7,W-9);y=rng.randrange(225,H-10)
            if not painted(x,y):continue
            d.ellipse((x-3,y-3,x+5,y+4),fill=shadow)
            d.arc((x-4,y-4,x+6,y+5),210,325,fill=highlight,width=2)
            d.point((x,y),fill=(34,46,48,255))
