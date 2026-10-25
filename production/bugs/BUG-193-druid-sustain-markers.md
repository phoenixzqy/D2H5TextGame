# BUG-193 — Apply the advertised Druid recovery and speed effects

Severity: High — Hunger's life stealing and Feral Rage's life/speed effects
have no combat consumer. These are advertised active-skill behaviors.
Status: Locally fixed and verified; independent design/QA and earned balance open.
Owners: engine-dev / content-designer / frontend-dev; root sole writer.

## Reproduction

Commit `d9f2e6a`, Linux, Node v24.21.0, production native player projection and
the actual registered skills through `vite-node`. Seed7. No browser/viewport is
involved in this engine reproduction. Both en and zh-CN skill descriptions
promise life effects; English Hunger explicitly says it steals life.

1. Create a synthetic level30 Druid with exact class, Werewolf prerequisite,
   Feral Rage prerequisite for Hunger, and rank1 or20 of the tested attack.
2. Project through `playerToCombatUnit`. Set wounded life5000/max10000,
   attackSpeed100, no crit, no mana regeneration, and exactly3/11MP for
   Feral Rage/Hunger. Give a held living enemy10000HP and zero mitigation.
3. Allow one actual scheduled hit at1700ms, then hold the caster. Read actual
   HP, mana, damage and heal events from `runBattleRecorded`.
4. Separately allow Feral Rage's next action and compare the action gap with
   the unchanged1700ms baseline.

Expected: Hunger restores positive HP to the wounded surviving caster from
its landed hit. Feral Rage's advertised life/speed effects change the caster;
its next action should occur sooner after a successful hit. Exact recovery,
stack and duration rules require a controlling contract before implementation;
the vague Feral Rage life wording must be reconciled explicitly.

Actual: all four life checks end at5000HP, with zero heal events. The clean
rank1/20 hits are46/122 for Feral Rage and61/156 for Hunger. All four attacks
pay their exact3/11MP and leave0MP. Both Feral Rage timing checks act at1700ms
then3400ms: no speed increase. The six independent expectations fail while
the legal priority, actual single-hit, damage and payment controls pass.

## Cause and scope

`src/engine/skills/dataCatalog.ts` registers ordinary physical damage plus
`feral-rage` or `hunger` on the enemy. Neither marker has a life-recovery or
caster-speed consumer. There is no authored recovery/speed tuning payload.
Feral Rage also declares secondary Bleed, but the generic adapter drops that
unsupported secondary status. This last source finding needs explicit causal
coverage in the repair; it is not one of the six reported expectations.

This reproduction uses disclosed synthetic stats/holds and does not establish
earned viability or balance. Feral Rage's life wording is ambiguous between
recovery and capacity; the observed absence of speed and Hunger recovery is
unambiguous. Do not invent an implicit global drain or change unrelated attacks.
No workaround repairs these effects. No genuine campaign or remote action.

Evidence: [reproduction packet](../../docs/plans/evidence/d04-druid-sustain-repro.md)
and [manifest](../../docs/plans/evidence/fixtures/druid-sustain-repro/manifest.json).
The original source, native results, failed command log/receipt and audit are
retained. Independent design/QA and all-class earned balance remain open;
neither skill gained functional credit from the reproduction alone.


## Local repair and validation

Runtime `7b7f3b2`, presentation `801d97f`, and the
[controlling contract](../../docs/plans/decisions/D04-druid-sustain-v1.md)
add explicit provisional10%/50% actual-hit-HP recovery, authenticated Feral5%
speed stacks (cap5/8s) and10% final-hit/s primary Bleed. Reflection/death settlement
precedes recovery; no resurrection, periodic/basic drain, mana recovery or new
RNG. Native authority/rebase and existing ordinary current-configuration replay
are preserved, with no Save22 change. Both forms and human attacks remain legal.
The initial replay assumption and a real introduced cadence rounding defect were
corrected without changing controlling replay semantics or global cadence.

[Repair evidence](../../docs/plans/evidence/d04-druid-sustain.md): original six
RED cases now GREEN;114 new tests, final full13519/591/two existing skips,
engine7027/246, types/lint/clean explicit-false build/bridge pass. Production4/4,
eight positive hero-recovery attacks, eight exact five-domain Continue pairs,
20geometry samples,16 screenshots/eight inspected. Source/build/Git/genuine
freeze and actual1316 committed source blobs verified. All original failures and
synthetic fixture corrections are retained. Exactly these two skills now have
bounded functional credit; independent acceptance, earned builds/balance,
mobile occlusion, performance and full privatev1 remain open. GenuineL33/next402
is unchanged and Baal remains uncleared. No campaign or remote action.
