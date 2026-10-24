# BUG-152 — Cover campaign and Nightmare equipment contexts

Severity: High. Status: Fixed in `6203a9b`; independent acceptance pending.
Owner: root/content/engine QA. Runtime50094ce, production sourceseca8549.
Environment: Node24.21.0/Vite SSR using actual production planner/loaders; no
browser interaction in this reproduction, viewport/locale not applicable.
Seed3286157777; all29 authored areas, manual/idle, Normal/Nightmare;
sampled ordinals0,1,12,263,360359.

1. Resolve each actual area with `resolveChallengeWavePlan`, then apply the
   actual `applyReplayProfileToPlan` for each supported profile.
2. For each spawn, select `wave.lootTable ?? plan.defaultLootTable`.
3. Filter positive equipment picks by their actual inclusive qlvl bounds and
   the actual spawn level, as `rollKillRewards`/`rollDrops` do.

Expected: each reachable equipment-bearing campaign/replay context has legal
equipment available. Random noDrop and rarity rolls remain random.
Actual:109 distinct TC/level contexts per profile;17 empty Normal pools and106
empty Nightmare pools. Examples: Catacombs ordinary16–18, Durance ordinary46
and boss47, ActIV ordinary56–61 and boss61, Throne ordinary77–82 and boss82.
Nightmare adds20levels while retaining the same table IDs; most tables' finite
equipment ceilings were authored only for earlier Normal levels.

This is a planner eligibility reproduction, not proof of an earned victory,
an exhaustive seed/ordinal census, unique/set materialization, or loot balance.
BUG151 fixed one observed ActII band; its scope explicitly left this audit open.

Evidence: `loot-context-audit.mjs` and `loot-context-audit.json` under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop`.
Root retains them through campaign/full-v1 consumers, then removes them.
Affected sources: `src/data/loot/treasure-classes.json`,
`src/engine/combat/sub-area-run.ts`, `src/engine/map/replay-profile.ts`,
`src/engine/loot/drop-roller.ts`. No historical save/reward backfill is allowed.

Security check: pass. Local first-party data and regression tests; no new
executable inputs, dependencies, credentials, networking, CI, permissions or
publication. Continue under existing session authority, root sole writer.

Resolution:93 highest-band maximum fields in15 live tables now cover the
finite Normal/Nightmare levels from the reviewed D08 contract. All other
authored fields are unchanged. The original sampled17/106 empty contexts
become0/0. All32 new causal tests first fail, then pass; full11472/438 with
2existing skips, engine5638/172, typecheck/lint/build/bridge scan pass.
Two existing Baal fixed-seed totals are reconciled against captured real
TC drops, retaining exact independent40/48wishstones, original boss anchors,
positive equipment and once-only authority. No prior outcome is backfilled.

Regression: `src/engine/loot/campaign-level-eligibility.test.ts`, existing
ActII/ActI boss/replay-profile tests. Details and retained failures:
[evidence](../../docs/plans/evidence/d08-campaign-replay-equipment.md).
Separate BUG153 affix quality and full G4/economy/balance remain open.
