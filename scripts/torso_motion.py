"""Independently authored upper-body animation for original 2D sprite sheets.

The torso, scarf, helmet, hands and rifle share a connected pixel group,
while existing articulated legs remain locked to the ground. Eight poses
per run cycle create a visible feeling of mass and firing recoil without
expensive live Canvas rotations on mobile.
"""
from PIL import Image, ImageDraw
import math

# Frames were keyed to heel contacts in scripts/actor_redraw.py.
HIPS=((0,2),(1,0),(2,-2),(1,-3),(0,-1),(-1,1),(-2,3),(-1,1))
TORSO_ANGLE=(1.2,2.5,1.7,-.7,-2.0,-2.7,-.9,.8)
FIRING_ANGLE=(-1.0,1.2,-.6,-2.0,-.7,1.0,-.5,-1.8)

def articulate_upper_body(im,pose,n,faction='hero'):
    """Regenerate only a transparent head/torso/rifle crop, not the legs."""
    if pose not in ('run','runFire','jump','jumpFire'):
        return
    i=n%8
    firing=pose in ('runFire','jumpFire')
    airborne=pose in ('jump','jumpFire')
    x0,y0,x1,y1=24,24,240,148
    src=im.crop((x0,y0,x1,y1))
    # The weapon may reach the rightmost source pixel; 1-3 degrees at 240px
    # is enough to animate recoil but cannot produce giant clipped motions.
    base=FIRING_ANGLE[i] if firing else TORSO_ANGLE[i]
    rotation=base+(1.2 if airborne else 0)
    if faction=='heavy':rotation*=.45
    elif faction!='hero':rotation*=.73
    dx,dy=HIPS[i]
    if airborne:dy=round(dy*.48)-1
    if firing and i in (0,2,4,6):
        dx-=2
        dy+=1
    turned=src.rotate(rotation,Image.Resampling.NEAREST,expand=True)
    # Composite over transparency, then return to the same original 240x210
    # keyframe, preserving manifest dimensions and all old hitboxes.
    d=ImageDraw.Draw(im,'RGBA')
    d.rectangle((x0,y0,x1-1,y1-1),fill=(0,0,0,0))
    px=x0+round((src.width-turned.width)/2)+dx
    py=y0+round((src.height-turned.height)/2)+dy
    im.alpha_composite(turned,(px,py))
    # Original uniform shadows re-connect animated hips to planted legs.
    # No horizontal straight seam or transparent slit at the waist.
    d=ImageDraw.Draw(im,'RGBA')
    if not airborne:
        belt=(37,56,42,235) if faction=='hero' else (43,57,47,235)
        d.line([(80+dx,145),(122+dx,145)],fill=belt,width=3)
        d.line([(87+dx,142),(111+dx,143)],fill=(155,156,116,225),width=2)
