#!/usr/bin/env python3
"""Pre-render original authored 2D sprites into PNG atlases for the Android package.
Artwork is built OFFLINE during CI, never procedurally drawn in the game's runtime.
Requires Pillow. Manifest is versioned and every declared atlas is mandatory.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import json, math, random, sys

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public" / "assets" / "sprites"
MANIFEST = json.loads((ROOT / "sprite-manifest.json").read_text("utf-8"))
PUBLIC.mkdir(parents=True, exist_ok=True)

def poly(d, pts, fill, outline="#192321", width=3):
    d.polygon(pts, fill=fill)
    if outline:
        d.line(pts + [pts[0]], fill=outline, width=width, joint="curve")

def line(d, pts, color, width=5, outline="#192321"):
    if outline:
        d.line(pts, fill=outline, width=width+5, joint="curve")
        for p in (pts[0],pts[-1]):d.ellipse((p[0]-(width+5)//2,p[1]-(width+5)//2,p[0]+(width+5)//2,p[1]+(width+5)//2),fill=outline)
    d.line(pts, fill=color, width=width, joint="curve")

def rect(d, bounds, fill, outline=None, width=2):
    d.rectangle(tuple(int(x) for x in bounds), fill=fill, outline=outline, width=width)

def ell(d, bounds, fill, outline="#1b2622", width=2):
    d.ellipse(tuple(int(x) for x in bounds), fill=fill, outline=outline, width=width)

def speckle(im,seed,count=120):
    rng=random.Random(seed)
    draw=ImageDraw.Draw(im,"RGBA")
    for _ in range(count):
        x=rng.randrange(im.width); y=rng.randrange(im.height)
        if im.getpixel((x,y))[-1]>50:
            col=(235,220,168,35) if rng.random()<.55 else (18,27,23,35)
            draw.rectangle((x,y,x+rng.randint(1,3),y+rng.randint(1,3)),fill=col)

def hero(im,pose,n):
    d=ImageDraw.Draw(im); t=n*math.pi/4
    moving=pose in ("run","runFire")
    stride=round(math.sin(t)*22) if moving else 0
    bounce=round(abs(math.sin(t))*5) if moving else 0
    crouch=25 if pose=="duck" else 0
    jump=-17 if pose=="jump" else 0
    hurt=6 if pose=="hurt" else 0
    y=bounce+crouch+jump+hurt
    # Two independently posed legs; oversized boots and folded trousers.
    line(d,[(87,124+y),(77-stride*.28,153+y),(62-stride,181+y)],"#57634c",19)
    line(d,[(119,126+y),(125+stride*.26,153+y),(135+stride,181+y)],"#414d3c",20)
    poly(d,[(47-stride,179+y),(75-stride,176+y),(81-stride,190+y),(46-stride,191+y)],"#343a32")
    poly(d,[(117+stride,177+y),(145+stride,177+y),(162+stride,191+y),(115+stride,191+y)],"#3c4437")
    rect(d,(49-stride,185+y,81-stride,190+y),"#b8a77c")
    rect(d,(117+stride,185+y,160+stride,190+y),"#b8a77c")
    # Webbing and backpack, layered illustrated coat.
    poly(d,[(67,84+y),(80,69+y),(111,83+y),(113,148+y),(66,145+y)],"#293d34")
    rect(d,(56,87+y,79,136+y),"#48533e","#1a2620")
    rect(d,(59,97+y,75,124+y),"#829174")
    poly(d,[(76,73+y),(126,72+y),(141,102+y),(130,143+y),(74,142+y),(62,104+y)],"#5e714f")
    poly(d,[(77,77+y),(92,75+y),(85,136+y),(72,131+y)],"#9dad7c",None)
    poly(d,[(115,77+y),(132,94+y),(132,133+y),(113,140+y)],"#394c3a",None)
    for k in range(3):
        rect(d,(79+k*16,137+y,91+k*16,153+y),"#303b30","#161f1b")
        rect(d,(83+k*16,139+y,88+k*16,143+y),"#a69b69")
    line(d,[(75,80+y),(115,139+y)],"#b9ad7d",6)
    rect(d,(69,125+y,135,133+y),"#2b3930")
    rect(d,(100,124+y,111,134+y),"#d7c088")
    # Hands, face, ear, expression, scarf.
    ell(d,(85,44+y,123,92+y),"#c7946f")
    ell(d,(117,64+y,128,77+y),"#a37655")
    poly(d,[(89,77+y),(106,88+y),(123,78+y),(121,91+y),(96,98+y)],"#a74e37")
    poly(d,[(89,79+y),(110,92+y),(100,96+y),(87,91+y)],"#e5ab6b",None)
    rect(d,(111,67+y,123,71+y),"#29342f")
    rect(d,(113,66+y,116,68+y),"#f9e6b0")
    rect(d,(119,77+y,126,81+y),"#714c39")
    # Fitted helmet, camouflage panels, light and strap.
    ell(d,(80,34+y,132,69+y),"#3c503d")
    poly(d,[(78,60+y),(133,56+y),(139,65+y),(77,70+y)],"#2d3e36")
    poly(d,[(85,43+y),(105,37+y),(123,45+y),(112,49+y)],"#8f9e75",None)
    rect(d,(90,40+y,102,45+y),"#adbd8a")
    line(d,[(82,66+y),(93,78+y)],"#293a2f",4)
    # Left arm and shoulder pads.
    line(d,[(78,89+y),(64,105+y),(82,122+y)],"#74865c",18)
    poly(d,[(69,81+y),(89,78+y),(94,95+y),(75,101+y)],"#859970")
    rect(d,(61,112+y,79,121+y),"#bd946d","#2c362d")
    # Right shooting arm follows torso and recoils.
    recoil=(n%2)*6 if pose in ("fire","runFire") else 0
    arm_y=96+y+(-10 if pose=="jump" else 0)
    line(d,[(124,91+y),(134,arm_y),(153-recoil,arm_y+5)],"#586b4d",18)
    ell(d,(147-recoil,arm_y-1,164-recoil,arm_y+13),"#cc9e75")
    # Original compact arcade rifle with brass highlights and detachable magazine.
    poly(d,[(133-recoil,arm_y),(153-recoil,arm_y-6),(165-recoil,arm_y+9),(141-recoil,arm_y+12)],"#493d32")
    poly(d,[(139-recoil,arm_y-7),(191-recoil,arm_y-7),(194-recoil,arm_y+6),(139-recoil,arm_y+7)],"#252c2c")
    rect(d,(151-recoil,arm_y-5,184-recoil,arm_y-2),"#9aa7a0")
    rect(d,(176-recoil,arm_y+1,200-recoil,arm_y+4),"#59675d")
    rect(d,(197-recoil,arm_y-6,204-recoil,arm_y+7),"#212b2c")
    poly(d,[(158-recoil,arm_y+7),(172-recoil,arm_y+7),(169-recoil,arm_y+28),(162-recoil,arm_y+26)],"#313b35")
    rect(d,(162-recoil,arm_y+11,169-recoil,arm_y+13),"#a9a58c")
    # Uniform stitching and miniature patches convey scale without runtime drawing.
    rect(d,(111,101+y,118,107+y),"#bb8d4a")
    rect(d,(112,103+y,118,105+y),"#f0d8a4")
    for j in range(5):rect(d,(94+j*4,111+y,96+j*4,113+y),"#b3b18c")
    if pose in ("fire","runFire") and n%2==0:
        poly(d,[(201-recoil,arm_y-7),(214-recoil,arm_y-17),(218-recoil,arm_y-4),(236-recoil,arm_y+1),(216-recoil,arm_y+7)],"#ffb44b",None)
        ell(d,(208-recoil,arm_y-3,223-recoil,arm_y+5),"#fff4b3",None)
    if pose=="hurt":
        line(d,[(72,96+y),(55,85+y),(47,75+y)],"#ad9c73",13)
        ell(d,(70,82+y,89,110+y),"#f2c186",None)
    # Non-identical authored frames with lighting variation / dirt speckles.
    speckle(im,1000+sum(ord(k) for k in pose)*11+n,60)


def hero_finishing(im,pose,n):
    """Second-pass cloth shading, engraved helmet, joint folds and rifle details."""
    d=ImageDraw.Draw(im,"RGBA")
    t=n*math.pi/4
    stride=round(math.sin(t)*22) if pose in ("run","runFire") else 0
    bounce=round(abs(math.sin(t))*5) if pose in ("run","runFire") else 0
    y=bounce+(25 if pose=="duck" else 0)+(-17 if pose=="jump" else 0)+(6 if pose=="hurt" else 0)
    rng=random.Random(4049+n*17+len(pose)*13)
    d.arc((80,35+y,131,69+y),186,327,fill=(176,190,136,255),width=3)
    d.line([(83,58+y),(110,55+y),(134,58+y)],fill=(28,38,32,255),width=3)
    d.line([(85,61+y),(104,63+y)],fill=(211,188,120,205),width=2)
    for k in range(7):
        xx=rng.randint(92,127);yy=y+rng.randint(39,56)
        d.line([(xx,yy),(xx+rng.randint(-3,4),yy+1)],fill=(202,191,140,155),width=2)
    d.polygon([(120,67+y),(126,70+y),(130,78+y),(121,80+y)],fill=(120,78,54,210))
    d.line([(123,79+y),(111,87+y)],fill=(111,69,51,205),width=2)
    d.line([(101,78+y),(109,80+y)],fill=(236,186,137,140),width=2)
    d.arc((66,75+y,102,114+y),179,292,fill=(193,204,140,190),width=3)
    d.line([(73,103+y),(67,110+y),(77,120+y)],fill=(36,50,42,255),width=3)
    d.line([(121,94+y),(133,97+y),(140,108+y)],fill=(151,171,115,255),width=3)
    for k in range(5):
        yy=98+y+k*7
        d.line([(82,yy),(91+(k%3)*4,yy+3)],fill=(41,60,45,165),width=2)
    d.line([(82,76+y),(116,134+y)],fill=(54,60,43,220),width=3)
    d.line([(84,76+y),(118,134+y)],fill=(219,195,137,155),width=1)
    for k in range(8):
        xx=85+k*4;yy=81+y+k*7
        d.rectangle((xx,yy,xx+2,yy+3),fill=(235,222,171,180))
    for k in range(3):
        xx=79+k*16
        d.rectangle((xx,139+y,xx+12,142+y),fill=(130,149,112,255))
        d.line([(xx+2,146+y),(xx+9,146+y)],fill=(204,175,119,255),width=2)
    for k in range(70):
        xx=rng.randint(72,133);yy=rng.randint(88,135)+y
        if 0<=yy<im.height and im.getpixel((xx,yy))[-1]>200:
            d.point((xx,yy),fill=(208,201,142,130) if k%4==0 else (17,33,31,112))
    for bx in (59-stride,130+stride):
        d.line([(bx+7,177+y),(bx+22,181+y)],fill=(16,31,28,255),width=3)
        d.line([(bx+8,188+y),(bx+27,188+y)],fill=(199,173,118,210),width=2)
        for k in range(3):
            yy=152+y+k*8
            d.line([(bx+5,yy),(bx+16,yy+3)],fill=(177,181,129,156),width=2)
    recoil=(n%2)*6 if pose in ("fire","runFire") else 0
    aim_y=96+y+(-10 if pose=="jump" else 0)
    d.line([(156-recoil,aim_y-7),(187-recoil,aim_y-7)],fill=(16,23,24,255),width=2)
    d.line([(171-recoil,aim_y-5),(191-recoil,aim_y-5)],fill=(204,209,186,170),width=1)
    for k in range(4):
        xx=152-recoil+k*8
        d.line([(xx,aim_y+3),(xx+3,aim_y+5)],fill=(25,32,30,220),width=1)
    d.ellipse((157-recoil,aim_y-5,162-recoil,aim_y),fill=(177,177,155,255))
    if pose in ("fire","runFire") and n%2==0:
        for j in range(6):
            xx=203-recoil+j*4
            d.line([(xx,aim_y-4-j%2*3),(xx+4,aim_y-6-j%3)],fill=(255,219,126,205),width=2)

def enemy(im,kind,n):
    d=ImageDraw.Draw(im);stride=int(math.sin(n*math.pi/4)*19);bob=abs(int(math.sin(n*math.pi/4)*3))
    coat,shine,hat={
      "rifleman":("#72664b","#bdb091","#4a5544"),
      "assault":("#53664f","#a6b58a","#385349"),
      "grenadier":("#88744c","#dcc08a","#686747"),
      "heavy":("#445960","#91aab0","#354952")
    }[kind]
    heavy=kind=="heavy";wide=9 if heavy else 0; y=bob
    line(d,[(87-wide,126+y),(77-wide-stride,155+y),(64-wide-stride,182+y)],"#414b3d",21)
    line(d,[(113+wide,126+y),(123+wide+stride,157+y),(140+wide+stride,182+y)],"#39463b",22)
    poly(d,[(47-wide-stride,178+y),(76-wide-stride,176+y),(82-wide-stride,192+y),(45-wide-stride,192+y)],"#252f2d")
    poly(d,[(119+wide+stride,178+y),(148+wide+stride,178+y),(159+wide+stride,192+y),(117+wide+stride,192+y)],"#29332f")
    rect(d,(49-wide-stride,188+y,82-wide-stride,193+y),"#92927a")
    rect(d,(120+wide+stride,188+y,159+wide+stride,193+y),"#a6a08a")
    poly(d,[(67-wide,82+y),(80-wide,75+y),(133+wide,82+y),(144+wide,134+y),(72-wide,144+y)],coat)
    poly(d,[(72-wide,85+y),(92-wide,78+y),(90-wide,133+y),(70-wide,133+y)],shine,None)
    poly(d,[(115+wide,84+y),(139+wide,101+y),(139+wide,135+y),(113+wide,141+y)],"#313f39",None)
    rect(d,(67-wide,126+y,140+wide,134+y),"#28352f")
    for j in range(3):
        rect(d,(76+j*18,133+y,89+j*18,150+y),"#303e36","#1d2926")
        rect(d,(80+j*18,134+y,86+j*18,139+y),"#b6aa7c")
    rect(d,(52-wide,88+y,68-wide,127+y),"#35433a")
    rect(d,(55-wide,94+y,65-wide,116+y),shine)
    ell(d,(91,50+y,131,92+y),"#b88a63")
    rect(d,(122,70+y,134,74+y),"#1b2928")
    rect(d,(127,73+y,132,76+y),"#eed3a1")
    rect(d,(129,81+y,139,85+y),"#84543d")
    ell(d,(82-wide,36+y,135+wide,69+y),hat)
    poly(d,[(76-wide,59+y),(140+wide,56+y),(145+wide,68+y),(75-wide,70+y)],"#2d3b35")
    rect(d,(97,41+y,111,45+y),shine)
    if kind=="heavy":
        rect(d,(85-wide,53+y,135+wide,63+y),"#24373d")
        rect(d,(96,57+y,125,60+y),"#a6bdbb")
        rect(d,(77-wide,93+y,86-wide,113+y),"#9eaaa1")
    if kind=="grenadier":
        for j in range(4):ell(d,(68+j*17,115+y,77+j*17,130+y),"#4f5843")
    line(d,[(83,93+y),(73,107+y),(89,121+y)],shine,18)
    line(d,[(125,93+y),(143,101+y),(159,106+y)],coat,18)
    ell(d,(154,100+y,172,117+y),"#bb9471")
    poly(d,[(143,102+y),(170,95+y),(173,112+y),(146,116+y)],"#303b33")
    if kind=="grenadier":
        rect(d,(151,95+y,199,109+y),"#384c41")
        rect(d,(164,98+y,199,101+y),"#acb4a1")
        ell(d,(194,98+y,208,109+y),"#192725")
    elif kind=="heavy":
        rect(d,(144,96+y,210,111+y),"#29383d")
        rect(d,(155,99+y,205,102+y),"#b2bbb4")
        rect(d,(173,110+y,196,125+y),"#374c4e")
        rect(d,(202,92+y,212,114+y),"#151f22")
    else:
        rect(d,(148,99+y,206,111+y),"#27302f")
        rect(d,(153,100+y,198,103+y),"#a4ada1")
        rect(d,(200,96+y,218,101+y),"#3f4c43")
        rect(d,(172,111+y,182,130+y),"#333d37")
    rect(d,(98,105+y,108,110+y),"#dccba0")
    for j in range(4):rect(d,(94+j*6,119+y,96+j*6,121+y),"#c1ae8a")
    speckle(im,2000+sum(map(ord,kind))*17+n,55)

def boss(im,n):
    d=ImageDraw.Draw(im)
    r=math.sin(n*math.pi/3)
    rect(d,(18,180,302,224),"#171e1c","#080f0d",5)
    ell(d,(20,182,72,229),"#292f2b")
    ell(d,(252,182,302,229),"#29302c")
    for j in range(9):
        xx=23+j*31
        rect(d,(xx,181,xx+26,188),"#7b8578")
        rect(d,(xx,218,xx+27,225),"#647269")
    for j in range(6):
        xx=43+j*44
        ell(d,(xx-18,183,xx+18,219),"#202d2a")
        ell(d,(xx-12,189,xx+12,213),"#7e8c80")
        ell(d,(xx-5,196,xx+5,206),"#333d38")
    poly(d,[(32,160),(70,127),(257,123),(287,154),(298,188),(26,190)],"#536952")
    poly(d,[(65,132),(258,130),(273,146),(51,153)],"#9ea988",None)
    rect(d,(60,157,274,170),"#3b5147")
    for k in range(17):
        xx=55+k*13
        rect(d,(xx,163,xx+4,168),"#a5ad94")
    poly(d,[(99,127),(112,88),(210,79),(240,117),(232,138),(94,141)],"#364b43")
    poly(d,[(118,94),(199,85),(225,109),(107,115)],"#8b9c83",None)
    rect(d,(105,130,240,139),"#283933")
    rect(d,(185,92,290-max(0,r)*13,105),"#2a3834")
    rect(d,(196,94,290-max(0,r)*13,98),"#a2ad99")
    rect(d,(284-max(0,r)*13,86,313-max(0,r)*13,110),"#1c2928")
    rect(d,(288-max(0,r)*13,91,308-max(0,r)*13,99),"#849487")
    ell(d,(128,72,187,96),"#2f3d37")
    rect(d,(136,70,180,77),"#99a58b")
    for i in range(12):
        x=62+(i*23)%220;y=147+(i*11)%35
        rect(d,(x,y,x+3,y+3),"#c4b890")
    if n>=3:
        for j in range(n*2):
            xx=79+j*27%190;yy=115+j*17%70
            rect(d,(xx,yy,xx+14,yy+4),"#1b2826")
            rect(d,(xx+3,yy+1,xx+5,yy+2),"#bb8c61")
        for j in range(6):
            xx=190+j*5;yy=70-j*9
            ell(d,(xx-11,yy-12,xx+23,yy+14),(62,64,62,110),None)
    if n%2==0:ell(d,(266,105,279,116),"#ffd386",None)
    speckle(im,100+n,160)

def fx(im,kind,n,count):
    d=ImageDraw.Draw(im,"RGBA")
    progress=n/max(1,count-1)
    x=64;y=64
    rng=random.Random(900+sum(map(ord,kind))*5+n)
    if kind in ("explosion","blast"):
        radius=int((19+progress*38)*(1-progress*.43))
        for i in range(19):
            a=i*math.pi*2/19+(progress*.3)
            rr=radius*(.5+rng.random()*.65)
            px=x+math.cos(a)*rr;py=y+math.sin(a)*rr
            rad=int(5+(1-progress)*rng.randint(5,13))
            ell(d,(px-rad,py-rad,px+rad,py+rad),["#ffefad","#ffca54","#ee6631","#932f2b"][i%4],None)
        radius2=int(radius*.55)
        ell(d,(x-radius2,y-radius2,x+radius2,y+radius2),"#fff3c4" if n<4 else "#ff9940",None)
    elif kind=="muzzle":
        for i in range(11):
            a=(i-5)*math.pi/15; rr=(26+10*math.sin(n+i))*max(.2,1-progress*.4)
            poly(d,[(x+5,y),(x+rr*math.cos(a),y+rr*math.sin(a)),(x+8,y+4)],"#ffd46c" if i%2 else "#fff8d5",None)
        ell(d,(x-10,y-11,x+17,y+11),"#ffecad",None)
    elif kind=="hit":
        for i in range(14):
            a=math.pi*2*i/14+progress*.3;rr=6+progress*34
            line(d,[(x+math.cos(a)*rr*.53,y+math.sin(a)*rr*.53),(x+math.cos(a)*rr,y+math.sin(a)*rr)],"#ffdc79" if i%2 else "#fff5cc",2,None)
        ell(d,(x-6,y-6,x+6,y+6),"#ffffd7",None)
    elif kind=="smoke":
        for i in range(11):
            a=rng.random()*math.pi*2; rr=rng.randrange(4,35)
            px=x+rr*math.cos(a);py=y+rr*math.sin(a)-progress*24
            rad=12+rng.randrange(3,15)
            ell(d,(px-rad,py-rad,px+rad,py+rad),(79+i*2,81+i,75+i,160-int(120*progress)),None)


def paint_forest_v21(im, layer):
    """Hand-layered woodland: muted valley ridges, branching trunks, soft organic crowns.
    No stochastic rectangular speckles in the sky.
    """
    d=ImageDraw.Draw(im,"RGBA")
    W,H=im.size
    rng=random.Random(2149 if layer=="far" else 9713)
    if layer=="far":
        palette_top=(26,44,56);palette_horizon=(133,130,102)
        for y in range(H):
            f=min(1,y/(H*.95))
            f=f*f*(3-2*f)
            color=tuple(int(palette_top[k]*(1-f)+palette_horizon[k]*f) for k in range(3))
            d.line((0,y,W,y),fill=color+(255,))
        # Distant, restrained warm disk; avoid giant opaque rings in RGBA raster export.
        d.ellipse((1005,124,1077,196),fill=(187,163,123,255))
        d.arc((1005,124,1077,196),180,325,fill=(218,187,142,255),width=3)
        # Natural overlapping foothills, irregular outlines instead of triangles.
        for depth in range(3):
            color=[(71,96,89,240),(54,83,77,248),(40,70,67,255)][depth]
            base=355+depth*53
            coords=[(-30,H),(W+30,H)]
            ridge=[]
            for x in range(-50,W+80,20):
                y=base+math.sin(x*.0054+depth*2.2)*34+math.sin(x*.0137+depth)*13
                ridge.append((x,y))
            d.polygon([(-20,H)]+ridge+[(W+20,H)],fill=color)
        # Far timberline: grouped, irregular crowns with thick branches.
        for i in range(35):
            x=int(i*47-30+rng.uniform(-19,16))
            crown_top=rng.randint(223,354)
            h=H-crown_top
            d.line([(x,H),(x,crown_top+55)],fill=(42,69,64,255),width=rng.randint(9,17))
            for j in range(5):
                cy=crown_top+j*int(h*.10)
                spread=(22+j*8)*rng.uniform(.8,1.2)
                col=(46+j*2,78+j*2,69+j,230)
                d.ellipse((x-spread,cy-16,x+spread,cy+30),fill=col)
        # No per-scanline translucent strokes: they produced visible banding on OLED.
    else:
        # Woods are grounded behind player, with open sightlines around the soldier.
        for i in range(19):
            x=int(i*82-56+rng.randint(-25,25))
            height=rng.randrange(155,345)
            trunk_bottom=H+12
            crown_y=H-height
            trunk_width=rng.randrange(13,26)
            palette=rng.choice([
                ((30,56,46,255),(46,84,61,255),(71,107,72,255)),
                ((31,62,52,255),(48,78,61,255),(78,111,75,255)),
                ((34,60,51,255),(44,76,61,255),(91,114,72,255))
            ])
            shadow,mid,light=palette
            # Branched trunk (no matching triangle outlines).
            d.polygon([(x-trunk_width//2,H),(x+trunk_width//2,H),
                       (x+trunk_width//3,crown_y+34),(x-trunk_width//4,crown_y+25)],fill=(51,54,41,255))
            d.line([(x-4,H),(x-5,crown_y+45)],fill=(96,92,67,160),width=3)
            for b in range(6):
                y=crown_y+38+b*int(height*.105)
                side=-1 if b%2==0 else 1
                tipx=x+side*rng.randrange(40,85)
                d.line([(x,y+25),(tipx,y-rng.randrange(12,37))],fill=(53,59,42,255),width=rng.randrange(5,10))
            # Natural lumpy leaf clusters in layers, no evenly spaced triangular shapes.
            for k in range(34):
                t=k/33
                cy=crown_y+int(height*.12)+rng.randint(-12,12)+t*height*.63
                spread=22+math.sin(math.pi*t)*45+(t*12)
                cx=x+rng.gauss(0,spread*.45)
                radius=rng.randrange(17,35)*(0.7+0.55*t)
                d.ellipse((cx-radius,cy-radius*.70,cx+radius,cy+radius*.70),
                          fill=mid if (k+i)%4 else shadow)
                if k%3==0:
                    d.arc((cx-radius,cy-radius*.70,cx+radius,cy+radius*.70),200,320,fill=(122,145,102,95),width=2)
            # Specular leaf clusters stay near crown highlights.
            for k in range(12):
                cx=x+rng.uniform(-36,41);cy=crown_y+rng.randint(21,max(22,int(height*.5)))
                rad=rng.randint(3,7)
                d.ellipse((cx-rad,cy-rad*.5,cx+rad,cy+rad*.5),fill=(121,153,103,100))
        # Roots and fallen branches add near ground texture, not sky noise.
        for k in range(95):
            x=rng.randrange(W);y=rng.randrange(450,540)
            col=rng.choice([(72,72,51,125),(113,105,68,88),(26,45,37,140)])
            d.line([(x,y),(x+rng.randint(-8,17),y+rng.randint(-2,3))],fill=col,width=rng.randint(1,3))


def draw_original_watchtower(im):
    """Detailed illustrated timber guard tower on a transparent layer."""
    d=ImageDraw.Draw(im,"RGBA");W,H=im.size
    rng=random.Random(95004)
    # Slight ground cast shadow and diagonal steel supports.
    d.ellipse((105,850,520,948),fill=(13,20,17,70))
    for x in (167,433):
        d.polygon([(x-24,282),(x+26,282),(x+30,902),(x-26,904)],fill=(49,43,33,255))
        d.line([(x-18,295),(x-20,877)],fill=(132,98,62,255),width=10)
        d.line([(x+12,300),(x+15,884)],fill=(28,26,23,255),width=9)
        for y in range(320,900,41):
            d.line([(x-20,y),(x+17,y+6)],fill=(161,132,88,110),width=2)
    # Reinforcing X-braces at believable heights.
    for y in [360,515,670,805]:
        for a,b in [((172,y),(431,y+141)),((425,y),(165,y+141))]:
            d.line([a,b],fill=(32,29,23,255),width=22)
            d.line([(a[0]+4,a[1]-3),(b[0]+4,b[1]-3)],fill=(113,83,48,255),width=14)
            d.line([(a[0]+3,a[1]-6),(b[0]+3,b[1]-6)],fill=(181,137,87,105),width=3)
    # Raised floor, planks, joists and metal bolt patterns.
    d.polygon([(103,292),(492,292),(504,335),(98,337)],fill=(50,46,35,255))
    d.polygon([(105,297),(497,297),(490,319),(105,320)],fill=(114,90,58,255))
    for x in range(125,487,36):
        d.line([(x,301),(x+3,319)],fill=(42,41,31,255),width=3)
    # Ranger guard room with irregular aged clapboard walls.
    d.polygon([(133,128),(462,126),(465,295),(128,298)],fill=(75,70,56,255))
    d.polygon([(140,132),(184,127),(179,296),(141,297)],fill=(131,107,72,255))
    for y in range(152,291,20):
        d.line([(137,y),(455,y+3)],fill=(38,39,34,255),width=4)
        d.line([(139,y-3),(453,y)],fill=(156,127,80,145),width=2)
    for x in (212,305,398):
        d.polygon([(x,156),(x+48,156),(x+48,249),(x,251)],fill=(18,28,28,255))
        d.line([(x+7,167),(x+7,246)],fill=(166,129,81,175),width=3)
        d.rectangle((x+6,227,x+44,233),fill=(44,55,43,255))
    # Guardrail and vertical support brackets.
    for x in (111,188,283,377,480):
        d.rectangle((x,246,x+14,321),fill=(42,39,32,255))
        d.rectangle((x+3,254,x+7,306),fill=(161,120,74,255))
    d.polygon([(110,249),(483,249),(493,264),(105,265)],fill=(117,88,57,255))
    d.line([(111,252),(482,252)],fill=(198,158,101,255),width=7)
    # Roof is asymmetrical and built from angled shingles.
    d.polygon([(82,129),(160,61),(438,57),(510,135)],fill=(34,40,35,255))
    d.polygon([(105,126),(171,71),(430,69),(485,125)],fill=(81,80,61,255))
    for y in (81,99,116):
        d.line([(145-(y-80)*.4,y),(451+(y-80)*.4,y)],fill=(161,139,101,135),width=3)
    d.line([(90,135),(502,135)],fill=(191,150,97,255),width=13)
    d.line([(97,140),(497,140)],fill=(54,50,41,255),width=7)
    # Warning pennant and cable.
    d.line([(460,63),(461,6)],fill=(39,46,39,255),width=7)
    d.polygon([(461,7),(553,21),(468,54)],fill=(151,57,42,255))
    d.line([(461,9),(544,23)],fill=(219,159,89,255),width=4)
    # Ladder along one corner, rung wear.
    d.line([(110,335),(106,918)],fill=(50,48,40,255),width=13)
    d.line([(148,335),(147,916)],fill=(50,48,40,255),width=13)
    for y in range(365,899,38):
        d.line([(110,y),(146,y+2)],fill=(184,141,83,255),width=7)
        d.line([(112,y-1),(143,y)],fill=(229,186,113,155),width=2)
    # Distinct timber knots, highlights, bolts and chipped paint.
    for i in range(130):
        x=rng.randint(135,467);y=rng.randint(151,869)
        color=(214,166,98,95) if i%2==0 else (22,28,25,160)
        d.line([(x,y),(x+rng.randint(-4,5),y+rng.randint(3,15))],fill=color,width=rng.randint(1,3))
    for x in (165,433):
        for y in (385,543,705,838):
            d.ellipse((x-5,y-4,x+5,y+6),fill=(24,25,24,255))
            d.ellipse((x-2,y-3,x+2,y+1),fill=(201,185,137,255))

def bg(im,kind,layer):
    d=ImageDraw.Draw(im,"RGBA"); W,H=im.size
    rng=random.Random(101+len(kind)*111+(31 if layer=='near' else 0))
    if kind=='forest':
        paint_forest_v21(im,layer)
        return
    themes={
      "forest":((34,55,70),(195,151,96)),
      "village":((48,61,76),(171,126,98)),
      "industrial":((31,44,59),(158,132,106)),
      "fortress":((17,33,46),(105,96,86))
    }
    top,bottom=themes[kind]
    if layer=="far":
        for yy in range(H):
            f=yy/H
            base=tuple(int(a+(b-a)*f) for a,b in zip(top,bottom))
            d.line([(0,yy),(W,yy)],fill=base+(255,),width=1)
        ell(d,(1070,50,1245,224),(240,192,126,100) if kind!="fortress" else (185,205,204,86),None)
        # Distinct far skyline, parallax will scroll slowly.
        for i in range(45):
            x=i*42-35;y=150+rng.randint(70,240)
            if kind=="forest":
                poly(d,[(x-42,H),(x+28,y-90),(x+84,H)],(44,66,64,220),None)
                poly(d,[(x-15,H),(x+22,y-142),(x+59,H)],(30,56,49,235),None)
            elif kind=="village":
                hh=rng.randint(120,280)
                rect(d,(x,H-hh,x+55,H),(68,65,64,250))
                poly(d,[(x-8,H-hh),(x+20,H-hh-45),(x+55,H-hh+7)],(41,47,51,245),None)
                for j in range(3):
                    yy=H-hh+24+j*50
                    rect(d,(x+8,yy,x+24,yy+26),(27,36,39,255))
            elif kind=="industrial":
                hh=rng.randint(180,320)
                rect(d,(x,H-hh,x+78,H),(49,61,65,250))
                if i%3==0:
                    rect(d,(x+23,H-hh-160,x+44,H-hh),(39,49,54,255))
                    for j in range(5):
                        q=rng.randrange(10,33)
                        ell(d,(x-30+j*17,H-hh-195-j*24-q,x+q+j*17,H-hh-152-j*25),(136,136,124,80),None)
            else:
                hh=rng.randint(210,315)
                rect(d,(x,H-hh,x+88,H),(39,52,58,255))
                for j in range(3):rect(d,(x+j*27,H-hh-32,x+16+j*27,H-hh),(43,56,63,255))
        for _ in range(2400):
            x=rng.randrange(W);y=rng.randrange(H)
            col=(230,203,167,rng.randint(10,40)) if rng.random()<.55 else (25,35,38,rng.randint(15,55))
            d.rectangle((x,y,x+rng.randrange(1,5),y+rng.randrange(1,4)),fill=col)
    else:
        # Transparent near buildings, platforms, foreground objects and set dressings.
        for i in range(32):
            x=i*54-25
            if kind=="forest":
                yy=H-rng.randint(120,265)
                rect(d,(x+19,yy,x+36,H),(43,51,37,255))
                for j in range(5):
                    off=yy+j*24
                    poly(d,[(x-38,off+37),(x+27,off-55),(x+92,off+37)],(41+j*2,69+j*2,46+j,255),None)
                    line(d,[(x+25,off-11),(x+21,off+24)],(97,118,75,235),3,None)
            elif kind=="village":
                hh=rng.randrange(100,300)
                rect(d,(x,H-hh,x+62,H),(106,91,76,255))
                rect(d,(x+4,H-hh+8,x+19,H-hh+15),(169,140,109,255))
                for j in range(3):
                    y=H-hh+30+j*51
                    rect(d,(x+14,y,x+33,y+28),(33,43,45,255))
                    rect(d,(x+35,y+4,x+39,y+23),(171,128,79,255))
                poly(d,[(x-7,H-hh),(x+40,H-hh-37),(x+71,H-hh+6)],(72,73,63,255),None)
            elif kind=="industrial":
                hh=rng.randrange(85,240)
                rect(d,(x,H-hh,x+68,H),(76,79,70,255))
                rect(d,(x+8,H-hh+10,x+53,H-hh+16),(152,135,98,255))
                for j in range(4):
                    y=H-hh+26+j*43
                    rect(d,(x+11,y,x+29,y+21),(31,43,44,255))
                rect(d,(x+32,H-hh-180,x+47,H-hh),(61,70,70,255))
                line(d,[(x+10,H-hh),(x+70,H-hh-80)],(43,52,54,255),5)
            else:
                hh=rng.randrange(160,280)
                rect(d,(x,H-hh,x+69,H),(62,75,77,255))
                rect(d,(x,H-hh-22,x+18,H-hh),(82,97,96,255))
                rect(d,(x+43,H-hh-22,x+61,H-hh),(82,97,96,255))
                for j in range(4):
                    rect(d,(x+12,H-hh+22+j*48,x+42,H-hh+31+j*48),(31,43,46,255))
                    rect(d,(x+16,H-hh+24+j*48,x+23,H-hh+27+j*48),(178,160,120,255))
        for _ in range(500):
            x=rng.randrange(W);y=rng.randrange(H)
            d.rectangle((x,y,x+2,y+2),fill=(215,185,143,45))

def ui(im,kind,n):
    d=ImageDraw.Draw(im,"RGBA"); w,h=im.size
    if kind=="hud":
        d.rounded_rectangle((8,8,w-10,h-10),radius=15,fill=(17,29,34,240),outline="#b2ad92",width=4)
        d.rounded_rectangle((18,16,w-18,h-17),radius=10,outline="#677d76",width=2)
        for x in range(34,w-16,47):
            rect(d,(x,16,x+15,20),"#b7a67a")
        for x in range(30,w-25,55):
            rect(d,(x,h-23,x+18,h-20),"#b7a67a")
    else:
        d.rounded_rectangle((12,24,w-14,h-24),radius=22,fill=(22,34,36,220),outline="#eed29a",width=6)
        for x in range(33,w-30,26):
            rect(d,(x,29,x+11,35),"#cfae71")
    # Engraved metal grain: real raster detail rather than a flat-color stub.
    rng=random.Random(8401 if kind=="hud" else 8402)
    for j in range(470):
        x=rng.randrange(20,w-20)
        y=rng.randrange(27,h-28) if h>80 else rng.randrange(22,h-21)
        d.point((x,y),fill=(194,170,128,rng.randrange(45,120)) if j%3 else (5,12,13,140))
    for x in range(24,w-20,18):
        ell(d,(x,h-22,x+3,h-19),"#c6ad7a",None)

def write_atlas(rel,frames,fw,fh,fn,texture=True):
    sheet=Image.new("RGBA",(fw*frames,fh),(0,0,0,0))
    for n in range(frames):
        im=Image.new("RGBA",(fw,fh),(0,0,0,0))
        fn(im,n)
        if rel.startswith('hero/'):
            hero_finishing(im,rel.split('/')[-1].replace('.png',''),n)
        if texture and n%2==0:
            speckle(im,775+n*8,20)
        sheet.paste(im,(fw*n,0),im if False else None)
    target=PUBLIC/rel
    target.parent.mkdir(parents=True,exist_ok=True)
    sheet.save(target,"PNG",optimize=True,compress_level=6)
    return target

def build():
    expected=set()
    for pose,n in MANIFEST["hero"].items():
        rel=f"hero/{pose}.png";expected.add(rel)
        write_atlas(rel,n,240,210,lambda im,i,p=pose:hero(im,p,i))
    for kind,n in MANIFEST["enemies"].items():
        rel=f"enemies/{kind}.png";expected.add(rel)
        write_atlas(rel,n,240,210,lambda im,i,k=kind:enemy(im,k,i))
    for kind,n in MANIFEST["boss"].items():
        rel=f"boss/{kind}.png";expected.add(rel)
        write_atlas(rel,n,340,240,lambda im,i:boss(im,i))
    for kind,n in MANIFEST["fx"].items():
        rel=f"fx/{kind}.png";expected.add(rel)
        write_atlas(rel,n,128,128,lambda im,i,k=kind,v=n:fx(im,k,i,v),False)
    for kind,n in MANIFEST["ui"].items():
        rel=f"ui/{kind}.png";expected.add(rel)
        write_atlas(rel,n,512 if kind=="hud" else 768,76 if kind=="hud" else 162,lambda im,i,k=kind:ui(im,k,i),False)
    for scene in MANIFEST["backgrounds"]:
        for layer in ("far","near"):
            rel=f"backgrounds/{scene}-{layer}.png";expected.add(rel)
            im=Image.new("RGBA",(1400,540),(0,0,0,0))
            bg(im,scene,layer)
            path=PUBLIC/rel;path.parent.mkdir(parents=True,exist_ok=True)
            im.save(path,"PNG",optimize=True,compress_level=6)
    # Original standalone forest guard tower, used directly in runtime background.
    scenery=ROOT/"public/assets/scenery/watchtower.png"
    scenery.parent.mkdir(parents=True,exist_ok=True)
    tower=Image.new("RGBA",(600,960),(0,0,0,0))
    draw_original_watchtower(tower)
    tower.save(scenery,"PNG",optimize=True,compress_level=6)
    print(f"Built authored watchtower scenery: {scenery.stat().st_size} bytes.")
    (PUBLIC/"manifest.json").write_text(json.dumps(MANIFEST,indent=2)+"\n",encoding="utf-8")
    validate(expected)
    print(f"Built {len(expected)} original mandatory raster sprite atlases and layers.")

def validate(expected=None):
    expected=expected or {
      f"{cat}/{kind}.png" for cat in ("hero","enemies","boss","fx","ui")
      for kind in MANIFEST[cat]
    }
    expected.update(f"backgrounds/{scene}-{layer}.png" for scene in MANIFEST["backgrounds"] for layer in ("far","near"))
    total=0
    for rel in sorted(expected):
        path=PUBLIC/rel
        if not path.exists():raise SystemExit(f"ERROR: missing mandatory raster sprite: {rel}")
        with Image.open(path) as im:
            im.verify()
        with Image.open(path) as im:
            if im.width<128 or im.height<70:raise SystemExit(f"ERROR: undersized asset {rel}")
        total+=path.stat().st_size
    if (PUBLIC/"manifest.json").exists():
        if json.loads((PUBLIC/"manifest.json").read_text("utf8"))!=MANIFEST:raise SystemExit("ERROR: raster manifest out of sync")
    print(f"Validated {len(expected)} shipped raster files, total {total/1048576:.2f} MiB.")

if __name__=="__main__":
    validate() if "--verify" in sys.argv else build()
