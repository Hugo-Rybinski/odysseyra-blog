// Procedural, seamlessly tiling paper texture: a sheet that has been handled and scanned. No creases or folds, only the
// paper itself: broad, soft unevenness (it never lies perfectly flat) and the fine tooth of the fibres.
// Writes fold-shade.webp (multiply: white = no change) and fold-lit.webp (screen: black = no change).
// Usage: node src/assets/textures/generate.mjs src/assets/textures 1200 800 11
import { createRequire } from 'node:module';
const sharp = createRequire(import.meta.url)('sharp');

const [outDir, W = 1200, H = 800, seed = 11] = process.argv.slice(2).map((v, i) => (i ? Number(v) : v));
let s = seed;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const TAU = Math.PI * 2;
// Periodic triangle wave in [-0.5, 0.5], period 1: one straight crease on the torus, planar on either side.
const tri = (t) => Math.abs((((t % 1) + 1) % 1) - 0.5) - 0.25;

function blob() {
  const terms = Array.from({ length: 3 }, () => ({ i: 1 + Math.floor(rnd() * 2), j: Math.floor(rnd() * 3), p: rnd() * TAU, q: rnd() * TAU }));
  return (u, v) => terms.reduce((a, t) => a + Math.sin(TAU * t.i * u + t.p) * Math.cos(TAU * t.j * v + t.q), 0) / terms.length;
}

// Periodic domain warp: bends every crease, so none runs ruler-straight. Integer frequencies keep the tile seamless.
function warpField(amp, fmin, fmax, n) {
  const t = Array.from({ length: n }, () => ({ i: fmin + Math.floor(rnd() * (fmax - fmin + 1)), j: fmin + Math.floor(rnd() * (fmax - fmin + 1)), p: rnd() * TAU, q: rnd() * TAU, a: amp * (0.5 + rnd()) / n }));
  return (u, v) => t.reduce((acc, k) => acc + k.a * Math.sin(TAU * (k.i * u + k.j * v) + k.p) * Math.cos(TAU * (k.j * u - k.i * v) + k.q), 0);
}
const wu = [warpField(0.09, 1, 3, 4), warpField(0.018, 4, 9, 5)], wv = [warpField(0.09, 1, 3, 4), warpField(0.018, 4, 9, 5)];
const warp = (u, v) => [u + wu[0](u, v) + wu[1](u, v), v + wv[0](u, v) + wv[1](u, v)];

// Long soft creases from handling, plus short sharp wrinkles that live only where their mask is high.
const make = (n, range, amp, bias) => Array.from({ length: n }, () => {
  let i = Math.floor(rnd() * (2 * range + 1)) - range, j = Math.floor(rnd() * (2 * range + 1)) - range;
  if (!i && !j) j = 1;
  return { i, j, c: rnd(), a: amp * (0.4 + rnd() * 0.6) * (rnd() < 0.5 ? -1 : 1), mask: blob(), bias, own: warpField(0.03, 2, 6, 3) };
});
const creases = make(12, 2, 0.7, 0.15);

let h = new Float32Array(W * H);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const [u, v] = warp(x / W, y / H);
    let z = 0;
    for (const k of creases) {
      const m = Math.max(0, k.mask(x / W, y / H) + k.bias);
      if (m) z += k.a * m * tri(k.i * u + k.j * v + k.c + k.own(u, v));
    }
    h[y * W + x] = z;
  }

// Soften: paper bends, it does not fold everywhere. Three wrapped box blurs approximate a gaussian.
function blur(src, r) {
  const tmp = new Float32Array(W * H), out = new Float32Array(W * H), n = 2 * r + 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let a = 0; for (let k = -r; k <= r; k++) a += src[y * W + ((x + k + W) % W)]; tmp[y * W + x] = a / n; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let a = 0; for (let k = -r; k <= r; k++) a += tmp[((y + k + H) % H) * W + x]; out[y * W + x] = a / n; }
  return out;
}
// Heavily smoothed: the facet edges melt into gentle undulation, with no line left to read as a crease.
for (let p = 0; p < 4; p++) h = blur(h, 22);

const L = [-0.5, -0.6, 0.62];
const ll = Math.hypot(...L);
const shade = new Float32Array(W * H), lit = new Float32Array(W * H);
const at = (x, y) => h[((y + H) % H) * W + ((x + W) % W)];
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * W * 0.05, dy = (at(x, y + 1) - at(x, y - 1)) * H * 0.05;
    const len = Math.hypot(dx, dy, 1);
    const d = ((-dx * L[0] - dy * L[1] + L[2]) / len - L[2]) / ll;
    shade[y * W + x] = Math.max(0, -d);
    lit[y * W + x] = Math.max(0, d);
  }

const S = Buffer.alloc(W * H), B = Buffer.alloc(W * H);
for (let i = 0; i < W * H; i++) {
  const g = (rnd() - 0.5) * 0.035; // paper tooth
  S[i] = Math.round(255 * (1 - 0.42 * Math.tanh(shade[i] * 2.2 + Math.max(0, -g))));
  B[i] = Math.round(255 * 0.6 * Math.tanh(lit[i] * 1.8 + Math.max(0, g)));
}
const opts = { raw: { width: W, height: H, channels: 1 } };
await sharp(S, opts).webp({ quality: 80 }).toFile(`${outDir}/fold-shade.webp`);
await sharp(B, opts).webp({ quality: 80 }).toFile(`${outDir}/fold-lit.webp`);
console.log('ok');
