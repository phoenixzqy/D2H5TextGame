# D05 — Assassin martial charge-up and finishers

Author contract, 2026-10-26. BUG300 reproduced at adc8528b. Private-v1 implementation scope; independent design/QA and earned balance remain open. No campaign/replay or remote action.

## Problem and intended behavior
Six advertised builders are scalar attacks. Tiger's1s cooldown permanently preempts lower-priority Talon at ordinary cadence. Implement actual finite stored power and actual discharge through existing damage/healing/mana settlement. Keep all existing damage, cost, cooldown, unlock, prerequisite and attempt definitions.

## Charge ownership and timing
Tiger Strike, Fists of Fire, Cobra Strike, Claws of Thunder, Blades of Ice and Phoenix Strike each gain one stack only after a paid native authorized builder directly removes hostile HP and the caster survives ordinary reflection/death settlement. Independent pools, maximum3stacks per skill,15000ms duration from the latest successful builder hit; exact expiry is inactive. Both cap and duration live in validated JSON. Miss, full mitigation/absorption, periodic/coating/reflected/release damage and free marker bodies cannot charge. A fully paid native shadow uses its own private captured skill authority and pools.

Keep charge state private to one battle and actor, separate from presentation status stacks. Start every battle/wave empty, and never reconstruct paid authority from imported/preloaded statuses. Snapshot each stack's actual effective cast rank; Command contributes at gain once and does not add another bonus at discharge. Native class/level/transitive prerequisites/allocated ranks come from the normal legal projection, with a specific complete martial rank projection where required. Paid shadow bindings remain the only shadow source. Validate the complete authored registered skill, not only its name/marker.

## Priority and release
Keep priority ordering. Once any pool is full, builders become unavailable until a release or expiry, allowing a lower selected finisher or the basic fallback to execute. Other configured non-builder skills keep ordinary priority; they do not discharge. Dragon Talon, Dragon Claw, Dragon Tail, Dragon Flight and basic attacks are finishers. They remain valid with zero charges; preserve their ordinary base behavior. A finisher's first direct positive hostile HP loss consumes all active pools once for the cast, before any recursive release effects. All misses or full absorption retain pools through their finite lifetime. A multi-hit/AOE finisher releases once against that first successful original victim, never once per attempt/enemy. Target/caster death cannot retarget or duplicate settlement. A dead caster receives no payoff.

## Payoffs and provisional tuning
A consumed Tiger/Fire/Thunder/Ice pool releases one additional respective Physical/Fire/Lightning/Cold attempt against the original victim, using50%of that builder's authored rank-scaled base range per captured stack. Sum independently captured ranges before one seeded release attempt per pool. Preserve authored statuses/tags for that builder on its release; ordinary modifiers/Defense/resistances/personal absorption/reflection/death apply. Phoenix releases one shared-roll weighted Fire/Cold/Lightning attempt with its existing ordered component statuses and the same50%perstack rule. Cobra has no additional damage: heal10%and steal up to10%MP per consumed stack of the triggering finisher's actual hostile HP removed, each floored; mana gain is capped by actual MP debited from the surviving victim and the caster's missing capacity. HP restoration clamps to missing life; no revival. JSON owns coefficients and discharge order. These are explicit provisional text-combat choices, not canonical D2 or earned balance claims.

Release consumes no new action/MP/cooldown and cannot gain or release charges recursively. Preserve existing independent Talon/Claw attempts, local Claw critical bonus, Tail AOE and Flight single-target scalar base until its separate movement adaptation. Existing Fire/Burn and Phoenix weighted-component semantics remain intact.

## Presentation
Public en/zh-CN descriptions and current/next/MAX previews must explain build cap, lifetime, paid hit condition, next-wave reset, finisher list, priority saturation and exact payout. Show actual stack count/expiry in combat using status observations that convey no authority. Localize real healing/mana changes. No hidden charge success or UI-only simulation.

## Acceptance and evidence
RED before implementation: current native rank1/20 Tiger→Talon starvation, plus unchanged uncharged Talon control. Extend to all six builders, one/two/three stacks, stack cap and exact expiry, independent pools and caster isolation, native projection ownership/class/level/prerequisites/MAXaliases, immutable replay and allocation/Command snapshot behavior. Verify misses/mitigation/finite shields, target/caster death/reflection, full resources/zero enemyMP/partialMP, single release on repeated/AOE finisher and no recursion. Exercise real paid Warrior copying; do not certify Master coverage against its current four-skill pool.

Require actual native wave/import/town-respec boundaries and public en/zh desktop/mobile rank1/20 allocation/priority/cast, typed discharge and HP/MP evidence, seven-domain Save/reopen/Continue with actual offline service worker, geometry and individually inspected captures. Constructed proof remains distinct from earned builds/economy/campaign/independent acceptance.

## Increment and gate plan
The existing frozen shadow full suite is terminal PASS19369/907, with static/public evidence retained and exact old-task cleanup complete. Accurately reconcile existing Amazon proofs separately. Promote charge data/schema/helper/tests, native rank projection, paid runtime/selector, model/previews, then lifecycle/public evidence in increments<=5paths; docs separately. The prospective implementation was developed in the external charge task using an explicit overlay with frozen repository hashes; promote only verified source increments. Run focused engine/compatibility/types/lint per increment, then final production/public and one full gate after stable feature integration. Archive/readback and exact task-owned cleanup only after consumers finish; never follow dependency links.

## Author checks
Security check: pass for local engine/JSON/presentation/tests, no credentials/network/dependencies/CI/export changes. Constrain Cobra MP transfer atomically to actual debited capacity.
Plan review: ready after explicitly covering saturation across multiple charge pools, no recursion on release/reactions, per-stack Command rank capture, real enemyMP debit and finite lifetime. This author challenge is not independent design/technical/QA approval.


## Cobra recovery amendment — 2026-10-27

The user answered **“choose cheaper solution”** to enemy mana pools versus a
Cobra redesign. The selected lower-cost solution keeps the existing mana-free
monster contract and generates bounded recovery for the actual caster. The
following conservative formula retains the existing JSON coefficients; it is
a design choice reviewed independently, not a formula specified by the user.
This amendment supersedes only the surviving-victim, actual-debit and MP-transfer
requirements above and their corresponding acceptance/security clauses.

Cobra releases no additional damage. On the existing first qualifying direct
positive hostile HP loss by an authorized finisher or ordinary basic fallback,
consume the existing paid charge pools once. For consumed Cobra stacks s, let H
be that triggering hit's actual hostile HP removed after mitigation/absorption,
excluding overkill. A living actual caster recovers
`max(0, min(fresh missingLife, floor(H × lifeFractionPerStack × s)))` HP and
`max(0, min(fresh missingMana, floor(H × manaFractionPerStack × s)))` MP.
Both JSON coefficients remain0.1; s remains1–3. MP recovery does not inspect,
require or debit victim MP. Victim death, including death during an earlier
ordered release, does not cancel captured-H recovery; caster death does.
Ordinary hit/reflection/death/orb closure precedes recovery. Re-read the caster
and its capacities after healing before committing mana. Never revive or
retarget. Retain finite-input refusal and nonnegative capacity clamps.

Preserve paid source ownership, captured ranks, cap/lifetime/strict expiry,
priority saturation, discharge order, all builder/finisher costs and cooldowns,
no recursion/RNG/new action/extra hit, once-only consumption and replay/receipt
ownership. A real paid Shadow Warrior recovers its own resources; its owner
receives none. Do not extend the current Master attack pool. New battles/waves
still start with empty private pools. Keep the existing absolute caster mana
event with reason `cobra-strike`, with no victim-debit event. Positive recovery
retains Mana Burn clearing and recovery-carry behavior through `commitMana`.

Correct en/zh descriptions/rules from steal to restore/回复, state that killing
hits qualify while the caster survives and enemy MP is unchanged, and suppress
Cobra-only obsolete generic steal tags after complete authored recognition.
Refresh the charge schema's obsolete transfer description without changing its
constraints, source markers or numerical tuning.

Before runtime changes, retain meaningful RED from actual authored zero-MP
monster construction and native paid Cobra→finisher/basic discharge. Verify
exact1/2/3-stack recovery/flooring; victim0/partial/largeMP unchanged; full/zero/
partial caster capacity; lethal target and reflected caster; earlier-release
target death; missing/expired/forged pools; AOE/multi-hit once-only discharge;
no extra cost/CD/RNG; real paid Warrior ownership; fresh absolute resource
events and Mana Burn behavior. Retain old transfer observations as superseded
policy history. Required focused/engine/full/types/lint/build and independently
reviewed public en/zh desktop/mobile zero-enemy-MP recovery/playback/persistence
proof remain before Cobra gains bounded-functional credit. No earned sustain,
balance, pacing, campaign or full-v1 acceptance follows from this amendment.

Policy provenance: root-owned scratch `cobra-cheaper-policy-proposal.md`
SHA256 `939f33e6e9003da10adb55add70ad39ab0d65837b2270f5b559c372a45bd54ea`;
independent GD/plan approval `cobra-cheaper-policy-review.json`
SHA256 `3bb81bf508f3711787b81935f5977595062a8262fbb4607b9b3202f8240d04c1`,
under `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-h2-hell-b6de0n4x/`.
The proposal author supplied technical cost/source analysis; runtime/public
verification remains separate. [BUG304](../../../production/bugs/BUG-304-cobra-mana-free-monster-contract.md)
tracks implementation and evidence; the original failed transfer proof remains.
