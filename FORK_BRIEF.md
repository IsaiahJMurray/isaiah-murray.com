# Build Chamber fork — brief for contributors (delete before merge)

Branch: `build-chamber` in /home/claude/repo (SvelteKit 2, Svelte 4, mdsvex, adapter-auto, Vercel analytics, PWA).
Goal: restyle the whole real site in the "Build Chamber" direction Isa approved. Reference implementation (single-file mockup, port from it freely): `/home/claude/mockups/build-chamber/index.html`. Content source of truth: the repo itself (`src/lib/docs/projects/*.md` frontmatter + bodies, resume page content) plus `/home/claude/mockups/CONTENT.md` for home-page copy. Design rules: `/home/claude/mockups/RESEARCH.md` (no AI-slop tells).

## Direction in one paragraph
Selective laser sintering seen from above. Light theme = fresh Nylon 12 powder bed (cool neutral grey, NOT cream); dark theme = chamber interior at temperature. Sintered parts are darker grey solids; the laser (orange) is the only hot color and appears only on: the live laser point, the active filter button, and the build-column scroll indicator. Type: Chivo (300/400/700/900) for everything, Chivo Mono (400/500) only for machine readouts (layer, Z, dates, part IDs, table figures, code). Barely-visible feTurbulence powder grain. No rounded pills, no gradients, no glows, no shadows except the lightbox.

## Tokens (copy exactly into `src/lib/styles/chamber.css`, imported once in +layout.svelte)
Use the `:root` light values, the `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} }` block and the `:root[data-theme="dark"]` block from the mockup's `<style>` (lines ~16–40), plus its base element rules, `.mono`, `.wrap`, `.visually-hidden`, `.section`, `.section-head`, and the body::before grain. Theme toggle sets `document.documentElement.dataset.theme` and persists in localStorage (try/catch). Add an inline script in `src/app.html` head that applies the stored theme before paint to avoid a flash.

## Global pieces
- `src/app.html`: add Google Fonts preconnect + `family=Chivo:wght@300;400;700;900&family=Chivo+Mono:wght@400;500&display=swap`, `<meta name="theme-color">`, the theme pre-paint script, `lang="en"`.
- `src/lib/projects.js`: ONE shared loader used by home, /projects and /projects/[slug] (extract from the existing `routes/projects/+page.js` sort logic, keep its ordering rules exactly). Export `loadProjects()` → list with slug, title, subtitle, date, updated, tags, maturity, featured, visibility, cardImage, order, `disciplines` (derived from tags: hardware / firmware / software / ml — write a small explicit tag→discipline map and put it at the top of the file so Isa can edit it), and `year` (from date or updated; null if none). Also `loadProject(slug)` and `neighbors(slug)` (prev/next in the same order) for the project page.
- `src/lib/chamber/BuildColumn.svelte`: the rasterized scroll indicator, ported from the mockup's `buildCols` (lines ~728–990). Mounted ONCE in +layout.svelte, fixed at the right edge on ≥900px wide (same geometry as mockup home), on every page. Slice map from elements with `data-build="Label"` in the current page (fallback: `main > section`). Recompute on `afterNavigate`, resize (ResizeObserver on document.body), fonts ready, and image loads. It exposes the same slider a11y (role=slider, keyboard). Respects reduced motion, pauses when hidden. On the project page, the page may ALSO render the left "build height" ruler with section marks (see project brief) — in that case the project page tells the column to dock inside its ruler instead of the right edge (a simple store `buildDock` with a target element is fine), matching the mockup's #swarm layout.
- `src/lib/chamber/Header.svelte` (replace usage of old Header in +layout): name link, nav Work (/projects) · Resume · Contact, theme button ("Dark"/"Light" label = the theme you'd switch to). Mark current route with `aria-current="page"`. Not absolutely positioned over content any more.
- `src/lib/chamber/Footer.svelte`: plain text links (GitHub, LinkedIn, Instagram, NuVu profile, email as selectable text) — no Font Awesome (remove that CDN), a mono line with the build date.
- Keep `inject()` from @vercel/analytics and the PWA config untouched.
- Old components (HeroFlame, ProjectVectorStar, SimilarProjects, WhatIDo, ProjectsGrid, ExperienceStrip, etc.) stay in the repo but are no longer imported. Don't delete them.

## Pages (each page wraps content in `<main>` with sections carrying `data-build` labels)
1. Home `/` — port of the mockup home: sintering hero (canvas `SinterHero.svelte`, from mockup `bed`), role + Now block, "Selected work" build plate with discipline filters (featured projects from `loadProjects()`, ordered by `order`; the first gets the big cell; images from `cardImage`), "Other work" table (all remaining public projects, linked), Experience run logs (content from CONTENT.md / resume), Contact block with copy-email button. Add `src/routes/+page.js` that returns projects from the shared loader.
2. `/projects` — index: H1, filters, a build plate of ALL public projects (packing algorithm: featured get 2×2 or larger cells, others 1×1/2×1 — keep it deterministic), then a dense table (Year · Project · What it is · Disciplines) with sort buttons (year / name). Filters apply to both.
3. `/projects/[slug]` — project page in the mockup #swarm style for any markdown doc: left sticky build-height ruler with marks auto-generated from the doc's `h2`s (give each h2 an id), BuildColumn docked in it; header with title, subtitle, mono meta (status from maturity, year, tags), hero image; doc body typography restyled (tables, code, blockquote, hr as a 1px rule, images, video); keep the existing "consecutive image paragraphs → gallery" behaviour but restyle and make the lightbox accessible (dialog, Esc, arrows between images in the doc, focus return); prev/next project links at the bottom from `neighbors()`. OG/Twitter meta preserved.
4. `/resume` — keep all existing resume content and the PDF link; restyle as run logs (mono date column, text column), skills as a mono spec table.
5. `/contact` — keep content; restyle; copy-email button with fallback.
6. `src/routes/+error.svelte` — 404 in the style: "Build failed at layer 0404" + link home. Keep it short.

## Quality bar (hard)
- `npx vite build` must pass with no new warnings from your files (a11y warnings count).
- No horizontal overflow at 390px; ≥16px side gutter; focus-visible on everything; reduced-motion respected.
- Lighthouse-friendly: images `loading="lazy" decoding="async"` with width/height or aspect-ratio (+ `height:auto`), hero image eager.
- No fabricated content. Copy stays plain and specific.
- Check with the local screenshot helper (see below) at 1440 and 390, light and dark, and fix what you see once.

## Local preview + screenshots
`npx vite build && npx vite preview --port 4173 --strictPort &` then use Playwright (python) against http://localhost:4173. Route `https://fonts.googleapis.com/**` to `/home/claude/fonts/local-fonts.css` (see /home/claude/mockups/shot.py for the pattern) so the real fonts render. Kill the preview server when done.
