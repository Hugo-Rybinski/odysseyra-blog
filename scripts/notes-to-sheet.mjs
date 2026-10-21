#!/usr/bin/env node
// Turns a trip's notes.md (and the camera/ folder next to it) into the data half of a sheet:
// src/content/trips/<slug>/trip.yaml and photos/. The prose (fr.mdx, en.mdx) is written separately, from the same notes.
//
//   npm run sheet -- <notes.md> --en <en.json> [--force] [--missing]
//
// Only what notes.md ticks is published: `- [x]` points go on the maps, `- [x]` photos into photos/. Photos are
// exported as JPEG of at most 4000 px with their camera data in EXIF and no GPS (the stages and sights already say
// where the trip went; the files must not say where we slept).
//
// English: notes.md is in French. Names without an `en:` and every photo's alt text and caption come from <en.json>:
//   { "points": { "<id>": "English name" }, "photos": { "<id>": { "alt": "…", "caption": "…" } } }
// --missing prints what the file still lacks (with the French to translate) and writes nothing.
// The sheet is written as `draft: true` (it shows in `astro dev`, not on the live site) until the notes' front matter
// says `draft: false`; `written` and `updated` (the edition and revision dates) come from there too.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import exifr from 'exifr';
import sharp from 'sharp';
import YAML from 'yaml';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i < 0 ? undefined : args[i + 1]; };
const notesFile = args.find((a) => !a.startsWith('--') && a !== opt('en'));
if (!notesFile) { console.error('usage: npm run sheet -- <notes.md> --en <en.json> [--force] [--missing]'); process.exit(1); }
const md = fs.readFileSync(notesFile, 'utf8');
const cameraDir = path.join(path.dirname(notesFile), 'camera');
const en = opt('en') && fs.existsSync(opt('en')) ? JSON.parse(fs.readFileSync(opt('en'), 'utf8')) : { points: {}, photos: {} };

// ——— Front matter ———
const front = YAML.parse(md.match(/^---\n([\s\S]*?)\n---/)[1]);
for (const k of ['slug', 'sheet', 'code', 'country', 'start', 'end', 'cover', 'title', 'description']) {
  if (front[k] == null || front[k] === '') throw new Error(`notes.md front matter: "${k}" is empty`);
}

// ——— Regions: the yaml block and the ticked points under each "## Région" heading ———
const decode = (s) => {
  const pts = []; let i = 0, lat = 0, lng = 0;
  const next = () => { let r = 0, sh = 0, b; do { b = s.charCodeAt(i++) - 63; r |= (b & 0x1f) << sh; sh += 5; } while (b >= 0x20); return r & 1 ? ~(r >> 1) : r >> 1; };
  while (i < s.length) { lat += next(); lng += next(); pts.push([lat / 1e5, lng / 1e5]); }
  return pts;
};
// `- [x] `id` · kind (nuits 3, 4) · nom FR · en: name EN · lat, lng · notes…`
const POINT = /^- \[(x| )\] `([^`]+)` · (stage|sight|detour)(?: \(nuits ([\d, ]+)\))? · (.+?)(?: · en: (.+?))? · (-?\d+\.\d+), (-?\d+\.\d+)(?: · |$)/;
const sections = md.split(/^## /m).slice(1);
const regions = [];
const missing = { points: {}, photos: {} };
for (const sec of sections) {
  const lines = sec.split('\n');
  const yamlBlock = sec.match(/```yaml\n([\s\S]*?)```/);
  const ticked = lines.map((l) => l.match(POINT)).filter((m) => m && m[1] === 'x');
  if (!yamlBlock) {
    if (ticked.length) console.warn(`"## ${lines[0]}": ${ticked.length} ticked point(s) outside a region are left out: ${ticked.map((m) => m[2]).join(', ')}`);
    continue;
  }
  const r = YAML.parse(yamlBlock[1]);
  const points = ticked.map((m) => {
    const [, , id, kind, nights, fr, enName, lat, lng] = m;
    const english = enName ?? en.points?.[id];
    if (!english) missing.points[id] = fr;
    return { id, kind, name: { fr, en: english ?? fr }, at: [Number(lat), Number(lng)], ...(nights ? { nights: nights.split(',').map(Number) } : {}) };
  });
  regions.push({
    id: r.id, name: r.name, days: r.days,
    route: (r.route ?? []).map((s) => ({ ...(s.approx ? { approx: true } : {}), path: typeof s.path === 'string' ? decode(s.path) : s.path })),
    points,
  });
}

// ——— Photos: `- [x] **KGZ-12** · …`, then `  - alt : …` and `  - légende : …` ———
const photos = [];
for (const m of md.matchAll(/^- \[(x| )\] \*\*([A-Z]{3}-\d+)\*\*.*\n {2}- alt : (.*)\n {2}- légende : (.*)$/gm)) {
  const [, tick, id, altFr, capFr] = m;
  if (tick !== 'x') continue;
  const t = en.photos?.[id];
  if (!t?.alt || (capFr.trim() && !t?.caption)) missing.photos[id] = { alt: altFr.trim(), caption: capFr.trim() };
  photos.push({ id, file: `${id}.jpg`, alt: { fr: altFr.trim(), en: t?.alt ?? altFr.trim() }, ...(capFr.trim() ? { caption: { fr: capFr.trim(), en: t?.caption ?? capFr.trim() } } : {}) });
}
if (!photos.some((p) => p.id === front.cover)) throw new Error(`cover ${front.cover} is not a ticked photo`);

const nMissing = Object.keys(missing.points).length + Object.keys(missing.photos).length;
if (args.includes('--missing')) { console.log(JSON.stringify(missing, null, 1)); process.exit(0); }
if (nMissing) {
  console.error(`${nMissing} English text(s) missing from ${opt('en') ?? '(no --en file)'}: run with --missing to list them.`);
  process.exit(1);
}

// ——— trip.yaml ———
const out = path.join(repo, 'src/content/trips', front.slug);
fs.mkdirSync(path.join(out, 'photos'), { recursive: true });
const data = {
  sheet: front.sheet, code: front.code, country: front.country, start: front.start, end: front.end, draft: front.draft ?? true, cover: front.cover,
  ...(front.written ? { written: front.written } : {}),
  ...(front.updated ? { updated: front.updated } : {}),
  ...(front.distanceKm ? { distanceKm: front.distanceKm } : {}),
  ...(front.travellers ? { travellers: front.travellers } : {}),
  ...(front.costPerPerson?.amount ? { costPerPerson: front.costPerPerson } : {}),
  photos, regions,
};
const flow = (v) => YAML.stringify(v, { collectionStyle: 'flow', lineWidth: 0 }).trim();
const yamlOut = [
  `# Generated from notes.md by scripts/notes-to-sheet.mjs. Edit notes.md and regenerate rather than editing here.`,
  ...['sheet', 'code', 'country', 'start', 'end', 'draft', 'written', 'updated', 'cover', 'distanceKm', 'travellers', 'costPerPerson']
    .filter((k) => data[k] != null).map((k) => `${k}: ${/^(start|end|written|updated)$/.test(k) ? new Date(data[k]).toISOString().slice(0, 10) : flow(data[k])}`),
  'photos:', ...photos.map((p) => `  - ${flow(p)}`),
  'regions:', ...regions.flatMap((r) => [
    `  - id: ${r.id}`, `    name: ${flow(r.name)}`, `    days: ${flow(r.days)}`,
    r.route.length ? '    route:' : '    route: []', ...r.route.map((s) => `      - ${flow(s)}`),
    r.points.length ? '    points:' : '    points: []', ...r.points.map((p) => `      - ${flow(p)}`),
  ]),
].join('\n') + '\n';
fs.writeFileSync(path.join(out, 'trip.yaml'), yamlOut);

// ——— Photos: 4000 px JPEG, camera data in EXIF, no GPS ———
const ratio = (v) => { if (v == null) return undefined; const s = String(v); if (/^\d+\/\d+$/.test(s)) return s; const n = Number(s); return n < 1 ? `1/${Math.round(1 / n)}` : `${Math.round(n * 10)}/10`; };
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== ''));
// "SONY" → "Sony"; Lightroom's lens profile name is the readable one ("TAMRON 28-200mm F/2.8-5.6 Di III RXD A071").
const make = (s) => (s && s === s.toUpperCase() ? s[0] + s.slice(1).toLowerCase() : s);
const lensName = (e) => {
  const prof = e?.LensProfileName?.match(/\(([^,)]+)/)?.[1];
  return prof ? prof.replace(/^([A-Z]+)\b/, (w) => make(w)).replace(/\s+[A-Z]\d{3}$/, '') : e?.LensModel;
};
const keep = new Set(photos.map((p) => p.file));
for (const f of fs.readdirSync(path.join(out, 'photos'))) if (!keep.has(f)) fs.rmSync(path.join(out, 'photos', f));
let written = 0;
for (const p of photos) {
  const dest = path.join(out, 'photos', p.file);
  if (fs.existsSync(dest) && !args.includes('--force')) continue;
  const src = ['png', 'jpg', 'jpeg', 'tif', 'tiff'].map((x) => path.join(cameraDir, `${p.id}.${x}`)).find((f) => fs.existsSync(f));
  if (!src) throw new Error(`${p.id}: no file in ${cameraDir}`);
  const e = await exifr.parse(src, { xmp: true, reviveValues: false }).catch(() => null);
  await sharp(src)
    .rotate()
    .resize({ width: 4000, height: 4000, fit: 'inside', withoutEnlargement: true })
    .withExif({
      IFD0: clean({ Make: make(e?.Make), Model: e?.Model }),
      IFD2: clean({
        LensModel: lensName(e), FNumber: ratio(e?.FNumber), ExposureTime: ratio(e?.ExposureTime),
        ISOSpeedRatings: e?.ISOSpeedRatings != null ? String(e.ISOSpeedRatings) : undefined, FocalLength: ratio(e?.FocalLength),
        DateTimeOriginal: e?.DateTimeOriginal ? String(e.DateTimeOriginal).slice(0, 19).replace('T', ' ').replace(/-/g, ':') : undefined,
      }),
    })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(dest);
  written++;
}
console.log(`${front.slug}: ${regions.length} regions, ${regions.reduce((t, r) => t + r.points.length, 0)} points, ${regions.reduce((t, r) => t + r.route.length, 0)} legs, ${photos.length} photos (${written} written)`);
