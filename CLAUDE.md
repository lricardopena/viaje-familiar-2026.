# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static HTML itinerary for a family road trip: **Adirondacks → Vermont → White Mountains, August 14–22, 2026**. All UI text and content is in Spanish. There is no backend, no build system, no package manager, and no test suite. Hosted as-is on GitHub Pages.

## Repository structure

- `index.html` — the shell: all HTML, CSS, and JavaScript (rendering logic + pure helper functions). Contains no trip content — it loads `data.js` via a `<script src>` tag and renders from the global `TRIP_DATA` it defines.
- `data.js` — all trip content, as one JS statement: `const TRIP_DATA = { days: [...], activityDests: {...}, hotelDests: {...} };`. This is what you edit for any content change (times, descriptions, hotels, EV charging info, new days). **Edit this file, not `index.html`, for anything that is data rather than behavior.** The value is JSON-shaped (double-quoted keys/strings throughout) even though the file is JS, not JSON — that's what makes it loadable with a plain `<script src>` instead of `fetch()` (see Development workflow).
- `archive/Viaje_Ago2026_familiar_visual_PIXEL10_v7_Riparius_Lake_George.html` — a frozen backup copy, kept for reference only. Do not edit it, and do not treat it as a source of truth; `index.html` + `data.js` together are canonical.
- `README.md` — just the repo title, no content.

Why split like this: `index.html` (rendering logic, rarely changes) and `data.js` (trip content, changes constantly) used to be one ~40KB file. Nearly every real edit is a content edit, so keeping content in its own file means an edit only needs to touch `data.js` — no need to read or re-send the CSS/JS shell — which keeps content edits cheap. It also means GitHub's diff view for `data.js` changes shows just the changed day, and `index.html` stays stable across almost all commits. Content is a `<script src>`-loaded `.js` file rather than a `.json` file fetched with `fetch()` specifically so that opening `index.html` directly from disk (double-click, `file://`) keeps working with no local server — `fetch()` is blocked cross-origin under `file://`, but a same-directory `<script src>` is not.

## Development workflow

There is no build, lint, or test tooling — open `index.html` directly in a browser (double-click works fine, `data.js` loads via `<script src>`) or serve the directory with any static file server (e.g. `python3 -m http.server`) to preview changes. Verify by loading the page and clicking through days/sections manually.

## Architecture

The page is rendered client-side from a single data structure, `TRIP_DATA` (defined in `data.js`, loaded before the main script runs):

- **`TRIP_DATA.days` array** (one object per day of the trip) is the source of truth. Each entry carries: date/day-of-week, place, emoji, headline `tag`, weather (`wx`), packing list (`pack`), hotel, an `acts` array of `[time, title, description, badge]` activity tuples, an `ev` block of raw HTML for EV-charging options, and a `maps` array of address strings.
- **`TRIP_DATA.activityDests`** and **`TRIP_DATA.hotelDests`** are lookup maps (keyed by day number as a string) that supply the Google Maps destination strings used by each activity's/hotel's "🚗 Ir ahora" button — these must stay in sync (by index) with `acts` and `maps` in the corresponding `days` entry.
- `data.js` is formatted with each `days` array element and each lookup-map entry on its own line (rest minified) — this lets you `grep -n '"d": "17"'` (or similar) to jump straight to one day's line instead of reading the whole file.
- In `index.html`, `const {days, activityDests, hotelDests} = TRIP_DATA;` destructures the data at the top of the main script — this only works because `data.js` is loaded via a preceding `<script src>` tag, so `TRIP_DATA` already exists as a global by the time the main script runs.
- A block of small pure functions (`wicon`, `clothes`, `actIcon`, `excite`, `expectation`, `mission`, `story`) derive UI details (icons, an "excitement" meter, kid-facing mission chips, a short narrated summary) from the day's data — they pattern-match on keywords in Spanish strings like `place`, `tag`, and `pack`. When adding a new day or activity, keep vocabulary consistent with the existing keywords these functions check for (e.g. `'coaster'`, `'gondola'`, `'lluvia'`, `'bermuda'`) or they'll silently fall through to generic defaults.
- The rendering code builds the day-selector nav and one `<section class="day">` per entry by string-templating the data into `#nav`/`#days`. There's no framework — all rendering is manual `insertAdjacentHTML`/template literals. This code sits inside a `{ ... }` block (not a function) purely to scope its local variables (`nav`, `root`, `obs`, etc.) away from the top-level script.
- `IMG()` builds a Wikimedia Commons image URL from a bare filename (the `img` field per day); `go()`/`see()` build Google Maps directions/search URLs from an address string.
- Bottom nav (`prevDay`/`nextDay`/`goToday`) and an `IntersectionObserver` keep the sticky day-selector's highlighted button in sync with scroll position. `goToday()` matches against a hardcoded year/month (2026-08), so it only auto-highlights correctly during the actual trip dates. These functions (and `days`/`activityDests`/`hotelDests`) are declared at the top level of the main script, outside the rendering block, since they're wired up via inline `onclick=` in the HTML and must stay in global scope.

## Conventions

- Keep all user-facing copy in Spanish, matching the existing tone (casual, addressed to the family, second person).
- `data.js` is one array/map entry per line (minified within each line, JSON-shaped) — match this style rather than reformatting, to keep diffs small and each day skimmable as one line. `index.html` stays minified/dense as before.
- EV-charging (`ev` field) entries distinguish "✅ principal/alternativa" (fast NACS DC chargers) from "🔌 backup" (slower J1772 Level 2) — preserve this distinction when editing charging info.
