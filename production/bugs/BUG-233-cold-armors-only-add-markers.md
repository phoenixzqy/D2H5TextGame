# BUG-233 — Make Shiver Armor and Chilling Armor protect and retaliate

Severity: High. Status: locally repaired and verified; independent acceptance open.
Owner: root, engine/content/frontend. Independent design/QA acceptance open.

## Reproduction

Source `15df74f1b0b0918b74be774527eb821e2bcf6de2`; Node/Vitest native
player projection and production registry. Seed7. Browser/viewport/locale
not applicable to this engine reproduction; promises exist in en and zh-CN.

1. Project a synthetic L30 Sorceress with legal Frozen/Shiver prerequisites,
   either armor at rank1,100MP,20Defense and zero dodge.
2. Cast the selected armor at900ms; receive a100Physical hit at1700ms.
3. Inspect HP, damage events and attacker statuses.

Expected: paid authored Defense reduces the hit to79, with a real Cold
counterattack attempt. Seed7's independent counter roll misses, so it must not
Freeze; the predeclared seed19 control lands and must apply canonical Freeze.
Actual: hit remains80, exactly as without armor; neither damage nor Freeze
is emitted. Only the marker and mana debit occur.

Evidence: `src/stores/cold-armors.causal.test.ts`; initial defense RED captured
at its former engine path in `red.log`, and complete soft-assert reproduction
in `native-red.log` in the retained cold-armors evidence packet.

Root cause: the JSON adapter produces generic marker-only buffs; no paid
potency, damage projection or retaliation consumer exists. Neither skill
authors retaliation damage. Defense-only implementation or description
narrowing would leave the promised identity missing.

Workaround: none for these armor effects. No genuine campaign actions.

Repair: paid JSON-derived armor projection and ordinary guarded Cold counterattacks.
125 new tests; full 16060 passed/725 files/two existing skips, engine8053/301,
types/lint/build/precache and final eight production-browser cases pass.
See [bounded evidence](../../docs/plans/evidence/d05-cold-armors.md).
Source commits: engine `484f9433`, presentation/final `93e39b22`.
