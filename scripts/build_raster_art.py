#!/usr/bin/env python3
"""Pre-render original authored 2D sprites into PNG atlases for the Android package.
Artwork is built OFFLINE during CI, never procedurally drawn in the game's runtime.
Requires Pillow. Manifest is versioned and every declared atlas is mandatory.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import json, math, random, sys
from sprite_materials import soldier_surface, armored_surface
from airborne_art import draw_airborne_finishing
from secondary_landmarks import draw_landmark
from enemy_falling_art import draw_falling_pose
from environment_details import paint_environment_details
from boss_damage_art import paint_boss_damage
from grenade_throw_art import draw_grenade_throw

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
    if pose=='slide':
        draw_slide_pose(im,n)
        return
    if pose=='land':
        draw_land_pose(im,n)
        return
    d=ImageDraw.Draw(im); t=n*math.pi/4
    moving=pose in ("run","runFire")
    stride=round(math.sin(t)*22) if moving else ((-3,-14,-17,-8,8,18,12,0)[n%8] if pose in ("jump","jumpFire") else 0)
    bounce=round(abs(math.sin(t))*5) if moving else 0
    crouch=25 if pose in ("duck","duckFire") else 0
    jump=((-5,-11,-22,-29,-30,-21,-11,-3)[n%8] if pose in ("jump","jumpFire") else 0)
    hurt=6 if pose=="hurt" else 0
    idle_breath=round((1-math.cos(n*math.pi/2))*1.25) if pose=="idle" else 0
    y=bounce+crouch+jump+hurt+idle_breath
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
    # Right shoulder pivots independently when holding the aim-up input.
    recoil=(n%2)*6 if pose in ("fire","runFire","duckFire","jumpFire") else 0
    arm_y=96+y+(-10 if pose in ("jump","jumpFire") else 0)
    if pose=="aimUp":
        line(d,[(124,91+y),(139,91+y),(132,66+y)],"#586b4d",18)
        ell(d,(123,61+y,143,77+y),"#cc9e75")
        poly(d,[(126,93+y),(125,37+y),(142,31+y),(148,91+y)],"#252f31")
        rect(d,(128,44+y,136,81+y),"#5b6964")
        rect(d,(130,48+y,135,77+y),"#a8b2aa")
        rect(d,(128,25+y,142,39+y),"#242c2e")
        rect(d,(134,16+y,140,32+y),"#79887c")
        rect(d,(129,11+y,144,20+y),"#1b2528")
        poly(d,[(128,76+y),(116,83+y),(118,102+y),(132,100+y)],"#3d4a40")
        rect(d,(126,90+y,145,97+y),"#2d3733")
        if n%2==0:
            poly(d,[(128,13+y),(119,0+y),(138,8+y),(145,0+y),(151,17+y)],"#ffcc69",None)
            ell(d,(130,8+y,141,19+y),"#fff5b8",None)
    else:
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
    if pose in ("fire","runFire","duckFire","jumpFire") and n%2==0:
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
    stride=round(math.sin(t)*22) if pose in ("run","runFire") else ((-3,-14,-17,-8,8,18,12,0)[n%8] if pose in ("jump","jumpFire") else 0)
    bounce=round(abs(math.sin(t))*5) if pose in ("run","runFire") else 0
    y=bounce+(25 if pose in ("duck","duckFire") else 0)+((-5,-11,-22,-29,-30,-21,-11,-3)[n%8] if pose in ("jump","jumpFire") else 0)+(6 if pose=="hurt" else 0)+(round((1-math.cos(n*math.pi/2))*1.25) if pose=="idle" else 0)
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
    recoil=(n%2)*6 if pose in ("fire","runFire","duckFire","jumpFire") else 0
    aim_y=96+y+(-10 if pose in ("jump","jumpFire") else 0)
    if pose=="aimUp":
        d.line([(128,25+y),(141,23+y)],fill=(191,200,184,255),width=2)
        for k in range(4):
            yy=40+y+k*12
            d.line([(128,yy),(138,yy)],fill=(32,41,39,225),width=2)
    else:
        d.line([(156-recoil,aim_y-7),(187-recoil,aim_y-7)],fill=(16,23,24,255),width=2)
        d.line([(171-recoil,aim_y-5),(191-recoil,aim_y-5)],fill=(204,209,186,170),width=1)
        for k in range(4):
            xx=152-recoil+k*8
            d.line([(xx,aim_y+3),(xx+3,aim_y+5)],fill=(25,32,30,220),width=1)
        d.ellipse((157-recoil,aim_y-5,162-recoil,aim_y),fill=(177,177,155,255))
    if pose in ("fire","runFire","duckFire","jumpFire") and n%2==0:
        for j in range(6):
            xx=203-recoil+j*4
            d.line([(xx,aim_y-4-j%2*3),(xx+4,aim_y-6-j%3)],fill=(255,219,126,205),width=2)



def draw_secondary_motion(im,pose,n):
    """Original eight-phase cloth flutter and equipment inertia, baked into PNG sprite atlases."""
    if pose not in ("idle","run","runFire","jump","jumpFire","fire","duck","duckFire","aimUp"):
        return
    d=ImageDraw.Draw(im,"RGBA")
    t=n*math.pi/4
    stride=round(math.sin(t)*22) if pose in ("run","runFire") else 0
    bounce=round(abs(math.sin(t))*5) if pose in ("run","runFire") else 0
    crouch=25 if pose in ("duck","duckFire") else 0
    jump=((-5,-11,-22,-29,-30,-21,-11,-3)[n%8] if pose in ("jump","jumpFire") else 0)
    breathing=round((1-math.cos(n*math.pi/2))*1.25) if pose=="idle" else 0
    y=bounce+crouch+jump+breathing
    # The warm scarf stream follows acceleration instead of being glued to the torso.
    flutter=round(math.sin(t)*9) if pose in ("run","runFire") else (-4,2,5,0)[n%4]
    if pose in ("jump","jumpFire"):
        flutter=(3,8,13,6,-7,-12,-4,2)[n%8]
    tail_x=66-flutter
    tail_y=96+y-(5 if pose in ("jump","jumpFire") else 0)+(abs(flutter)//3)
    d.polygon([(91,84+y),(104,89+y),(88,96+y),(tail_x,tail_y+5),
               (tail_x-11,tail_y),(81,87+y)],
              fill=(154,49,39,255))
    d.line([(86,86+y),(tail_x+1,tail_y+1)],
           fill=(240,161,106,235),width=3)
    d.line([(tail_x-9,tail_y+1),(tail_x-4,tail_y+4)],
           fill=(100,40,34,255),width=2)
    # A strapped field canteen and fabric pouch sway opposite to the forward leg.
    equipment_sway=-round(stride*.18)
    x=73+equipment_sway
    d.rectangle((x-8,112+y,x+3,132+y),fill=(26,43,36,255),
                outline=(14,28,26,255),width=2)
    d.rectangle((x-6,115+y,x+1,127+y),fill=(107,122,85,255))
    d.line([(x-7,112+y),(x+2,112+y)],fill=(215,188,122,255),width=2)
    d.point((x-2,121+y),fill=(231,209,146,255))
    # Jacket hem flaps slightly in opposite directions during running.
    if pose in ("run","runFire","jump","jumpFire"):
        hem=round(math.sin(t)*6) if pose not in ("jump","jumpFire") else (3,7,11,6,-8,-12,-4,0)[n%8]
        d.polygon([(88,134+y),(111,138+y),(109+hem,150+y),
                   (92+hem,146+y)],fill=(63,81,59,255))
        d.line([(91+hem,145+y),(106+hem,149+y)],
               fill=(173,185,127,225),width=2)


def draw_slide_pose(im,n):
    """Low, elongated four-frame evasive slide: unique authored silhouette.
    Boots trail behind, helmet stays low, barrel clears the knees.
    """
    d=ImageDraw.Draw(im,"RGBA")
    kick=round(math.sin(n*math.pi/2)*5)+(n//2)*2
    # Soft dust and trailing boots, using the same saturated uniform palette.
    ell(d,(21,185,196,199),(35,44,33,105),None)
    poly(d,[(23,172+kick),(55,171+kick),(102,175),(118,186),(27,190)],"#3d4e3d")
    poly(d,[(28,178+kick),(62,178+kick),(76,193),(20,194)],"#252f2a")
    rect(d,(24,188,69,194),"#b0a27a",None)
    poly(d,[(73,172-kick//2),(115,159),(147,171),(169,184),(87,188)],"#4d634e")
    poly(d,[(69,179),(119,176),(123,193),(69,197)],"#26392f")
    rect(d,(69,192,121,197),"#aa9d77",None)
    # Leaning trench coat and reinforced ammunition pouch.
    poly(d,[(80,135),(100,112),(154,122),(173,149),(164,175),(98,184),(73,162)],"#647951")
    poly(d,[(82,137),(114,120),(105,173),(83,175)],"#a1b385",None)
    poly(d,[(124,130),(159,132),(166,156),(145,167)],"#3c5240",None)
    poly(d,[(85,136),(98,129),(104,164),(83,166)],"#334639")
    for j in range(3):
        x=114+j*15
        rect(d,(x,162,x+10,179),"#2d3d32","#17251f",2)
        rect(d,(x+2,164,x+7,168),"#b7ae80",None)
    line(d,[(100,125),(147,171)],"#d0be87",5)
    # Helmet close to the ground, eye visible toward the enemy.
    ell(d,(131,89,175,135),"#c89a72")
    poly(d,[(128,94),(139,75),(164,73),(183,88),(187,103),(125,107)],"#3e5844")
    poly(d,[(127,98),(185,99),(190,110),(128,111)],"#283d33")
    poly(d,[(141,83),(167,80),(175,90),(149,93)],"#91a580",None)
    rect(d,(165,113,178,117),"#223129",None)
    rect(d,(169,112,172,114),"#fff0bf",None)
    poly(d,[(164,125),(180,129),(174,137),(154,131)],"#ae5c42",None)
    # Elbow slides into a low shooting brace; secondary hand holds the gun.
    line(d,[(157,145),(178,157),(191,147)],"#7c9065",14)
    ell(d,(184,139,199,157),"#d2a57c")
    # Tapered rifle, receiver, sight and long barrel.
    poly(d,[(165,140),(202,133),(209,148),(173,157)],"#323b35")
    rect(d,(190,137,229,146),"#25312f","#111d1d",3)
    rect(d,(208,136,234,139),"#b5c1a9",None)
    rect(d,(226,133,239,149),"#303d37")
    line(d,[(174,147),(203,143)],"#b6bca4",2,None)
    poly(d,[(195,149),(205,146),(206,162),(200,165)],"#2e3f34")
    # Animated grit only near the soil, never above the soldier.
    for q in range(7):
        x=29-q*5-(n%2)*4;y=187-(q%3)*5
        rect(d,(x,y,x+3,y+2),("#c3b88e" if q%2 else "#6f765e"),None)

def draw_melee_bayonet(im,n):
    """A real four-step thrust/recovery on the rifle muzzle, not only a runtime arc."""
    d=ImageDraw.Draw(im,"RGBA")
    forward=(0,10,18,6)[n%4]
    angle=(-17,-6,9,3)[n%4]
    x=200+forward
    y=96+angle
    # Worn steel bayonet with a gold guard.
    poly(d,[(x-4,y-4),(x+12,y-7),(x+25,y-3),(x+13,y+3),(x-5,y+6)],"#9eacaa")
    line(d,[(x+1,y-1),(x+23,y-2)],"#f5ecc9",2,None)
    rect(d,(x-10,y-7,x-4,y+8),"#d1b178","#363829",2)
    for k in range(5):
        r=18+k*4
        a=(-1.15+k*.15+n*.11)
        px=x+math.cos(a)*r+8;py=y+math.sin(a)*r
        ell(d,(px-3,py-2,px+3,py+2),(255,208,126,160),None)


def draw_land_pose(im,n):
    """Four-frame landing squash and recovery, with a grounded dust ripple."""
    base=Image.new("RGBA",im.size,(0,0,0,0))
    hero(base,"idle",n)
    scale=(.79,.84,.93,1.0)[n%4]
    h=round(im.height*scale)
    mini=base.resize((im.width,h),Image.Resampling.NEAREST)
    im.alpha_composite(mini,(0,im.height-h))
    d=ImageDraw.Draw(im,"RGBA")
    radius=54+n*15
    d.arc((104-radius,173,104+radius,208),195,343,fill=(180,161,109,190-int(n*26)),width=max(1,4-n))
    for k in range(5):
        x=37+k*36+(n%2)*8
        ell(d,(x,188-n%3,x+3,191-n%3),(199,182,136,135),None)

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


def drivable_tank(im,n):
    """Original six-frame arcade tank. Unlike the old runtime rectangles, all shading
    and silhouette variation is shipped as authored PNG sheets built offline.
    """
    d=ImageDraw.Draw(im,"RGBA")
    rng=random.Random(40109+n*11)
    offset=(n%3)*4
    recoil=(n%2)*7
    # Ground shadow; links follow the frame index for kinetic treads.
    ell(d,(28,215,368,248),(14,23,19,103),None)
    ell(d,(36,162,359,232),"#101a18",None)
    ell(d,(46,166,349,225),"#272f29","#0f1817",5)
    for k in range(15):
        xx=45+k*20
        rect(d,(xx,168+(k+n)%3,xx+17,179+(k+n)%3),"#697568","#18231f",2)
        rect(d,(xx,210+(k+n)%3,xx+17,220+(k+n)%3),"#768273","#18231f",2)
        rect(d,(xx+4,168+(k+n)%3,xx+9,170+(k+n)%3),"#e2c691",None)
    # Road wheels, casting lines, hub rims and individual bolts.
    for k in range(7):
        cx=72+k*42
        ell(d,(cx-18,175,cx+18,216),"#1b2724","#101816",5)
        ell(d,(cx-12,181,cx+12,210),"#8e9a82","#343f36",3)
        ell(d,(cx-7,185,cx+7,205),"#4b6255",None)
        ell(d,(cx-2,193,cx+3,198),"#d7c397",None)
        for q in range(4):
            ang=q*math.pi/2+n*.12
            px=cx+math.cos(ang)*9;py=195+math.sin(ang)*10
            ell(d,(px-2,py-2,px+2,py+2),"#d1bd92",None)
    # Layered armor hull with chipped angled front plate.
    poly(d,[(37,170),(67,120),(108,113),(313,111),(354,133),(365,171),(353,184),(40,184)],"#4c6654")
    poly(d,[(46,155),(81,126),(122,121),(319,125),(346,150),(343,161)],"#839b76",None)
    poly(d,[(47,167),(349,164),(340,181),(46,181)],"#293e35",None)
    poly(d,[(60,139),(91,130),(115,131),(87,152),(52,159)],"#b1bd83",None)
    poly(d,[(324,128),(353,148),(356,164),(336,164)],"#313f37",None)
    rect(d,(91,149,303,157),"#32463d","#1e2b26",2)
    for k in range(12):
        x=110+k*17
        rect(d,(x,151,x+5,154),"#afbba2",None)
    # Thick riveted applique plates.
    for x in (64,117,171,228,284,332):
        for y in (145,174):
            ell(d,(x-3,y-3,x+3,y+3),"#e1cea1","#333b32",1)
    # Turret ring and upper armor dome, angled welded edges.
    ell(d,(125,106,273,141),"#203129","#111d1c",5)
    poly(d,[(115,123),(133,88),(180,68),(258,75),(283,105),(275,125)],"#4d6a59")
    poly(d,[(131,99),(176,77),(253,82),(270,98)],"#acb994",None)
    poly(d,[(139,109),(171,94),(269,108),(274,124),(122,127)],"#314a3f",None)
    line(d,[(140,115),(271,116)],"#a5af88",4,None)
    # Operable hatch, rim and periscope.
    ell(d,(176,62,237,89),"#243a32","#15241e",4)
    ell(d,(184,64,230,79),"#92a58b","#2f4337",3)
    rect(d,(193,54,222,64),"#34483a","#1d2d27",3)
    rect(d,(198,56,204,60),"#d0d4b1",None)
    # Tank cannon, six-frame spring recoil and metal brake.
    poly(d,[(251,102),(365-recoil,99),(369-recoil,115),(249,119)],"#303f38")
    rect(d,(263,100,367-recoil,106),"#9ca991","#33443d",3)
    rect(d,(264,111,359-recoil,115),"#1f2e2b",None)
    rect(d,(364-recoil,94,384-recoil,119),"#202d2b","#0e1919",3)
    rect(d,(371-recoil,98,384-recoil,104),"#99a78c",None)
    rect(d,(372-recoil,111,385-recoil,116),"#8e9d88",None)
    for x in (285,316,346):
        line(d,[(x-recoil//2,100),(x-recoil//2,115)],"#26352e",3,None)
    # Utility gear and brown webbing lashed to the rear.
    rect(d,(77,102,121,132),"#514d3a","#222b25",4)
    for q in range(3):
        line(d,[(84+q*12,105),(91+q*12,130)],"#b4a275",3,None)
    rect(d,(73,114,121,119),"#242f29",None)
    ell(d,(59,123,87,150),"#a29b6d","#334439",3)
    line(d,[(61,135),(84,137)],"#d5c08d",2,None)
    # Commander visible only when entering; fully hand-painted into frames.
    if n in (1,2,4,5):
        ell(d,(193,34,222,67),"#ba875f","#262f29",2)
        poly(d,[(188,38),(190,19),(207,14),(227,21),(230,39)],"#3d5746")
        poly(d,[(185,36),(234,35),(235,43),(185,43)],"#283c32")
        rect(d,(216,46,225,50),"#25382e",None)
        line(d,[(196,66),(219,75)],"#c7a07b",5,None)
    # Battle scars with metallic highlight, grime, serial insignia.
    for i in range(85):
        x=rng.randint(59,332);y=rng.randint(99,167)
        color=(199,188,134,115) if i%3 else (25,37,30,165)
        line(d,[(x,y),(x+rng.randint(-6,6),y+rng.randint(-3,2))],color,rng.randint(1,2),None)
    rect(d,(165,139,215,163),"#344a3e","#a5aa82",2)
    d.text((173,144),"07",fill="#e2dbad")
    # Muzzle ignition occupies a separate animation frame, no opaque rectangles.
    if n==5:
        poly(d,[(385-recoil,101),(396,88),(399,101),(411,109),(392,115)],"#ffd76e",None)
        ell(d,(384-recoil,100,399,111),"#fff4c4",None)

def fx(im,kind,n,count):
    d=ImageDraw.Draw(im,"RGBA")
    progress=n/max(1,count-1)
    x=64;y=64
    rng=random.Random(900+sum(map(ord,kind))*5+n)
    if kind in ("explosion","blast"):
        # Hand-staged animation timing: white-hot ignition -> lobed fire -> soot cloud.
        power=max(.08,math.sin((.12+progress*.87)*math.pi))
        radius=10+int(43*power)
        segments=20
        edge=[]
        for j in range(segments*2):
            a=j*math.pi/segments+progress*.4
            stretch=(.87+rng.random()*.42)*(1 if j%2==0 else .61)
            rr=radius*stretch
            edge.append((x+math.cos(a)*rr,y+math.sin(a)*rr*.88))
        poly(d,edge,("#ce431f" if n<5 else "#4b4940"),None)
        inner=[]
        for j in range(24):
            a=j*math.pi/12+progress*.4
            rr=radius*(.40+rng.random()*.26)
            inner.append((x+math.cos(a)*rr,y+math.sin(a)*rr))
        if progress<.75:poly(d,inner,"#ffba3b" if progress<.5 else "#ed7132",None)
        if progress<.64:
            core=radius*(.40-progress*.16)
            ell(d,(x-core,y-core,x+core,y+core),"#fff3b4" if n<4 else "#ffc961",None)
        # Scattered animated ember arcs retain silhouette without noise.
        for j in range(12):
            a=j*math.pi/6+progress*.45
            dist=radius*(1.05+rng.random()*.45)
            bx=x+math.cos(a)*dist;by=y+math.sin(a)*dist*.87
            size=(2+rng.random()*4)*(1-progress*.55)
            col="#fff4ae" if j%4==0 else "#d95b29"
            if progress>.65:col="#8e7660"
            ell(d,(bx-size,by-size,bx+size,by+size),col,None)
        if progress>.5:
            for j in range(7):
                a=rng.random()*math.pi*2
                bx=x+math.cos(a)*radius*.6;by=y+math.sin(a)*radius*.46
                rad=7+rng.random()*10
                ell(d,(bx-rad,by-rad,bx+rad,by+rad),
                    (68,66,59,int(170*(1-progress)+20)),None)
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



def finish_enemy_art(im,kind,n):
    """Unique rifleman/assault/grenadier/heavy pixel details and human expressions."""
    d=ImageDraw.Draw(im,"RGBA")
    rng=random.Random(7750+len(kind)*100+n*11)
    stride=int(math.sin(n*math.pi/4)*19)
    y=abs(int(math.sin(n*math.pi/4)*3))
    heavy=kind=="heavy"
    # Heavier helmet lip, pronounced brows, profile chin.
    d.arc((81-(9 if heavy else 0),36+y,137+(9 if heavy else 0),71+y),
          191,332,fill=(211,194,139,220),width=3)
    d.line([(85,62+y),(132,59+y)],fill=(24,36,32,255),width=3)
    d.line([(119,67+y),(134,69+y)],fill=(28,38,35,255),width=4)
    d.line([(121,70+y),(128,70+y)],fill=(239,220,167,255),width=1)
    d.line([(113,85+y),(131,88+y)],fill=(92,56,45,255),width=3)
    for j in range(12):
        xx=rng.randint(86,135); yy=rng.randint(42,55)+y
        d.line([(xx,yy),(xx+rng.randint(-3,4),yy+1)],
               fill=(25,33,30,160) if j%3 else (211,194,146,160),width=2)
    # Coat collar and equipment embossing.
    d.line([(78,79+y),(74,133+y)],fill=(21,38,32,255),width=4)
    d.line([(82,79+y),(86,132+y)],fill=(188,194,150,180),width=2)
    d.line([(133,83+y),(141,128+y)],fill=(20,34,30,230),width=3)
    for j in range(5):d.line([(98+j*6,114+y),(100+j*6,117+y)],fill=(220,201,154,180),width=2)
    for j in range(3):
        xx=76+j*18
        d.line([(xx+2,135+y),(xx+12,135+y)],fill=(171,165,115,255),width=2)
    # Boots with leg-dependent crease animation.
    for bx in (49-stride,119+stride):
        d.line([(bx+4,187+y),(bx+33,187+y)],fill=(15,27,26,255),width=4)
        d.line([(bx+6,191+y),(bx+33,191+y)],fill=(150,147,115,200),width=2)
    if kind=="rifleman":
        d.polygon([(94,82+y),(117,83+y),(110,92+y),(96,94+y)],fill=(154,72,52,255))
        d.line([(105,88+y),(102,99+y)],fill=(218,122,82,255),width=4)
    elif kind=="assault":
        d.line([(91,80+y),(121,128+y)],fill=(193,188,130,230),width=6)
        d.line([(92,80+y),(122,128+y)],fill=(34,57,47,220),width=2)
        d.rectangle((69,88+y,84,100+y),fill=(152,171,96,255),outline=(22,44,34,255),width=2)
    elif kind=="grenadier":
        for j in range(3):
            gx=79+j*18;gy=136+y
            d.ellipse((gx,gy-3,gx+13,gy+15),fill=(51,67,45,255),outline=(25,39,32,255),width=2)
            d.rectangle((gx+5,gy-7,gx+8,gy-2),fill=(177,168,128,255))
    else:
        for j in range(5):
            gx=86+j*8;d.rectangle((gx,90+y,gx+5,97+y),fill=(155,173,163,255))
        for j in range(7):
            xx=159+j*7;d.line([(xx,96+y),(xx,111+y)],fill=(24,37,38,255),width=2)
        d.line([(172,96+y),(205,96+y)],fill=(221,224,187,210),width=2)
    for j in range(45):
        xx=rng.randint(76,140);yy=rng.randint(100,143)+y
        if 0<=yy<im.height and im.getpixel((xx,yy))[-1]>245:
            d.point((xx,yy),fill=(10,29,30,125) if j%3 else (207,210,158,150))



def finish_enemy_pose(im,pose,n):
    """Distinct illustrated impact and defensive stances in original enemy silhouettes."""
    if pose=="Crouch":
        compact=im.resize((240,150),Image.Resampling.NEAREST)
        im.paste((0,0,0,0),(0,0,240,210))
        im.paste(compact,(0,56+n%2*2))
        d=ImageDraw.Draw(im,"RGBA")
        # New bent knee, low rifle and grounded cloth/dust details.
        d.polygon([(94,166),(123,174+n%2*2),(143,182),(117,189),(88,182)],fill=(62,81,62,255))
        d.line([(102,170),(134,182)],fill=(159,169,124,255),width=4)
        d.line([(152,149+n%2*2),(202,156+n%2*2)],fill=(27,35,33,255),width=7)
        d.line([(158,146+n%2*2),(198,151+n%2*2)],fill=(190,191,159,255),width=2)
        for k in range(4):
            xx=55-k*10-n*2;yy=191+k%2*2
            d.ellipse((xx,yy,xx+9,yy+4),fill=(148,138,102,170))
    elif pose=="Hurt":
        tilted=im.rotate((-12,-7,4,0)[n%4],Image.Resampling.BICUBIC,
                         expand=False,center=(116,145))
        im.paste((0,0,0,0),(0,0,240,210))
        im.paste(tilted,(0,0))
        d=ImageDraw.Draw(im,"RGBA")
        cx=106+n%2*8;cy=105+n%2*5
        if n<3:
            radius=12+n*6
            d.arc((cx-radius,cy-radius,cx+radius,cy+radius),200,335,
                  fill=(248,230,166,245-n*60),width=3)
        for k in range(5):
            dx=k*9+n*2
            d.line([(cx+dx,cy-k*3),(cx+dx+6,cy-k*3-7)],
                   fill=(204,172,111,max(45,180-n*30)),width=3)


def finish_enemy_attack(im,pose,n):
    """Four authored attack keys: visible cannon recoil or overhead grenade release."""
    d=ImageDraw.Draw(im,"RGBA")
    if pose=="Throw":
        # Erase the original straight rifle. The visible arm now rises to throw.
        d.rectangle((141,91,231,125),fill=(0,0,0,0))
        angle=(-1.57,-1.16,-.69,-.24)[n%4]
        shoulder=(128,93)
        elbow=(146,86)
        hand=(elbow[0]+int(math.cos(angle)*36),elbow[1]+int(math.sin(angle)*36))
        line(d,[shoulder,elbow,hand],(148,144,97,255),15)
        d.ellipse((hand[0]-8,hand[1]-9,hand[0]+10,hand[1]+7),
                  fill=(188,145,105,255),outline=(52,55,42,255),width=2)
        if n<3:
            d.ellipse((hand[0]+6,hand[1]-15,hand[0]+21,hand[1]),
                      fill=(58,74,53,255),outline=(200,184,129,255),width=2)
            d.line([(hand[0]+12,hand[1]-18),(hand[0]+16,hand[1]-14)],
                   fill=(215,197,139,255),width=3)
        else:
            # Last frame releases a grenade into the projectile simulation.
            for j in range(3):
                xx=hand[0]+16+j*8; yy=hand[1]-15-j*6
                d.line([(xx,yy),(xx+4,yy-4)],fill=(222,187,117,220),width=2)
    elif pose=="Fire":
        # Replace static barrel with recoil positions and unique flash frames.
        recoil=(0,8,4,0)[n%4]
        d.rectangle((145,94,231,126),fill=(0,0,0,0))
        d.line([(125,96),(145+recoil,105)],fill=(38,51,42,255),width=17)
        d.ellipse((141+recoil,99,155+recoil,117),fill=(192,155,109,255))
        d.rectangle((145+recoil,95,208+recoil,110),
                    fill=(31,43,41,255),outline=(16,25,26,255),width=3)
        d.line([(153+recoil,99),(205+recoil,99)],fill=(184,198,166,255),width=2)
        d.rectangle((207+recoil,98,221+recoil,105),fill=(20,30,31,255))
        d.line([(168+recoil,110),(185+recoil,125)],fill=(41,56,46,255),width=6)
        if n in (0,1):
            mx=224+recoil
            d.polygon([(mx,98),(mx+7,90),(mx+9,99),(mx+15,103),(mx+3,109)],
                      fill=(255,222,125,240))
            d.line([(mx+2,102),(mx+11,102)],fill=(239,125,49,245),width=3)


def finish_boss_art(im,n):
    """Tank dents, roadwheel highlights, bevels and scuffed steel."""
    d=ImageDraw.Draw(im,"RGBA")
    rng=random.Random(277+n)
    for j in range(24):
        xx=48+j*10;yy=146+(j%4)*5
        d.line([(xx,yy),(xx+7,yy)],fill=(29,43,39,255),width=2)
        if j%2==0:d.point((xx+4,yy+3),fill=(206,188,134,255))
    for j in range(6):
        xx=57+j*38
        d.arc((xx-11,189,xx+30,220),210,332,fill=(188,177,135,220),width=2)
        d.arc((xx-10,189,xx+29,219),10,156,fill=(33,43,40,230),width=3)
    for j in range(11):
        x=rng.randint(70,254);y=rng.randint(103,151)
        d.line([(x,y),(x+9,y+2)],fill=(29,44,39,230),width=2)
    d.line([(116,98),(219,98)],fill=(190,202,164,190),width=2)
    d.line([(99,140),(233,140)],fill=(19,33,32,255),width=4)
    d.rectangle((60,160,83,166),fill=(128,143,109,255),outline=(31,45,42,255))
    if n>=3:
        for j in range(n+1):
            x=90+j*27;y=113+j*9
            d.line([(x,y),(x+19,y+5)],fill=(37,32,27,255),width=5)
            d.line([(x+3,y-1),(x+9,y+1)],fill=(184,113,70,255),width=2)

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
        # Night sky remains uninterrupted: atmospheric debris is painted near ground,
        # never sprinkled as opaque, high-contrast pixels across every scene.
        for i in range(65):
            xx=rng.randrange(W); yy=rng.randrange(int(H*.84),H)
            col=(121,104,83,210) if i%3 else (34,41,42,220)
            d.line([(xx,yy),(xx+rng.randint(3,14),yy)],fill=col,width=rng.randint(1,2))
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


def draw_gameplay_prop(im,kind,n):
    """Original campaign actors & destructible scenery: 480x320 transparent atlas frames."""
    d=ImageDraw.Draw(im,"RGBA")
    rng=random.Random(7720+n*17+(19 if kind=="prisonerIdle" else 59))
    if kind=="sandbagCover":
        # Three levels of destruction: whole barricade, torn sacks, scattered rubble.
        # The final state remains visible, but no longer stops projectiles.
        d.ellipse((47,288,449,313),fill=(10,20,17,90))
        for row in range(3):
            count=6 if row==0 else 5 if row==1 else 4
            for j in range(count):
                if n==2 and (row>0 or j%2==0):continue
                if n==1 and (row==2 and j>=2):continue
                cx=75+j*59+(row%2)*22
                cy=259-row*46 + (j%2)*3
                if n==2:cy=277
                width=70 if n==0 else 65
                poly(d,[(cx-width//2,cy+19),(cx-width//2-3,cy+1),
                        (cx-width//2+9,cy-12),(cx+width//2-8,cy-14),
                        (cx+width//2+5,cy-2),(cx+width//2,cy+16)],
                     (119+row*9,105+row*6,73+row*6,255),
                     (34,36,28,255),3)
                d.arc((cx-width//2+4,cy-10,cx+width//2-3,cy+15),186,337,
                      fill=(211,186,132,230),width=4)
                d.line([(cx-width//2+11,cy+8),(cx+width//2-7,cy+10)],
                       fill=(83,78,58,200),width=3)
                d.arc((cx-7,cy-7,cx+10,cy+10),0,280,fill=(63,69,50,180),width=2)
                for k in range(11):
                    x=cx+rng.randint(-29,29)
                    y=cy+rng.randint(-8,13)
                    d.point((x,y),fill=(205,186,133,150) if k%3==0 else (51,48,35,135))
        if n>=1:
            # Rips reveal straw, broken planks and dirt. No solid invisible barrier.
            for k in range(28 if n==2 else 14):
                x=rng.randint(55,436);y=rng.randint(249 if n==2 else 185,299)
                d.line([(x,y),(x+rng.randint(-14,15),y-rng.randint(0,9))],
                       fill=(187,155,94,255) if k%2 else (72,61,42,255),
                       width=rng.randint(2,5))
            for k in range(18):
                x=rng.randint(50,445);y=rng.randint(279,301)
                d.ellipse((x,y,x+7,y+3),fill=(68,58,41,170))
    elif kind=="prisonerIdle":
        # Original noncombatant, much smaller than the soldier and independently animated.
        # Large transparent border maintains a consistent 480x320 prop atlas.
        sway=math.sin(n*math.pi/2)*5
        breathe=round(math.sin(n*math.pi/2)*3)
        x=240+sway;y=breathe
        d.ellipse((x-69,295,x+62,311),fill=(10,19,17,115))
        # Prisoner in tattered civilian outfit, arms restrained with rope.
        line(d,[(x-24,191+y),(x-35,266),(x-40,292)],(75,71,60,255),24)
        line(d,[(x+20,191+y),(x+24,268),(x+27,292)],(65,66,60,255),23)
        poly(d,[(x-54,286),(x-23,283),(x-16,300),(x-61,302)],(46,48,43,255))
        poly(d,[(x+7,286),(x+46,286),(x+53,301),(x+9,302)],(39,45,42,255))
        poly(d,[(x-39,156+y),(x-32,115+y),(x+16,109+y),(x+44,151+y),
                (x+37,212+y),(x-38,213+y)],(92,107,94,255))
        poly(d,[(x-33,118+y),(x-16,114+y),(x-11,207+y),(x-32,209+y)],(129,136,114,255))
        for k in range(7):
            px=x-24+k*9
            d.line([(px,155+y+(k%2)*5),(px+7,174+y)],
                   fill=(46,67,58,135),width=2)
        # Empty sleeves with wrists tied in front of the body.
        line(d,[(x-35,137+y),(x-47,169+y),(x-21,191+y)],(85,98,88,255),19)
        line(d,[(x+36,135+y),(x+49,169+y),(x+15,190+y)],(90,105,91,255),19)
        ell(d,(x-29,178+y,x-6,200+y),(177,132,99,255),None)
        ell(d,(x+4,179+y,x+27,198+y),(181,140,103,255),None)
        for j in range(3):
            d.line([(x-26+j*11,187+y),(x+17+j*4,190+y)],
                   fill=(181,143,90,220),width=3)
        # Expressive tired face and hair, proportional to world sprite scale.
        ell(d,(x-32,51+y,x+35,119+y),(177,130,97,255),(35,37,32,255),4)
        d.pieslice((x-38,41+y,x+36,96+y),180,355,fill=(54,59,50,255))
        d.line([(x-23,64+y),(x-6,67+y),(x+6,63+y)],
               fill=(151,159,132,190),width=4)
        d.line([(x-19,82+y),(x-7,83+y)],fill=(47,46,38,255),width=3)
        d.line([(x+10,81+y),(x+21,80+y)],fill=(49,48,38,255),width=3)
        d.line([(x-9,101+y),(x+10,104+y)],fill=(112,80,66,255),width=3)
        poly(d,[(x-31,125+y),(x-15,135+y),(x-4,121+y)],
             (175,161,124,255),None)
        # A distinct olive armband makes the hostage readable from afar.
        rect(d,(x+28,147+y,x+49,155+y),(187,160,95,255),None)
        for k in range(35):
            px=x+rng.randint(-33,35);py=y+rng.randint(123,205)
            if 0<=px<480 and 0<=py<320 and im.getpixel((int(px),int(py)))[3]>120:
                d.point((px,py),fill=(207,202,156,150) if k%3==0 else (30,53,43,120))

def draw_stage_prop(im,kind):
    """Original hand-authored foreground structures for four distinctive levels.
    Pixel-outlined, textured and mechanically plausible; never repeated across zones.
    """
    d=ImageDraw.Draw(im,"RGBA")
    rng=random.Random(18452+sum(ord(c) for c in kind)*19)
    if kind=="forestPost":
        # Rooted log firing position: support beams, thick dirt and stacked sandbags.
        poly(d,[(28,250),(84,202),(381,206),(455,253),(454,301),(29,306)],(49,58,39,255),None)
        for x in range(66,429,44):
            rect(d,(x,226,x+32,300),(81,67,49,255),(33,36,29,255),3)
            line(d,[(x+8,234),(x+12,292)],(147,121,80,200),3,None)
            for y in range(241,285,19):
                d.ellipse((x+10,y,x+15,y+5),fill=(40,36,29,255))
        for row in range(3):
            for col in range(9-row):
                x=59+col*43+row*20
                y=218+row*25+(col%2)*2
                ell(d,(x,y,x+49,y+26),(114+row*6,109+col%3*3,78+row*4,255),None)
                d.arc((x+3,y+1,x+45,y+25),176,338,fill=(191,174,127,225),width=3)
                line(d,[(x+7,y+16),(x+41,y+17)],(66,64,49,160),2,None)
        # Slanted roof of corrugated metal at the post's rear.
        for x in (110,385):
            rect(d,(x,63,x+22,213),(57,54,40,255),(30,34,28,255),3)
            line(d,[(x+6,68),(x+4,205)],(164,128,78,255),3,None)
        poly(d,[(86,88),(135,42),(399,39),(431,91)],(43,56,47,255))
        for x in range(108,402,22):
            line(d,[(x,78),(x+11,48)],(104,109,88,235),4,None)
        line(d,[(90,93),(429,95)],(183,155,102,255),8,None)
        # Open firing slot under canopy.
        rect(d,(140,99,384,192),(20,32,31,255),(98,85,64,255),5)
        for x in (160,245,335):
            rect(d,(x,120,x+10,187),(39,46,40,255))
        line(d,[(128,197),(403,198)],(205,172,117,255),8,None)
        # Loose netting and leaf camouflage.
        for k in range(42):
            x=rng.randrange(95,418);y=rng.randrange(39,106)
            col=(69,87,50,230) if k%3 else (140,132,71,210)
            d.ellipse((x,y,x+rng.randrange(12,27),y+rng.randrange(4,13)),fill=col)
        # Ground contact shadow.
        d.ellipse((16,297,467,316),fill=(11,18,16,95))
    elif kind=="ruinHouse":
        # Red brick two-story shattered building with arched windows and soot.
        poly(d,[(37,302),(38,85),(95,48),(295,45),(319,126),(358,138),(367,299)],(132,97,73,255))
        poly(d,[(42,95),(100,59),(296,61),(317,137),(299,150),(267,107),(123,108)],(165,123,94,255),None)
        poly(d,[(33,77),(101,32),(298,29),(354,136),(310,127),(282,63),(92,64)],(63,60,56,255))
        poly(d,[(94,47),(296,45),(310,60),(91,62)],(198,156,112,255),None)
        for y in range(111,297,18):
            for x in range(49+(y%36)*2//9,350,34):
                d.line([(x,y),(x+26,y)],fill=(79,63,53,220),width=3)
                d.line([(x,y),(x,y+15)],fill=(89,67,55,170),width=2)
                if (x+y)%5==0:rect(d,(x+6,y-7,x+15,y-4),(205,153,110,160),None)
        for x in (105,249):
            rect(d,(x,125,x+64,215),(37,40,40,255),(54,45,42,255),5)
            d.arc((x,108,x+64,159),180,360,fill=(36,39,37,255),width=10)
            rect(d,(x+10,161,x+54,171),(74,70,62,255))
            line(d,[(x+32,129),(x+32,210)],(143,121,89,255),5,None)
        # Collapse and exposed floors behind ripped wall.
        poly(d,[(351,139),(409,171),(381,215),(430,240),(374,282),(359,300),(331,296),(340,250),(310,225),(351,201)],(94,78,65,255))
        for x in range(310,439,19):
            y=255+rng.randint(-14,18)
            poly(d,[(x,y),(x+20,y-8),(x+28,y+16),(x-5,y+19)],(103+rng.randint(0,25),83,66,255))
        rect(d,(75,238,169,301),(45,42,39,255))
        poly(d,[(68,236),(176,236),(181,245),(68,247)],(182,150,110,255),None)
        d.ellipse((30,301,463,318),fill=(25,27,25,110))
        for k in range(60):
            x=rng.randint(35,353);y=rng.randint(86,283)
            d.line([(x,y),(x+rng.randint(-6,8),y+rng.randint(-4,8))],fill=(33,37,35,110),width=rng.randint(1,3))
    elif kind=="factoryMachinery":
        # Workshop pumping machinery, pipes, vats, gauges and rotating gear housing.
        for x in (96,378):
            rect(d,(x,23,x+35,292),(66,67,61,255),(22,33,35,255),6)
            for y in range(49,292,25):rect(d,(x+6,y,x+29,y+7),(132,125,103,255),None)
        rect(d,(65,281,454,311),(53,57,55,255),(21,29,29,255),5)
        for x in range(79,454,35):
            line(d,[(x,284),(x+13,302)],(180,149,101,255),5,None)
        ell(d,(100,87,343,283),(41,51,52,255),(19,25,26,255),7)
        ell(d,(124,112,322,270),(100,109,102,255),(26,37,37,255),7)
        ell(d,(163,146,284,258),(46,58,56,255),(161,161,135,255),9)
        for k in range(12):
            a=k*math.pi/6
            x=225+math.cos(a)*61;y=203+math.sin(a)*55
            rect(d,(x-7,y-8,x+7,y+8),(49,60,60,255),(20,26,27,255),2)
        ell(d,(198,178,252,229),(148,155,131,255),(25,35,36,255),6)
        ell(d,(218,195,234,210),(45,56,56,255),None)
        # Overhead pipes with clamps and valve handles.
        line(d,[(48,64),(414,64),(414,193)],(41,55,55,255),26,None)
        line(d,[(48,64),(414,64),(414,193)],(142,149,135,255),12,None)
        for x in (104,178,312,391):
            rect(d,(x,50,x+20,80),(58,65,63,255),(27,35,35,255),4)
            rect(d,(x+8,52,x+13,78),(190,168,126,255),None)
        ell(d,(373,155,450,229),(55,67,65,255),(191,181,140,255),6)
        d.arc((380,163,441,223),205,330,fill=(221,198,142,255),width=4)
        line(d,[(408,185),(432,170)],(200,111,79,255),4,None)
        for x in (142,321):
            d.ellipse((x-15,35,x+15,65),fill=(46,56,53,255),outline=(187,152,100,255),width=4)
            for j in range(6):
                a=j*math.pi/3
                d.line([(x+math.cos(a)*11,50+math.sin(a)*11),(x+math.cos(a)*21,50+math.sin(a)*21)],fill=(174,143,93,255),width=3)
        for k in range(65):
            x=rng.randint(80,437);y=rng.randint(96,280)
            d.line([(x,y),(x+rng.randint(-6,8),y+2)],fill=(204,158,111,95) if k%2 else (19,29,29,120),width=2)
        d.ellipse((44,300,468,320),fill=(14,22,21,110))
    else:
        # Massive fortress gate and searchlight battery, weathered concrete/steel.
        poly(d,[(22,309),(42,86),(116,54),(396,63),(465,112),(469,310)],(83,91,85,255))
        for x in (53,349):
            rect(d,(x,69,x+81,290),(105,113,105,255),(39,53,50,255),6)
            for y in (100,145,190,235):rect(d,(x+11,y,x+69,y+6),(64,76,69,255),None)
        poly(d,[(116,80),(180,36),(308,36),(365,80)],(40,53,50,255))
        line(d,[(124,86),(350,86)],(167,162,129,255),9,None)
        rect(d,(139,132,342,303),(31,46,44,255),(16,25,26,255),6)
        for x in range(150,343,23):
            rect(d,(x,138,x+13,301),(68,86,80,255),(21,34,32,255),3)
        for y in range(148,298,28):
            line(d,[(144,y),(338,y)],(119,125,107,255),4,None)
        # Reinforcing crossed bars of the steel gate.
        line(d,[(145,142),(335,296)],(37,51,48,255),17,None)
        line(d,[(335,142),(145,296)],(37,51,48,255),17,None)
        line(d,[(150,142),(339,292)],(162,158,121,255),5,None)
        ell(d,(183,102,292,166),(33,47,46,255),(168,162,121,255),8)
        ell(d,(203,112,272,155),(203,179,112,255),(30,42,42,255),4)
        line(d,[(237,133),(269,125)],(35,42,42,255),5,None)
        for x in (86,393):
            d.ellipse((x-35,20,x+36,94),fill=(46,61,59,255),outline=(143,153,138,255),width=7)
            d.polygon([(x-24,45),(x+26,32),(x+15,68)],fill=(221,201,139,255))
            line(d,[(x,94),(x,121)],(55,66,61,255),8,None)
        for k in range(65):
            x=rng.randint(47,439);y=rng.randint(95,285)
            d.line([(x,y),(x+rng.randint(-9,5),y+rng.randint(-8,10))],fill=(34,45,43,150),width=2)
        d.ellipse((22,304,466,320),fill=(14,22,21,100))


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
            hero_pose=rel.split('/')[-1].replace('.png','')
            if hero_pose not in ('slide','land'):hero_finishing(im,hero_pose,n)
            draw_secondary_motion(im,hero_pose,n)
            if hero_pose in ('jump','jumpFire'):draw_airborne_finishing(im,hero_pose,n)
            if hero_pose=='melee':draw_melee_bayonet(im,n)
            soldier_surface(im,hero_pose,n)
            if hero_pose=='throw':draw_grenade_throw(im,n)
        elif rel.startswith('enemies/'):
            kind=rel.split('/')[-1].replace('.png','')
            if kind.endswith('Fall'):
                finish_enemy_art(im,kind[:-4],n)
                draw_falling_pose(im,n)
            elif kind.endswith('Crouch'):
                finish_enemy_art(im,kind[:-6],n)
                soldier_surface(im,kind[:-6],n,kind[:-6])
                finish_enemy_pose(im,'Crouch',n)
            elif kind.endswith('Hurt'):
                finish_enemy_art(im,kind[:-4],n)
                soldier_surface(im,kind[:-4],n,kind[:-4])
                finish_enemy_pose(im,'Hurt',n)
            elif kind.endswith('Fire'):
                finish_enemy_art(im,kind[:-4],n)
                soldier_surface(im,kind[:-4],n,kind[:-4])
                finish_enemy_attack(im,'Fire',n)
            elif kind.endswith('Throw'):
                finish_enemy_art(im,kind[:-5],n)
                soldier_surface(im,kind[:-5],n,kind[:-5])
                finish_enemy_attack(im,'Throw',n)
            else:
                finish_enemy_art(im,kind,n)
                soldier_surface(im,kind,n,kind)
        elif rel.startswith('boss/'):
            finish_boss_art(im,n)
            armored_surface(im,n,boss=True)
            paint_boss_damage(im,rel.split('/')[-1].replace('.png',''),n)
        elif rel.startswith('vehicles/'):
            armored_surface(im,n,boss=False)
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
        write_atlas(rel,n,240,210,lambda im,i,k=kind:enemy(im,k[:-6] if k.endswith('Crouch') else k[:-4] if k.endswith(('Hurt','Fire','Fall')) else k[:-5] if k.endswith('Throw') else k,i))
    for kind,n in MANIFEST["boss"].items():
        rel=f"boss/{kind}.png";expected.add(rel)
        write_atlas(rel,n,340,240,lambda im,i:boss(im,i))
    for kind,n in MANIFEST["vehicles"].items():
        rel=f"vehicles/{kind}.png";expected.add(rel)
        write_atlas(rel,n,400,250,lambda im,i:drivable_tank(im,i),False)
    for kind,n in MANIFEST["fx"].items():
        rel=f"fx/{kind}.png";expected.add(rel)
        write_atlas(rel,n,128,128,lambda im,i,k=kind,v=n:fx(im,k,i,v),False)
    for kind,n in MANIFEST["ui"].items():
        rel=f"ui/{kind}.png";expected.add(rel)
        write_atlas(rel,n,512 if kind=="hud" else 768,76 if kind=="hud" else 162,lambda im,i,k=kind:ui(im,k,i),False)
    for name,frames in MANIFEST["props"].items():
        rel=f"props/{name}.png";expected.add(rel)
        write_atlas(rel,frames,480,320,lambda im,i,k=name:draw_gameplay_prop(im,k,i) if k in ('sandbagCover','prisonerIdle') else draw_landmark(im,k) if k in ('forestWreck','villageBarricade','industrialConverter','fortressHowitzer') else draw_stage_prop(im,k),False)
    for scene in MANIFEST["backgrounds"]:
        for layer in ("far","near"):
            rel=f"backgrounds/{scene}-{layer}.png";expected.add(rel)
            im=Image.new("RGBA",(1400,540),(0,0,0,0))
            bg(im,scene,layer)
            paint_environment_details(im,scene,layer)
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
      f"{cat}/{kind}.png" for cat in ("hero","enemies","boss","vehicles","fx","ui","props")
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
