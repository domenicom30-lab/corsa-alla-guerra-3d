"""Original six-frame armor damage overlays for the boss tank.

Three actual shipped sprite sheets share mechanical silhouette but use
independently authored readable condition states, not runtime CSS filters.
"""
from PIL import ImageDraw
import random

def paint_boss_damage(im,kind,n):
    severity={"commander":0,"commanderDamaged":1,"commanderCritical":2}.get(kind,0)
    if severity==0:return
    d=ImageDraw.Draw(im,"RGBA")
    rng=random.Random(9951+severity*503+n*41)
    # Steel plates are visibly torn apart; individual layers break silhouette.
    d.polygon([(67,147),(103,139),(126,144),(111,159),(76,163)],
              fill=(36,46,41,250))
    d.line([(71,149),(118,145)],fill=(210,169,112,235),width=3)
    d.polygon([(113,114),(140,105),(177,112),(164,126),(131,133)],
              fill=(29,40,40,245))
    d.line([(119,116),(168,113)],fill=(171,165,128,245),width=3)
    for k in range(19+severity*17):
        x=rng.randrange(60,274);y=rng.randrange(118,188)
        size=rng.randrange(4,11+severity*3)
        d.line([(x,y),(x+size,y-2)],fill=(20,33,34,235),width=3)
        if k%3==0:
            d.line([(x+1,y+1),(x+size-1,y)],fill=(198,148,95,220),width=1)
    # Broken treads and pale metal flakes are animated with the chassis.
    for k in range(8+severity*4):
        x=26+k*23+(n%3)*2
        d.rectangle((x,181+(k%3),x+11,185+(k%3)),
                    fill=(22,28,29,250))
        if k%2==0:
            d.line([(x+2,184),(x+8,186)],fill=(179,158,116,245),width=2)
    # Smoke plume grows with mechanical damage.
    for k in range(4+severity*5):
        x=147+k*11-(n%3)*5
        y=75-k*(4+severity)
        radius=6+k%3*4+severity*2
        if y-radius<1:continue
        d.ellipse((x-radius,y-radius,x+radius,y+radius),
                  fill=(50+severity*12,52+severity*9,49+severity*6,
                        max(50,155-k*8)))
    if severity==2:
        # Fire leaking from left engine, glowing exposed copper, missing panel.
        d.polygon([(178,116),(192,91),(214,109),(224,90),
                   (229,123),(202,139)],
                  fill=(35,39,36,245))
        d.line([(181,116),(216,108)],fill=(214,176,115,255),width=5)
        d.line([(185,124),(213,120)],fill=(222,141,75,255),width=3)
        for j in range(5):
            x=173+j*12+n%3*3
            top=67-j*8-(n%3)*6
            d.polygon([(x,119),(x-7,103),(x-4,top+12),(x+5,top),(x+12,107)],
                      fill=(226,100+j*18,39,230))
            d.line([(x,113),(x+3,top+17)],fill=(255,216,102,230),width=3)
        d.ellipse((129,93,157,112),fill=(20,31,34,255))
        d.arc((127,91,162,113),190,355,fill=(214,201,151,240),width=4)
        for j in range(12):
            x=104+(j*19)%128;y=151+(j*11)%35
            d.line([(x,y),(x+8,y-4)],fill=(245,191,120,220),width=2)
