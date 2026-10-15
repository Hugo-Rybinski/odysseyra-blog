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
    size: "22px"
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

Each trip is a printed topographic survey sheet in the manner of IGN or Swisstopo. The map and its legend are the document; the page is framed, ruled and numbered like a map sheet, with a running head carrying sheet number and coordinates, a title cartouche, a legend box with the export actions, and region sheets that each open on a heavy rule. The reading column inside that frame stays plain: one reading face, real contrast, a 62ch measure.

The world is navy ink on white paper. Ink draws every line, type and border. Gold is the route's colour and the warning's colour; it never decorates. Depth comes from rules, not surfaces: double borders, single 1px ink rules between cells, hairlines inside them. Corners are square because printed sheets are square; the only circles are the map's own sight symbols.

Density is that of a map margin: small tracked capitals for legend and field labels, tabular monospace for every coordinate and EXIF value, and generous whitespace only in the reading column. Photography is shown at native 3:2 or 2:3, never cropped, captioned as numbered plates.

**Key Characteristics:**
- Ruled double border frames the whole page (2px ink, 6px gap, 1px ink).
- Navy ink for all line and type; gold reserved for route, warnings, tip marks, focus and the "located" flash.
- Square corners everywhere; circles only as the sight map symbol.
- Overpass for everything, Overpass Mono for coordinates and camera data.
- Grid cells separated by 1px ink rules and 0.18-alpha ink hairlines, never by cards or shadows.
- Map tiles (OpenTopoMap) desaturated and shifted toward navy by a CSS filter so the gold route is the only warm line.

## Colors

A two-ink print palette: navy in three strengths plus hairline alphas, one gold with a darker text-safe sibling, on white.

### Primary
- **Survey Navy** (ink): every border, rule, heading, body text, stage marker fill, and the casing under the route line. 14.4:1 on paper.

### Secondary
- **Route Gold** (gold): the route polyline, the legend's route swatch, the warning triangle fill on the map, the active-pin outline, and the focus ring. Non-text only (3.1:1 on paper).
- **Gold Ink** (gold-ink): gold where it must be read as text or a small glyph: tip and warning marks, the "copied" confirmation, hover colour on secondary links. 5.8:1 on paper.
- **Gold Wash** (gold-wash): text selection and the fading highlight on a targeted points-table row.

### Neutral
- **Sheet White** (paper): the page and every button and tip at rest.
- **Secondary Ink** (ink-2): lede, caption text, back and map links. 8.0:1.
- **Margin Ink** (ink-3): field labels, metadata, sheet number and coordinates in the running head, EXIF line, attribution. 5.1:1 on paper, about 4.7:1 on field.
- **Hairline** (hair): rules inside a cell (facts divider, table rows, index separators) and the map's 40px grid.
- **Strong Hairline** (hair-strong): link underlines at rest, scrollbar thumb.
- **Field Grey** (field): map background before tiles load, image placeholder, hover fill on the regions index, reduced-motion target-row fill.

### Named Rules
**The Two-Ink Rule.** Navy draws; gold marks the way. If a gold element is not a route, a warning, a tip mark, a focus or a located state, it is wrong. Gold-wash is the one gold surface: it fills the title band of a hazard tip (road, border, fuel) and its chip in the region header, and nothing else.

**The Gold-Ink Split Rule.** Raw gold (#b08d3e) never carries text. Any gold glyph or word at text size uses gold-ink.

**The Tinted Tiles Rule.** Third-party map tiles are always filtered to the sheet (`grayscale(1) sepia(0.35) hue-rotate(180deg) saturate(1.4) contrast(0.7) brightness(1.18)`), so no tile colour competes with the gold route.

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

Square corners throughout (0): buttons, tips, map controls, popups, stage markers, table, frame. The circle (50%) is a map symbol, reserved for sight markers in the map, legend and table. The pass symbol is a navy triangle; the warning is a gold triangle with a navy bar, white-cased on the map. Icons are authored 24px line drawings, 1.75 stroke, round caps and joins, in currentColor.

## Components

### Buttons (export actions)
Printed-form boxes, inverted on hover.
- **Shape:** square (0), 1px ink border.
- **Default:** paper fill, ink text, 8px 12px padding, 16px line icon left of a UI-weight title and a 13px ink-3 hint, shown at every width (kept to a few words so the 2×2 grid stays one line per hint). Rows share one height.
- **Hover:** fills ink, text white, hint at 75% white; 160ms `cubic-bezier(0.16, 1, 0.3, 1)` on background and colour.
- **Focus:** global 2px gold outline, 3px offset.
- **Done (copy):** title gains " · Copié/Copied" in gold-ink for 1.8s (white while the button is still hovered), announced through a polite live region. Without clipboard access the text is selected and the live region says how to copy it.

### Navigation (running head)
A map-sheet header row: logo and tracked "ODYSSEYRA" (800, 0.16em, 14px), sheet number and country in label/ink-3, FR / EN switch in label (current in ink, other ink-3, gold-ink on hover), centre coordinates in data/ink-3. 1px ink rule beneath. Below 640px it becomes two rows. The language link keeps the reader's current region via the hash.

### Regions index
A ruled strip of cells (auto-fit, min 170px), hairline-separated: mono index number, region name (600), day range in ink-3 followed by the region's tip count in gold-ink ("· 2 conseils"). Hover fills field.

### Sheet header (signature)
Each region opens with a 2px ink top rule, Display title, a label meta line in ink-3 ("Région n / N · Jours a–b"), and a "back to map" link that scrolls to the trip map and highlights the region: its lines and markers stay full strength (markers get the gold outline), everything else drops to 0.25 / 0.4, the map flies to the region (to its single point when it has no track), and a caption box top right names it with a "Tout afficher / Show all" reset.

Under a hairline, an "À savoir · n conseils" row lists the region's tips as 36px chips (44px on touch): kind icon, kind in 700, point name in ink-2, linking to the tip. Hazard chips (road, border, fuel) come first, with a gold border and gold-wash fill.

### Survey map (signature)
Leaflet over filtered OpenTopoMap tiles, on a field ground with a 40px hairline grid. Routes are segments: a recorded stretch (GPS track or routed road) is a 3.5px gold line over a 7.5px navy casing; an approximate stretch (only its ends known) is a 3px gold line dashed 2/9 over a 6px white underlay, no casing, and carries a "Tracé approximatif" legend entry and a note under the region map. On the trip map an invisible 16px hit line per region names it on hover and links to its section. Graticule ticks on the frame in 11px mono on 90% white, with a 1px ink tick; scale bar in 11px mono. Square zoom controls with 1px ink border, metric scale bar bottom right.

Markers: stage = 24px navy square, white numeral, 2px white border; sight = 22px white circle, 2px navy ring; points at the same spot share one marker ("1 · 28"); markers closer than their own width fan out a few pixels. A point with a tip carries a 10px gold dot (1.5px navy ring) at its top right, the same dot as the legend's "Conseil pratique". The trip map shows stages, passes and warnings only; sights live on the region maps. Markers stay out of the tab order (the points tables carry the same actions); their accessible name is "n. Place, kind".

Popups: kind label, name, a mono copy button for the coordinates, a gold-dot link per tip, and on the trip map a link to the region. On touch screens one finger scrolls the page; an "Explorer la carte / Explore the map" toggle (44px, top right) enables dragging.

### Points table
Coordinates ledger in body size: label-small headers over a 1px ink rule, rows on hairlines, symbol column 44px. A place with a tip gets a "Lire le conseil · Route" link under its name (13px/600 gold-ink, led by the gold dot). Coordinates are a mono copy button with a 15px icon turning gold-ink on hover; Google/Apple Maps links below in 13px/600 ink-2. On touch every action is 44px tall and the copy button and links share a wrapping row. A targeted row flashes gold-wash over 2.4s (static field fill under reduced motion). Below 720px rows stack into a two-column grid.

### Tip
An aside boxed like a legend note: paper fill, 1px ink border plus 1px hairline outline at 3px offset, square. Head row: 18px gold-ink line icon for the kind, label in ink, optional point link right-aligned (14px/600 ink-2). Each tip has a stable id (`tip-<point>-<kind>`) so maps, tables and region headers link to it; a targeted tip flashes its outline gold.

**Hazard tip** (road, border, fuel): the head becomes a full-width gold-wash band over a 1px gold rule, the icon sits in a 28px gold disc, and the kind label turns gold-ink.

### Plate (photo)
Native-ratio image linking to the original, then a caption: label "Planche nn" in ink beside caption text in ink-2, and a data line in ink-3 with aperture · shutter · ISO · focal, camera · lens, and an "Original W×H · size" download link (size in Mo/MB). Missing EXIF values are omitted, not dashed.

### Regrets list
Ruled list: each item indented 32px behind an 18 × 2px navy dash.

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
- **Don't** use gold for decoration, headings, backgrounds or body links (the hazard band's gold-wash is the single exception).
- **Don't** draw an approximate stretch as a solid line, or join unrelated points into one line: a route the reader may follow must say how precise it is.
- **Don't** crop photos or force them into a uniform ratio.
- **Don't** set a tracked-capital label above or below a heading unless it carries a field name or data.
