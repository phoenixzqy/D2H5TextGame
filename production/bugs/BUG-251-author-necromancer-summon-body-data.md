# BUG-251 — Author remaining Necromancer summon bodies in validated JSON

- Status: confirmed source/data compliance defect; implementation pending.
- Severity: Medium — runtime works, but base-stat tuning bypasses the required JSON/schema boundary.
- Owner: root engine/content; independent review and QA remain open.
- Build: `462cf874`; Node 24.21.0, Linux; source/runtime independent of browser, viewport and locale.
- Seed: not applicable to definition lookup; existing seeded preparation/combat regressions remain controls.

## Reproduction

1. Read `src/engine/skills/summons.ts:baseStatsForSummon` at the build above.
2. Resolve `skeleton`, `clay_golem`, `skeletal_mage`, `iron_golem` and `revived` through `getSummonStats` or `buildSummon`.
3. Trace their Life, Attack, Defense, speed, dodge and resistance values: these are TypeScript literals and inherited TypeScript defaults, unlike the existing Fire/Blood/Druid JSON-owned bodies.

Expected: complete base tuning for these five templates is JSON-owned, validated on load, immutable internally, and copied into fresh runtime bodies and previews. Shared magical mitigation and authored skill-rank growth retain their existing owners.

Actual: changing these bodies requires editing engine logic; malformed/missing authored body data cannot fail validation because no such authored data exists.

Evidence: the five literal branches and `baseSummonStats`/`skeletonStats` in the source above; [migration contract](../../docs/plans/decisions/D06-necromancer-body-data-v1.md). Preserve complete literal pre-migration stat oracles and original failing definition test in the evidence packet before source edits.

## Boundaries and workaround

Existing runtime stats are the compatibility oracle, not new balance choices. Preserve startup costs/caps, Mage elemental identity, Iron selected-item transactions, Masteries, resources, RNG, saves, names and unrelated templates. Editing TypeScript is the current workaround. This migration alone grants no skill, earned-balance or full-v1 acceptance.
