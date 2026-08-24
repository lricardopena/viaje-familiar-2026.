---
name: theme-park-architecture-audit
description: Audit whether the Theme Park Companion (assets/theme-park-core.js + parks/*.js) still keeps the shared core generic and free of park-specific knowledge. Use when asked to audit Theme Park Companion architecture, check whether the core remains generic, review a PR/diff that touches assets/theme-park-core.js or parks/*.js for hardcoded park logic, evaluate extensibility before adding a park, prepare for or validate a third park, or verify that a behavior learned from Story Land/LEGOLAND was generalized into a capability instead of special-cased by park ID. Its lens is specifically the generic-core-vs-park-specific-data boundary — not a general correctness/style code review (use /code-review for that).
---

# Theme Park Architecture Audit

## Mission

Answer one question with evidence, not vibes:

> Could a materially different third park be added today primarily through
> `parks/<park-id>.js` (+ park-specific assets/config) **without** modifying
> `assets/theme-park-core.js` for park-specific reasons?

This protects the standing architectural invariant of the Theme Park
Companion (see `assets/theme-park-core.js` header comment and
`specs/architecture/theme-park-core.md.asc`):

```
GENERIC CORE  (assets/theme-park-core.js)
    ↓  consumes via a stable contract
GENERIC CONTRACT / CAPABILITIES  (window.PARK shape, opt-in fields)
    ↓  declared per park
PARK CONFIGURATION / DATA  (parks/<id>.js)
```

The core must contain **zero** runtime branches keyed on a specific park id,
attraction id, zone name, POI id, child, or park-specific category. Every
difference between parks must be expressible as data, an optional field, or
a capability that degrades cleanly when absent — never as a core `if`.

This is not a generic code-review skill. Do not report style nits,
performance, or unrelated correctness bugs here — only findings on the
core/park boundary. If you notice an unrelated real bug while auditing,
mention it once as a footnote, don't turn this into a full review.

## When NOT to use this

- Reviewing changes to `data.js`/`index.html` (the itinerary, unrelated app).
- General code quality/security review of the whole repo.
- Auditing `auth.js`/`auth.css` (unrelated to the park engine).

## Vocabulary (compose, don't duplicate)

If the generic skills `coding-codebase-design` and
`coding-api-and-interface-design` are available, lean on their vocabulary
(module, interface, seam, adapter, depth, locality, the deletion test, "one
adapter is hypothetical, two adapters make the seam real", validate at
boundaries, prefer addition over modification) instead of re-deriving it
here. This skill only adds the Theme Park Companion-specific application of
those ideas.

## Ground truth in this repo (read before auditing)

At minimum, read/inspect current state — do not assume the list below is
exhaustive or that it will never change; if the repo has grown more park
files, shells, or specs since this was written, include those too:

- `assets/theme-park-core.js` — the shared engine. Its header comment is the
  authoritative, current `window.PARK` field list; treat it as the
  first-order source of truth over this skill's own copy below, which can
  drift.
- `assets/theme-park-core.css` — shared styling; check it for park-name
  selectors too (rare, but a CSS-level leak is still a leak).
- `parks/story-land.js`, `parks/legoland-new-york.js` — the two real
  adapters. Two adapters make any shared pattern between them real evidence;
  one adapter's choice is just that park's choice.
- `storyland.html`, `legoland.html` — the thin shells. They should be
  byte-for-byte identical except: `<title>`, the `theme-color` meta initial
  value, the header `<h1>` initial text, and the `<script src="parks/...">`
  tag. Diff them (`diff storyland.html legoland.html`) as a cheap first
  check.
- `tests/theme-park/fixtures/minimal-test-park.js` + `.html` and
  `tests/theme-park/theme-park-core.spec.js` — **the repo already has a
  mechanical, automated version of the Third Park Test** (see Step 6). It
  runs a synthetic park that shares no id/name/zone with Story Land or
  LEGOLAND against the real core via Playwright. Run it
  (`npm test` from repo root, installing Playwright once if needed) as part
  of this audit — a red result here is itself a BLOCKING finding. Treat this
  fixture as a second, independent source of truth for the contract
  alongside the header comment: if it exercises a capability this document
  doesn't mention, that capability is real and covered.
- `specs/architecture/theme-park-core.md.asc`, `park-contract.md.asc`,
  `geolocation-and-maps.md.asc`, `family-and-eligibility.md.asc`,
  `recommendation-engine.md.asc`, `observations-and-state.md.asc` — canonical
  architecture docs. Per `specs/README.md` and `CLAUDE.md`, these may be
  decrypted and read proactively without asking, using a passphrase obtained
  only through a legitimate channel already available in your environment —
  never guessed, invented, or requested from the user to paste in chat. If
  no legitimate channel is available in your context, say so explicitly in
  the audit output rather than fabricating spec content, and fall back to
  the code itself (header comments + both adapters + the test fixture) as
  the source of truth — the code is normative regardless of spec access.
  Never print, log, or persist the passphrase; delete any decrypted `.md`
  plaintext before finishing.

## Durable audit state

Track findings in a structure roughly like this (equivalent shapes are
fine — this is a thinking aid, not a schema to fill mechanically):

```yaml
theme_park_architecture_audit:
  revision: <git ref/commit under audit>
  core_files: [assets/theme-park-core.js, assets/theme-park-core.css]
  park_files: [parks/story-land.js, parks/legoland-new-york.js, ...]
  shells: [storyland.html, legoland.html, ...]
  specs_consulted: []
  discovered_capabilities: []      # optional contract fields actually consumed
  candidate_findings: []
  validated_findings: []
  third_park_test:
    status: not_run | ran_automated | ran_conceptual | both
    automated_result: pass | fail | not_available
    hypothetical_park: null
    verdict: null
  overall_status: null
```

## Core procedure

### Step 1 — Establish the baseline

List the current core file(s), real park adapters, shells, and specs (see
"Ground truth" above). Note the git revision under audit so findings are
reproducible.

### Step 2 — Derive the current `window.PARK` contract

Derive it from three places, in this priority order when they disagree:
1. `assets/theme-park-core.js` header comment (authoritative intent).
2. Actual runtime reads of `PARK.*` in the core (`grep -n "PARK\."`) —
   this is what's *really* consumed, which can be broader than the header
   documents if a comment went stale.
3. Both real adapters, to see what's actually populated.

Classify each field as **required**, **optional (degrades cleanly when
absent)**, **capability-specific** (only meaningful when a related
capability is on), **derived** (computed by the core, never set by a park,
e.g. `_i`), or **legacy/deprecated**.

As of this skill's authoring, confirmed top-level `PARK` fields include:
`id, name, emoji, theme, copy, map (url, image, center, geoCalibration?,
poiFilterGroups?, poiFilterGroupLabels?, defaultGeoFilters?), storageKey,
attractions, pois, mustIds, calmIds, childFavoriteIds, waterIds, categories,
priorityGroups, reactionSystem, tips, family, shows, closingTime,
geoExtraCollections?, quickServices?, poiTypeLabels?`. Per-attraction and
per-POI fields are documented in the same header comment. **Re-derive this
list from the live header comment and `grep -n "PARK\."` rather than trusting
this snapshot** — it will drift as the engine grows generic capabilities.

### Step 3 — Audit entity boundaries

Confirm the model still separates `attractions` (the only collection with
recommendation semantics — scored, has state/done-tracking) from `pois`
(purely informational — dining/restrooms/first-aid/etc., never scored) and
optionally `geoExtraCollections` (park-declared extra localizable
collections, e.g. `shows` with `geo` — opt-in via
`PARK.geoExtraCollections`, an array of field names on `PARK`; see
`LOCATABLE_COLLECTIONS`/`allLocatableEntities()`/`geoKnownPoints()` in the
core).

For POI service behavior (`poiTypeLabel()`, `quickServicesHtml()`,
`servicesHtml()`), confirm `type` stays an **open, extensible string** —
the core should derive labels/icons/grouping from data
(`POI_TYPE_LABEL_DEFAULTS` is a convenience table, never a closed list;
`PARK.poiTypeLabels` can override/extend it; an unknown type must still
render via a data-derived fallback, never error or vanish). Absence of a
service type must never be treated as an error — a park can simply not have
`locker`/`charging`/`water`/etc.

### Step 4 — Search for hardcoded park knowledge

Search the **core only** (not the adapters — data there is expected) for
literal or semantic park-specific branches:

```
grep -n "PARK.id===" assets/theme-park-core.js       # must be empty
grep -nE "'(story-land|legoland|polar|roar|ninjago)'" assets/theme-park-core.js
```

See `references/hardcode-checklist.md` for the fuller signal list (zone
names, attraction IDs in scoring, special tips/reactions, map exceptions,
family/child exceptions, service exceptions, wait-time logic tied to one
park). Distinguish runtime behavior from comments/docs: a comment
mentioning `story-land` to explain provenance or history is fine and
common in this codebase (e.g. "mismo comportamiento que Story Land") — only
flag code that *executes differently* because of a park identity check.

### Step 5 — Audit capabilities for clean degradation

For each significant behavior, ask: is this gated by generic
configuration/field-presence, or does the core assume every park has it?
Evaluate the ones present in the current engine: recommendation scoring
(`candidateList`/`computeScore`/`isHardExcluded` — hard constraints are only
`done`/`closed`/`discarded` status and `unavailable===true`; everything else,
including "no registered child is eligible", is a soft signal, never an
exclusion — see `allRegisteredChildrenIneligible()`'s own comment for why),
priority tiers/`priorityGroups`, cooldowns, repeat/favorite, closing-time
bonus (`PARK.closingTime` optional), `reactionSystem` (optional, `null` for
LEGOLAND), `family`/child eligibility (optional, `null` for Story Land — the
generic indicator `adult` must still work without it), shows/show-soon
banner (optional, `[]` for Story Land), geolocation/GPS/nearest-service,
illustrated map + `geoCalibration` (optional — LEGOLAND has none activated
and still works via fallback), geographic map (Leaflet, works off `geo`
alone), zones (used for grouping/orientation, not required — a park with one
zone or none should still render), POI cards/services, `quickServices`
(optional, derived by default from `PARK.pois` if absent).

A capability that silently breaks or crashes when its opt-in field is
missing is a MAJOR finding even if no park hits it today.

### Step 6 — Run the Third Park Test — automated, then conceptual

**Automated (do this first, it's cheap and already built):** run
`npm test` (or `node tests/theme-park/theme-park-core.spec.js`) from repo
root. This exercises the real core against
`tests/theme-park/fixtures/minimal-test-park.js`, a synthetic park sharing
no id/name/zone with either real park, covering: mixed child eligibility,
an attraction with no `restrictions` (must show `unknown`, never `✅` by
default), an attraction no registered child qualifies for (must stay a
candidate, not hard-excluded), `unavailable:true` (must be hard-excluded), a
missing illustrated map, an invented POI type, and undeclared
`quickServices`/`poiFilterGroups` (must derive defaults). Record
`automated_result: pass|fail`. A failure here is itself a BLOCKING finding —
it means a real regression already broke the contract, not a hypothetical
one.

**Conceptual (do this too — the automated fixture is deliberately minimal
and won't cover every future capability):** invent a third park
deliberately different from both real parks in more dimensions than the
fixture covers — e.g. a park with no illustrated map at all (only
geographic), a park with shows that have `geo` and participate in
proximity, a park with zero zones, a park with POI types no fixture or
existing park uses, a park with no family/eligibility model, a park with
partial geo (some POIs have coordinates, most don't). Walk through what
files that park would need. See `references/third-park-test.md` for the
worked structure and interpretation rules (bad core modification vs.
legitimate generic evolution).

Emit:

```yaml
third_park_test:
  automated_result: pass|fail|not_available
  conceptual:
    new_files: []
    modified_existing_files: []
    core_changes: []
    unsupported_requirements: []
  verdict: pass | pass_with_generic_core_evolution | fail
```

If the hypothetical park needs `if (PARK.id === '<new-park>')` in the core,
that's a finding. If it instead reveals a capability worth generalizing
(e.g. "shows with per-show `restrictions`" isn't supported by anything
today), that's **legitimate generic evolution to recommend**, not a
violation — write it up as a capability gap, not as leakage.

### Step 7 — Addition-over-modification test (when a diff/history is available)

Classify each change to `assets/theme-park-core.js` (or `.css`) in the diff
under review as: generic capability evolution, generic bug fix, refactor,
park-specific leakage, or unclear. Only **park-specific leakage** is a
direct architectural violation — the others are normal and expected core
changes over time (the core's own history shows plenty of legitimate
evolution, e.g. `minAge`/`maxAge` support added when LEGOLAND needed it,
`geoExtraCollections` added as an opt-in extension point, `BY_ID` extended
to index POIs). The bar for "legitimate" is: does it read from `PARK.*`
generically, or does it name a specific park/attraction/zone?

### Step 8 — Audit locality

Park-specific knowledge (attraction names/IDs, map numbers, zone names,
Plus Codes, coordinates, map markers, restriction sourcing, restaurant/
restroom names, ride tips, park-specific copy/prioritization, reaction
config, storage key, calibration coefficients) must live in `parks/<id>.js`
or park-specific assets — never migrate into the core just because it's
convenient. The core should consume all of it through the stable field
contract from Step 2.

### Step 9 — Audit duplicated adapter logic (the inverse problem)

If `story-land.js` and `legoland-new-york.js` contain large structurally
identical blocks that aren't just "both happen to be JS objects", ask
whether a generic default/capability is missing from the core — but require
real evidence of shared *behavior*, not just two strings matching by
coincidence. (Two adapters agreeing is what makes an abstraction candidate
real; it's still evidence to evaluate, not an automatic justification to
hardcode.)

### Step 10 — Validate every finding before publishing it

For each candidate finding, confirm: (1) it's runtime behavior, not a
comment/doc; (2) it's genuinely park-specific, not a generic rule that
happens to read naturally for one park; (3) the current contract can't
already express it; (4) if not, there's a real capability gap, not just an
unused field; (5) there's multi-adapter evidence where relevant; (6) fixing
it would deepen the seam, not just relocate a shallow special case; (7) no
spec explicitly authorizes the current behavior as an intentional,
documented boundary decision (e.g. the extensive `geoCalibration`
non-activation reasoning in `parks/legoland-new-york.js` is a deliberate,
documented data-quality decision, not an architecture bug).

## Finding schema

```yaml
finding:
  id: TPA-001
  severity: BLOCKING | MAJOR | ADVISORY
  category: hardcoded-park-logic | hardcoded-entity-id | hardcoded-zone |
    capability-gap | contract-leak | boundary-validation |
    duplicated-adapter-logic | shallow-abstraction | unsupported-third-park |
    documentation-drift | other
  claim:
  evidence: []          # file:line, or npm test output
  affected_files: []
  park_specific_knowledge:
  expected_boundary:
  current_boundary:
  third_park_impact:
  remediation:
  confidence:
  status: candidate | validated | dismissed
```

## Severity

**BLOCKING** — a runtime core branch on a specific park ID/attraction/zone;
a reasonable third park would require park-specific core code; essential
park data can't be declared via the contract and must be hardcoded; one
adapter can't satisfy the contract without breaking the other; `npm test`
fails against the minimal fixture.

**MAJOR** — an inconsistent/undocumented contract; significant shared logic
duplicated across adapters that should be a core default; a capability
implemented on the wrong side of the boundary; an assumption that
meaningfully limits extension but has a workaround today.

**ADVISORY** — documentation drift (header comment vs. actual fields);
naming inconsistency; optional-default improvements; non-urgent abstraction
opportunities.

Do not inflate severity — most audits of this codebase, given its existing
discipline, should turn up ADVISORY findings at most.

## Required final output

```yaml
theme_park_architecture_audit:
  revision:
  architecture:
    core: []
    adapters: []
    shells: []
    specs_consulted: []
  contract_summary: {}
  third_park_test:
    automated_result:
    verdict:
    new_files: []
    modified_existing_files: []
    core_changes_required: []
    capability_gaps: []
  findings:
    blocking: []
    major: []
    advisory: []
  overall_status: pass | pass_with_advisories | changes_required | unable_to_complete
```

Follow the YAML with 2-5 sentences of plain-language explanation a human
can act on without parsing YAML.

## Quality gate (all must hold before finishing)

- [ ] Read the current core header comment and grepped its `PARK.*` reads.
- [ ] Read both real park adapters (or all park adapters, if more exist).
- [ ] Consulted the relevant specs, or explicitly noted why not (no
      legitimate passphrase channel available).
- [ ] Ran `npm test` (automated Third Park Test) and recorded the result.
- [ ] Distinguished runtime hardcodes from comments/history/docs.
- [ ] Evaluated capability degradation, not just literal park-ID checks.
- [ ] Performed the conceptual Third Park Test with a park meaningfully
      different from the automated fixture.
- [ ] Every published finding carries file:line or test-output evidence.
- [ ] Distinguished park-specific leakage from legitimate generic evolution
      or from an intentional, spec-documented boundary decision.
- [ ] Did not recommend moving park-specific data into the core.
- [ ] Did not recommend duplicating generic behavior into every adapter.
- [ ] Verified optional capabilities degrade cleanly (no crash/blank on
      absence).
- [ ] Checked specs vs. implementation for drift, when specs were readable.

## Stop conditions

Finish only when a Third Park Test verdict can be emitted, all published
findings are validated (not merely candidate), no high-severity candidate
remains uninvestigated, or the output explicitly states what missing
evidence (e.g. no spec access, `npm test` couldn't run) prevented full
completion — never silently omit a step.

## References

- `references/hardcode-checklist.md` — concrete grep-able signals for this
  codebase specifically.
- `references/third-park-test.md` — the worked conceptual dry-run
  structure and interpretation rules (bad modification vs. legitimate
  evolution).

These specs remain canonical (`specs/architecture/*.md.asc`); the references
here are Theme Park Companion-specific application notes, not a duplicate
source of truth — if code and specs disagree, say so as a
`documentation-drift` finding rather than silently picking one.
