# Act IV: capped Bone spell candidate and acquisition audit

The existing source50 has 57 paid ranks, two free skill points and no free skill
reset. An ordinary Tyrael reset costs five of its 15,634 earned wishstones.
Native reset/allocation/export now produces a reusable 59-point fixture:
BoneSpear20, BoneArmor20, BoneWall12, Teeth1, CE1 and five one-point curses.
All 59 allocation calls succeed; exported balance is 15,629, with zero free
skill resets and two free stat resets still available. Only ranks, free points,
combo order and that payment change; XP/level, core, current derived resources,
every item/gear, mercs, quests, ordinal1287 and other save domains stay exact.
This establishes legal acquisition of the candidate, not its combat viability.

Six bounded diagnostic areas reuse the original seed1/8 source/ordinal/enemy
streams and previous corpse-focused area victories. No original fight is replayed.
All attempted waves retain native carry and reward accounting. No farming,
production tuning, authoritative user-save change or level/point invention.

| Frozen candidate | New observations | Result / limitation |
| --- | --- | --- |
| Inherited Dex221/Energy25; Wall > Decrepify > Spear | 12 waves | Both fail wave5 before Diablo. Mana reaches0; no Spear cast in either fatal wave. |
| Free stat reset2→1; Dex25/Energy221; same order | 8 waves | Mana stays≥769, native regeneration42.1/s. Seed1 dies wave3; seed8 draws there. Short-curse upkeep and slow125AS leave5–11 Spears per wave. |
| Free stat reset2→1; Dex100/Energy146; Wall > Spear > Decrepify | 3 waves | Mana stays≥673,29.2/s/200AS. Seed1 draws wave1; seed8 draws wave0. Damage-first priority increases casts without qualifying the area. |

Totals: six areas,23 waves (17 victories,3 defeats,3 draws),19.955 process-wall
seconds for combat. No candidate reaches Diablo; do not infer observed boss
Spear damage or population viability. These candidates also retain inherited
gear and fight levels56–61 with hero50: no matched-level/intended-power claim.

The pure spell rotations excluded CE from pack combat and were exploratory.
That is more restrictive than the current campaign profile, which targets
Teeth/CE/Wall, or the successful retained CE-heavy route. Reject these candidates;
do not add pure-Spear pack clearing as a release requirement or invalidate the
existing corpse-focused Necromancer evidence. Future spell-focused work must
supply an intended pack policy and source/power rationale before more controls.
Return to the required fourteen-build/role and intended-power gaps; do not extend
these six trials or prescribe farming from their failures.

## Verification and retained evidence

Root sole author. The new native paid-preparation driver passes scoped strict
types and lint. Its first type check required guarding an indexed currency;
original source and failed receipt remain. Existing priority/stat drivers are
unchanged and reuse their prior checks. Three readbacks reconcile complete
source/cost/item custody, native allocation/reset, events, resource carry and
reward deltas;24 negative controls reject point/core/gear/order tampering.
The balanced readback initially assumed its pre-order allocation snapshot
already contained the new order. Reader3 restores the exact source order at
that boundary and retains all other equality checks; combat was not replayed.

Twelve process receipts are terminal, ten pass and two corrected setup/reader
failures remain. Two configs archived/removed; four exact task caches absent;
no owned process alive. No broad/earlier-act/unit-suite replay or install.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
`p15-bone-act4-spell-candidate-cohort-v1.json` indexes all six observations;
`p15-bone-act4-spell-build-preparation-v1-readback-v1.json` authenticates the
paid native fixture. Specs, original/new compressed waves and all failures stay.
`p15-bone-spell-cleanup-v1.json` and `p15-bone-spell-artifacts-v1.json` close this
bounded investigation. Root retains the packet for full-v1 consumers and removes
it after their work finishes.

Current-source launcher2 is now runtime exercised through all four native runs:
`bug557-source-audit-v1.json`,2091 inputs, hash
`0eba061fc55b3b948679f9d8005e4320a479486c253ca55b1546f3f3fa77cf58`.
Engine/data unchanged. Historical balance and original two-seed wins stay valid
for their original scope. Catalog66matched/70unmatched/68boss-review/6missing-source,
58ready boss sources and accepted balance0 remain. Full-v1/independent/pacing/
holdout/final integration gates stay open. Browser works; CI excluded; no pending
question/external blocker. Original checkout remains read-only; root retains claim.
