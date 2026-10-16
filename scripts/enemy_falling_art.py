"""Six-key original enemy knockdown animation baked into transparent PNG atlases.

Dynamically rotating standing soldiers at runtime looks like cardboard; the
frames below reshape fabric, boots, head direction, fall anticipation and dust
at each illustrated death key. The pre-rotation is built only during CI.
"""
from PIL import Image, ImageDraw
import math
def draw_falling_pose(im,n):
    n=min(5,max(0,int(n)))
    # Start from an original complete enemy painting. Angle + squash baked offline.
    angles=(0,-12,-27,-52,-76,-83)
    scales=((1.,1.),(.98,.99),(.96,.94),(.93,.85),(.87,.73),(.92,.65))
    angle=angles[n]
    sx,sy=scales[n]
    source=im.copy()
    # Advance the character's center toward the floor as the body topples.
    cropped=source.crop((29,19,239,199))
    w=max(1,int(210*sx))
    h=max(1,int(180*sy))
    cropped=cropped.resize((w,h),Image.Resampling.BICUBIC)
    rotated=cropped.rotate(angle,Image.Resampling.BICUBIC,expand=True)
    im.paste((0,0,0,0),(0,0,im.width,im.height))
    ground_anchor=(78,93,112,122,126,128)[n]
    x=int(124-rotated.width/2+(0,5,10,11,3,-3)[n])
    y=int(ground_anchor-rotated.height/2+(0,4,9,14,26,32)[n])
    im.paste(rotated,(x,y),rotated)
    d=ImageDraw.Draw(im,"RGBA")
    # Coherent fall and ground-impact dust stays limited to original atlas bounds.
    if n in (0,1,2):
        cx=95+(n*9);cy=91+(n*12)
        for k in range(5):
            dx=7+k*6+n*2;dy=3+k%3*5
            d.line([(cx+dx,cy-dy),(cx+dx+6,cy-dy-5)],
                   fill=(251,219,143,220-n*35),width=2)
    if n>=3:
        for k in range(9):
            x=39+k*18-(n-3)*4;y=190-(k%3)*4-(n-3)*3
            d.ellipse((x,y,x+7+(n-3)*2,y+4),
                      fill=(145,135,107,max(70,180-(n-3)*38)))
        # Bent leg skids and cloth creases are detached from standing silhouette.
        for k in range(4):
            x=53+k*27+n%3*3;y=183-(k%2)*6
            d.line([(x,y),(x+20,y-4)],fill=(39,55,44,180),width=3)
    if n==5:
        d.line([(70,180),(154,180)],fill=(30,43,36,210),width=4)
        d.line([(83,182),(130,182)],fill=(166,164,127,225),width=2)
