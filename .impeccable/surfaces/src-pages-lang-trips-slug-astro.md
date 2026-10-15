---
version: 1
slug: "src-pages-lang-trips-slug-astro"
primary_target: "src/pages/[lang]/trips/[slug].astro"
related_targets: ["src/components"]
---

# Trip post page

Scope: the trip post page in both languages (`/fr/trips/<slug>/`, `/en/trips/<slug>/`). Visitor mode: Read.

## Audience and job

Trip planners for less-traveled countries (primary), arriving from search or shared links mid-planning; friends and family (secondary). Success: within seconds the reader knows where the trip went, how long it took and what to watch out for; can export the route (GPX, KML, Google/Apple Maps, copy coordinates); can open any photo at full resolution with its EXIF.

## Structure

- One post per trip, sections per region (a region may span several days).
- Order: running head, hero sheet (photo plate, title cartouche, legend with exports, trip map), region sections (sheet header `Région n · Jours a–b`, region map with numbered stages, prose, plates, tips), "Ce que je referais autrement" / "What I'd do differently", previous/next trip.
- Tips are a distinct content type with a gold marker and symbol matching the map.
- Photos: always native 3:2 or 2:3, never cropped. 3:2 plates span the column; 2:3 plates pair or sit beside text on wide screens. Caption line: plate number, f, shutter, ISO, focal, camera, lens; missing values hidden. Resized for display, full-res original on demand.

## Content model

- One folder per trip: shared data (dates, regions, routes, markers, photo list), `fr.mdx`, `en.mdx`. Prose references regions and photos by id; coordinates and photos are never duplicated per language.
- FR and EN are both first-class: separate URLs, own metadata, hreflang alternates, every UI label and export translated, no fallback. Build fails when a non-draft trip lacks a language.

## States and ranges

1-6 regions; 0-15 tips per region; 5-40 photos; region with markers only, route only, or both; photo with partial or no EXIF.

## Direction contract

THESIS: Each trip is a printed topographic survey sheet (IGN/Swisstopo): the map and its legend are the document, not a widget dropped into a blog template. Refuses the category default of hero image, title, then a rounded map card.

OWN-WORLD: White sheet, navy ink (#12294f) for line, type and borders, gold (#b08d3e) only for the route, stage markers and tip markers. Ruled double border, title cartouche, legend box, running head with sheet number and coordinates, grid-reference hairlines in the frame. The reading column stays plain: reading face, real contrast, 60-75ch measure.

STORY: The reader sees the place (plate), grasps the trip (cartouche: regions, days, distance), reads the legend, takes the route (exports), then follows region by region with warnings flagged in gold.

FIRST VIEWPORT: Running head across the top (ODYSSEYRA · FEUILLE nn · FR / EN · coordinates). Left: hero photo plate at native ratio with its plate caption and EXIF line beneath. Right: title cartouche above the legend, which carries the symbols and the export actions (GPX, KML, Maps, coordinates). Full-width trip map across the bottom, gold route, numbered stages. Portrait hero narrows the plate and widens the cartouche column.

FORM: Survey Sheet, position 1 on the ordered grounded list (taken as Impeccable's pick over the assigned Rebate Edge). Signature interaction: map stages and section headers are cross-linked; selecting a stage scrolls to its region and the region's sheet header highlights its stage on the map. seed: none (unavailable)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
