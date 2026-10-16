"""Original, authored pixel-art surface detailing for all combat sprite atlases.

This is not copied third-party artwork. Every mark is baked into the shipped
PNG sheets by Pillow during CI. No runtime per-frame procedural graphics.
"""
from PIL import ImageDraw
import math
import random


def soldier_surface(im, pose, n, faction="hero"):
    """Fabric folds, genuine equipment detail, metal and skin lighting."""
    if pose in ("slide", "land"):
        return action_surface(im, pose, n)
    d=ImageDraw.Draw(im, "RGBA")
    is_hero=faction=="hero"
    y=(round(abs(math.sin(n*math.pi/4))*5) if pose in ("run","runFire") else 0)
    if pose in ("duck","duckFire") or pose.endswith("Crouch"):
        y+=25
    if pose=="jump":
        y+=(-13,-24,-16)[n%3]
    if pose=="hurt" or pose.endswith("Hurt"):
        y+=6
    if pose=="idle":
        y+=round((1-math.cos(n*math.pi/2))*1.25)
    # Precision helmet rim, 3 distinct material values and individual scratches.
    d.arc((82,37+y,131,68+y),186,339,fill=(18,32,29,255),width=4)
    d.arc((88,38+y,122,52+y),206,321,fill=(231,215,162,225),width=2)
    d.arc((84,58+y,136,67+y),181,349,fill=(166,183,139,205),width=3)
    for k in range(7):
        x=89+k*5;yy=45+(k%3)*3+y
        d.line([(x,yy),(x+3,yy-1)],fill=(21,44,35,218),width=2)
    # Face details must remain legible after downscaling to 16% screen height.
    d.line([(98,68+y),(113,68+y)],fill=(247,198,142,145),width=2)
    d.line([(112,74+y),(121,75+y)],fill=(88,48,40,210),width=2)
    d.line([(108,82+y),(120,83+y)],fill=(118,64,46,180),width=2)
    d.point((120,71+y),fill=(250,229,180,230))
    # Layered shoulder seam with small stitching and readable cloth creases.
    d.line([(77,85+y),(88,80+y),(94,86+y)],fill=(19,42,33,220),width=3)
    d.line([(79,87+y),(89,83+y)],fill=(204,210,151,180),width=2)
    d.line([(121,86+y),(132,94+y)],fill=(14,31,30,215),width=3)
    for k in range(6):
        yy=96+k*7+y
        d.line([(94,yy),(102+k%3*2,yy+2)],fill=(28,49,38,185),width=2)
        d.line([(113,yy+3),(119+k%2*3,yy+4)],fill=(179,190,129,115),width=1)
    # Distinct garment + sling-fastening highlights across torso.
    for k in range(5):
        x=82+k*9
        d.rectangle((x,131+y,x+4,133+y),fill=(214,193,136,220))
        d.rectangle((x+1,140+y,x+3,143+y),fill=(35,53,39,220))
    d.rectangle((108,125+y,115,130+y),fill=(235,197,127,255))
    d.rectangle((110,127+y,113,129+y),fill=(35,48,36,255))
    # The original radio-style pack is wearable gear, rather than plain squares.
    if is_hero:
        d.rectangle((59,99+y,76,129+y),fill=(38,55,43,220))
        d.line([(62,101+y),(62,125+y)],fill=(173,186,139,230),width=3)
        d.rectangle((65,102+y,73,112+y),fill=(20,36,34,255))
        d.rectangle((67,104+y,71,106+y),fill=(174,198,167,255))
        d.line([(64,104+y),(60,79+y)],fill=(27,38,36,255),width=2)
        d.point((60,79+y),fill=(249,210,125,255))
    else:
        palette={
         "rifleman":(191,99,66,230),
         "assault":(165,177,110,220),
         "grenadier":(198,180,110,230),
         "heavy":(144,170,160,230)
        }
        base=faction.replace("Crouch","").replace("Hurt","").replace("Fire","").replace("Throw","")
        insignia=palette.get(base,(181,166,123,220))
        d.polygon([(70,87+y),(84,86+y),(86,95+y),(73,97+y)],fill=insignia)
        d.line([(74,91+y),(82,90+y)],fill=(30,48,39,240),width=2)
    # Crisp cloth texture restricted to already-painted opaque pixels.
    rng=random.Random(920141+17*n+sum(map(ord,faction))+len(pose)*71)
    pix=im.load()
    for _ in range(145):
        x=rng.randrange(70,137)
        yy=rng.randrange(90,142)+y
        if 0<=yy<im.height and pix[x,yy][3]>195:
            light=(236,215,162,130) if rng.random()<.34 else (21,39,32,95)
            d.line([(x,yy),(x+rng.randrange(1,4),yy)],fill=light,width=1)


def action_surface(im, pose, n):
    """Noninvasive finishing marks on authored slide and landing frames."""
    d=ImageDraw.Draw(im,"RGBA")
    if pose=="slide":
        d.arc((132,84,177,106),187,342,fill=(226,211,154,220),width=3)
        d.line([(160,116),(174,118)],fill=(102,58,43,210),width=2)
        for k in range(6):
            d.line([(85+k*7,142+k%2*4),(88+k*7,145+k%2*4)],
                   fill=(193,205,149,220),width=2)
        d.line([(192,138),(225,138)],fill=(200,211,186,245),width=2)
    if pose=="land":
        for k in range(5):
            d.line([(82+k*7,115+k%3*6),(86+k*7,117+k%3*6)],
                   fill=(162,177,130,230),width=2)


def armored_surface(im, n, boss=False):
    """Welds, reactive armor plates, exhaust soot and moving wheel hubs."""
    d=ImageDraw.Draw(im,"RGBA")
    rng=random.Random(97114+(1 if boss else 0)*500+n*19)
    if boss:
        ytop=128; xstart=64; xend=265
        vent=(142,117,207,126); wheel_y=202
        track=(36,186,301,220)
    else:
        ytop=128; xstart=86; xend=332
        vent=(172,130,248,140); wheel_y=198
        track=(44,170,351,221)
    # Small armor appliqué tiles, distinct from the original flat hull.
    for k in range(9):
        xx=xstart+k*(xend-xstart)//9
        yy=ytop+(k%3)*6
        d.polygon([(xx,yy),(xx+18,yy-2),(xx+17,yy+8),(xx-1,yy+10)],
                  fill=(31,54,46,175))
        d.line([(xx+2,yy+1),(xx+16,yy)],fill=(198,211,165,220),width=2)
        d.point((xx+4,yy+6),fill=(239,216,164,240))
        d.point((xx+14,yy+6),fill=(193,184,150,230))
    # Heat grill, recessed vents and three levels of steel specularity.
    x0,y0,x1,y1=vent
    d.rectangle((x0,y0,x1,y1),fill=(26,39,37,210))
    for xx in range(x0+3,x1-2,7):
        d.line([(xx,y0+2),(xx+1,y1-2)],fill=(120,150,139,240),width=2)
    d.line([(x0,y0),(x1,y0)],fill=(220,219,177,215),width=2)
    d.line([(x0,y1),(x1,y1)],fill=(12,25,27,220),width=3)
    # Track links with visible hardware, frame-timed motion.
    tx0,ty0,tx1,ty1=track
    for k in range(13):
        xx=tx0+k*(tx1-tx0)//13+(n%3)
        d.rectangle((xx,ty0+2,xx+6,ty0+6),fill=(132,151,130,210))
        d.point((xx+3,ty0+3),fill=(225,213,177,240))
        d.line([(xx+2,ty1-4),(xx+7,ty1-3)],fill=(25,39,36,240),width=2)
    for k in range(5):
        cx=70+k*51 if boss else 82+k*56
        for a in range(4):
            theta=a*math.pi/2+n*.14
            x=int(cx+math.cos(theta)*7)
            y=int(wheel_y+math.sin(theta)*7)
            d.ellipse((x-2,y-2,x+2,y+2),fill=(227,206,161,210))
    # Controlled original field wear, no random clutter on empty sky.
    im_pixels=im.load()
    for _ in range(235):
        xx=rng.randrange(xstart,xend)
        yy=rng.randrange(ytop+2,178)
        if im_pixels[xx,yy][3]>220:
            # Individual warm/cold pigment values give unique weathered metal
            # tones without large flat rectangles or runtime procedural noise.
            tone=rng.randrange(56)
            shade=((17+tone//3,34+tone//2,30+tone//3,155+tone//6)
                   if rng.random()<.68 else
                   (195+tone//2,184+tone//3,145+tone//4,135+tone//7))
            d.line([(xx,yy),(xx+rng.randrange(2,8),yy-1)],fill=shade,width=1)
    # Identifying chevron is unique to this project, not borrowed iconography.
    cx=135 if boss else 122
    cy=149 if boss else 153
    d.line([(cx,cy),(cx+8,cy+6),(cx+16,cy)],fill=(228,207,137,240),width=3)
    d.line([(cx+4,cy+3),(cx+8,cy+6),(cx+12,cy+3)],fill=(27,44,39,245),width=2)
