---
target: post page
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/hugo.rybinski/project/odysseyra-blog/src/pages/[lang]/trips/[slug].astro"
target_fingerprint: "sha256:bf14bc9b53a99f9344dc0656dfa3d54108d1643283dad81ec6d31b928d06aa76"
target_path: /Users/hugo.rybinski/project/odysseyra-blog/src/pages/[lang]/trips/[slug].astro
timestamp: 2026-10-15T20-25-41Z
slug: src-pages-lang-trips-slug-astro
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | "Copié" unreadable while hovered; map highlight has no caption; route-less region highlight shows nothing |
| 2 | Match System / Real World | 3 | Survey-sheet vocabulary works; popup coordinate link unexpected; Planche/Feuille opaque |
| 3 | User Control and Freedom | 2 | No reset after highlight; mobile maps can't pan |
| 4 | Consistency and Standards | 3 | Strong system; one 1–28 numbering mixes stages/sights; font sizes off ramp (12/15px ×5) |
| 5 | Error Prevention | 2 | Straight chords/back-tracks drawn as the route, no "approximate" signal; marker 1 hidden under 28 |
| 6 | Recognition Rather Than Recall | 2 | Tips cite numbers to look up; tips not on maps |
| 7 | Flexibility and Efficiency | 3 | GPX/KML/copy-all/per-point links; no tips index |
| 8 | Aesthetic and Minimalist Design | 3 | Disciplined; Son-Koul plates bury tips; Maps links repeat on every row |
| 9 | Error Recovery | 2 | Silent clipboard fallback; no tile-failure state |
| 10 | Help and Documentation | 2 | Export hints hidden on desktop |
| **Total** | | **24/40** | **Acceptable** |

## Priority Issues
1. [P1] Route geometry presents false precision (trip.yaml tchou/naryn jumps and back-tracks; issyk-koul-sud has none) — harden
2. [P1] Road/border tips not findable from map; kinds visually identical — clarify
3. [P1] Maps fail on mobile: dragging disabled (SheetMap.astro:134), stacked markers, small tap targets — adapt
4. [P2] Cross-link feedback: no caption/reset, no region link in popup, no scroll-margin, "Copié" contrast — polish
5. [P2] Keyboard/screen reader: ~250 tab stops, focusable unnamed SVG paths, no skip link — audit
Minor: mobile H1 at y=782; detector 12/15px font sizes; pin occlusion ×4 desktop ×9 mobile; Leaflet scale labels 10px; smooth scroll on cross-page arrival; lede line length ~92ch.
