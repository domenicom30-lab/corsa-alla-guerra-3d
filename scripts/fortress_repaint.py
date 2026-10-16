"""Fortress background painting pass. Original high-contrast industrial military pixel art.

The far pass paints a restrained sky, distinct architecture and hill silhouette.
The near pass leaves the sky transparent and paints structural depth, not flat noise.
Both are static 1400x540 RGBA paintings rendered offline into the real game.
"""
from PIL import ImageDraw
import random

def paint_fortress_scene(im,layer):
    d=ImageDraw.Draw(im,'RGBA')
    W,H=im.size
    rng=random.Random(42173+(110 if layer=='near' else 0))
    def block(x,y,w,h,color,outline=None,stroke=2):
        d.rectangle((x,y,x+w,y+h),fill=color,outline=outline,width=stroke)
    def trace(points,color,width=2):
        d.line(points,fill=color,width=width,joint='curve')
    def poly(points,color):
        d.polygon(points,fill=color)

    if layer=='far':
        # The huge pale disc in the previous fortress sky was a genuine 175px
        # painted shape scaled 1.8x in landscape. No moon/lens discs here.
        for y in range(H):
            f=y/(H-1)
            r=int(18+f*54);g=int(27+f*55);b=int(39+f*50)
            d.line([(0,y),(W,y)],fill=(r,g,b,255),width=1)
        # Overcast slate cloud strata, behind the buildings (no large circles).
        for i in range(26):
            y=92+i*6
            x=rng.randrange(-130,W)
            length=40+rng.randrange(70,290)
            shade=('#68716e','#56625f','#829089')[i%3]
            trace([(x,y),(x+length*.42,y-2),(x+length,y+1)],shade,1)
        # Distant ridgeline: three planes with controlled shifts of luminance.
        for i,(height,color) in enumerate([(340,'#465756'),(381,'#374a49'),(432,'#283a3b')]):
            points=[(0,H)]
            for j in range(-1,19):
                x=j*85
                yy=height-rng.randrange(3,34)
                points.extend([(x,yy),(x+38,yy-rng.randrange(6,28))])
            points.extend([(W,H)])
            poly(points,color)
        # Bunkers along the skyline, each recognisably a military structure.
        for i in range(8):
            x=40+i*190+(i%3)*22
            roof=214+(i%3)*35
            poly([(x-16,480),(x,roof+15),(x+20,roof),(x+145,roof+9),
                  (x+174,roof+28),(x+177,H),(x-16,H)],'#344242')
            block(x+10,roof+11,141,9,'#63736b')
            block(x+12,roof+23,139,13,'#2a3b3c')
            for j in range(6):
                xx=x+14+j*25
                block(xx,roof-10,14,18,'#455657')
                block(xx+2,roof-8,7,3,'#a19f86')
            for j in range(4):
                block(x+25+j*30,roof+80,17,31,'#192d32')
                block(x+26+j*30,roof+82,14,3,'#89988c')
            # Long artillery shadow with a high-readability muzzle.
            if i%3==1:
                trace([(x+111,roof+44),(x+179,roof+32)],'#1c3033',12)
                trace([(x+113,roof+42),(x+172,roof+31)],'#8a9585',3)
        # Power pylons and phone lines remain behind the combat silhouette.
        for i in range(5):
            x=140+i*310
            trace([(x,427),(x+16,151),(x+33,427)],'#23373a',6)
            trace([(x-50,201),(x+82,201)],'#859084',3)
            trace([(x-32,216),(x+65,216)],'#455957',5)
            for j in range(3):
                xx=x-24+j*36
                block(xx,199,5,14,'#b1a58e')
                trace([(xx+3,213),(xx+100,225)],'#324748',2)
        # Distinct backlit embrasures reinforce scale, without bright round flares.
        for i in range(11):
            x=79+i*125
            y=377+(i%3)*19
            block(x,y,38,7,'#16282a')
            block(x+4,y+2,29,1,'#b99e74')
        return

    # This near layer is intentionally transparent in the sky.
    d.rectangle((0,0,W,H),fill=(0,0,0,0))
    # Raking 3/4 perspective: wall body, top coping, recess, base cast shadow.
    poly([(0,359),(99,327),(403,341),(580,321),(817,349),(1100,325),
          (1400,352),(1400,H),(0,H)],(53,67,64,255))
    poly([(0,352),(100,317),(404,331),(580,311),(818,338),(1100,314),
          (1400,342),(1400,355),(1100,329),(817,354),(580,337),
          (400,350),(100,336),(0,370)],(156,161,133,255))
    block(0,506,W,34,(31,43,42,255))
    block(0,494,W,10,(86,103,94,255))
    # Four articulated bastions instead of one endless homogeneous wall.
    for i in range(5):
        x=i*312-84
        h=(179,206,164,193,173)[i]
        roof=H-h
        # Shadow, concrete face, sunlit bevel.
        block(x+4,roof,271,h,(34,48,48,255))
        poly([(x+9,roof+16),(x+45,roof-17),(x+239,roof-12),
              (x+269,roof+16),(x+262,H),(x+8,H)],(92,108,100,255))
        poly([(x+17,roof+16),(x+47,roof-7),(x+239,roof-5),
              (x+258,roof+17),(x+244,roof+29),(x+29,roof+29)],
             (160,165,136,255))
        block(x+31,roof+32,213,20,(46,62,60,255))
        block(x+28,roof+50,217,7,(144,150,126,255))
        for j in range(10):
            sx=x+40+j*22
            block(sx,roof+63,16,6,(20,37,39,255))
            block(sx+1,roof+65,12,2,(113,130,119,255))
        # A distinct wide recessed gate every other module.
        if i%2==0:
            poly([(x+71,H),(x+71,roof+91),(x+81,roof+70),
                  (x+183,roof+70),(x+198,roof+93),(x+198,H)],(17,31,33,255))
            block(x+89,roof+89,100,H-roof-89,(40,58,56,255))
            for j in range(6):
                sy=roof+102+j*26
                block(x+92,sy,93,4,(107,119,108,255))
                block(x+93,sy+4,3,18,(163,158,125,255))
            for col in (111,171):
                for j in range(6):
                    block(x+col,roof+104+j*26,4,3,(216,188,139,255))
            block(x+98,roof+76,83,6,(175,165,124,255))
            block(x+135,roof+80,14,15,(25,39,39,255))
        else:
            # Half-ruined pillbox plus detailed metal embrasure.
            block(x+65,roof+83,138,69,(27,43,45,255))
            block(x+73,roof+90,123,12,(126,143,131,255))
            block(x+86,roof+105,97,19,(12,26,31,255))
            block(x+87,roof+109,80,3,(217,187,133,255))
            block(x+91,roof+137,107,8,(126,136,118,255))
            for j in range(11):
                sx=x+79+j*12
                block(sx,roof+151,6,15,(37,50,47,255))
        # Soldier-sized support ladder and steel braces.
        for j in range(6):
            sy=roof+62+j*31
            if sy>H-10:break
            trace([(x+237,sy),(x+256,sy+5)],'#242f30',3)
        for j in range(7):
            sx=x+12+j*37
            sy=roof+35+((j+i)%4)*25
            if sy>H-30:continue
            block(sx,sy,8,3,(216,193,147,255))
            block(sx+2,sy+3,5,2,(23,40,39,255))
        # Bricks chip away into dark, angular fissures.
        for j in range(140):
            sx=x+rng.randrange(19,248)
            sy=rng.randrange(roof+56,H-18)
            color=(18,35,35,255) if j%4 else (184,166,130,255)
            trace([(sx,sy),(sx+rng.randrange(2,12),sy+rng.randrange(-2,3))],
                  color,1 if j%3 else 2)
        # Hazard warnings: small but unambiguous diagonal strips.
        for j in range(6):
            sx=x+52+j*30
            if sx<0 or sx>W:continue
            poly([(sx,H-38),(sx+11,H-38),(sx+3,H-27),(sx-8,H-27)],
                 (198,145,72,255))
    # Debris sits BELOW the playable foot plane; silhouettes remain unobstructed.
    for i in range(28):
        x=i*55+rng.randrange(-8,19)
        y=H-26+(i%4)*5
        poly([(x,y),(x+8,y-8),(x+25,y-3),(x+32,y+5)],
             ((74,86,75,255) if i%2 else (148,128,91,255)))
        trace([(x+3,y),(x+28,y+3)],'#273737',2)
