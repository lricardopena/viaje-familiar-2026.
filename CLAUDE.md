# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static HTML itinerary for a family road trip: **Adirondacks → Vermont → White Mountains, August 14–22, 2026**. All UI text and content is in Spanish. There is no backend, no build system, no package manager, and no test suite. Hosted as-is on GitHub Pages.

## Repository structure

- `index.html` — the shell: all HTML, CSS, and JavaScript (rendering logic + pure helper functions). Contains no trip content — it `fetch()`es `data.json` on load and renders from it.
- `data.json` — all trip content: the `days` array plus the `activityDests`/`hotelDests` lookup maps (see below). This is what you edit for any content change (times, descriptions, hotels, EV charging info, new days). **Edit this file, not `index.html`, for anything that is data rather than behavior.**
- `archive/Viaje_Ago2026_familiar_visual_PIXEL10_v7_Riparius_Lake_George.html` — a frozen backup copy, kept for reference only. Do not edit it, and do not treat it as a source of truth; `index.html` + `data.json` together are canonical.
- `README.md` — just the repo title, no content.

Why split like this: `index.html` (rendering logic, rarely changes) and `data.json` (trip content, changes constantly) used to be one ~40KB file. Nearly every real edit is a content edit, so keeping content in its own file means an edit only needs to touch `data.json` — no need to read or re-send the CSS/JS shell — which keeps content edits cheap. It also means GitHub's diff view for `data.json` changes shows just the changed day, and `index.html` stays stable across almost all commits.

## Development workflow

There is no build, lint, or test tooling. `index.html` loads `data.json` via `fetch()`, which browsers block on `file://` — **you must serve the directory over HTTP to preview**, e.g. `python3 -m http.server` then open `http://localhost:8000/`. Opening `index.html` directly by double-clicking it will show an error message instead of the itinerary. Verify by loading the page and clicking through days/sections manually. GitHub Pages serves both files over HTTP normally, so this only matters for local preview.

## Architecture

The page is rendered client-side from a single data structure, loaded from `data.json`:

- **`days` array** (one object per day of the trip) is the source of truth. Each entry carries: date/day-of-week, place, emoji, headline `tag`, weather (`wx`), packing list (`pack`), hotel, an `acts` array of `[time, title, description, badge]` activity tuples, an `ev` block of raw HTML for EV-charging options, and a `maps` array of address strings.
- **`activityDests`** and **`hotelDests`** are lookup maps (keyed by day number as a string) that supply the Google Maps destination strings used by each activity's/hotel's "🚗 Ir ahora" button — these must stay in sync (by index) with `acts` and `maps` in the corresponding `days` entry.
- `data.json` is formatted with each `days` array element and each lookup-map entry on its own line (rest minified) — this lets you `grep -n '"d": "17"'` (or similar) to jump straight to one day's line instead of reading the whole file.
- In `index.html`, a block of small pure functions (`wicon`, `clothes`, `actIcon`, `excite`, `expectation`, `mission`, `story`) derive UI details (icons, an "excitement" meter, kid-facing mission chips, a short narrated summary) from the day's data — they pattern-match on keywords in Spanish strings like `place`, `tag`, and `pack`. When adding a new day or activity, keep vocabulary consistent with the existing keywords these functions check for (e.g. `'coaster'`, `'gondola'`, `'lluvia'`, `'bermuda'`) or they'll silently fall through to generic defaults.
- On load, `index.html` fetches `data.json`, then builds the day-selector nav and one `<section class="day">` per entry by string-templating the data into `#nav`/`#days`. There's no framework — all rendering is manual `insertAdjacentHTML`/template literals.
- `IMG()` builds a Wikimedia Commons image URL from a bare filename (the `img` field per day); `go()`/`see()` build Google Maps directions/search URLs from an address string.
- Bottom nav (`prevDay`/`nextDay`/`goToday`) and an `IntersectionObserver` keep the sticky day-selector's highlighted button in sync with scroll position. `goToday()` matches against a hardcoded year/month (2026-08), so it only auto-highlights correctly during the actual trip dates. These functions are declared at top level (outside the `fetch().then()` callback) since they're wired up via inline `onclick=` in the HTML and must stay in global scope.

## Conventions

- Keep all user-facing copy in Spanish, matching the existing tone (casual, addressed to the family, second person).
- `data.json` is one array/map entry per line (minified within each line) — match this style rather than reformatting, to keep diffs small and each day skimmable as one line. `index.html` stays minified/dense as before.
- EV-charging (`ev` field) entries distinguish "✅ principal/alternativa" (fast NACS DC chargers) from "🔌 backup" (slower J1772 Level 2) — preserve this distinction when editing charging info.
