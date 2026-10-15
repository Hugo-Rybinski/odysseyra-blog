import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import path from 'node:path';
import { statSync } from 'node:fs';
import exifr from 'exifr';
import { languages, t, type Lang } from '../i18n';

export type Trip = CollectionEntry<'trips'>;
export type TripData = Trip['data'];
export type Region = TripData['regions'][number];
export type PointKind = Region['points'][number]['kind'];

const images = import.meta.glob<ImageMetadata>('/src/content/trips/*/photos/*.{jpg,jpeg,JPG,JPEG,png,webp}', {
  eager: true,
  import: 'default',
});

export interface Exif {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
  focal?: string;
}

export interface Photo {
  id: string;
  image: ImageMetadata;
  orientation: 'landscape' | 'portrait';
  alt: string;
  caption?: string;
  exif: Exif;
  plate: number;
  /** Size of the file behind the "Original" link. */
  bytes: number;
}

export interface NumberedPoint {
  id: string;
  n: number;
  kind: PointKind;
  name: string;
  at: [number, number];
  regionId: string;
}

export type TipKind = 'road' | 'fuel' | 'water' | 'money' | 'border' | 'sleep' | 'info';

/** A <Tip> found in the trip's text, so maps and region headers can point to it before it renders. */
export interface TipRef {
  id: string;
  kind: TipKind;
  at?: string;
  regionId?: string;
}

export interface TripView {
  slug: string;
  lang: Lang;
  data: TripData;
  photos: Map<string, Photo>;
  points: NumberedPoint[];
  tips: TipRef[];
  distanceKm: number;
  center: [number, number];
}

function formatShutter(s: number) {
  if (s >= 1) return `${Number(s.toFixed(1))} s`;
  return `1/${Math.round(1 / s)} s`;
}

async function readExif(file: string): Promise<Exif> {
  try {
    const e = await exifr.parse(file, {
      pick: ['Make', 'Model', 'LensModel', 'FNumber', 'ExposureTime', 'ISO', 'FocalLength'],
    });
    if (!e) return {};
    const model: string | undefined = e.Model;
    const make: string | undefined = e.Make;
    return {
      camera: model ? (make && !model.startsWith(make) ? `${make} ${model}` : model) : undefined,
      lens: e.LensModel,
      aperture: e.FNumber ? `f/${Number(e.FNumber.toFixed(1))}` : undefined,
      shutter: e.ExposureTime ? formatShutter(e.ExposureTime) : undefined,
      iso: e.ISO ? `ISO ${e.ISO}` : undefined,
      focal: e.FocalLength ? `${Math.round(e.FocalLength)} mm` : undefined,
    };
  } catch {
    return {};
  }
}

function stripEmpty<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== '')) as Partial<T>;
}

function haversine([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]) {
  const r = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

export function numberPoints(data: TripData, lang: Lang): NumberedPoint[] {
  let n = 0;
  return data.regions.flatMap((region) =>
    region.points.map((p) => ({
      id: p.id,
      n: p.kind === 'stage' || p.kind === 'sight' ? ++n : 0,
      kind: p.kind,
      name: p.name[lang],
      at: p.at,
      regionId: region.id,
    })),
  );
}

/** Stable id for a tip, shared by the parser below and the <Tip> component. */
export const tipId = (kind: string, at?: string) => `tip-${at ?? 'general'}-${kind}`;

/** Reads <Tip kind at> tags from the MDX source, with the <Region> each one sits in. */
export function parseTips(body: string): TipRef[] {
  const tips: TipRef[] = [];
  let regionId: string | undefined;
  const re = /<Region\s+id="([^"]+)"|<\/Region>|<Tip\b([^>]*)>/g;
  for (const m of body.matchAll(re)) {
    if (m[1]) regionId = m[1];
    else if (m[0] === '</Region>') regionId = undefined;
    else {
      const kind = (/kind="([^"]+)"/.exec(m[2])?.[1] ?? 'info') as TipKind;
      const at = /at="([^"]+)"/.exec(m[2])?.[1];
      const id = tipId(kind, at);
      if (!tips.some((t) => t.id === id)) tips.push({ id, kind, at, regionId });
    }
  }
  return tips;
}

/** Tip kinds that warn about the road itself rather than inform. */
export const hazardKinds: TipKind[] = ['road', 'border', 'fuel'];

export async function getTripView(trip: Trip, lang: Lang, body = ''): Promise<TripView> {
  const slug = trip.id;
  const photos = new Map<string, Photo>();
  let plate = 0;
  for (const p of trip.data.photos) {
    const key = `/src/content/trips/${slug}/photos/${p.file}`;
    const image = images[key];
    if (!image) throw new Error(`[${slug}] photo "${p.id}": file not found at ${key}`);
    photos.set(p.id, {
      id: p.id,
      image,
      orientation: image.width >= image.height ? 'landscape' : 'portrait',
      alt: p.alt[lang],
      caption: p.caption?.[lang],
      exif: { ...p.exif, ...stripEmpty(await readExif(path.join(process.cwd(), key))) },
      plate: ++plate,
      bytes: statSync(path.join(process.cwd(), key)).size,
    });
  }
  if (!photos.has(trip.data.cover)) throw new Error(`[${slug}] cover photo "${trip.data.cover}" is not in photos`);

  const points = numberPoints(trip.data, lang);
  const coords = trip.data.regions.flatMap((r) => [...r.route.flatMap((seg) => seg.path), ...r.points.map((p) => p.at)]);
  const center: [number, number] = coords.length
    ? [coords.reduce((s, c) => s + c[0], 0) / coords.length, coords.reduce((s, c) => s + c[1], 0) / coords.length]
    : [0, 0];
  const computed = trip.data.regions.reduce(
    (sum, r) => sum + r.route.reduce((s, seg) => s + seg.path.slice(1).reduce((d, c, i) => d + haversine(seg.path[i], c), 0), 0),
    0,
  );
  return { slug, lang, data: trip.data, photos, points, tips: parseTips(body), distanceKm: trip.data.distanceKm ?? Math.round(computed), center };
}

/** Published trips, each verified to have every language; newest first. */
export async function getPublishedTrips() {
  const trips = await getCollection('trips', ({ data }) => import.meta.env.DEV || !data.draft);
  const texts = await getCollection('tripTexts');
  return trips
    .map((trip) => {
      const byLang = Object.fromEntries(
        languages.map((lang) => [lang, texts.find((t) => t.id === `${trip.id}/${lang}`)]),
      ) as Record<Lang, CollectionEntry<'tripTexts'> | undefined>;
      const missing = languages.filter((l) => !byLang[l]);
      if (missing.length && !trip.data.draft) {
        throw new Error(`[${trip.id}] missing translation(s): ${missing.join(', ')}. Every published trip needs fr.mdx and en.mdx.`);
      }
      return { trip, texts: byLang };
    })
    .filter((t) => languages.every((l) => t.texts[l]))
    .sort((a, b) => b.trip.data.start.valueOf() - a.trip.data.start.valueOf()) as {
    trip: Trip;
    texts: Record<Lang, CollectionEntry<'tripTexts'>>;
  }[];
}

export function formatLatLng([lat, lng]: [number, number], digits = 5) {
  return `${lat.toFixed(digits)}, ${lng.toFixed(digits)}`;
}

export function formatDegrees([lat, lng]: [number, number]) {
  return `${Math.abs(Math.round(lat))}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(Math.round(lng))}°${lng >= 0 ? 'E' : 'W'}`;
}

/** Points as the maps and tables need them: anchor, region name and the tips that refer to them. */
export function mapPoints(trip: TripView) {
  const s = t(trip.lang);
  return trip.points.map((p) => ({
    ...p,
    href: `#pt-${p.id}`,
    regionName: trip.data.regions.find((r) => r.id === p.regionId)!.name[trip.lang],
    tips: trip.tips.filter((tip) => tip.at === p.id).map((tip) => ({ id: tip.id, label: s.tipKinds[tip.kind] })),
  }));
}

export function formatBytes(lang: Lang, bytes: number) {
  const mb = bytes / 1_000_000;
  return `${new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(mb)} ${lang === 'fr' ? 'Mo' : 'MB'}`;
}
