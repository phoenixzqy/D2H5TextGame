# BUG-023 — Positive XP clears equipped player stats

Severity: High (every combat/quest XP award removes active equipment benefits).
Status: fixed in this BUG-023 commit (SHA supplied in handoff), 2026-10-20.
Affected systems: player progression and inventory; engine-dev/store owner.
Base: `b97b12e`.
Environment: Node24.21.0, Vitest1.6.1/jsdom; default zh-CN. No browser viewport,
wall-clock timing, RNG seed or external IO affects this store reproduction.

## Reproduction and evidence

1. Create an ordinary level1 sorceress through the production player factory.
2. Add a controlled helm to the backpack and equip through real inventory
   `addItem`/`equipItem`. Its modifiers include MF37/GF19, core stats, resource
   caps, attack/speed, defense and resistances. This is an integration fixture,
   not evidence of earned campaign progression or balance acceptance.
3. Call production `gainExperience(1)` without crossing a level threshold.
4. The same equipped item remains in inventory, but MF37/GF19 becomes0/0,
   lifeMax155 becomes120, attack35 becomes22 and all other gear modifiers vanish.
5. Repeat with XP100: the hero correctly reaches level2, but lifeMax is128
   instead of163 and equipment benefits again vanish. Multi-level and cap90
   awards reproduce the same defect.

Expected: every positive XP award derives at the resulting capped level from
base core stats plus current authoritative inventory equipment. Existing wounded
life/mana remain unchanged below the new caps; excess clamps to those caps.
XP remainder/points and inventory ownership remain intact.

Behavioral RED before runtime edits:8failed/5passed,1.78s at06:14:18UTC.
Command: `npx vitest run --project ui src/stores/playerStore.experience-equipment.test.ts --reporter=dot`.
The failures cover same-level/level-up/multi-level/repeated/cap awards, resource
clamps and both module entry orders. Empty equipment, unequip and no-op controls
pass. The test runs real stores, inventory eligibility, equipment aggregation
and XP arithmetic without stubs.

## Root cause and approved boundary

`playerStore.gainExperience` calls `deriveStats(coreStats, cappedLevel)` without
equipment modifiers on every positive award. `recomputeDerived` already composes
core/equipment/derived modifiers correctly. Share that composition privately in
playerStore and call it from both actions. XP reads inventoryStore.equipped once
at action time and publishes the final player once. No initialization-time
cross-store read; the direct player/inventory module cycle is tested in both
entry orders. The legacy player.equipment array is not authoritative and is
never a fallback. Do not cache or incrementally accumulate equipment modifiers.

This fixes persistent stat composition, not merely the MF snapshot for one loot
award. No XP/MF reward math, engine formulas, save schema, import normalization,
UI, existing fixtures or balance tuning changes. P17 reward/lifecycle/PWA gates
remain open.

Own only playerStore.ts, the new equipment-XP regression suite, this report and
a compact D09 addendum. Root and producer approved the plan before implementation.

Security check PASS: local stat recomposition only; no external IO, credentials,
permissions, CI, infrastructure or agent-behavior changes.

## Validation

Regression suite: `src/stores/playerStore.experience-equipment.test.ts`.
Post-fix focused13/13pass,1.68s at06:15:22UTC. The final expanded invariance
assertions also pass through related/full runs. Coverage includes same-level,
level-up, multi-level, repeated and cap90 awards, empty equipment, no-player and
nonpositive no-ops, wounded/excess resource pools, unequip without resurrection,
one player publication, unchanged core/inventory/affix Maps and both module entry
orders. No source/test/control outside the four approved files changed.

- `npm run test:related -- src/stores/playerStore.ts --reporter=dot`:
  40files/427passed/1existing skipped,17.28s at06:15:58UTC.
- `npm test -- --reporter=dot --silent`:
  109files/1208passed/1existing skipped,25.91s at06:16:43UTC.
- `npm run typecheck`, `npm run lint` and `git diff --check`:pass.
- `npm run build`:pass,5.28s. It reports large-chunk/Browserslist and oversized
  asset-manifest precache warnings; no build settings or asset policy changed.

The existing skip is the quarantined merc initial-XP defect; no test was skipped
or weakened here. Related/full durations exceed the documented5s/15s budgets;
functional passes do not accept those performance budgets.

Root and producer independent source/test/control reviews:APPROVE, no findings.
After all consumers finished, removed and verified absent the task-created
`dist` and `node_modules/.vite/vitest` output; removed its empty `.vite` parent.
No disposable temp/spill/coverage output or running task process remains.
No browser/PWA/campaign or P17 reward acceptance is claimed by these store
tests/build.
