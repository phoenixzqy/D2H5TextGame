# D11 — Town stat and skill reset

## Overview and player fantasy
Implement existing progression-curve §§4.3/5.3: experimentation and build autonomy
through a visible town service. This reconciles the legacy gold-only test port;
it does not change encounter balance or manufacture earned campaign progress.

## Detailed rules and formulas
Three free uses **independently** for stat and skill resets per character/save;
subsequent uses cost exactly five `wishstone`, never gold or gacha mirror funds.
Refund actual invested ranks or sum(current core − authored class starting core),
plus existing unspent points. Never reconstruct grants from level/quest estimates.
Skills reset removes learned allocations, selected aura and priority; equipped
skill grants remain owned. Stat reset keeps learned skills. Each resets only its
own allowance. Empty/invalid allocations consume nothing. No automatic reallocation.

Service NPCs: Akara, Drognan, Ormus, Tyrael, Malah in Acts I–V respectively.
Only the matching current unlocked act's authored NPC may perform the service;
no active combat/run, unresolved save replacement, or competing transaction.
The confirmation retains exact hero/currency/act basis; changed basis refuses.
Cancel/Escape changes nothing. Preserve items/quests/mercs/ordinals and permanent
bonuses. Recompose derived stats once; preserve current Life/Mana, clamping only
if a new maximum is smaller. Equipment remains owned/equipped after stat refund,
as current equip eligibility gates placement, not retroactive ownership.

## Edges and dependencies
Validate integer counts/ranks, class baseline and whole refund totals before
payment. Deduplicate aliases by canonical skill identity (highest stored rank),
matching existing allocation semantics. Reject unknown/foreign skill IDs.
Serialize payment/player publication under existing transaction guard, restore
both participants on setter/observer failure, block saving if rollback fails.
Save v21 persists counters; valid v20 and predecessors migrate to3/3 without
changing other state. Pre21 cannot carry future counters. No defaulting of
present malformed current counters. New characters start3/3.

## Tuning knobs
Closed schema-validated respec JSON owns free count3 and paid cost5, plus NPCs;
class JSON owns starting core. These are existing policy values (economy gate),
not independently tuned for the current Duriel build.

## Acceptance
Causal failing policy/refund/payment/rollback/save tests before implementation;
free→paid, independent counters, empty and unaffordable, stale confirmation,
combat/restore refusal, exact point/resource/permanent bonus conservation,
old/current round trips; bilingual native town Cancel/Confirm/save/reopen at
mobile/desktop. Prepared tests prove function only; earned Duriel remains open.

Self design/plan review: ready for implementation; independent acceptance pending.
Security check: pass. Scope is local game data/state/UI; no credentials, network,
dependency, permission or publishing changes. Preserve retained earned next258.
