import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
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
    country: localized,
    start: z.coerce.date(),
    end: z.coerce.date(),
    draft: z.boolean().default(false),
    /** Photo id used as the hero plate and the trip card cover. */
    cover: z.string(),
    /** Road distance when known; otherwise computed from the route polyline. */
    distanceKm: z.number().optional(),
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
              /** stage: overnight; sight: a stop worth the detour; pass: mountain pass; warning: road or access problem. */
              kind: z.enum(['stage', 'sight', 'pass', 'warning']).default('sight'),
              name: localized,
              at: latLng,
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

export const collections = { trips, tripTexts };
