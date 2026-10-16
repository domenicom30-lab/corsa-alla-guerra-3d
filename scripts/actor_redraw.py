"""Original articulated 2D infantry redraw: keyed legs, volumes and class silhouettes.

Runs exclusively in Pillow's offline raster pipeline. No Metal Slug assets,
third-party sprites, live Canvas paints, or additional mobile GPU passes.
"""
from PIL import ImageDraw
import math

HERO_FLIGHT=(-5,-11,-22,-29,-30,-21,-11,-3)
# Hand-posed keyframes instead of one sine offset applied to two rigid legs.
RUN_LEFT=((56,78),(49,68),(56,58),(80,77),(109,110),(101,106),(80,86),(62,66))
RUN_RIGHT=((128,147),(138,161),(146,169),(138,142),(125,126),(112,113),(111,119),(121,134))
AIR_LEFT=((61,90),(57,83),(68,78),(87,89),(100,113),(89,105),(77,98),(67,94))
AIR_RIGHT=((124,140),(137,150),(152,156),(141,143),(122,129),(106,115),(111,117),(122,133))

def _polygon(draw,points,color,edge=(15,27,25,255),thickness=3):
    pts=[(round(x),round(y)) for x,y in points]
    draw.polygon(pts,fill=color)
    if edge:
        draw.line(pts+[pts[0]],fill=edge,width=thickness,joint="curve")

def _articulate(im,index,offset,kind="hero",air=False):
    d=ImageDraw.Draw(im,"RGBA")
    i=index%8
    heavy=kind=="heavy"
    wide=7 if heavy else 0
    # Once the body is built, erase ONLY the previous stiff trousers below
    # the belt. Redraw two separate legs with independently authored joints.
    cut=max(109,round(146+offset))
    d.rectangle((29,cut,221,209),fill=(0,0,0,0))
    left,right=(AIR_LEFT,AIR_RIGHT) if air else (RUN_LEFT,RUN_RIGHT)
    lx,lk=left[i];rx,rk=right[i]
    if kind!="hero":
        lx+=-5-wide;rx+=wide;lk+=0;rk+=0
    heel=189+offset
    shin=166+offset
    hips=139+offset
    colors={
      "hero":("#293a31","#536c4e","#87976b","#1d2b28","#c7bb88"),
      "rifleman":("#353c32","#6b6950","#b3a487","#252d27","#c9b58c"),
      "assault":("#293c33","#536b50","#9cad81","#1d2f2a","#c8c39a"),
      "grenadier":("#3f4031","#7b6f52","#c7af7e","#282e25","#d4be8e"),
      "heavy":("#26363a","#506369","#99b3a9","#18272c","#c1c9b0")
    }
    deep,cloth,highlight,boot,metal=colors.get(kind,colors["rifleman"])
    # Back thigh flexes and the foreleg folds at a separate keyframe.
    for back in (True,False):
        hx=(123+wide) if back else (83-wide)
        knee=rk if back else lk
        foot=rx if back else lx
        lean=6 if back else -3
        knee_y=157+offset+((i+int(back))%3)*2
        _polygon(d,[(hx-12,hips-5),(hx+13,hips-5),
           (knee+10,knee_y),(knee+5,knee_y+11),
           (knee-12,knee_y+13),(knee-13,knee_y-2)],
           deep if back else cloth)
        _polygon(d,[(knee-9,knee_y),(knee+10,knee_y+3),
          (foot+8,shin+10),(foot+3,heel-8),(foot-16,heel-7)],
          deep if back else cloth)
        # Knee pad, curved limb plane and fold shadow, not pasted texture.
        _polygon(d,[(knee-8,knee_y+3),(knee+9,knee_y+4),
            (knee+7,knee_y+12),(knee-7,knee_y+12)],
            "#40534a" if back else "#7c926b",thickness=2)
        d.line([(knee-4,knee_y+4),(knee+4,knee_y+5)],
          fill=metal,width=2)
        d.line([(knee-3,knee_y+15),(foot-7,heel-12)],
          fill=highlight,width=3)
        d.line([(foot+4,heel-11),(foot+7,heel-3)],
          fill=deep,width=4)
        _polygon(d,[(foot-13,heel-11),(foot+15,heel-13),
           (foot+23,heel-4),(foot+19,heel+2),(foot-19,heel+2),
           (foot-23,heel-4)],boot,thickness=3)
        d.line([(foot-16,heel-5),(foot+18,heel-6)],fill=highlight,width=2)
        d.line([(foot-20,heel+1),(foot+19,heel+1)],fill=metal,width=4)
        for k in range(3):
            d.line([(foot+k*6-7,heel-11),(foot+k*6-4,heel-9)],
               fill="#adb39c",width=2)
        # Ankle buckles and authentic fabric wear accent each key.
        d.rectangle((foot-10,heel-12,foot-6,heel-8),
          fill="#d2bb88")
        d.line([(hx-3,hips+4),(knee-4,147+offset)],
          fill=highlight,width=2)

def _hero_plates(im,pose,n):
    d=ImageDraw.Draw(im,"RGBA")
    y=(round(abs(math.sin(n*math.pi/4))*5) if pose in ("run","runFire") else 0)
    if pose in ("jump","jumpFire"):
        y+=HERO_FLIGHT[n%8]
    if pose=="idle":
        y+=round((1-math.cos(n*math.pi/2))*1.25)
    # Overlapping three-plane canvas uniform, preserving face and weapon.
    _polygon(d,[(81,85+y),(94,82+y),(108,88+y),(117,110+y),
        (111,133+y),(82,130+y),(75,106+y)],"#445e48",thickness=2)
    _polygon(d,[(85,91+y),(96,88+y),(100,120+y),(90,127+y),
         (82,112+y)],"#859d72",edge=None)
    _polygon(d,[(100,89+y),(118,91+y),(129,108+y),(120,131+y),
         (108,129+y)],"#2f473a",edge=None)
    # Shallow 3D armor panels with beveled shoulder seam.
    _polygon(d,[(99,90+y),(121,93+y),(123,113+y),
        (114,120+y),(96,116+y)],"#6c8262",thickness=2)
    d.line([(101,93+y),(117,95+y)],fill="#c7c996",width=3)
    d.line([(103,101+y),(118,103+y)],fill="#253b34",width=2)
    d.line([(100,114+y),(113,117+y)],fill="#a4b488",width=2)
    # Ammunition belt follows the wearer's diagonally articulated strap.
    d.line([(82,86+y),(115,133+y)],fill="#293c31",width=8)
    d.line([(84,87+y),(117,134+y)],fill="#b5a174",width=4)
    for k in range(7):
        x=86+4*k;yy=91+6*k+y
        d.rectangle((x,yy,x+5,yy+4),fill="#d6bd85",outline="#4b4d3c",width=1)
        d.line([(x+1,yy+1),(x+4,yy+1)],fill="#ffe0a1",width=1)
    # Three physically overlapping ammo pouches, not colored rectangles.
    for k in range(3):
        x=83+k*17
        _polygon(d,[(x,132+y),(x+16,132+y),(x+18,148+y),
            (x+10,153+y),(x-1,147+y)],"#283d31",thickness=2)
        d.polygon([(x+2,134+y),(x+14,134+y),(x+12,140+y),
            (x+3,141+y)],fill="#889b70")
        d.line([(x+3,142+y),(x+14,143+y)],fill="#c6b188",width=2)
        d.rectangle((x+8,137+y,x+10,142+y),fill="#dcc38c")
    # Distinct human-readable face: cheek in shadow, nose, jaw and brow.
    d.polygon([(119,70+y),(125,73+y),(125,83+y),(113,88+y),
        (110,83+y)],fill="#996746")
    d.line([(108,80+y),(119,83+y)],fill="#f3b78e",width=2)
    d.line([(122,75+y),(128,76+y)],fill="#e4a576",width=2)
    d.line([(107,68+y),(121,68+y)],fill="#263a33",width=4)
    d.rectangle((113,66+y,119,68+y),fill="#f7e0ac")
    # Helmet plate shading and fabric cover catch highlights in the rim.
    _polygon(d,[(88,44+y),(96,36+y),(115,37+y),
        (128,47+y),(131,57+y),(84,61+y)],"#49664c",thickness=3)
    _polygon(d,[(91,44+y),(106,39+y),(121,46+y),
        (111,50+y),(88,52+y)],"#90a67b",edge=None)
    d.line([(85,57+y),(128,56+y)],fill="#192f2c",width=4)
    d.line([(87,58+y),(120,56+y)],fill="#b8bf8e",width=2)
    for j in range(7):
        x=91+5*j
        yy=46+(j%3)*3+y
        d.line([(x,yy),(x+3,yy+1)],fill="#243d34",width=2)
    # Vest and helmet are not enlarged; established proportions remain.
    if pose in ("run","runFire","jump","jumpFire","idle","fire"):
        offset=y
        _articulate(im,n,offset,"hero",pose in ("jump","jumpFire"))

def polish_hero(im,pose,n):
    if pose in ("slide","land","melee","throw","duck","duckFire","aimUp","hurt"):
        return
    _hero_plates(im,pose,n)

def polish_enemy(im,kind,n):
    if kind.endswith("Fall"):
        return
    base=kind
    for suffix in ("Crouch","Hurt","Fire","Throw"):
        if base.endswith(suffix):
            base=base[:-len(suffix)]
            break
    if base not in ("rifleman","assault","grenadier","heavy"):
        return
    d=ImageDraw.Draw(im,"RGBA")
    y=round(abs(math.sin(n*math.pi/4))*3)
    wide=9 if base=="heavy" else 0
    # Distinct tactical identities recognisable at 16% player height.
    if base=="heavy":
        # Broad armor and high-contrast full face shield.
        _polygon(d,[(74,86+y),(139,84+y),(153,100+y),
          (144,136+y),(73,134+y),(64,102+y)],"#34494b")
        _polygon(d,[(78,94+y),(127,91+y),(143,103+y),
          (137,120+y),(86,121+y)],"#78908b",thickness=3)
        d.line([(83,95+y),(122,94+y)],fill="#c1c8aa",width=3)
        d.rectangle((98,58+y,129,69+y),fill="#172a2d",outline="#aabeb6",width=3)
        d.rectangle((102,61+y,124,64+y),fill="#b9d4cf")
        for k in range(6):
            x=85+10*k
            d.rectangle((x,116+y,x+7,130+y),fill="#293b3d")
            d.line([(x,118+y),(x+6,119+y)],fill="#b1b3a0",width=2)
        # Heavy welded ceramic/steel armor has individual worn highlights,
        # rather than a flat teal rectangle: subdued warm rivets and patina.
        for j in range(28):
            x=89+(j*17)%45
            yy=97+(j*11)%22+y
            shade=(83+j*2,106+j,102+j//2,255)
            d.line([(x,yy),(x+3+j%3,yy-1)],fill=shade,width=1)
            if j%4==0:
                d.point((x+1,yy+2),fill=(209-j,188-j//2,143+j//3,255))
    elif base=="grenadier":
        # Readable canvas bandolier, linked grenades and high strapped satchel.
        _polygon(d,[(78,84+y),(96,81+y),(132,130+y),
          (123,135+y)],"#534c38")
        d.line([(80,86+y),(132,134+y)],fill="#d6c28e",width=4)
        for k in range(5):
            x=84+k*8;yy=87+k*9+y
            d.ellipse((x-5,yy-3,x+7,yy+10),
              fill="#394c39",outline="#172c2b",width=2)
            d.rectangle((x-1,yy-5,x+2,yy),fill="#c9b687")
            d.line([(x-2,yy+2),(x+4,yy+2)],fill="#879878",width=2)
        _polygon(d,[(58,98+y),(76,94+y),(81,125+y),
           (58,136+y),(48,122+y)],"#675d43")
        d.line([(55,100+y),(75,98+y)],fill="#d5c08b",width=3)
    elif base=="assault":
        # Sloped shoulder plates and clear goggle band.
        _polygon(d,[(74,82+y),(95,79+y),(102,94+y),
          (84,104+y),(70,97+y)],"#304c3c")
        d.line([(72,85+y),(91,83+y)],fill="#c1bd8f",width=3)
        _polygon(d,[(122,84+y),(143,89+y),(148,106+y),
          (129,109+y)],"#324c40")
        d.line([(127,87+y),(141,94+y)],fill="#bbca9b",width=3)
        d.rectangle((101,60+y,131,67+y),
            fill="#223432",outline="#abbda2",width=2)
        d.rectangle((105,62+y,125,64+y),fill="#b7c5ab")
        d.line([(100,70+y),(124,71+y)],fill="#483f32",width=3)
    else:
        # Rifleman lighter coat, exposed collar and contrasting wool wrap.
        _polygon(d,[(84,86+y),(105,84+y),(129,103+y),
          (115,119+y),(93,119+y)],"#82745a")
        d.line([(88,89+y),(102,105+y),(96,119+y)],fill="#cfbb8e",width=3)
        d.line([(105,91+y),(121,103+y)],fill="#423d30",width=3)
        d.polygon([(97,79+y),(111,85+y),(126,81+y),
           (120,93+y),(102,98+y)],fill="#bd6f4c")
        d.line([(104,82+y),(120,86+y)],fill="#e9a471",width=2)
    if kind==base and n<8:
        _articulate(im,n,y,base)
