# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: travelers planning trips to less-traveled countries, where up-to-date practical information is hard to find. They arrive via search or links, often mid-planning, looking for a specific place, route, or road condition.

Secondary: friends and family following the author's journeys.

Languages: French and English readers (the blog is bilingual).

## Product Purpose

Odysseyra is a solo travel blog where the author shares practical, current information about where they have been and what it was like, so others can find it. Success is a reader being able to locate a place on the map, take the route with them (export), and trust the tips because they are first-hand and recent.

## Positioning

First-hand, up-to-date practical guidance for less-traveled destinations, anchored on maps, with high-resolution photography documented with its technical data. The author is a single traveler reporting honestly (road conditions, what they would do differently), not a content farm summarizing second-hand sources.

## Operating Context

- One author (30s, works in tech), writing posts after trips, organized by day and by region.
- Photos are taken on a DSLR (reflex) camera and published at high quality and high resolution.
- Every photo is either 3:2 (landscape) or 2:3 (portrait). Photos are always shown at their native ratio, never cropped (cover images and thumbnails included).
- Readers may use posts on a phone while planning or on the road.

## Capabilities and Constraints

- Content types per post: text, photos, maps (already built: MDX posts, `Figure` and `Map` components, Leaflet/OpenStreetMap).
- Recaps per day and per region, with the map as the central element; locations must be easy to find.
- Maps must be exportable by readers (format to be decided; for example GPX/KML or open-in-maps links). Not built yet.
- Photos: high-res downloads/viewing, plus technical metadata shown per photo (aperture, shutter speed, ISO, focal length, camera and lens/gear). Not built yet.
- Practical tips (for example "this road was in bad condition") must be visually highlighted as a distinct content type. Not built yet.
- Each trip includes a "what I would do differently" recap. Not built yet.
- Bilingual: French and English are both first-class. Every post, page, UI label and export exists in both languages with equal quality; neither is a fallback. French is the writing language, but English is never a degraded or secondary experience. i18n routing structure to be decided.
- Static site on Astro, hosted on GitHub Pages under `/odysseyra-blog/` (`base` configured).

## Brand Commitments

- Name: Odysseyra. Logo assets in `logo/` (compass, mountains and winding road, navy and gold on white).
- Binding visual constraints volunteered by the author: minimalist; accent colors have mostly been navy, gold and white.
- The design should reflect the author's profile: a tech professional in their 30s.
- Voice: practical, honest, first-hand.

## Evidence on Hand

- Logo files in `logo/`.
- Only placeholder content exists: `src/content/posts/lisbon-in-three-days.mdx` uses generated gradient images and sample coordinates. No real posts, photos, or trips yet. Do not fabricate trips, destinations, or camera gear.

## Product Principles

1. Practical usefulness first: a reader should find the place, the route, and the tip within seconds.
2. The map is central, not decoration: every recap is anchored on one.
3. Honesty over polish: warnings, bad roads and regrets are first-class content.
4. Photography is shown at full quality with its technical context.
5. Minimalism: nothing on the page that does not help the reader decide or navigate.

## Accessibility & Inclusion

Bilingual FR/EN. Readers on mobile and on slow connections in the field are likely; keep pages light despite high-res photography (full-res on demand).
