# D08 v1 — Exact unique materialization

Status: source-backed design, producer and QA plan READY; capability RED frozen
before runtime edits and independently approved; additive implementation now
passes unchanged frozen43/43 and final producer/QA APPROVE/ADEQUATE.
This adds a new capability; ordinary random selection
has no existing promise of exact named selection.

Add `rollUniqueItem({ uniqueId, ilvl }, pools, rng): Item | undefined` beside
`rollItem`. The caller names one exact unique template. Require a positive
integer ilvl, with no campaign cap. Missing catalog/ID, duplicate matching IDs
(before eligibility filtering), missing base, base map-key/identity mismatch,
or `ilvl < (template.qlvl ?? template.reqLevel)` return undefined before RNG
or item allocation. No aliases, normalization, weighted selection or fallback.
Selection weight is irrelevant; zero weight is a typed engine edge fixture,
not schema-valid authored content. The authored schema remains unchanged.

Reuse existing eligibility and template construction. Output keeps exact
template/base identity, unique rarity, input ilvl, level
`max(ilvl, template.reqLevel)`, existing ranged stat/base rolls, empty
affixes/generated name and identified/unequipped flags. A higher base equip
requirement does not change generation eligibility. Fixed bonuses remain in
the template; empty stored stat rolls are valid. Caller definitions have typed
stat/base shapes; constructor and RNG exceptions propagate, with possible
consumption and allocator gaps. No rewinding on exceptional failure.

Construction uses the supplied RNG in existing order: ranged stats, instance
ID, base attack/defense. Seed reproduces rolled properties; matching allocator
state is additionally required for matching IDs. Separate successes create
fresh items with distinct IDs. Keep the existing weighted `rollItem` and its
rare fallback untouched.

This pure API grants nothing. Andariel mapping, reward-table picks/ilvl,
relationship between explicit item and table, currencies, claim/save/retry
wiring and earned campaign acceptance remain separate design/integration work.
