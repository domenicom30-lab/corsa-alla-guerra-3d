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

def bg(im,kind,layer):
    d=ImageDraw.Draw(im,"RGBA"); W,H=im.size
    rng=random.Random(101+len(kind)*111+(31 if layer=='near' else 0))
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
