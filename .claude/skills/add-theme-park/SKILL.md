---
name: add-theme-park
description: Orchestrate adding a new park to the Theme Park Companion (assets/theme-park-core.js + parks/*.js). Use when asked to add another theme park, create the Companion for a named park, migrate a park into the Theme Park Companion, configure a new parks/<park-id>.js, or add a third park. Do NOT use for correcting one attraction, changing one restaurant/restroom, editing one existing park's data, or implementing a generic core feature unrelated to onboarding a park — those are plain edits, not a park-onboarding workflow.
---

# Add Theme Park

## Mission

Reliably orchestrate adding a new park to the existing architecture:

```
REQUEST
   ↓
DISCOVER PARK CAPABILITIES
   ↓
DERIVE CURRENT CONTRACT
   ↓
NORMALIZE DATA (with provenance)
   ↓
CREATE parks/<park-id>.js
   ↓
ADD ASSETS / THIN SHELL
   ↓
VALIDATE REFERENCES + OPTIONAL-CAPABILITY BEHAVIOR
   ↓
BROWSER SMOKE TEST (new park + regression on existing parks)
   ↓
INVOKE theme-park-architecture-audit  (mandatory gate)
   ↓
COMPLETION REPORT
```

Keep this skill thin and orchestration-focused — it delegates the deep
architectural check to `theme-park-architecture-audit` rather than
duplicating its checklist. Do not turn this into a general "how to write
JS" tutorial.

## Authority boundary

You may inspect the contract, gather data, identify gaps, propose defaults,
build config, validate structure, and implement once authorized to make the
change. You must **never invent as fact**: ride restrictions, show
schedules, operating hours, coordinates, Plus Codes, official map numbers,
accessibility constraints, restaurant/restroom services, or wait times.
Unknown is always better than a plausible-looking fabricated value — this
codebase's existing adapters (see the provenance header comments in
`parks/legoland-new-york.js`) model exactly this discipline; match it.

## Step 1 — Read the current system

Before writing anything, read:

- `assets/theme-park-core.js` header comment (current `window.PARK`
  contract — treat as more current than any static copy in these skill
  files, including this one).
- `parks/story-land.js` and `parks/legoland-new-york.js` — two adapters,
  not a template to blindly clone. They differ meaningfully (Story Land:
  no `family`, has `reactionSystem`, has `geoCalibration`; LEGOLAND: has
  `family`, no `reactionSystem`, no `geoCalibration`, has `quickServices`)
  — that variance is the point: it shows what's actually optional.
- `specs/architecture/park-contract.md.asc` and
  `specs/architecture/theme-park-core.md.asc`, if a legitimate passphrase
  channel is available in your environment (see
  `theme-park-architecture-audit`'s "Specification vs. implementation"
  section for the full read policy and evidence model — never
  guess/invent/ask the user to paste it in chat). If unavailable, say so
  explicitly and proceed from the code (header comment + both adapters +
  the test fixture) — but treat that as `unable_to_verify` for the spec
  dimension, not as the code having automatically become the authoritative
  contract. If something you read in the code contradicts what little spec
  content you do have access to, don't silently pick a side — flag it for
  `theme-park-architecture-audit` (Step 15) to classify properly rather
  than resolving it yourself mid-onboarding.
- `tests/theme-park/fixtures/minimal-test-park.js` — a good second example
  of "what's genuinely optional", since it deliberately omits things both
  real parks happen to have (illustrated map, `quickServices` config,
  `poiFilterGroups`).

Do not copy an existing adapter file and rename fields blindly — read it
for structure, not as a fill-in-the-blanks template.

## Step 2 — Determine the park's capability profile

Before writing data, decide what this park actually has. Derive the
representation from the current contract rather than treating the shape
below as fixed — but capture at least:

```yaml
park_capabilities:
  illustrated_map: true|false          # has an official map image to vendor
  geographic_map: true|false           # has any real geo coordinates at all
  gps_proximity: true|false            # geo present → this comes for free
  geo_calibration: true|false          # enough well-distributed geo+mapMarker pairs, see Step 7
  zones: true|false
  family_eligibility: true|false       # collected child ages/heights?
  reaction_system: true|false          # a dynamic "how did X go?" flow?
  shows: true|false
  shows_have_geo: true|false           # → needs geoExtraCollections:['shows']
  pois:
    restroom: true|false
    dining: true|false
    first_aid: true|false
    family_care: true|false
    locker: true|false
    charging: true|false
    <other-type>: true|false           # open set — don't force into this list
  closing_time_known: true|false
  quick_services_needs_curation: true|false   # only if the default derivation picks the wrong 4
```

## Step 3 — Surface assumptions

Before implementing any uncertain datum, classify it: **confirmed**,
**inferred**, **approximate**, or **unknown**. Don't block on optional
fields being unknown — block only if contract-*required* information
(`id`, `name`, at least one attraction) is genuinely unavailable.

## Step 4 — Establish provenance

Where the model supports it (attractions' `geo`/`restrictions`, POI `geo`),
record where a value came from: official website, official PDF, on-site
observation/Plus Code, Google Maps, manual map calibration, third-party
source, inference, or unknown. Follow the 3-level `geo.confidence` model
already established in `parks/legoland-new-york.js`
(`confirmed_on_site` > `official_map` > `approximate`) rather than
inventing a new scheme. Never inflate confidence — an estimated position
stays `approximate` even if it looks precise.

## Step 5 — Build `parks/<park-id>.js`

The primary deliverable is one file:

```js
window.PARK = { /* ... */ };
```

using the current contract as derived in Step 1. If a new field seems
necessary, classify it first: is it **park-specific data** (belongs in the
adapter, always) or a **generic capability** (must be designed for reuse by
any future park, and belongs in the core only via
`theme-park-architecture-audit`'s "legitimate generic evolution" path — see
Step 15)? Never resolve a gap with `if (PARK.id === '<new-park>')` inside
the core — that is exactly the leakage this architecture exists to prevent.

### Entities

- **Attractions**: normalize `id, name, cat, zone, adult, geo?, mapMarker?,
  mapNumber?, mapRegion?, visualLandmark?, nearbyMapNumbers?,
  nearbyAttractions?, tags?, why?, tip?, priorityTier?, waterBoostTier?,
  restrictions?, plusCode?` as applicable. Never fabricate optional values —
  omit them.
- **POIs**: use open, extensible `type` strings (`restroom`, `dining`/`food`,
  `first-aid`/`firstaid`, `family-care`/`familycare`, `locker`, `charging`,
  `water`, `shopping`/`store`, `entrance`, `parking`, or a genuinely new
  type this park needs — the core derives labels/icons for anything). Don't
  treat this list as closed.
- **Shows**: if a show has `geo` and should participate in
  proximity/the geographic map, add it via `PARK.geoExtraCollections`
  (e.g. `['shows']`) — never modify the core just because shows now carry
  coordinates; that extension point already exists.

## Step 6 — Add map support matching actual capability

Support exactly what the park has: official illustrated map + a local image
(only if you actually have the image — never invent one), external
official map link only, geographic data without an illustrated map, or
optional geo calibration. Never copy another park's calibration
coefficients — they're specific to that map image and that park's control
points.

## Step 7 — Only enable `geoCalibration` with defensible data

Follow the standard already set in `parks/legoland-new-york.js`'s extensive
`map:{}` comment: fit an affine transform only from `confirmed_on_site` (or
equivalently trustworthy) `geo`+`mapMarker` pairs, well-distributed across
the map (not clustered in one zone), and only activate it if the
leave-one-out residual stays low enough that "🔵 Estás aquí" won't visibly
misplace the user by tens of meters. If the data doesn't clear that bar,
leave `geoCalibration` undefined and document why (residuals, what
coverage is missing) in the adapter's header comment — exactly as
`parks/legoland-new-york.js` already does. This is a data-quality decision
per park, never a core change.

## Step 8 — Create a thin HTML shell

This step is mechanical, not just structural guidance — run it, don't
eyeball it.

1. **Before writing the new shell**, diff every existing shell against each
   other (today: `diff storyland.html legoland.html`; if a third+ park was
   added since, diff all pairs, or diff each against a fixed baseline). The
   allowed diff, per `specs/architecture/theme-park-core.md.asc`, is
   **exactly**: the `<title>` text, the `theme-color` meta's initial
   `content` value, the header `<h1 id="parkHeaderTitle">` initial text,
   and the `<script src="parks/<park-id>.js">` tag. Nothing else should
   differ — `applyParkTheme()` in the core overwrites all of those
   placeholders at load time from `PARK.copy`/`PARK.theme`, so the
   "filler" values in the raw HTML never actually reach the user; the only
   reason they exist is to avoid a flash of wrong title/color before JS
   runs.
   - **If the existing shells already diverge beyond that allowed set**,
     stop and report it as its own finding in the completion report
     (`unresolved_items`) — do not silently carry the drift into the new
     shell, and do not silently fix it either unless the new park's own
     requirements genuinely need that fix. Pre-existing drift is a
     separate follow-up from onboarding this park.
2. **Write the new shell** by copying the shell with the smallest diff to
   nothing else, then changing only the four allowed values above.
3. **After writing it**, diff the new shell against each pre-existing one
   again and confirm the diff is still exactly those four values, now with
   the new park's data. Treat any other difference — a missing tag, a
   reordered attribute, a copy-paste leftover from the source shell's own
   filler values, anything — as a bug to fix before moving on, not a
   stylistic choice.

Do not embed the core into the HTML and do not create a new single-file
app — the shell's only job is to load `assets/theme-park-core.css`, the
vendored Leaflet assets, `parks/<park-id>.js`, then
`assets/theme-park-core.js`, in that order, plus the static markup
skeleton the core renders into.

## Step 9 — Preserve behavior ownership

**The adapter owns**: park data, park-specific copy, park-specific
prioritization, park-specific reaction config, park-specific categories,
service inventory, map data, geo, restrictions.

**The core owns**: rendering mechanics, generic recommendation mechanics,
generic entity/service handling, generic map/GPS behavior, generic state
mechanics, generic capability interpretation.

If a decision doesn't fit cleanly on one side, stop and think before
coding — don't default to "just put it in the core, it's easier."

## Step 10 — Avoid false generalization

Don't move a value into the core merely because this new park happens to
share it with an existing one. Two real adapters agreeing is evidence worth
evaluating (flag it for `theme-park-architecture-audit`'s Step 9), not
justification to hardcode shared data into the engine.

## Step 11 — Validate references

Check for dangling/duplicate IDs and invalid cross-references in:
`mustIds, calmIds, childFavoriteIds, waterIds, priorityGroups[].ids,
reactionSystem.triggerId/targetId, attraction.nearbyAttractions,
map.geoCalibration.controlPointIds`. Also confirm no attraction ID collides
with a POI ID (the core merges both into one `BY_ID` lookup — a collision
would silently shadow one entity).

A quick manual pass or a short throwaway Node script both work; there's no
existing linter for this, so don't invent one as permanent tooling —
`scripts/` in this skill, if you add one, should be a single mechanical
reference-integrity check, not a new build step for the repo.

## Step 12 — Validate optional-capability absence

Mentally (or by inspection) confirm the app still works with: no `family`,
no `shows`, no `reactionSystem`, no `geoCalibration`, no illustrated map,
POIs without `geo`, no zones, empty optional collections. Don't fill
optional fields with fake values just to satisfy the core — if a field is
genuinely unknown, leave it absent and let the documented fallback do its
job.

## Step 13 — Browser/runtime verification

Actually load the new shell in a browser (Playwright, if available, mirrors
what `tests/theme-park/theme-park-core.spec.js` already does for the
fixture) and confirm: no JS console errors, header/theme applied, the
attractions list renders, a recommendation appears, cards render, the map
sheet opens (illustrated and/or geographic, per capability), POI/services
section renders, checklist state persists across a reload, optional
capabilities that are absent don't produce blank/broken UI, and bottom-nav
tabs work. Parsing without a JS error is not success — verify the actual
rendered UI.

## Step 14 — Regression-check existing parks

Mandatory: reload `storyland.html` and `legoland.html` (or run
`npm test`, which already exercises the shared core — though it does so
against the synthetic fixture, not these two files, so also spot-check the
two real shells directly) and confirm nothing broke. A new park's data or a
core tweak made along the way must not change existing parks' behavior.

## Step 15 — Invoke `theme-park-architecture-audit`

This is a mandatory completion gate, not optional polish. Invoke the
`theme-park-architecture-audit` skill focused on the diff this task
produced. The new park is not complete if the audit returns any BLOCKING
finding. The audit's central question doubles as this skill's own
acceptance test:

> Did adding this park introduce park-specific knowledge into the shared
> core?

If the audit flags a capability gap (not leakage) for the park you're
actually onboarding, it is by construction backed by
`real_current_requirement`/`observed_existing_park_need` (this is a real
park, not the audit's own fictitious stress-test park) — record it in this
skill's completion report as an `unresolved_item`/follow-up. Implementing a
brand-new generic capability is still out of scope for a routine
park-onboarding task unless this park cannot function at all without it, in
which case stop and get explicit authorization before touching the core.
(The audit's *conceptual* Third Park Test may separately surface
`hypothetical_stress_test_only` gaps from its own fictitious dry-run park —
those are not about the park you're onboarding and don't belong in this
skill's `unresolved_items` at all; they're the audit's own output, not
yours.)

## Step 16 — Implementation/spec audit, if available

If a `review-implementation-audit`-style skill is available in this
environment, use it to check the new adapter against the contract and any
requirements gathered in Steps 2-4. If unavailable, do only a light local
check against the specs you were able to read in Step 1 — don't duplicate
a full generic audit workflow inside this skill.

## Step 17 — Update canonical specs only if the generic contract changed

If (and only if) this park's onboarding revealed a new generic capability
that Step 15's audit recommended and that was actually implemented, update
`specs/architecture/park-contract.md.asc` (and/or the relevant sibling
spec) to document it — re-encrypt with the same scheme, verify the
roundtrip, delete plaintext. Do not touch generic specs just to document
park-specific data that's already correctly sitting in the adapter — that
belongs in `parks/<park-id>.js`'s own header comment, following the
provenance-comment style already used there.

## Step 18 — Completion report

Produce:

```yaml
add_theme_park_result:
  park:
    id:
    name:
  files_created: []
  files_modified: []
  capabilities: {}          # from Step 2, as actually implemented
  data_quality:
    confirmed: []
    approximate: []
    unknown: []
  validation:
    adapter_contract:
    reference_integrity:
    shell_diff:            # result of Step 8's diff, e.g. "clean" or "pre-existing drift found: <what>"
    browser_smoke:
    story_land_regression:
    legoland_regression:
    architecture_audit:
    implementation_audit:
  core_modified: false
  core_modification_reason: null
  unresolved_items: []
  overall_status: complete | complete_with_followups | blocked
```

## Critical invariant

`core_modified: true` is **not automatically a failure** — but it demands
an explicit, honest reason. Acceptable: generic capability evolution (a new
optional field any park could use, validated by the audit as legitimate),
a generic bug fix, a shared refactor that doesn't special-case this park.
**Unacceptable**: "the new park needed a special case" — that is precisely
the failure mode this architecture exists to prevent, and it should always
surface as a BLOCKING finding from Step 15's audit before this report is
written.

## Common rationalizations — don't fall for these

| Rationalization | Reality |
|---|---|
| "It's faster to copy an existing park's HTML file wholesale and hand-edit it." | The shell must stay thin and near-identical to the others; copying invites divergence and forks the markup. |
| "I only need one small `if (PARK.id===...)` in the core." | That's exactly the leakage this architecture is designed to prevent — no size of special case is acceptable. |
| "All parks have zones." | Story Land and LEGOLAND both do, but nothing in the contract requires it — don't assume a universal capability without checking the contract. |
| "I don't have coordinates, so I'll estimate them." | This codebase's own convention (see `parks/legoland-new-york.js`) is: unknown is better than an invented value. Leave `geo:null`. |
| "I can reuse Story Land's `geoCalibration` coefficients as a starting point." | Calibration is fit to one specific map image and one specific park's control points — it's meaningless for another park's image. |
| "This service is unique to this park, so I'll reference its ID directly in the core." | Generic service behavior works by `type`, never by a specific POI id — see `poiTypeLabel()`/`quickServiceList()`. |
| "Two parks already do it the same way, so I'll just hardcode that shared value into the core." | Two real cases are evidence worth flagging for a possible generic capability — not justification to hardcode data into the engine. |
| "The page opened with no console error, so we're done." | Parsing is not verification — Steps 13-14 (real rendering + regression) and Step 15 (the audit) are still mandatory. |
| "The audit's conceptual dry run flagged a gap, so I should build it now." | Only if this park's own real needs surfaced it. A gap from the audit's own fictitious stress-test park is `hypothetical_stress_test_only` — it validates that a path *could* exist, it doesn't authorize walking it. |

## Quality gate

- [ ] Park ID is stable and unique (no collision with existing park ids).
- [ ] One source of truth for this park's data — no duplication across
      files.
- [ ] No duplicate entity IDs; no attraction/POI ID collision.
- [ ] No dangling references (`mustIds`, `priorityGroups[].ids`,
      `reactionSystem.*Id`, `nearbyAttractions`,
      `geoCalibration.controlPointIds`, etc.).
- [ ] Optional capabilities may be entirely absent without breaking the app.
- [ ] Uncertain data is marked as such, never presented as confirmed.
- [ ] HTML shell stays thin — actually ran `diff` (Step 8) against every
      other existing shell, both before writing and after, and any
      difference beyond title/theme-color/h1/`<script src="parks/...">`
      is either fixed or explicitly reported as an `unresolved_item`.
- [ ] No park-specific branches were added to the shared core.
- [ ] Story Land still works (regression-checked).
- [ ] LEGOLAND New York still works (regression-checked).
- [ ] The new park works (real browser verification, not just "it parses").
- [ ] `theme-park-architecture-audit` produced zero BLOCKING findings.
- [ ] Generic specs were updated only if the generic contract actually
      changed.
- [ ] No generic behavior was duplicated inside the new adapter that the
      core should have provided.
- [ ] No park-specific data was moved into the core.

## References

- `references/park-onboarding-checklist.md` — an onboarding *validation*
  checklist (identity, uniqueness, references, provenance, optional-capability
  absence, map support, thin shell, smoke test, regression, audit) plus
  where to derive the contract fresh each time. Deliberately not a
  field-by-field copy of the `window.PARK` contract — that lives in
  `specs/architecture/park-contract.md.asc` and the core's own header
  comment, and this file points there instead of duplicating it.
