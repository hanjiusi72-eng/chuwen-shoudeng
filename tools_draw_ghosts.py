"""按设计稿画风生成瘟神立绘(wenshen.png)与小疫鬼(ghost.png)。扁平几何 + 细金描边 + 三角纹/格纹/网点。"""
import math
from PIL import Image, ImageDraw, ImageChops

OUT = '/Users/xiaohan/.zcode/workspace/default/chuwen-shoudeng/assets/'
GOLD = (246, 194, 28, 255)
VIO_D, VIO_M, VIO_L = (58, 18, 96, 255), (92, 38, 150, 255), (128, 70, 196, 255)
MINT, MINT_D = (168, 238, 196, 255), (110, 205, 160, 255)
LIME, MAG, PINK = (150, 226, 70, 255), (255, 0, 200, 255), (255, 156, 212, 255)
YEL, RED, INK, WHITE = (255, 230, 42, 255), (232, 32, 42, 255), (34, 8, 44, 255), (255, 255, 255, 255)
CYAN = (42, 212, 240, 255)


def bez(p0, p1, p2, p3, n=40):
    out = []
    for i in range(n + 1):
        t = i / n; u = 1 - t
        out.append((u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
                    u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1]))
    return out


class Canvas:
    def __init__(self, w, h, ss=3):
        self.ss, self.w, self.h = ss, w, h
        self.im = Image.new('RGBA', (w * ss, h * ss), (0, 0, 0, 0))

    def P(self, pts):
        return [(x * self.ss, y * self.ss) for x, y in pts]

    def mask(self, kind, data):
        m = Image.new('L', self.im.size, 0); d = ImageDraw.Draw(m)
        if kind == 'poly': d.polygon(self.P(data), fill=255)
        elif kind == 'ellipse':
            x0, y0, x1, y1 = data; d.ellipse([x0 * self.ss, y0 * self.ss, x1 * self.ss, y1 * self.ss], fill=255)
        elif kind == 'rrect':
            x0, y0, x1, y1, r = data; d.rounded_rectangle([x0 * self.ss, y0 * self.ss, x1 * self.ss, y1 * self.ss], r * self.ss, fill=255)
        return m

    def fill(self, m, color):
        layer = Image.new('RGBA', self.im.size, color); self.im.paste(layer, (0, 0), m)

    def pattern(self, m, draw_fn):
        layer = Image.new('RGBA', self.im.size, (0, 0, 0, 0)); draw_fn(ImageDraw.Draw(layer), self.ss)
        a = ImageChops.multiply(layer.getchannel('A'), m); self.im.paste(layer, (0, 0), a)

    def outline(self, m, color, width):
        # 用膨胀差得到描边，保证所有形状描边一致
        from PIL import ImageFilter
        k = max(3, int(width * self.ss) | 1)
        grown = m.filter(ImageFilter.MaxFilter(k))
        ring = ImageChops.subtract(grown, m)
        self.fill(ring, color)

    def shape(self, kind, data, color, line=GOLD, lw=2.2):
        m = self.mask(kind, data); self.fill(m, color)
        if line: self.outline(m, line, lw)
        return m

    def save(self, name, size=None):
        out = self.im.resize((self.w, self.h), Image.LANCZOS)
        if size: out = out.resize(size, Image.LANCZOS)
        out = out.crop(out.getbbox()); out.save(OUT + name, optimize=True); print(name, out.size)


def tri_pattern(c1, c2, step):
    def f(d, ss):
        s = step * ss
        for j in range(0, 4000, s):
            for i in range(-s, 4000, s):
                off = (j // s % 2) * s // 2
                x = i + off
                d.polygon([(x, j + s), (x + s / 2, j), (x + s, j + s)], fill=c1)
                d.polygon([(x + s / 2, j), (x + s, j + s), (x + 1.5 * s, j)], fill=c2)
    return f


def dot_pattern(color, step, r):
    def f(d, ss):
        s, rr = step * ss, r * ss
        for j in range(0, 5000, s):
            for i in range(0, 5000, s):
                x = i + (j // s % 2) * s / 2
                d.ellipse([x - rr, j - rr, x + rr, j + rr], fill=color)
    return f


def checker(c1, c2, step):
    def f(d, ss):
        s = step * ss
        for j in range(0, 5000, s):
            for i in range(0, 5000, s):
                d.rectangle([i, j, i + s, j + s], fill=c1 if (i // s + j // s) % 2 else c2)
    return f


# ---------------------------------------------------------------- 瘟神立绘
def body_poly(dx=0, dy=0):
    # 钥匙孔轮廓：圆肩大袖 + 直身下摆（与设计稿人物一致，底部出画）
    pts = []
    cx, cy, r = 470 + dx, 660 + dy, 300
    a0, a1 = math.radians(118), math.radians(422)
    for i in range(80):
        a = a0 + (a1 - a0) * i / 79
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    pts = [(300 + dx, 1500 + dy)] + [p for p in pts] + [(640 + dx, 1500 + dy)]
    return pts


def wenshen():
    c = Canvas(1000, 1500)
    # 网点影子（设计稿里的“分身”）
    sh = c.mask('poly', body_poly(150, -10))
    shh = c.mask('ellipse', (520, 40, 760, 420))
    from PIL import ImageChops as IC
    sm = IC.lighter(sh, shh)
    c.fill(sm, VIO_M)
    c.pattern(sm, dot_pattern(WHITE, 26, 8))

    # 头发火焰（脸后）
    flames = []
    for k in range(9):
        x = 345 + k * 33
        h = 120 + (40 if k % 2 else 0) + (30 if k in (3, 4, 5) else 0)
        flames.append([(x - 18, 260), (x + 2, 260 - h), (x + 26, 260)])
    for f in flames: c.shape('poly', f, MAG if flames.index(f) % 2 else VIO_L, GOLD, 1.6)
    # 犄角
    c.shape('poly', bez((395, 200), (330, 150), (300, 80), (330, 20)) + bez((330, 20), (355, 90), (390, 130), (430, 170)), LIME)
    c.shape('poly', bez((545, 200), (610, 150), (640, 80), (610, 20)) + bez((610, 20), (585, 90), (550, 130), (510, 170)), LIME)

    # 身体
    bm = c.shape('poly', body_poly(), VIO_D, GOLD, 2.4)
    c.pattern(bm, tri_pattern(VIO_D, (74, 28, 120, 255), 46))
    # 大袖格纹镶边（圆肩下缘的弧带）
    band = []
    cx, cy = 470, 660
    for i in range(60):
        a = math.radians(150 + 70 * i / 59); band.append((cx + 300 * math.cos(a), cy + 300 * math.sin(a)))
    for i in range(60):
        a = math.radians(220 - 70 * i / 59); band.append((cx + 250 * math.cos(a), cy + 250 * math.sin(a)))
    m = c.shape('poly', band, LIME, GOLD, 1.6); c.pattern(m, checker(LIME, (110, 40, 170, 255), 18))
    band2 = [(2 * cx - x, y) for x, y in band]
    m = c.shape('poly', band2, LIME, GOLD, 1.6); c.pattern(m, checker(LIME, (110, 40, 170, 255), 18))
    # 前襟：白领 + 品红格纹长带
    m = c.shape('poly', [(415, 420), (525, 420), (505, 1500), (435, 1500)], PINK, GOLD, 1.8)
    c.pattern(m, checker(PINK, MAG, 20))
    c.shape('poly', [(360, 380), (470, 560), (580, 380), (545, 380), (470, 500), (395, 380)], WHITE, GOLD, 1.6)
    c.shape('poly', [(380, 380), (470, 535), (560, 380), (548, 380), (470, 515), (392, 380)], LIME, None)
    # 腰带
    m = c.shape('rrect', (330, 905, 610, 960, 10), YEL, GOLD, 1.6); c.pattern(m, dot_pattern(VIO_M, 22, 6))

    # 脸
    face = [(395, 170), (545, 170), (545, 330)] + bez((545, 330), (545, 390), (500, 410), (470, 410)) + bez((470, 410), (440, 410), (395, 390), (395, 330))
    fm = c.shape('poly', face, MINT, GOLD, 2)
    for x in (403, 522):
        c.shape('poly', [(x, 300), (x + 16, 300), (x + 16, 312), (x, 312)], MAG, None)
        c.shape('poly', [(x, 322), (x + 16, 322), (x + 16, 334), (x, 334)], MAG, None)
    # 眼（黄瞳红仁竖缝）
    for ex in (433, 507):
        c.shape('ellipse', (ex - 30, 228, ex + 30, 278), YEL, INK, 1.6)
        c.shape('ellipse', (ex - 15, 238, ex + 15, 268), RED, None)
        c.shape('poly', [(ex - 3, 238), (ex + 3, 238), (ex + 3, 268), (ex - 3, 268)], INK, None)
        c.shape('ellipse', (ex - 11, 238, ex - 3, 246), WHITE, None)
    # 怒眉
    c.shape('poly', [(395, 205), (462, 222), (458, 236), (395, 222)], INK, None)
    c.shape('poly', [(545, 205), (478, 222), (482, 236), (545, 222)], INK, None)
    # 鼻
    c.shape('ellipse', (458, 290, 468, 300), MINT_D, None); c.shape('ellipse', (472, 290, 482, 300), MINT_D, None)
    # 嘴 + 獠牙
    c.shape('rrect', (418, 330, 522, 372, 14), INK, GOLD, 1.4)
    c.shape('rrect', (444, 350, 496, 372, 10), RED, None)
    for x in (424, 446, 476, 498):
        c.shape('poly', [(x, 330), (x + 18, 330), (x + 9, 352)], WHITE, None)
    for x in (434, 488):
        c.shape('poly', [(x, 372), (x + 18, 372), (x + 9, 350)], WHITE, None)
    # 顶髻
    c.shape('rrect', (448, 120, 492, 175, 18), INK, GOLD, 1.4)
    c.shape('rrect', (430, 160, 510, 182, 6), YEL, GOLD, 1.2)

    # 瘟扇（仿设计稿蒲扇造型，深紫扇面 + 青绿扇骨）
    c.shape('poly', [(612, 820), (628, 830), (548, 1010), (532, 1000)], (122, 58, 16, 255), GOLD, 1.2)
    fan_c, fan_r = (690, 700), 150
    fm = c.shape('ellipse', (fan_c[0] - fan_r, fan_c[1] - fan_r * 0.9, fan_c[0] + fan_r, fan_c[1] + fan_r * 0.9), LIME, GOLD, 2)
    inner = c.mask('ellipse', (fan_c[0] - fan_r + 16, fan_c[1] - fan_r * 0.9 + 16, fan_c[0] + fan_r - 16, fan_c[1] + fan_r * 0.9 - 16))
    c.fill(inner, VIO_M)
    def rays(d, ss):
        hx, hy = 622 * ss, 812 * ss
        for k in range(22):
            a = math.radians(-150 + k * 6.2)
            d.line([(hx, hy), (hx + 400 * ss * math.cos(a), hy + 400 * ss * math.sin(a))], fill=LIME, width=4 * ss)
    c.pattern(inner, rays)
    c.shape('ellipse', (606, 796, 638, 828), WHITE, GOLD, 1.2)
    # 手
    c.shape('rrect', (585, 860, 655, 905, 10), MINT, GOLD, 1.6)
    for y in (872, 884, 896): c.shape('poly', [(600, y), (650, y), (650, y + 2), (600, y + 2)], MINT_D, None)
    # 瘟气：团云 + 卷线（呼应设计稿里的云纹与药炉蒸汽）
    for (x, y, k) in [(835, 560, 1.0), (900, 455, 0.75), (800, 440, 0.6)]:
        blobs = [(x - 34 * k, y + 6 * k, 30 * k), (x, y - 14 * k, 38 * k), (x + 36 * k, y + 4 * k, 30 * k), (x + 4 * k, y + 22 * k, 28 * k)]
        from PIL import ImageChops as IC
        m = None
        for bx, by, r in blobs:
            mm = c.mask('ellipse', (bx - r, by - r, bx + r, by + r)); m = mm if m is None else IC.lighter(m, mm)
        c.fill(m, VIO_L); c.outline(m, GOLD, 1.6)
        sp = [(x + 2 * k * t * math.cos(t), y + 2 * k * t * math.sin(t)) for t in [i / 10 for i in range(8, 120)]]
        ImageDraw.Draw(c.im).line(c.P(sp), fill=MAG, width=int(5 * k * c.ss), joint='curve')
    c.save('wenshen.png', size=None)


# ---------------------------------------------------------------- 小疫鬼
def ghost():
    c = Canvas(200, 230, ss=4)
    body = bez((100, 30), (175, 30), (178, 120), (172, 175)) + [(160, 205), (148, 182), (136, 212), (122, 186), (110, 216), (98, 188), (86, 214), (74, 186), (62, 210), (50, 182), (38, 205), (28, 175)] + bez((28, 175), (22, 120), (25, 30), (100, 30))
    # 网点影子
    sh = c.mask('poly', [(x + 14, y + 6) for x, y in body]); c.fill(sh, VIO_M); c.pattern(sh, dot_pattern(WHITE, 12, 3.2))
    # 犄角
    c.shape('poly', [(58, 52), (44, 6), (76, 42)], LIME, GOLD, 1)
    c.shape('poly', [(142, 52), (156, 6), (124, 42)], LIME, GOLD, 1)
    m = c.shape('poly', body, VIO_D, GOLD, 1.6)
    c.pattern(m, tri_pattern(VIO_D, (80, 30, 130, 255), 20))
    # 前襟格纹
    m = c.shape('poly', [(86, 128), (114, 128), (118, 196), (82, 196)], PINK, GOLD, 1); c.pattern(m, checker(PINK, MAG, 8))
    # 脸
    c.shape('rrect', (52, 58, 148, 132, 26), MINT, GOLD, 1.2)
    for ex in (78, 122):
        c.shape('ellipse', (ex - 16, 72, ex + 16, 100), YEL, INK, 1)
        c.shape('ellipse', (ex - 8, 78, ex + 8, 96), RED, None)
        c.shape('poly', [(ex - 2, 78), (ex + 2, 78), (ex + 2, 96), (ex - 2, 96)], INK, None)
    c.shape('poly', [(56, 62), (94, 70), (92, 76), (56, 70)], INK, None)
    c.shape('poly', [(144, 62), (106, 70), (108, 76), (144, 70)], INK, None)
    c.shape('rrect', (80, 108, 120, 124, 6), INK, None)
    for x in (82, 94, 106): c.shape('poly', [(x, 108), (x + 10, 108), (x + 5, 118)], WHITE, None)
    for x in (58, 132): c.shape('ellipse', (x - 5, 104, x + 5, 114), MAG, None)
    # 小手（爪）
    c.shape('ellipse', (8, 128, 34, 150), MINT, GOLD, 1)
    c.shape('ellipse', (166, 128, 192, 150), MINT, GOLD, 1)
    c.save('ghost.png')


wenshen()
ghost()
