"""Four extra original, hand-authored 480x320 battlefield landmarks.

All layers are prerendered into transparent PNGs during the asset build.
The detail density is built around a compact side-scrolling viewport, not 3D.
"""
from PIL import ImageDraw
import math
import random


def draw_landmark(im,name):
    d=ImageDraw.Draw(im,"RGBA")
    rng=random.Random(33017+sum(ord(c)*17 for c in name))
    def polygon(points,color,edge=(19,31,30,255),stroke=3):
        d.polygon(points,fill=color)
        if edge:
            d.line(points+[points[0]],fill=edge,width=stroke,joint="curve")
    def box(coords,color,outline=None,width=2):
        d.rectangle(coords,fill=color,outline=outline,width=width)
    def line(pts,color,width=4):
        d.line(pts,fill=color,width=width,joint="curve")
    def disc(area,color,outline=None,width=3):
        d.ellipse(area,fill=color,outline=outline,width=width)
    # Every landmark has ground contact shadow but no opaque sky backdrop.
    disc((17,286,467,318),(13,22,20,112),None)
    if name=="forestWreck":
        # Airframe wreck, bent gull-wing ribs and dark forest scrub.
        for x in range(38,462,25):
            stem=244+(x%4)*8
            box((x,stem,x+6,298),(38,51,40,255))
            for k in range(4):
                disc((x-15+k*6,stem-13-k%2*8,x+18+k*3,stem+5+k%2*6),
                     (60+k*8,80+k*5,50+k*4,245),None)
        polygon([(72,248),(109,215),(250,205),(387,229),(441,264),(429,291),(89,294)],
                (58,77,65,255))
        polygon([(82,247),(147,228),(285,216),(381,247),(405,266),(128,268)],
                (126,142,109,255),None)
        polygon([(161,218),(192,142),(218,139),(222,220)],(40,58,56,255))
        polygon([(192,143),(227,149),(254,206),(215,203)],(115,130,110,255))
        # Detached sweeping wing section, outlined and ribbed.
        polygon([(38,174),(162,145),(372,180),(416,219),(400,235),(153,202)],
                (45,63,60,255))
        polygon([(50,177),(171,154),(358,184),(389,205),(146,191)],
                (147,155,123,255),None)
        for k in range(12):
            x=77+k*26
            line([(x,164+(k%3)*3),(x-10,194+(k%3)*4)],(47,66,60,255),4)
            box((x-7,182,x-3,187),(212,196,141,250),None)
        # Torn fuselage, fractured windshield and soot-rimmed engine.
        polygon([(172,212),(223,181),(309,192),(340,226),(303,261),(202,253)],
                (68,91,79,255))
        polygon([(224,185),(246,166),(273,165),(288,202),(238,207)],
                (27,46,48,255))
        polygon([(232,187),(246,173),(267,173),(277,192)],(126,173,163,255),None)
        line([(254,176),(271,190)],(221,241,206,255),3)
        disc((300,190,353,244),(26,36,36,255),(171,171,136,255),6)
        disc((317,206,338,225),(89,107,97,255),(23,38,37,255),4)
        line([(326,198),(330,233)],(24,36,36,255),6)
        # Individual patches of camouflage and battle scratches.
        for k in range(85):
            x=rng.randrange(114,397);y=rng.randrange(170,259)
            col=(32,57,48,130) if k%3 else (199,181,131,140)
            line([(x,y),(x+rng.randint(3,12),y+rng.randint(-3,2))],col,2)
        for x,y in [(98,269),(154,252),(336,263),(388,275)]:
            polygon([(x,y),(x+22,y-17),(x+31,y-4),(x+17,y+8)],
                    (92,91,68,255),None)
        for k in range(13):
            x=63+k*29
            box((x,290,x+11,300),(59,67,48,245))
    elif name=="villageBarricade":
        # Collapsed masonry, tram chassis, sloping turret shell.
        polygon([(51,293),(57,138),(85,97),(166,93),(184,163),(234,183),(226,299)],
                (136,102,77,255))
        polygon([(67,147),(92,108),(160,107),(170,169),(141,182),(79,188)],
                (176,142,107,255),None)
        polygon([(64,140),(93,98),(173,98),(189,150),(155,132),(83,139)],
                (57,55,51,255))
        for y in range(152,296,17):
            for x in range(65,215,28):
                line([(x,y),(x+21,y)],(71,55,46,210),2)
                line([(x+(y//17)%2*11,y),(x+(y//17)%2*11,y+13)],(73,55,47,165),2)
        for x in (97,166):
            box((x,180,x+43,238),(30,39,39,255),(76,65,53,255),5)
            line([(x+21,182),(x+21,234)],(137,117,91,255),3)
        # Hand-painted mobile barricade and crushed armored scout truck.
        polygon([(106,245),(154,216),(351,210),(406,236),(434,277),(422,303),(93,301)],
                (48,61,59,255))
        polygon([(114,249),(165,224),(338,220),(402,248),(412,280),(110,280)],
                (93,116,101,255),None)
        polygon([(180,222),(219,177),(310,175),(348,221)],(47,65,64,255))
        polygon([(207,203),(223,185),(260,184),(268,204)],(139,164,155,255),None)
        polygon([(276,185),(305,185),(322,203),(279,202)],(117,154,149,255),None)
        polygon([(149,230),(179,211),(209,213),(183,245)],(149,167,130,255),None)
        for x in (155,359):
            disc((x-39,249,x+39,319),(22,29,29,255),(8,15,16,255),6)
            disc((x-26,261,x+26,304),(118,129,113,255),(41,52,49,255),5)
            disc((x-10,274,x+10,294),(34,46,44,255),None)
            for k in range(8):
                a=k*math.pi/4
                cx=x+math.cos(a)*18;cy=283+math.sin(a)*16
                disc((cx-3,cy-3,cx+3,cy+3),(207,191,148,255),None)
        box((162,251,334,267),(35,48,47,255),(169,165,125,255),4)
        for k in range(10):
            x=173+k*15
            line([(x,253),(x+3,264)],(197,181,131,255),2)
        # Rubble foreground, wire and bent sign.
        polygon([(28,296),(64,261),(99,273),(117,303)],(102,90,73,255))
        polygon([(406,296),(429,258),(456,283),(476,306)],(104,83,66,255))
        for x in range(72,471,35):
            line([(x,298),(x+14,290)],(162,136,99,235),3)
    elif name=="industrialConverter":
        # Steel plant power converter: large porcelain cores, cables and gauge.
        box((62,283,446,309),(37,45,45,255),(21,28,29,255),6)
        for x in (74,398):
            box((x,46,x+37,283),(69,81,79,255),(27,37,37,255),5)
            for y in range(62,260,20):
                box((x+5,y,x+31,y+5),(153,155,125,255),None)
        box((103,135,402,279),(56,72,75,255),(22,35,36,255),6)
        polygon([(111,140),(134,103),(371,103),(398,139)],(112,128,124,255))
        polygon([(126,143),(144,116),(347,116),(371,145)],(177,179,148,255),None)
        for x in (147,244,332):
            # Porcelain winding towers, three independently illustrated stacks.
            box((x-22,75,x+27,140),(38,49,51,255),(17,29,32,255),3)
            for k in range(6):
                y=76+k*10
                disc((x-27,y,x+33,y+14),
                     (176-k*9,171-k*6,133-k*6,255),(35,44,43,255),3)
                line([(x-14,y+3),(x+24,y+3)],(213,208,167,210),2)
            box((x-5,46,x+10,78),(75,88,85,255),(35,44,43,255),3)
        for x in range(120,394,27):
            box((x,171,x+13,270),(34,48,50,255),(21,30,32,255),3)
            for y in range(178,266,17):
                line([(x+2,y),(x+9,y)],(143,167,152,235),2)
        # Brass framed control station with valves and six pressure lamps.
        box((150,166,356,242),(36,50,53,255),(196,181,138,255),6)
        box((160,177,347,224),(72,94,91,255),(24,39,40,255),4)
        for k in range(6):
            x=172+k*29
            disc((x,185,x+17,202),(29,44,46,255),(201,188,148,255),3)
            disc((x+5,189,x+11,196),(192,124+k*9,84,255),None)
            line([(x+10,194),(x+14,190)],(18,31,33,255),2)
        line([(113,72),(131,28),(249,28),(275,58)],(51,69,68,255),15)
        line([(113,72),(131,28),(249,28),(275,58)],(153,167,144,255),5)
        for k in range(15):
            x=97+k*22
            box((x,274,x+17,283),(114,129,119,255),(33,46,45,255),2)
            box((x+4,287,x+8,292),(212,188,133,255),None)
        for k in range(120):
            x=rng.randrange(104,403);y=rng.randrange(132,279)
            line([(x,y),(x+rng.randint(2,7),y)],(18,35,34,150) if k%3 else (211,188,140,125),2)
    elif name=="fortressHowitzer":
        # Angled armored artillery casemate, paired cannon with independent ribs.
        polygon([(31,298),(55,170),(105,141),(383,140),(437,176),(454,300)],
                (65,77,77,255))
        polygon([(53,180),(102,150),(378,152),(427,184),(408,204),(63,203)],
                (127,139,132,255),None)
        box((62,208,425,290),(41,58,57,255),(19,29,30,255),6)
        for k in range(13):
            x=71+k*26
            box((x,208,x+13,284),(75,94,89,255),(29,44,44,255),3)
            line([(x+4,213),(x+6,276)],(174,173,141,230),3)
        polygon([(80,148),(126,88),(347,84),(391,153),(358,194),(112,196)],
                (48,66,65,255))
        polygon([(125,99),(329,96),(365,141),(130,141)],(155,168,148,255),None)
        polygon([(122,143),(353,145),(348,171),(129,171)],(85,104,94,255),None)
        # Two visible cannon muzzles, full shaded steel cooling jackets.
        for y in (111,158):
            polygon([(267,y-9),(423,y-22),(460,y-18),(461,y+4),(420,y+10),(268,y+10)],
                    (27,43,45,255))
            polygon([(280,y-7),(421,y-18),(452,y-14),(449,y-9),(288,y+1)],
                    (157,171,156,255),None)
            box((448,y-19,470,y+6),(31,46,47,255),(171,171,149,255),5)
            box((455,y-13,474,y),(15,30,34,255),None)
            for k in range(15):
                x=292+k*10
                line([(x,y-6),(x+1,y+5)],(39,61,61,255),3)
        # Gun shield rim, recoil hydraulics and open inspection slot.
        disc((127,103,297,213),(44,65,67,255),(169,174,143,255),8)
        disc((153,121,270,189),(23,42,45,255),(109,129,121,255),6)
        box((193,133,261,175),(33,48,51,255),(10,28,30,255),5)
        for x in (169,237):
            line([(x,185),(x+12,214)],(178,159,121,255),8)
        for k in range(24):
            x=88+k*12
            y=218+(k%3)*8
            disc((x,y,x+4,y+4),(224,209,162,255),None)
        # Upper warning beacon and protected range optic.
        box((133,69,156,93),(35,46,48,255),(172,173,140,255),4)
        disc((135,54,155,77),(206,111,66,255),(35,45,46,255),4)
        box((216,77,255,93),(26,42,43,255),(170,168,143,255),4)
        box((235,70,245,81),(156,176,153,255),None)
        for k in range(70):
            x=rng.randrange(66,412);y=rng.randrange(182,290)
            line([(x,y),(x+rng.randint(2,7),y+rng.randint(-3,2))],
                 (23,43,41,160) if k%2 else (211,201,160,130),2)
    else:
        raise ValueError("Unknown original secondary battlefield landmark: "+name)
