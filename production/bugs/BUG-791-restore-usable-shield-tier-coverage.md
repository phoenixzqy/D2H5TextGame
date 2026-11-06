# BUG791 — Restore usable shield tier coverage

- Status: Implemented locally; static checks pass; owner gameplay validation deferred.
- Severity: Medium; retained gear and earlier sources provide a workaround.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited local changes, 2026-11-05.
- Environment: native TS loot under WSL; viewport/locale not applicable to JSON eligibility. Existing bases support both locales.
- Seed: deterministic eligibility; native materialization uses fixed declared RNG fixtures, without seed search.
- Owners: content-designer / engine-dev / qa-engineer; root handles this increment solo.

## Reproduction

1. Load `loot/trash-act3`, filter positive inclusive eligible shield rows at enemy41–49.
2. Resolve Aegis/Dragon/Monarch requirements from the existing base catalog.
3. Inspect all references to Dragon Shield and the other ordinary shield-bearing tables.

Expected: current usable shield tiers have ordinary sources within existing finite
shield-bearing equipment-source envelopes, including Dragon35–49.

Actual: Aegis ends at40; Monarch starts at38 but requires50. Dragon's sole source
is a forced unique goblin pick, not an ordinary base for normal socket/runeword
choices. The frozen policy records 29 missing bands across14tables, including
missing Kite/Aegis/Monarch/Sacred Targe tiers elsewhere. Earlier tiers still exist.

Root cause: incomplete authored base references and bands; equip requirements,
socket capacities, combat and RNG are not the cause. Fill missing rows rather
than changing the requirements or synthesizing equipment during equip/crafting.

## Plan and retained evidence

[Decision](../../docs/plans/decisions/P15-ordinary-shield-tiers-v1.md).
Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-shield-progression-sbyup5r_`.
Root retains preimages, exact delta and verification through full-v1 acceptance,
then removes it after all consumers finish. No acquisition/balance/pacing credit
or renewed campaign/pilot/retry budget follows from constructed checks.

## Resolution

29 appended rows restore the missing ordinary tiers. [Evidence](../../docs/plans/evidence/p15-shield-progression.md) records exact preservation and verification limits. No further gameplay tests will run at owner direction.
