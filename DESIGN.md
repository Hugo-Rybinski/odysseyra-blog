---
name: Odysseyra
description: First-hand trip reports drawn as printed topographic survey sheets.
colors:
  paper: "#ffffff"
  ink: "#12294f"
  ink-2: "#3c5172"
  ink-3: "#5d6f8c"
  hair: "rgb(18 41 79 / 0.18)"
  hair-strong: "rgb(18 41 79 / 0.45)"
  field: "#f4f6f9"
  gold: "#b08d3e"
  gold-ink: "#7d6224"
  gold-wash: "rgb(176 141 62 / 0.12)"
  grid-minor: "rgb(18 41 79 / 0.045)"
  grid-major: "rgb(18 41 79 / 0.08)"
typography:
  display:
    fontFamily: "'Overpass Variable', 'Overpass', system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 1.6rem + 2.4vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "'Overpass Variable', 'Overpass', system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.4rem + 1.6vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.015em"
  body:
    fontFamily: "'Overpass Variable', 'Overpass', system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
    fontFeature: "'kern', 'liga'"
  lede:
    fontFamily: "'Overpass Variable', 'Overpass', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  ui:
    fontFamily: "'Overpass Variable', 'Overpass', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.2
  label:
    fontFamily: "'Overpass Variable', 'Overpass', system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    letterSpacing: "0.12em"
  label-sm:
    fontFamily: "'Overpass Variable', 'Overpass', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.12em"
  data:
    fontFamily: "'Overpass Mono', ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    letterSpacing: "0.02em"
    fontFeature: "'tnum'"
rounded:
  none: "0"
  circle: "50%"
spacing:
  rule-gap: "6px"
  pad: "clamp(16px, 2.5vw, 32px)"
  sheet-pad: "clamp(16px, 3vw, 40px)"
  section: "4.5rem"
  measure: "62ch"
components:
  button-export:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  button-export-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  stage-marker:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    size: "22px × nights shown"
  sight-marker:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    size: "22px"
  tip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "12px 16px 4px"
  sheet-header:
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    padding: "18px clamp(16px, 2.5vw, 32px)"
  index-cell-hover:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
---

# Design System: Odysseyra

## Overview

**Creative North Star: "The Survey Sheet"**

Each trip is a printed topographic survey sheet in the manner of IGN or Swisstopo, drawn the way an industrial technical drawing is: navy ink on white drafting paper with light 10px squares, a border scale in the frame, mounted photo prints, and maps printed on real paper and scanned. The map and its legend are the document; the page is framed, ruled and numbered like a map sheet, with a running head carrying sheet number and coordinates, a title cartouche, a legend box with the export actions, and region sheets that each open on a heavy rule. The reading column inside that frame stays plain: one reading face, real contrast, a 62ch measure.

The world is navy ink on white drafting paper. Ink draws every line, type and border. Gold is the route's colour and the warnings' colour; it never decorates. Depth comes from rules, not surfaces: double borders, single 1px ink rules between cells, hairlines inside them. Corners are square because printed sheets are square; the only circles are the map's own sight symbols.

Density is that of a map margin: small tracked capitals for legend and field labels, tabular monospace for every coordinate and EXIF value, and generous whitespace only in the reading column. Photography is shown at native 3:2 or 2:3, never cropped, captioned as numbered plates.

**Key Characteristics:**
- Ruled double border frames the whole page (2px ink, 6px gap, 1px ink); the gap is a border scale counted from the drafting grid's origin: a tick on every grid line, a long tick on every major (50px) line.
- The sheet is drafting paper: light 10px squares, a slightly stronger line every 50px, showing in the open areas (around text, photos and tips). Every ruled box (running head, title block and legend, regions index, region headers, map and table band, pager, footer) keeps a solid white fill. Every photo plate snaps to the grid: all four image edges on a line.
- Maps carry a scanned-paper finish: a faint seamless paper texture (soft unevenness and fibre tooth, no creases), pinned to the map so it travels with the tiles when the reader drags.
- Navy ink for all line and type; gold reserved for route, warnings, tip marks, focus and the "located" flash.
- Square corners everywhere; circles only as the sight map symbol.
- Overpass for everything, Overpass Mono for coordinates and camera data.
- Grid cells separated by 1px ink rules and 0.18-alpha ink hairlines, never by cards or shadows.
- Map tiles (OpenTopoMap) desaturated and shifted toward navy by a CSS filter so the gold route is the only warm line.

## Colors

A two-ink print palette: navy in three strengths plus hairline alphas, one gold with a darker text-safe sibling, on white drafting paper.

### Primary
- **Survey Navy** (ink): every border, rule, heading, body text, stage marker fill, and the casing under the route line. 14.4:1 on paper.

### Secondary
- **Route Gold** (gold): the route polyline, the legend's route swatch, the active-pin outline, and the focus ring. Non-text only (3.1:1 on paper).
- **Gold Ink** (gold-ink): gold where it must be read as text or a small glyph: tip marks, the "copied" confirmation, hover colour on secondary links. 5.8:1 on paper.
- **Gold Wash** (gold-wash): text selection and the fading highlight on a targeted points-table row.

### Neutral
- **Sheet White** (paper): the page, and the fill of every button, tip, popup and map control at rest (boxes sit on the grid; the grid does not run through them).
- **Graph lines** (grid-minor, grid-major): the drafting squares on the sheet, inside the ruled border, wherever no ruled box covers them.
- **Secondary Ink** (ink-2): lede, caption text, back and map links. 8.0:1.
- **Margin Ink** (ink-3): field labels, metadata, sheet number and coordinates in the running head, EXIF line, attribution. 5.1:1 on paper, about 4.7:1 on field.
- **Hairline** (hair): rules inside a cell (facts divider, table rows, index separators) and the map's 40px grid.
- **Strong Hairline** (hair-strong): link underlines at rest, scrollbar thumb.
- **Field Grey** (field): map background before tiles load, image placeholder, hover fill on the regions index, reduced-motion target-row fill.

### Named Rules
**The Two-Ink Rule.** Navy draws; gold marks the way. If a gold element is not a route, a warning, a tip mark, a focus or a located state, it is wrong. Solid gold is the one gold surface besides the route: it fills a warning's title band, and nothing else; gold-wash only tints the selection, a targeted row and the progress bar's current section.

**The Gold-Ink Split Rule.** Raw gold (#b08d3e) never carries text. Any gold glyph or word at text size uses gold-ink.

**The Tinted Tiles Rule.** Third-party map tiles are always filtered to the sheet (`grayscale(1) sepia(0.35) hue-rotate(180deg) saturate(1.4) contrast(0.7) brightness(1.18)`), so no tile colour competes with the gold route. Tiles overlap by half a pixel to hide seams.

**The Scan Rule.** The paper finish applies to what is printed (tiles and routes) and never to the reader's tools. Two fixed Leaflet panes sit between the route (400) and the markers (600): one multiplies `fold-shade.webp`, one screens `fold-lit.webp` (`src/assets/textures/`, made by `generate.mjs`: broad soft unevenness and fibre tooth, no creases or folds). The texture tiles seamlessly at 600 × 400px, starts at a stable offset per map, and is pinned to a map point: panning drags it with the tiles; page scroll does not move it.

**The Rhythm Rule.** Vertical gaps are grid squares: `--gap` (2 squares) between blocks inside a region, `--gap-section` (4) before each region. The sheet walk then rounds each gap up to a line.

**The Grid-Snap Rule.** Every ruled line sits on the drafting grid. The grid is counted from the sheet's border box (`background-origin: border-box`, the sheet's own border is line zero, lines cover pixels [10k, 10k + 1)), and the sheet is a whole number of squares wide (`width: calc(round(down, 100% - 1px, 10px) + 1px)`). After layout, `src/scripts/sheet-grid.ts` walks the page top to bottom and moves each ruled edge forward onto the next line, never more than one square and only by growing a padding, a margin, a column, a row or a map's height, so nothing is cropped:
- full-width blocks (running head, title block, regions index, section heads, pager, footer): top and bottom rules;
- columns: the plate | cartouche rule, the region map | table rule, the regions index cell rules;
- the export buttons: whole-square boxes (≡ 1px) with 9px gaps;
- table rows, inner boxes (and a warning's band rule, a hike's GPX button), text panels, photo plates (box on lines, image one square inside in steps of 30px for 3:2 or 20px for 2:3, paired plates matched);
- maps: the outline's edges, by growing the map's height.
It re-runs on font load and resize, and fires `sheet:snapped` so Leaflet re-measures.

## Typography

**Display Font:** Overpass Variable (with Overpass, system-ui)
**Body Font:** Overpass Variable
**Label/Mono Font:** Overpass Mono 400 (with ui-monospace)

**Character:** Overpass descends from Highway Gothic, the signage face; it reads as cartographic and technical without becoming cold. The mono cut sets every number a reader might copy.

### Hierarchy
- **Display** (700, clamp(2.25rem → 3.5rem), 1.08, -0.015em): region and "what I'd do differently" sheet headers. The largest type on the page.
- **Headline** (700, clamp(2rem → 2.75rem), 1.08): the trip title inside the cartouche. Deliberately smaller than Display: the title is bounded by the cartouche column, as on a printed sheet.
- **Body** (400, 1.0625rem, 1.65): prose, max 62ch, `text-wrap: pretty`.
- **Lede** (400, 1rem, 1.55, ink-2): the cartouche description, max 52ch.
- **UI** (600, 14px): button titles, back-to-map link, tip point link, legend entries.
- **Label** (700, 0.8125rem, 0.12em, uppercase): plate numbers, tip kind, region meta line, sheet number, language switch.
- **Label small** (700, 11px, 0.12em, uppercase, ink-3): legend and export headings, fact field names, table headers, pager direction.
- **Data** (Overpass Mono 400, 0.8125rem, 0.02em, tabular): coordinates, EXIF, region index numbers, map graticule ticks (10px), scale bar.

### Named Rules
**The Copyable-Number Rule.** Any value a reader might copy or compare (coordinates, EXIF, map ticks) is set in Overpass Mono with tabular figures.

**The Label-Carries-Data Rule.** Tracked capitals name a field or carry data (sheet number, "Région 2 / 6 · Jours 3–5", "Planche 04"). A label that names nothing does not get set.

## Layout

The page is a single sheet: an outer 2px ink border inset by the sheet margin (clamp(16px, 3vw, 40px)), a 6px gap, then a 1px ink inner border holding all content. Below 640px the margin drops to 6px, the outer border to 1.5px and the gap to 3px. Inner cells use one padding token (clamp(16px, 2.5vw, 32px)).

The first viewport is a ruled grid: hero plate left (1.75fr) with a 1px ink rule on its right; cartouche above legend on the right (min 360px); full-width trip map below. A portrait cover inverts the weight (1fr / 1.35fr) and caps the plate at 74vh. At 960px and below the grid stacks plate → map → cartouche → legend; export buttons go to one column below 560px.

Region sections open 4.5rem below the previous content on a 2px ink rule, then a detail band (region map 1.25fr beside the points table, min 420px, single column below 960px), then the reading column. Landscape plates break out of the 62ch column to min(960px, available width); a lone portrait floats right at 340px from 1100px up, otherwise centred at max 420px. Paired plates use a two-column grid with 24px gutter that collapses at 640px.

Breakpoints in use: 560, 640, 720 (points table becomes stacked rows), 960, 1100px.

## Elevation & Depth

Flat. Depth on the sheet is expressed by rule weight: 2px ink for the frame and section openings, 1px ink between cells, 0.18-alpha hairlines inside cells, and the Tip's offset outline (1px ink border plus 1px hairline outline at 3px) as the one "double rule" at component scale. Shadows exist only on things that float over the map.

### Shadow Vocabulary
- **Pin lift** (`box-shadow: 0 1px 3px rgb(18 41 79 / 0.35)`): stage markers, to separate them from tiles.
- **Popup** (`box-shadow: 0 6px 18px rgb(18 41 79 / 0.14)`): map popups only.

### Named Rules
**The Ruled-Not-Raised Rule.** Page surfaces never cast shadows; separate them with a rule of the right weight. Shadow is allowed only for map overlays.

## Shapes

Square corners throughout (0): buttons, tips, map controls, popups, stage markers, table, frame. The circle (50%) is a map symbol, reserved for sight markers in the map, legend and table. A detour is a small open ring. There are no pass or warning symbols: a pass or a track is a place like any other (a numbered stop), and road or access warnings are warning boxes. Icons are authored 24px line drawings, 1.75 stroke, round caps and joins, in currentColor.

## Components

### Buttons (export actions)
Printed-form boxes, inverted on hover.
- **Shape:** square (0), 1px ink border.
- **Default:** paper fill, ink text, 8px 12px padding, 16px line icon left of a UI-weight title and a 13px ink-3 hint, shown at every width (kept to a few words so the 2×2 grid stays one line per hint). Rows share one height.
- **Hover:** fills ink, text white, hint at 75% white; 160ms `cubic-bezier(0.16, 1, 0.3, 1)` on background and colour.
- **Focus:** global 2px gold outline, 3px offset.
- **Done (copy):** title gains " · Copié/Copied" in gold-ink for 1.8s (white while the button is still hovered), announced through a polite live region. Without clipboard access the text is selected and the live region says how to copy it.

### Mark
A drafting compass with a star inside, drawn only with circles and straight lines on a 64-unit grid (`src/assets/logo/make-logo.py` writes the three files). The compass: a 24.5-unit ink ring (3 wide), four kite pointers whose widest point sits on the ring (north reaching further out and a little wider), and four short ink ticks inside the ring on the diagonals. It is turned 22.5° east, while the rose at its centre stays upright, like the declination diagram in a map sheet's margin: a gold four-point star (17.5) over a smaller ink one on the diagonals (13.5), clear of the pointers' tails and the ticks. The canvas is cropped square to the drawing. `logo.svg` (ink on paper), `logo-white.svg` (white on ink grounds), `favicon.svg` (a square ink tile, corners square like the sheet, the drawing at 88% for a margin; no ticks or inner rose, which are lost at 16px).

### Navigation (running head)
A map-sheet header row: logo and tracked "ODYSSEYRA" (800, 0.16em, 14px), sheet number and country in label/ink-3, FR / EN switch in label (current in ink, other ink-3, gold-ink on hover), centre coordinates in data/ink-3. 1px ink rule beneath. Below 640px it becomes two rows. The language link keeps the reader's current region via the hash.

### Regions index
`IndexStrip.astro`. A ruled strip of cells (auto-fit, min 170px), hairline-separated, compact: a small line with the mono index number and the day range in ink-3 (12px, split by a drawn 3px dot), then the region name (15px/600). Column rules run down to the strip's bottom rule (the walk grows the cells, not the strip); rows that wrap are ruled off from the row above, each on a grid line; a last cell short of the sheet's edge closes its row with a rule of its own; the last column runs to the sheet's edge. Each cell is a toggle button that shows its region on the trip map above (pressed again, or "Tout afficher": the whole trip); a 16px down arrow in its top right corner (36px target, 44px on touch) goes to the region's section. The region shown on the map, whoever asked for it (a cell, a region header's back link), has its cell in solid ink with paper text, like a day strip (`map:region` event from SheetMap). Hover fills field.

### Sheet header (signature)
Each region opens with a 2px ink top rule, Display title, a label meta line in ink-3 ("Région n / N · Jours a–b"), and a "back to map" link that scrolls to the trip map and highlights the region: its lines and markers stay full strength (markers get the gold outline), everything else drops to 0.25 / 0.4, the map flies to the region (to its single point when it has no track), and a caption box top right names it with a "Tout afficher / Show all" reset.

**Sticky.** The page's running head stays at the top of the window all the way down (z 30), exactly as drawn; its sheet label ("Feuille 01 · Kirghizistan") links to the top of the page. Under it, sticky with it, a progress bar two grid squares tall (`Progress.astro`, 20px with its 1px ink bottom rule): one equal, named segment per section ("Avant de partir", then each region as mono number + name, 11px/600, ellipsis), split by 1px hair-strong gaps like the ticks of a scale; sections read are solid ink with paper text, the current one fills with gold over gold-wash (laid on paper) as it is read, in ink text (the last one completes at the bottom of the page), sections ahead are field with ink-3 text. Cells are fixed, never sized by the reader's position: each takes its label's own width (`flex: 1 1 auto`), the spare width shared equally; on a narrower bar they shrink in proportion and the longest names end in an ellipsis, full name in the tooltip. On phones (≤720px) the cells are equal and show only the region number ("Avant de partir": its first word). Number and name are both trimmed to cap height, so they centre on one line. Each segment links to its section; the current one carries `aria-current="location"`. Region headers do not stick. `sticky-heads.ts` publishes the running head's height as `--head-h`; anchors land below both (`scroll-padding-top`).

### Survey map (signature)
Leaflet over filtered OpenTopoMap tiles, on a field ground with a 40px hairline grid, framed by a flush 1px ink outline (drawn just outside the map, so it overlaps rather than doubles the ruled box edges it touches). Routes are segments: a recorded stretch (GPS track or routed road) is a 3.5px gold line over a 7.5px navy casing; an approximate stretch (only its ends known) is a 3px gold line dashed 2/9 over a 6px white underlay, no casing, and carries a "Tracé approximatif" legend entry (no note under the map: the legend explains it). On the trip map an invisible 16px hit line per region names it on hover and links to its section. Graticule ticks on the frame in 11px mono on 92% white, with a 1px ink tick; scale bar in 11px mono. Square zoom controls with 1px ink border, metric scale bar bottom right.

Trip map height: the trip map and the regions index under it fill 80% of the window height together (the trip at a glance), the map never below 320px; set by the sheet walk, which trims it by whole squares once the index has its final height, so everything below stays on the grid.

Markers: a stage is numbered by its nights, a sight by its own sequence. Stage = navy square per number shown (26px on the map with a 2px white border, 22px in tables): one night "05", consecutive nights a double square "03–04", separate stays at one spot merge into one marker, a triple square "01–02 · 14" (the separator is a drawn 3px dot: Overpass's middle dot has no advance width). Sight = true circle (24px on the map, 22px in tables), 2px navy ring. Numerals are trimmed to cap height (`text-box: trim-both cap alphabetic`) so they sit at the shape's centre; the shared `.badge` class in `global.css` draws them on the maps, the tables and the legend. Markers closer than their own width fan out a few pixels. Detour (a place along the way, or a possible side trip) = 12px open ring, 2px navy on white with a white halo, unnumbered: it does not take a stop number, stays out of the points table and is linked from the text with `<Place>` (its no-script link goes to the region map). Legend: "Autre lieu mentionné" / "Other place mentioned". The trip map shows stages, passes and warnings only; sights and detours live on the region maps. Markers stay out of the tab order (the points tables carry the same actions); their accessible name is "Nuits 03–04 · Place, kind" or "07. Place, kind".

Bottom edge: one strip, left to right: the scale (its right end is the "i"'s left rule), an "i" square whose credits unfold between the two, and the map's box reference in the corner, ruled and filled like the "i".

Popups: kind label, name, a mono copy button for the coordinates, a link per tip, and on the trip map a link to the region. On touch screens one finger scrolls the page; an "Explorer la carte / Explore the map" toggle (44px, top right) enables dragging.

### Points table
Coordinates ledger in body size: label-small headers over a 1px ink rule (sticky, the rule drawn as an inset shadow), rows on hairlines, symbol column sized to the widest badge. Past 7 places (4 when the list sits under the map, as on phones, where rows are taller) the list scrolls inside its box, showing exactly that many rows, with a soft shade under the last visible row until the end is reached. The region map is never shorter than 5 rows of the list (plus its head, side by side); stacked, that minimum stops at 70% of the window height. The map sits above the list in the stacking order, so the sticky heads never cover its outline, and it re-fits its route whenever the sheet walk resizes it, until the reader moves it. Coordinates are a mono copy button with a 15px icon turning gold-ink on hover; Google/Apple Maps links below in 13px/600 ink-2. On touch every action is 44px tall and the copy button and links share a wrapping row. A targeted row flashes gold-wash over 2.4s (static field fill under reduced motion). Below 720px rows stack into a two-column grid.

### Inner boxes (Tip)
`<Tip kind="…">` boxes set into the text, five kinds. All share the legend-note box (paper fill, 1px ink border plus a 1px hairline outline 3px out, square), a head row (18px line icon, label caps, an optional point link right-aligned, 14px/600 ink-2, from `at="point-id"`), a stable id (`tip-<point>-<kind>`) so map popups link to them, and the gold outline flash when targeted. The icon and the label (trimmed to its cap height) share one centre line.

- **warning** ("Attention" / "Warning", warning triangle): road, border, fuel, anything to read first. A double gold frame (1px gold border plus a 1px inset), its outline gold at 55%; the head is a solid gold band over the box's width, ink capitals at 800 (4.6:1 on gold), the icon on a 28px paper disc; the text stays on paper. When the sheet walk grows the band to whole squares it splits the growth above and below.
- **tip** ("Conseil" / "Tip", info circle): any practical note (money, connectivity, timing). The plain box, icon in gold-ink.
- **detour** ("Détours possibles" / "Side trips", forking path): a list of side trips; each item is marked with the map's 12px detour ring, a `<Place>` at the start of an item bringing its own (so it also flies the map there).
- **hike** ("Randonnée" / "Hike", mountain with a flag): `name` (required) in 18px/700, then its figures on a field strip across the box (label-small caps over 600 tabular values, auto-fit from 118px): duration (`duration="5h30"` → "5 h 30", "45min" → "45 min"), distance (km), elevation (`ascent`, the gain only → "+900 m"), route (`course`: loop, out-and-back, one-way → "Boucle", "Aller-retour", "Aller simple"), difficulty (`easy | medium | hard` → three 8px squares, as many filled as the level, then "Facile", "Moyenne", "Difficile"); each figure only when given. Then the description, and with `gpx="file.gpx"` (from the trip's `gpx/` folder) a "GPX de la randonnée" download box styled like the export buttons, whole squares on the grid.
- **night** ("Nuit" / "Nuits", bed): `at` a stage (required). Its place as on the map: the stay's ink square with its nights and the place name in 600, a link that flies the region map there, the coordinates in 12px mono ink-3; then the optional text.

**Set into the text.** A box next to running text (directly, or through up to two other boxes) is part of that text panel: the outer `aside` becomes a stretch of the panel (same width, fill, side rules and padding, top or bottom rule when it opens or closes the run) and the box sits inset in the text column. A box with no text beside it (between plates) stands on its own in the reading column. The selector lives in `global.css` and `sheet-grid.ts` (`TIP_IN_TEXT`).

### Plate (photo)
A mounted print: a white box with a 1px hair-strong border; border plus padding is exactly one grid square, so the image inside lands on the grid when the box does. Inside: the native-ratio image linking to the original, then a caption: label "Planche nn" in ink beside caption text in ink-2, and, when the photo has EXIF, a data line in ink-3 with aperture · shutter · ISO · focal, camera · lens. Missing EXIF values are omitted, not dashed; with none, the line is left out. The image itself is the only link to the full-size file.

### Place reference
`<Place at="point-id">words</Place>` (or `<Place at="point-id" />` for the place's own name) names a place in the text, keyed to the map: its map symbol inline before the words (the stay square or stop circle at 0.62em with a 1.8em unit, or the detour ring), then the words as an ordinary link. A click brings the region map into view (centred), flies to the place and opens its card, the marker flashing the gold outline; without scripts it links to the place's row in the points table.

### Box references
Every box carries a reference in its bottom right corner, as a technical drawing numbers its items: `SHT<sheet>-<year>-<country code>[-R<region>][-D<day>]-<type>-<n>`, e.g. `SHT01-2026-KGZ-R04-D09-TXT-01` (the sheet number first, as on the index's card `IDX-SHT01-KGZ`). The region is left out outside the regions (sheet top, "Avant de partir"); the day appears when a day strip comes before the box in its region, and never on RGN or MAP. Types: MAP, TXT (a text panel), PIC, and the inner boxes by kind (WRN a warning, TIP a tip, DTR detours, HIK a hike, NGT a night), RGN (a region or "before you go" header), OPN ("Mon avis"). `n` counts the boxes sharing everything before it, from `00` (two digits): the second text panel of day 9 is `TXT-01` while that day's first tip is still `TIP-00`. The page is the same in every language, so a box keeps its reference across languages.

The sheet index uses `IDX` in place of year and country: `IDX-MAP-00` (the index map), `IDX-LST-00` (the list of sheets in its cartouche, two squares of padding under its last row for the label) and `IDX-SHT<sheet>-<code>` (a sheet's card, named after its sheet: `IDX-SHT01-KGZ`, `IDX-SHT02-BOL`, whatever its place in the grid; the label sits above the card's link). The "Feuilles" section head, the legend and the author's links carry none.

Prefixed "Référence " / "Reference ". Mono 11/12px, 0.04em tracking, ink-3 mixed 62% into paper (ink-2 and underlined on hover or focus), absolutely placed 3px from the right border and 2px from the bottom one, inside the box's bottom padding, so it never moves the layout. A plate keeps an invisible copy at the end of its caption's last line so the caption never runs under it; on a map the reference joins the bottom strip, left of the credits. Each is a link to the top of its box (2 squares of scroll margin); boxes that already have an id (maps) take a marker at their top. Stamped in the page by `src/scripts/box-uids.ts` before the sheet walk, since text panels have no element of their own.

### Index numbers
Every index number shows two digits (`idx()` in `src/i18n.ts`): sheets, regions ("Région 04 / 06"), days ("Jours 08–10", `dayRange()`), plates, and numbered points everywhere they appear (map pins, popups, points tables, tip point links, legend samples, copied coordinates, GPX/KML names). Counts (15 days, 6 regions, 3 tips) stay plain numbers.

### Day strip
`<Day n title>` marks a day inside a region: a solid ink strip as wide as the text panels, vellum text, "JOUR" in tracked label caps, "08 / 15" in mono, the date (weekday, day, month, in the page language) at 75% and an optional title in 600. It sits directly on the text panel that follows (no gap, no top rule) and carries `id="day-08"`. When the sheet walk grows it to whole squares it grows its height, not its bottom padding, so the text stays vertically centred.

### Text panel
Running text never sits directly on the drafting grid. Each run of consecutive paragraphs (and lists) in the trip text reads as one solid white panel with a 1px hair-strong rule, exactly as wide as a landscape plate (the wide column, `--wide`), and the text runs the full width of the panel: paragraph spacing becomes padding so the panel is continuous, the run's first paragraph draws the top rule and its last the bottom rule (CSS sibling and `:has()` selectors, no extra markup). Border plus padding is two squares (one on phones), so text starts on a grid line; from 1100px a lone portrait and the text run after it sit as a pair: the portrait takes the right half (`--half`, the width of one plate of a pair), the text the left half, tops aligned; anything else clears below. Below 1100px the portrait is centred at half width and the text runs full width. The panel's edges are snapped like every other rule.

### Review panel
Each region closes with `<Review>` ("Mon avis" / "My take"): a ruled panel as wide as the text panels, 1px ink border, a head row (checklist icon, label caps) over a 1px ink rule, then two parts in one column, split by a hair-strong rule: `<Good>` "Les points forts", a list marked with a drawn 14px ink plus, and `<Redo>` "Ce que je referais autrement", marked with a 14 × 2px ink dash; 28px indent, part titles in ink-3 label caps. The sheet walk puts the split rule on a grid line.

### Sheet index (home)
The home page (`/fr/`, `/en/`) is the series' *tableau d'assemblage*: every sheet on one map, drawn with the trip sheet's own parts. Running head with "Tableau d'assemblage" / "Sheet index" as its sheet label, no progress bar (sheet links land right under the head). First view as a trip sheet's: the index map in the large cell (left, 1.75fr, at least 320px, 80% of the window), the cartouche (Headline: the tagline, then the list of sheets) over the legend beside it, the legend at the foot of the margin column (route, approximate route, "Feuille de voyage" / "Trip sheet", and "Feuille à venir" / "Coming-soon sheet" when there is one). On the map each sheet's routes are drawn as on the trip map, inside its extent: a 2px ink line dashed 8/5 over a 4px white underlay (readable over dark relief) around everything it draws (8% margin, at least 0.25°), numbered on its top left corner by an open 26px square (paper, 2px ink border: not a stay), which is a handle: a click fits the map to the sheet (again: all sheets), hover inverts it. An extent smaller on screen than 48 × 36px (zoomed out) hides its dashes and underlay: only its number marks the sheet.

**List of sheets.** Under the title, "Feuilles" in small label caps over a ruled ledger (1px ink top rule, hairline rows, each on a grid line): every sheet, published first, then the coming-soon ones. A row is a toggle like a regions index cell: the sheet's number in the map's open square, its title (15px/600), then the country and dates (or the stamp and `when`) in 13px ink-3 split by a drawn 3px dot. Pressing it fits the map to the sheet's extent, highlights it there and fills the row in ink; pressed again, or "Tout afficher", shows all sheets; the map's numbers press the same rows. A published row ends in a 40px arrow cell, ruled off by a hairline, that opens the full sheet (inverted on hover); a coming-soon row keeps the cell with its arrow greyed (ink-3 at 45% on paper, no link, "Pas encore publiée" / "Not published yet"), its title and number in ink-3. On phones the list follows the map.

**Author.** Under the list, "L'auteur" / "The author" in small label caps over two ruled rows, "Qui je suis" / "Who I am" and "Comment je prépare mes voyages" / "How I prepare my trips", each a link (15px/600, arrow at the right, inverted on hover) to its section of the author's page. On phones they come last, after the legend. Every footer also links the page ("À propos" / "About").

Below, a "Feuilles" / "Sheets" section head (2px rule, Display) over a ruled grid of cards, `auto-fill` from 300px (four to a row at 1440, three at 1100, one on phones), hairlines between cells and the regions index's walk (column and row rules on lines, a short last row closed by its own rule). A card: the cover at its native ratio in a 3:2 frame (a portrait stands in it on field, never cropped), "Feuille 01 · Kirghizistan" in small label caps, the title (step-1, 700; the whole card is its link, field fill and a gold underline on hover), the lede in 14px ink-2, then at the card's foot the dates (600) and a mono line "15 jours · 6 régions · 2 134 km". Under the stats, when the sheet has a `written` date, "Rédigé le 5 octobre 2026" in 13px ink-3. Newest first.

**Coming soon.** `src/content/upcoming.yaml` lists trips without a page yet, either planned (`status: planned`, the default) or travelled and not written up (`status: travelled`): sheet number, country code and name, `when` ("Printemps 2027", "Mai 2026"), an optional title, and a route, places or explicit bounds to place its extent. On the map: the extent in ink-3 dashes, its number on field in ink-3, any route as a 3px ink-3 line on a white underlay, dotted while planned, solid once travelled (never gold: gold is a route with its sheet to follow), no hit line. In the list: the row in ink-3, its stamp before the `when`: "À venir" / "Coming soon" when planned, "En rédaction" / "Being written" when travelled. Its card comes after the published ones, not a link, in ink-3: an empty 3:2 frame (2px dashes, faint diagonal hatching on field) stamped the same one square in from its corner, "Feuille 02", the title (country by default) in 600, and the `when` at the foot. The language picker at the site root (shown only without scripts) is a sheet too: the mark and two boxes, one per language with its tagline.

### Map graticule
Grid references on every map's frame step per axis through 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 45 and 90°: the finest step that keeps labels at least 110px apart across and 70px apart down, so zooming out drops lines instead of crowding them, and the lines stay at round, evenly spaced values. Longitudes past ±180° (a world view wrapping) are not labelled.

### Freshness stamp
Trip sheets carry `written` and optional `updated` dates (`trip.yaml`). Under the cartouche facts: "Rédigé le 5 octobre 2026 · Mis à jour le 14 octobre 2026" (13px ink-3, the dates in 600 ink-2, `<time>` elements, a drawn 3px dot between), the update shown only when later than the writing.

### Author's page
`/fr/a-propos/`, `/en/about/` (`src/content/about/{fr,en}.mdx`, `[page].astro`): running head labelled "À propos" / "About", a cartouche (title, lede) ruled off at the top, then two parts opened like regions (`<Part part="who">`, `<Part part="prep">`: 2px rule, Display title, a reading column of text panels), anchored `#qui` and `#preparation` in both languages.

### Before-you-go section
`<Before>` opens the trip text before the first region: a section head like a region's (2px ink rule, Display title "Avant de partir", checklist icon and "Préparation" in label caps) with no map, then a reading column of text panels and tips (permits, cash, connectivity).

## Do's and Don'ts

### Do:
- **Do** frame every trip page in the ruled double border (2px ink, 6px gap, 1px ink).
- **Do** separate cells with 1px ink rules and hairlines (rgb(18 41 79 / 0.18)) rather than background tints.
- **Do** set coordinates, EXIF and map ticks in Overpass Mono with tabular figures.
- **Do** use gold-ink (#7d6224) for any gold text or small glyph; keep raw gold (#b08d3e) for lines, fills and the focus ring.
- **Do** filter any map tiles to the navy sheet so the gold route is the only warm line.
- **Do** show photos at native 3:2 or 2:3 with their plate number and EXIF line.

### Don't:
- **Don't** round corners on boxes, buttons, tips or map controls; the circle belongs to the sight symbol only.
- **Don't** put drop shadows on page surfaces; shadow is for map pins and popups.
- **Don't** use gold for decoration, headings, backgrounds or body links (a warning's gold band is the single exception).
- **Don't** draw an approximate stretch as a solid line, or join unrelated points into one line: a route the reader may follow must say how precise it is.
- **Don't** crop photos or force them into a uniform ratio.
- **Don't** set a tracked-capital label above or below a heading unless it carries a field name or data.
