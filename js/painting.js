/* ------------------------------------------------------------------ *
 *  Hinamizawa: four paintings that never dry.
 *
 *  One canvas holds the picture and is never cleared.  Every frame a
 *  few hundred dry-brush strokes are laid over whatever is already
 *  there, each taking its colour from the scene as it is right now:
 *  the place, the season and the hour as they are in Berlin, and the wind
 *  that is in the leaves at this moment.  A new season or hour changes only what
 *  the brush is looking at: the new picture is painted over the old
 *  one unhurriedly, a few loose, broad strokes at first, then more and
 *  finer ones until it is all there.
 *  What really moves (petals, leaves, snow, fireflies, stars and the
 *  flicker of lamps) is redrawn each frame on a second canvas on top.
 *
 *  The season pictures come from tools/build_paintings.py; the hour of
 *  the day is mixed here, in grade().
 * ------------------------------------------------------------------ */
(() => {
'use strict';

const PLACES = window.HINAMIZAWA;
const SRC_W = 768;                       // the width the brush looks at the picture in
const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rng = seed => () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ---------- what is being looked at: the season and the hour as they are in Berlin ----------
const ZONE = 'Europe/Berlin';
const berlinMonth = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, month: 'numeric' });

// Where the sun stands over Berlin right now (a low-precision solar position, good to a fraction of a
// degree, which is a minute or two of the clock): how high, in degrees, and how many hours it is from
// solar midnight, when it is lowest (a little after midnight on the clock, in Berlin).
const DEG = Math.PI / 180, LAT = 52.52, LON = 13.405;
function sun(ms) {
  const d = ms / 864e5 - 10957.5;                                              // days since 2000-01-01 12:00 UTC
  const g = (357.529 + 0.98560028 * d) * DEG, q = 280.459 + 0.98564736 * d;  // mean anomaly, mean longitude
  const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG, e = (23.439 - 3.6e-7 * d) * DEG;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / DEG, dec = Math.asin(Math.sin(e) * Math.sin(L));
  const ha = 280.46061837 + 360.98564736629 * d + LON - ra;                    // hour angle, in degrees
  return {
    height: Math.asin(Math.sin(LAT * DEG) * Math.sin(dec) + Math.cos(LAT * DEG) * Math.cos(dec) * Math.cos(ha * DEG)) / DEG,
    fromMidnight: Math.abs(((ha % 360) + 360) % 360 - 180) / 15,
  };
}
// Night is the plainest of the three pictures, day and dusk have the colours, so night is kept short:
// it is only the four hours around solar midnight (about 22:00 to 02:00 in winter, 23:00 to 03:00
// in summer), and only if the sun is well under (8°) by then.  Day is while the sun is more than 2°
// up; all the rest is dusk, the evening drawn out long in winter.  In Berlin that gives night 4 hours
// all year, day 7 (December) to 16 (June), and dusk 13 (December) down to 4 (June).
const DAY = 2, DARK = -8, NIGHT = 2;
function berlinScene() {
  const m = +berlinMonth.format(new Date()) - 1, { height: h, fromMidnight } = sun(Date.now());
  return {
    season: m < 2 || m === 11 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn',
    time: h > DAY ? 'day' : h < DARK && fromMidnight < NIGHT ? 'night' : 'dusk',
  };
}
const state = (() => {
  const hp = location.hash.replace(/^#\/?/, '').split('/')[0];
  return { place: (PLACES.find(p => p.id === hp) || PLACES[0]).id, ...berlinScene() };
})();

// ---------- loading: the season pictures and the mask of what is where ----------
const pixelsOf = (url, w, h) => new Promise((resolve, reject) => {
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, w, h);
    resolve(x.getImageData(0, 0, w, h).data);
  };
  img.onerror = () => reject(new Error('could not load ' + url));
  img.src = url;
});
const sizeOf = place => ({ w: SRC_W, h: Math.round(SRC_W * place.h / place.w) });
const cache = new Map();
const once = (key, make) => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); };
const loadSeason = (place, season) => once(place.id + season, () => {
  const { w, h } = sizeOf(place);
  return pixelsOf(`assets/paintings/${place.id}-${season}.webp`, w, h);
});
const loadMask = place => once(place.id, async () => {
  const { w, h } = sizeOf(place);
  const d = await pixelsOf(`assets/paintings/${place.id}-mask.png`, w, h);
  const sky = new Uint8Array(w * h), veg = new Uint8Array(w * h), water = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { sky[i] = d[i * 4]; veg[i] = d[i * 4 + 1]; water[i] = d[i * 4 + 2]; }
  return { sky, veg, water };
});

// ---------- the hour: day as it is, dusk in orange, night in blue with the lamps lit ----------
function grade(place, season, time, base, mask, festival = []) {
  const { w, h } = sizeOf(place), n = w * h;
  const col = new Uint8ClampedArray(n * 3);
  const lum = new Float32Array(n);
  const stars = [];
  const night = time === 'night', dusk = time === 'dusk';
  const cloudy = new Float32Array(night || dusk ? n : 0);

  for (let i = 0, y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++, i++) {
      let r = base[i * 4] / 255, g = base[i * 4 + 1] / 255, b = base[i * 4 + 2] / 255;
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      if (night || dusk) {
        const sky = mask.sky[i] / 255;
        const mx = Math.max(r, g, b), sat = mx > 0 ? (mx - Math.min(r, g, b)) / mx : 0;
        const cl = smooth(0.3, 0.08, sat) * smooth(0.45, 0.85, l);       // how much of a cloud this bit of sky is
        cloudy[i] = cl;
        let lr, lg, lb, sr, sg, sb;
        if (dusk) {
          // the low sun warms what it still reaches; the shadows go violet
          lr = r * (0.84 + 0.22 * l) + 0.05 * (1 - l); lg = g * (0.72 + 0.14 * l) + 0.01 * (1 - l); lb = b * (0.86 - 0.18 * l) + 0.06 * (1 - l);
          const k = smooth(0, 0.6, v);                                    // down towards the horizon
          sr = 0.42 + 0.58 * k; sg = 0.40 + 0.24 * k; sb = 0.62 - 0.28 * k;
          sr += (1.0 * (0.55 + 0.45 * l) - sr) * cl * 0.75;
          sg += (0.70 * (0.55 + 0.45 * l) - sg) * cl * 0.75;
          sb += (0.56 * (0.55 + 0.45 * l) - sb) * cl * 0.75;
        } else {
          const rr = r + (l - r) * 0.45, gg = g + (l - g) * 0.45, bb = b + (l - b) * 0.45;
          lr = rr * 0.23 + 0.010; lg = gg * 0.31 + 0.016; lb = bb * 0.53 + 0.036;
          sr = 0.04 + 0.05 * v + 0.09 * cl * l; sg = 0.065 + 0.08 * v + 0.10 * cl * l; sb = 0.17 + 0.13 * v + 0.13 * cl * l;
        }
        r = lr + (sr - lr) * sky; g = lg + (sg - lg) * sky; b = lb + (sb - lb) * sky;
      }
      col[i * 3] = r * 255; col[i * 3 + 1] = g * 255; col[i * 3 + 2] = b * 255;
      lum[i] = l;
    }
  }

  const add = (cx, cy, rad, reach, cr, cg, cb, only) => {            // a soft light, laid over what is there
    const R = rad * reach;
    for (let y = Math.max(0, cy - R | 0); y < Math.min(h, cy + R + 1); y++) {
      for (let x = Math.max(0, cx - R | 0); x < Math.min(w, cx + R + 1); x++) {
        const i = y * w + x, d = Math.hypot(x - cx, y - cy) / rad;
        if (d > reach || (only && mask.sky[i] < 128)) continue;
        const a = Math.exp(-d * d * 1.1) + 0.22 * Math.exp(-d * 0.9);
        col[i * 3] += cr * a; col[i * 3 + 1] += cg * a; col[i * 3 + 2] += cb * a;
      }
    }
  };
  const glows = night || dusk ? light(place, w, h, base, mask, col, night ? 1 : 0.5, festival) : [];
  if (night) {
    const rand = rng(11 + PLACES.indexOf(place));
    if (place.moon && season !== 'winter') add(place.moon[0] * w, place.moon[1] * h, place.moon[2] * w, 7, 235, 228, 200, true);
    for (let k = 0; k < 900 && stars.length < 170; k++) {
      const x = rand(), y = rand() * 0.6, i = (y * h | 0) * w + (x * w | 0);
      if (mask.sky[i] > 220 && cloudy[i] < 0.25) stars.push({ x, y, r: 0.5 + rand() * rand() * 1.4, p: rand() * TAU, f: 0.6 + rand() * 2.2 });
    }
  }

  // which way the brush should run: along the edges of things, and where there is detail to keep
  const ang = new Float32Array(n), det = new Float32Array(n);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = lum[i + 1 - w] + 2 * lum[i + 1] + lum[i + 1 + w] - lum[i - 1 - w] - 2 * lum[i - 1] - lum[i - 1 + w];
      const gy = lum[i + w - 1] + 2 * lum[i + w] + lum[i + w + 1] - lum[i - w - 1] - 2 * lum[i - w] - lum[i - w + 1];
      ang[i] = Math.atan2(gy, gx) + Math.PI / 2;
      det[i] = Math.min(1, Math.hypot(gx, gy) * 1.6);
    }
  }

  // Where the shapes are: the outlines of things (a roof against the snow, the ridge against the sky),
  // found in the picture a little blurred so the grain of leaves and snow does not count, and measured
  // against this picture's own contrast, so a grey winter has as many as a green summer.  A share of the
  // strokes goes to these from the start, so the picture can be read long before it is finished.
  const soft = lum.slice(), tmp = new Float32Array(n);
  for (let pass = 0; pass < 2; pass++) {                                       // a box blur, twice: nearly a gaussian
    for (let y = 0; y < h; y++) for (let x = 0, i = y * w; x < w; x++, i++) {
      tmp[i] = (soft[y * w + Math.max(0, x - 2)] + soft[y * w + Math.max(0, x - 1)] + soft[i] + soft[y * w + Math.min(w - 1, x + 1)] + soft[y * w + Math.min(w - 1, x + 2)]) / 5;
    }
    for (let y = 0; y < h; y++) for (let x = 0, i = y * w; x < w; x++, i++) {
      soft[i] = (tmp[Math.max(0, y - 2) * w + x] + tmp[Math.max(0, y - 1) * w + x] + tmp[i] + tmp[Math.min(h - 1, y + 1) * w + x] + tmp[Math.min(h - 1, y + 2) * w + x]) / 5;
    }
  }
  const edge = new Float32Array(n), hist = new Uint32Array(512);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x, m = Math.hypot(soft[i + 1] - soft[i - 1], soft[i + w] - soft[i - w]);
      edge[i] = m;
      hist[Math.min(511, m * 1024 | 0)]++;
    }
  }
  const level = q => { for (let k = 0, s = 0; k < 512; k++) if ((s += hist[k]) >= q * n) return (k + 0.5) / 1024; return 0.5; };
  const lo = level(0.6), hi = Math.max(lo + 0.004, level(0.94));
  let many = 0;
  for (let i = 0; i < n; i++) { edge[i] = clamp((edge[i] - lo) / (hi - lo), 0, 1); if (edge[i] > 0.5) many++; }
  const spots = new Uint32Array(many);
  for (let i = 0, k = 0; i < n; i++) if (edge[i] > 0.5) spots[k++] = i;

  return { place, season, time, w, h, col, ang, det, edge, spots, sky: mask.sky, veg: mask.veg, water: mask.water, stars, glows };
}

// ---------- the lights after dark: what each one is, and what it throws its light on ----------
// Away from the lights there is only the moon (in grade, above).  Near one, a surface takes that
// light's colour times its own, so under a street lamp the grass is green again and the road grey,
// fading back into the blue further off.  Each light also hangs a little glow in the air about itself,
// shows its own pane or flame or bulb, and over water lays a streak down it where it is reflected.
const LIGHT = { warm: [1.0, 0.6, 0.28], pale: [1.0, 0.78, 0.5], cool: [0.78, 0.88, 1.0], flame: [1.0, 0.46, 0.16], street: [0.8, 0.93, 1.0] };
const PANE = { warm: [1.0, 0.85, 0.55], pale: [1.0, 0.93, 0.76], cool: [0.9, 0.95, 1.0], flame: [1.0, 0.72, 0.36], street: [0.97, 1.0, 1.0] };

function lightsOf(place, w, h, festival) {
  const rand = rng(29 + PLACES.indexOf(place)), out = [];
  for (const [x, y, r, kind = 'window'] of place.lights) {
    let tone = kind === 'lantern' ? 'flame' : 'warm', power = 1;
    const a = rand(), b = rand(), c = rand();
    if (kind === 'house') {                     // a village at night: not every house is still up, nor are all lit alike
      if (a < 0.35) continue;
      tone = b < 0.18 ? 'cool' : b < 0.4 ? 'pale' : 'warm';
      power = (0.65 + 0.5 * c) * (tone === 'cool' ? 0.7 : 1);
    }
    out.push({ kind: kind === 'lantern' ? 'lantern' : 'window', x: x * w, y: y * h, r: Math.max(1.2, r * w), tone, power });
  }
  for (const [x, top, foot] of place.lamps || []) {
    const tall = (foot - top) * h;
    out.push({ kind: 'lamp', x: x * w, y: top * h, foot: foot * h, tall, r: 0.3 * tall + 1.2, tone: 'street', power: 1 });
  }
  const k = w / 2000;                                                          // the festival's lanterns are on the print
  for (const [x, y, r] of festival) out.push({ kind: 'lantern', x: x * k, y: y * k, r: Math.max(1.2, r * k), tone: 'flame', power: 0.85 });
  return out;
}

function light(place, w, h, base, mask, col, f, festival) {
  const n = w * h, L = new Float32Array(n * 3), G = new Float32Array(n * 3);
  const over = (cx, cy, R, fn) => {                                            // every pixel within a box about (cx, cy)
    for (let y = Math.max(0, cy - R | 0); y < Math.min(h, cy + R + 1); y++) {
      for (let x = Math.max(0, cx - R | 0), i = y * w + x; x < Math.min(w, cx + R + 1); x++, i++) fn(i, x + 0.5 - cx, y + 0.5 - cy);
    }
  };
  const into = (A, i, c, e) => { A[i * 3] += c[0] * e; A[i * 3 + 1] += c[1] * e; A[i * 3 + 2] += c[2] * e; };
  const list = lightsOf(place, w, h, festival);

  for (const s of list) {
    const c = LIGHT[s.tone], k = f * s.power, R = s.r;
    if (s.kind === 'lamp') {
      // a pool on the ground below, flattened by the distance it is seen from, and a little on what is near the lamp
      const T = s.tall, rx = 1.1 * T + 1, ry = 0.4 * T + 0.6;
      over(s.x, s.foot, rx * 2.2, (i, dx, dy) => into(L, i, c, k * 0.62 * Math.exp(-1.6 * ((dx / rx) ** 2 + (dy / ry) ** 2))));
      over(s.x, s.y, T * 2, (i, dx, dy) => into(L, i, c, k * 0.25 * Math.exp(-(dx * dx + dy * dy) / (0.64 * T * T))));
      over(s.x, s.y, R * 4, (i, dx, dy) => into(G, i, c, k * 0.5 * Math.exp(-(dx * dx + dy * dy) / (R * R))));
    } else {
      // a window or a lantern lights what is right about it, and a little, further off
      over(s.x, s.y, R * 16, (i, dx, dy) => { const d = Math.hypot(dx, dy) / R; into(L, i, c, k * (0.9 * Math.exp(-d * d / 6.8) + 0.2 * Math.exp(-d / 6))); });
      over(s.x, s.y, R * 4, (i, dx, dy) => into(G, i, c, k * 0.45 * Math.exp(-(dx * dx + dy * dy) / (2 * R * R))));
    }
    // over water: where the light is seen again, as far below the water's edge as the light stands above it,
    // drawn out down the water and broken up by the ripples into bands
    const cx = clamp(Math.round(s.x), 0, w - 1);
    for (let y = Math.ceil((s.foot || s.y + R)); y < h; y++) {
      if (mask.water[y * w + cx] < 128) continue;
      const ym = y + (y - s.y) * 0.9, ly = Math.max(3, 0.3 * (ym - y)), wide = s.kind === 'lamp' ? 0.4 * s.tall + 1 : R * 0.9;
      over(s.x, ym, Math.max(wide * 3, ly * 2.5), (i, dx, dy) => {
        const yy = ym + dy, band = 0.55 + 0.45 * Math.sin(yy * 1.7 + Math.sin(yy * 0.53) * 2);
        const sway = dx + Math.sin(yy * 0.9) * wide * 0.35;                  // each band pushed a little sideways
        into(G, i, c, k * 0.38 * band * (mask.water[i] / 255) * Math.exp(-((sway / wide) ** 2) - ((dy / ly) ** 2)));
      });
      break;
    }
  }

  // the light on things, by their own colour a little greyed, as colours are by lamplight (the sky is not
  // lit), and the glow in the air
  for (let i = 0; i < n; i++) {
    const s = 1.1 * (1 - mask.sky[i] / 255), y = (0.299 * base[i * 4] + 0.587 * base[i * 4 + 1] + 0.114 * base[i * 4 + 2]) / 255;
    for (let ch = 0; ch < 3; ch++) {
      const a = base[i * 4 + ch] / 255;
      col[i * 3 + ch] += 255 * ((a + (y - a) * 0.35) * L[i * 3 + ch] * s + G[i * 3 + ch]);
    }
  }
  // and the lights themselves: a lit pane, a flame, a bulb.  A pane is lit paper or glass with a frame
  // in front of it, so the picture's own light and dark still shows through the glow.
  for (const s of list) {
    const p = PANE[s.tone], k = Math.min(1, f * 1.15) * Math.min(1, 0.5 + s.power * 0.5), R = s.r;
    const shape = s.kind === 'lamp' ? (dx, dy) => Math.exp(-(dx * dx + dy * dy) / ((0.6 + 0.07 * s.tall) ** 2))
      : s.kind === 'lantern' ? (dx, dy) => smooth(1.1, 0.75, Math.hypot(dx, dy) / (0.85 * R))
      : (dx, dy) => smooth(1.4, 0.7, (Math.abs(dx) / (0.95 * R)) ** 4 + (Math.abs(dy) / (0.75 * R)) ** 4);
    over(s.x, s.y, s.kind === 'lamp' ? 3 + 0.2 * s.tall : R * 1.3, (i, dx, dy) => {
      const a = shape(dx, dy) * k * (s.kind === 'lamp' ? 1 : 0.85);
      const frame = s.kind === 'lamp' ? 1 : 0.6 + 0.6 * (0.299 * base[i * 4] + 0.587 * base[i * 4 + 1] + 0.114 * base[i * 4 + 2]) / 255;
      for (let ch = 0; ch < 3; ch++) col[i * 3 + ch] += (255 * p[ch] * frame - col[i * 3 + ch]) * a;
    });
  }
  return list.map(s => ({ kind: s.kind, tone: s.tone, power: s.power, x: s.x / w, y: s.y / h, r: s.r / w }));
}

// ---------- the canvases ----------
const canvas = document.getElementById('scene'), ctx = canvas.getContext('2d', { alpha: false });
const top = document.getElementById('sprites'), tctx = top.getContext('2d');
let W = 0, H = 0, U = 10, dpr = 1;
let scene = null;                        // what the brush is looking at
let view = { s: 1, ox: 0, oy: 0 };       // where the picture lies on the screen
let changedAt = 0, clock = 0, owed = 0, sharp = 0;

const viewOf = sc => {
  const s = Math.max(W / sc.w, H / sc.h), [fx, fy] = sc.place.focus;
  return {
    s,
    ox: clamp(W / 2 - fx * sc.w * s, W - sc.w * s, 0),
    oy: clamp(H / 2 - fy * sc.h * s, H - sc.h * s, 0),
  };
};

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  W = window.innerWidth; H = window.innerHeight;
  U = Math.sqrt(W * H) / 100;
  for (const c of [canvas, top]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = state.time === 'night' ? '#10131d' : state.time === 'dusk' ? '#4a3836' : '#d9d2c2';   // bare paper
  ctx.fillRect(0, 0, W, H);
  flakes.length = 0;
  if (scene) view = viewOf(scene);
  changedAt = clock;
}

// The tooth of the canvas: specks of light and shadow, a little stronger along a loose weave, laid
// over everything by CSS so the painting itself never has to carry them.  No blending, only alpha,
// so the browser does not have to work the whole window out anew every frame.
{
  const n = 192, c = document.createElement('canvas');
  c.width = c.height = n;
  const x = c.getContext('2d'), id = x.createImageData(n, n), d = id.data, R = rng(42);
  for (let y = 0, i = 0; y < n; y++) {
    for (let k = 0; k < n; k++, i += 4) {
      const weave = 0.5 + 0.25 * Math.sin(k * 2.1 + Math.sin(y * 0.37) * 1.5) + 0.25 * Math.sin(y * 2.1 + Math.sin(k * 0.29) * 1.5);
      const v = (R() - 0.5) * (R() < 0.2 ? 2 : 1) + (weave - 0.5) * 0.5;
      const light = v > 0;
      d[i] = d[i + 1] = d[i + 2] = light ? 255 : 20;
      d[i + 3] = Math.min(255, Math.abs(v) * (light ? 26 : 34));
    }
  }
  x.putImageData(id, 0, 0);
  try { document.documentElement.style.setProperty('--grain', `url(${c.toDataURL('image/png')})`); } catch (e) { /* no grain, then */ }
}

// How broad the brush is, by how long the picture has been worked on: eight times its final width at
// first, down to it within some ten seconds.
const broad = age => 1 + 7 * Math.exp(-age / 2.5);
// How fast a new picture is painted: at 1 it takes some twelve seconds to be all there, at 2 some six.
const PACE = 2;

// ---------- the brush ----------
function wind(t, sx, sy) {
  const gust = 0.45 + 0.55 * Math.sin(t * 0.31 + sx * 0.006) * Math.sin(t * 0.17 + 1.3);
  return Math.sin(t * 1.25 + sy * 0.045 + sx * 0.021) * gust;
}

let spot = 0;
function stroke(t, age, settled, sc, ctx, view, keen) {
  const w = sc.w, h = sc.h;
  // Where: the next point of a low-discrepancy sequence (R2), so the strokes spread evenly over the
  // canvas and no spot is left unpainted by chance, nudged a little so they never fall in a pattern.
  // A keen stroke goes to one of the outlines instead, if that is on the screen.
  let x = -1, y = -1;
  if (keen && sc.spots.length) {
    const k = sc.spots[Math.random() * sc.spots.length | 0];
    x = view.ox + (k % w + Math.random()) * view.s; y = view.oy + ((k / w | 0) + Math.random()) * view.s;
  }
  if (x < 0 || x >= W || y < 0 || y >= H) {
    keen = false;
    spot = (spot + 1) % 1e9;
    x = (((0.5 + spot * 0.7548776662466927) % 1) + (Math.random() - 0.5) * 0.004) * W;
    y = (((0.5 + spot * 0.5698402909980532) % 1) + (Math.random() - 0.5) * 0.004) * H;
  }
  const sx = (x - view.ox) / view.s, sy = (y - view.oy) / view.s;
  const xi = clamp(sx | 0, 0, w - 1), yi = clamp(sy | 0, 0, h - 1), i = yi * w + xi;
  const veg = sc.veg[i] > 110, sky = sc.sky[i] > 128, water = sc.water[i] > 110;
  if (settled && !(veg || sky || water) && Math.random() > 0.3) return;      // what does not move needs little repainting

  // where the colour is taken from: the place itself, pushed about by wind and water
  let j = i;
  if (!still) {
    let mx = sx, my = sy;
    if (water) { mx += Math.sin(t * 1.7 + sy * 0.9) * 1.6; my += Math.cos(t * 1.1 + sx * 0.3) * 0.7; }
    else if (veg) { const g = wind(t, sx, sy) * (sc.season === 'winter' ? 1.3 : 2.6); mx += g; my += g * 0.35; }
    else if (sky) { mx += Math.sin(t * 0.045) * 12 + Math.sin(t * 0.21 + sy * 0.05) * 2; }
    j = clamp(my | 0, 0, h - 1) * w + clamp(mx | 0, 0, w - 1);
    if (sky && sc.sky[j] < 128) j = i;                                         // the sky stays behind the roofs
  }
  let r = sc.col[j * 3], g = sc.col[j * 3 + 1], b = sc.col[j * 3 + 2];
  const jit = (Math.random() - 0.5) * 16;
  r += jit; g += jit; b += jit * 0.8;
  if (water && Math.random() < 0.03) { r += 34; g += 36; b += 40; }           // a glint

  // which way and how big
  const d0 = sc.det[i];
  let a;
  if (d0 > 0.16) a = sc.ang[i] + (Math.random() - 0.5) * 0.5;
  else if (sky) a = -0.1 + (Math.random() - 0.5) * 0.5;
  else if (water) a = (Math.random() - 0.5) * 0.25;
  else if (veg) a = Math.random() * Math.PI;
  else a = -0.3 + (Math.random() - 0.5) * 1.1;
  const rnd = Math.random();
  // the longer it stands, the finer the work; the outlines are drawn finely from the first
  const calm = keen ? Math.max(0.7, smooth(3, 12, age)) : smooth(3, 12, age);
  let size = U * (0.42 + (1.9 - 1.0 * calm) * rnd * rnd * (1 + calm * (rnd - 1))) * (keen ? 1 + (broad(age) - 1) * 0.15 : broad(age));
  let len = size * (veg ? 1.1 + Math.random() : 1.6 + 1.8 * Math.random());
  const ca = Math.cos(a), sa = Math.sin(a);
  // keep the broad strokes off the fine things
  const ex = clamp((sx + ca * len * 0.5 / view.s) | 0, 0, w - 1), ey = clamp((sy + sa * len * 0.5 / view.s) | 0, 0, h - 1);
  const fx = clamp((sx - ca * len * 0.5 / view.s) | 0, 0, w - 1), fy = clamp((sy - sa * len * 0.5 / view.s) | 0, 0, h - 1);
  const d = Math.max(d0, sc.det[ey * w + ex], sc.det[fy * w + fx]);
  const e = Math.max(sc.edge[i], sc.edge[ey * w + ex], sc.edge[fy * w + fx]);
  // loose at first, careful later; and a broad stroke that would run across an outline is kept narrow,
  // so it does not smear away what the keen ones have drawn
  const fine = (1 - 0.72 * smooth(0.05, 0.5, d) * smooth(0.5, 6, age)) * (keen ? 1 : 1 - 0.55 * e * (1 - calm));
  size *= fine; len *= fine;

  lay(x, y, ca, sa, len, size, r, g, b);
}

// ---------- laying a stroke down: a flat brush loaded with paint that stands up from the canvas ----------
// First the body of the stroke: the paint the brush puts down while it is still full, a little uneven
// along its edges, a little narrower where it begins to run dry.  Then the bristles drag their own
// streaks through it and beyond, out past the body where the brush has nearly run out, ragged at the
// end.  The paint has thickness, and the light comes from the upper left: the bristles on the side
// turned towards it come out paler, those on the side turned away darker, with a bright lip along
// one edge and a thin shadow cast beside the other.
const LX = -0.6, LY = -0.8;                                                    // where the light comes from
const MAXB = 14, BR = new Float32Array(MAXB * 4);                              // per bristle: offset, start, end, tone
const tone = (r, g, b, k) => k >= 0                                            // towards white, or towards black
  ? `rgb(${r + (255 - r) * k | 0},${g + (255 - g) * k | 0},${b + (255 - b) * k | 0})`
  : `rgb(${r * (1 + k) | 0},${g * (1 + k) | 0},${b * (1 + k) | 0})`;

function lay(x, y, ca, sa, len, size, r, g, b) {
  r = clamp(r, 0, 255); g = clamp(g, 0, 255); b = clamp(b, 0, 255);
  const nx = -sa, ny = ca, x0 = x - ca * len * 0.5, y0 = y - sa * len * 0.5, dx = ca * len, dy = sa * len;
  const bend = (Math.random() - 0.5) * len * 0.3;
  // a point on the stroke: s along it (0 to 1), o across it, the whole bowed a little
  const px = (s, o) => x0 + dx * s + nx * (o + bend * 4 * s * (1 - s));
  const py = (s, o) => y0 + dy * s + ny * (o + bend * 4 * s * (1 - s));
  // A bristle's streak, th wide: a thin ribbon between two curves either side of its path, filled.
  // It is the same as stroking the path with a line th wide and square ends, but Firefox draws a
  // filled shape quickly and a stroked line slowly (some thirty times slower: the strokes alone held
  // it to 16 frames a second, and the falling leaves stuttered).
  const curve = (s0, s1, o, th) => {
    const sm = (s0 + s1) / 2, u = o + th / 2, v = o - th / 2;
    const ax = px(s0, u), ay = py(s0, u), bx = px(s1, u), by = py(s1, u), cx = px(s1, v), cy = py(s1, v), ex = px(s0, v), ey = py(s0, v);
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(2 * px(sm, u) - (ax + bx) / 2, 2 * py(sm, u) - (ay + by) / 2, bx, by);
    ctx.lineTo(cx, cy);
    ctx.quadraticCurveTo(2 * px(sm, v) - (cx + ex) / 2, 2 * py(sm, v) - (cy + ey) / 2, ex, ey);
    ctx.closePath();
  };
  const wide = Math.max(1.4, size * 0.9), half = wide / 2;
  const n = clamp(Math.round(wide / 1.6), 3, MAXB), sp = wide / n;
  const facing = nx * LX + ny * LY;                                            // how squarely one edge faces the light
  const body = 0.08 + 0.12 * smooth(0.4, 2.2, size / U);                       // a broad, loaded brush leaves thicker paint
  const full = 0.68 + Math.random() * 0.2;                                     // how far the brush stays full

  // the body
  const S = 6, wob = Math.min(sp * 0.35, half * 0.2);
  const hw = t => half * Math.min(1, 0.6 + 0.4 * Math.sqrt(t / 0.12)) * (1 - 0.3 * t * t * t);
  ctx.globalAlpha = 0.84;
  ctx.fillStyle = tone(r, g, b, (Math.random() - 0.5) * 0.04);
  ctx.beginPath();
  for (let k = 0; k <= S; k++) { const t = k / S, o = hw(t) + (Math.random() - 0.5) * wob; ctx.lineTo(px(t * full, o), py(t * full, o)); }
  for (let k = S; k >= 0; k--) { const t = k / S, o = -hw(t) + (Math.random() - 0.5) * wob; ctx.lineTo(px(t * full, o), py(t * full, o)); }
  ctx.fill();

  // the bristles
  for (let i = 0; i < n; i++) {
    const e = n > 1 ? i / (n - 1) - 0.5 : 0, q = Math.random();
    BR[i * 4] = e * wide * 0.92 + (Math.random() - 0.5) * sp * 0.5;
    BR[i * 4 + 1] = e * e * 0.25 + Math.random() * 0.04;
    BR[i * 4 + 2] = clamp(full * (0.75 + 0.25 * q) + (1 - full) * q * q * 1.6 - e * e * 0.6, 0.25, 1);
    const lit = 2 * e * facing + (Math.random() - 0.5) * 0.9;                  // the side it is on, and some streaks of its own
    BR[i * 4 + 3] = lit < -0.35 ? 0 : lit > 0.35 ? 2 : 1;
  }
  const th = Math.max(0.6, sp * 0.62);
  for (let side = 0; side < 3; side++) {                                       // away from the light, the middle, towards it
    ctx.globalAlpha = side === 1 ? 0.6 : 0.72;
    ctx.fillStyle = tone(r, g, b, side === 0 ? -body * 1.3 : side === 2 ? body : (Math.random() - 0.5) * 0.08);
    ctx.beginPath();
    for (let i = 0; i < n; i++) if (BR[i * 4 + 3] === side) curve(BR[i * 4 + 1], BR[i * 4 + 2], BR[i * 4], th);
    ctx.fill();
  }

  // the lip of the stroke that catches the light, and the shadow it throws on the other side
  const f = Math.abs(facing);
  if (size < U * 0.45 || f < 0.2 || len < wide * 1.7) return;                 // a short dab has no ridge worth the name
  const toward = facing > 0 ? 1 : -1;
  ctx.globalAlpha = 0.6 * f;
  ctx.fillStyle = tone(r, g, b, body * 2.4);
  ctx.beginPath(); curve(0.06, full * (0.6 + Math.random() * 0.35), toward * half * 0.8, Math.max(0.6, sp * 0.4)); ctx.fill();
  ctx.globalAlpha = 0.4 * f;
  ctx.fillStyle = tone(r, g, b, -body * 2.6);
  const shade = Math.max(0.7, sp * 0.5);
  ctx.beginPath(); curve(0.1, full * (0.7 + Math.random() * 0.3), -toward * (half + shade * 0.4), shade); ctx.fill();
}

// ---------- what really moves ----------
const glow = (r, g, b) => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gr.addColorStop(0.25, `rgba(${r},${g},${b},0.45)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return c;
};
const FIREFLY = glow(205, 255, 120), WARM = glow(255, 190, 90);
const GLOW = { warm: WARM, pale: WARM, cool: glow(200, 222, 255), flame: glow(255, 150, 70), street: glow(214, 236, 255) };

// Falling leaves and petals: pictures in assets/sprites/, drawn by tools/sprites.html.
const picture = name => { const img = new Image(); img.decoding = 'async'; img.src = `assets/sprites/${name}.png`; return img; };
const maples = [1, 2, 3, 4, 5].map(k => picture('maple-' + k));
const LEAVES = [
  ...maples, ...maples,                                                        // the maples twice: most of what falls
  picture('ginkgo-1'), picture('ginkgo-2'), picture('leaf-1'), picture('leaf-2'), picture('leaf-3'),
];
const PETALS = [1, 2, 3, 4].map(k => picture('petal-' + k));
const blossom = picture('blossom');
const pick = list => list[Math.random() * list.length | 0];
const flakes = [];
let flakeKind = '';

function kindNow() {
  if (!scene || still) return '';
  const { season, time } = scene;
  if (season === 'spring') return 'petal';
  if (season === 'autumn') return 'leaf';
  if (season === 'winter') return 'snow';
  return time === 'day' ? '' : 'firefly';
}

function spawn(kind, anywhere) {
  const z = 0.45 + Math.random() * 0.55;
  const f = { kind, z, x: Math.random() * (W + 200) - 200, y: anywhere ? Math.random() * H : -20, p: Math.random() * TAU, q: 0.6 + Math.random() * 1.2 };
  if (kind === 'firefly') { f.x = Math.random() * W; f.y = H * (0.35 + Math.random() * 0.6); f.vx = 0; f.vy = 0; }
  else if (kind === 'leaf') f.img = pick(LEAVES);
  else f.img = Math.random() < 0.07 ? blossom : pick(PETALS);
  return f;
}

function sprites(t, dt) {
  tctx.clearRect(0, 0, W, H);
  if (!scene) return;
  const { time } = scene, night = time === 'night';

  if (night && scene.stars.length) {
    tctx.fillStyle = '#eef0ff';
    for (const s of scene.stars) {
      tctx.globalAlpha = still ? 0.7 : 0.45 + 0.4 * Math.sin(t * s.f + s.p);
      const r = s.r * (0.8 + U * 0.03);
      tctx.fillRect(view.ox + s.x * scene.w * view.s, view.oy + s.y * scene.h * view.s, r, r);
    }
  }
  if (time !== 'day') {                      // the glow about each light: street lamps steady, windows nearly, flames not at all
    tctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < scene.glows.length; k++) {
      const g = scene.glows[k], lamp = g.kind === 'lamp';
      const r = Math.max(lamp ? 4 : 5, g.r * scene.w * view.s * (lamp ? 3.6 : 3.2));
      const wave = Math.sin(t * (2.1 + (k % 5) * 0.7) + k * 1.7) * Math.sin(t * 0.9 + k);
      const flicker = still || lamp ? 1 : g.kind === 'lantern' ? 0.8 + 0.2 * wave : 0.94 + 0.06 * wave;
      tctx.globalAlpha = (night ? 0.2 : 0.1) * (lamp ? 1.2 : 1) * g.power * flicker;
      tctx.drawImage(GLOW[g.tone], view.ox + g.x * scene.w * view.s - r, view.oy + g.y * scene.h * view.s - r, r * 2, r * 2);
      if (lamp) {                                                              // the bulb: smaller than any brush, so not painted but put here
        tctx.globalCompositeOperation = 'source-over';
        tctx.globalAlpha = night ? 0.95 : 0.7;
        tctx.fillStyle = '#f4fbff';
        tctx.beginPath(); tctx.arc(view.ox + g.x * scene.w * view.s, view.oy + g.y * scene.h * view.s, Math.max(1, g.r * scene.w * view.s * 0.35), 0, TAU); tctx.fill();
        tctx.globalCompositeOperation = 'lighter';
      }
    }
    tctx.globalCompositeOperation = 'source-over';
  }

  const kind = kindNow();
  if (kind !== flakeKind) { flakeKind = kind; flakes.length = 0; }
  if (!kind) { tctx.globalAlpha = 1; return; }
  const area = W * H / 1e6;
  const want = Math.round(kind === 'snow' ? 190 * area + 40 : kind === 'firefly' ? (night ? 26 : 9) * Math.max(0.6, area) : kind === 'leaf' ? 22 * area + 8 : 34 * area + 10);
  while (flakes.length < want) flakes.push(spawn(kind, true));
  flakes.length = Math.min(flakes.length, want);
  const dim = night ? 0.55 : time === 'dusk' ? 0.85 : 1;
  const breeze = 0.6 + 0.4 * Math.sin(t * 0.3);

  for (let i = 0; i < flakes.length; i++) {
    const f = flakes[i];
    if (kind === 'firefly') {
      f.vx += (Math.sin(t * 0.7 * f.q + f.p) * 9 - f.vx) * dt; f.vy += (Math.cos(t * 0.5 * f.q + f.p * 2) * 6 - f.vy) * dt;
      f.x += f.vx * dt; f.y += f.vy * dt;
      const a = Math.pow(0.5 + 0.5 * Math.sin(t * 1.1 * f.q + f.p), 4), r = (5 + 9 * f.z) * (0.8 + U * 0.03);
      if (a < 0.02) continue;
      tctx.globalCompositeOperation = 'lighter';
      tctx.globalAlpha = a * 0.9;
      tctx.drawImage(FIREFLY, f.x - r, f.y - r, r * 2, r * 2);
      tctx.globalCompositeOperation = 'source-over';
      continue;
    }
    if (kind === 'snow') {
      f.x += (10 + 16 * breeze) * f.z * dt + Math.sin(t * f.q + f.p) * 12 * dt; f.y += (28 + 55 * f.z * f.q * 0.6) * dt;
      tctx.globalAlpha = (0.5 + 0.45 * f.z) * (night ? 0.7 : 1);
      tctx.fillStyle = night ? '#c9d2ea' : '#ffffff';
      tctx.beginPath(); tctx.arc(f.x, f.y, (0.8 + 2.2 * f.z * f.z) * (0.7 + U * 0.03), 0, TAU); tctx.fill();
    } else {
      const leaf = kind === 'leaf';
      f.x += ((leaf ? 26 : 34) + 40 * breeze) * f.z * dt + Math.sin(t * 1.3 * f.q + f.p) * 22 * dt;
      f.y += (leaf ? 46 : 30) * f.z * f.q * dt + Math.cos(t * 1.7 * f.q + f.p) * 9 * dt;
      const size = (leaf ? 4.5 + 5 * f.z : 2.6 + 3.4 * f.z) * (0.7 + U * 0.03) * (leaf ? 2.5 : 2.3);
      // tumbling: turning round, and over and back, so it shows its edge and then its other face
      const over = Math.sin(t * 2.2 * f.q + f.p), back = 0.55 + 0.45 * Math.cos(t * 1.3 * f.q + f.p * 1.7);
      tctx.globalAlpha = (0.65 + 0.35 * f.z) * dim;
      tctx.translate(f.x, f.y);
      tctx.rotate(t * f.q * (leaf ? 1.6 : 0.9) + f.p);
      tctx.scale((over < 0 ? -1 : 1) * Math.max(0.12, Math.abs(over)), back);
      if (f.img.complete && f.img.naturalWidth) tctx.drawImage(f.img, -size / 2, -size / 2, size, size);
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (f.y > H + 20 || f.x > W + 30) { flakes[i] = spawn(kind, false); if (Math.random() < 0.4) { flakes[i].x = -20; flakes[i].y = Math.random() * H; } }
  }
  tctx.globalAlpha = 1;
}

// ---------- every frame ----------
// The brush gives way to the frame rate: when frames come late (a slow machine, a large screen, a busy
// browser) it lays fewer strokes until they come on time again, so what falls and flickers on top never
// stutters; the picture only takes a little longer.  On time means close to the display's own beat,
// learnt from the frames that were (a sixtieth of a second, or less on a faster display).  Only frames
// that keep coming late count: the odd slow one, as when a picture has just been loaded, does not.
let last = 0, beat = 1 / 60, ease = 1, behind = 0;
function frame(ms) {
  const raw = (ms - last) / 1000, dt = Math.min(0.05, raw || 0.016);
  if (last && raw > 0 && raw < 0.25) {                                         // not the first frame, nor one after the tab was away
    if (raw < beat * 1.25) beat += (raw - beat) * 0.1;
    behind += ((raw > beat * 1.5 ? 1 : 0) - behind) * 0.05;                    // the share of late frames, over the last twenty or so
    ease = behind > 0.3 ? Math.max(0.25, ease * 0.97) : Math.min(1, ease + 0.003);
  }
  last = ms; clock += dt;
  if (scene) {
    const age = (clock - changedAt) * PACE, settled = age > 14;
    if (!(still && age > 18)) {
      // Paint by the area covered, not by the stroke: a broad brush gets few strokes a second, a fine
      // one many, so a new picture comes on at a walking pace and never as a flurry.
      // Larger screens get more strokes, for finer work; small ones never fewer than a 1280 x 720 one,
      // or a phone would be left with gaps.
      // The outlines get fine strokes of their own from a moment after the first broad ones, but only out
      // of what the brush can spare: never more strokes in a frame than at its busiest without them, and
      // once the picture stands, a sixth of the same number it always had.
      const steady = clamp(W * H / 4200, 220, 420), b = broad(age);
      let count = steady * (settled ? 0.6 : PACE * (0.2 + 0.8 * smooth(2, 12, age)) / (b * b)), keen;
      if (settled) { keen = count / 6; count -= keen; }
      else keen = Math.min(steady * 0.4 * smooth(0.4, 3, age), Math.max(0, steady * PACE - count));
      for (owed = Math.min(owed + count * ease * dt * 60, 600); owed >= 1; owed--) stroke(clock, age, settled, scene, ctx, view, false);
      for (sharp = Math.min(sharp + keen * ease * dt * 60, 300); sharp >= 1; sharp--) stroke(clock, age, settled, scene, ctx, view, true);
      ctx.globalAlpha = 1;
    }
    sprites(clock, dt);
  }
  requestAnimationFrame(frame);
}

// ---------- choosing: follow Berlin ----------
const where = document.getElementById('place');
let asked = 0;
async function show() {
  const mine = ++asked;
  const place = PLACES.find(p => p.id === state.place);
  document.title = `${place.name} - starsbit.space`;
  where.querySelector('.label').textContent = place.kanji;
  where.querySelector('.name').textContent = place.name;
  try {
    const [base, mask] = await Promise.all([loadSeason(place, state.season), loadMask(place)]);
    const festival = place.id === FESTIVAL.place && +berlinMonth.format(new Date()) === FESTIVAL.month ? FESTIVAL.lanterns : [];
    if (mine !== asked) return;
    scene = grade(place, state.season, state.time, base, mask, festival);
    view = viewOf(scene);
    changedAt = clock;
    chorus();
  } catch (e) {
    console.error(e);
  }
}

// Watanagashi, in June: paper lanterns hung along the shrine's front for the festival, lit from dusk.
// Points are on the 2000 px wide print, as the lights in tools/build_paintings.py: x, y and radius.
const FESTIVAL = {
  place: 'furude-shrine', month: 6,
  lanterns: [[450, 578, 15], [590, 580, 15], [730, 580, 15], [850, 580, 14], [1070, 580, 14], [1190, 580, 15], [1330, 580, 15], [1470, 578, 15]],
};

// A season or an hour can be picked by hand, at the bottom; whatever has not been picked goes on
// following Berlin.  Nothing is remembered: every visit begins with the season and the hour as they are.
const chosen = { season: null, time: null };
const almanac = document.getElementById('almanac'), clockEl = document.querySelector('#clock time');
const clockFmt = new Intl.DateTimeFormat('de-DE', { timeZone: ZONE, hour: '2-digit', minute: '2-digit' });
let live = berlinScene();
function tick() {
  live = berlinScene();
  const want = { season: chosen.season || live.season, time: chosen.time || live.time };
  if (want.season !== state.season || want.time !== state.time) {
    Object.assign(state, want);
    show();
  }
  clockEl.textContent = clockFmt.format(new Date());
  for (const b of almanac.querySelectorAll('[data-season], [data-time]')) {
    const k = b.dataset.season ? 'season' : 'time', v = b.dataset[k];
    b.setAttribute('aria-pressed', state[k] === v);
    b.classList.toggle('now', live[k] === v);
  }
  almanac.querySelector('.reset').disabled = !(chosen.season || chosen.time);
}

// ---------- going round: a click (or a key) takes you on to the next place, and from the last back to the first ----------
// The arrows at the sides go either way: the one on the left back to the place before.
function next(step = 1) {
  const i = PLACES.findIndex(p => p.id === state.place), n = PLACES.length;
  location.hash = PLACES[(i + step + n) % n].id;
}

// ---------- music: off until asked for, and then only quietly, in the background ----------
// The recording is mastered loud (about -18 dB on average); at a fifth of full volume (-14 dB) the piano
// stays behind the painting.  It goes through Web Audio because iOS will not let a page set an
// <audio>'s volume, and it fades in and out rather than starting and stopping.
// With the music on, the higurashi, the evening cicadas, are heard in the trees now and then: half a
// minute or so of them, then a minute to three of quiet, in any season; and all evening on a summer dusk,
// their own hour (assets/higurashi.mp3, their sound from the game).  Their loop plays along unheard the
// whole time the music is on and is only turned up and down, so it never has to be started without a click.
const music = document.getElementById('music'), tune = document.getElementById('tune'), cicadas = document.getElementById('cicadas');
const QUIET = 0.2, CICADAS = 0.2;                                           // the cicadas a little under the piano
let audio = null, gain = null, cgain = null, singing = false, spell = 0;
const fade = (g, to, seconds) => {
  const t = audio.currentTime;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(to, t + seconds);
};
function sing(want) {
  if (want === singing) return;
  singing = want;
  if (cgain) fade(cgain.gain, want ? CICADAS : 0, want ? 5 : 4);
  else cicadas.volume = want ? CICADAS : 0;
}
// on a click of the music, and whenever the picture changes
function chorus() {
  const on = music.getAttribute('aria-pressed') === 'true', evening = !!scene && scene.season === 'summer' && scene.time === 'dusk';
  if (!on || evening) { clearTimeout(spell); spell = 0; sing(on && evening); return; }
  if (!spell) spell = setTimeout(turn, (singing ? 20 + Math.random() * 20 : 8 + Math.random() * 25) * 1000);   // the first soon after the music starts
}
function turn() {
  sing(!singing);
  spell = setTimeout(turn, (singing ? 25 + Math.random() * 25 : 60 + Math.random() * 120) * 1000);
}
function sound(on) {
  if (on && !audio) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      audio = new AC();
      gain = audio.createGain();
      gain.gain.value = 0;
      audio.createMediaElementSource(tune).connect(gain).connect(audio.destination);
      cgain = audio.createGain();
      cgain.gain.value = 0;
      audio.createMediaElementSource(cicadas).connect(cgain).connect(audio.destination);
    }
  }
  if (!cgain) cicadas.volume = 0;
  if (on) cicadas.play().catch(() => {}); else setTimeout(() => { if (music.getAttribute('aria-pressed') !== 'true') cicadas.pause(); }, 4100);
  music.setAttribute('aria-pressed', on);
  music.setAttribute('aria-label', on ? 'Mute music' : 'Play music');
  chorus();
  if (gain) {
    const g = gain.gain, t = audio.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(on ? QUIET : 0, t + (on ? 3 : 1.2));
  } else {
    tune.volume = on ? QUIET : 0;
  }
  if (on) {
    if (audio) audio.resume();
    tune.play().catch(() => sound(false));
  } else {
    setTimeout(() => { if (music.getAttribute('aria-pressed') !== 'true') tune.pause(); }, 1300);
  }
}
music.addEventListener('click', () => sound(music.getAttribute('aria-pressed') !== 'true'));

// ---------- the logo, and the card about who painted this ----------
// The card is put away with a little ceremony (see #about in the style sheet), so it is only hidden
// once that is over; until then it counts as closed already.
const logo = document.getElementById('logo'), about = document.getElementById('about');
about.querySelector('.year').textContent = new Date().getFullYear();
const reading = () => about.classList.contains('open');
let putting = 0;
function card(open) {
  clearTimeout(putting);
  logo.setAttribute('aria-expanded', open);
  if (open) {
    about.hidden = false;
    about.getBoundingClientRect();                                             // let it be drawn rolled up first, so it unrolls
    about.classList.add('open');
    about.focus({ preventScroll: true });
  } else {
    about.classList.remove('open');
    putting = setTimeout(() => { about.hidden = true; }, still ? 0 : 560);
  }
}
logo.addEventListener('click', () => card(!reading()));

// ---------- the season and the hour, picked at the bottom ----------
almanac.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.season) chosen.season = b.dataset.season === live.season ? null : b.dataset.season;   // the season it is is no pick
  else if (b.dataset.time) chosen.time = b.dataset.time === live.time ? null : b.dataset.time;
  else if (b.classList.contains('reset')) { chosen.season = chosen.time = null; }
  tick();
});

canvas.addEventListener('click', () => { if (reading()) card(false); else next(); });   // a click beside the card only puts it away
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && reading()) { card(false); logo.focus(); return; }
  const t = e.target.closest ? e.target : null, walk = t && t.closest('.walk');
  if (!walk && t && t.closest('a, button, #about')) return;                                   // keys meant for a link, a button or the card
  // on one of the arrows, space and enter are its own click; the arrow keys work wherever
  if (e.key === 'ArrowRight' || (!walk && (e.key === ' ' || e.key === 'Enter'))) { e.preventDefault(); next(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); next(-1); }
});
for (const [id, step] of [['prev', -1], ['next', 1]]) {
  document.getElementById(id).addEventListener('click', () => { if (reading()) card(false); next(step); });
}
function go() {
  const id = location.hash.replace(/^#\/?/, '').split('/')[0];
  if (id === state.place || !PLACES.some(p => p.id === id)) return;
  state.place = id;
  show();
}
window.addEventListener('hashchange', go);

let resizing = 0;
window.addEventListener('resize', () => { clearTimeout(resizing); resizing = setTimeout(resize, 120); });
resize();
show();
tick();
setInterval(tick, 1000);
requestAnimationFrame(frame);
})();
