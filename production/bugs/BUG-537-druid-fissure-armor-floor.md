# BUG-537 — Give Fissure a viable campaign damage curve

Status: local Act II correction verified; broader balance acceptance open. Severity: High.
Owner: root, content/game balance; independent acceptance remains open.

Reproduction: dirty feat/playable-foundations, HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce; Druid data SHA256
60ed56da066cb2d58c3070395b9650d946c1474362ac0bea9065a99a97970f2e. Node24.21.0 production engine/store transport under WSL;
no browser viewport/locale dependency, both locales read authored damage.

1. Restore retained p15-druid-fire-act2-dry-continuation-v1.json from
   /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1.
2. Inspect native Far Oasis112, seed 1703991377, final wave4: level13,
   Fissure9, hero176HP, merc already dead; actual Radament22/5637HP/242armor/
   50%fire resistance. Earlier Dry clears and Cube recovery remain earned.
3. Run p15-druid-fire-radament-screen-v1.ts through the existing focus launcher:
   same entry teams, Fissure-first policy and fixed tuning seeds1–16.

Expected: the advertised fire build must have a viable primary damage curve;
P15 may tune provisional numbers rather than substitute a physical identity.
Actual: native defeat46.4s, boss5585HP remains. All16 fixed tuning inputs fail:11deaths/5draws.
Fissure9 is100–130 before mitigation. Even cap20 is155–185; with current
2x crit,50%fire resistance and242armor, every direct cap hit still floors to1.
Elemental Mastery unlocks30 and cannot bridge ordinary on-level Radament22.
Weapon Attack does not scale the fixed spell. This is a demonstrated curve
problem for these inputs, not proof every possible party/gear combination fails.

Evidence: exact native source, raw journal, passing independent initial/dry
readback-v3 and p15-druid-fire-radament-before-v1.json in the retained packet.
Plan: docs/plans/decisions/P15-druid-fissure-growth-v1.md. Final early/later acts,
other skills, all-build/holdout/economy/pacing acceptance remain open.

Local result: growth180 changes the identical16 weak boss inputs from0wins/
11deaths/5draws to11wins/5deaths/0draws (victorious p50=39.137s/p95=59.86s).
A complete earned Far113 qualification then reproduces native5/5 and Radament
48.18s; later native Tomb117 defeats actual Duriel43.8s and unlocks Act III.
The armor-floor regression passes, plus all453 affected cases across retained
checks and scoped strict types/lint. See the Act II evidence. No new commit;
early-rank/other skills/later-act/all-build/holdout/pacing acceptance remains open.
