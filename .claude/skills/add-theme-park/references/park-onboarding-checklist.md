# Park onboarding validation checklist

This is an **onboarding validation checklist**, not a copy of the
`window.PARK` contract. The contract has exactly one place it's allowed to
live authoritatively — three, really, and they must agree:
`specs/architecture/park-contract.md.asc`, the header comment in
`assets/theme-park-core.js`, and what the core actually reads at runtime.
This file must never become a fourth, independently-drifting copy of that
contract.

## Derive the contract fresh, every time

Before onboarding a park, derive the current contract from:

1. `specs/architecture/park-contract.md.asc`, if a legitimate passphrase
   channel is available — the approved contract.
2. `assets/theme-park-core.js`'s docblock/header comment — the contract as
   documented next to the code.
3. Actual `PARK.*` reads in the core (`grep -n "PARK\."
   assets/theme-park-core.js`) — what's really consumed today.
4. Both current real adapters (`parks/story-land.js`,
   `parks/legoland-new-york.js`, and any others already onboarded) — what's
   actually populated in practice.
5. `tests/theme-park/fixtures/minimal-test-park.js` — the automated
   fixture, which deliberately exercises degradation paths (missing map,
   undeclared `quickServices`, an invented POI type, etc.) that make good
   examples of what's genuinely optional.

**Do not use this checklist as a static field contract.** If the core
grows `PARK.someNewCapability` tomorrow, this file does not need editing
for that fact alone to be usable — Step 1 of the `add-theme-park` skill
already points here, and this document's job is to make sure you *look it
up fresh* rather than to enumerate it for you. If sources (1)-(4) disagree
with each other, don't silently pick one — that's exactly the
`architecture_alignment` situation `theme-park-architecture-audit`
classifies; flag it for that skill rather than guessing during onboarding.

A few fields worth knowing by name because they come up on nearly every
park (**examples, not an exhaustive or authoritative schema** — always
re-check against the live sources above): `id`, `name`, `theme`, `copy`,
`map`, `storageKey`, `attractions`, `pois`, `categories` tend to be required
in practice; `family`, `reactionSystem`, `shows`, `closingTime`,
`map.geoCalibration`, `quickServices`, `geoExtraCollections`,
`poiTypeLabels` tend to be optional with a documented fallback. Confirm the
actual required/optional split against the sources above before treating
either list as settled — it can and has changed as the engine gained
capabilities.

## Validation checklist

Use this to drive the actual onboarding workflow (mirrors
`add-theme-park/SKILL.md`'s steps — see there for the full rationale
behind each item):

- [ ] **Park identity**: `id` is stable, unique, kebab-case, and doesn't
      collide with any existing park's `id` or `storageKey`.
- [ ] **ID uniqueness within the park**: no duplicate attraction ids, no
      duplicate POI ids, and no attraction/POI id collision (the core
      merges both into one `BY_ID` lookup — a collision silently shadows
      one entity).
- [ ] **Reference integrity**: every id referenced by `mustIds`, `calmIds`,
      `childFavoriteIds`, `waterIds`, `priorityGroups[].ids`,
      `reactionSystem.triggerId`/`targetId`, `attraction.nearbyAttractions`,
      and `map.geoCalibration.controlPointIds` (if present) actually
      resolves to a real entity in this park's data.
- [ ] **Provenance**: every `geo`/`restrictions` value that isn't plainly
      obvious carries a `source`/`confidence` (following the 3-level model
      already established in `parks/legoland-new-york.js` —
      `confirmed_on_site` > `official_map` > `approximate`), and nothing
      uncertain is presented as confirmed. Unknown stays unknown/absent
      rather than estimated.
- [ ] **Optional-capability absence**: the park still works correctly with
      whatever it genuinely lacks (no `family`, no `shows`, no
      `reactionSystem`, no `geoCalibration`, no illustrated map, POIs
      without `geo`, no zones) — verified by inspection or a quick manual
      run-through, not assumed.
- [ ] **Map support matches actual capability**: an illustrated map image
      is only vendored if one genuinely exists; `geoCalibration` is only
      enabled with defensible, well-distributed control points (see
      `add-theme-park/SKILL.md` Step 7); nothing is invented to make the
      map viewer "look complete."
- [ ] **Thin shell**: the new HTML shell diffs against every existing shell
      as exactly title/theme-color/h1/`<script src="parks/...">` — nothing
      else (see `add-theme-park/SKILL.md` Step 8, which makes this a
      literal `diff` run, not a visual check).
- [ ] **Browser smoke test**: the new park actually renders in a browser —
      no console errors, a recommendation appears, cards/map/services
      render, checklist state persists — not just "the JS parsed."
- [ ] **Regression**: Story Land and LEGOLAND New York (and any other
      already-onboarded real park) still work after this change.
- [ ] **Architecture audit**: `theme-park-architecture-audit` has been run
      against the diff and returned zero BLOCKING findings before this
      park is considered complete.

## What NOT to duplicate here

Field-by-field contract documentation, capability matrices, and the POI
`type` extensibility rules all belong in
`specs/architecture/park-contract.md.asc` (or, if that's unreadable this
session, in the core's own header comment) — not in this file. If you find
yourself writing out the full shape of `restrictions` or `map.*` here to
"make it easier," stop — that's the duplication this document exists to
avoid, and it's exactly what goes stale first.
