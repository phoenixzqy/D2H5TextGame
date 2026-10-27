# BUG-321 — Seed the quest reward oracle from the preclaim item IDs

Status: Locally resolved; correctly seeded exact oracle and zero-action durability pass.
Evidence/fix commit: `3768356e` (task-local oracle correction; no product change).
Severity: Medium (campaign QA oracle; genuine claimed state is preserved).
Owner: qa-engineer / root campaign driver.

## Reproduction

1. Runtime `2850de61`, validated production build `8fc0ae32`, bundled Chromium,
   360×640/en. Quest loot seed is production-derived from the real player ID,
   quest ID and authored table/ilvl/picks; no native seed is supplied.
2. The task-local pure `expected-reward.mjs` calculates Eve's table rewards in
   a fresh module context without seeding its item-ID sequence from owned items.
3. During no-action verification of the already-claimed genuine stopped export,
   compare both actual reward equipment payloads against that oracle.

Expected: exact reward payloads and IDs calculated from the actual preclaim
ownership baseline, with the ordinary hydration sequence initialization.

Actual: all non-ID payload fields match, but the oracle IDs end in `-1`/`-2`;
actual IDs end in `-l2h`/`-l2i` (27,305/27,306). The genuine preclaim maximum
sequence is 27,304. Recovery stops without any claim or combat action and
preserves the claimed export unchanged.

## Cause and evidence

`src/engine/loot/rollItem.ts:18` combines seeded entropy with a module-local
sequence. `seedItemSeqFromIds` advances that sequence after hydration. The pure
oracle omitted this required setup and used the pre-preparation fixture rather
than the actual post-battle preclaim ownership baseline. Gameplay is correct.

Task root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-baal427-nfhiv849`

Preserve `expected-eve-reward.json`, `expected-reward.mjs`,
`native-eve-recovery/report.json`, log, failure screenshot and stopped export.
Original process 39809 exited 1 and was consumed; zero actions were clicked.

## Correction and acceptance

Keep the original failed oracle/evidence. Calculate a separate expected reward
using `native-baal427/final.json.gz` and public `seedItemSeqFromIds` over all
owned equipment before rolling. Retain the full exact item-ID/payload comparison.
Verify from the latest genuine stopped claimed state, with zero Claim/Enter
actions, the disabled localized claimed button and exact Save/close/Continue.
No product changes, excluded ID fields or reward replay are warranted.

## Verified result

Separate `expected-reward-seeded.mjs` seeds the sequence from all actual preclaim
owned equipment before rolling. Exact reward IDs `it-6263r-l2h`/`it-6dv2y-l2i`
and every item field match; XP40000, rune-shards143578 and Ist1/Vex1 also match.
Final recovery process59034 exits0 with zero gameplay actions, exact stopped
export equality and durable disabled Claimed observation. All27238ancestral
item payloads remain intact across48saved snapshots; final27306IDs are unique.
[Integrated evidence](../../docs/plans/evidence/d11-earned-baal427.md) retains
both original observer failures, corrected oracle, recovery and cleanup receipts.
