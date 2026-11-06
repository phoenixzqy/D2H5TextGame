# Zeal Paladin Act IV: owned equipment comparison

Status: comparison complete; survival remains unresolved. No new combat,
production code/data change, authoritative save write or balance acceptance.

Reuse the exact level28 /XP395269 /ordinal317 source and retained seeds1/8
from `p15-double-throw-act4-next-zeal-v1.json`. Both original attempts die in
mega-demon wave5 before Diablo. Earlier Arcane attacks cause substantial
attrition; the fielded Prayer mercenary is absent from wave4 onward. Mana
remains sufficient. Holy Freeze is already selected at rank1; do not treat
an aura as missing or infer a mana shortage.

`p15-zeal-act4-owned-projection-v1.json` compares native complete hero and
fielded Prayer equipment projections over96 unused owned items. Native slot,
requirements, hero hand restrictions, sockets, uniques and owned set bonuses
apply. No complete eligible set is owned. Hero selections are reserved before
the mercenary comparison. Both swords, core, ranks, priority and Holy Freeze
selection remain fixed. Every store is restored after the in-memory comparison.

The descriptive score includes Physical/Fire and earlier Arcane probes. Guards
preserve the baseline Arcane150/300 probes, Poison/Fire resistance, at least80%
of mana capacity and95% hero/80% mercenary weapon-rate proxy. These probes are
comparisons, not combat forecasts or acceptance criteria.

| Actor and proposed swaps | Benefit | Tradeoff |
| --- | --- | --- |
| Hero: head `it-70hek-4h6`, gloves `it-10dll-94g` | Arcane resistance0→15; physical dodge19.4→22.4%; magic dodge5→8%; weapon-rate proxy unchanged | HP574→564; armor333→323; flat magic reduction24→12; Physical623 probe53→63, critical935 probe246→256 |
| Prayer: chest `it-3yjrq-2t4` | Physical resistance50→57; Fire34→48; critical935 probe178→142 | HP558→538; armor289→260; weapon-rate proxy0.985 |

The hero's Arcane probes improve126/276→115/243, but its Physical and
Lightning probes worsen. The aggregate score improves only modestly. Do not
call either projection a recovery or prescribe new farming from these results.
Next choose a small frozen native control that addresses prefix attrition and
mercenary survival, considering already-learned aura choices before spending
points or materials. No resolved Double Throw control or earlier act was replayed.

Scoped strict TypeScript and lint checks pass for the new driver. The launcher
authenticates2091 unchanged production inputs before the comparison and verifies
the output manifests afterward. Three owned process receipts are terminal;
the one Vite cache is removed. Two temporary configs are archived and removed.
Ready catalog inputs remain58; accepted balance cells remain0. Full v1 stays
active, with no pending answer or external blocker; browser works and CI is
excluded. Required evidence remains in the existing packet with root for
umbrella acceptance and eventual cleanup:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Closure: `p15-zeal-act4-owned-comparison-artifacts-v1.json`.

Follow-through: the [free Cleansing-only control](2026-11-01-zeal-act4-cleansing-recovery.md)
clears both retained full areas without equipping these proposed swaps. Diablo
23.596/22.116s, final hero428/422HP; Prayer survives both. The comparison above
remains descriptive. No new gear, reset, material payment or farming is needed
for this bounded recovery; full balance acceptance remains open.
