#!/usr/bin/env python3
"""Corsa alla Guerra original Android launcher icon, generated after Capacitor sync."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

ROOT=Path(__file__).resolve().parent.parent
BASE=ROOT/"android/app/src/main/res"
def paint():
    W=512
    im=Image.new("RGBA",(W,W),(15,28,31,255))
    d=ImageDraw.Draw(im,"RGBA")
    for y in range(W):
        f=y/W
        d.line([(0,y),(W,y)],fill=(int(21+f*15),int(36+f*18),int(43+f*12),255),width=1)
    # Warm artillery sunset on the horizon.
    for k in range(45,-1,-1):
        radius=132+k*2;alpha=int(22*(1-k/46))
        d.ellipse((256-radius,194-radius,256+radius,194+radius),fill=(233,149,73,alpha))
    d.ellipse((150,97,364,310),fill=(216,127,61,255))
    # Distinct original diagonal steel cuts and beveled bronze border.
    for i in range(9):
        x=15+i*65
        d.polygon([(x,-5),(x+13,-5),(x-47,512),(x-60,512)],fill=(100,118,103,24))
    d.rounded_rectangle((20,20,492,492),radius=86,outline=(240,202,131,255),width=17)
    d.rounded_rectangle((33,33,479,479),radius=76,outline=(84,101,91,255),width=5)
    # Heavy vehicle silhouette: tracked hull and barrel.
    d.rounded_rectangle((96,326,405,390),radius=27,fill=(19,31,28,255),outline=(181,167,116,255),width=5)
    for x in range(122,402,42):
        d.ellipse((x-16,350,x+22,391),fill=(39,53,44,255),outline=(140,153,126,255),width=6)
        d.ellipse((x-4,361,x+11,380),fill=(176,162,119,255))
    d.polygon([(129,326),(169,282),(329,276),(370,319),(373,343),(120,343)],fill=(60,86,69,255))
    d.polygon([(181,288),(203,247),(308,243),(334,288)],fill=(37,59,51,255))
    d.rectangle((303,263,449,282),fill=(31,44,39,255))
    d.rectangle((442,255,465,291),fill=(24,31,29,255))
    d.rectangle((210,249,295,260),fill=(171,174,130,255))
    for i in range(6):
        x=153+i*37
        d.ellipse((x,314,x+5,319),fill=(209,187,137,255))
    # Original infantry helmet and nose profile above the vehicle.
    d.ellipse((200,161,280,238),fill=(174,122,79,255))
    d.pieslice((182,122,294,194),180,360,fill=(49,76,56,255))
    d.polygon([(179,169),(297,169),(301,180),(186,184)],fill=(28,44,35,255))
    d.polygon([(210,223),(285,228),(316,282),(181,282)],fill=(77,106,72,255))
    d.rectangle((251,198,272,205),fill=(28,32,28,255))
    d.rectangle((259,198,262,200),fill=(247,224,157,255))
    # Vertical score insignia reads even at 48 px.
    d.rounded_rectangle((164,404,350,470),radius=17,fill=(15,24,26,245),outline=(211,187,126,255),width=5)
    try:
        font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",43)
    except OSError:
        font=ImageFont.load_default()
    d.text((256,430),"CG 2D",anchor="mm",fill=(255,222,151,255),font=font,
           stroke_width=2,stroke_fill=(39,35,29,255))
    return im

def build():
    icon=paint()
    for density,px in [("mdpi",48),("hdpi",72),("xhdpi",96),("xxhdpi",144),("xxxhdpi",192)]:
        location=BASE/("mipmap-"+density)
        location.mkdir(parents=True,exist_ok=True)
        for filename in ("ic_launcher.png","ic_launcher_round.png","ic_launcher_foreground.png"):
            path=location/filename
            icon.resize((px,px),Image.Resampling.LANCZOS).save(path,"PNG",optimize=True)
    print("PASS: original CG 2D Android launcher icon written to all five density groups.")
if __name__=="__main__":build()
