# The Third Park Test — worked structure and interpretation rules

## Two layers

1. **Automated** (`npm test` / `node tests/theme-park/theme-park-core.spec.js`
   against `tests/theme-park/fixtures/minimal-test-park.js`) — always run
   this first. It's cheap, deterministic, and already encodes several of the
   sharpest edge cases (mixed eligibility, `unknown` vs `✅`, non-hard-excluding
   ineligibility, `unavailable` as the one true hard constraint, missing
   illustrated map, an invented POI type, undeclared `quickServices`).
2. **Conceptual** — a mental (or actually-written, if the audit calls for
   it) dry run with a park that stresses dimensions the fixture doesn't
   cover. Use this reference to run that dry run consistently.

## Design a park unlike both real parks and the fixture

Don't clone Story Land or LEGOLAND's shape. Deliberately vary:

- Map capability: illustrated map + geo, only geographic (no illustrated
  image at all), or neither.
- Zones: many, one, or none.
- `reactionSystem`: present with different trigger/target semantics, or
  absent.
- `family`: absent, or present with a different member shape than
  `{name,ageYears,heightIn,heightApprox}` (a genuine new requirement here is
  a capability gap, not something to force into the existing shape).
- Shows: absent, present without geo (informational only), or present
  *with* geo (exercises `geoExtraCollections`).
- POI types: at least one type neither real park nor the fixture uses.
- `closingTime`: set or unset.
- Data completeness: some entities fully specified, some deliberately
  sparse (no `mapMarker`, no `geo`, no `restrictions`) to check that sparse
  data degrades instead of crashing.

## Example dry run (reference instance — re-run your own per audit)

**Hypothetical park: "Aurora Cove Water Park"** — an outdoor water park,
single admission gate, no illustrated park map (only a geographic layout,
since the park emailed only a text list of attractions, no map graphic),
heavy on POI variety, one show with a fixed daily schedule and real
coordinates, no family/eligibility data collected yet, and a genuinely new
POI type (`towel-rental`) plus a genuinely new attraction shape (a "wave
pool" with a rotating `currentSchedule` the park itself changes hourly —
NOT expressible generically today).

Walked through the contract:

- `id/name/emoji/theme/copy/storageKey/categories/mustIds/calmIds/
  childFavoriteIds/waterIds/priorityGroups/tips` — plain data, no gap.
- `map.image` — omit (falsy); `map.url` — the park's official page;
  `map.center` — the park's public coordinates; no `geoCalibration` (no
  illustrated map to calibrate against) — all already optional, no core
  change.
- `attractions[].geo` — set for the attractions the park listed with GPS
  pins; several without `mapMarker` (no illustrated map exists) — already
  supported, the illustrated-map code path simply never activates
  (`MAP_IMAGE` falsy).
- `pois[].type:'towel-rental'` — no core change needed: `poiTypeLabel()`
  already falls back to a data-derived label/icon for unknown types.
- `shows: [{id,name,zone,times,geo}]` — the `geo` on a show entry needs
  `PARK.geoExtraCollections:['shows']` to participate in proximity/the
  geographic map. That's an existing, documented extension point — no core
  change, just adapter configuration.
- `family: null` — supported today (Story Land already proves this).
- The wave pool's `currentSchedule` (attraction availability windows that
  change hourly, park-controlled) — **this is a real capability gap**. There
  is no field today that models "this attraction has scheduled
  open/closed windows during the day" (as opposed to the one-shot
  `unavailable:true`). Two honest options: (a) model it as data the park
  reports and someone manually toggles `unavailable` during the visit
  (no core change, slightly worse UX), or (b) propose a generic
  `attraction.availabilityWindows` capability that the core's
  `isHardExcluded()`/status logic would need to learn to read. Recommend
  (b) as **legitimate generic evolution** if a real park needs it — never
  implement it as `if (PARK.id==='aurora-cove')`.

**Verdict for this dry run:** `pass_with_generic_core_evolution` — every
requirement except the rotating-schedule attraction is already addressable
purely through `parks/aurora-cove.js` + config; the one gap has a clear,
generic (non-park-keyed) proposed extension rather than a forced
special-case.

```yaml
third_park_test:
  automated_result: pass        # from npm test against the existing fixture
  conceptual:
    new_files:
      - parks/aurora-cove.js
      - aurora-cove.html
    modified_existing_files: []
    core_changes: []
    unsupported_requirements:
      - "hourly attraction availability windows (wave pool schedule)"
  verdict: pass_with_generic_core_evolution
```

## Interpretation rules

- **Bad core modification**: any change that reads a specific park id,
  attraction id, or zone name to decide behavior. Always a finding.
- **Legitimate generic evolution**: a new *optional* field or capability
  that any park could declare, with a clear default/absence behavior,
  discovered because a real (or realistically hypothetical) park needs it.
  Recommend it explicitly in the audit output as a capability gap — don't
  implement it as part of the audit itself unless the audit was invoked
  specifically to also do the implementation (e.g. via `add-theme-park`).
- A dry run that requires **zero** core changes and produces only
  `parks/<id>.js` + a thin shell (+ an image asset only if the park has an
  illustrated map) is a clean `pass`.
- A dry run needing a genuinely new *optional* capability is
  `pass_with_generic_core_evolution` — still a pass, because the boundary
  held; the core just grew a new opt-in door.
- A dry run that cannot be expressed without a park-keyed branch is `fail` —
  this should be rare if the engine's current discipline holds; if it
  happens, it's the audit's most important finding.
