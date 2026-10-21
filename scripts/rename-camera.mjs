#!/usr/bin/env node
// Renames a trip's camera photos <CODE>-<index> in the order they were taken (KGZ-01 … KGZ-89: the index as many
// digits as the count needs), corrects their embedded capture time, and gives them the position of the phone at that
// moment:
//
//   npm run camera -- <inbox>/camera --code KGZ [--offset +4h] [--zone +06:00] [--timeline <csv>] [--dry-run]
//
//   --offset    the camera's clock was wrong: shifts the time, its time zone kept ("+4h", "-1h30", "+0:03:20", "+95s")
//   --zone      the clock was right, on another zone: the same moment, written in this zone's local time ("+06:00")
//   --timeline  the phone's timeline (npm run timeline); by default <inbox>/actual_timeline.csv, when there is one
//
// A camera left on home time abroad wrote the right moment with the home zone: --zone fixes it, --offset alone would
// move every photo by the zone difference. Both can be combined (zone first, then offset).
//
// The times corrected: the capture date and the digitised date, with their zones, in the EXIF (JPEG, TIFF-based) and
// in the XMP (PNG and JPEG, as Lightroom writes it). The image data is not re-encoded. Each run applies the offset
// again: run it once, or check with --dry-run first.
//
// The position: the timeline point closest in time to the (corrected) capture time, if one is within 5 minutes;
// otherwise none. Written as XMP GPS fields (exif:GPSLatitude, exif:GPSLongitude), replacing any written before, so a
// photo with no point near enough loses an earlier one. Published photos must not carry it: import-trip.mjs drops it.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { parseArgs } from 'node:util';

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    code: { type: 'string' },
    offset: { type: 'string', default: '0' },
    zone: { type: 'string' },
    timeline: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
  },
});
const dir = positionals[0] && path.resolve(positionals[0]);
const fail = (msg) => {
  console.error(`camera: ${msg}`);
  process.exit(1);
};
if (!dir || !opt.code) fail('usage: npm run camera -- <camera folder> --code KGZ [--offset +4h] [--zone +06:00] [--timeline <csv>] [--dry-run]');
if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) fail(`${dir}: no such folder`);
if (!/^[A-Z]{3}$/.test(opt.code)) fail(`--code "${opt.code}": three capital letters`);

const HOUR = 3_600_000;
function parseOffset(s) {
  const m = s.trim().match(/^([+-])?(?:(\d+)h(\d+)?|(\d+):(\d\d)(?::(\d\d))?|(\d+)s|(\d+)m(?:in)?|(0))$/);
  if (!m) fail(`--offset "${s}": write "+4h", "-1h30", "+0:03:20" or "+95s"`);
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (m[2] != null ? Number(m[2]) * HOUR + Number(m[3] ?? 0) * 60_000
    : m[4] != null ? Number(m[4]) * HOUR + Number(m[5]) * 60_000 + Number(m[6] ?? 0) * 1000
    : m[7] != null ? Number(m[7]) * 1000
    : m[8] != null ? Number(m[8]) * 60_000 : 0);
}
/** "+06:00", "+0600", "Z" → minutes east of UTC. */
function zoneMinutes(s) {
  if (s === 'Z') return 0;
  const m = s?.match(/^([+-])(\d\d):?(\d\d)$/);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : null;
}
const offset = parseOffset(opt.offset);
const zone = opt.zone == null ? null : zoneMinutes(opt.zone);
if (opt.zone != null && zone == null) fail(`--zone "${opt.zone}": write "+06:00"`);
const retime = offset !== 0 || zone != null;

const pad = (n, w = 2) => String(n).padStart(w, '0');
const formatZone = (min) => `${min < 0 ? '-' : '+'}${pad(Math.floor(Math.abs(min) / 60))}:${pad(Math.abs(min) % 60)}`;

/** The corrected local time, as ms read as UTC: into the new zone (the moment kept), then shifted. */
function shift(local, fromZone) {
  let t = local;
  if (zone != null) {
    if (fromZone == null) return null;
    t += (zone - fromZone) * 60_000;
  }
  return t + offset;
}

// ——— XMP: "2026-09-16T06:52:42.677+02:00", in attributes or elements ———

const XMP_DATES = ['exif:DateTimeOriginal', 'exif:DateTimeDigitized', 'xmp:CreateDate', 'photoshop:DateCreated'];
const XMP_VALUE = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)(?::(\d\d)(\.\d+)?)?(Z|[+-]\d\d:\d\d)?$/;

function xmpDate(xmp, key = 'exif:DateTimeOriginal') {
  const v = xmp.match(new RegExp(`${key}="([^"]*)"|<${key}>([^<]*)</${key}>`));
  const m = (v?.[1] ?? v?.[2])?.match(XMP_VALUE);
  if (!m) return null;
  const local = Date.UTC(m[1], m[2] - 1, m[3], m[4], m[5], m[6] ?? 0, m[7] ? Math.round(Number(m[7]) * 1000) : 0);
  const z = m[8] ? zoneMinutes(m[8]) : null;
  return { local, zone: z, instant: z == null ? null : local - z * 60_000 };
}

function retimeXmp(xmp, warn) {
  return xmp.replace(new RegExp(`(${XMP_DATES.join('|')})(="|>)([^"<]*)`, 'g'), (all, key, sep, value) => {
    const m = value.match(XMP_VALUE);
    if (!m) return all;
    const local = Date.UTC(m[1], m[2] - 1, m[3], m[4], m[5], m[6] ?? 0);
    const t = shift(local, m[8] ? zoneMinutes(m[8]) : null);
    if (t == null) { warn(`${key} has no time zone: left as it is`); return all; }
    const d = new Date(t);
    const time = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
      + (m[6] != null ? `:${pad(d.getUTCSeconds())}${m[7] ?? ''}` : '');
    const z = zone != null ? formatZone(zone) : (m[8] ?? '');
    return `${key}${sep}${time}${z}`;
  });
}

// ——— XMP: the position ———

const EXIF_NS = 'http://ns.adobe.com/exif/1.0/';
/** XMP's GPS coordinate: degrees, decimal minutes, then the hemisphere ("42,32.54466N"). */
const xmpCoord = (v, pos, neg) => {
  const a = Math.abs(v), d = Math.floor(a);
  return `${d},${((a - d) * 60).toFixed(5)}${v < 0 ? neg : pos}`;
};
const GPS_FIELDS = /\s+exif:GPS\w+="[^"]*"|<exif:GPS(\w+)>[\s\S]*?<\/exif:GPS\1>\s*/g;

/** The XMP with its GPS fields replaced by `gps` (none when null). */
function setXmpGps(xmp, gps) {
  const clean = xmp.replace(GPS_FIELDS, '');
  if (!gps || !/<rdf:Description\b/.test(clean)) return clean;
  const fields = ` exif:GPSVersionID="2.2.0.0" exif:GPSMapDatum="WGS-84" exif:GPSLatitude="${xmpCoord(gps.lat, 'N', 'S')}" exif:GPSLongitude="${xmpCoord(gps.lng, 'E', 'W')}"`;
  const ns = clean.includes(`xmlns:exif="${EXIF_NS}"`) ? '' : ` xmlns:exif="${EXIF_NS}"`;
  return clean.replace(/<rdf:Description\b/, `<rdf:Description${ns}${fields}`);
}
const newXmp = () =>
  `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about=""></rdf:Description></rdf:RDF></x:xmpmeta>`;

// ——— EXIF (TIFF): fixed-length ASCII fields, rewritten in place ———

const TAG = { exifIfd: 0x8769, dateOriginal: 0x9003, dateDigitized: 0x9004, zoneOriginal: 0x9011, zoneDigitized: 0x9012 };

/** The ASCII fields of the Exif sub-IFD, as { tag: [position, length] } within `buf` (TIFF header at `base`). */
function exifFields(buf, base) {
  const le = buf.toString('latin1', base, base + 2) === 'II';
  const u16 = (i) => (le ? buf.readUInt16LE(i) : buf.readUInt16BE(i));
  const u32 = (i) => (le ? buf.readUInt32LE(i) : buf.readUInt32BE(i));
  const entries = (ifd) => {
    const out = new Map();
    if (base + ifd + 2 > buf.length) return out;
    const n = u16(base + ifd);
    for (let k = 0; k < n; k++) {
      const e = base + ifd + 2 + k * 12;
      if (e + 12 > buf.length) break;
      const count = u32(e + 4);
      out.set(u16(e), { type: u16(e + 2), count, at: count <= 4 ? e + 8 : base + u32(e + 8), value: u32(e + 8) });
    }
    return out;
  };
  const sub = entries(u32(base + 4)).get(TAG.exifIfd);
  if (!sub) return new Map();
  const fields = new Map();
  for (const [tag, e] of entries(sub.value)) if (e.type === 2) fields.set(tag, [e.at, e.count]);
  return fields;
}

function readExifDate(buf, base) {
  const f = exifFields(buf, base);
  const text = (tag) => (f.has(tag) ? buf.toString('latin1', f.get(tag)[0], f.get(tag)[0] + f.get(tag)[1]).replace(/\0.*$/s, '') : null);
  const m = text(TAG.dateOriginal)?.match(/^(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d):(\d\d)/);
  if (!m) return null;
  const local = Date.UTC(m[1], m[2] - 1, m[3], m[4], m[5], m[6]);
  const z = zoneMinutes(text(TAG.zoneOriginal));
  return { local, zone: z, instant: z == null ? null : local - z * 60_000 };
}

function retimeExif(buf, base, warn) {
  const f = exifFields(buf, base);
  const text = (tag) => (f.has(tag) ? buf.toString('latin1', f.get(tag)[0], f.get(tag)[0] + f.get(tag)[1]).replace(/\0.*$/s, '') : null);
  const write = (tag, s) => {
    const [at, len] = f.get(tag);
    if (s.length + 1 > len) return warn(`EXIF field ${tag.toString(16)} too short for "${s}"`);
    buf.fill(0, at, at + len);
    buf.write(s, at, 'latin1');
  };
  for (const [dateTag, zoneTag] of [[TAG.dateOriginal, TAG.zoneOriginal], [TAG.dateDigitized, TAG.zoneDigitized]]) {
    const m = text(dateTag)?.match(/^(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d):(\d\d)/);
    if (!m) continue;
    const t = shift(Date.UTC(m[1], m[2] - 1, m[3], m[4], m[5], m[6]), zoneMinutes(text(zoneTag)));
    if (t == null) { warn('EXIF date has no time zone: left as it is'); continue; }
    const d = new Date(t);
    write(dateTag, `${d.getUTCFullYear()}:${pad(d.getUTCMonth() + 1)}:${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`);
    if (zone != null && f.has(zoneTag)) write(zoneTag, formatZone(zone));
  }
}

// ——— Containers ———

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const isPng = (b) => b.subarray(0, 8).equals(PNG_SIG);
const isJpeg = (b) => b[0] === 0xff && b[1] === 0xd8;
const XMP_NS = 'http://ns.adobe.com/xap/1.0/\0';

function* pngChunks(buf) {
  for (let i = 8; i + 12 <= buf.length; ) {
    const len = buf.readUInt32BE(i), type = buf.toString('latin1', i + 4, i + 8);
    yield { type, start: i, data: buf.subarray(i + 8, i + 8 + len), end: i + 12 + len };
    if (type === 'IEND') return;
    i += 12 + len;
  }
}
function* jpegSegments(buf) {
  for (let i = 2; i + 4 <= buf.length && buf[i] === 0xff; ) {
    const marker = buf[i + 1];
    if (marker === 0xda || marker === 0xd9) return; // image data from here on
    const len = buf.readUInt16BE(i + 2);
    yield { marker, start: i, data: buf.subarray(i + 4, i + 2 + len), end: i + 2 + len };
    i += 2 + len;
  }
}
const pngChunk = (type, data) => {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([head.subarray(4), data])) >>> 0);
  return Buffer.concat([head, data, crc]);
};
/** iTXt: keyword \0, compression flag, method, language \0, translated keyword \0, text. */
function itxt(data) {
  let i = data.indexOf(0);
  const keyword = data.toString('latin1', 0, i);
  const compressed = data[i + 1] === 1;
  const lang = data.indexOf(0, i + 3), trans = data.indexOf(0, lang + 1);
  const head = data.subarray(0, trans + 1);
  const body = data.subarray(trans + 1);
  return { keyword, compressed, head, text: (compressed ? zlib.inflateSync(body) : body).toString('utf8') };
}

/** When the photo was taken: { local, zone, instant } from its EXIF or XMP. */
function captureTime(buf) {
  if (isPng(buf)) {
    for (const c of pngChunks(buf)) {
      if (c.type === 'eXIf') { const t = readExifDate(c.data, 0); if (t) return t; }
      if (c.type === 'iTXt') { const x = itxt(c.data); if (x.keyword === 'XML:com.adobe.xmp') { const t = xmpDate(x.text); if (t) return t; } }
      if (c.type === 'IDAT') break;
    }
  } else if (isJpeg(buf)) {
    for (const s of jpegSegments(buf)) {
      if (s.marker !== 0xe1) continue;
      if (s.data.toString('latin1', 0, 6) === 'Exif\0\0') { const t = readExifDate(buf, s.start + 10); if (t) return t; }
      if (s.data.toString('latin1', 0, XMP_NS.length) === XMP_NS) { const t = xmpDate(s.data.toString('utf8', XMP_NS.length)); if (t) return t; }
    }
  }
  return null;
}

/** The file with its capture times corrected and its position set (`gps`: a point, null for none, undefined to leave
    it alone): a new buffer, or the same one patched in place. */
function retimed(buf, warn, gps) {
  const editXmp = (x) => (gps === undefined ? retimeXmp(x, warn) : setXmpGps(retimeXmp(x, warn), gps));
  if (isPng(buf)) {
    const parts = [buf.subarray(0, 8)];
    let hasXmp = false;
    for (const c of pngChunks(buf)) {
      if (c.type === 'eXIf') { retimeExif(c.data, 0, warn); parts.push(pngChunk('eXIf', c.data)); continue; }
      if (c.type === 'iTXt') {
        const x = itxt(c.data);
        if (x.keyword === 'XML:com.adobe.xmp') {
          hasXmp = true;
          const text = Buffer.from(editXmp(x.text), 'utf8');
          parts.push(pngChunk('iTXt', Buffer.concat([x.head, x.compressed ? zlib.deflateSync(text) : text])));
          continue;
        }
      }
      // No XMP yet: one goes before the image data, for the position.
      if (c.type === 'IDAT' && !hasXmp && gps) {
        hasXmp = true;
        parts.push(pngChunk('iTXt', Buffer.concat([Buffer.from('XML:com.adobe.xmp\0\0\0\0\0', 'latin1'), Buffer.from(setXmpGps(newXmp(), gps), 'utf8')])));
      }
      parts.push(buf.subarray(c.start, c.end));
      if (c.type === 'IEND') break;
    }
    return Buffer.concat(parts);
  }
  if (isJpeg(buf)) {
    const segment = (xmp) => {
      const data = Buffer.from(XMP_NS + xmp, 'utf8');
      if (data.length + 2 > 0xffff) return null;
      const head = Buffer.from([0xff, 0xe1, 0, 0]);
      head.writeUInt16BE(data.length + 2, 2);
      return Buffer.concat([head, data]);
    };
    const parts = [buf.subarray(0, 2)];
    let last = 2, hasXmp = false;
    for (const s of jpegSegments(buf)) {
      last = s.end;
      if (s.marker === 0xe1 && s.data.toString('latin1', 0, 6) === 'Exif\0\0') retimeExif(buf, s.start + 10, warn);
      if (s.marker === 0xe1 && s.data.toString('latin1', 0, XMP_NS.length) === XMP_NS) {
        hasXmp = true;
        const seg = segment(editXmp(s.data.toString('utf8', XMP_NS.length)));
        if (!seg) { warn('XMP too large to rewrite: left as it is'); parts.push(buf.subarray(s.start, s.end)); continue; }
        parts.push(seg);
        continue;
      }
      parts.push(buf.subarray(s.start, s.end));
    }
    // No XMP yet: one goes after the other metadata segments, for the position.
    if (!hasXmp && gps) parts.push(segment(setXmpGps(newXmp(), gps)));
    parts.push(buf.subarray(last));
    return Buffer.concat(parts);
  }
  warn('not a PNG or a JPEG: time left as it is');
  return buf;
}

// ——— Run ———

const files = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f) && !f.startsWith('.')).sort();
if (!files.length) fail(`no PNG or JPEG in ${dir}`);
const photos = files.map((name) => {
  const buf = fs.readFileSync(path.join(dir, name));
  const t = captureTime(buf);
  return { name, t, key: t ? (t.instant ?? t.local) : Infinity };
});
// In the order taken; photos without a date go last, by name.
photos.sort((a, b) => a.key - b.key || a.name.localeCompare(b.name));
const width = String(photos.length).length;
photos.forEach((p, i) => (p.next = `${opt.code}-${pad(i + 1, width)}${path.extname(p.name).toLowerCase().replace('.jpeg', '.jpg')}`));

// The position: the closest timeline point within 5 minutes of the corrected moment.
const WINDOW = 5 * 60_000;
const timelineFile = opt.timeline ? path.resolve(opt.timeline) : path.join(path.dirname(dir), 'actual_timeline.csv');
if (opt.timeline && !fs.existsSync(timelineFile)) fail(`--timeline ${opt.timeline}: no such file`);
const timeline = fs.existsSync(timelineFile)
  ? fs.readFileSync(timelineFile, 'utf8').trim().split('\n').slice(1).map((l) => {
      const [time, lat, lng] = l.split(',');
      return { t: Date.parse(time), lat: Number(lat), lng: Number(lng) };
    }).filter((p) => Number.isFinite(p.t) && Number.isFinite(p.lat) && Number.isFinite(p.lng)).sort((a, b) => a.t - b.t)
  : null;
for (const p of photos) {
  if (!timeline) continue;
  p.gps = null;
  // The moment: --zone keeps it, --offset moves it. A date with no zone has no moment to match.
  const instant = p.t?.instant == null ? null : p.t.instant + offset;
  if (instant == null) continue;
  let lo = 0, hi = timeline.length;
  while (lo < hi) { const m = (lo + hi) >> 1; timeline[m].t < instant ? (lo = m + 1) : (hi = m); }
  const near = [timeline[lo - 1], timeline[lo]].filter(Boolean).sort((a, b) => Math.abs(a.t - instant) - Math.abs(b.t - instant))[0];
  if (near && Math.abs(near.t - instant) <= WINDOW) p.gps = { lat: near.lat, lng: near.lng, gap: Math.round((near.t - instant) / 1000) };
}

const undated = photos.filter((p) => !p.t);
const fmt = (t) => (t ? new Date(t.local).toISOString().slice(0, 19).replace('T', ' ') + (t.zone != null ? formatZone(t.zone) : '') : 'no date');
for (const p of photos) {
  let after = '';
  if (retime && p.t) {
    const t = shift(p.t.local, p.t.zone);
    after = t == null ? '  (no zone: time kept)' : `  →  ${new Date(t).toISOString().slice(0, 19).replace('T', ' ')}${zone != null ? formatZone(zone) : p.t.zone != null ? formatZone(p.t.zone) : ''}`;
  }
  const where = !timeline ? '' : p.gps ? `  ${p.gps.lat.toFixed(5)}, ${p.gps.lng.toFixed(5)} (${p.gps.gap >= 0 ? '+' : ''}${p.gps.gap} s)` : '  no position';
  console.log(`${p.name.padEnd(16)} ${p.next.padEnd(12)} ${fmt(p.t)}${after}${where}`);
}
if (timeline) console.log(`${photos.filter((p) => p.gps).length}/${photos.length} placed from ${path.relative(process.cwd(), timelineFile)}`);
else console.log(`no timeline (${path.relative(process.cwd(), timelineFile)}): positions left as they are`);
if (undated.length) console.log(`${undated.length} without a date, numbered last: ${undated.map((p) => p.name).join(', ')}`);
if (opt['dry-run']) process.exit(0);

// Each file is rewritten in place, then renamed in two steps (through a temporary name), so a new name never lands
// on a file not yet renamed.
if (retime || timeline) {
  for (const p of photos) {
    const file = path.join(dir, p.name);
    const warnings = new Set();
    fs.writeFileSync(file, retimed(fs.readFileSync(file), (w) => warnings.add(w), timeline ? p.gps : undefined));
    for (const w of warnings) console.warn(`${p.name}: ${w}`);
  }
}
const tmp = (p) => path.join(dir, `.${p.next}.renaming`);
for (const p of photos) fs.renameSync(path.join(dir, p.name), tmp(p));
for (const p of photos) fs.renameSync(tmp(p), path.join(dir, p.next));

console.log(`${photos.length} photos renamed ${photos[0].next} … ${photos.at(-1).next}${retime ? ', times corrected' : ''}${timeline ? `, ${photos.filter((p) => p.gps).length} placed` : ''}`);
