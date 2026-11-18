#!/usr/bin/env python3
"""Repaint the four summer photographs of the village into the four seasons.

    python3 tools/build_paintings.py            (run from the repository root)

Reads   assets/source/{1..4}.webp   (the photographs, taken in summer)
Writes  assets/paintings/{id}-{season}.webp, assets/paintings/{id}-mask.png
        and js/scenes.js (sizes, lights, street lamps, where the moon hangs).
        python3 tools/build_paintings.py --scenes   writes only js/scenes.js.

Lights are (x, y, r) or (x, y, r, kind) on the print: a window unless the kind
says 'lantern'; the lit windows scattered over a village are 'house', some of
which the page leaves dark.  Street lamps are (x, head, foot): where the lamp
hangs and the point on the ground straight below it, where its light falls.

Every pixel is first sorted into sky, leaves, field, water or "built"; the
handful of shapes that colour cannot tell apart (roofs, the pond, the ground)
are outlined by hand below, measured on a 2000 px wide print of each photo.
The seasons are then mixed from that: blossom and flooded paddies in spring,
maples turning and rice gone to straw in autumn, snow on everything that
faces the sky in winter.  The page paints over all of it with a brush, so
what matters here is colour and mass, not detail.

Needs numpy, scipy, opencv-python and Pillow.
"""
import json, os, sys
import numpy as np
import cv2
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'source')
OUT = os.path.join(ROOT, 'assets', 'paintings')
W = 1280          # width of the season pictures
MASK_W = 640      # width of the class mask

# ---- the four places.  Points are (x, y) on a 2000 px wide print. ----------
PLACES = [
    dict(id='overlook', src='1', name='Overlook', kanji='展望台', h=1125, focus=(0.42, 0.55),
         sky_below=0.36, sky_v=0.64, moon=(0.57, 0.07, 0.022),
         village=[(30, 440), (700, 400), (1250, 400), (1480, 440), (1330, 560), (1260, 700), (1500, 760),
                  (1350, 800), (900, 1010), (600, 960), (120, 900), (0, 720)],
         # along the road down the middle, the main street of the village and the lanes by the paddies
         lamps=[(857, 470, 482), (868, 520, 535), (880, 575, 592), (893, 625, 645), (830, 672, 690), (815, 760, 790),
                (832, 850, 885), (862, 925, 965), (470, 640, 658), (640, 672, 690), (300, 552, 568), (1100, 660, 680),
                (1150, 752, 772)],
         haze=0.42),
    dict(id='hojo-residence', src='2', name='Hōjō Residence', kanji='北条家', h=1125, focus=(0.5, 0.45),
         sky_below=0.10,
         roofs=[[(205, 452), (1250, 118), (1612, 52), (1620, 78), (1255, 150), (215, 478)],
                [(1590, 70), (1620, 55), (1778, 380), (1745, 392)],
                [(345, 512), (1285, 365), (1835, 518), (1830, 545), (1285, 392), (350, 540)],
                [(240, 468), (445, 490), (350, 548), (200, 545)]],
         ground=[[(0, 700), (330, 785), (1050, 940), (1300, 1000), (2000, 870), (2000, 1125), (0, 1125)]],
         lights=[(435, 440, 34), (500, 428, 34), (985, 320, 55), (1120, 285, 62), (1375, 578, 40)]),
    dict(id='hinamizawa-estate', src='3', name='Hinamizawa Estate', kanji='雛見沢屋敷', h=1500, focus=(0.6, 0.5),
         sky_below=0.52, moon=(0.66, 0.10, 0.03),
         roofs=[[(1095, 250), (1150, 218), (1795, 352), (1915, 498), (1840, 500), (1560, 490), (1500, 560),
                 (1460, 575), (1440, 600), (1240, 590), (1100, 395), (1010, 340), (1030, 335), (1100, 330)]],
         ground=[[(2000, 1150), (1560, 1195), (1100, 1290), (700, 1375), (400, 1450), (100, 1495), (0, 1500), (2000, 1500)],
                 [(1000, 770), (1450, 780), (1460, 830), (1200, 830), (1000, 800)]],
         water=[[(1040, 1000), (1130, 930), (1420, 910), (1440, 1060), (1560, 1190), (1100, 1285), (700, 1370),
                 (400, 1445), (100, 1490), (0, 1495), (0, 1330), (200, 1340), (640, 1250), (1000, 1180), (1040, 1100)]],
         bloom=0.28,
         lights=[(1105, 470, 24), (1075, 675, 20), (1143, 672, 20)]),
    dict(id='furude-shrine', src='4', name='Furude Shrine', kanji='古手神社', h=1500, focus=(0.5, 0.52),
         sky_below=0.22,
         roofs=[[(650, 450), (800, 415), (880, 370), (930, 318), (1010, 318), (1060, 370), (1140, 415), (1260, 445),
                 (1258, 480), (1140, 455), (1050, 420), (960, 405), (880, 420), (800, 455), (652, 482)],
                [(275, 452), (650, 440), (652, 472), (290, 478)], [(1258, 440), (1625, 448), (1612, 476), (1258, 472)],
                [(62, 500), (250, 520), (380, 545), (378, 580), (240, 572), (75, 548)],
                [(1900, 497), (1700, 520), (1520, 548), (1522, 582), (1700, 570), (1890, 545)]],
         hard=[[(40, 1090), (1960, 1090), (2000, 1500), (0, 1500)], [(280, 560), (1640, 560), (1640, 1090), (280, 1090)]],
         ground=[[(40, 1090), (1960, 1090), (2000, 1500), (0, 1500)]],
         bloom=0.15,
         lights=[(365, 715, 26, 'lantern'), (1585, 715, 26, 'lantern'), (960, 572, 16, 'lantern'), (960, 960, 70, 'lantern'),
                 (1550, 745, 18, 'lantern'), (660, 760, 18, 'lantern')]),
]
SEASONS = ['spring', 'summer', 'autumn', 'winter']


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def mix(a, b, t):
    a, b = np.asarray(a), np.asarray(b)
    if np.ndim(t) == 2 and max(a.ndim, b.ndim) != 2:      # a mask over colours
        t = t[..., None]
    return a * (1 - t) + b * t


def noise(shape, sigma, rng):
    """Smooth noise, spread evenly over 0..1."""
    n = ndi.gaussian_filter(rng.standard_normal(shape), sigma, mode='reflect')
    flat = n.ravel()
    ranks = np.empty(flat.size)
    ranks[np.argsort(flat)] = np.linspace(0, 1, flat.size)
    return ranks.reshape(shape)


def poly_mask(polys, w, h, ph, blur=1.5):
    im = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(im)
    for p in polys or []:
        d.polygon([(x / 2000 * w, y / ph * h) for x, y in p], fill=255)
    return ndi.gaussian_filter(np.asarray(im, dtype=np.float32) / 255, blur)


def hsv(rgb):
    return cv2.cvtColor(rgb.astype(np.float32), cv2.COLOR_RGB2HSV)


def rgb_of(h):
    h = h.copy()
    h[..., 0] %= 360
    h[..., 1:] = np.clip(h[..., 1:], 0, 1)
    return cv2.cvtColor(h.astype(np.float32), cv2.COLOR_HSV2RGB)


def classify(rgb, place):
    h, w = rgb.shape[:2]
    H, S, V = np.moveaxis(hsv(rgb), 2, 0)
    yy = np.linspace(0, 1, h)[:, None] * np.ones((1, w))
    veg = ((H > 48) & (H < 178) & (S > 0.15) & (V > 0.06)).astype(np.float32)
    near = ndi.gaussian_filter(veg, 3)
    veg = ((veg > 0) | ((V < 0.16) & (near > 0.5))) & (near > 0.25)
    blue = (H > 185) & (H < 256) & (S > 0.14) & (V > place.get('sky_v', 0.42)) & ~veg
    white = (S < 0.2) & (V > 0.78) & ~veg
    cand = (blue | white) & (yy < place['sky_below'])
    lab, _ = ndi.label(ndi.binary_dilation(cand, iterations=2))
    keep = np.unique(lab[blue & (yy < place['sky_below'])])
    sky = np.isin(lab, keep[keep > 0]) & cand
    sky = ndi.binary_closing(sky, iterations=2)
    ph = place['h']
    veg &= ~sky & (poly_mask(place.get('hard'), w, h, ph, 0.5) < 0.5)
    water = poly_mask(place.get('water'), w, h, ph)
    ground = poly_mask(place.get('ground'), w, h, ph)
    roof = poly_mask(place.get('roofs'), w, h, ph)
    village = poly_mask([place['village']] if 'village' in place else None, w, h, ph, 6)
    field = (veg & (H > 55) & (H < 105) & (S > 0.5) & (V > 0.58)).astype(np.float32) * (village > 0.5)
    field = ndi.gaussian_filter(field, 2)
    return dict(veg=veg.astype(np.float32), sky=sky.astype(np.float32), water=water, ground=ground,
                roof=roof, village=village, field=field)


def paint(rgb, c, place, season, rng):
    h, w = rgb.shape[:2]
    k = w / 1280.0
    hs = hsv(rgb)
    H, S, V = hs[..., 0].copy(), hs[..., 1].copy(), hs[..., 2].copy()
    L = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    veg = c['veg'] * (1 - np.clip(c['water'] * 2, 0, 1))
    grass = veg * c['ground']
    trees = veg * (1 - c['ground']) * (1 - np.clip(c['field'] * 2, 0, 1))
    leafy = smooth(0.2, 0.44, ndi.gaussian_filter(V, 6 * k)) * trees     # broadleaf: lighter than the cedars
    clump = noise((h, w), 16 * k, rng) * 0.75 + noise((h, w), 3 * k, rng) * 0.25
    sky = c['sky'][..., None]

    if season == 'summer':
        out = rgb_of(np.dstack([H, S * 1.04, V]))

    elif season == 'spring':
        Hn = mix(H, 86.0, 0.55 * veg)
        Sn = S * (1 - 0.12 * veg)
        Vn = V * (1 + 0.14 * veg) + 0.02 * veg
        out = rgb_of(np.dstack([Hn, Sn, Vn]))
        # cherry and plum in clouds among the broadleaf trees
        blobs = noise((h, w), 10 * k, rng) * 0.8 + noise((h, w), 2.5 * k, rng) * 0.2
        edge = 1 - place.get('bloom', 0.22)
        bloom = smooth(edge - 0.05, edge + 0.05, blobs) * smooth(0.3, 0.6, leafy) * smooth(0.14, 0.38, V)
        tex = noise((h, w), 1.6 * k, rng)
        pink = np.dstack([0.98 - 0.10 * tex, 0.80 - 0.22 * tex, 0.86 - 0.16 * tex]) * (0.62 + 0.5 * np.clip(V, 0, 0.8))[..., None]
        out = mix(out, np.clip(pink, 0, 1), bloom * 0.92)
        # the paddies stand under water and show the sky
        hp = L - ndi.gaussian_filter(L, 5 * k)
        wet = np.array([0.66, 0.76, 0.84]) * (0.9 + 0.25 * noise((h, w), 20 * k, rng))[..., None] + hp[..., None] * 0.6
        out = mix(out, np.clip(wet, 0, 1), np.clip(c['field'] * 1.3, 0, 1) * 0.8)
        out = mix(out, np.array([0.84, 0.90, 0.96]), 0.24 * sky)
        out = mix(out, np.array([1.0, 0.98, 0.97]), 0.05)

    elif season == 'autumn':
        hue = np.interp(clump, [0, 0.22, 0.45, 0.7, 1], [78, 54, 38, 22, 6])
        Hn = mix(H, hue, 0.96 * leafy)
        Sn = S * (1 + 0.22 * leafy) * (1 - 0.12 * (trees - leafy))
        Vn = V * (1 + 0.16 * leafy) * (1 - 0.08 * (trees - leafy))
        # grass and the rice: straw and gold
        Hn = mix(Hn, 44.0, 0.9 * grass)
        Sn = Sn * (1 - 0.3 * grass)
        f = np.clip(c['field'] * 1.3, 0, 1)
        Hn = mix(Hn, 46.0, f)
        Sn = Sn * (1 - 0.22 * f)
        Vn = Vn * (1 + 0.04 * f)
        out = rgb_of(np.dstack([Hn, Sn, Vn]))
        warm = out * np.array([1.05, 1.0, 0.92])
        out = mix(warm, out * np.array([0.92, 0.97, 1.06]), 0.7 * sky)
        out = mix(out, mix(out, np.array([0.55, 0.36, 0.2]), 0.22), c['water'])

    else:  # winter
        Lb = ndi.gaussian_filter(L, 9 * k)
        hp = L - Lb
        hps = ndi.gaussian_filter(hp, 0.8 * k)
        val = np.clip(0.9 + hps * 1.1 + (Lb - 0.45) * 0.22, 0.56, 1.0)
        sh = 1 - val
        snow = np.dstack([val - sh * 0.16, val - sh * 0.04, val + sh * 0.08])
        fine = noise((h, w), 1.4 * k, rng)
        laden = 0.45 + 0.55 * smooth(0.25, 0.75, clump)                  # some boughs carry more than others
        wv = (0.06 + 0.8 * smooth(0.22, 0.55, L + (fine - 0.5) * 0.16) * laden) * veg
        built = (1 - veg) * (1 - c['sky'])
        wb = smooth(0.5, 0.76, L) * 0.85 * built
        keep_dark = smooth(0.015, 0.09, -hp)
        wvil = c['village'] * 0.86 * (1 - 0.6 * keep_dark)
        wflat = np.maximum(c['ground'], np.clip(c['field'] * 1.3, 0, 1)) * 0.97
        wroof = c['roof'] * 0.97 * (1 - veg)
        wsnow = np.maximum.reduce([wv, wb, wvil, wflat, wroof]) * (1 - c['sky']) * (1 - np.clip(c['water'] * 1.5, 0, 1))
        # what the snow leaves showing: cedars nearly black-green, bare twigs brown, wood a little colder
        twig = smooth(0.35, 0.7, leafy)
        Hc = mix(mix(H, 135.0, 0.35 * veg), 28.0, 0.8 * twig)
        Sc = S * (1 - 0.15 * veg) * (1 - 0.3 * twig) * 0.9
        Vc = V * (1 - 0.3 * veg)
        cold = rgb_of(np.dstack([Hc, Sc, Vc])) * np.array([0.95, 0.98, 1.05])
        cold = mix(cold, cold * np.array([0.5, 0.56, 0.66]), c['water'])
        out = mix(cold, snow, wsnow)
        cloud = smooth(0.35, 0.9, ndi.gaussian_filter(L, 4 * k)) * 0.6 + noise((h, w), 40 * k, rng) * 0.4
        over = mix(np.array([0.70, 0.74, 0.80]), np.array([0.90, 0.91, 0.93]), cloud)
        out = mix(out, over, sky)
        if place.get('haze'):
            yy = np.linspace(0, 1, h)[:, None] * np.ones((1, w))
            far = smooth(0.50, 0.05, yy) * place['haze'] * (1 - c['sky'])
            out = mix(out, np.array([0.86, 0.88, 0.92]), far)

    return np.clip(out, 0, 1)


def main():
    pictures = '--scenes' not in sys.argv[1:]      # --scenes: only the lights and the rest in js/scenes.js
    os.makedirs(OUT, exist_ok=True)
    scenes = []
    for n, place in enumerate(PLACES):
        im = Image.open(os.path.join(SRC, place['src'] + '.webp')).convert('RGB')
        h = round(im.height * W / im.width)
        rgb = np.asarray(im.resize((W, h), Image.LANCZOS), dtype=np.float32) / 255
        c = classify(rgb, place)
        for season in SEASONS if pictures else []:
            out = paint(rgb, c, place, season, np.random.default_rng(7 + n))
            Image.fromarray((out * 255 + 0.5).astype(np.uint8)).save(
                os.path.join(OUT, f"{place['id']}-{season}.webp"), quality=80, method=6)
        if pictures:
            mh = round(h * MASK_W / W)
            sway = np.maximum(c['veg'] * (1 - np.clip(c['water'] * 2, 0, 1)), 0)
            mask = np.dstack([c['sky'], sway, np.clip(c['water'], 0, 1)])
            Image.fromarray((mask * 255).astype(np.uint8)).resize((MASK_W, mh), Image.BILINEAR).save(
                os.path.join(OUT, f"{place['id']}-mask.png"), optimize=True)
        ph = place['h']
        lights = [[round(x / 2000, 4), round(y / ph, 4), round(r / 2000, 4), *kind] for x, y, r, *kind in place.get('lights', [])]
        if 'village' in place:           # the village from above: a scatter of lit windows among the roofs
            rng = np.random.default_rng(3)
            ok = (c['village'] > 0.6) & (c['veg'] < 0.5) & (c['field'] < 0.2) & (c['sky'] < 0.5)
            ys, xs = np.nonzero(ok)
            for i in rng.choice(len(xs), 46, replace=False):
                lights.append([round(xs[i] / W, 4), round(ys[i] / h, 4), round(float(rng.uniform(0.003, 0.0055)), 4), 'house'])
        lamps = [[round(x / 2000, 4), round(top / ph, 4), round(foot / ph, 4)] for x, top, foot in place.get('lamps', [])]
        scenes.append(dict(id=place['id'], name=place['name'], kanji=place['kanji'], w=W, h=h,
                           focus=place['focus'], moon=place.get('moon'), lights=lights, lamps=lamps))
        print(place['id'], 'done')
    with open(os.path.join(ROOT, 'js', 'scenes.js'), 'w') as f:
        f.write('/* Generated by tools/build_paintings.py.  Not to be edited. */\n')
        f.write('window.HINAMIZAWA = ' + json.dumps(scenes, ensure_ascii=False, separators=(',', ':')) + ';\n')


if __name__ == '__main__':
    sys.exit(main())
