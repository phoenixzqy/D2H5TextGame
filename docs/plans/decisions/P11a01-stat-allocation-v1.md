# P11a01 v1 — Coherent attribute allocation

Status: bounded A contract approved by design; independent producer/QA revised-plan
APPROVE. Genuine RED review remains required before runtime. Input67e4019, runtime baseline5f14aa7.
Independent prerequisite discovered alongside failed Den preparation; this
contract makes no Den survival or campaign acceptance claim.

The existing void allocateStatPoint(keyof CoreStats) action remains the one-point
mutation boundary. Require a player, at least one available point, and a chosen
prospective base+1≤500. Otherwise preserve exact store state and publish nothing.
Permit499→500 regardless of gear bonuses; refuse499.5→500.5 and preserve legacy
overcap values. A balance1.5 can spend1, retaining0.5; a balance0.5 cannot spend.
Source: progression-curve§4.2 hard cap500 and numeric save schema133/162.

On success, copy the player/base core, spend exactly1, and derive all stats from
the updated base/current level/current inventory.equipped through existing
deriveEquippedPlayerStats. Publish the complete player exactly once. Preserve
or clamp current HP/MP; never refill. Preserve XP/skills/legacy equipment and
inventory/currencies/other stores. Repetition must not accumulate modifiers.
Share the existing500 constant with effectiveStatValue without changing formulas.

Independent literal L4 unarmed Sorceress oracle, base10/25/10/35:

| Allocation | Result |
| --- | --- |
| Strength10→11 | attack28 (Dex25 still dominates) |
| Dexterity25→26 | attack29, attackSpeed126, physDodge0.102 |
| Vitality10→11 | maxLife144→146, current120 preserved |
| Energy35→36 | maxMana114→116, current102 preserved |

Existing Energy recovery0.2 per effective Energy/sec remains unchanged; no new
caster damage, class growth, respec/economy, combat tuning or save version.
Combat recordings retain their existing inputs/events/outcome; configuration
changes apply through existing next-run/next-wave composition.

Delivery checkpoints:

1. Documentation: this contract and structured BUG045 only.
2. A runtime, five files: playerStore.ts, progression/stats.ts,
   stat-allocation.test.ts, warmth-composition.test.ts and BUG045 evidence.
   Freeze independently reviewed RED tests before fixing runtime. Reconcile the
   old stale-cache identity oracle using these source-backed semantics while
   keeping adapter and recording coverage. Focused/related, full unit/coverage,
   typecheck/lint/purity and production bridge/build gates remain required.
3. Closing A documentation: ledger only, after source/QA approval and cleanup.
4. B separate design/UI: progression-curve§11 requires +/- draft allocation
   cancellable until Apply. Resolve transactional draft semantics before code;
   localized mobile/keyboard controls and ordinary earned/save/reopen browser
   evidence remain required. A store correctness alone does not accept B.
