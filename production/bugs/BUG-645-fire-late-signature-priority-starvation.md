# BUG-645 — Let the invested Fire Ball signature cast between Meteors

Status: Resolved locally; profile correction and earned Acts IV–V continuation verified. Independent acceptance remains open.
Severity: High (intended build progression); owner: root / game-designer.

## Earned continuation — 2026-11-04

[Completion evidence](../../docs/plans/evidence/p15-fire-act4-and-act5-completion.md):
the actual level52/next914 successor clears the two remaining Act IV areas and
all five Act V main-route areas, winning all46 waves without training or retry.
Exact native save/reward/quest accounting passes through level53/next921,
including Baal's title and Nightmare unlock. Original failures, costs and the
exhausted River allowance remain spent. Intended Normal completions now4/14;
formal balance0/210 and wider acceptance remain open. No new source change.

## Correction — 2026-11-03

[Decision and evidence](../../docs/plans/decisions/P15-intended-fire-late-signature-order-v1.md):
the exact original control reproduces the retained draw, and the sole frozen
order candidate wins in 19.087 seconds with hero 1,115 HP / 663 mana. The
intended Fire profile now promotes learned Meteor and Fire Ball before periodic
support. Early rotation and profiles without the policy remain unchanged.
Two native-growth RED cases reproduce the wrong order before correction;
all 13 affected Fire cases, scoped strict types and explicit four-file lint pass.
No production skill/engine change, route replay or preparation renewal occurs.
The saved level52/next914 successor and exhausted River budget remain intact.

## Reproduction

Working tree based on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, production
hash `b7783834bf865c8521c1d95a19b9d31d7f5bdb665dc4eff96765c10b90981eb9`.
Native Node campaign; browser/viewport/locale not applicable. From verified
Fire Act III level 47 / next 685, continue the unchanged Act IV controller.
At level 51, training Plains of Despair ordinal 746, runSeed 357924951,
wave index 4, resolve the native 60-second battle. Wave seed is runSeed XOR
`5 * 0x9e3779b1`, converted to uint32. The retained native run reproduces it.

Expected: invested Meteor / Fire Ball attacks supply the later Fire rotation,
with lower-rank periodic spells as support rather than monopolizing all turns.
Actual: draw with Izual at 1,595 HP; hero 1,115 HP / 663 mana and Prayer alive.
Meteor 20 casts 12 times, Fire Wall 6 casts 13, Blaze 1 casts 13; Fire Ball 20
never casts. There is no mana starvation. One draw sends the default training
controller to Dark Wood for 167 admissions, exhausting River's 200-admission
preparation budget at level 52. Hellforge and Diablo remain unattempted.

## Evidence and diagnosis

[Verified checkpoint](../../docs/balance/2026-11-03-fire-act4-checkpoint.md).
Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `p15-fire-earned-act4-v1`: original report/journal/native export and
passing frozen V1 accounting. All failures and preparation costs remain spent.

`tests/campaign/intended-growth-v1.json` declares Meteor > Fire Wall > Blaze >
Fire Ball. The engine selects the first eligible skill; recurring support casts
consume the turns between Meteors. No production skill/selection defect is
established. Affected systems: intended campaign combo policy and regression.

Frozen candidate: once both Meteor and Fire Ball are learned, promote that signature
pair before the remaining declared skills, retaining the early rotation.
Compare exactly one control and one candidate on this retained failed input,
changing only hero order. Require complete exact control reproduction and
living-hero candidate victory before adoption. No second candidate, seed search,
earned route replay or renewal of the exhausted preparation allowance.
