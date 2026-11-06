# P15 — Native stash room for owned Bow preparation

Type: explicit evaluation-policy addition. Date: 2026-11-02. Owner: root.
Related: [owned defense](P15-bow-owned-survival-v1.md),
[bounded retries](P15-bow-area-retry-v1.md).

The completed authority71 diagnostic records 744 native `backpack_full` refusals
for selected owned stash upgrades and only three successful retrievals. Final
capacity is 117 backpack / 99 stash. Preparation runs before ordinary capacity
recovery; available stash space is not used to retrieve the selected candidate.
This establishes an evaluation limitation, not the cause of the Lost City losses
or a production inventory defect. Preserve that terminal diagnostic unchanged.

Add the separately named `amazon-bow-survival-managed-v1`, equal to owned-v1
except for `survivalRetrievalPolicy: stash-room-v1`. Only its Act II owned survival
selection uses managed retrieval. Default retrieval and all earlier profiles keep
their existing refusal behavior. Permit this profile in the existing bounded
Act II retry execution without changing retries, training or budgets.

Before a selected stash candidate is retrieved, calculate the number of backpack
items that must be moved to leave one free slot, including existing earned
overflow. At an idle boundary, preflight enough free stash slots and movable
backpack items, excluding equipped items and the current hero's Iron Golem
selection. Move exactly the needed items in ascending ID order using native
`moveToStash`, recording each committed transfer, then retrieve and equip through
the existing native actions. Never salvage to make this room. If the complete
staging plan cannot fit, retain the native retrieval refusal and exact state;
do not make partial transfers. Stop on unexpected native failure or recorder
error; committed actions remain committed and visible to the caller.

Acceptance: constructed checks cover full/overflow backpack, exact item custody,
currencies/materials/XP/current pools, hero and merc native equips, deterministic
staging, protected selection, insufficient stash without partial mutation,
default refusal, idle guard and recorder failure. Profile/dispatch checks cover
registration and opt-in wiring; existing selectors keep their old contracts.
Run only affected checks, scoped strict types and explicit lint.

Before any gameplay diagnostic, freeze all inputs, policy, creation clock/native
seed derivation and budgets. Use a fresh history; do not extend an exhausted run.
Retain failures and costs. This policy does not grant population, pacing or
balance acceptance; all private-v1 requirements and 0/210 accepted cells remain.

Plan review: ready; native custody, preflight, overflow, protected items, explicit
opt-in and unchanged historical profiles are covered. Security check: pass;
authorized local evaluation code/tests/docs only, no production changes,
dependencies, network, grants or privileged actions. Root-only, no installs,
commits, pushes or publication; affected checks only. Existing implementation
authorization overrides generic skill confirmation/delegation/full-suite steps.

## Verification and outcome — 2026-11-02

Implemented;144 distinct affected cases,scoped strict types and lint pass.
The fresh authority72 pilot has55 native staging transfers,five successful
retrievals and zero refusals. Independent journal/save/custody readback passes.
It clears three Act II route areas but loses all three Lost City wave3 attempts;
terminal21/nextNormal219. Do not extend its exhausted history or promote this
single diagnostic to balance acceptance. See the [outcome report](../../balance/2026-11-02-bow-managed-stash.md).
