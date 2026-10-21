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
| `perso.md` | Optional: the traveller's own raw notes, merged into `notes.md` (see `build_notes_skill.md`) |
| `notes.md` | The sheet's single source, generated in step 3 and filled in by the user |

Next to `input/`, `build/` holds the notes generator, its data, and `data/en.json` (the English texts for step 4).

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
  - **Mes notes**, **Mon avis** → the day's text, written as a travel story in the user's voice (see "Writing the
    story" in step 5), their facts and judgements kept. **Mes notes** may still hold the pre-filled bullets
    (facts from the program and the photos): use what the user left, turn the list into prose, and drop any line
    still marked "à confirmer" unless the user confirmed it. **La nuit** → `<Tip kind="night" at>` on the
    stage named on the **Nuit** line.
  - **Conseils**: `⚠️` → `kind="warning"`, `💡` → `kind="tip"`, `↪` → `kind="detour"`; `@id` → `at="id"`.
    A tip whose `@id` is an unticked point (off the map) loses its `at`, and keeps the place's name in its text.
- **`### Bilan — <region>`**: **Bien** → `<Good>`, **À refaire autrement** → `<Redo>`, in the region's `<Review>`.

A field left empty means nothing to say: leave the matching box out, never invent its content. A photo is published
as a JPEG of at most 4000 px with its camera data in EXIF and no GPS.

## 4. Generate the sheet's data

```
npm run sheet -- private/<nn>-<code>/input/notes.md --en private/<nn>-<code>/build/data/en.json [--missing] [--force]
```

`scripts/notes-to-sheet.mjs` writes `src/content/trips/<slug>/trip.yaml` and `photos/` from `notes.md` and
`camera/`:
- **`trip.yaml`** gets the front matter, every region's yaml block (polylines decoded), the ticked points in list
  order and the ticked photos. It is written as `draft: true`: the sheet shows in `astro dev` but stays off the live
  site until the user says it is ready.
- **Photos:** each ticked photo is a JPEG of at most 4000 px. Its camera data goes into EXIF: Make in title case,
  the readable lens name from Lightroom's lens profile, no model code. It has no GPS. Files in `photos/` that are no
  longer ticked are deleted. `--force` re-exports existing files. All 89 KGZ photos took about 1.5 min and 115 MB.
- **English:** names come from the points' `en:`. Alt texts and captions come from `en.json`, as
  `{ "points": { id: name }, "photos": { id: { alt, caption } } }`.
  - `--missing` prints what is still untranslated, with the French, and writes nothing.
  - Without `--missing`, the script refuses to write while anything is missing.
  - Translate, don't copy, and keep the alt texts literal.
  - Put a point's English name in the notes (through the notes generator's data) rather than in `en.json`, so the
    notes stay self-contained.

Fix the notes before generating, not `trip.yaml` after. `trip.yaml` says it is generated; a hand edit there is lost
at the next run. Typical fixes, all in the notes data:
- points out of order: a place reached without a phone photo nearby sorts to its planned day;
- two ticked points for one place;
- a missing `en:`;
- working notes left in an alt text, like "(format vertical)", "(copie retouchée…)" or a "?" the user has since
  answered. Alt texts and captions are published as they are.

Then check:
- **Regions** follow the trip's days; each has `days: [first, last]`.
- **Points**, in the order they were reached: `stage` (a night's place, with `nights: [n, …]`, numbered from the trip's
  first night), `sight` (a numbered stop) and `detour` (on the region map, unnumbered, not in the points table).
  The author numbers only the places a reader would go to on purpose: a sight, a lake, a canyon, a hike's goal. These
  are unnumbered points ("Lieu cité"), each linked from the text:
  - towns the road goes through (Naryn, Ottuk, Bokonbaevo);
  - a viewpoint or pass on the way;
  - a car park;
  - a waterfall at the end of a short walk;
  - a site visited for two minutes or found closed (Manjyly-Ata, Ata-Beyit).

  A point's name is the place's name ("Naryn", not "Naryn : retrait des permis frontaliers"; "Cascades de Barskoön",
  not a description of what is there). A position the author gives keeps all its decimals.
- **Routes**: real roads where known; a leg known only by its ends is `{ approx: true, path: [a, b] }`.
- **Names**: `{ fr, en }`, the English ones translated, not copied.

## 5. Write the text

Write `fr.mdx` first, from the notes' facts and the user's own notes and opinions (the voice), then `en.mdx` from it.
The prose is written by hand, not by a script: the user's bullets become sentences, in their words.

Mapping the notes to MDX:
- **Points:** only ticked points exist in `trip.yaml`. `<Place at>` and `<Tip at>` can only name those. A tip about an
  unticked place drops `at` and names the place in its text.
- **A day's title** comes from **Titre**, the program's. Correct it where the day went elsewhere ("Karakol →
  Jyrgalan → Karakol" for a night moved back to Karakol).
- **Photos:** each `[ID]` line in the notes becomes `<Photo id>` at that spot, and `[ID ID]` becomes `<Plates>`. A
  ticked photo placed nowhere goes after the day's text. Every ticked photo must appear somewhere.
- **Rando → `<Tip kind="hike">`:**
  - `at`: the `départ` point when it is an `@id`, else the point the hike is named after or starts from.
  - `difficulty`: facile → `easy`, moyenne → `medium`, difficile → `hard`.
  - `course`: boucle → `loop`, aller-retour → `out-and-back`, aller simple → `one-way`.
  - `duration` must read like `5h30`, `3h` or `45min`. A figure the box can't hold ("une journée", "un peu moins de
    2h") goes in the text instead.
  - Figures marked "(prévu)" are the travelbook's. Use them when the user kept them; the user's own figures win.
  - **No description by default:** the box carries the name, the start and the figures, and the day's text tells the
    hike. Give it text only for what the story doesn't already say. Never repeat in the prose what the box shows
    (duration, difficulty, "assez facile, la fin monte un peu"), and vice versa.
- **Nights:** a `<Tip kind="night">` closes every day that ends with a night, as the last thing in that day's last
  text box. On a stay of several nights:
  - the first night's box is a plain one, covering the stay ("Nuits 09–11");
  - each later night gets its own box with `night={n}` ("Nuit 10"), carrying what the notes say about that night.
    Ids come from the point and the kind, so two plain night boxes at one stage would share an id.
  - Keep a box even when it only names the kind of lodging ("Dans le centre de Karakol.").
- **Reviews:** a `<Review>` may hold only `<Good>` or only `<Redo>` when one is empty.
- **Conseils** go inside the text box, right after the sentence they belong to, never in a heap at the end of the
  day and never on their own between two photos. Drop a tip that only repeats the sentence before it, and drop
  generic advice that isn't about this trip ("faites laver la voiture avant de la rendre").

Frontmatter: `title` and `description` (one sentence, also used for search engines and the sheet's card).

Structure, in this order:

```mdx
Intro paragraph: the trip in a few sentences.

<Before>
What to know before leaving: permits, money, car, connectivity. Its warnings and tips.
</Before>

<Region id="son-koul">

<Day n={3} title="Bichkek → Son-Koul" />

The morning's text, places linked to their point: <Place at="kotchkor">Kotchkor</Place>, or <Place at="ak-tal" />.

<Tip kind="warning" at="kotchkor">
Set into the text, right after the sentence it is about.
</Tip>

The next paragraph of the same stretch, in the same box.

<Photo id="KGZ-11" />

<Pair photo="KGZ-12">

The text this portrait illustrates, and what follows it up to the next photo.

<Tip kind="hike" at="son-koul-camp" name="Les collines au sud du camp" difficulty="easy" course="loop">
</Tip>

On arrive au camp…

<Tip kind="night" at="son-koul-camp">
Where we slept and what to know about it: the day's last box.
</Tip>

</Pair>

<Plates>
  <Photo id="KGZ-13" />
  <Photo id="KGZ-14" />
</Plates>

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

### Writing the story

A light rework of the notes reads cold, like a list turned into sentences. Write each day as a story the reader
follows:
- **First person plural, informal French** ("on"). A day moves forward in time with transitions: "on repart vers
  15 h", "de l'autre côté", "en fin d'après-midi", "c'est là qu'un orage éclate".
- **Vary the sentences:** a short one after a long one, a colon for the payoff ("Et puis, vers 10 h, le lac
  apparaît : …"). Don't start every sentence with a time.
- **Join the notes' fragments into scenes:** "Arrêt au supermarché" plus "achats pour les pique-niques" becomes
  "Petit arrêt au supermarché en sortie de Bichkek pour faire le plein de provisions".
- **Keep the user's own expressions** ("bien rincés", "un peu galère", "pas un intérêt fou", "très kitsch, beaucoup
  fait rire"). Their voice is what makes the text theirs.
- **Practical figures** (prices, durations, kilometres) stay exact. In the prose they sit naturally ("pour une
  quinzaine d'euros"); the tips give them plainly.
- **No feelings or events the notes don't give:** no "spectacle incroyable" when the note says "troupeau qui galope",
  no "a été déplacée" for a statue the note only places, no "un vrai bonheur" for "très agréable". The story's
  warmth comes from rhythm and connection, not from adding enthusiasm. Re-read for these before handing over.
- **A tip doesn't repeat the sentence before it.** The text tells what happened; the tip says what to do.

### How the author lays out a day

The author reworked the whole Kyrgyzstan sheet box by box. Their edits come down to a few rules; write the first
draft this way:

- **Few, full text boxes.** A day reads as two to four text boxes, not ten. Consecutive paragraphs about the same
  stretch of the day go in one box, and so does a one-line paragraph ("Puis la descente le long du lac."), which never
  stands alone. Start a new box only where a photo, plates or a pair interrupts the story.
- **Boxes live inside the text boxes**, at the sentence they concern:
  - a hike box at the start of the text that tells the hike, or right after the sentence that introduces it
    ("…il faudra moins d'une heure." then the hike);
  - its tips and warnings right after it, the warning below the hike box rather than above it;
  - a road or fuel warning right before the paragraph that sets off on that road ("Ne quittez pas Kotchkor après
    15 h" before "On repart vers 15 h");
  - the night box at the end of the day's last text box.

  A box never stands alone between photos.
- **Pairs hold whole stretches.** A `<Pair>`'s text may run several paragraphs, with the boxes that go with them:
  everything from that photo to the next interruption.
- **Fewer photos of one scene.** When two photos show the same moment (a second pair of the same horses, statues seen
  from behind after the building, forests next to the lake), the author kept one. When the notes tick near-duplicates,
  list them for the user rather than publishing all of them. Two portraits of one stretch go side by side.
- **Captions say what the photo shows from where it was taken** ("La vue sur la vallée d'Ala-Archa, du haut du
  téléphérique"), not a guess at its subject.
- **Times are the author's.** When the notes and the timeline disagree, the notes win. Drop a time the author
  removed ("où l'on passe vers 16 h").

### Photo placement and layout

- **A portrait that goes with a text is a `<Pair>`:** `<Pair photo="KGZ-04">` around the paragraph it illustrates,
  usually the one just before it in the notes. Photos are placed after the text they show. Keep plates in order:
  photos that sat between the paragraph and the portrait go before the pair. On wide screens the pair is one row,
  text left and photo right; narrower, the photo comes first.
- **Two portraits in a row** go together in `<Plates>`.
- **A portrait with no text** stands alone, centred at half width. Floats are not used, so nothing depends on what
  follows a photo.
- A pair's text is its own panel. It can hold several paragraphs and the boxes that go with them (tips, a night):
  they sit inside the panel and share its reference, like boxes set into a run of text. A box left after the pair
  stands on its own.
- When the author asks to merge, split or pair boxes by their reference (`Réf. …-TXT-05`), read the references from
  the page they are looking at. Each change renumbers the boxes after it, so say which block you took.

Rules:
- **The opinion notes are the author's voice.** Keep their judgements and their wording as close as the language allows;
  don't rewrite them into something blander or more enthusiastic.
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
   If a map shows only its grid and the console reports `504 (Outdated Optimize Dep)`, the dev server is stale:
   `astro dev stop`, then start it again.
   **After regenerating `trip.yaml`, restart the dev server.** It reloads the MDX when it changes, but keeps serving
   the old `trip.yaml`: renamed or changed points, positions and photos don't show until a restart. Check the
   served page (a new name, a new position), not just the file.
   Scan the column for holes: a script measuring the vertical gap between consecutive blocks of each `.col`, flagging
   any over 80 px. A lone `<Photo>` portrait where a `<Pair>` belongs is the usual cause.
   Take screenshots to check the layout: desktop and phone width; a region map after its tiles load; a day with
   `<Plates>` and boxes. Use `puppeteer-core` with the system Chrome
   (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`).
2. `npx astro build` passes. A `draft: true` sheet is left out of the build. If it is the only sheet, the home page
   lists none, so a push in that state empties the live site's index. Say so before any push.
3. Search the new files for anything from the inbox's private side: lodging names with addresses, booking references,
   prices paid to a named person, exact coordinates of a stay. Do it with a script: collect the travelbook's private
   values and search `trip.yaml` and both MDX files for each one. Then list every point within 300 m of a lodging. A
   stage at a town's position, or at a position rounded to 0.01°, is fine. A short number found inside route
   coordinates is a coincidence, not a leak.

## 7. Publish

Commit and push only when the user asks: a push to `main` deploys the live site. Set `draft: false` (or remove it), and
`written:` to the day it is published; `updated:` on later corrections.
