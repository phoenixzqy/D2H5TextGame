# D11 H2 — Recover, assemble and insert the Horadric Staff

Accepted2026-10-23, base `6f1f544`. Producer plan-review READY/security PASS;
design/technical owner accepts the finite definition and receipt contract.
This continues P14/C2; the complete seven-class, five-act goal stays intact.

The compact29-area map places Staff of Kings (`quest/staff_of_kings`,
`obj-shaft`) at `areas/act2-far-oasis` / `objects/staff_of_kings_chest` and the
Viper Amulet (`quest/viper_amulet`, `obj-amulet`) at `areas/act2-lost-city` /
`objects/serpent_altar`. Explicit Recover respects the exact live area/act,
access and own preceding flags. No combat, clear, level or Radament gate.

Inventory offers portable explicit Assemble for the authored `horadric_staff`
recipe. It requires the actual owned Cube and both exact owned component
receipts, retains the Cube, consumes both parts and issues `quest/horadric_staff`
from `quests/act2-horadric-staff#objective:obj-transmute`. It sets transmute and
completes ordinary Staff progress; the6000XP Claim is separate and once-only.
No gear instance, equipment/capacity, currency or RNG participates.

Explicit Insert at `areas/act2-tomb-of-tal-rasha` /
`objects/tal_rasha_orifice` requires eligible Seven Tombs progress and actual
owned Staff. It consumes the Staff and sets only `obj-open-tomb=true`, without
kill credit, rewards, claims, clears or a new access gate. The plain object
reducer continues refusing item-dependent objectives.

Tainted Sun's independent Destroy action uses the same Lost City altar. Destroy
and Recover do not complete each other or require the other quest to be tracked.
Keep4500XP; the documented permanent resistance reward remains named follow-up
work, so H2 cannot accept Tainted Sun in full.

Objective definitions add `component` (sourceObjectiveId, consumedBy output item
ID) and `assembled` (sourceObjectiveId, recipe, requiredTool, ingredients,
consumeQuestId, consumeObjectiveId). Loaders validate reciprocal references,
canonical source/consumer locations and recipe/objective identity. Read rewards
and retained tools keep their existing branches. Save receipts remain exactly
`{itemId,state}` keyed by canonical objective source; no redundant saved kind.

Version14 validates frozen v13 Book/Cube semantics before a copy-only migration.
No flag-derived item or consumption inference. Missing legacy receipts remain
valid. Each receipt needs its own true source and preceding flags; completed
rows require all authored flags own true. Owned components cannot coexist with
an output receipt. Consumed components require the exact output; output requires
both consumed parts and owned Cube. Consumed Staff additionally requires a valid
Seven Tombs row with its own open flag true. Books preserve owned/consumed states.
Dexie schema remains unchanged.

Explicit legacy repair extends Cube and component Recover, Assemble and Insert:
completed/claimed rows qualify only when internally complete with all own flags
true. Preserve status, claimed bit and all flags; actual items are still required.
Thus a legacy Staff quest may explicitly reconstruct items, and a completed
Seven Tombs may explicitly insert reconstructed Staff to repair its consumption
receipt. A present owned or consumed source never reissues. Import grants nothing.

All grant actions share Claim/Read/Recover's synchronous lock and existing
hydration/import/player/access/combat/run/wave/restore/receipt protections.
Validate prospective ledger+progress before publication. Mutate-then-throw
publication restores both participating domains and retains unrelated quest
writes. Hold the lock through every restoration attempt; failed restoration
throws AggregateError. This is not crash or observer-wide atomicity.

Acceptance: ordinary chain and complete/claimed legacy repair, invalid source/
flags/receipt graph, ordering, duplicates, guards, rollback and reentry; native
English/Chinese Recover/Assemble/Insert and separate Claim, exact imports and
Save-close-new-page Continue at each durable stage, full gear conservation.
Use the retained earned4057-ID prefix; separately classify constructed legacy
compatibility. Tests never substitute for an earned boss win or full campaign.

Preserve current act-wide access and ActIII quest-OR-canonical-boss-clear policy.
Duriel canonical kill identity/quest-table delivery, earned ActII victory,
Tainted Sun resistance and nonexistent Canyon metadata remain separate required
work. H2 completes neither ActII/C2 nor any full G0–G7 gate.
