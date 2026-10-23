# BUG-113 — Recheck quest inventory destinations during Claim

- Status: Fix implemented; final integrated validation in progress.
- Severity: High (Claim can retain unsafe balances or duplicate gear IDs).
- Owner: engine-dev; shared quest reward boundary.
- Build: `3c02cc2` plus the pending D10 acquisition/quest integration.
- Environment: Vitest 1.6.1 UI project; browser viewport and locale not applicable.
- Seed: deterministic quest cache seed from `cache-fixed`, `quests/act2-seven-tombs`, `loot/duriel-q`, ilvl32, picks5; regression retains the prepared bag without rerolling.
- Affected systems: quest Claim, XP observers, inventory ownership and currencies.

## Reproduction

1. Prepare the ordinary completed Duriel quest and a valid cache with one gear item, one shard, one wishstone and one Ral rune.
2. Subscribe to player XP publication and set the shard destination to `Number.MAX_SAFE_INTEGER`, or insert the exact pending gear ID.
3. Alternatively do the same from the first currency publication, overflowing wishstones or inserting the pending item.
4. Claim the quest through `claimQuestReward`.

Expected: the same prepared bag is checked against the current destination before each inventory publication; refusal restores participating state and leaves Claim retryable.

Actual: the earlier preflight passes, XP/currency observers change the destination, and raw add actions commit an unsafe balance or duplicate item ID. Claim returns `ok`.

## Evidence

`src/features/quests/questTableReward.test.ts`: four observer regressions fail with `expected ok to be grant-failed`; the original22 cases pass. Task diagnostic `quest-observer-red.log` is disposable after its results are retained here. No browser or earned campaign acceptance follows from this test.

## Root cause

The shared bag planner reads inventory before XP, while subsequent synchronous store publications allow inventory to change before the corresponding add action. Independent follow-up also reproduces the same pending ID inserted into stash by an XP observer: Claim returns `ok`, creating duplicate ownership across containers. A shared planner regression requires collision checks against stash, hero gear and merc gear. The two added tests fail while45 controls pass.

Keep the initial whole-bag preflight and revalidate the remaining prepared bag at each actual publication boundary. Do not reroll or overwrite intervening valid writes.

## Fix and verification

Claim keeps its initial full preflight and rechecks the unchanged remaining bag against current inventory before each add action. Successfully published currencies/items leave the remaining bag only after their add returns. The shared planner checks IDs across backpack, stash, hero equipment and every merc equipment map. All native, quest and idle callers supply current ownership. Failure restores Claim participants, retains separate stash writes, and does not claim or reroll.

Four observer regressions were RED4/22 controls before correction, then GREEN. A further shared-planner and stash observer regression were RED2/45 controls, then GREEN. Final focused planner/quest/idle/native settlement validation passes71 tests across4 files; two successful observer cases verify legitimate writes survive. Independent QA rereview reports no blockers. Full integrated results are recorded in `docs/plans/evidence/d10-materials-integration.md`; no earned campaign/browser claim is made here.
