# P15 — Martial Acts III–IV complete; Act V frontier

2026-11-01. Martial Assassin now completes all23areas through Act IV and Bloody
Foothills in Act V. Full private v1 remains incomplete; the historical five-act
roster stays11/14. This supersedes its earlier Flayer Jungle frontier.

## Authoritative earned state

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Root retains required saves, journals, methods and diagnostics until umbrella
acceptance and removes them after all consumers finish.

- Act III: `p15-martial-act3-route-native-v4.json`, SHA256
  `6e7845d3a5b689cf374892eaf192ca0b1d7e923ffe40d17b7245ca1701e4d12a`.
- Act IV: `p15-martial-act4-route-native-v3.json`, SHA256
  `e17b43ef487d83f247588fee08b181ebfd31e91db50259a8aba1f6b8a39406b9`.
- Current Act V: `p15-martial-act5-route-native-v1.json`, SHA256
  `59c21f564c00a7922bcdabca00686ed6803f9b3ebe1dae08c7499958bb3c6a7f`.

Each corresponding independent readback passes. Latest state is actual29 /
XP39716 / next Normal ordinal366,24cleared areas,48canonical Act II–V actions.
Original Inner Sight Rogue25 remains fielded; resets stat2/skill0. All67paid
socket contents remain owned. Bag85/stash493. Learned Talon20/Tail14 and
Tiger/Cobra/Fists1; no unspent stat or skill points. Combat priority is currently
Cobra/Talon/Tail. Canonical equipment authority is save.inventory.equipped.

## Progression and implementation

The earlier phase qualifies a free stat reset and owned Isenhart setup to clear
Flayer/Kurast. One bounded Great Marsh acquisition earns actual28:101admissions,
505waves,502wins/3nonwins. Retained Travincal/Durance failures and all partial
income remain. The earned Ormus free skill reset refunds24ranks and allocates
Talon20/Tail11 through normal store actions; Mephisto dies25.5s, terminal82HP.
Act III final Claim/Act IV unlock pass independent readback.

BUG-547 changes only Talon's fixed growth4→40→60. Current rank1 remains40–60;
rank11=640–660; rank20=1180–1200 per attempt. Three attempts,4MP/1s, original
target and ordinary resistance/Defense/shields/reflection/death remain. Initial
50checks pass; the on-chapter Izual follow-up adds the native cap-rank50%/363
Defense regression:15REDfailures/36passes then51/51GREEN, scoped strict types
and lint pass. No save migration. [Balance remains CONCERNS](../../balance/2026-11-01-dragon-talon-growth.md).

Outer clears, then the retained Plains loss exposes arcane attrition. Owned
hero wards/speed plus the original Rogue's full Arctic set/seven MR inserts
qualify and clear all five Plains waves at actual28; Izual53.742s. Current-area
native teams/events/metrics exactly match qualification. No additional farming.
After the retained City champion-charge loss, owned full Isenhart and an already
paid Nef glove pair plus a new MR helm qualify City. City, River and Chaos clear;
Hellforge consumes owned tools, all seals are used, Diablo dies22.4s and the
final Claim unlocks Act V. Bloody Foothills qualifies with Cobra-first priority
and clears natively; retain Frigid's fourth-wave arcane defeat.

The initial and follow-up tuning stages have separate immutable source bindings.
This joint gear/order/tuning result does not isolate a global balance effect or
establish every martial skill identity. Previous assertions blaming fire on
magicResist are corrected: fire/physical/poison use Defense; resistance precedes
flat mitigation.

## Accounting, checks and next action

Eight newly audited transitions since the prior frontier reconcile116admissions,
584waves,576wins/8nonwins,2688040XP,5797awards,5808salvages and34insertions.
Their ~2.21logical combat hours are simulation accounting, not player pacing.
This continuation adds7admissions/39waves/37wins/2nonwins/292880XP/20insertions;
it performs no further farming. Passed unchanged checks are reused.

External Act V driver v2 only imports the accepted martial priority helper v3;
its reader v2 adds exact before/after martial projection and unchanged combat
state checks. Scoped types/lint pass. Retained setup failures include a wrong
Plains wave count, unsupported diagnostic boot-Shael helper path, duplicate
launcher variable, and checks attempted before an Act V config existed. Corrected
successors pass; those failed forecasts grant no income and no native action is
repeated. The earlier helper static corrections and failed lint are also retained.

Current Frigid wave3 loses5.24s to level62succubi/shamans: arcane hits reach174
while mana remains243. Hero700HP/MR32/arcane28; merc is already dead. Compare
eligible owned arcane/MR equipment, complete set/runeword bonuses and paid skill
orders from ordinal366 before training. Do not replay old native actions.

Closure: `p15-martial-act34-complete-act5-frontier-artifacts-v1.json`; phase totals:
`p15-martial-act34-complete-act5-frontier-summary-v1.json`. The closure records
exact config archives/removal, terminal wrappers, absent task caches and source
pins. The original checkout stays read-only and the human2 claim stays active.

Source tree `3d63761cc9d591942c344b39f6a84ccb429084326ff4f8ae465fe7f070276c90`;
data `d8e51324c2a6a20ef1b5f6feaf9e9dfb7339c3ab5123eecebf05780b89c04b7a`.
No broad test, old-act replay, browser/build/CI rerun, agent, install, commit,
push or publication. Martial Act V, Trap Assassin, Summon Druid, advertised
skills/builds, missing-area/holdout matrices, economy/acquisition/fairness/pacing
and final mobile/locales/PWA/endgame/save stability/two-hour soak/review/owner
playtest remain. Browser works; CI excluded; no pending answer/external blocker.
