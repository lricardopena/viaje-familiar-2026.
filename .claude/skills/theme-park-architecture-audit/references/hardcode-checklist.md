# Hardcode checklist — concrete signals for this codebase

Grep-able and inspection signals specific to
`assets/theme-park-core.js`/`.css`. A hit here is a *candidate*, not an
automatic BLOCKING finding — validate it against Step 10 of the main
SKILL.md before publishing.

## Literal park/entity identity in the core

```bash
grep -n "PARK.id===" assets/theme-park-core.js          # must be empty
grep -nE "'(story-land|legoland|legoland-new-york)'" assets/theme-park-core.js
grep -nE "'(polar|roar|bamboo|raptour|dragon|ninjago)'" assets/theme-park-core.js
grep -nE "zone===.[A-Z]" assets/theme-park-core.js       # a literal zone-name compare
```

A hit inside a comment explaining *why* a decision was made (very common in
this repo's style — see the extensive provenance comments in
`parks/legoland-new-york.js`) is not a violation. Only flag code paths that
*execute* differently.

## Subtler park-specific behavior (semantic, not literal)

- A scoring branch (`computeScore`, `effectiveTier`, `closingSoonBonus`,
  `isOnCooldown`) that reads anything other than generic fields
  (`priorityTier`, `waterBoostTier`, `priorityGroups`, `mustIds`,
  `PARK.closingTime`, attraction `status`).
- A tip, warning, or copy string in the core that isn't sourced from
  `PARK.tips`/`PARK.copy`/an attraction's own `tip`/`why` field.
- `reactionSystem` handling that assumes a specific `triggerId`/`targetId`
  rather than reading them from `PARK.reactionSystem`.
- Category interpretation (`CATS`, `catLabel()`) that special-cases a
  specific category key instead of rendering whatever `PARK.categories`
  declares.
- Map-region/orientation logic (`mapOrientationHtml`, `MAP_REGION_LABEL`)
  that assumes a specific park's physical layout rather than reading
  `mapRegion`/`visualLandmark`/`nearbyMapNumbers` generically.
- Family/child eligibility (`eligibilityForChild`, `eligibilitySummary`)
  that assumes a fixed number/order of children instead of iterating
  `PARK.family.children`.
- POI/service exceptions: any `type==='restroom'`-style branch in the core
  that isn't going through the generic `poiTypeLabel()`/`quickServiceList()`
  /`defaultGeoFilters` machinery.
- Zone-ordering assumptions (e.g. always visiting zones in a fixed sequence)
  instead of deriving order from real proximity/state.
- Wait-time or "closed" logic tied to one park/attraction instead of the
  generic `status`/`unavailable` fields.

## Assumptions that every park has a capability

Check that these all degrade to "nothing shown" rather than an error when
the field is absent/empty, by reading the guard conditions in the core:

- `PARK.shows` — `[]` (Story Land) must not throw in `nextShowSoon()`.
- `PARK.reactionSystem` — `null` (LEGOLAND) must not throw in `whyNow()`
  or the reaction-prompt renderer.
- `PARK.family` — `null` (Story Land) must fall back to the generic
  `adult` flag, never claim "✅ Puede subir" from absence of data.
- `PARK.map.geoCalibration` — `undefined` (LEGOLAND today) must fall back
  to no "🔵 Estás aquí" dot on the illustrated map, without breaking the
  geographic (Leaflet) map, which works off raw `geo` alone.
- `PARK.map.image` — falsy must fall back to "open official map" without
  attempting `new Image()` on an empty string (see `ensureMapImage()`'s
  early return).
- `PARK.geoExtraCollections` — absent must leave `LOCATABLE_COLLECTIONS`
  at just `['attractions','pois']`.
- `PARK.quickServices` — absent must derive from `PARK.pois` via
  `defaultQuickServices()`, never crash on an empty `pois` array.
- `PARK.poiTypeLabels`/`poiFilterGroups`/`poiFilterGroupLabels` — absent
  must fall back to the generic defaults/derivation, never assume LEGOLAND's
  specific groupings (`firstaid+familycare → 'help'`) apply universally.
- `attraction.restrictions` — absent must show the generic "❓ Sin
  verificar" indicator, not silently pass eligibility.
- `attraction.mapMarker`/`geo` — either or both absent must still render a
  usable card (zone text, `visualLandmark`, or just the name).

## Where the checklist stops mattering

Once a candidate is confirmed as *data* (something a park declares) rather
than *core logic* (something the engine assumes), it's not a hardcode
finding — it's expected. The checklist exists to catch the core reaching
into a specific park's data rather than the other way around.
