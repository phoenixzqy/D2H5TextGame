# BUG-608 — Bone/corpse earned preparation loses within the lower-level margin

Status: open recovery/population finding; earned Bone Act II completion and Act III unlock independently verified. No production tuning applied.
Severity: Medium. Found:2026-11-02. Owner:root (intended progression/balance).
Environment: WSL/Linux native engine, production authority77/2142 inputs,
campaign p15-act2-safe-training-campaign-manifest-v1. No browser dependency.

## Reproduction

1. Restore authenticated p15-intended-lost-city-successor-v1 at22, ordinal262.
2. Use the existing Bone/corpse intended profile, earned skills/stats, Prayer,
   owned gear and native allocation/equipment/capacity/combo boundaries.
3. Use the corrected shared lower-level selector to earn Arcane target28.
4. First Dry Hills challenge262 clears. Challenge263(seed240569251) wins waves1–3,
   then loses wave4 after9720ms. Stop first nonwin; no retry or terminal extension.

Expected evaluation outcome: a sustainable earned preparation path is needed
before intended-population and pacing acceptance. A two-level margin by itself
does not promise victory; this single comparison establishes a concrete failure,
not a population failure rate or permission to nerf an enemy.

Actual: challenge max20 is within hero22 minus2, yet Prayer dies in wave3 and
hero enters wave4 at77Life/302Mana, alone. Fourteen level19 Scarabs/Claw Vipers
remain when hero dies at9720ms. Minimum observed Mana302; no recovery starvation.

## Diagnosis and evidence

Challenge263 wave3 takes23742.41164241164ms. Hero falls552→77Life; Prayer417→0.
Hero receives440lightning,114cold and10physical direct damage (plus native
healing/shields/carry). Hero lightning resistance53, cold83; Prayer lightning37,
cold60. Wave4 poison accounts for22periodic damage; its low entry Life follows
the previous wave's caster damage. Do not diagnose this only as poison resistance.

Hero has CE8,Teeth11,Armor1,Wall1,Weaken1 and learned prerequisites; all points
spent. Wave3 casts CE7,Wall2,Teeth1,Weaken1. The earned22character uses2Vitality/
3Energy per level. These observations identify damage/recovery/allocation and
owned-defense tradeoffs to examine; they do not prove a specific mechanic bug.

Packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1.
Report/journal/export: p15-intended-arcane-prepared-v2.*.
Independent readback: p15-intended-arcane-prepared-v2-readback-v1.json (passes,
no combat replay). Two admissions/nine waves/eight wins/one defeat,16810XP,
60acquired/45salvaged items,117786.32916818483combat ms; terminal22/next264.
No Arcane entry or new quest action. All ancestor/comparison failures and costs
retained. This terminal first-nonwin branch must not be extended.

## Defensive-priority result (2026-11-02)

The shared intended profile now selects a learned defensive curse before CE.
Eleven affected assertions/types/lint pass. A bounded earned comparison from the
same source improves eight wins to17: four admissions/18waves/one defeat,
39360XP,143acquired/133salvaged items; terminal22/nextNormal266. Independent
native export/custody/economy/points/clock/seed/party/merc-XP readback passes.
No Arcane entry or new quest action; the terminal branch must not be extended.

The new failure is ordinal265/wave3. Hero starts549Life/322Mana; Prayer456/174.
Prayer dies5600ms, hero14100ms. Hero receives408lightning/134cold/25physical
actual direct damage plus11periodic damage and25healing. Weaken repeatedly
renews while Chill/Paralyze delays turns; no Mana starvation is established.
An exact isolated control and Teeth-before-Wall variant both lose, so that swap
is rejected. Control:14100ms/13living enemies; variant:19200ms/nine.

Evidence: `p15-intended-arcane-defensive-v1-readback-v1.json`,
`p15-bone-wave3-teeth-priority-v1.json` and their retained plans/native journals.
The finding remains open; this is improved conditional evidence, not acceptance.

## Owned-socket result (2026-11-02)

The shared intended preparation now spends actual owned gems in empty equipment
sockets. All13 distinct affected socket cases plus the14-profile registration
assertion, final scoped strict types and explicit lint pass. A zero-combat earned
save check confirms20 paid insertions and32flat magic mitigation each for hero/
Prayer, with shield resistance gains and unchanged Life/Mana/attack/speed.

One bounded branch from the original Lost City22/ordinal262 source completes
141training admissions, earns28, and wins five Arcane waves before its boss draw.
Total142admissions/711waves/710wins/one draw,1774780XP,6978acquired/6498salvaged
items,22paid insertions,13415809.389607545combat ms. Independent v2 readback
verifies native export, ordered custody/socket costs/economy/points/quests/
clocks/ordinals/seeds/party/mercXP without replay. Prayer21→24 earns1331052XP;
Rogue remains17/zeroXP. The original reader's draw-winner assertion failure is
retained; v2 handles native null. Gameplay was not rerun.

Arcane ordinal403/wave6 draws after60000ms. Hero ends600/600Life and347Mana;
Prayer492/492Life and196Mana. Summoner216Life, two Flayers172/421remain. Hero
casts16Decrepify/eightWall/13Teeth/oneCE. The original training-survival failure
is conditionally overcome, but this is not full recovery/population acceptance.
Terminal28/next404 remains terminal; Arcane unclaimed/Staff prefix16 unchanged.

Evidence: `p15-intended-arcane-sockets-v1-readback-v2.json`,
`p15-intended-arcane-owned-sockets-draw-v1.json`; authenticated pre-admission
snapshot: `p15-intended-arcane-earned28-checkpoint-v1.json`. Process exited0,
exact task-owned cache absent. Failed ancestors and all material costs retained.

## Prepared suffix and bounded retries (2026-11-02)

The shared prepared controller can now validate and resume native cube/Staff
prefixes before mutation, using existing growth/training/fallback/retry rules.
All88 distinct affected cases and final scoped types/explicit lint pass.

From authenticated earned28/ordinal403, admissions403/404/405 all win their first
five waves, then draw at60000ms. The first is a reproduced exact known control;
the others are two new retries. No training or socket insertion runs. Totals:
18waves/15wins/3draws,42900XP,144acquired/98salvaged items,
580068.3726708074combat ms. Hero600/600 and Prayer492/492Life finish every draw;
Summoner has216/1445/312Life, with two/one/one Flayers remaining. Terminal28/
next406, no Arcane clear/Tomb entry/new quest action; Staff prefix16 unchanged.
The full existing three-attempt policy is exhausted for this conditional branch.
Never extend it or discard the known failure/costs.

Independent `p15-intended-arcane-retries-v1-readback-v2.json` verifies exact export,
ordered custody/economy/points/quests/clock/seed/party/mercXP, all three attempts/
two retries and complete known-control observations against the parent journal.
The syntax-failed v1 reader is retained; no combat replay repaired the readback.
Prayer earns32174XP; Rogue0. Launcher terminal0/exact cache absent.

## Learned draw recovery and earned Tomb result (2026-11-02)

The intended Bone profile now opts into a shared learned-offensive-curse
recovery after a same-area route draw. Native retry carry validates the spent
403 attempt before mutation, leaving two Arcane attempts. Affected regression
checks, scoped strict types and explicit lint pass. The bounded earned
continuation clears Arcane 404 at level 28, completes four native quest actions
and earns level 32 through 147 training admissions. A training draw at 460 causes
the existing Dark Wood fallback. Tomb 552/553/554 all reach boss wave 6 and draw.

Total: 151 new admissions / 815 waves / 811 wins / four draws, 1,955,780 XP,
8,122 acquired / 7,620 salvaged items, 12,983,626.97945068 combat ms. Independent
`p15-intended-draw-recovery-v1-readback-v4.json` reconciles native export,
ordered custody/economy, points, quest graph/settlements, clocks/ordinals/seeds,
party carry, merc XP/levels and retry bounds without combat replay. It validates
310 refused socket transfers and 22 refused stash retrievals with unchanged
custody/materials. No new socket insertions occur; Prayer earns 1,466,799 XP,
Rogue 0. Earlier readers' transfer-success and zero quest-merc-XP assumptions
were corrected; failures remain evidence. Launcher terminal 0/exact cache absent.

The original training-survival failure and Arcane timeout are conditionally
overcome. The new open finding is Tomb boss damage within the timer. All three
observed states are retained in `p15-bone-tomb-observed-waves-v1.json`;
`p15-bone-tomb-turn-economy-v1.json` independently conserves their boss damage.

| Attempt | Curse | Hero damage | Prayer damage | Duriel remaining Life |
| --- | --- | ---: | ---: | ---: |
| 552 | Decrepify | 764 | 3,566 | 21,270 |
| 553 | Amplify | 657 | 21,111 | 3,832 |
| 554 | Amplify | 831 | 19,796 | 4,973 |

Duriel starts at 25,600 Life; all fights stop at 60,000 ms. Hero/Prayer finish
757/651, 757/650 and 756/651 Life respectively; hero minimum Mana 436/438/435.
Hero casts 21/21/22 Teeth, 15 curses and 8/8/7 Wall; no CE cast occurs against the
single boss. These observations identify an offense/rotation question rather
than a survival or Mana failure. They are conditional, not a population rate.

Terminal 32 / next 555 is exhausted and must not be extended. No earlier training
or known 403 control was replayed. The original three Arcane draws and all
ancestor costs remain comparison history. Formal balance acceptance stays 0/210.

## Next investigation

Two rotation diagnostics fail all three retained boss states. Removing Teeth
for basic fallback leaves Duriel at 21,028 / 827 / 6,488 Life. An offensive
Amplify/CE rotation without Wall/Teeth leaves 4,045 / 6,743 / 6,443 Life. Neither
is promoted. Recorded Wall absorption is only 5 / 8 / 7 damage, but that alone
does not prove a safe causal replacement. Evidence: `p15-bone-tomb-basic-fallback-v3.json`,
`p15-bone-tomb-corpsefree-offense-v1.json`, `p15-bone-tomb-wall-cost-v1.json`.

The zero-combat owned-weapon audit finds an eligible backpack polearm in all
three authenticated pre-Tomb saves: Prayer attack 155 → 339, at the cost of
15 maximum Life, 8 magic mitigation and 5 attack speed. The historical monotone
policy rejects that tradeoff. Implement the explicit intended companion weapon
policy in `docs/plans/decisions/P15-intended-merc-weapon-offense-v1.md`, preserving
historical selection. Evidence: `p15-bone-tomb-owned-weapons-v1.json`.
Retain native eligibility, ownership, resources, enemy stats and timer; no
per-seed override or replay of 147 training admissions. This finding establishes
an evaluation-policy limitation, not a production engine defect or accepted
balance result.

## Previous offensive-curse investigation (now completed)

Recorded event analysis `p15-bone-arcane-turn-economy-v1.json` finds16Decrepify
casts per draw. Prayer supplies4083–4804physical boss damage; hero146–321total
boss damage. Both finish full Life. Compare the already learned offensive curse
under one declared bounded fixed-state diagnostic before choosing a shared
recovery strategy. These observations establish no production engine defect,
new accepted population, permission for arbitrary tuning or per-seed combat hack.
Do not replay earlier training/routes or reopen exhausted terminal diagnostics.

## Previous next investigation (now completed)

Evaluate ordinary owned-gem preparation in currently empty equipment sockets.
Native Diamonds give flat magic mitigation; merc shield Topazes give lightning
resistance. Confirm actual equipped capacity, native paid transactions and
conservation before any new earned branch. Preserve failed history and current
skill/stat ownership; no grants, rerolled victory search or additional per-area
curse patch. Any diagnostic must name its source, changed variable and bounds.

## Owned-offense Tomb completion (2026-11-02)

The shared intended merc weapon policy now selects eligible owned weapons by
physical offense, using native projection/equip and accepting defense tradeoffs.
Eighteen selector cases,14-profile registration, native boundary integration,
scoped strict types/lint pass. All three original boss states clear in isolated
comparisons with original rotations/seeds; no new admissions or training.

The earned suffix from authenticated pre552 selects owned polearm `it-1ohw7-aln`
over `it-8eygm-2yb`: Prayer attack155→339, with15less maxLife,8less magic mitigation
and5less speed. One Tomb admission/six victories then claims Seven Tombs/unlocks
Act III. Total35470XP,69items,163767.8350515464combat ms; terminal32/next553.
No training or salvage. `p15-intended-tomb-weapon-v1-readback-v1.json` independently
verifies exact native export/custody/economy/points/quests/cache rewards/clock/
seed/party/mercXP and prefix20 suffix bounds. Process0/cache absent. Earlier
failures and costs remain; exhausted555 is not extended. This conditionally
resolves progression for this Bone path, while broader training survival,
recovery/population/pacing and formal0/210 acceptance remain open.


## Act III training timeout and fallback finding (2026-11-02)

The independently verified wall continuation ends at44/next1147 after173 new
training admissions:873 victories and one draw,1,649,580XP,8,807 acquired/
8,715 removed items. It adds no route area or quest action. Durance preparation
exhausts its original200-entry allowance; terminal1147 must not be extended.
Evidence: `p15-intended-act3-wall-continuation-v1-readback-v1.json` in the retained
root-owned packet. Controller continuation is implemented;35 affected checks,
scoped strict types and explicit lint already pass.

The ordinal985 Kurast Bazaar third-wave timeout is a damage failure. Hero43
finishes923/923Life and594Mana, Prayer518/611Life and251Mana; one Serpent Magus
has345Life. Persistent Dark Wood fallback after this draw earns XP too slowly.
The fixed input is retained in `p15-bone-act3-training-draw-input-v1.json` with
journal line474 SHA2565867ba14ba2944b241d51c0779576ea6d8c33697a5a16b2353fa11877df4354e.
`p15-bone-act3-training-curse-v1.json` reconstructs all original events, final
teams and winner exactly, then replaces only learned Decrepify with Amplify.
The single variant wins at40440ms, hero923Life/594Mana, Prayer571Life/251Mana.
No admissions, rewards, campaign replay, production tuning or population
acceptance follow from these two isolated battles.

The declared training-only offensive retry and same-source stance are implemented.
Failed recovery returns to existing fallback and all spent limits remain.
Thirty-six distinct affected checks pass, with scoped strict types and explicit
lint. The post985 source is independently authenticated and natively projected
at next986, with433/429 spent admissions/training and39 Durance entries. This
source is explicitly a native domain projection, not an original live export.
A declared earned successor is next; the full run and broader recovery/population
finding remain open. Terminal1147 stays retained and exhausted.

## Conditional earned Act III completion (2026-11-02)

Training draw recovery and same-source stance now allow the bounded successor
from authenticated projected post985 domains to complete Act III at47/next1130.
Durance1128 draws;1129 wins, Guardian is claimed and Act IV unlocks. Independent
`p15-intended-act3-training-recovery-v1-readback-v1.json` verifies exact native
export/economy/custody/points/quests/clock/party/mercXP/recovery and spent bounds
without replay. Count supplement `-readback-count-correction-v1.json` proves
181/200 lifetime Durance training entries. No production tuning or budget renewal;
failed1147 remains terminal. This one conditional build result leaves the wider
recovery/population finding open and formal balance acceptance0/210.
