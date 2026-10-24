# BUG-170 — Apply Polearm, Spear and Throwing Mastery

Severity: High. Status: fixed locally; independent acceptance pending.
Owner: engine-dev / frontend-dev / content-designer.
Affected: fresh player composition, direct damage/crit/cadence, bilingual details.
Build: `44477e9` plus uncommitted BUG169 availability. Node/Vitest;
Chromium target en/zh-CN,360×640 and1280×800. Seeds1–32, fixed constructed units.

## Reproduction

1. Equip a real canonical polearm, spear or throwing base in the weapon slot.
2. Allocate the corresponding mastery rank1 or20, then project/run real combat.
3. Compare direct hits, critical outcomes, Throwing cadence and skill details.

Expected: matching Polearm/Spear grant authored3%physical/+0.5ppcrit per rank;
Throwing grants2.5%physical/+1%attack speed per rank. Other masteries never stack;
unlock6/cap20, exact aliases, next-wave lifecycle and truthful bilingual details.
Actual: all three have no composition consumer, no weapon requirement metadata;
English/Chinese copy promises unsupported attack rating.

Evidence: `src/stores/barbarian-remaining-masteries.test.ts`,
`red-composition-corrected.log` (10RED/1identity control). Initial fixture used
wrong runBattle/event APIs; corrected before credited run, original retained.
Root cause: consumer covers only Sword/Axe/Mace while these authored passive
rows are treated as inert buff metadata. Workaround: other skills remain usable;
allocated mastery points have no effect.
Contract: `docs/plans/decisions/D05-remaining-weapon-masteries-v1.md`.
Raw evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-remaining-masteries-i5r4g6lk`.

Final validation:11849PASS/469files+2existing skips; engine5840PASS,
types/standard lint/build pass, production browser4/4. Raw logs and diagnostic
inputs retained in [versioned evidence](../../docs/plans/evidence/d05-remaining-weapon-masteries.md);
the historical temporary root is removed after archive-byte verification.
