---
name: build-notes
description: Build a trip's notes.md, the single editable source a sheet (blog post) is generated from, out of the trip's raw material (travelbook program, phone timeline, Google My Maps export, camera photos). Use when the user wants to start writing up a trip, or asks to (re)build or refresh its notes file.
---

# Build a trip's `notes.md`

`private/<nn>-<code>/input/notes.md` and the `camera/` folder next to it hold everything the sheet needs. The
`create-blogpost` skill generates the sheet from them. This skill drafts the notes: the data comes pre-filled from the
sources, and the user then writes their own text into it. Everything is in French, the sheet's source language.

## Before you start

1. **The inbox** `private/<nn>-<code>/input/` (git-ignored) holds the sources, and `notes.md` once built:
   - the travelbook JSON (the planned program: `days[].activities`, `accommodations`);
   - the My Maps export (`*.kmz`);
   - `phone.zip`;
   - `camera/`;
   - optionally, the traveller's own raw notes (`perso.md`, any Markdown dump, day by day). See "Merging the
     traveller's notes".
2. **The timeline:** run `npm run timeline -- <inbox>/phone.zip`, which writes `actual_timeline.csv`.
3. **The camera photos:** run `npm run camera -- <inbox>/camera --code <CODE> --zone <+hh:mm>`. It renames them
   `<CODE>-nn` in the order taken, fixes their time and writes their position into the files. Check the camera's
   clock first: compare camera and phone shot times. A camera left on home time needs `--zone`; a clock that was
   simply wrong needs `--offset`.
4. **The regions:** ask the user how the trip splits into regions, with a name and the days of each. Don't invent the
   split.
5. **An existing `notes.md` belongs to the user.** Before replacing it, regenerate from the same inputs into a scratch
   folder and `diff`. If the user edited it, merge your changes into their version, never over it.

Write the generator next to the inbox, in `private/<nn>-<code>/build/` (git-ignored), never only in a temporary
folder: it is specific to each trip, and the user's sorted notes live with it. Start from the last trip's
(`private/01-kgz/build/`, whose `README.md` describes it):
- `gen.mjs` finds the inbox (`../input`) and its data relative to itself. `--out <dir>` writes elsewhere, for the diff.
- `check.mjs` runs the checks below.
- `data/` holds everything not derived from the sources: photo metadata, alt texts, captions, the user's sorted notes,
  the pre-fill, and a frozen copy of any sheet it seeds from.
- `sheets/` holds the contact sheets.

Run it, read what it wrote, fix it, run it again. Any change to the user's content goes into `data/` so a rebuild keeps
it.

## Privacy: what never goes in

The site and its source are public, and the notes feed them. Leave out:
- lodging names;
- addresses, phone numbers and other contacts;
- people's names;
- booking numbers, door codes, payments and car rental details;
- lodging positions.

The travelbook mixes these into ordinary text: for example, "Indiquer sur place que vous venez de la part de <name>"
inside a permit description. So:
- Pass **every** description through a filter that drops each sentence naming a contact, a booking, a payment, a phone
  number, a code or a call. Use `/de la part de|r[ée]serv|pay[ée]|paiement|code|contact|t[ée]l[ée]phone|\+\d{2,}|\b\d{2}[ .]\d{2}[ .]\d{2}\b|whatsapp|appeler/i`.
- Replace every lodging name, wherever it appears, with "l’hébergement".
- Drop every map or program place within 300 m of a lodging, or whose name looks like one (hotel, guest house, yurt
  camp…).
- A night is written as the **place and the kind of lodging** ("Rive sud du Son-Koul, camp de yourtes"). The kind
  comes from the lodging's name and `type`.
- **Audit the file at the end:** collect every value of the travelbook's private fields (`name`, `contact`, `booking*`,
  `address`, `*_location`, links, the car) and search the file for each one. A hit is a leak unless the value is
  harmless (a time, for example).

## The file, top to bottom

1. **Front matter (YAML)**: `slug`, `sheet`, `code`, `country { fr, en }`, `start`, `end`, `distanceKm`,
   `travellers`, `costPerPerson { amount, currency }`, `cover`, `title`, `description`. Fill in what the sources know
   and leave the rest empty with a comment: travellers, cost, title, description.
2. **`# <title>`, then a quoted "mode d'emploi"**: one bullet per convention below, written for the user,
   including how to place a photo: its id in brackets, alone on a line of **Mes notes** or **Mon avis**, `[KGZ-12]`,
   several together `[KGZ-28 KGZ-29]` (portraits side by side, landscapes full width); a ticked photo placed nowhere
   goes after the day's text in shooting order.
3. **`## Avant de partir`**: **Mes notes** (empty), then **Conseils**, pre-filled only with facts from the program
   (a permit, for example).
4. **`## Région nn — <name>`**, for each region:
   - a fenced `yaml` block: `id`, `name { fr, en }`, `days: [first, last]`, `route`;
   - a **Points** checklist (see below);
   - its days;
   - a `### Bilan — <name>` with **Bien** and **À refaire autrement**, both empty.
5. **`### Jour nn — <weekday day month>`**, for each day:
   - **Titre**: from the program's `city` ("Bichkek → Son-Koul").
   - **La journée** (see below).
   - **Rando**, one block per planned hike: `nom`, `départ` (`@id` when a point matches), `durée`, `distance`,
     `dénivelé`, `difficulté` (blank, with `(facile | moyenne | difficile)`), `type` (boucle, aller-retour or aller
     simple), `description`. Pre-fill from the program and say so in the block's heading: the user corrects or deletes
     it.
   - **Photos (n)**.
   - **Mes notes**, pre-filled (see below); **Mon avis** and **Conseils**, empty.
   - **La nuit**, empty, when there was a night.
6. **`## Repères loin de l'itinéraire`**: places more than 25 km from every region, all unticked.
7. **`## Modifier une route`**: where the roads come from, and three ways to change one:
   - a straight line with `approx: true`;
   - Google's polyline editor;
   - a GPX or KML file dropped in the inbox.

## La journée: the program against what happened

A help for writing, never published as it is.

1. **The program:** the day's title and description (filtered), then one **Routes** line chaining each road's legs:
   "A → B → C, 123 km, 2h30, départ 09:30. <description>".
2. **The timeline**, as stops:
   - A trip day runs from 04:00 to 04:00.
   - A stop is a run of consecutive phone points within 1.5 km of its first point, with no gap over 90 minutes.
   - Name a stop after the nearest place: the program's places, activities and leg ends, then the map's pins. Within
     2 km, use the place's name. Within 25 km, write "à N km de X". Further away, write its coordinates.
   - Merge consecutive stops with the same name.
3. **Planned places** (any activity with a coordinate that isn't a road) are "seen" when a phone point is within 1 km,
   or 2 km for a town. For each stop:
   - If it matches a place planned **that day**, append the place's (filtered, shortened) description.
   - If it matches a sight planned another day, add "prévu le jour nn".
   - If it matches nothing and is "à N km de…", it reads "en route (…)". Consecutive en-route stops merge into one
     line.
   - Each line ends with its photo count, and the time zone when it isn't the trip's.
4. **After the stops**, list each planned place with no photo: "Prévu, sans photo sur place : X — description", or
   "Prévu ce jour-là, fait le jour nn : X" when the timeline shows it on another day.
5. **Nuit**: where the phone was after 18:00, or else before 10:00 the next morning.
   - If the planned lodging is within 3 km of it, or there's no photo at all, write the planned lodging as place and
     kind. With no photo, add "(prévu, aucune photo pour le confirmer)".
   - Otherwise, write the named place.
   - Add "→ point `<stage id>`".
   - A night spent travelling reads as such ("en vol, correspondance à Istanbul").

## Mes notes: a factual start for each day

Pre-fill each day's **Mes notes** with a bulleted list, one idea per line, under the heading
`**Mes notes** — _pré-rempli d'après le programme et les photos : à corriger, compléter, raconter_`. Sources, and only
these:
- the day's program and its description;
- the phone timeline;
- the camera photos (what they show, from the contact sheets).

Rules:
- **In the order of the day, with approximate times** ("vers 13:20"). Aim for 4 to 8 lines, fewer for a travel day.
- **What the photos show, stated plainly**: "un grand troupeau de chevaux dans la poussière". No feelings, no
  judgement: those are the user's to write in **Mon avis**.
- **Where the plan and the timeline differ, say it**: "prévu le lendemain", "vu le 22", "prévu mais sans trace : …".
- **An inference is flagged**: "(à confirmer)", "un cosmonaute ?". Planned figures say so ("prévu", "d'après le
  carnet").
- **The same privacy as everywhere**: a night is "Nuit à Karakol", never the lodging.

## Merging the traveller's notes

When the user has written their own notes (`perso.md`), they replace the pre-fill: they are the user's voice and what
actually happened. Keep them in a data file next to the generator (one entry per day, plus "avant" and each region's
bilan), so a regeneration keeps them. Sort each line into its section:

- **Mes notes**: the narrative, in their words and order, nested bullets kept. Only harmonise place names to the
  sheet's spellings (Kolsou → Köl-Suu, Narine → Naryn, Djety-Oguz → Jeti-Ögüz).
- **Photo references** ("photo KGZ12", "photos KGZ46, 47, 48", typos like "KJZ31" included) become placements on
  their own line, after the bullet they illustrate, with blank lines around them. Group consecutive portraits, or
  consecutive landscapes, into one `[ID ID]` line; never mix the two orientations in a group. An unreferenced photo
  of the same scene can join its neighbours. When a reference contradicts the photo's time (a photo placed on a day
  it wasn't taken), don't place it: report it.
- **Conseils**: what the user stressed (bold, "conseil", "attention", "ne pas…") becomes a tip, written as advice to
  the reader: `⚠️` for a risk or a must-know, `💡` for the rest, with `@id` when it's about one point.
- **Mon avis**: judgements, regrets and "avec le recul" lines that aren't advice.
- **La nuit**: what they say about the lodging (layout, food, wifi, heating, hot water), never its name. For a night
  they say nothing about, write the program's place and kind of lodging ("Chambre d'hôtes à Tokmok"). Where the
  night moved, write where they actually slept.
- **Avant de partir**: preparation notes (permits, car, bookings, driving, apps) go to its Mes notes or Conseils.
  They replace the program's figures.
- **Bilan**: a per-region verdict goes to **Bien** or **À refaire autrement**.
- **Rando**: rebuild each block from their account. Real figures win; keep a program figure only when they give none,
  marked "(prévu)". Difficulty is theirs. Drop the planned hikes they didn't do.

**Times.** Give a moment of the day a round time from the phone timeline: the stop at the place the line names. Use
the camera's time where the phone has no point nearby. Rounding:

| Minutes past the hour | Wording |
|---|---|
| 0–7 | "vers 15h" |
| 8–22 | "un peu après 15h" |
| 23–37 | "vers 15h30" |
| 38–52 | "un peu avant 16h" (and "un peu avant midi") |
| 53 and over | "vers 16h" |

Keep every time the user wrote. Where theirs and the timeline's disagree, don't add one: report it. Times are local.

Then let their facts correct the rest of the file:
- **Nights:** a cancelled or moved night changes the stage's `nights` and the day's Nuit line. The lodging kind ("auberge
  de jeunesse", "camp de dômes") comes from them.
- **Points:**
  - tick what they visited;
  - untick what they didn't find or reach, and say so in the line;
  - add the places they name that no source had, positioned from the camera photo of the place ("perso.md, photo
    KGZ-59");
  - move a pin to its photos when they confirm the place.
- **Captions:** use the names they give ("bazar Och", "statue de Gagarine"), and drop a "?" they answer. When their
  name contradicts what the image shows (text on a façade), make the alt neutral and report the conflict.
- **Stay private:** prices and tips are fine, but run the privacy filter and audit again. A rental agency or a host
  they name is still private.

Report what the notes don't cover: days or sections left empty, photo references that don't match, a name to check, a
"FixMe" in their text.

## Points: as many as the sources have, ticked or not

Line format, which `create-blogpost` parses:

```
- [x] `id` · kind (nuits 3, 4) · nom FR · en: name EN · lat, lng · vu jour 03 à 13:01 · source
```

1. **Collect.** Start from the curated points, if a sheet already exists. Then add every program place and every map
   pin. Skip the map's legend folder and its directions layers: their points are plus codes and addresses.
2. **Merge duplicates.** A candidate is the same place as an existing point when it is within 500 m of it, or when
   one name contains the other (4+ letters) within 2 km.
3. **Drop** lodging places (see Privacy).
4. **Assign a region:** the region of the day of its first phone point within 1 km (2 km for a town), else of its
   planned day. Failing both, take the region whose roads or points pass nearest, if within 25 km. Otherwise, put it
   under "loin de l'itinéraire".
5. **Choose kind and tick.**
   - Stages (nights) are always ticked, with their `nights`, numbered from the trip's first night. Check night 1: a
     night on a plane is not a stage night.
   - A visited place that isn't a town and isn't within 1.5 km of a point already ticked: `sight`, ticked.
   - Everything else is unticked: `detour` if never visited.
   - Then use judgement, and say why when it isn't obvious:
     - Between two pins for one place, keep the one where the photos are.
     - Untick places with no photo.
     - Fix a pin that is visibly off, using the photos' position, and say so in the line ("position des photos
       KGZ-39/40").
     - Coordinates known to be wrong get corrected: the Kyrgyzstan travelbook's Burana is off, the tower is at 42.746,
       75.25.
6. **Order** each region's list by when each place was reached: sights are numbered in that order. A stage counts at
   23:00 of its first night.
7. **Write the line:**
   - The `en:` name only when you have one; otherwise it is translated at generation.
   - Positions to 4 decimals.
   - The ids are slugs, unique across the trip.

## Roads

- **Where they come from:** the legs of the travelbook's **latest version** in the inbox (`(vNN).json`, the highest
  NN): the user adds the roads they really drove there. Read them directly, never from an existing sheet.
  - Use each leg's embedded track (`gpx`: base64 gzip GPX, `rtept`/`trkpt`), else its `waypoints`, else
    `{ approx: true, path: [start, end] }`.
  - A leg without `start_location` or `start_coordinate` starts where the previous leg ended.
  - Simplify each track with Douglas–Peucker at ~30 m (0.0003°), rounded to 5 decimals: a routed track has a point
    every few metres.
  - Drop an optional detour (`detour: true`) that has no track: it wasn't driven.
  - The legs go to the region whose days contain the leg's day. `distanceKm` is the sum of their lengths.
- **Roads drawn on the map:** read **every** `*.kmz` in the inbox, since the user adds pins and roads in later
  exports.
  - A directions line where at least half the points lie more than 1 km from every travelbook leg is a road the user
    added. Add it as a leg.
  - Its day is the day of the phone points within 1 km of it. A line with no phone point nearby is left out.
  - Lines the travelbook already covers (the whole-trip itinerary, a "Day 1" layer) are skipped.
- **A pin the user adds for a place already in the notes** (same place, an English or misspelt name) replaces that
  place's position. Drop the pin as a candidate and as a label, so the French name stays.
- **How they're written:** in the region's `route`, one leg per line, as a Google encoded polyline (precision 5) in
  **single quotes**, because encoded strings contain backslashes, which are escapes in double quotes.
- **The comment:** each leg ends with "start → end · N km", plus ", ligne droite" for an approximate leg. Name each end
  after the sheet's nearest point within 3 km, else the nearest named place.
- **They're the travelbook's roads,** planned or corrected by the user. Say so in "Modifier une route".
- **Check them against what happened.** Find the places in the user's notes and camera photos that no leg passes
  within a few km of (a side valley, a lakeshore drive). List those, and the planned legs to places the user didn't
  visit. The phone timeline is too sparse to judge a leg by coverage, so check places, not percentages.

## Photos

- **Look at every photo before describing it.** Make 3 × 3 contact sheets labelled with each photo's id and time,
  and read them all.
- **One line per photo:**
  `- [x] **KGZ-12** · 17:24 · 152 mm, f/8, 1/320 s, ISO 100, Tamron 28-200 · _<nearest place, or "pas de position">_`.
  - The camera data comes from the file's XMP or EXIF.
  - Everything starts ticked. The user unticks the ones not to publish.
- **Then two sub-lines:**
  - `alt`: what the photo shows, for someone who can't see it. Concrete, no interpretation.
  - `légende`: the caption displayed under it. Short, and it may name the place. Only name what the GPS, the day's
    route or the image itself confirms; when unsure, stay general or add "?". Nothing the sources don't support (no
    "dernier vestige de…" when the program only says "minaret").

## Check before handing over

- Parse the front matter and every region's `yaml` block.
- Decode every route polyline and compare it to the source coordinates. The error should be 0 at 5 decimals.
- Parse every point line with the format above. Ids are unique, and every stage has its nights.
- Count the photo lines: every file in `camera/` appears once.
- Run the privacy audit (see Privacy).
- Read a few days end to end: a drive day, a hike day and a city day.
- Tell the user:
  - what is pre-filled, and from where;
  - what needs their eye: pins that look misplaced, nights with no photo to confirm them, legs that differ from what
    the timeline shows, captions marked "?";
  - that nothing is published from the notes as they are.
