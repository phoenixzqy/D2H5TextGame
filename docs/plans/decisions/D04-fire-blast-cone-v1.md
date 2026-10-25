# D04 — Fire Blast's thrown cone explosion

2026-10-25. Author implementation contract for
[BUG207](../../../production/bugs/BUG-207-fire-blast-cross-instead-of-cone.md).
Root sole writer and author reviewer; independent design/QA and earned balance
remain open. This restores the advertised cone without reducing the full
213-skill/C0–C4/G0–G7/private-v1 objective.

## Requirement and selected adaptation

`docs/design/skills-spec.md` calls Fire Blast a “Cone fire trap”; both locales
describe throwing a fire trap that bursts in a cone. Current JSON instead
selects a cross. The source spec provides no numeric grid cone dimensions.
Use an explicit provisional `aoeShape:"cone-2"` preset: one apex cell followed
by the three adjacent cells in the next row of the enemy formation. Increasing
row means deeper into that formation, independently of which team casts it.
This is a targeting footprint, with no movement/range stat or new RNG.

For anchor `(r,c)`, the exact cells are `(r,c)`, `(r+1,c-1)`, `(r+1,c)` and
`(r+1,c+1)`. Apply the existing nonnegative integer-position validity rule;
negative columns are clipped, coordinates never wrap, and explicit overflow
rows/columns keep ordinary grid behavior. The footprint covers four cells,
not a four-enemy cap: multiple eligible units in one cell remain eligible.

Reuse the existing densest occupied-anchor resolver. Count living hostile
candidates, select the maximum count, and break ties by lower anchor row then
column. Return actual targets in existing row-major order, with no input
mutation. Candidates missing grid coordinates retain existing fallback rules;
the native battle assigns deterministic default positions before targeting.
Other shapes, skills, missing-shape fallback and target-priority rules remain
unchanged. No global shape replacement or weakening of schema validation.

Fire Blast is a thrown trap whose accepted action resolves one explosion.
Its existing promise has no persistent firing interval, lifetime or arming
delay; do not invent one or conflate it with Wake/Death Sentry persistent traps.
Preserve trap wording and the one-explosion identity in bilingual details.
Wake persistent traps, martial charges and Death Sentry corpse/lightning
requirements remain in scope for their separate implementations.

## Preserved combat and native authority

Preserve Fire50–70/+5 additional rank,25MP,2s cooldown,unlock1/cap20 and no
prerequisites. Each eligible enemy receives its ordinary independent hit/base/
critical roll, mitigation, finite personal absorption, Burn and settlement.
The [explicit10% Burn rule](D04-assassin-fire-v1.md) stays unchanged. One
action/payment/cooldown per explosion, no weapon Attack scaling, and paid
misses retain ordinary behavior. Dead/friendly units cannot enlarge or receive
the cone. Keep actual native class/rank/alias authority and immutable replay.

Schema admits this preset only for exact native Fire Blast and requires its
active/area/Fire/Burn identity. Update both actual JSON and the matching legacy
builder so explicit old-builder callers also receive the same footprint.
No new combat-loop branch, trap entity, dependency or save/version field.

## Presentation and acceptance

The pure rank display identifies `cone-2`; no grid decisions belong in React.
Both summary and Current/Next/unlearned/MAX rows explain the two-row footprint,
one explosion, damage per enemy and automatic densest placement. Preserve
explicit Burn details and unchanged costs/cooldowns. Public allocation and
Active Skills configuration plus exact five-domain Save-close-Continue must
match on en/zh-CN and desktop/mobile. Synthetic resources/high level are
disclosed and establish no earned build/balance progress.

Before the runtime/data repair, require RED for actual authored shape,
registration/schema/display, native selected target IDs and bilingual prose.
Cover full and sparse grids, edge clipping, tie order/permutation, overflow,
duplicate occupants, defaults/fallback, paid misses, death/reflection and
actual per-target direct/periodic HP conservation. Keep other shapes and
earlier Assassin Fire/Phoenix/Vengeance controls. Run focused/engine, strict
types, lint, production build and full suite against frozen inputs; inspect
real production screenshots and audit committed blobs before inventory credit.
Archive original failures and remove exact task-owned artifacts after use.

## Author plan/security review

Root-cause solution: introduce a real triangular footprint and author it for
Fire Blast, rather than renaming the existing cross. The preset uses the shared
resolver, preserving payment, hit, status and death semantics. Numeric geometry
is provisional, not claimed to be a previously approved design or earned balance.
Only first-party local grid/data/display/test code changes; no credentials,
network/permissions/CI/agent-behavior or remote action. This is author self-review,
not an independent gate approval. Full campaign/build/endgame acceptance stays open.
