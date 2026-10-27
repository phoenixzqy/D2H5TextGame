# D11 — Remaining Act I quests and services

2026-10-27. Focused GD/TD owner decision under the authorized P14 repair scope.
`[P14-ACT1-REMAINING-GD-TD]: APPROVE`. These are new owner decisions, not
historical approvals or runtime acceptance. Root records/integrates the contract;
the design-contracts owner performed read-only research and released readers.
Final independent plan review: `ready` after explicit legacy proof/entitlement
recovery was added; all readers released. No user decision blocks implementation.

## Shared constraints

Preserve all quest/objective IDs, six Act I/29 total areas, existing act access
and explicit Claim. No new act gates, historical-event backfill, genuine action
replay, positive gold or compensation conversion. Hero/previously-fielded merc
XP remains Cain2500/1875, Countess3000/2250, Malus3500/2625. Capture the merc
recipient before publication. Keep the accepted first-act route, ordered Talk,
Claim safety, deterministic quest-cache and compact Act III source contracts.

## Cain: physical scroll and explicit rescue

- Change `obj-inifuss-tree` to fetch `quest/scroll_of_inifuss` from
  `objects/inifuss_tree` in canonical `areas/act1-dark-wood`. Its exact source is
  `quests/act1-search-for-cain#objective:obj-inifuss-tree`. Reuse delivery recovery
  and its area-clear requirement.
- Change `obj-decode` to Akara Give, consuming that exact scroll source. Issue
  no decoded token.
- Keep `obj-rescue-cain` as explicit `objects/cain_cage` interaction at a
  ruined-village site inside Dark Wood. Require ordered tracked progress and
  the consumed scroll graph. Publish progress and the finite action receipt
  `quests/act1-search-for-cain#action:rescue-cain` together.
- Actual rescue makes Cain present in Act I town immediately. Add canonical
  Act I dialogue; rendering, Talk and services share one presence selector.
  Later-act presence remains independent. Remove redundant reward `npcUnlock`.
  Main Claim grants XP and permanent Identify.

Main and `quests/side-act1-cains-favor` service Claims alias one permanent
Identify ability. Either validated source Claim unlocks it; both create no
extra charge. The side retains real ordered Cain Talk after rescue.

## Identify

Offer a free explicit selected-item operation at any canonically present Cain
in an unlocked current town, including replay difficulty. Acquiring one-time
quest rewards remains Normal-only. Select a uniquely owned, unequipped actual
backpack weapon, armor, jewelry or charm with `identified:false`. Reject unknown
definitions, materials, bound quest objects, runewords, quarantine, collisions,
detached/stale copies and already identified items. Wearing requirements do not
apply. Change only `identified` to true; preserve every other payload field.
No RNG, cost, XP or automatic bulk operation. Localize the result.

This has a real existing consumer: Iron Golem refuses unidentified items.
Ordinary rares can be unidentified; successful unique/set materialization is
already identified. Hiding affixes in inventory is outside this repair.

## Countess: optional original-source victory

Use an explicitly selected Normal quest encounter in `areas/act1-dark-wood`:

```text
Source: {kind:'questEncounter', encounterId:'act1-dw-countess'}
Composition: exactly one boss-tier monsters/act1.the-countess
Level: 13; ordinary combat table: loot/act1-boss
Receipt: quests/act1-forgotten-tower#action:countess-victory
```

Level13 follows Dark Wood's manual boss convention9+1+3. Keep authored skills
and growth, with no companions, chapter-boss override or extra stat multiplier.
Entry requires tracked/unclaimed quest and unlocked Act I, not an earlier Dark
Wood clear. This single wave neither clears the area nor advances ordinary
challenge ordinals. Preserve ordinary Dark Wood plans. Proof disables further
quest-source entry; defeat permits retry.

Capture run/source identity, original hero and original Countess before combat.
Credit only accepted live settlement, original Countess dead/original hero alive
and pre-event eligibility under the transition lock. Generic matching kills,
replay, replacements, summons, draw and defeat provide no proof.

Claim cache is exactly `{"tableId":"loot/countess-runes","ilvl":13,"picks":1}`.
Keep nine named rune entries/weights, exact-ID materialization without act-pool
resampling/caps, strict quest-table generation, noDrop0/MF0/multiplier1 and the
existing private quest-table seed. Ordinary combat income is separate. Remove
standalone gold5000 with no replacement currency.

## Malus and independently earned imbues

Recover actual `quest/horadric_malus` from `objects/horadric_malus_cache` in
canonical `areas/act1-catacombs`, with existing delivery clear requirement.
Keep `obj-recover-malus` and its canonical objective source. Change
`obj-imbue-ready` to Charsi Give consuming the exact Malus. Require no Smith kill.

Main and side each grant one independent source-bound use, maximum two across
Normal and replay difficulty:

```text
quests/act1-tools-of-the-trade#reward:service
quests/side-act1-charsis-imbue#reward:service
```

For side `obj-bring-item`, add one finite explicit Present item action at
current-town Charsi, after main recovery/hand-in. Validate an eligible normal
backpack item, return it unchanged, and publish objective plus
`quests/side-act1-charsis-imbue#action:present-item`. Copy says presentation, not
consumption. No custody container, XP or automatic imbue. Side Claim grants its
charge. Remove legacy `items/imbued_rare_random`: selected-instance rare
transformation supplies the promised item, with no additional random item or
wishstone substitute.

## Deterministic selected-instance imbue

At current-town Act I Charsi, select one named available source and one uniquely
owned, unequipped, identified normal backpack weapon/armor. Require a legal
`canHaveAffixes` base, effective socket capacity0, no socket contents/affixes or
unique/set/runeword identity, and no quarantine/collision. Wearing requirements
do not apply.

Reuse production rare-affix generation and JSON rules:4–6 distinct affixes,
1–3 prefixes and1–3 suffixes, legal type/level bands and positive rare weights.
Preflight at least one valid four-affix combination; otherwise preserve the use.
Source level is positive safe integer `item.ilvl ?? item.level`. Seed:

```ts
hashSeed(JSON.stringify([
  'quest-imbue-v1', player.id, source, item.id, item.baseId, sourceLevel
]))
```

No hero level, MF, clock, idle bonus or combat RNG. Extract/reuse affix-only
generation rather than generating another item or rerolling its base/socket
properties. Change only rarity to rare, affixes, generated name to empty and
identified to true. Preserve identity, base rolls, levels, zero socket capacity
and other validated metadata. Atomically replace that instance and consume
exactly the selected source with its target ID. Same-source/identity/catalog
failed retries reproduce affixes.

## Transactions, saves and implementation order

Extend the finite service vocabulary with actual `imbue_item` and these two
Act I sources. Preserve all five existing Act IV/V mappings. Permanent Identify
derives from validated source claims without a charge entry. Freeze literal
predecessor22 rules, then use producer-owned save23 for the extended closed
service/action vocabulary. Migration preserves existing progress/items/history,
with no inferred charge, victory or rescue receipt and no reset/replay of genuine
consumed actions.

## Explicit legacy proof and entitlement recovery

`[P14-ACT1-LEGACY-RECOVERY-GD-TD]: APPROVE`. Independent plan review identified
that preserving old claimed flags without an explicit repair path would strand
promised services. This focused owner clarification resolves that gap; migration
still creates no proof or entitlement.

Frozen22 accepts completed/claimed canonical rows with missing or false objective
keys. Preserve them losslessly. For these finite Act I sources, a canonical
completed or claimed row may explicitly perform a missing source action despite
historical flags. Require its real physical predecessor graph, Normal source,
location and transaction guards; do not require future flags solely because the
old status says completed. Each actual action writes only its flag/receipt.
Keep completed status and the Claim bit. Other historical statuses may advance
when the real sequence finishes. Existing valid owned/consumed item steps and
proofs are reused without replay. Ordinary in-progress/unclaimed rows retain
their normal ordering. Do not loosen other quest validators globally.

First Claim requires the full actual Act I completion graph. A completed,
unclaimed legacy row earns missing proof before its ordinary once-only bundle.
A claimed row continues returning `already-claimed` without writes or further
quest XP, merc XP, cache or currency.

| Legacy source | Explicit repair and resulting availability |
| --- | --- |
| Cain main claimed | Recover scroll→Akara Give→cage Rescue, skipping valid source steps. Real rescue enables Act I presence; full graph plus the preserved main Claim enables Identify, without another Claim/XP. |
| Cain side claimed | Full real rescue graph, then fresh current-town Cain Talk. Publish `quests/side-act1-cains-favor#action:cain-talk` with `obj-talk`. Preserved side Claim plus that graph enables Identify; the old Talk flag alone does not. |
| Countess completed/unclaimed | Permit exact encounter while new victory proof is absent; qualified victory enables ordinary once-only Claim. |
| Countess claimed | Same absent-proof encounter, with normal fresh combat income but no repeated quest reward. New proof disables further entry. |
| Malus main claimed | Recover/Give missing real steps, then explicitly Restore imbue reward at current-town Normal Charsi. |
| Charsi side claimed | Require actual main hand-in and missing eligible-item Present, then separately Restore imbue reward. |

Restore imbue reward accepts only the two exact named service sources. Require
its preserved claimed row, full physical/action graph and complete absence of
that exact service entry. Publish one available `imbue_item` under that source.
Change no quest flags, Claim bit, XP, inventory item or other reward. Existing
available **or consumed** entries always prevent replacement, even after the
consumed target was salvaged. Never infer absence from target ownership, convert
invalid entries to availability, or repair both sources in one request. Repeats
return already available/consumed unchanged. Use guarded publication,
post-publication graph checks, participating rollback and explicit restoration
failures.

Compatibility verification includes valid22 complete and partial claimed/unclaimed
journals; each missing source earned/saved midway; unchanged quest income during
claimed repair; once-only unclaimed Claim; refusal for available/consumed imbues
with absent targets; and mutate-then-throw retry producing one charge. This needs
finite extensions to Cain rescue/side Talk, Countess admission, Charsi Present
and delivery eligibility; generic completed/claimed refusals cannot implement it.

Refuse hydration/import/replacement, active combat/run, wrong town/source,
invalid graph, duplicate ownership, stale selections and reentrancy. Prepare
privately; publish under the shared quest lease; verify live context and selected
instance/source afterward. Restore all participating slices/locations on failure,
preserving unrelated writes. Attempt every restoration and aggregate failures.
Claim retains whole-bundle preflight and claimed-last behavior.

Implement as bounded dependent cards: literal predecessor22 boundary, then
save23/finite vocabulary; Cain recovery/rescue; permanent Identify; Countess
admission/cache; Malus recovery; deterministic imbue and side presentation.

The first card freezes authored quests/stages/service rewards, item/action
sources, persisted Act IV/V proof triples and Act V reciprocal action/potion/
cage/Throne graph, the original five service mappings, Nightmare area whitelist
and achievement-title identity. Bind one immutable domain through both raw and
normalized quest/campaign/endgame checks. A `QuestStateDomain` alone currently
skips Act V validation and is insufficient: action-item source resolution,
service claimed rows, Halbu's Hellforge graph and nested endgame access must use
the same domain. Preserve current post-migration Life/resistance/cache repair
semantics; a stat-composition refactor is unnecessary.

Verify literal22 partial completed/claimed journals losslessly, all five service
sources available/consumed even after target salvage, rejection of future Act I
sources/proofs/imbues before migration, retained reciprocal-graph refusals and
frozen behavior despite deliberately changed live definitions. Decode Golden
Bird/Tainted Sun/Rescue/scroll/runeword examples to check resources and existing
cache repair. This mapping was independently researched read-only by the
technical owner; no implementation or new policy is implied.

Each card needs causal
failure, meaningful negatives, compatibility/rollback checks, focused checks,
current integrated full/type/lint, and independent review. Finish ordinary
en/zh mobile/desktop recovery→Claim/service→Save-close-Continue paths before
quest acceptance. New definitions or flags alone do not satisfy the contract.

Evidence anchors: GDD§§6.3,7.2–7.3,8; accepted D07/D11 first-act route,
D11 Talk/Claim-safety/Duriel rewards/compact Act III; `main.json`, `side.json`,
`quest-items.ts`, `interactObject.ts`, `act4-admission.ts`, `questServices.ts`,
`rarity-rules.json`; compact Act V independently funded side-source precedent.
No unresolved owner/user decision blocks this contract. Runtime balance,
earned acceptance and full C0–C4/G0–G7 remain open.
