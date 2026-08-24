# Park onboarding field checklist

Re-derive the authoritative field list from
`assets/theme-park-core.js`'s header comment before using this — it's a
convenience checklist, not the contract itself.

## Top-level `window.PARK`

| Field | Required? | Notes |
|---|---|---|
| `id` | required | stable, unique, kebab-case (`legoland-new-york`) |
| `name` | required | display name |
| `emoji` | required | shows in header/back-link default |
| `theme.{accent,accentDark,themeColor}` | required | colors applied by `applyParkTheme()` |
| `copy.{backHref,backLabel,headerTitle,mapOfficialTitle,mapAltText,mapNote,doneTitle,doneBody,resetConfirm}` | required | user-facing strings; `lunchTip` etc. are adapter-specific extras, not core-read |
| `map.url` | required | official map link, opened externally |
| `map.image` | optional | omit (don't invent) if no vendored image exists — engine falls back cleanly |
| `map.center` | required | `[lat,lng]` for the geographic map's initial view — use a **public** venue coordinate, never a residential address (see `CLAUDE.md`'s "Home" privacy rule if this park is ever near the family's home) |
| `map.geoCalibration` | optional | only with defensible control points — see SKILL.md Step 7 |
| `map.poiFilterGroups` / `poiFilterGroupLabels` | optional | only if the default per-type filter grouping is wrong for this park |
| `map.defaultGeoFilters` | optional | which filter categories start active on the geographic map |
| `storageKey` | required | unique localStorage key, `<something>_state_v1` |
| `attractions` | required | at least one; see entity table below |
| `pois` | optional | `[]` is valid if genuinely no services are tracked yet |
| `mustIds` | optional | `[]` valid |
| `calmIds` | optional | used by "modo tranquilo"; `[]` valid |
| `childFavoriteIds` | optional | `[]` valid |
| `waterIds` | optional | `[]` valid |
| `categories` | required | `[[key,label],...]` — drives the checklist tab's grouping |
| `priorityGroups` | optional | `[]` valid |
| `reactionSystem` | optional | `null` valid (LEGOLAND) |
| `tips` | optional | `[]` valid, but usually worth populating |
| `family` | optional | `null` valid (Story Land); if present, `children:[{name,ageYears,heightIn,heightApprox}]` |
| `shows` | optional | `[]` valid; add `geo` per-show only alongside `geoExtraCollections:['shows']` |
| `closingTime` | optional | `null` valid; `'HH:MM'` activates the closing-soon score bonus |
| `geoExtraCollections` | optional | array of `PARK` field names beyond `attractions`/`pois` that carry `geo` |
| `quickServices` | optional | curated `[{type,icon,label}]`; omit to let the core derive from `pois` |
| `poiTypeLabels` | optional | override/extend the default type→label table |

## Per-attraction

| Field | Required? | Notes |
|---|---|---|
| `id` | required | unique across attractions **and** POIs |
| `name` | required | |
| `cat` | required | must match one of `categories`' keys |
| `adult` | optional | generic accompaniment flag, shown when `restrictions`/`family` aren't both present |
| `zone` | optional | free text; used for grouping/orientation, not required |
| `mapNumber` | optional | only if the official map numbers attractions |
| `mapMarker.{x,y}` | optional | % position on `map.image`; only if you actually measured it off the image |
| `mapRegion` | optional | one of the 3×3 grid keys in the core, for a coarse "front-left"-style hint |
| `visualLandmark` | optional | free text fallback when no `mapRegion`/`mapMarker` |
| `nearbyMapNumbers` / `nearbyAttractions` | optional | arrays of map numbers / attraction ids — validate these resolve (Step 11) |
| `tags` | optional | short chips |
| `why` / `tip` | optional | narrative copy |
| `priorityTier` | optional | lower sorts first; omit to fall to the core's default tiering |
| `waterBoostTier` | optional | only for water attractions needing a heat-dependent boost |
| `restrictions.{minHeightIn,maxHeightIn,adultAccompaniedMinHeightIn,adultRequiredBelowIn,adultRequiredBelowInAndAge,minAge,maxAge,minAgeUnaccompanied,soloOnly,source,lastVerified,confidence}` | optional | only populate what you can source; leave the rest absent, not zero/false |
| `geo.{lat,lng,source,reference,confidence}` | optional | `confidence` one of `confirmed_on_site` \| `official_map` \| `approximate`; never omit `source`/`reference` when `geo` is present |
| `plusCode` | optional | raw string, informational |
| `unavailable` | optional | the **one** true hard constraint the core enforces — use only for a genuinely closed/removed attraction, not "we don't want to do this one" |

## Per-POI

| Field | Required? | Notes |
|---|---|---|
| `id` | required | unique across POIs **and** attractions |
| `type` | required | open string — `restroom`, `food`/`dining`, `firstaid`/`first-aid`, `familycare`/`family-care`, `locker`, `charging`, `water`, `shopping`/`store`, `entrance`, `parking`, or a genuinely new type |
| `icon` | optional | emoji; falls back to a type-derived default |
| `name` | required | |
| `zone` | optional | |
| `mapNumber` / `mapMarker` | optional | same semantics as attractions |
| `plusCode` / `geo` | optional | same provenance model as attractions |
| `amenities` | optional | free-form object, e.g. `{accessible, babyChanging}` — leave fields `null` rather than guessing |
| `nearbyText` | optional | human-readable relative reference when no `geo`/`mapMarker` |
| `source` | optional | e.g. `'official-map'` |

## Provenance / confidence conventions already in use

Follow `parks/legoland-new-york.js`'s established model rather than
inventing a new one:

- `geo.confidence`: `'confirmed_on_site'` (Plus Code measured standing at
  the spot) > `'official_map'` (park-published coordinate) >
  `'approximate'` (estimated by cross-referencing nearby confirmed anchors
  — document `geo.estimatedFrom`).
- `restrictions.confidence`: `'verified-official'` when two independent
  official sources agree; otherwise mark it and surface the
  "confirm before queueing" note the core already renders via
  `eligibilityConfidenceNote()`.
- When a value is genuinely unconfirmed, prefer `null`/absent over a
  best-guess number — the core is built to show "❓ unverified" honestly
  rather than a false "✅".
- Record *how* each pass of data collection happened in the adapter's own
  header comment (source URLs, dates, what's still outstanding) — this
  repo's convention is a running provenance log at the top of each
  `parks/<id>.js` file, not a separate doc.
