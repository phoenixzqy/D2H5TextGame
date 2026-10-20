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

## B v1 — Cancellable draft and atomic Apply

Design and producer staged-plan APPROVE after source review. Input40c535e;
A runtime810900f remains the one-point compatibility action. B is missing
feature delivery, not a newly observed combat defect.

B1 adds allocateStatPoints(deltas: CoreStats, expectedPlayer: Player) returning
deterministic result codes. Refusal precedence: no-player, stale-player,
invalid-deltas, empty-draft, insufficient-points, stat-cap; otherwise ok.
Check the fixed four own fields are finite nonnegative safe integers and their
sum a safe nonnegative integer. Zero total is empty-draft. Positive total must
fit floor(current statPoints); retain fractional point remainders. Only changed
attributes must satisfy prospective base+delta≤500, preserving untouched legacy
overcap attributes. Check every condition before mutation; publish exactly one
complete canonically equipped player with preserved/clamped current pools.
No loop of one-point calls, partial spending or in-place mutations.

The feature's applyStatDraft controller first checks hydration ready and
!isReplacingSave(), returning not-ready otherwise. This protects the pending
import/delete interval which retains the old player reference. Keep persistence
imports out of playerStore to avoid introducing a cycle. No save-format changes.
Five B1 files: playerStore.ts, stat-draft.test.ts, applyStatDraft.ts,
applyStatDraft.test.ts, BUG045. New API absence is feature RED; the unchanged
one-point-loop diagnostic also demonstrates why a loop cannot implement Apply.
Freeze meaningful state/refusal/publication assertions before implementation.

B2 uses four readable rows with44×44 +/- buttons, attribute-specific localized
accessible names, committed→draft base values and whole points remaining.
Minus removes only staged additions. Apply/Cancel controls; derived stats stay
committed until Apply. Draft is local {basis: Player, deltas}; editing, Cancel,
navigation and unmount publish no domain state. Explicit Save during a draft
serializes committed state. Any changed player reference immediately renders an
empty draft and disables Apply, independently of effect cleanup. Announce the
discarded pending edits accessibly; never silently rebase and apply. The store
reference guard is the final fence, and refusals use localized status messages.
Four UI/locale files plus BUG045 form the next independent increment.

B3 requires a later independently reviewed frozen ordinary recipe, exact
skill/merc/gear/clock choices and literal earned-state oracles before a single
pilot and then en/zh×desktop/mobile matrix. Prove no publication/committed-save
changes before Apply, exact atomic allocation, no refill, real Save/read-only
IndexedDB/export/close/Continue, keyboard/44px/no overflow/browser errors.
Neither B design approval nor A acceptance certifies a Den win or full v1.
