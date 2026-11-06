# BUG-642 — Put the learned Javelin signature pair ahead of weak fillers

Status: Fixed and verified locally through earned five-act Normal; wider balance acceptance remains open.
Severity: High (intended build progression); owner: root / game-designer.

## Reproduction

Working tree based on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, production
hash `12ce40578164070e187a017daa00c91d15a209bacbd258f17817bfea94e1a88d`.
Native Node campaign; browser/viewport/locale not applicable. From verified
Act III level47/next672 continue unchanged intended Javelin through native
Act IV preparation. Earn49 then enter Plains of Despair. Ordinals700/701/702,
runSeeds471422776/501010012/529669913; wave index4 seed is runSeed XOR
`5*0x9e3779b1`, converted to uint32. Each draw is already reproduced natively.

Expected: later Javelin rotation uses learned Lightning Strike/Impale signature
pair effectively without granting power or altering intended early pack bridge.
Actual: three60sIzual draws, remaining HP2794/746/4066. Hero survives with
near-full1081HP; mana hits zero. First wave entryMP125/max426/regen12.6persec.
Poison23/Impale15/Power11/Jab11/Charged8/LightningStrike7/Bolt1 hero casts.
Charged1/Poison4 often deal1per hit after authored mitigation; Impale8 is lower
priority than both. LightningStrike20 is the invested later signature.

## Evidence and diagnosis

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `p15-javelin-earned-act4-v1`: native report/journal/export and passing
readbackV1. Full accounting and all3failures remain authoritative; route limits
are spent, not renewed. [Checkpoint](../../docs/balance/2026-11-03-javelin-act4-checkpoint.md).
`chooseSkillForState` in `src/engine/combat/combat.ts` walks first-eligible order;
`damage.ts` implements the authored resistance/flat-mitigation/minimum1pipeline.
`tests/campaign/intended-growth-v1.json` puts Charged/Poison before Impale.
The intended build identity explicitly pairs Lightning Strike with physical
Impale from Act II onward. No production coefficient/engine defect established.
Affected systems: intended campaign policy/growth and its native combo tests.
Workaround/candidate: after Lightning Strike is learned, put Impale immediately
after it; retain all other ranks/skills, initial rotation, gear, resources and limits.
One frozen comparison of the3retained failed boss inputs precedes adoption.

## Local correction, 2026-11-03

The frozen six-battle diagnostic reproduced all three original event streams
and final parties exactly. Changing only hero order won all three retained
boss inputs in55.115/59.443/53.427s, hero1081HP and31/30/22mana remaining.
The intended profile now opts into `javelin-lightning-impale-v1`: only after
both signature skills are learned, prepare Lightning Strike then Impale,
followed by every other declared skill in its previous order.

Ten affected Javelin regressions pass after the meaningful two-case order
failure. They cover level6/12/18/24 unlocks, the unchanged early pack bridge,
held points, sequential/batched growth and late pair action/damage/mana
contracts. Scoped strict types and explicit lint pass; the first type-check
failure for the fixture's missing `enraged` field and its verified correction
remain in the packet. No production engine/data edit or earned route admission occurred.
The three route attempts remain spent; no Act IV clear or balance cell is
accepted. See the [decision](../../docs/plans/decisions/P15-intended-javelin-late-signature-order-v1.md)
and packet prefix `p15-javelin-late-signature-order-v1` for the frozen inputs,
exact controls, RED/GREEN logs and final scoped validation receipt.

## Earned successor and remaining resource stall, 2026-11-04

The authenticated `p15-javelin-post-priority-act4-v1` continuation clears
Plains703 and River704 and claims Fallen Angel/Hellforge, then wins the first
six Chaos705 waves before Diablo draws at60s.17wins/one draw, no farming/retry;
exact successor49/next706. Native export and retained save/economy/custody/
party/quest/clock/seed/ordinal reconciliation pass. Earlier failures and costs
remain spent. No five-act or formal balance acceptance is earned.

Remaining reproduction: Chaos705 wave6, runSeed1451398233, engineSeed84330382;
hero enters1051HP/23MP, regen12.6/sec, no merc (native preceding-wave death).
Diablo44800HP ends9162HP. Impale23casts deals28454direct damage;
Power Strike19/Jab21 together deal107; Lightning Strike casts only once.
Low-rank fillers still consume scarce mana despite pair promotion. This is a
campaign preparation issue, not an established production formula defect.

A single frozen comparison, prefix `p15-javelin-diablo-signature-only-v1`
in the same retained packet, will replay the exact original once and then use
only the learned Lightning Strike/Impale pair once. All other fields must be
identical, including mana/cooldowns and absent merc. No variant sweep, route
replay, new power or renewed allowance. Adoption requires a living-hero win;
whole-area earned progression remains a separate requirement.

## Signature-only result and owned-weapon follow-up, 2026-11-04

The sole signature-only candidate is rejected: Diablo1067Life remains at60s,
hero1013Life/9Mana,22casts each of Lightning Strike/Impale. Exact control events
(including the separately checked native Diablo intro) and final parties match.
Two failed setup/comparison launches remain retained; one ran zero battles and
one ran only a control. Total spent:two controls/one candidate across launches.
No signature-only order is adopted and no candidate is swept or repeated.

BUG666 corrects the missing offensive owned-weapon preparation policy. Its
single native check equips a stronger owned polearm, then fails an incorrect
prospective War Fork prediction. Whole-save/ranking accounting verifies the
actual successor, without replay or boss victory. This report remains Open
for Diablo viability. Original failures/limits stay spent; intended completions
remain3/14 and formal acceptance0/210. See the
[combined evidence](../../docs/plans/evidence/p15-javelin-act4-and-owned-weapon.md).

## Post-investment pack failure, 2026-11-04

BUG667 corrects late Impale investment and wins the retained original Diablo
input with only paid rank/passive changes. That isolated win does not clear
Act IV. The actual Chaos706 admission from its paid native reset successor
uses the original full order and owned offensive weapon preparation. First
five waves win; the sixth draws against17Mega Demons with five still alive.
Diablo is never staged. RunSeed1485655029; wave index5 engine seed is runSeed
XOR (6*0x9e3779b1), converted to uint32. Hero1081Life/71Mana enters,878Life/
6Mana exits, and mana reaches zero. Casts: Lightning Strike6/Impale22/Poison22/
Charged2/Power9/Jab37. Weak fillers still spend mana needed by the invested
area signature. This observation does not establish a production engine defect.

The actual successor is49/next707. One admission,120048combat ms,231943XP,
45drops and61salvaged items are retained. V2 retained-output accounting passes
full save and ordered resource/custody/party/quest/clock/seed/ordinal reconciliation;
V1's backpack-versus-stash staging assumption remains as a failed reader.
No replay, retry, new claim, Act IV clear or formal balance acceptance occurs.

## Fully invested pack comparison and proposed correction, 2026-11-04

The sole frozen `p15-javelin-invested-pair-pack-v1` comparison reproduces
Chaos706/index5 control events and both final parties exactly. With Impale20
and Lightning Strike20 unchanged, changing only `skillOrder` to the pair wins
in31.212s, hero1081Life/187Mana, no surviving enemies. Casts: LS13/Impale12/
basic26. No admission, reward, clear or formal acceptance is earned. This is
a new fully invested pack input, not a repeat of the rejected Impale8 boss trial.

Root cause: full-order preparation still permits weak filler mana spending
between signature cooldowns, starving the invested area skill. Proposed opt-in
`javelin-pair-at-target-v1` keeps the full promoted order before both declared
positive target ranks are actually learned; at full investment, use only both
declared signatures with native basic fallback. Legacy/omitted policies remain
unchanged. Affected source: campaign actions/policy/intended profile and native
growth/combo regressions. RED/GREEN and accounting precede any earned attempt.


## Act IV correction verified locally, 2026-11-04

The opt-in fully invested policy is adopted and passes35selected regressions,
scoped strict types and explicit lint. Actual Chaos707 wins all seven waves,
Diablo34.272s, then claims Terror's End and unlocks Act V. All13 Act IV actions
are complete. Exact49/next708 save and earned345753XP/64drops/46salvage pass frozen
V1 full accounting/closure without replay. This locally resolves the Act IV
resource-priority failure; Act V and wider balance acceptance remain unverified.
Earlier rejected trials/failures and spent budgets are preserved.

## 2026-11-04 — Javelin partial Act V and terminal preparation verified

Direct Act V ordinals708/709 clear and claim Bloody Foothills/Frigid Highlands.
Crystalline710 wins two waves, then loses the third; thirteen quest actions end
at Anya thaw. Source50/next711 is retained. The loss is not evidence of mana
starvation: entry272/1093Life and432Mana, no surviving merc; terminal411Mana.

Separately frozen prepared V2 adopts all three original admissions and their
spent retry costs. Two hundred earned training admissions produce1,072victories,
29,402,756XP and level62/next911, then the original200-per-area limit stops it
before the level71 target. No route retry or new Claim occurs. Cleared sources
progress Durance11/Plains128/River53/Bloody8; all training wins, with11merc deaths
and22waves without a merc. This is a closed failed preparation policy, not proof
of a production combat/reward defect or permission to renew training allowances.

The sole frozen readback passes six negative accounting controls and exact whole
native-save, custody/economy/points/party/quests/clocks/seeds/ordinals. Preflight,
scoped strict types and explicit lint pass. V1's fresh-boundary assertion failed
before any gameplay; BUG668 is locally fixed by inherited action authentication
in V2, retaining native partial-route validation and V1 costs. No combat replay.
Required packet prefix `p15-javelin-prepared-act5-v2`; closure verifies terminal
processes and absent disposable config/cache. Cumulative911admissions /
45,538,468.320859015combat ms /677,810.956475driver ms /
733,165.4280702898reserved execution ms remain spent. Exact terminal export
SHA256 `b9bff03ee6f3be0a0bfb260e8e30ac969b0988324d2abba0b79db2e3aa6705ac`.

The inherited direct route entered Act V at49 and cleared two areas without
preparation, leaving the full50→71 gap for one area's200-entry allowance.
The result establishes that this particular adoption policy fails its bound;
it does not establish that the game's30–50active-hour target is impossible.
Preserve it and use an eligible unfinished implementation/investigation slice
instead of further farming from this closed checkpoint. Counts14ActI/3Normal/
formal0of210; full privatev1 and wider acceptance remain incomplete. Root retains
human2 and required evidence through umbrella review and owns eventual cleanup.

## 2026-11-04 — Earned five-act Normal completion

The frozen direct continuation from authenticated62/next911 clears the three
unfinished ActV areas at911/912/913:21victories, no loss/draw, actual63/next914.
All quest Claims, consumed sources, Baal title and Nightmare unlock reconcile
with the native save and separate raw journal/economy/custody/party/clock readback.
The failed200-entry preparation remains closed and all historical costs remain
spent; no training/reset/comparison or completed-area replay. Scoped types, final
lint, preflight and six schedule rejection controls pass. Current source is
frozen separately from historical preparation. This locally closes Javelin's
intended Normal progression, not wider balance/pacing or formal acceptance.
See [completion evidence](../../docs/plans/evidence/p15-javelin-direct-normal-completion.md)
for exact receipts, cumulative costs, limitations and verified artifact cleanup.
Counts14/14ActI,12/14intended Normal,formal0/210; full privatev1 stays incomplete.
