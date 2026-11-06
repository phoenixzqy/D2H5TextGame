# Larzuk’s explicit side-quest item presentation

Status: implemented and accepted locally as bounded current26 functionality, 2026-10-29.
Independent design review APPROVE; producer plan review ready. Root owns
edits/integration; implementation and focused reviews pass, final integration
acceptance is in progress.
[BUG-383](../../production/bugs/BUG-383-larzuk-present-unreachable.md) records the
missing route. Ormus/current25 integration acceptance precedes literal25 freeze.

## Overview

Complete the preserved Larzuk side obligation from the
[Act V contract](compact-act5-contract.md#preserved-side-obligations): after
qualified Siege completion, explicitly Present eligible backpack gear unchanged,
Claim one independent socket charge in the journal, then select eligible gear
for the existing socket service. Keep the three player actions separate.

## Player fantasy

The smith offers an identifiable, useful crafting favor after a real victory.
The player chooses the gear and confirms its use, serving Discovery, Fantasy
and Competence without surrendering an item during presentation. The studio
pillar/anti-pillar files are absent; follow the canonical GDD and inherited
invariants. Owner playtesting follows implementation; this does not certify
campaign economy or full Act V side content.

## Detailed rules

Preserve `quests/side-act5-larzuks-sockets`, `obj-bring-item`, prerequisite
`quests/act5-siege-on-harrogath`, giver `npc/larzuk`, and the authored reward
`{service:'socket_item'}`. Keep the `deliver` objective as explicit, nonconsuming
gear presentation. Localized descriptions must say Present → journal Claim →
selected-item socket use, rather than implying automatic sockets or a handoff.

Present requires a hydrated, ordinary-action-ready hero, Normal difficulty,
actual current-town Act V Larzuk and unlocked Act V, no active combat or run,
a canonical tracked unclaimed side row, and qualified Siege completion using
`hasAct5Completion` after actual graph validation. Siege reward Claim or charge
use is not a prerequisite. Town retains its remembered field-area selection;
never require a fabricated town area or null `currentSubAreaId`.

Offer exactly the existing socket service’s eligible uniquely owned,
unequipped backpack instances: known weapon/armor; normal, magic, rare, unique
or set; canonical native socket state; effective capacity0 and no contents;
reviewed base maximum>0; no runeword ID/rarity. Exclude stash, hero/merc gear,
actor mirrors, quarantines and duplicate IDs. Extract a narrow shared socket
candidate predicate from the existing service machinery; Present must not
require an already-available charge. Preserve the actual instance identity and
deep payload witness from selection until execution. Reject stale, moved,
replaced or mutated selections rather than silently selecting a same-ID copy.

Successful Present publishes only completed `obj-bring-item`, status completed,
and true finite receipt
`quests/side-act5-larzuks-sockets#action:present-item` under the shared quest
transaction lease. The item retains its location, ID, payload, sockets and
equipment state. No custody, XP, currency, charge, sockets or automatic Claim.
Repeated Present cannot issue income. Completed/unclaimed proofless legacy
history may earn its missing real Present after the actual prerequisite.

Both Claim preview and execution require actual qualified Siege plus this new
Present receipt and exact completed objective. Claim publishes only
`quests/side-act5-larzuks-sockets#reward:service` as
`{serviceId:'socket_item',state:'available'}`, then claimed=true. Verify source,
side row/proof and exact retained side entry after every publication, including
claimed-last; preserve the independent Siege charge. Use scoped deep rollback
on silent observer mutation or throw, preserve unrelated writes and explicitly
report failed restoration. No allocation/RNG or hero/merc XP is involved.

Existing selected-item service consumes the chosen side charge once. Its gear
selection may differ from the earlier presented item. Preserve existing socket
math, item restrictions, source-graph requirements and item/source conservation.
No automatic regrant after consumption, salvage or deletion of the target.

## Formulas

Present income=0. Side Claim income=1 socket charge, heroXP=mercXP=0.
`availableSideAfterClaim=availableSideBefore+1` only for first lawful Claim;
`availableSideAfterUse=availableSideBefore-1` for the one selected source.
Main Siege source state is unchanged by both operations. The existing Siege
reward remains10000hero/7500mercXP plus its independent socket charge.

For `M=base.maxSockets>0`, the existing service grants `M` sockets to normal
gear and `min(1,M)` to magic/rare/unique/set gear. There is no ilvl scaling:
`M=4` yields4 normal sockets or1 for the other supported rarities. Reuse this
existing function; no duplicate formula or new numeric tuning. Present adds
zero sockets, and only the later use alters the selected item’s capacity.

## Edge cases and compatibility

Freeze literal25 authority, including actual Ormus item/quest/action/campaign
and charm ownership domains, before widening current receipt vocabulary.
Use save26. Read/migrate literal25 with its frozen readers and catalogs,
including raw, normalized and nested checks; never let a historical reader
capture the new current vocabulary through a live-loader default. Migration
validates its predecessor and changes only the version. Infer no proof, item,
completion, charge, compensation or new entitlement. Source snapshots retain
unknown historical fields under existing predecessor policies.

Current26 admits the one new own-data true receipt only with a canonical
completed source row, own objective=true and actual
qualified Siege graph. A claimed row with this proof must remain completed
and retain its objective/proof. Proofless completed/unclaimed history stays
inert for new Claim until actual Present. Preserve proofless claimed history:
existing available service remains usable, consumed service remains consumed,
and a claimed row with no entry receives no inferred replacement. Charsi’s
specific Restore exception does not apply to Larzuk.

Keep new issuance eligibility separate from validation of already-owned legacy
service entries. Universally requiring the new proof in
`hasQuestServiceSourceGraph` would wrongly invalidate existing possessions.
Malformed new proof or contradictory source is rejected; historic service
shape/eligibility remains its existing contract.

Selection and publication recheck readiness/context inside the lease. Invalid
prerequisite, wrong NPC/act/difficulty, active run, detached/duplicate item,
stale witness, reentry and repeat Claim/use make no participating writes.
Deep source and selected-item restoration conserves ownership across callback
moves/mutation while preserving unrelated journals/inventory writes. Restoration
failure is explicit. No claim of browser-crash atomicity is added.

## Dependencies

Existing validated side catalog → protected Present candidate/selection/action
→ current-town localized panel → finite source proof → guarded journal Claim
→ existing finite service wallet and socket consumer. Literal25/current26
readers, migration, snapshot/export/import and Continue retain exact ownership,
proof, objective, side/main source states and consumed targets.

## Tuning knobs

No combat, acquisition, socket-count, rarity or campaign tuning changes.
Gate knobs are authored prerequisite Siege, current-town Act V Larzuk and the
existing socket-item eligibility. Feel is an explicit unchanged-item preview
and at least44px controls at360×640; desktop and en/zh-CN show the same steps.
The one-charge reward remains authored JSON. No extra numeric mechanic.

## Acceptance criteria

1. Actual eligible-item Present after qualified Siege completes only its
   objective/proof without changing any gear or income; real selection and
   stale/duplicate/source/context/observer-fault controls prove conservation.
2. Explicit Claim creates one independent side charge; its later use changes
   exactly one eligible target and consumes that side source once. Main source,
   legacy possession and source-bound new issuance remain independent.
3. Literal25 acceptance and save26 migration/graph/snapshot checks pass causal
   tests. Production browser tasks in both locales at360×640/1280×800 cover
   Present→Claim→socket, named selected item, failed/repeat controls and exact
   export/import/close/reopen Continue. Owner playtest and earned campaign
   balance remain open.

## Proposed implementation order

1. Approve this contract and review the plan; complete Ormus/current25 checks.
2. Freeze actual25 save authority/catalogs and prove literal acceptance; add
   version26 migration/registration and current-only finite proof admission.
3. Extract the existing shared socket candidate rule with parity controls.
4. Protected selected-instance Present and scoped callback rollback.
5. Source-bound service-only Claim with exact retained publication checks.
6. Localized current-town panel/journal alignment and authored copy.
7. Production browser route, coherent local checks, independent evidence/code
   review and exact disposable cleanup; update the persistent ledger.

Each step is a bounded child card with no more than three outcomes; root owns
shared-file integration and tests. No CI, public deployment or remote change.
