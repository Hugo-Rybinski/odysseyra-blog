#!/usr/bin/env node
// Reads the phone's photos and videos, straight out of their zip, and writes where and when each was taken:
//
//   npm run timeline -- <inbox>/phone.zip      (or a folder of photos and videos)
//
//   [--max-accuracy 1000]   leave out positions less precise than this, in metres
//
// Photos (HEIC, JPEG, PNG): EXIF date, time zone and GPS. Videos (MOV, MP4): the QuickTime location and creation
// date that phones write in the movie's metadata; the video data itself is skipped, not read into memory. Files with
// no position or no date are left out. Nothing is extracted to disk.
//
// Writes, next to the zip, actual_timeline.csv: one row per point (Google My Maps imports it as a layer, to check
// the timeline on a map). It holds exact positions: keep it private.

import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import exifr from 'exifr';

const { values: opt, positionals } = parseArgs({ allowPositionals: true, options: { 'max-accuracy': { type: 'string', default: '1000' } } });
const src = positionals[0] && path.resolve(positionals[0]);
/** A position less precise than this (m), a phone's guess from the cell network, is left out. */
const maxAccuracy = Number(opt['max-accuracy']);
if (!src || !fs.existsSync(src) || !(maxAccuracy > 0)) {
  console.error('usage: npm run timeline -- <phone.zip | folder> [--max-accuracy 1000]');
  process.exit(1);
}
const outDir = path.dirname(src);

const IMAGE = /\.(heic|heif|jpe?g|png|dng|tiff?)$/i;
const VIDEO = /\.(mov|mp4|m4v)$/i;
/** A photo larger than this is not read (it would be a scan or a panorama export, not worth the memory). */
const MAX_IMAGE = 256 << 20;
const PARALLEL = 6;

// ——— Sources: the entries of a zip, or the files of a folder, each read as a stream ———

const isZip = !fs.statSync(src).isDirectory();
const names = isZip
  ? execFileSync('unzip', ['-Z1', src], { maxBuffer: 1 << 26 }).toString('utf8').split('\n')
  : fs.readdirSync(src, { recursive: true }).map(String);
const entries = names.filter((n) => n && !n.endsWith('/') && !n.includes('__MACOSX/') && !path.basename(n).startsWith('.') && (IMAGE.test(n) || VIDEO.test(n)));

/** unzip reads its member names as patterns: [ ] * ? are escaped to match themselves. */
const literal = (n) => n.replace(/[[\]*?\\]/g, '\\$&');
function open(name) {
  if (!isZip) {
    const stream = fs.createReadStream(path.join(src, name));
    return { stream, stop: () => stream.destroy() };
  }
  const child = spawn('unzip', ['-p', src, literal(name)], { stdio: ['ignore', 'pipe', 'ignore'] });
  return { stream: child.stdout, stop: () => child.kill() };
}

function readAll(name) {
  return new Promise((resolve) => {
    const { stream, stop } = open(name);
    const chunks = [];
    let size = 0;
    stream.on('data', (c) => {
      size += c.length;
      if (size > MAX_IMAGE) { stop(); resolve(null); } else chunks.push(c);
    });
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', () => resolve(null));
  });
}

/** The movie's 'moov' box, found by walking the top-level boxes as they stream past: the media data in between is
    counted and dropped. Stops reading as soon as it has it. */
function readMoov(name) {
  return new Promise((resolve) => {
    const { stream, stop } = open(name);
    let buf = Buffer.alloc(0), skip = 0, moov = null, need = 0, done = false;
    const finish = (v) => { if (!done) { done = true; stop(); resolve(v); } };
    stream.on('data', (chunk) => {
      if (done) return;
      if (skip) {
        if (chunk.length <= skip) { skip -= chunk.length; return; }
        chunk = chunk.subarray(skip);
        skip = 0;
      }
      buf = buf.length ? Buffer.concat([buf, chunk]) : chunk;
      while (!done) {
        if (moov) {
          if (buf.length < need) return;
          return finish(buf.subarray(0, need));
        }
        if (buf.length < 8) return;
        let size = buf.readUInt32BE(0), head = 8;
        const type = buf.toString('latin1', 4, 8);
        if (size === 1) {
          if (buf.length < 16) return;
          size = Number(buf.readBigUInt64BE(8));
          head = 16;
        }
        if (size === 0 || size < head) return finish(null);
        if (type === 'moov') { moov = true; need = size; continue; }
        if (buf.length >= size) { buf = buf.subarray(size); continue; }
        skip = size - buf.length;
        buf = Buffer.alloc(0);
        return;
      }
    });
    stream.on('end', () => finish(null));
    stream.on('error', () => finish(null));
  });
}

// ——— Videos: the QuickTime metadata ———

const CONTAINERS = new Set(['moov', 'trak', 'udta', 'meta', 'mdia']);
/** Every box in the tree, with its payload. A QuickTime 'meta' has no version and flags; an ISO one has 4 bytes. */
function* boxes(buf, start = 0, end = buf.length) {
  let i = start;
  while (i + 8 <= end) {
    let size = buf.readUInt32BE(i), head = 8;
    const type = buf.toString('latin1', i + 4, i + 8);
    if (size === 1) { size = Number(buf.readBigUInt64BE(i + 8)); head = 16; }
    if (size === 0) size = end - i;
    if (size < head || i + size > end) return;
    yield { type, start: i + head, end: i + size };
    if (CONTAINERS.has(type)) {
      let from = i + head;
      if (type === 'meta' && buf.toString('latin1', from + 4, from + 8) !== 'hdlr' && buf.readUInt32BE(from) === 0) from += 4;
      yield* boxes(buf, from, i + size);
    }
    i += size;
  }
}

function videoTags(moov) {
  const tags = {};
  let keys = [];
  for (const b of boxes(moov)) {
    if (b.type === 'keys') {
      // version/flags, count, then each key: size, namespace, name.
      keys = [];
      let i = b.start + 8;
      while (i + 8 <= b.end) {
        const size = moov.readUInt32BE(i);
        if (size < 8) break;
        keys.push(moov.toString('utf8', i + 8, i + size));
        i += size;
      }
    } else if (b.type === 'ilst' && keys.length) {
      // Each item's box type is its key's 1-based index; its 'data' box holds type (4), locale (4), then the value.
      for (let i = b.start; i + 8 <= b.end; ) {
        const size = moov.readUInt32BE(i);
        if (size < 8 || i + size > b.end) break;
        const key = keys[moov.readUInt32BE(i + 4) - 1];
        if (key && moov.toString('latin1', i + 12, i + 16) === 'data') tags[key] ??= moov.toString('utf8', i + 24, i + size);
        i += size;
      }
    } else if (b.type === '©xyz') {
      tags.xyz ??= moov.toString('utf8', b.start + 4, b.end);
    } else if (b.type === 'mvhd') {
      const v = moov[b.start];
      const secs = v === 1 ? Number(moov.readBigUInt64BE(b.start + 4)) : moov.readUInt32BE(b.start + 4);
      // Seconds since 1904, in UTC; 0 when the writer left it out.
      if (secs) tags.mvhd = (secs - 2_082_844_800) * 1000;
    }
  }
  return tags;
}

/** "+42.5424+075.1662+2338.458/": latitude, longitude, altitude. */
function iso6709(s) {
  const m = s?.match(/^([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)?/);
  return m ? { lat: Number(m[1]), lng: Number(m[2]), alt: m[3] ? Number(m[3]) : undefined } : null;
}

// ——— Times: the local wall-clock time, and its offset from UTC when the file says it ———

const pad = (n) => String(n).padStart(2, '0');
/** "+0600", "+06:00", "Z" → minutes east of UTC. */
const offsetMinutes = (s) => {
  if (s === 'Z') return 0;
  const m = s?.match(/^([+-])(\d\d):?(\d\d)$/);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : null;
};
const formatOffset = (min) => `${min < 0 ? '-' : '+'}${pad(Math.floor(Math.abs(min) / 60))}:${pad(Math.abs(min) % 60)}`;

/** "2026:09:27 15:19:29" or "2026-09-27T15:19:29+0600" → { local: ms as if UTC, offset: minutes | null }. */
function parseTime(s) {
  const m = String(s ?? '').match(/^(\d{4})[:-](\d\d)[:-](\d\d)[ T](\d\d):(\d\d):(\d\d)(?:\.\d+)?\s*(Z|[+-]\d\d:?\d\d)?/);
  if (!m || m[1] === '0000') return null;
  return { local: Date.UTC(m[1], m[2] - 1, m[3], m[4], m[5], m[6]), offset: offsetMinutes(m[7]) };
}

/** exifr turns down a HEIC whose 'ftyp' box is over 50 bytes, as recent iPhones write it (52), and looks for its
    format among the box's compatible brands. The box is split into a shorter 'ftyp', its format brands first, and a
    'free' box of the same total length, so every offset in the file stays right. */
function shortFtyp(buf) {
  const size = buf.length >= 16 ? buf.readUInt32BE(0) : 0;
  if (buf.toString('latin1', 4, 8) !== 'ftyp' || size <= 50 || size > 256) return buf;
  const n = size - 48 >= 8 ? 48 : 44;
  const brands = [];
  for (let i = 16; i + 4 <= size; i += 4) brands.push(buf.toString('latin1', i, i + 4));
  const first = ['heic', 'heix', 'avif', 'mif1'];
  [...first.filter((b) => brands.includes(b)), ...brands.filter((b) => !first.includes(b))]
    .slice(0, (n - 16) / 4)
    .forEach((b, i) => buf.write(b, 16 + i * 4, 'latin1'));
  buf.writeUInt32BE(n, 0);
  buf.writeUInt32BE(size - n, n);
  buf.write('free', n + 4, 'latin1');
  return buf;
}

async function fromImage(name) {
  const raw = await readAll(name);
  if (!raw) return null;
  const buf = shortFtyp(raw);
  const e = await exifr.parse(buf, {
    gps: true, exif: true, tiff: true, xmp: false, icc: false, iptc: false, reviveValues: false,
    pick: ['DateTimeOriginal', 'CreateDate', 'OffsetTimeOriginal', 'OffsetTime', 'GPSLatitude', 'GPSLatitudeRef', 'GPSLongitude', 'GPSLongitudeRef', 'GPSAltitude', 'GPSAltitudeRef', 'GPSDateStamp', 'GPSTimeStamp', 'GPSHPositioningError'],
  }).catch(() => null);
  if (!e || !Number.isFinite(e.latitude) || !Number.isFinite(e.longitude)) return null;
  const time = parseTime(e.DateTimeOriginal ?? e.CreateDate);
  if (!time) return null;
  let offset = offsetMinutes(e.OffsetTimeOriginal ?? e.OffsetTime) ?? time.offset;
  // No time zone in the file: the GPS clock is UTC, so the difference gives it (to the quarter hour).
  if (offset == null && e.GPSDateStamp && Array.isArray(e.GPSTimeStamp)) {
    const [y, mo, d] = String(e.GPSDateStamp).split(':').map(Number);
    const [h, mi, s] = e.GPSTimeStamp.map(Number);
    const utc = Date.UTC(y, mo - 1, d, h, mi, s);
    if (Number.isFinite(utc)) offset = Math.round((time.local - utc) / 900_000) * 15;
  }
  const alt = Number.isFinite(e.GPSAltitude) ? (e.GPSAltitudeRef === 1 ? -e.GPSAltitude : e.GPSAltitude) : undefined;
  return { local: time.local, offset, lat: e.latitude, lng: e.longitude, alt, accuracy: e.GPSHPositioningError, kind: 'photo' };
}

async function fromVideo(name) {
  const moov = await readMoov(name);
  if (!moov) return null;
  const tags = videoTags(moov);
  const at = iso6709(tags['com.apple.quicktime.location.ISO6709']) ?? iso6709(tags.xyz);
  if (!at) return null;
  let time = parseTime(tags['com.apple.quicktime.creationdate']);
  // Only the UTC creation time: its local time comes later, from the photos' time zone.
  if (!time && tags.mvhd) time = { local: null, utc: tags.mvhd, offset: null };
  if (!time) return null;
  const accuracy = Number(tags['com.apple.quicktime.location.accuracy.horizontal']);
  return { ...at, local: time.local, utc: time.utc, offset: time.offset, accuracy: Number.isFinite(accuracy) ? accuracy : undefined, kind: 'video' };
}

// ——— Run ———

const points = [];
let ignored = 0, vague = 0, done = 0;
const queue = [...entries];
const tick = () => process.stderr.isTTY && process.stderr.write(`\r${++done}/${entries.length}`);
await Promise.all(
  Array.from({ length: PARALLEL }, async () => {
    for (let name; (name = queue.shift()); ) {
      const p = await (VIDEO.test(name) ? fromVideo(name) : fromImage(name)).catch(() => null);
      if (!p) ignored++;
      else if (p.accuracy > maxAccuracy) vague++;
      else points.push({ ...p, file: path.basename(name) });
      tick();
    }
  }),
);
if (process.stderr.isTTY) process.stderr.write('\r');

// A file without a time zone takes the one of the nearest point that has it.
const zoned = points.filter((p) => p.offset != null && p.local != null).map((p) => ({ utc: p.local - p.offset * 60_000, offset: p.offset }));
for (const p of points) {
  if (p.utc == null && p.offset != null) p.utc = p.local - p.offset * 60_000;
  if (p.offset != null && p.local != null) continue;
  const ref = p.utc ?? p.local;
  const near = zoned.reduce((best, z) => (!best || Math.abs(z.utc - ref) < Math.abs(best.utc - ref) ? z : best), null);
  p.offsetGuessed = true;
  p.offset = near?.offset ?? 0;
  if (p.local == null) p.local = p.utc + p.offset * 60_000;
  else p.utc = p.local - p.offset * 60_000;
}

// A Live Photo is a photo and a video of one moment: one point is enough.
points.sort((a, b) => a.utc - b.utc || (a.kind === 'photo' ? -1 : 1));
const stem = (f) => f.replace(/\.[^.]+$/, '').toLowerCase();
const kept = points.filter((p, i) => !points.slice(Math.max(0, i - 3), i).some((q) => stem(q.file) === stem(p.file) && Math.abs(q.utc - p.utc) < 10_000));

const iso = (ms) => new Date(ms).toISOString().slice(0, 19);
const rows = kept.map((p) => ({
  time: `${iso(p.local)}${formatOffset(p.offset)}`,
  ...(p.offsetGuessed && { zoneGuessed: true }),
  lat: Number(p.lat.toFixed(6)),
  lng: Number(p.lng.toFixed(6)),
  ...(p.alt != null && { alt: Math.round(p.alt) }),
  ...(p.accuracy != null && { accuracy: Math.round(p.accuracy) }),
  kind: p.kind,
  file: p.file,
}));
const csv = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
fs.writeFileSync(
  path.join(outDir, 'actual_timeline.csv'),
  ['time,latitude,longitude,kind,file', ...rows.map((r) => [r.time, r.lat, r.lng, r.kind, csv(r.file)].join(','))].join('\n') + '\n',
);

const days = new Set(rows.map((r) => r.time.slice(0, 10)));
console.log(`${entries.length} files: ${rows.length} points over ${days.size} days, ${points.length - kept.length} Live Photo videos merged, ${ignored} without a position or a date${vague ? `, ${vague} less precise than ${maxAccuracy} m` : ''}`);
if (rows.length) console.log(`${rows[0].time} → ${rows.at(-1).time}${rows.some((r) => r.zoneGuessed) ? ` (${rows.filter((r) => r.zoneGuessed).length} with a guessed time zone)` : ''}`);
console.log(path.join(outDir, 'actual_timeline.csv'));
