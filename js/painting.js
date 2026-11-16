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

// How high the sun stands over Berlin right now, in degrees (a low-precision solar position, good to
// a fraction of a degree, which is a minute or two of the clock).
const DEG = Math.PI / 180, LAT = 52.52, LON = 13.405;
function sunHeight(ms) {
  const d = ms / 864e5 - 10957.5;                                              // days since 2000-01-01 12:00 UTC
  const g = (357.529 + 0.98560028 * d) * DEG, q = 280.459 + 0.98564736 * d;  // mean anomaly, mean longitude
  const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG, e = (23.439 - 3.6e-7 * d) * DEG;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / DEG, dec = Math.asin(Math.sin(e) * Math.sin(L));
  const ha = (280.46061837 + 360.98564736629 * d + LON - ra) * DEG;           // hour angle
  return Math.asin(Math.sin(LAT * DEG) * Math.sin(dec) + Math.cos(LAT * DEG) * Math.cos(dec) * Math.cos(ha)) / DEG;
}
// Day while the sun is more than 8° up; dusk (and dawn) while it is low or just under, golden hour and
// twilight; night once it is more than 8° down.  In Berlin that gives each of the three at least
// three and a half hours on every day of the year: dusk between 3.5 and 4.8 hours, day and night
// never under 4.6.
const LOW = 8;
function berlinScene() {
  const m = +berlinMonth.format(new Date()) - 1, h = sunHeight(Date.now());
  return {
    season: m < 2 || m === 11 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn',
    time: h > LOW ? 'day' : h > -LOW ? 'dusk' : 'night',
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
function grade(place, season, time, base, mask) {
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
  if (night || dusk) {
    const f = night ? 1 : 0.5;
    for (const [lx, ly, lr] of place.lights) add(lx * w, ly * h, Math.max(1.6, lr * w), 5, 250 * f, 170 * f, 70 * f, false);
  }
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
  return { place, season, time, w, h, col, ang, det, sky: mask.sky, veg: mask.veg, water: mask.water, stars };
}

// ---------- the canvases ----------
const canvas = document.getElementById('scene'), ctx = canvas.getContext('2d', { alpha: false });
const top = document.getElementById('sprites'), tctx = top.getContext('2d');
let W = 0, H = 0, U = 10, dpr = 1;
let scene = null;                        // what the brush is looking at
let view = { s: 1, ox: 0, oy: 0 };       // where the picture lies on the screen
let changedAt = 0, clock = 0, owed = 0;

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
  ctx.lineCap = 'round';
  ctx.fillStyle = state.time === 'night' ? '#10131d' : state.time === 'dusk' ? '#4a3836' : '#d9d2c2';   // bare paper
  ctx.fillRect(0, 0, W, H);
  flakes.length = 0;
  if (scene) view = viewOf(scene);
  changedAt = clock;
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
function stroke(t, age, settled, sc, ctx, view) {
  const w = sc.w, h = sc.h;
  // Where: the next point of a low-discrepancy sequence (R2), so the strokes spread evenly over the
  // canvas and no spot is left unpainted by chance, nudged a little so they never fall in a pattern.
  spot = (spot + 1) % 1e9;
  const x = (((0.5 + spot * 0.7548776662466927) % 1) + (Math.random() - 0.5) * 0.004) * W;
  const y = (((0.5 + spot * 0.5698402909980532) % 1) + (Math.random() - 0.5) * 0.004) * H;
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
  const calm = smooth(3, 12, age);                                             // the longer it stands, the finer the work
  let size = U * (0.42 + (1.9 - 1.0 * calm) * rnd * rnd * (1 + calm * (rnd - 1))) * broad(age);
  let len = size * (veg ? 1.1 + Math.random() : 1.6 + 1.8 * Math.random());
  const ca = Math.cos(a), sa = Math.sin(a);
  // keep the broad strokes off the fine things
  const ex = clamp((sx + ca * len * 0.5 / view.s) | 0, 0, w - 1), ey = clamp((sy + sa * len * 0.5 / view.s) | 0, 0, h - 1);
  const fx = clamp((sx - ca * len * 0.5 / view.s) | 0, 0, w - 1), fy = clamp((sy - sa * len * 0.5 / view.s) | 0, 0, h - 1);
  const d = Math.max(d0, sc.det[ey * w + ex], sc.det[fy * w + fx]);
  const fine = 1 - 0.72 * smooth(0.05, 0.5, d) * smooth(0.5, 6, age);          // loose at first, careful later
  size *= fine; len *= fine;

  const hx = ca * len * 0.5, hy = sa * len * 0.5, nx = -sa, ny = ca;
  const bend = (Math.random() - 0.5) * len * 0.3;
  ctx.globalAlpha = 0.84;
  ctx.lineWidth = Math.max(0.8, size * 0.34);
  for (let k = -1; k <= 1; k++) {                                              // three bristles, each a shade apart
    const o = k * size * 0.27, s = 1 + (Math.random() - 0.5) * 0.12;
    ctx.strokeStyle = `rgb(${r * s | 0},${g * s | 0},${b * s | 0})`;
    ctx.beginPath();
    ctx.moveTo(x - hx + nx * o, y - hy + ny * o);
    ctx.quadraticCurveTo(x + nx * (o + bend), y + ny * (o + bend), x + hx + nx * o, y + hy + ny * o);
    ctx.stroke();
  }
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
const FIREFLY = glow(205, 255, 120), LAMP = glow(255, 190, 90);

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
  if (time !== 'day') {                                                        // lamps and windows, never quite steady
    tctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < scene.place.lights.length; k++) {
      const [lx, ly, lr] = scene.place.lights[k];
      const r = Math.max(5, lr * scene.w * view.s * 3.2);
      tctx.globalAlpha = (night ? 0.2 : 0.1) * (still ? 1 : 0.8 + 0.2 * Math.sin(t * (2.1 + (k % 5) * 0.7) + k * 1.7) * Math.sin(t * 0.9 + k));
      tctx.drawImage(LAMP, view.ox + lx * scene.w * view.s - r, view.oy + ly * scene.h * view.s - r, r * 2, r * 2);
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
let last = 0;
function frame(ms) {
  const dt = Math.min(0.05, (ms - last) / 1000 || 0.016);
  last = ms; clock += dt;
  if (scene) {
    const age = (clock - changedAt) * PACE, settled = age > 14;
    if (!(still && age > 18)) {
      // Paint by the area covered, not by the stroke: a broad brush gets few strokes a second, a fine
      // one many, so a new picture comes on at a walking pace and never as a flurry.
      // Larger screens get more strokes, for finer work; small ones never fewer than a 1280 x 720 one,
      // or a phone would be left with gaps.
      const steady = clamp(W * H / 4200, 220, 420), b = broad(age);
      const count = steady * (settled ? 0.6 : PACE * (0.2 + 0.8 * smooth(2, 12, age)) / (b * b));
      for (owed = Math.min(owed + count * dt * 60, 600); owed >= 1; owed--) stroke(clock, age, settled, scene, ctx, view);
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
  document.title = `${place.name} — starsbit.space`;
  where.querySelector('.label').textContent = place.kanji;
  where.querySelector('.name').textContent = place.name;
  try {
    const [base, mask] = await Promise.all([loadSeason(place, state.season), loadMask(place)]);
    if (mine !== asked) return;
    scene = grade(place, state.season, state.time, base, mask);
    view = viewOf(scene);
    changedAt = clock;
  } catch (e) {
    console.error(e);
  }
}

const clockEl = document.querySelector('#clock time');
const clockFmt = new Intl.DateTimeFormat('de-DE', { timeZone: ZONE, hour: '2-digit', minute: '2-digit' });
function tick() {
  clockEl.textContent = clockFmt.format(new Date());
  const now = berlinScene();
  if (now.season !== state.season || now.time !== state.time) {
    Object.assign(state, now);
    show();
  }
}

// ---------- going round: a click (or a key) takes you on to the next place, and from the last back to the first ----------
function next() {
  const i = PLACES.findIndex(p => p.id === state.place);
  location.hash = PLACES[(i + 1) % PLACES.length].id;
}

// ---------- music: off until asked for, and then only quietly, in the background ----------
// The recording is mastered loud (about -18 dB on average); at a fifth of full volume (-14 dB) the piano
// stays behind the painting.  It goes through Web Audio because iOS will not let a page set an
// <audio>'s volume, and it fades in and out rather than starting and stopping.
const music = document.getElementById('music'), tune = document.getElementById('tune');
const QUIET = 0.2;
let audio = null, gain = null;
function sound(on) {
  if (on && !audio) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      audio = new AC();
      gain = audio.createGain();
      gain.gain.value = 0;
      audio.createMediaElementSource(tune).connect(gain).connect(audio.destination);
    }
  }
  music.setAttribute('aria-pressed', on);
  music.setAttribute('aria-label', on ? 'Mute music' : 'Play music');
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

// ---------- the seal, and the card about who painted this ----------
const seal = document.getElementById('seal'), about = document.getElementById('about');
about.querySelector('.year').textContent = new Date().getFullYear();
function card(open) {
  about.hidden = !open;
  seal.setAttribute('aria-expanded', open);
  if (open) about.focus({ preventScroll: true });
}
seal.addEventListener('click', () => card(about.hidden));

canvas.addEventListener('click', () => { if (!about.hidden) card(false); else next(); });   // a click beside the card only puts it away
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !about.hidden) { card(false); seal.focus(); return; }
  if (e.target.closest && e.target.closest('a, button, #about')) return;                       // keys meant for a link or the seal
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); }
});
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
