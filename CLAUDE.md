# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page, static HTML itinerary for a family road trip: **Adirondacks → Vermont → White Mountains, August 14–22, 2026**. All UI text and content is in Spanish. There is no backend, no build system, no package manager, and no test suite — the entire app is one self-contained HTML file.

## Repository structure

- `index.html` — the live site: all HTML, CSS, and JavaScript inline in one file. This is the only file that matters for changes.
- `archive/Viaje_Ago2026_familiar_visual_PIXEL10_v7_Riparius_Lake_George.html` — a frozen backup copy, kept for reference only. Do not edit it, and do not treat it as a source of truth; `index.html` is canonical.
- `README.md` — just the repo title, no content.

## Development workflow

There is no build, lint, or test tooling — open `index.html` directly in a browser (or serve the directory with any static file server, e.g. `python3 -m http.server`) to preview changes. Verify by loading the page and clicking through days/sections manually.

## Architecture (all inside `index.html`)

The page is rendered client-side from a single data structure:

- **`days` array** (one object per day of the trip) is the source of truth. Each entry carries: date/day-of-week, place, emoji, headline `tag`, weather (`wx`), packing list (`pack`), hotel, an `acts` array of `[time, title, description, badge]` activity tuples, an `ev` block of raw HTML for EV-charging options, and a `maps` array of address strings.
- **`activityDests`** and **`hotelDests`** are lookup maps (keyed by day number as a string) that supply the Google Maps destination strings used by each activity's/hotel's "🚗 Ir ahora" button — these must stay in sync (by index) with `acts` and `maps` in the corresponding `days` entry.
- A block of small pure functions (`wicon`, `clothes`, `actIcon`, `excite`, `expectation`, `mission`, `story`) derive UI details (icons, an "excitement" meter, kid-facing mission chips, a short narrated summary) from the day's data — they pattern-match on keywords in Spanish strings like `place`, `tag`, and `pack`. When adding a new day or activity, keep vocabulary consistent with the existing keywords these functions check for (e.g. `'coaster'`, `'gondola'`, `'lluvia'`, `'bermuda'`) or they'll silently fall through to generic defaults.
- On load, JS builds the day-selector nav and one `<section class="day">` per entry by string-templating the data above into `#nav`/`#days`. There's no framework — all rendering is manual `insertAdjacentHTML`/template literals.
- `IMG()` builds a Wikimedia Commons image URL from a bare filename (the `img` field per day); `go()`/`see()` build Google Maps directions/search URLs from an address string.
- Bottom nav (`prevDay`/`nextDay`/`goToday`) and an `IntersectionObserver` keep the sticky day-selector's highlighted button in sync with scroll position. `goToday()` matches against a hardcoded year/month (2026-08), so it only auto-highlights correctly during the actual trip dates.

## Conventions

- Keep all user-facing copy in Spanish, matching the existing tone (casual, addressed to the family, second person).
- Data and markup are dense/minified by convention (no line breaks inside the `days` array, minimal whitespace in CSS/JS) — match this style rather than reformatting, to keep diffs small and the file easy to skim as one screen-sized data block per section.
- EV-charging (`ev` field) entries distinguish "✅ principal/alternativa" (fast NACS DC chargers) from "🔌 backup" (slower J1772 Level 2) — preserve this distinction when editing charging info.
