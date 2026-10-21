---
name: create-blogpost
description: Turn a trip's raw material (camera photos, phone photos with geolocation, planning notes, opinion notes, a Google My Maps export) into a new bilingual sheet (blog post) on Odysseyra. Use when the user wants to write up a trip, start a new sheet, or add a trip's photos and notes to the blog.
---

# Create a blog post (a sheet)

A trip on Odysseyra is a **sheet**: one folder in `src/content/trips/<slug>/` with
- `trip.yaml`: the trip's data (dates, regions, points, routes, photos), shared by both languages;
- `fr.mdx` and `en.mdx`: the text, in French and in English;
- `photos/`: the camera photos, published.

French is the source language; English is a translation of the same content, not a different text.

## 1. The inbox: `private/<nn>-<code>/input/`

All raw material goes in `private/`, which git ignores. One folder per trip, named after its sheet number and
country code (`private/01-kgz/`). Its `input/` holds the sources and the notes, and its `build/` holds the notes
generator (see `build_notes_skill.md`):

| File | What it is |
|---|---|
| `*.kmz` | The Google My Maps export (⋮ → Export to KML/KMZ, the whole map) |
| `phone.zip` | All the phone's photos and videos, as exported. Used for their position and time only: **never published** |
| `camera/` | The camera photos (Lightroom PNG or JPEG exports), renamed and placed in step 2. Only the picks get published |
| `actual_timeline.csv` | Generated in step 2 |
| `notes.md` | The sheet's single source, generated in step 3 and filled in by the user |

**Privacy.** The site is public, and so is its source on GitHub. The inbox holds private data: bookings, prices, contacts,
people's names, exact lodging addresses, exact positions with times. None of it goes into the repo, not even in an MDX
comment. A stage's position is a town's map position, or rounded to 0.01° (about 1 km): never the lodging's own spot.

## 2. The real timeline

```
npm run timeline -- private/<nn>-<code>/input/phone.zip
```

Writes `actual_timeline.csv` next to the zip: one row per photo or video with a position (`time,latitude,longitude,kind,file`),
times local with their zone (`2026-09-20T20:17:40+06:00`). Files with no position or no date are left out, as are
positions less precise than 1 km (`--max-accuracy` to change it), and a Live Photo's video merges into its photo.

Check the summary it prints: the first and last dates should match the trip. A missing day means no phone photo with a
position that day: ask the user rather than guessing where they were.

Then rename the camera photos and fix their time and position:

```
npm run camera -- private/<nn>-<code>/input/camera --code KGZ --zone +06:00
```

`<CODE>-<nn>` in the order taken; `--zone` when the camera stayed on home time (the moment is kept), `--offset` when
its clock was wrong; each photo gets the position of the closest phone photo within 5 minutes, as XMP GPS.

## 3. The notes file: `notes.md`

The sheet is generated from `notes.md` and the `camera/` folder alone: everything it needs is in them. The file is
drafted once from the inbox (the travelbook's program, the timeline, the map export, the camera photos), then the user
fills it in. Its parts:

- **Front matter (YAML)**: `slug`, `sheet`, `code`, `country`, `start`, `end`, `distanceKm`, `travellers`,
  `costPerPerson` (`{ amount, currency }`, on the ground, flights excluded), `cover` (a photo id), `title`,
  `description`. These go to `trip.yaml` and the MDX frontmatter as they are.
- **`## Avant de partir`**: the user's notes and **Conseils** → `<Before>`.
- **`## Région nn — <name>`** with a fenced `yaml` block: `id`, `name { fr, en }`, `days`, `route` (each leg
  `{ approx?, path }`; `path` is a Google encoded polyline, precision 5, or a plain `[[lat, lng], …]`: decode it).
  Then its **Points** checklist, one line per point:
  `` - [x] `id` · kind (nuits 3, 4) · nom FR · en: name EN · lat, lng · notes ``. Only `[x]` lines go on the map, in
  the list's order (sights are numbered in that order); a missing `en:` is translated. → the region in `trip.yaml`
  and `<Region id>`.
- **`## Repères loin de l'itinéraire`**: unticked points far from the roads; a line moved into a region's list counts
  as that region's. **`## Modifier une route`**: how the user redraws a leg; a GPX or KML file they drop in the inbox
  for a leg is converted to that leg's path.
- **`### Jour nn — <date>`**, for each day:
  - **Titre** → `<Day n title>`.
  - **La journée**: the program against the real timeline. A help for writing, never published as it is.
  - **Rando** fields (nom, départ `@id`, durée, distance, dénivelé, difficulté, type, description) →
    `<Tip kind="hike" at name duration distance ascent difficulty course>`, the description as its text. Pre-filled from
    the travelbook: use only what the user kept or corrected.
  - **Photos**: `- [x]` published, `- [ ]` not. `alt` → `alt.fr`, `légende` → `caption.fr`; camera data comes from
    the file. Placement: a line holding only `[ID]` in **Mes notes** or **Mon avis** → `<Photo id>` at that spot;
    `[ID ID …]` → `<Plates>` with those photos. A ticked photo placed nowhere goes after the day's text, in shooting
    order; a photo placed in another day's notes belongs to that day. An unticked photo is never published, even if
    placed.
  - **Mes notes**, **Mon avis** → the day's text, in the user's voice, reworked lightly: corrected, sentences joined,
    repetitions removed, their wording and judgements kept. **Mes notes** may still hold the pre-filled bullets
    (facts from the program and the photos): use what the user left, turn the list into prose, and drop any line
    still marked "à confirmer" unless the user confirmed it. **La nuit** → `<Tip kind="night" at>` on the
    stage named on the **Nuit** line.
  - **Conseils**: `⚠️` → `kind="warning"`, `💡` → `kind="tip"`, `↪` → `kind="detour"`; `@id` → `at="id"`.
    A tip whose `@id` is an unticked point (off the map) loses its `at`, and keeps the place's name in its text.
- **`### Bilan — <region>`**: **Bien** → `<Good>`, **À refaire autrement** → `<Redo>`, in the region's `<Review>`.

A field left empty means nothing to say: leave the matching box out, never invent its content. A photo is published
as a JPEG of at most 4000 px with its camera data in EXIF and no GPS.

## 4. Generate the sheet

From `notes.md` and `camera/`: `trip.yaml` (as `draft: true` until the user says it is ready), `fr.mdx`, `en.mdx`
(translated from the French, names and alt texts included) and `photos/`. Check:
- **Regions** follow the trip's days; each has `days: [first, last]`.
- **Points**, in the order they were reached: `stage` (a night's place, with `nights: [n, …]`, numbered from the trip's
  first night), `sight` (a numbered stop) and `detour` (on the region map, unnumbered, not in the points table).
- **Routes**: real roads where known; a leg known only by its ends is `{ approx: true, path: [a, b] }`.
- **Names**: `{ fr, en }`, the English ones translated, not copied.

## 5. Write the text

Write `fr.mdx` first, from the notes' facts and the user's own notes and opinions (the voice), then `en.mdx` from it.

Frontmatter: `title` and `description` (one sentence, also used for search engines and the sheet's card).

Structure, in this order:

```mdx
Intro paragraph: the trip in a few sentences.

<Before>
What to know before leaving: permits, money, car, connectivity. Its warnings and tips.
</Before>

<Region id="son-koul">

<Day n={3} title="Bichkek → Kotchkor → Son-Koul" />

The day's text. Places are linked to their point: <Place at="kotchkor">Kotchkor</Place>, or <Place at="ak-tal" />.

<Photo id="DSC01117" />

<Plates>
  <Photo id="DSC01329" />
  <Photo id="DSC01412" />
</Plates>

<Tip kind="night" at="son-koul-camp">
Where we slept and what to know about it.
</Tip>

<Review>
<Good>
- What worked.
</Good>
<Redo>
- What we would do differently.
</Redo>
</Review>

</Region>
```

The boxes (`<Tip>`):
- `kind="warning"`: read before anything else (a border, a closed road, no fuel). With `at="<point>"` when it is tied to a place.
- `kind="tip"`: any practical note.
- `kind="detour"`: the side trips on offer, as a list, each `<Place>` when it is a point.
- `kind="hike"`: `at`, `name`, and its figures when known: `duration="5h30"`, `distance={12}` (km), `ascent={900}` (m),
  `difficulty="easy|medium|hard"`, `course="loop|out-and-back|one-way"`, `gpx="file.gpx"` (in the trip's `gpx/` folder).
- `kind="night"`: needs `at="<stage id>"`.

Rules:
- **The opinion notes are the author's voice.** Keep their judgements and their wording as close as the language allows;
  tidy them, don't rewrite them into something blander or more enthusiastic.
- **Facts come from the notes, the map and the timeline only.** Do not invent places, prices, durations, distances,
  people or camera gear. Something missing stays missing: ask the user, or leave a visible `TODO`.
- Illustrative values (when the user asks for placeholder content) are marked as such, in the text and in `trip.yaml`.
- `travellers` and `costPerPerson` (`{ amount, currency }`: on the ground, flights excluded) come from the user.
- A new kind of block that fits none of the box reference types (MAP, TXT, PIC, RGN, OPN; WRN, TIP, DTR, HIK, NGT): tell
  the user, so they can add a type, rather than forcing it into one.

## 6. Check

1. `astro dev --background`, then read the sheet at `http://localhost:4321/odysseyra-blog/fr/trips/<slug>/` and its
   English twin: every `<Place>`, `<Photo>` and `<Tip at>` resolves (a wrong id fails the page with its name), each
   region map shows its route and points, and photos sit on the right days.
2. `npx astro build` passes.
3. Search the new files for anything from the inbox's private side: lodging names with addresses, booking references,
   prices paid to a named person, exact coordinates of a stay.

## 7. Publish

Commit and push only when the user asks: a push to `main` deploys the live site. Set `draft: false` (or remove it), and
`written:` to the day it is published; `updated:` on later corrections.
