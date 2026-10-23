# D11 / P14 — compact Act IV main-flow contract

Status: design/technical implementation contract ratified by the existing
design-contracts and producer agents on 2026-10-23. Implementation and QA
acceptance are separate and remain open. Root records the reviewed decisions
here so later implementation does not depend on scratch conversation history.

This extends the [Act III contract](D11-compact-act3-contract.md) to the three
Act IV main rows. Preserve all 46 quest IDs, 29 authored areas, seven Act IV
main objectives and five Act IV areas. Side quests and their promised services
remain accountable separately. Keep act-wide Enter and completed quest **OR**
canonical boss-area clear transitions. No monster/planner/spawn tuning or new
Enter gate is authorized by this contract.

## Original-source victories and finite proof

Capture immutable canonical encounter metadata and original members before
simulation. Only the accepted live settlement of those original members with
the original living hero can publish quest credit and its finite receipt.
Snapshot quest prerequisites before ordinary income/events and recheck at
guarded publication. Preserve original-bound valid replay; stale, recaptured,
duplicate, replaced or synthetic authority cannot qualify. Direct generic kill
events cannot bypass admission. Existing ordinary combat rewards/clears remain.

| Quest | Canonical source | Required proof |
| --- | --- | --- |
| `quests/act4-fallen-angel` | `areas/act4-plains-of-despair`; bossEncounter `act4-pod-izual`; original `monsters/act4.izual` plus two `monsters/act4.oblivion-knight` companions | `quests/act4-fallen-angel#action:izual-victory` |
| `quests/act4-hellforge` | `areas/act4-river-of-flame`; bossEncounter `act4-rof-hephasto`; original `monsters/act4.mega-demon` plus three `monsters/act4.pit-lord` companions | `quests/act4-hellforge#action:hephasto-victory` |
| `quests/act4-terrors-end` | `areas/act4-chaos-sanctuary`; chapterBoss `monsters/act4.diablo`, original final chapter-boss unit; all three seals true before that event | `quests/act4-terrors-end#action:diablo-victory` |

Do not fabricate an authored encounter ID for the Diablo chapter override.
All original members, not matching archetype counts or replacement enemies,
must satisfy accepted-win checks. Wrong act/area/source/tier/unit, partial
outcome, draw, defeat, dead hero and duplicate settlement are negative cases.

Early Diablo wins still pay ordinary income, clear Chaos Sanctuary and may
unlock Act V through the preserved OR rule. Breaking seals later never
backfills credit; a new eligible canonical victory is required. Existing
completed/unclaimed rows can acquire missing proof from an explicit new
canonical encounter, preserving completed history. Diablo still requires all
three pre-event seals. Claimed rows never repay or acquire a second reward.

## Actual Hellforge inputs and explicit action

The qualified Hephasto win establishes `obj-kill-hephasto` and its proof, not an
automatic hammer. Explicit Recover at `objects/hellforge_hammer_cache` creates
one owned `quest/hellforge_hammer` at
`quests/act4-hellforge#objective:obj-kill-hephasto`. Require the real proof at
the canonical current River of Flame location. Bare objective/clear flags
supply no item. Keep this as a closed encounter-consumable item variant.

The explicit `actions/act4-shatter-soulstone` at `objects/hellforge` requires
an eligible tracked Hellforge row, the owned hammer and the actual owned
`items/soulstone_mephisto` at `quests/act3-guardian#reward:questItem` with the
complete valid Guardian/Orb/consumed-Will/components/Cube/Council graph.

Atomically consume **both** hammer and Soulstone, set existing `obj-shatter`,
complete Hellforge and publish
`quests/act4-hellforge#action:shatter-soulstone`. Recover and Shatter grant no
XP, currency or replacement item. The Cube remains owned. Extend the shared
action family to two exact source-bound inputs; the Act III Orb action keeps
its existing one-input behavior. Wrong source, consumed/missing input, missing
proof, wrong location, reentry and duplicate actions are refusals.

## Serial seals and separate Claim

Keep `obj-seal-1`, `obj-seal-2`, `obj-seal-3` at
`objects/diablo_seal_1`, `_2`, `_3` in canonical Chaos Sanctuary. Explicit
interaction advances them in that order using the existing stage family.
Opening an object panel grants nothing; one event cannot cascade through later
seals. Seal interactions grant no XP or combat credit. A new original Diablo
victory after all three seals sets `obj-kill-diablo` and completes Terror's End.

| Main Claim | Hero / fielded merc XP | Other payload and eligibility |
| --- | --- | --- |
| Fallen Angel | 9000 / 6750 | +2 unspent skill points; matching Izual proof required |
| Hellforge | 7000 / 5250 | `{tableId:'loot/hellforge-runes',ilvl:56,picks:1}` and `gemShards:3`; actual consumed two-input graph and proof required |
| Terror's End | 25000 / 18750 | `{tableId:'loot/diablo-q',ilvl:61,picks:5}`; matching Diablo proof required |

Main totals are 41000 hero / 30750 fielded-merc XP and +2 skill points, apart
from normal level-up points. The separate Tyrael side reward of two skill
points is additional, not folded into Fallen Angel.

`gemShards` is a generic positive safe-integer reward routed to `gem-shard`.
Preserve existing direct `gems`, `runes` and `runeShards` semantics. Aggregate
direct gem shards with cache gem output at the actual destination before safe
total validation. No per-quest currency branch. Three shards is a bounded
ratified design choice, **not a measured economy result**. The existing eight
rune-table weights 80,70,…,10 remain; aggregate rune-shard delivery is accepted
for this flow. Full named/socketable materials and P12 remain open.

Use existing private seeded cache preparation, legal materialization, lossless
overflow and guarded Claim rollback. Hellforge56 follows the existing Hephasto
formula `round((51+1+3)+(53-51)*0.5)`; Diablo61 is the existing bound. Claim is
separate from completion and pays once. Preserve all unrelated balances/items.

## Save, transaction and UI acceptance

Freeze literal v15 definitions and its owned-only Soulstone domain before
widening current validation to v16. Preserve frozen v14 too. Migration to16
changes version only: no inferred proof, item, consumed state, reward, reset or
XP. Reject future A4 receipts/hammer/consumed Soulstone in v15 input before
migration. Historical claimed Guardian missing Soulstone requires a separately
defined explicit repair; import never mints it.

Validate the complete actual ledger/progress/receipt graph prospectively.
Keep the shared quest lock across writes and rollback; reject reentry and
save replacement. Restore every participating named slice after before-write
and mutate-then-throw failures, preserve unrelated writes, attempt every
restoration and report AggregateError explicitly. Do not claim observer-wide
or crash atomicity. Validate combined safe XP/point/currency totals before any
publication; retain overflow and original-bound replay behavior.

Town data must discover Cain, Tyrael, Jamella and Halbu in both discovery paths
with exact Act IV identities and bilingual dialogue/copy. Opening NPCs is
inert. Act-specific Cain greeting must not resolve to Act III copy. These town
docs do not claim completion of all side services.

Use stable generic Recover/Shatter/seal/Claim controls with localized names,
prerequisites, input consumption and reward previews; no raw JSON keys.
Acceptance needs causal engine/store/data/save/transaction tests, independent
review, and actual production controls in both locales at 360×640, 412×915,
640×360, 1280×800 and 1920×1080. Cover wrong authority, early win/no backfill,
serial seals, exact once-only rewards, no-action XP, full item consumption,
duplicate/reentry/rollback, legacy no-mint and exact staged Save→close→new-page
Continue. Constructed inputs prove functional wiring only. Earned campaign,
manual screen-reader, pacing, C2–C4 and full G0–G7 acceptance remain distinct.
