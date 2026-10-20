# Explicit unique quest rewards

## Overview

Give a completed quest one named unique item through an explicit claim, with
readable localized preview and the existing synchronous whole-bundle settlement
guarantee. Design and technical/producer gates approved this new bounded design;
the source does not establish an original intended Andariel unique identity.
Delivery is A representation/preview, B generic claim/persistence, C authored
Andariel activation. None is earned boss or full campaign acceptance.

## Player fantasy

A clear named reward supports Discovery and Competence: players can recognize
what they will receive and find the exact item after claiming. The class-neutral
Coif has no required weapon or skill build and need not be an upgrade. Player
choice to claim stays explicit; full inventory retains the reward in visible
recovery overflow. The presentation names the item without exposing metadata.
The referenced pillars/anti-pillars documents are absent in this checkout;
review against the canonical GDD and explicit invariants instead. Formal pillar
alignment and experiential balance are not established by this prerequisite.

## Detailed rules

Preserve every accepted string `itemDrop` shape. Add a closed object variant:
`{ "uniqueId": "items/unique/coif-of-glory", "ilvl": 19 }`. Require both fields,
canonical `^items/unique/[a-z0-9-]+$` syntax and positive integer ilvl, with no
additional properties or campaign cap. Schema acceptance remains syntax only.
Strings remain unsupported by execution. No quantity or rarity is needed: the
object means one exact unique. Leave objective item IDs unchanged.

Preview one gift chip using the exact unique template's localized `name` through
`tDataKey`, with the items namespace loaded. Missing or ambiguous templates show
`quests:rewardLabel.uniqueItem`. Preview never creates an item, consumes RNG,
grants anything or shows raw object/ID/level metadata. Existing reward formatting
remains compatible.

The generic claim holds the existing global guard through validation, preparation,
grants and restoration. Validate the entire reward bag before any item construction
or store write. Keep numeric/gold0 behavior; positive gold, lootTable and other
unsupported kinds refuse the whole bag. Resolve exact unique through the new
`rollUniqueItem` with full loaded catalogs and a fresh deterministic attempt RNG.
Expected lookup/eligibility refusals return unsupported-rewards; constructor/RNG
exceptions become grant-failed. Item-only claims are nonempty rewards.

Append through existing retained-overflow `addItem`; mark the quest claimed last.
Restore participating backpack/currencies/player/merc/progress on synchronous
failure, including mutate-then-throw, preserving unrelated fields/actions. Attempt
all restorations and retain existing AggregateError semantics. Save/hydration must
preserve the exact paid item and claimed flag; later claims pay nothing. This is
settled synchronous state, with possible intermediate publications; no new crash
atomicity promise or save-format change.

After generic validation, change only Andariel's reward bag to existing8000XP,
skillPoints0 and one Coif ilvl19. Remove only its quest lootTable reference. This
deliberately chooses one unique instead of the ambiguous item/table combination;
the quest table's random equipment/currency possibilities are not also granted.
Normal boss loot and the unused table remain unchanged. No gold conversion,
kill-award call or automatic reward on objective completion.

## Formulas

One item per supported explicit object. Eligibility is
`ilvl >= (template.qlvl ?? template.reqLevel)`; output level is
`max(ilvl, template.reqLevel)`. Coif has reqLevel9 and no qlvl; ilvl19 succeeds.
Existing Coif template retains fixed lightning resistance15, defense20 and life10;
stored statRolls is empty and base defense rolls10–14 from base12.

Seed each attempt with
`hashSeed(JSON.stringify(['quest-unique-v1', player.id, quest.id, uniqueId, ilvl]))`
and `createRng`; never use time, claimant level, current area or combat RNG.
Retries with the same identity/config/catalog reproduce rolled properties.
Unpublished instance IDs may change because allocator gaps are allowed; never
rewind shared allocation. No persisted seed ledger is required.

Andariel quest grants8000 cumulative XP through existing gainExperience; normal
level/milestone points follow existing progression. Explicit extra skill points=0.
Existing fielded merc share is75%, thus6000XP before progression limits. No fielded
merc is valid. Combat/offline multipliers do not apply to this fixed quest reward.

## Edge cases

Unknown/duplicate unique IDs, missing/mismatched base, unmet eligibility or invalid
levels refuse before allocation. Unknown reward keys refuse regardless of key
order, before construction/grants. Legacy strings remain structurally accepted and
unsupported. Item-only claims work. Full backpack retains one earned item; stash
and equipped state remain untouched. Nested same/other quest claims refuse while
the guard is held, including preparation and restoration. Pending save replacement
refuses. Failure restores participating data; successful retry cannot add duplicate
items or numeric payment. Restoration failure throws instead of claiming recovery.

## Dependencies

JSON → quest schema/loaders → QuestsScreen preview and shared claim boundary →
exact engine constructor → inventory/player/merc/map stores → existing save adapter.
Use [exact unique construction](../plans/decisions/D08-exact-unique-materialization-v1.md)
and [claim safety](../plans/decisions/D11-quest-claim-safety-v1.md).
Code remains strict TypeScript/React18/Zustand/Ajv/i18next. Runtime engine imports
no catalogs or DOM. Authored and saved item shapes are distinct; no migration.

## Tuning knobs

Feel: explicit claim timing/readable one-chip preview; preserve current interaction.
Curve: fixed quest XP8000 and existing Coif stats, unchanged until campaign balance
evidence exists. Gate: authored unique ilvl19, grounded in current canonical Act1
boss level; do not substitute claimant level. Item identity and ilvl live in JSON.
No drop-rate, attack-speed, ordinary TC or currency changes belong in these cards.

## Acceptance criteria

A: unchanged legacy loader controls; both public APIs/documents accept only the new
closed object grammar without mutating identity/bytes. Actual names and unknown/
ambiguous fallback render in zh-CN/en without raw metadata, allocation or store
changes. B: real unique-only/mixed success exactly once, whole-bag refusal, all
participating rollback/retry/nested/import/overflow cases and real debounced
save/export/hydration equality. C: actual authored Andariel bundle passes generic
claim/persistence and leaves normal boss rewards unchanged. Production localized
desktop/mobile claim/save visual proof and earned victory remain explicit later
acceptance work; synthetic completion is wiring proof only.

For each card, independently review plan and frozen genuine capability RED before
runtime changes; preserve failed attempts and assertions. Run scoped Vitest,
`npm test`, `npm run typecheck`, `npm run lint`, then
`npm run check:test-bridge-shake` after tests exit. Keep unchanged80% engine gate
when engine coverage is applicable. Own exact files/RAW paths in card plans;
commit evidence and closing ledger separately, remove disposable task-owned
artifacts after consumer releases. No dependencies, CI policy, secrets, public
deployment, pushes, PRs or merges are authorized by this spec.

No owner preference is required for this recorded delegated design decision.
Final economy, first-kill unique guarantee, other quest reward kinds and ordinary
earned campaign proof remain open and cannot be inferred from these prerequisites.
