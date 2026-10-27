# P14 — Remaining Act I quest repairs

Status: bounded design/technical plan APPROVE, 2026-10-27. The canonical
Blood Raven objective and trainee reward slices are ready under the accepted
contracts and scoped policy below. Remaining location/service decisions are now
locked in the [remaining Act I contract](decisions/D11-act1-remaining-quests-v1.md),
including explicit legacy proof and entitlement recovery; final plan review is ready.
The bounded Blood Raven repair is now implemented with488focused passes; see
[implementation evidence](evidence/p14-blood-raven-quest-repair.md). Its types/lint/build and
four production browser cases and repaired-tree full20001/946 pass. Evidence
archive/readback and exact task cleanup are complete. Broader P14/earned acceptance
remains open.
The first native objective reproduction is now causal RED: one failure/five
passing controls after actual final victory, before data correction. See
[BUG326](../../production/bugs/BUG-326-bind-blood-raven-objective-to-canonical-source.md).

## Preserve the accepted route and transactions

[D07/D11 first-act route](decisions/D07-D11-first-act-route-v1.md) keeps all six
Act I areas accessible. Act II requires completed Sisters to the Slaughter OR
canonical Catacombs clear; Claim is unnecessary. None of these four quests
becomes a new progression gate. Keep all existing quest/objective IDs and the
six-area/29-area structure.

[D11 Talk](decisions/D11-quest-talk-v1.md) requires exact current-town NPC,
tracked quest and prior objective completion before the event; no banking,
autostart, same-event cascade or automatic Claim. [D11 Claim safety](decisions/D11-quest-claim-safety-v1.md)
requires whole-bundle preflight, exact-once grants, reentrancy guard, participating
rollback and explicit restoration failures. Positive gold remains unsupported.
[D11 Duriel rewards](decisions/D11-duriel-quest-rewards-v1.md) provides reusable
qualified-kill and deterministic-cache mechanics; Duriel's level32/five-pick
budget does not transfer to unrelated quests.

The first-act route's legacy-ID preservation applied to its measurement task.
A separate functional repair may correct source IDs after a causal reproduction.
Source review found these quests can Start but cannot ordinarily finish and Claim.
Historical map clears must not be used to manufacture tracked quest events.

## First vertical slice: Blood Raven

Existing encounter, canonical location, Kashya dialogue, trainee definition and
shared transaction primitives make this the smallest complete repair.
[P14a01](decisions/P14a01-blood-raven-v1.md) already approves the encounter;
no combat retuning is part of this repair.

1. Canonical objective integration: own `src/data/quests/main.json` and one new
   native-store integration test, with at most one relevant existing kill test
   if needed. Replace only this objective's area/target bindings with
   `areas/act1-burial-grounds` / `monsters/act1.blood-raven`. Prove native qualified
   kill → ordered Kashya Talk → completed/unclaimed. Preserve unrelated authored
   content and access rules. File the actual bug/reproduction before patching.
2. Mercenary Claim: follow the reviewed reward policy below, then own
   `src/features/quests/claimReward.ts`, its existing tests, a Blood Raven reward
   test and persistence test. Retain1500 hero XP /1125 XP for the previously
   fielded mercenary. Replace only this now-obsolete unsupported-bundle test;
   retain generic unsupported-reward controls. File a separate reward bug before
   implementing its behavior.
3. Ordinary browser acceptance: track the actual quest, earn a new native kill,
   return to Kashya and Claim, then Save/close/Continue exactly. Keep fresh
   functional fixtures separate from genuine ancestry; preserve earned-endgame4.

Reviewed reward decision: Claim ensures an owned `mercs/act1-rogue-trainee`.
If absent, create it from its actual JSON definition through `createMercFromDef`
(authored level3 initialization). If already owned, preserve that instance,
equipment and progress. Keep the previously fielded selection; award no gacha
shards, pity changes, free upgrades or replacement gear. `hireMerc` cannot be
used unchanged because it automatically fields the recruit. Include any new
participating roster/progress/equipment state in rollback. No save-version bump
is inherently required. Independent bounded design/technical review approves this policy. Capture the
previously fielded recipient before any publication; the new recruit receives
no XP unless it was already fielded. Existing fielded trainees receive the normal
1125XP/level gains without a reset. Recognize existing suffixed instance IDs;
do not merge or delete historical instances to force uniqueness.

Causal/negative checks: actual tracked native kill fails before ID repair;
a completed authored bundle refuses unsupported rewards before Claim repair;
untracked/early/wrong-source/nonwin credit; early/wrong-town Kashya Talk;
Claim/repeat; no-fielded merc; already-owned trainee; unknown reward identity;
reentrancy; mutate-then-throw at new roster publication and final claimed flag;
exact persistence. Constructed integration equipment is wiring evidence,
not earned combat or balance proof.

## Remaining quest decisions and order

| Quest | Smallest source path | Decisions before implementation |
| --- | --- | --- |
| Tools of the Trade | Source-bound Malus Recover → ordered Charsi hand-in → explicit Claim; reuse item/action transactions | Barracks is absent: choose an existing compact-area destination. Keep3500/2625 XP. Define actual imbue or explicitly approved substitute; old +5-wishstone prose alone is not ratification |
| Forgotten Tower | Canonical Countess encounter/source → tracked qualified kill → deterministic cache Claim | Countess Chamber is absent: choose compact encounter placement. Keep3000/2250 XP. Freeze tableId `loot/countess-runes`, ilvl and picks for that source. Resolve obsolete gold5000 explicitly; do not silently pay or convert it |
| Search for Cain | Canonical tree → Akara decode → source-bound rescue → Claim; real persistent Act I Cain/service availability | Tristram is absent: choose rescue placement. Keep2500/1875 XP. Define identification eligibility and atomicity, NPC availability and service persistence. Do not insert inert tokens or reuse the closed Act V service ledger |

Evidence anchors: `src/data/quests/main.json:20–75`, exact-source matching in
`src/stores/mapStore.ts`, `src/engine/map/questInteractions.ts`, unsupported
reward preflight in `src/features/quests/claimReward.ts`, closed registry in
`src/engine/services/quest-services.ts`, and trainee JSON in
`src/data/gacha/mercenaries.json`. The original claim test intentionally records
Blood Raven's unsupported reward, so it must change only alongside real support.

The design-contracts agent completed this read-only audit and released readers;
no tests/builds/gameplay, files, scratch, processes or agents were created by it.
Security check: pass for local source/data/transaction repairs and owned evidence;
no credentials, network commands, dependency changes or external publication.
Full P14/C2/G3/G7 acceptance remains open until functional and ordinary earned
proof exists; preserving C1's narrow historical acceptance does not close P14.
