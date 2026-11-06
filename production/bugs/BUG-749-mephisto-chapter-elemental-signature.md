# BUG-749 — Restore Mephisto's chapter elemental signature

Status: Fixed locally, 2026-11-05. Severity: Medium. Found 2026-11-05.
Affected systems: Act III encounter content, monster cooldown authoring, combat.
Owner: root, solo continuation of private-v1 implementation.

## Reproduction

Baseline: `feat/playable-foundations`, inherited working tree; exact HEAD and
source snapshots in the packet below. Pure native engine reproduction; browser,
viewport and locale are not involved (same encounter in zh-CN/en). Seed13.

1. Load bundled validated data and resolve the manual or idle challenge for
   `areas/act3-durance-of-hate`, ordinal450.
2. Build the actual chapter wave through `buildEnemiesForWave`.
3. Record combat against durable synthetic hero/merc/summon targets.

Expected: Mephisto uses Frost Nova, Lightning and Poison Cloud, as specified by
`docs/design/monster-spec.md` §6 and its existing archetype skill list.
Actual: chapter override contains only `monster-lightning`; cold/poison never
enter its runtime order. The factory correctly replaces the archetype list.

Restoring only the list also requires checking priority starvation: AS120 gives
1540ms actions; Frost Nova CD3 becomes ready after two actions (3080ms), so the
first two skills can monopolize every action and prevent Poison Cloud.

Workaround: none through player controls. Do not change global AI priority or
shared spell payloads to hide the encounter-authoring defect.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-mephisto-signature-zepx0gpm`.
Regression: `src/stores/combatHelpers.mephisto-signature.test.ts`.
Decision: `docs/plans/decisions/P15-mephisto-elemental-signature-v1.md`.

## Resolution

Restored the three-skill chapter order and authored a Mephisto-only 4s Frost
Nova cooldown. Both genuine regressions were observed: the missing skills, then
Poison Cloud starvation after list restoration. Native manual/idle combat now
casts cold/lightning/poison at1540/3080/4620ms and repeats at6160/7700/9240ms.
Encounter stats/rewards and shared spell payloads stay exact. Eight focused and
19 existing directly affected cases pass; scoped strict types and seven-file
lint pass. Initial test typing/check-setup failures remain in the packet.

[Closeout evidence](../../docs/plans/evidence/p15-mephisto-elemental-signature.md)
records source review and custody. Poison immunity/three-stack design contracts,
earned encounter balance and full-v1 acceptance remain open. No campaign rerun
or exhausted retry-budget renewal was used for this correction.
