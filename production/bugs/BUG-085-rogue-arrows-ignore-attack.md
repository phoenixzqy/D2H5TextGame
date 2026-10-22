# BUG-085 — Make Rogue arrows consume equipment Attack

Status: open. Severity: High. Owners: engine-dev/content-designer; QA verification.

Reproduction: ade07f3; Node/Vitest production combat, no browser/viewport;
locale independent (en/zh-CN), seed0.

1. Create the canonical Inner Sight Rogue; give2730XP, producing L6 Attack25.
2. Use only Basic Arrow, zero target defense/dodge/resistance and no attacker crit.
3. Record the first hit, then repeat with canonical short sword rolled Attack7.

Expected under approved P13c02: equipped snapshot Attack25→32 contributes once;
seed0 authored minimum Basic damage41→48. Pierce minimum51→58.
Actual: named Basic remains15 in both runs, although fallback attack25→32 and
the equipment-composed snapshot are correct. Registry ranges also disagree with
the authored Basic16–26 and Pierce26–42/CD3 definitions.

Cause: buildDamageInput only reads effect base/perRank and the registry uses
placeholder merc arrows. This behavior was deliberately preserved by P13c01;
the new approved decision explicitly supersedes that narrow old policy.

Evidence: src/stores/merc-equipment-combat.test.ts existing named-arrow test;
retained Cold Plains W3 diagnostic at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-rogue-attack-mfx9_n49/baseline-measure.json`.
The preselected1000-seed screen has458wins/542draws; exact earned route draw.
This bug is a missing equipment response, not proof of the draw's sole cause.

No ordinary skill-order workaround made the exact Cold Plains route succeed.
See docs/plans/decisions/P13c02-rogue-arrow-attack-v1.md for scope and validation.
