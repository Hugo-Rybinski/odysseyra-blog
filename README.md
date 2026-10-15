# Odysseyra

A travel blog built with [Astro](https://astro.build), MDX and Leaflet/OpenStreetMap.

## Commands

| Command           | Action                       |
| ----------------- | ---------------------------- |
| `npm run dev`     | Dev server on localhost:4321 |
| `npm run build`   | Build static site to `dist/` |
| `npm run preview` | Preview the build            |

## Writing a post

Create `src/content/posts/<slug>.mdx` (see `lisbon-in-three-days.mdx`). Frontmatter: `title`, `description`, `date`, `cover`, `coverAlt`, optional `location`, `tags`, `draft`.

- **Photos:** put files in `src/assets/<trip>/`, import them in the MDX and use `<Figure src={img} alt="" caption="" />` (auto-resized, served as WebP).
- **Maps:** `<Map markers={[{ lat, lng, label }]} route={[[lat, lng], ...]} />`.
