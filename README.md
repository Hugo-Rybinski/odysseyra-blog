# Odysseyra

A bilingual (FR/EN) travel blog built with [Astro](https://astro.build), MDX and Leaflet. Each trip is laid out as a topographic survey sheet: hero photo, title box, legend with route exports, trip map, then one section per region.

## Commands

| Command           | Action                                                   |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | Dev server at `localhost:4321/odysseyra-blog/`           |
| `npm run build`   | Build the static site to `dist/`                         |
| `npm run preview` | Preview the build                                        |

Pushing to `main` deploys to GitHub Pages.

## Adding a trip

One folder per trip in `src/content/trips/<slug>/`:

```
src/content/trips/<slug>/
├── trip.yaml   shared data: dates, regions, routes, points, photo list
├── fr.mdx      French text
├── en.mdx      English text
└── photos/     3:2 or 2:3 JPEGs (never cropped)
```

`trip.yaml` holds everything both languages share. `code` is the country's three-letter code (`KGZ`), used with the start year in the box references (`2026-KGZ-R04-D09-TXT-01`). Short labels (region and place names, alt text, captions) are written as `{ fr: …, en: … }`. Point kinds: `stage` (overnight, with `nights: [3, 4]`, counted from the first night of the trip), `sight`, `pass`, `warning`. Stages are numbered by their nights on the maps and tables, sights by their own sequence.

A region's `route` is a list of stretches. A recorded stretch (a GPS track, or a road traced through waypoints) is drawn as a solid line. Mark a stretch `approx: true` when only its two ends are known: it is drawn dashed, labelled "approximate" in the GPX and KML, and noted under the region map.

```yaml
route:
  - { path: [[42.8746, 74.5698], [42.8886, 74.651], [42.9286, 74.6944]] }
  - { approx: true, path: [[41.17, 75.81], [40.827, 75.287]] }
```

Both `fr.mdx` and `en.mdx` are required: the build fails if a published trip is missing one. Set `draft: true` in `trip.yaml` while writing.

### Components available in the MDX files

- `<Region id="…">…</Region>`: a region section with its map, its points table (coordinates, copy button, Google/Apple Maps links) and the text.
- `<Photo id="…" />`: a photo plate with caption and camera settings; the image links to the original.
- `<Day n={8} title="Tash Rabat → Ton" />`: a day marker inside a region, "Jour 08 / 15" with its date (from `start` in `trip.yaml`) and an optional title. The text after it sits directly under the strip.
- `<Plates>…</Plates>`: puts photos side by side (two portraits per row; a landscape takes a full row).
- `<Tip kind="road|fuel|water|money|border|sleep|info" at="point-id">…</Tip>`: a highlighted practical tip, optionally linked to a point. Tips with `at` also put a gold dot on that point's map marker, with a link in its popup. A tip next to text is set into that text panel. `road`, `border` and `fuel` tips get the stronger warning style.
- `<Before>…</Before>`: the "before you go" section, placed before the first region (text and tips).
- `<Review><Good>…</Good><Redo>…</Redo></Review>`: "Mon avis" at the end of a region, with the highlights (`<Good>`) and what I would do differently (`<Redo>`), each usually a short list.

### Photos and camera data

Camera settings (aperture, shutter speed, ISO, focal length, camera, lens) are read from each file's EXIF at build time. Export photos with their metadata included. If a file has no EXIF, the values can be written by hand under `exif:` for that photo in `trip.yaml`.

GPX and KML files for each trip and language are generated at build time (`/<lang>/trips/<slug>/route.gpx` and `route.kml`).
