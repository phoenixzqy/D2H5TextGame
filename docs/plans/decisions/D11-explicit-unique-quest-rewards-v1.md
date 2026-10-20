# D11 v1 — Explicit unique quest reward delivery

Status: delegated design and technical/producer contract APPROVE; overarching
[design review](../../design/quest-unique-reward.md) APPROVE. A representation/
preview passed independent producer/QA APPROVE/ADEQUATE and required checks. B generic transactional claims passed67scoped and2823full tests plus independent
source/evidence APPROVE/ADEQUATE with cleanup verified. C authored Andariel activation passed frozen9/9 and full2825/147 plus independent
producer/QA final APPROVE/ADEQUATE; exact cleanup verified. D production zh/en×5viewport claim/inventory/manual Save/reload passed10/10 with independent producer/QA APPROVE / ADEQUATE (ee18ea9); exact cleanup verified. No earned boss/campaign or C1/fullv1 acceptance.

Preserve legacy itemDrop strings and add a closed object requiring uniqueId
(canonical unique grammar) and positive integer ilvl, without campaign cap.
Syntax acceptance neither resolves catalogs nor promises eligibility/delivery.
Do not alter shared objective IDs. Preview one gift chip using exact-one matching
template name and existing data-key localization; unknown/ambiguous ID uses the
new localized uniqueItem label. Rendering never allocates/grants/rolls an item.

The deliberate new bounded Andariel design is8000XP,0extraSkillPoints and one
Coif of Glory ilvl19, removing only the quest lootTable reference when C activates.
Source does not establish that exact intended identity; this is an approved new
choice. Coif is class-neutral and need not be an upgrade. Normal boss loot/table
content stay unchanged; no additional TC picks/gold conversion/kill-award call.

B must preflight the full bundle, hold the global guard, call exact rollUniqueItem
with full pools and fresh seed hashSeed(JSON.stringify(['quest-unique-v1',
capturedPlayer.id, quest.id, uniqueId, ilvl])), append through retained-overflow
addItem and mark claimed last. Expected construction refusal is unsupported-
rewards; exceptions are grant-failed. Restore participating backpack/currencies
in one partial inventory update plus existing player/merc/progress restoration,
preserving unrelated fields/actions and AggregateError semantics. Stable retry
properties do not promise repeated unpublished instance IDs; never rewind shared
allocation. Existing fixed XP/75%merc share and save shape require no migration.

Actual synthetic claim/save/browser/mobile wiring is accepted in B–D; earned
boss/campaign acceptance remains required in later gameplay proof. Missing pillar documents prevent formal pillar alignment;
full balance/economy/first-kill guarantees remain open. No public delivery.
