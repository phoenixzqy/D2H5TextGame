# BUG-476 — Caster helper treats the comparison projection as full derived stats

- Severity: P2 (diagnostic equip assertion).
- Status: fixed; comparable-stat and Magic Find regressions pass.
- Trigger: owned caster upgrade includes Magic Find/Gold Find affixes.
- Expected: compare the ten native comparison stats and resistances; native
  equip also legitimately recomputes finding stats omitted from that interface.
- Actual: caster helper copies current full derived stats, updates only fields
  exposed by `CompareResult`, then asserts whole-object equality after equip.
  A legitimate finding-stat change therefore looks like a failed projection.
- Evidence: `CompareResult` ComparableStatKey excludes finding stats;
  `equipment-mods.ts` explicitly accepts and applies magicFind/goldFind.
- Root fix: assert/log the exact comparable field contract, preserve native
  full derivation and test a life + Magic Find upgrade with conservation.
  Do not ignore or strip any owned item payload from the economy audit.

- Verification: `p15-nova-stash-access-green-v1` — 60 focused checks pass;
  `p15-nova-stash-types-v1` and `p15-nova-stash-lint-v1` pass.
  Fresh `p15-maintained-nova-act2-owned-stash-v1` completes its technical
  checks with native export and source/economy/quest/preparation/recovery
  audits intact. It clears Rocky/Dry/Oasis and retains Lost City losses at
  levels21/22/23; this is a preparation fix, not full campaign acceptance.
