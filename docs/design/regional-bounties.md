# Repeatable regional culling bounties

Status: root-ratified after independent design/numeric/technical review. Join the
unpublished P14 batch with Normal/manual sources only. Runtime/version work has
not begun. Review: current31 packet bounty-loop.qa-review.md.

## Overview

Populate the existing bounty journal with five finite templates, one per act.
Each explicit Accept/Repeat commissions one actual Normal/manual full-area cull, followed
by a separate Claim of one canonical gem-shard. Repeat deliberately starts a new
cycle; previous area-clear flags and old completed battles cannot fill it.
Ordinary combat XP/loot remains the reward for fighting; bounty adds no XP.

Options considered: (1) incremental20-kill counts per area, requiring new per-wave
count state and partial-defeat semantics; (2) one qualified full-area cull per
cycle, reusing actual run-victory provenance; (3) repeatable boss quests, requiring
more boss gate/loot coupling. Recommend2 as the cheapest coherent repeated-slaying
loop. It remains optional, uses all existing areas and adds no vendor or gold.

## Player fantasy

Competence and Autonomy: choose a known regional threat, clear its actual enemy
waves, receive one useful crafting catalyst, then choose whether to repeat.
Discovery is supported by moving to later regional contracts; none gates the
main campaign. Exact bilingual source/claim/repeat states should remove guessing.
No claim of measured pacing, fun or final economy balance accompanies this draft.

## Detailed rules

Closed JSON templates (names/description/objective/button text use quests locale):

| key | quest | exact Normal area | full clears/cycle | Claim |
|---|---|---|---:|---|
|moor|quests/bounty-act1-moor-cull|areas/act1-blood-moor|1|gemShards1|
|waste|quests/bounty-act2-waste-cull|areas/act2-rocky-waste|1|gemShards1|
|forest|quests/bounty-act3-forest-cull|areas/act3-spider-forest|1|gemShards1|
|steppes|quests/bounty-act4-steppes-cull|areas/act4-outer-steppes|1|gemShards1|
|foothills|quests/bounty-act5-foothills-cull|areas/act5-bloody-foothills|1|gemShards1|

All rows type bounty, objective obj-cull/type clear-area/count1 with the exact
area. Eligibility uses actual existing act/area unlock, no new level/main Claim
requirements. Available shows Accept; inProgress shows target/progress; completed
unclaimed shows Claim; paid shows Repeat. Accept/Repeat is a protected public
quest action, not the generic unrestricted status reset. Claim is journal-wide;
Accept/Repeat does not require visiting a new board/NPC. All three actions use the
existing readiness/quest lease; Accept/Repeat refuse during an active run and cannot
attach a contract midway through it. Route bounty Start/reset through these finite
actions, never generic updateQuestProgress. Do not autostart contracts.

Durable minimal state is map.bounties, an own exact record of these five quest
IDs; omitted entries with omitted rows mean never accepted. Each entry is exactly
{ claims: safe integer0..1000000, victoryOrdinal: safe integer0..1000000 }.
Here victoryOrdinal is the completed bounty-cycle sequence, never the cyclic combat
planner ordinal. Let c=claims, v=victoryOrdinal, MAX=1000000. Only these states exist;
the exact matching row has id=quest and only the obj-cull objective:

| state | row status | obj-cull | rewardClaimed | entry |
|---|---|---|---|---|
| never accepted | row absent | — | — | entry absent |
| active | inProgress | false | false | v=c, 0<=c<MAX |
| complete, unpaid | completed | true | false | v=c+1, 0<=c<MAX |
| paid | completed | true | true | v=c, 1<=c<=MAX |

Every other combination refuses. Row and entry publish coherently; no separate
persisted receipt keys, inventory proof objects, global counter or claim log.
Accept creates (c,v)=(0,0) in the active state.

At actual new-run creation, capture a private immutable accepted {quest,claims}
cycle witness under the existing native run/recording binding. Issue it only for
an active matching contract and a freshly checked complete canonical Normal/manual
ordinary-area plan, original living hero and matching area. Bind native results
before presentation callbacks; require each original required wave consecutively
won, all original enemies defeated and the original hero alive, with exact native
run/input/recording identity. The private cursor advances only with accepted wave
settlement. Final publication rechecks the same accepted cycle (current claims must
equal captured claims and v=c), then atomically publishes completed/true/unpaid and
v=c+1. A run captured at claims0 cannot fill the cycle after claims1.

Use a bounded process-local witness/cursor analogous to the existing Ormus seam;
do not refactor or generalize that accepted family. There is no comparison with
challengeOrdinals: its zero-based cycling/explicit-override semantics stay intact.
Explicit replay permanently disqualifies that run as a bounty source; native
receipt idempotence remains. Countess/Cow/endgame/other quest encounters,
Nightmare/Hell, idle/offline progress, defeat/draw/abort, partial clears,
dummy/summoned deaths and stale/replayed settlement give no credit. Public
markCleared must explicitly exclude these five bounty IDs; neither it, clear-set
membership, generic recordMonsterKills, display events nor caller flags supply
bounty authority.

Claim requires canonical loaded template/reward and the exact complete-unpaid
row/entry (v=c+1); atomically add1 to currencies['gem-shard'], increment claims
and mark rewardClaimedtrue, leaving v unchanged. No XP/gainExperience(0), actor cache
normalization, heal, equipment, unlock or other currency. A synchronous lease and
postconditions protect publication; scoped rollback removes only this increment
and restores this row/counter while preserving independent wallet/source changes.
No broad actor/whole-store snapshot. Direct spending of the unsettled grant must
be fenced using the smallest bounded shared currency-transaction seam justified
by Fara; unrelated currencies and independent additions remain conserved.

Repeat requires paid completed state, claims<1000000 and normal input readiness.
Keep both counters (v=c), reset only this objective/status/paid flag
to inProgress/false/unclaimed. Repeat earns no income. Kills/battles preceding
Repeat never count. Progress pauses at completed until explicit Claim+Repeat;
excess victories do not prepay another cycle. No auto-repeat or clock/daily reset.

## Formulas

Qualified complete source: (c,c)->(c,c+1), only for the run-start accepted cycle.
Successful Claim: (c,c+1)->(c+1,c+1) with0<=c<MAX. Repeat retains (c,c).
Wallet w'=w+1 only if w and w+1 are safe nonnegative integers. Example:
Accept(0,0) -> victory(0,1) -> Claim(1,1) -> Repeat(1,1) -> new victory(1,2)
-> Claim(2,2). An old claims0 witness or duplicate receipt cannot fill cycle1.

Raw canonical authored area waves currently contain12/17/24/24/23 enemies in the
five regions. For these authored baselines only, one catalyst/cull is at most
1/12 extra shard per authored enemy; generated-plan counts/timing are not measured.
At minimum fusion consumes3 matching chipped gems plus1 shard; bounty saves the
one chipped gem otherwise dismantled for that shard. Conditional on twelve
independent trash-qualified rolls, the0.015 gem chance gives0.18 expected base gem
drops; this is not a measured generated-plan farming rate. The catalyst can accrue
before matching gems; it cannot manufacture gem types/quality. One shard per
successful cull is a proposed modest utility reward, not a balance certification.
Higher acts get ordinary higher-level XP/loot rather than a new bounty XP faucet.
No offline multiplier applies to this fixed currency, only to existing native XP.

## Edge cases and compatibility

Current31/older readers must reject new quest IDs and map.bounties, including empty
future fields. Batch migration validates literal31 and adds only empty bounties;
no old area flags/ordinals/completed rows imply acceptance, victory or claims.
Native32-or-root-selected-successor requires own JSON exact finite entries, no
accessors/inherited/symbol/unknown fields or unsafe/negative/fractional counters.
Validate the exact four-state matrix above; row-only/entry-only, v<c, v>c+1,
inProgress at MAX, paid claims0 or wrong objective/status/paid combinations refuse.
Do not allocate a version in this draft. claims0/completed/v1 is legal before the
first Claim; active v=c>0 is legal after Repeat. Native absence may normalize to empty
only under an explicit reviewed current-shape policy; historical absence stays empty.

Death after prior earned Claim retains wallet/counters; failed/aborted current cull
grants nothing. Mid-run close/import abandons its unresolved cull as ordinary run
policy already does; inProgress contract persists and can try a fresh bound run.
Offline time cannot advance contract or grant direct rewards. Reload/import preserve
exact partial/complete/paid/repeated states; native save is unavailable during
unsettled quest/wave publication. Quota/grant/counter overflow leaves retryable
completed proof; exhausted claims disables Repeat with localized explanation.
Restoring an older user export restores its older world, not a server anti-cheat
history; no remote authority is invented for this private offline game.

Prepare the bounded bounty advance inside the native wave settlement lease before
native income. Capture only its participating bounty row/entry and private cursor
for added rollback ownership. After existing native effects/context checks, commit
the consecutive advance; publish the coherent unpaid row/entry only on full final
victory, before finishRecordedWaveSettlement. Recheck context and postconditions.
Any source failure uses existing native settlement failure/rollback and restores
the bounty row/entry/cursor; issuance/replay disqualification is not reset. Preserve
other bounty entries and unrelated journal changes; do not add whole-store capture
or a transaction framework. Already committed earlier waves stay committed under
existing native semantics. The later separate Claim can roll back only its own
bounty grant/state and cannot revoke committed native XP/loot. Existing leases
prevent Claim/Repeat/save during unsettled publication. New source rows never
create cross-card receipts or change previous main/side area-clear objectives.

## Dependencies

GDD7.3 repeated monster tasks/8 noGold; existing native run/recording binding and
combatHelpers successful settlement; strict finite JSON quest loader; quest UI;
Fara currency-only publication/guard seam if proven reusable; save domain/schema/
builder/serializer/decoder/migration/persistence. Engine owns pure state predicate;
root owns shared combat/save dispatch; frontend owns bilingual progress/Repeat.
Current31 acceptance and literal31 equality precede all runtime/content/tests.

## Tuning knobs

Gate: exact existing Normal/manual area and unlock, no new level gate.
Curve: gem-shards per complete cull1 (integer1..3 only after economy review).
Gate/safety: maxClaims1000000 fixed format bound, never wraps.
Feel: explicit Accept/Claim/Repeat,44px targets, immediate localized outcome.
No new combat/monster/drop tuning. Per-kill thresholds belong to the rejected
incremental option and are not an undisclosed knob in this chosen design.

## Acceptance criteria

1. Public UI Accept -> actual original full-cull victory -> separate Claim ->
Repeat -> second new victory/Claim pays exactly2shards and2claims. Both cycles
retain ordinary native loot/XP without bounty XP. At least one real three-gem
fusion consumes a paid shard, with missing-input refusal and exact utility shown.
2. Every five-template tuple admits independently; no wrong area/difficulty/source,
prior clear, unaccepted/mid-run acceptance, idle/offline, partialwin, death/draw/abort,
duplicate receipt, stale cycle, replay or completed-without-repeat/action reentrancy
pays. Include actual first planner ordinal0, wrap360359-to0 and explicit
ordinal overrides without changing their existing behavior. Currency-overflow/observer fault
conserves independent state and allows one successful retry. Meaningful REDs cover
real settlement and actual guard/rollback behavior, not just helper calls.
3. Strict current/historical builder/JSON/decode/migration and save/export/import/
actual close-reopen Continue cover never-accepted/active/completed/paid/repeated/
exhausted states; malformed descriptors are rejected unread. Five acts visible
only as eligible; bilingual360x640/desktop show readable source/progress/reward/
repeat feedback, keyboard focus,44px controls and no raw keys/errors. Final batch
checks/build/browser and independent numeric/source/evidence review required.
Owner playtest validates feel later; no earned pacing/allbuild/full-v1 acceptance.
