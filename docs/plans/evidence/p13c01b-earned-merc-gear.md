# P13c01B — earned mercenary glove production browser evidence

Status: accepted after independent producer APPROVE and QA APPROVE/ADEQUATE. Input6e7cf7e includes runtime
0221cd3 and accepted A evidence. Root owns all changes/runs and exact cleanup;
producer and QA independently review. No runtime/UI change in this card.

## Reviewed discovery contract

See ../p13c01b-earned-merc-gear.md. Source review corrected the draft's wolf
assumption (production requiredLevel18 prevents summon atL1–L2), resolved locale
actor/skill names, and required both original hero and merc alive at witness.
Initial frozen spec187d6bd6a143b69b9616cf4155d752f15227f3e6f12edebfd3a1f86960dc3f07,
configf4ed4f8ed49ec18d6360e60674c0b4688fef41109e4b66a0d576084c01f8bac5,
plan550cce232f1668a3cfa13601c1c34e759ecffb4a42ec5a3d3c916cc7100625d9.
Producer/QA approved exactly one en/desktop bounded discovery, not acceptance.

## Original discovery: picker harness failure

`discovery-pilot` exit1/37.638wall; runner36.149seconds,0pass/1unexpected,
0skip/flaky/retries. It stopped before Equip: global `listitem` filtered by
Equip descendants matched4versus expected3. The owned merc card is itself an
outer li and contains the nested Modal, so it also matches. Three actual glove
rows remain the source-backed oracle. Proposed correction scopes candidates to
the equipment dialog; no runtime or reward/recipe/first-selection change.
Independent review required before reattempt. No equipped battle/witness was
sampled. All prior assertions passed: ordinary creation/hire,8enemyW1victory,
W2pause/Flee, exact five full drop objects/75shards,heroL2XP60/stat5/skill2,
mercL3XP120 and savedstats unchanged. Original source and outcome retained in
fixtures/p13c01b-failed-picker-discovery-{spec.ts.txt,outcome.json}; original
RAW JSON/log/screenshot/trace retained for independent consumers.

## Validation so far

Full2445/142unit tests pass0pending (39.640wall), TypeScript20.429,
lint46.460 incl52enginepurityfiles, dedicatedPWAeslint10.103 all exit0.
Early draft typecheck9.825 passed. Original assertions were not weakened after
a runtime failure. Existing test timing budgets are exceeded; no budget change.
Production guard/build and browser environment details remain in RAW log and
will be summarized at closure. At that pre-pilot validation checkpoint no other recipe/output had been sampled.

## Retention and open scope

RAW=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-merc-gear-browser-nwmmhz9p
Root owns all RAW, fonts/config/cache, generated worktree dist and node_modules/
.vite from this card. Keep until both reviewers release; then remove exact
verified paths and verify absence. Playwright owns nativepreview lifecycle.
FullP13/Den/economy/W2victory/C0–C4/G0–G7/fullv1 remain open; BUG047 separate.

## Independent source prediction before equipped combat was sampled

Design source reviewer predicts the earliest landed merc Fire Bolt will be
Fallen Shaman A at W2sim1820ms,base35/noncritical,damage5 atdefense30 versus9
atbare26. Conditional prerequisites still to verify: carried inner_sight buff
means BasicArrow at1524ms; Druid has>=20MP and Firestorm at1540ms; no deaths/
orbs before1820ms. Source-derived draw schedule:1–3mercArrow;4–43Firestorm
10targets/statuschance;44–65sixFallen actions;66–70ShamanB→hero;71target
.8297198624→merc(integerroll3of0..3;weights2:2,probability1/2);72hit.2987377527<.80;73base.6423448354→35;
74crit.2844935607>.05;75ignitechance. This is a pre-observation prediction,
not acceptance. Carry/scheduler/context and actual first witness remain to be
reconciled; no geared combat has been sampled at this writing.

## Corrected bounded discovery outcome

Producer and QA independently approved the sole selector amendment and one
same-input reattempt after verifying the original failure happened pre-Equip.
Frozen corrected specbbc4bf25d1b46410e8701d6549afb7703c7368f4281fa0b498b1f1a75be0bea7;
scoped-picker-spec-lint exit0/5.049. Scoped-picker-pilot exit0/34.076wall,
runner32.804seconds,1expected/0unexpected/skip/flaky/retries;12attachments.
Witness index39: Fallen Shaman A casts Fire Bolt, then attacks Rogue Scout —
Inner Sight for5fire/noncritical. Full42-rowprefix startsTurn1, includes earlier
ShamanB→hero5, and ends with mercignite after witness. Observed5 matches the
independent pre-sample conditional prediction. HP93.24% includes carried/extra
events and is presentation evidence, not an exactafterhitHP oracle.

Native equip moved exact first glove once into canonical merc map; whole save
otherwise unchanged. Actual item Defense4 and four remaining backpack items,
heroL2XP240/565/stat5/skill2,mercL3XP255/304/saveddef26,fullSave/readonlyIDB/
Continue/export equality,fieldedidentity,gear/locale/XP anderrors[] all passed.
No W2 payout. Root inspected paused battle screenshot; combat log is below the
initial viewport and the attached full text prefix is authoritative. Finalspec
should additionally capture log after ordinary scroll, only after Pause.
This discovery is not acceptance: carry/RNG/context derivation and reviewed
literal final assertions/matrix remain required. No runtimeUI/source change.

## Independent W2 source audit before final matrix

Producer independently reproduced main draw71=.829719862435 (integer3of0..3,
hero/merc weights2:2),72=.298737752716988<.80hit,73=.642344835447147
=>25+floor(draw*16)=35,74=.284493560669944>.05noncritical. Separate scheduler
tieSeed2386502105 orders FallenE,C,D,F,A,B,then ShamanB beforeA at1820ms.
MercAS122 firstaction1524ms;heroAS120 first1540;FallenAS95 first1740.
Arrowdraw1–3=19−17=2. Firestorm draws4–43 independently produce
[27,35,9,31,41,23,12,38,43,83] through10targets;lastcritical. All Fallen
champion HP>=108>83, so no death/orb draws before witness. FallenC dodge
consumes2draws; sixFallen consume44–65;ShamanB→hero66–70;ShamanA→merc71–75.
Observed41-rowprefix through witness agrees. With fireRes0/flat0/combo1,
floor(35−30)=5 versusbarefloor(35−26)=9. At this intermediate drafting point nativeW1carry proof was pending;
the completed independent handtrace and source review are recorded below.

Finalspec draft adds literal whole witness index39/actorA/5fire/noncrit, native
paused combatlog screenshot and separately attached reopened fullsave. It keeps
all earlier item/save/reward/earliestevent/completeprefix/survival oracles.

## Independent W1 carry reconstruction

Design reviewer hand-recomputed source arithmetic without repository imports,
game/runtime/test/browser execution or scratch files, before opening pilot RAW.
Ordinal1W1 ends at7700ms after165battleRNGdraws. Hero ends156/158HP and56/84MP
with fractionalrecoverycarry.64; merc144/148HP,79/79MP,inner_sight activebuff;
both have empty statuses. Hero casts Firestorm at1540/4620/7700ms; basic at3080
uses attack22 and killsFallenA; basic at6160misses. Merc casts InnerSight1524;
BasicArrow3048misses,4572crit34toFallenB,6096deals11toFallenC,7620deals6toD.
HP orbs at3080/4620; MP orbs6096/7700. Hero starts adapter currentmana80/max84,
first scheduler recovery caps84 at1524, discarding overflow/remainder;
it remainscapped1540 before the spell. Subsequent6160ms×4MP/s provides
24wholeMP+.64fraction; three20MPFirestorms and two4MPorbs give84−60+24+8=56.

Wave transition carries pools/buffs/recoveryfraction and rebases statuses; new
wave runtime cooldown map resets. Thus InnerSight does not recast, merc uses
BasicArrow at1524; hero has62MP before1540Firestorm and42after. No carried
player status alters the hit formula or RNG prefix. W1merc144 loses1toFallenB
and5toShamanA in W2, consistent with observed138/148=93.24% afterPause; this is
a reconciliation only and is deliberately not an exactwitnessHP assertion.
The source review corrected an intermediate hand-copy hero basicattack24→22;
this still killsFallenA and preserves the predicted path. Original browser
oracles/inputs were unchanged. At this drafting point design was still reconciling fullprefix/citations;
the completed reconciliation and reviews follow below. No observed damage was used to inferraw35.

Design completed its carry ledger before opening07pilotattachment and then
reconciled all42visible rows exactly:0Turn1;1–2mercArrow2;3–23Firestorm+tenburn
rows;24–35FallenE,C(dodgedbymerc),D,F(crithero),A,B;36–38ShamanB→hero5+ignite;
39–41ShamanA→merc5+ignite. Recoveryprecision giveshero62→42at1540with.8carry;
1740grants1MP so43at1820, consistentwith nativeMP43. No extraelapsed claim is
needed for this MP reconciliation. Fullsourcecitations/finalreview appended next.

The165draw W1handtrace, terminalHP156/144 and action/orb schedule are attributed
to designreviewer, independently completed before readingpilot. Producer/QA
reviewed the production carry contracts/arithmetic rather than claiming a new
fullW1execution. Producer approved finalspec393e172d18c5f26ebf6998741e4e30e1aa394d769988051164a759cbccf7083b
for four-case matrix after this sourceproof is retained. QA reviewed exact delta
and carry contracts with no materialgap; QA matrix-readiness APPROVE and design SOURCE-ORACLE APPROVE received before matrix.

Key source anchors: src/stores/combatHelpers.ts:566 retains/rebases surviving
non-summon units;:597 refreshes hero derived/recovery metadata while preserving
pools/buffs/fraction. src/engine/combat/combat.ts:173–190 clearsoverflow/fraction
atmanaCap;:585–594 prevents rebuff;:901–909 refreshes cooldownview;:1079–1106
creates fresh battlemainRNG, separate fork scheduler-ties and empty cooldownmaps.
src/engine/rng.ts:23–42 is mulberry32 and inclusiveintegerselection;:91–94 forkscheduler;
src/engine/combat/damage.ts:81–88 routesfiretoarmor;:142–151 rollscrit before
mitigation. src/engine/skills/dataCatalog.ts:121–134 copies status metadata only
when authored;:213 enforcesrequiredLevel. Runtime buffer/log translation comes
from src/stores/eventToLogI18n.ts and src/stores/combatStore.ts:313 cap200.
All cited source is runtime0221cd3, unchanged through input6e7cf7e.


## Final source and matrix acceptance packet

Before matrix execution, design SOURCE-ORACLE APPROVE confirmed literal spec
393e172d18c5f26ebf6998741e4e30e1aa394d769988051164a759cbccf7083b.
Producer and QA MATRIX-READINESS APPROVE independently accepted the retained
carry/RNG proof and unchanged final four-case recipe. Design source bundle adds
combatHelpers.ts:54–65 current80/max84; combat.ts:831–850 recovery advance,
:292–324 default flat/increased0 and magical defense; status.ts:259–269 clock
rebasing; skills/aliases.ts:155 InnerSight; combat.ts:637–644 buffID and
:973–987 tie ordering; damage.ts:116–169 hit/base/crit/resistance/defense/floor;
orbs.ts:40–56 two orb draws per death; combat.ts:355–388 status draws and
:459–475 death reward; eventToLogI18n.ts:55–56 omits mana log rows. Authored
Firestorm src/data/skills/druid.json:3–35 has no DoT metadata; dataCatalog.ts:
120–152 and status.ts:179–189 cannot invent a rate. No observed5 was used to
infer raw35. Original prediction and full independent carry proof preceded RAW.

Final matrix exit0:4/4 en/zh-CN ×1280×800/360×640, retries0,
0unexpected/skipped/flaky/browserErrors. Runner60.353s, wall61.670s.
Report SHA256 f71291acb55bb571446c06f5a444ab372e86dfdd954ce9d191a538668fcf3674.
All four cases retain the identical42-row prefix and exact earliest whole
witness index39/ShamanA/5fire/noncritical. Exact five initial drops, first glove
transfer/Defense4, baseline26, XP60→240 and merc120→255, no W2payout,
readonly committedIDB/export/fullsave/closeContinue equality all pass. There
are56final attachments (14percase); independently inspect them before releasing
RAW. Root visually inspected Chinese desktop battle, mobile reopened item,
and mobile combatlog; actual Chinese glyphs and5fire row are readable. Versioned
fixtures/p13c01b-mobile-zh-combat-log.png retains representative native evidence.

fixtures/p13c01b-final-outcome.json retains exact command argv/exit/wall/logSHA,
report/source hashes, all four whole witnesses/prefixes, full-save equality
result and every final attachment bytecount/hash. Finalspec T10.252 and forced
PWA L5.415 pass; full unit2445/142, T20.429, fullL46.460/purity52 were run before
discovery, with no runtime/UI edits afterward. All three browser runs include
native guarded production builds and no fingerprint-test overlap. No extra
coverage rerun: accepted A covered unchanged runtime. Config only adds this spec
to the production allowlist.

Task-local NotoSansCJK revision f8d157532fbfaeda587e826d4cd5b21a49186f7c,
font SHA2c76254f6fc379fddfce0a7e84fb5385bb135d3e399294f6eeb6680d0365b74b,
license SHA6a73f9541c2de74158c0e7cf6b0a58ef774f5a780bf191f2d7ec9cc53efe2bf2,
config SHA195998453c2aad11632f591e0292c0f8d5dd0287aab0a299633b7dfb39a2ab07.
Glyph check passes actual pinnedfont; no shared/system/user install/cache edit.

Limits: native production build warns about old Browserslist, >500kB chunks,
2.57MB generated manifest excluded from precache, and NO_COLOR/FORCE_COLOR.
No build policy or timing budget was weakened. Existing [burn]/[ignite] raw
status tokens remain a localization backlog, not accepted playercopy here.
Native log screenshot is the scrollable visible tail, while textattachment
retains complete42rows. This does not accept all mercenary economy, named-skill
scaling, fullP13, Den/W2victory, broad mobile/a11y, C0–C4/G0–G7 or fullv1.
Final independent review and exact cleanup status are recorded at closure.


## Closure

Producer and QA independently returned final APPROVE/ADEQUATE after matching
all12 command rows/loghashes, all56 actual report attachment bytes/hashes,
source/report/outcome hashes, exact full-save/native route and readable Chinese
mobile proof. Both explicitly released RAW retention; neither owns artifacts or
processes. Root removed exact owned B RAW above, worktree dist and node_modules/
.vite, verified all three absent and nativepreview port4396 closed. Original
checkout remains clean. Only versioned compact evidence/source fixtures and
requested code/test deliverables remain. A separately owned next BUG047 task
root /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-crit-display-6ej81zug
retains its plan, preserved original browser source and copied task-local font/
license/runner for the next slice; root removes it after its own consumers finish.
Root worktree claim continues for the full staged objective; no push/PR/merge.
