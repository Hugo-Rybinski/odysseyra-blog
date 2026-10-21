import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import path from 'node:path';
import exifr from 'exifr';
import { idx, languages, nightsLabel, t, type Lang } from '../i18n';

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
}

export interface NumberedPoint {
  id: string;
  /** A stop's own number, or a stay's first night; 0 for passes and warnings. */
  n: number;
  /** The badge text: a stop's number ("07") or a stay's nights ("03–04", "01–02 · 14"); "" otherwise. */
  label: string;
  /** stage only: the nights spent there. */
  nights?: number[];
  /** The text prefix used everywhere a point is named: "07. " for a stop, "Nuits 03–04 · " for a stay, "" otherwise. */
  ref: string;
  kind: PointKind;
  name: string;
  at: [number, number];
  regionId: string;
}

/** The boxes set into a sheet's text: a warning (road, border, fuel: read first), a tip (any practical note), the
    detours on offer, a hike (with its figures), a night (where, and what to know). */
export type TipKind = 'warning' | 'tip' | 'detour' | 'hike' | 'night';

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
  /** Each <Day>'s title, by day number, as the text gives it. */
  days: Map<number, string>;
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

/** Stays are numbered by their nights, stops by their own sequence. */
export function numberPoints(data: TripData, lang: Lang): NumberedPoint[] {
  const s = t(lang);
  const lastNight = Math.round((data.end.valueOf() - data.start.valueOf()) / 86_400_000);
  let stop = 0;
  return data.regions.flatMap((region) =>
    region.points.map((p) => {
      const base = { id: p.id, kind: p.kind, name: p.name[lang], at: p.at, regionId: region.id };
      if (p.kind === 'stage') {
        const nights = p.nights ?? [];
        if (!nights.length || nights.some((n) => n > lastNight)) throw new Error(`stage "${p.id}" needs nights between 1 and ${lastNight}`);
        const label = nightsLabel(nights);
        return { ...base, n: Math.min(...nights), label, nights, ref: `${nights.length > 1 ? s.nights : s.night} ${label} · ` };
      }
      if (p.kind === 'sight') {
        const label = idx(++stop);
        return { ...base, n: stop, label, ref: `${label}. ` };
      }
      return { ...base, n: 0, label: '', ref: '' };
    }),
  );
}

/** Where a link to a point lands without scripts: its points-table row, or its region map for a detour (no row). */
export const pointHref = (p: Pick<NumberedPoint, 'id' | 'kind' | 'regionId'>) => (p.kind === 'detour' ? `#map-${p.regionId}` : `#pt-${p.id}`);

/** A short key from a tip's opening words, for tips not tied to a place (same result from MDX source or HTML). */
export const textKey = (text: string) =>
  text
    .replace(/<[^>]*>/g, ' ')
    .normalize('NFD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 16);

/** Stable id for a tip, shared by the parser below and the <Tip> component. */
/** A box's id: its point and kind (a night box about one night of a stay adds that night: tip-karakol-night-10). */
export const tipId = (kind: string, at?: string, text = '', night?: number) =>
  `tip-${at ?? textKey(text)}-${kind}${night != null ? `-${String(night).padStart(2, '0')}` : ''}`;

/** Reads <Tip kind at> tags from the MDX source, with the <Region> each one sits in. */
export function parseTips(body: string): TipRef[] {
  const tips: TipRef[] = [];
  let regionId: string | undefined;
  const re = /<Region\s+id="([^"]+)"|<\/Region>|<Tip\b([^>]*)>([\s\S]*?)<\/Tip>/g;
  for (const m of body.matchAll(re)) {
    if (m[1]) regionId = m[1];
    else if (m[0] === '</Region>') regionId = undefined;
    else {
      const kind = (/kind="([^"]+)"/.exec(m[2])?.[1] ?? 'tip') as TipKind;
      const at = /at="([^"]+)"/.exec(m[2])?.[1];
      const night = /night=\{(\d+)\}/.exec(m[2])?.[1];
      const id = tipId(kind, at, m[3], night ? Number(night) : undefined);
      if (!tips.some((t) => t.id === id)) tips.push({ id, kind, at, regionId });
    }
  }
  return tips;
}


/** The days the text marks with <Day n={…} title="…" />: their number and title. */
export function parseDays(body: string): Map<number, string> {
  const days = new Map<number, string>();
  for (const m of body.matchAll(/<Day\s+n=\{(\d+)\}(?:\s+title="([^"]*)")?/g)) days.set(Number(m[1]), m[2] ?? '');
  return days;
}

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
  return { slug, lang, data: trip.data, photos, points, tips: parseTips(body), days: parseDays(body), distanceKm: trip.data.distanceKm ?? Math.round(computed), center };
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

