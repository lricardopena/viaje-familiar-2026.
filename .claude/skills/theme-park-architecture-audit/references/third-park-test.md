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

## What each layer is evidence of (don't blur these)

- **Automated fixture result** = regression evidence. It proves the core
  hasn't broken a contract it already promised.
- **Conceptual dry run** = architecture stress test. It proves (or
  disproves) that the core/park seam has room to grow generically — it is
  a test of the *architecture's capacity*, not a backlog generator.
- **A real park's actual requirement** = the only thing that justifies
  building a new generic capability. A hypothetical park run through the
  conceptual layer can show that a path *would* exist; it cannot, on its
  own, justify walking that path today. See "Capability gap evidence
  classes" below.

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
  change hourly, park-controlled) — **this is a capability gap**, but
  evidence-class it before saying anything about it: nothing about it comes
  from Story Land, LEGOLAND, or a stated plan to actually add Aurora Cove —
  it exists purely because this fictitious park was invented to stress a
  dimension (rotating, park-controlled availability) the automated fixture
  doesn't cover. That makes it `hypothetical_stress_test_only`. There is no
  field today that models "this attraction has scheduled open/closed
  windows during the day" (as opposed to the one-shot `unavailable:true`),
  and *if* a real park ever needs this, a generic
  `attraction.availabilityWindows` capability (read by
  `isHardExcluded()`/status logic) is the right shape to propose — but that
  proposal stays hypothetical here. It is **not** implemented, not filed as
  P0/P1, not treated as current debt, and does not trigger any core change
  in this audit. What the dry run *did* prove is narrower and still useful:
  the seam has an obvious, non-special-cased place for this capability to
  land if it ever becomes real — worth one line in `capability_gaps`, not a
  recommendation to build it.

**Verdict for this dry run:** `pass` (with note: `hypothetical generic
evolution path identified`) — every requirement is already addressable
purely through `parks/aurora-cove.js` + config, including the one gap,
which is real only in the sense that the *seam* is real, not that the
*need* is. Nothing here rises to `pass_with_generic_core_evolution`,
because nothing here is backed by a real or credible-near-term
requirement — see "Capability gap evidence classes" below. If Aurora Cove
(or a park like it) ever became a real onboarding target and still needed
rotating availability windows, *that* audit would re-evaluate the gap
under `observed_existing_park_need`/`credible_near_term_requirement` and
could legitimately reach `pass_with_generic_core_evolution`.

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
  capability_gaps:
    - description: "attraction.availabilityWindows (rotating, park-controlled open/closed windows)"
      evidence_class: hypothetical_stress_test_only
  verdict: pass
  verdict_note: "hypothetical generic evolution path identified"
```

## Capability gap evidence classes

Every gap surfaced by either layer of the Third Park Test gets one of:

```yaml
capability_gap:
  evidence_class: real_current_requirement | observed_existing_park_need |
    credible_near_term_requirement | hypothetical_stress_test_only
```

- `real_current_requirement` / `observed_existing_park_need` — an existing,
  onboarded real park actually needs this today.
- `credible_near_term_requirement` — no existing park needs it, but there's
  a concrete, stated plan (a specific real park the family intends to add,
  an explicit user request) that will.
- `hypothetical_stress_test_only` — surfaced solely by a fictitious
  dry-run park invented to exercise a dimension the automated fixture
  doesn't cover, with no real or planned park behind it.

**A hypothetical park can test whether the architecture has a path for
generic evolution; it cannot, by itself, justify building that evolution.**
A `hypothetical_stress_test_only` gap must not be implemented, must not be
filed as P0/P1, must not trigger a core modification, and must not be
presented as current technical debt — it stays a stress-test result unless
real evidence later promotes it to one of the other three classes.

## Interpretation rules

- **Bad core modification**: any change that reads a specific park id,
  attraction id, or zone name to decide behavior. Always a finding,
  regardless of evidence class.
- **Legitimate generic evolution**: a new *optional* field or capability
  that any park could declare, with a clear default/absence behavior,
  backed by `real_current_requirement`, `observed_existing_park_need`, or
  `credible_near_term_requirement`. Recommend it explicitly in the audit
  output as a capability gap — don't implement it as part of the audit
  itself unless the audit was invoked specifically to also do the
  implementation (e.g. via `add-theme-park`, and even then only once
  authorized).
- A dry run that requires **zero** core changes — or whose only gaps are
  `hypothetical_stress_test_only` — produces only `parks/<id>.js` + a thin
  shell (+ an image asset only if the park has an illustrated map) and is a
  clean **`pass`** (add the `hypothetical generic evolution path
  identified` note if a stress-test-only gap was found, so the result isn't
  lost, without inflating the verdict).
- A dry run needing a genuinely new *optional* capability backed by real or
  credible-near-term evidence is `pass_with_generic_core_evolution` — still
  a pass, because the boundary held; the core just grew (or should grow) a
  new opt-in door.
- A dry run that cannot be expressed without a park-keyed branch is `fail` —
  this should be rare if the engine's current discipline holds; if it
  happens, it's the audit's most important finding, independent of any
  gap's evidence class.
