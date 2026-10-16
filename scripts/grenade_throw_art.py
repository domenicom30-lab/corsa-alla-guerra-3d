"""Six authored grenade-throw character keys, separate from normal firing.

Baked into original hero PNG atlas; no per-frame runtime character painting.
"""
from PIL import ImageDraw
import math
def draw_grenade_throw(im,n):
    n=max(0,min(5,int(n)))
    d=ImageDraw.Draw(im,"RGBA")
    # Distinct arm arcs from windup to release and follow-through.
    elbow=((95,109),(94,99),(103,86),(113,76),(128,81),(113,97))[n]
    hand=((110,104),(107,83),(116,66),(133,47),(161,54),(151,81))[n]
    d.line([(100,101),elbow,hand],fill=(20,31,28,255),width=23,joint="curve")
    d.line([(100,99),elbow,hand],fill=(89,116,79,255),width=17,joint="curve")
    d.line([(102,97),elbow],fill=(189,202,143,220),width=3)
    d.ellipse((hand[0]-10,hand[1]-9,hand[0]+11,hand[1]+10),
              fill=(200,146,96,255),outline=(45,49,37,255),width=3)
    d.arc((hand[0]-8,hand[1]-8,hand[0]+8,hand[1]+9),165,270,
          fill=(248,207,151,245),width=2)
    # Dark green grenade, ring pin and fuse are visibly airborne during release.
    grenade_positions=((121,109),(116,90),(126,61),(144,38),(174,31),(195,36))
    x,y=grenade_positions[n]
    if n<=3:
        d.ellipse((x-8,y-12,x+8,y+9),
                  fill=(48,73,58,255),outline=(16,36,31,255),width=3)
        d.line([(x-6,y-5),(x+5,y-6)],fill=(151,174,134,255),width=2)
        d.rectangle((x-3,y-16,x+4,y-10),fill=(170,166,121,255))
        d.arc((x+2,y-17,x+11,y-7),180,360,fill=(218,201,141,255),width=2)
    else:
        # Ghosted short release trail makes the key readable without a new actor.
        for j in range(3):
            bx=x-j*11;by=y+j*8
            alpha=225-j*65
            d.ellipse((bx-4,by-4,bx+4,by+4),fill=(220,204,152,alpha))
        d.ellipse((x-7,y-10,x+8,y+9),fill=(53,81,57,230),
                  outline=(27,42,31,235),width=2)
        d.line([(x-4,y-4),(x+4,y-6)],fill=(205,212,162,245),width=2)
    if n>=3:
        # Opposite-side cloth folds and strap inertial response.
        d.polygon([(83,112),(101,110),(104+n*2,125),(82+n,134)],
                  fill=(42,64,49,255))
        d.line([(87,115),(100+n,121)],fill=(198,203,151,230),width=2)
