# BUG-192 — Give Maul, Rabies and Fire Claws damaging statuses

Severity: High — three advertised attack statuses cause no periodic damage.
Status: Reproduced; local repair in progress.
Owners: content-designer / engine-dev / frontend-dev; root sole writer.

## Reproduction

Commit `7fa95c7`; Vitest UI/native projection and recorded pure engine, Node.
Synthetic Druid level30, valid full prerequisites, rank1 or20, seed7. Browser,
viewport and locale do not affect this native repro; final presentation checks
must cover en/zh-CN and desktop/mobile.

1. Project each actual Druid attack through playerToCombatUnit.
2. Give exactly its authored mana cost and one scheduled action at1700ms.
3. Hit one held target with zero mitigation/crit/dodge, then integrate full
   Bleed/Poison/Burn duration without further attacks.

Expected under the [local contract](../../docs/plans/decisions/D04-druid-attack-dot-v1.md):
Maul rank1/20 direct82/234 plus Bleed24/69; Rabies51/146 plus Poison10/35;
Fire Claws71/185 plus Burn21/54. No duplicate scaling or extra payment.
Actual: direct hits and payment are correct, but all six total periodic damage
amounts are zero. The six periodic HP assertions fail.

Cause: the three JSON statusEffect.dotPctOfDamage payloads are absent. Existing
adapter and shared periodic runtime consume explicit potency and supply no
implicit fallback. Maul and Fire Claws also have misleading stale prose.
No workaround; using a different skill does not repair these skills.

Evidence: src/stores/druid-attack-dot.causal.test.ts; original causal-red.log/json
under owned scratch /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-druid-attack-dot-4fv2tl_8.
Retain original failures and final evidence before disposal. No genuine campaign
or remote action. Independent design/QA and earned class/build balance open.
