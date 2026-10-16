import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const localized = z.object({ fr: z.string(), en: z.string() });
const latLng = z.tuple([z.number(), z.number()]);
/** One stretch of road. `approx`: only its ends are known; drawn dashed and labelled approximate in exports. */
const segment = z.object({ approx: z.boolean().default(false), path: z.array(latLng).min(2) });

/** Shared, language-independent trip data: one `trip.yaml` per trip folder. */
const trips = defineCollection({
  loader: glob({
    pattern: '*/trip.yaml',
    base: './src/content/trips',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.object({
    sheet: z.number().int().positive(),
    /** Three-letter country code (ISO 3166 alpha-3), used in the box references: 2026-KGZ-R04-D09-TXT-01. */
    code: z.string().regex(/^[A-Z]{3}$/),
    country: localized,
    start: z.coerce.date(),
    end: z.coerce.date(),
    draft: z.boolean().default(false),
    /** Photo id used as the hero plate and the trip card cover. */
    cover: z.string(),
    /** When the sheet was written, and last revised (a correction, a road update); both shown on the sheet. */
    written: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
    /** Road distance when known; otherwise computed from the route polyline. */
    distanceKm: z.number().optional(),
    /** How many people made the trip. */
    travellers: z.number().int().positive().optional(),
    /** What the trip cost each traveller on the ground, flights excluded: an amount in an ISO 4217 currency. */
    costPerPerson: z.object({ amount: z.number().positive(), currency: z.string().regex(/^[A-Z]{3}$/).default('EUR') }).optional(),
    photos: z.array(
      z.object({
        id: z.string(),
        file: z.string(),
        alt: localized,
        caption: localized.optional(),
        /** Manual camera data, for files exported without EXIF. Values read from the file win. */
        exif: z
          .object({
            camera: z.string(),
            lens: z.string(),
            aperture: z.string(),
            shutter: z.string(),
            iso: z.string(),
            focal: z.string(),
          })
          .partial()
          .optional(),
      }),
    ),
    regions: z.array(
      z.object({
        id: z.string(),
        name: localized,
        days: z.tuple([z.number().int(), z.number().int()]),
        route: z.array(segment).default([]),
        points: z
          .array(
            z.object({
              id: z.string(),
              /** stage: overnight; sight: a numbered stop (a place, a pass, a track: all places alike); detour: a place
                  along the way or a possible side trip, on the region map but unnumbered and left out of the points
                  table. Road and access warnings are tips (<Tip kind="road">), not points. */
              kind: z.enum(['stage', 'sight', 'detour']).default('sight'),
              name: localized,
              at: latLng,
              /** stage only: the nights spent there, numbered from the first night of the trip. */
              nights: z.array(z.number().int().positive()).optional(),
            }),
          )
          .default([]),
      }),
    ),
  }),
});

/** Translated prose: `fr.mdx` and `en.mdx` next to each `trip.yaml`. */
const tripTexts = defineCollection({
  loader: glob({ pattern: '*/{fr,en}.mdx', base: './src/content/trips' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

/** Coming-soon sheets (`upcoming.yaml`): trips without a page yet, either planned or travelled and not written up.
    A greyed card on the sheet index and their extent on its map. The sheet number is kept once it is published. */
const upcoming = defineCollection({
  loader: file('./src/content/upcoming.yaml'),
  schema: z.object({
    sheet: z.number().int().positive(),
    code: z.string().regex(/^[A-Z]{3}$/),
    country: localized,
    /** When it is planned, as it should read: "Printemps 2027" / "Spring 2027". */
    when: localized,
    /** planned: not travelled yet. travelled: done, the write-up is coming. */
    status: z.enum(['planned', 'travelled']).default('planned'),
    title: localized.optional(),
    /** The route, if any: grey on the index map, never gold (gold is a route with its sheet to follow); dotted while
        planned, solid once travelled. */
    route: z.array(segment).default([]),
    /** Places it should pass through; with the route, they set the sheet's extent. */
    places: z.array(latLng).default([]),
    /** The extent itself, [[south, west], [north, east]], when there is no route or place yet. */
    bounds: z.tuple([latLng, latLng]).optional(),
  }),
});

/** The author's page ("À propos" / "About"): `fr.mdx` and `en.mdx`. */
const about = defineCollection({
  loader: glob({ pattern: '{fr,en}.mdx', base: './src/content/about' }),
  schema: z.object({ title: z.string(), description: z.string() }),
});

export const collections = { trips, tripTexts, upcoming, about };
