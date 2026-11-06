# BUG-649 — Prioritize fully invested Multiple Shot before Bow support

Status: Profile correction and earned Act IV progression verified locally; independent acceptance open.
Severity: High (intended build progression); owner: root / game-designer.

## Correction — 2026-11-03

[Decision and evidence](../../docs/plans/decisions/P15-intended-bow-target-volley-priority-v1.md):
intended Bow alone opts into promotion at its highest declared volley target.
The two genuine RED wrong-order cases pass after correction; all 30 selected
regressions, scoped strict types and explicit four-file lint pass. The early
Magic Arrow bridge, support preparation, native custody and legacy behavior
remain verified. Regression: `tests/campaign/intended-growth.regression.test.ts`
(Bow priority, early boundary, actual investment and opt-out cases). No commit
was made. Production inputs and the genuine native export remain unchanged;
no exhausted allowance is renewed. Closure prefix
`p15-bow-target-volley-policy-v1` in the retained root packet.

## Reproduction

Subsequent [earned evidence](../../docs/plans/evidence/p15-bow-post-priority-and-owned-weapon.md)
clears River908/Chaos909 and claims Hellforge/Terror's End, reaching52/next910.
Act V then reaches52/next914 at an Ancients draw; BUG693 identifies a separate
owned-weapon preparation omission. Historical reproduction and closed costs
below remain preserved; its unattempted-River statements describe that checkpoint.

Working tree based on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.
Native Node campaign; browser/viewport/locale not applicable. Bow's retained
Plains training admission 735, runSeed 1383837708, wave 4, battle seed 1164890233.

1. Use the exact initial parties/resources from the retained native wave.
2. Resolve Decoy > Slow Missiles > Multiple Shot with the original seed.
3. Inspect the 60-second outcome and hero actions.

Expected: once Multiple Shot reaches its declared target rank 20, the intended
Bow signature uses available turns before support, retaining early preparation.
Actual: Decoy casts once in preparation, Slow Missiles nine times, Multiple
Shot 21 times; 43 basic attacks. The healthy draw leaves Izual at 2,027 HP.
Hero life 1,109; final mana 332, minimum 323. This is not mana starvation.
River preparation eventually exhausts its 200-entry allowance; Hellforge and
Diablo remain unattempted. The original costs and attempt limits remain spent.

## Evidence and diagnosis

[Verified checkpoint](../../docs/balance/2026-11-03-bow-act4-checkpoint.md).
Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `p15-bow-volley-order-v1`: the prospectively frozen two-battle comparison
reproduces all control events and both final parties exactly. Its sole order-only
candidate, Multiple Shot > Decoy > Slow Missiles, wins at
57,794.28571428571 ms with hero life 1,109 / mana 322, no living enemies,
23 Multiple Shot casts, nine Slow Missiles casts and one preparation Decoy.
All production/campaign inputs remain identical throughout the comparison.

Affected systems: intended campaign combo preparation and regression. No
production skill/engine defect is established. Slow Missiles intentionally
includes melee opponents. The campaign setup retains support-first priority
after the declared primary-spell investment is complete.

Proposed correction: separate opt-in target-rank volley policy for intended Bow
only. Retain Magic Arrow before volley is learned and declared order below its
maximum declared target rank. At full actual investment, promote volley while
preserving support order. Preserve the legacy policy and non-opted profiles.
Require native-growth, paid-cast/damage/mana, state-custody and opt-out checks.

No second candidate, seed search, route replay or renewed training allowance.
One diagnostic win establishes no earned River clear or population/pacing
acceptance. The genuine saved successor remains level 51 / next 908, export
SHA256 `428a898a68b214fbb3dfea33acf825a284945fde2df78c8163ca603b98e425d7`.

Security check: pass; local deterministic diagnostic/profile scope, no new
dependency, credential, network, CI, permission or save-format change.
Plan review: ready for the bounded correction and affected checks; formal
balance and full private-v1 acceptance remain open. No commit made.
