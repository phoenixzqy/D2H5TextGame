# Holy Bolt Act V: owned points and casting cadence

Status: bounded native stat-reset adaptation qualified; independent acceptance open.
One available free stat reset and the historical balanced allocation turn both
frozen full-area failures into victories. Production code/data and the
authoritative campaign save remain unchanged. No new gear, skill ranks,
material use, currency spending or farming.

## Retained source and free controls

Source `p15-holy-bolt-act5-crystalline-continuation-v1.json` is actual50/
XP278591/normal1196. It has HolyBolt20/Hammer20/Conviction18, no free points,
three stat resets and two skill resets. Selected Conviction is already eligible
and active:25 percentage points of enemy resistance reduction and18% Arcane
damage bonus. There is no missing-aura fix to make.

Original core STR25/DEX80/VIT123/ENE102 projects AS200,846HP/589MP and104 flat MR.
The900ms action period and Hammer-first policy produce22Hammer/22Bolt/22basic
actions in each retained60s terminal wave. Baseline seed1 reaches Baal and
leaves22102HP; seed8 draws at Ancient prefixwave5, leaving2129HP on an Ancient.
Neither failure is a mana-only problem.

Two zero-spend controls at the same seeds retain all ranks/gear/points/mercs:

| Policy | Seed1 | Seed8 |
| --- | --- | --- |
| Bolt before Hammer throughout |Baal60s draw,10988HP remaining |wave5 draw,304Ancient +1356minion HP |
| Hammer groups; Bolt before Hammer for Ancientwave5/Baalwave7 |Baal60s draw,12083HP remaining |same wave5 draw,304+1356HP |

The phased policy changes the native store order before settling recorded
waves4/5/6, selecting Bolt/Hammer/Bolt for next waves5/6/7. It never rewrites
recorded units. Waves0–4 have exact baseline combat/carry/reward semantics,
apart from newly allocated reward item IDs. Bolt-first improves recurring Bolt
casts from2700ms to1800ms, but all four controls still fail. Minimum mana564.
Four full areas/28waves take10.186wall seconds; no rerun is needed.

Pure source-owned gear projection considers44items, all eligible, and47single
placements including both ring slots. Angelic1/4, Tancred1/5 and Vidala2/4 are
partial sets; no complete eligible set is owned. Projections enforce unique
item identity, native slot compatibility and two-handed displacement. They are
comparisons, not an optimal-loadout or measured-combat claim.

## One native available reset

The [historical earned completion](../plans/evidence/p15-holy-bolt-caster-earned-act5-complete.md)
already records a successful2Dex/1Vit/2Energy allocation and a mana-starved
3Dex/2Vit prospect. Reuse that owned allocation rather than replaying either
campaign or the known failed prospect.

Native Malah stat-reset quote refunds245points at zero currency cost, reducing
stat allowance3→2 while preserving skill allowance2. Native allocation spends
98Dex/49Vit/98Energy, resulting in STR25/DEX118/VIT74/ENE113 and zero free points.
Gear, skills, Conviction and mercenary ownership remain unchanged.

The resulting AS238/748HP/605MP trades98maximum life for a596ms turn period.
Keep the fixed phased priority above. Both complete eight-wave areas win:

| Seed | Ancientwave5 | Baalwave7 | Final hero | Boss minimum MP |
| --- | ---: | ---: | --- | ---: |
|1|38.740s|45.296s|748HP/605MP|579|
|8|41.720s|42.912s|748HP/605MP|579|

Native recurring Bolt intervals are1192ms;38and36casts replace the free-order
controls'33casts over60s. Hammer recurs2384ms. The two successful boss times
have sample median44.104s. This is measured conditional evidence, not a
population estimate. Two areas/16waves take7.735wall seconds.

## Verification and next work

`p15-holy-bolt-act5-adaptation-readback-v1.json` passes all six trials/44waves:
source pins, native reset/refund/allocation/allowance, canonical payload custody,
unchanged materials/currency/mercs, selected aura, phase-specific order, actual
events/outcomes/rewards/streams and life/mana/cooldown carry. Mutated prefix time
and extra point controls are rejected. Diagnostic income/state is discarded.

Scoped strict TypeScript and focused no-any/unused lint pass on the final
driver. An initial projection signature type error and its receipts remain
retained; no combat was executed with that version. Production2091 inputs stay
unchanged, so reuse210BUG552/112BUG553 checks. No broad suite, earlier-act replay,
install, agent, commit or publication.

Author readback is not independent QA. The source already owns Throne credit;
original quest-wave carry, acquisition/points/intended-power history and
population/within-three/holdout acceptance remain open. No more HolyBoltV trials
or automatic larger seed batch follows from this resolved diagnostic.

Next inspect retained FireSorceressIV Diablo draws: actual learned Meteor/
FireBall cadence, damage/status potency and eligible owned preparation before
farming or tuning. Historical14routes, recipe61/75/68/6,68/70decoded and accepted
balance0 remain unchanged. Full213skills/builds/210roles/22areas, holdouts,
economy/fairness/30–50active-hour pacing and all final integration/review/owner
gates remain open. Browser works; CI excluded; no pending answer/external blocker.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Decision `p15-holy-bolt-act5-adaptation-decision-v1.json`; closure
`p15-holy-bolt-act5-adaptation-artifacts-v1.json`. Root retains the live human2
claim and required packet until umbrella evidence consumers finish.
