"""Original eight-key airborne character details, rendered into PNG only."""
from PIL import ImageDraw
import math

FLIGHT_HEIGHT=(-5,-11,-22,-29,-30,-21,-11,-3)
FLIGHT_LEGS=(-3,-14,-17,-8,8,18,12,0)
FLIGHT_ARMS=(3,-2,-5,-3,2,8,10,4)

def draw_airborne_finishing(im,pose,n):
    """Independently articulate boots, jacket, scarf, and firing recoil in the air."""
    i=n%8
    d=ImageDraw.Draw(im,"RGBA")
    offset=FLIGHT_HEIGHT[i]
    leg=FLIGHT_LEGS[i]
    # Deeply shaded trousers and boots in different airborne keys.
    for side,bx in [(-1,58-leg),(1,131+leg)]:
        knee_y=149+offset+(i%3)*2
        d.line([(bx+10,knee_y),(bx+19+side*(i%4),knee_y+18)],
               fill=(29,44,34,245),width=4)
        d.line([(bx+9,knee_y+3),(bx+13,knee_y+9)],
               fill=(181,195,142,200),width=2)
        d.line([(bx+7,187+offset),(bx+31,185+offset)],
               fill=(225,198,134,225),width=2)
        d.line([(bx+7,190+offset),(bx+31,190+offset)],
               fill=(21,31,29,255),width=4)
    # Jacket folds follow the character's changing lean.
    cloth=(4,7,2,-5,-9,-4,6,3)[i]
    d.polygon([(80,131+offset),(120,131+offset),
               (119+cloth,146+offset),(92+cloth,149+offset)],
              fill=(58,78,57,220))
    d.line([(93+cloth,143+offset),(109+cloth,146+offset)],
           fill=(202,207,149,190),width=2)
    # Upward reflected light on helmet during flight.
    d.arc((86,37+offset,132,69+offset),188,327,
          fill=(205,206,151,225),width=2)
    # Bullet recoil is visible in the actual airborne atlas, not only HUD flash.
    if pose=="jumpFire":
        recoil=(0,5,10,6,2,9,4,0)[i]
        y=85+offset+FLIGHT_ARMS[i]
        d.line([(146-recoil,y),(198-recoil,y-2)],
               fill=(224,225,187,230),width=2)
        d.rectangle((187-recoil,y-3,202-recoil,y+4),
                    fill=(29,40,36,230))
        d.rectangle((195-recoil,y-1,205-recoil,y+1),
                    fill=(174,181,154,255))
        if i in (0,2,4,6):
            x=209-recoil
            d.polygon([(x,y-8),(x+19,y-12),(x+14,y),
                       (x+27,y+3),(x+5,y+9)],
                      fill=(255,176,64,245))
            d.ellipse((x+2,y-4,x+10,y+4),fill=(255,246,189,250))
            for j in range(3):
                d.line([(x+15+j*6,y-j*3),(x+20+j*6,y-j*4)],
                       fill=(246,217,151,245),width=2)
