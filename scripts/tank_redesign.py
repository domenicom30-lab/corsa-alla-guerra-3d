"""Original hand-illustrated tank surfaces baked into the six-frame 2D PNG atlas.

The vehicle drawing is independent of the separately articulated soldier work.
No runtime procedural tank geometry; no third-party copyrighted artwork.
"""
from PIL import ImageDraw
import math

def paint_tank_signature(im,n):
    """Hard-edged dynamic belly, view slit, turret weld and field gear."""
    d=ImageDraw.Draw(im,"RGBA")
    def poly(v,c,edge=None):
        d.polygon(v,fill=c)
        if edge:d.line(v+[v[0]],fill=edge,width=3)
    def line(v,c,w=3):d.line(v,fill=c,width=w,joint="curve")
    # Standoff skirt slats follow track length and create metal silhouette.
    for i in range(13):
        x=48+i*23
        c="#344a42" if i%3 else "#546c5c"
        poly([(x,158),(x+19,160),(x+17,175),(x-2,173)],c,"#1a2b28")
        line([(x+2,160),(x+15,161)],"#cfceab",2)
        d.rectangle((x+9,167,x+11,170),fill="#d0bc89")
    # Dark outer wheel arcs and separate center bolts for visible track motion.
    for k in range(7):
        x=72+k*42
        d.arc((x-18,174,x+18,216),195,345,fill="#d1d4b2",width=3)
        d.arc((x-14,176,x+14,213),20,150,fill="#192d2b",width=2)
        for spoke in range(6):
            a=spoke*math.pi/3+n*math.pi/7
            x2=x+math.cos(a)*12
            y2=195+math.sin(a)*12
            d.ellipse((x2-1.5,y2-1.5,x2+1.5,y2+1.5),fill="#b8b998")
    # Zig-zag sloped applique armor with new physically layered highlights.
    poly([(67,125),(107,108),(153,114),(167,133),
          (147,153),(90,152)],"#6b886e","#21352f")
    line([(69,127),(105,114),(148,117)],"#c8d1a4",3)
    for i in range(6):
        x=81+i*15
        d.rectangle((x,141,x+4,145),fill="#283d35")
        d.rectangle((x+1,139,x+3,140),fill="#e9cf98")
    # Thick turret side and mechanically credible raised optic.
    poly([(144,92),(176,83),(251,86),(277,101),
          (267,120),(157,117)],"#536e5e","#182e2b")
    poly([(151,95),(179,88),(248,91),(261,99),
          (172,100)],"#d0d0a5",None)
    for i in range(7):
        x=170+i*13
        d.rectangle((x,107,x+8,111),fill="#2b4540")
        line([(x+2,109),(x+7,108)],"#a6bba6",2)
    d.rectangle((197,46,221,57),fill="#1b2f2c",outline="#d0cba9",width=3)
    d.rectangle((201,48,210,53),fill="#96b8b0")
    d.rectangle((212,48,217,53),fill="#d0bc8b")
    # A unique emblem and diagonal warning stripes on front tow lug.
    poly([(285,136),(309,137),(305,155),(283,154)],"#283d35","#a7b394")
    line([(291,140),(301,150)],"#e3b15e",3)
    line([(301,140),(309,149)],"#e3b15e",3)
    line([(295,144),(310,144)],"#172b29",2)
    for i in range(4):
        yy=151+i*4
        d.rectangle((48,yy,60,yy+2),fill="#ded2a6" if i%2 else "#292f2a")
    # Subtle brown stowage and shovel with identifiable handle.
    poly([(67,97),(82,87),(125,91),(131,112),(119,122),(76,119)],
         "#5d5942","#29372e")
    line([(69,99),(122,102)],"#c3b28c",3)
    line([(71,117),(122,118)],"#302e24",3)
    d.ellipse((76,100,92,114),fill="#847555",outline="#d0bd87",width=2)
    line([(95,91),(114,117)],"#3b3025",4)
    line([(94,90),(101,82)],"#c4a67d",3)
