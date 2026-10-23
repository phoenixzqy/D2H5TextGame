# D10 v18 material integration

2026-10-23. Local `feat/playable-foundations`; implementation in the claimed human worktree2. Full private v1 remains active through C0–C4/G0–G7. This checkpoint does not close D10 Slice A, earned ActII/C2, sockets, crafting, roster, endgame or pacing acceptance.

## Result

The69-ID catalog now survives acquisition, grant planning, native/quest/idle settlement, inventory and combat summaries, measurement and native v18 persistence. Numeric rune/gem totals describe concrete holdings; only actual shard/wishstone fields pay those currencies. Historical anonymous currency keys remain conserved, without inferred material reconstruction.

| Area | Integrated behavior |
| --- | --- |
| Acquisition | Explicit authored IDs retained; generic identities use authored/live act-difficulty pools and the existing conditional RNG variate, with no extra draw. Invalid identities, incomplete gear materialization and unsafe counts refuse the entire bag. |
| Ownership | Shared pure planner validates summaries, arithmetic and IDs across backpack, stash, hero equipment and all merc equipment. Each live consumer supplies current ownership. |
| Native settlement | Prepare the whole wave and cumulative reward bag before XP/pity writes; rebase the same prepared bag on current inventory after observers. Restore participating stores and hidden ActV sequence under the existing lease on failure. Preserve failed closed receipt and immutable prepared diagnostics; no reroll or duplicate payment. |
| Quest / idle | Initial whole-bag preflight precedes XP. Quest rechecks remaining exact grants before each add action; idle uses functional current-inventory publication and actual selected difficulty. Both restore participants on failure and report restoration failure explicitly. |
| Persistence / UI | Required strict v18 material ledger; frozen v17 validation and pure empty-ledger migration; reset/snapshot/import/Continue conserve exact counts. Bilingual inventory lists all69 IDs and future uses honestly; combat displays localized concrete loot and wishstones, including material-only bags. |
| Measurement | Signed material deltas and material-only award detection. Explicit validated v17→18 empty-ledger/version projection preserves immutable raw fixture/hash lineage and refuses nonempty ledgers. |

Integrated commits before final acquisition/consumer commit: `1a8cb31` (save), `42ff6bd` (inventory UI), `c9fe899` (native settlement), `1677253` (sim compatibility), `3c02cc2` (combat UI). Final acquisition/consumer commit: `10a63d9`. The complete final source passed the integrated gate; later evidence-only commits do not change runtime/test payloads.

## Validation

| Check | Result |
| --- | --- |
| `npm run test:engine -- --no-cache` | PASS4826 tests/134 files,39.11s; final ownership-aware source |
| Focused shared planner/quest/idle/native settlement | PASS71 tests/4 files, including observer hazards and conservation controls |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, including engine purity |
| Production `vite build`, `VITE_E2E` unset | PASS; output isolated outside repository |
| Production bridge scan | PASS5 JS chunks, same five forbidden patterns as `scripts/check-test-bridge-shaken.mjs`; existing shared `dist` preserved |
| `npm test -- --no-cache` | PASS10309 tests/368 files,2 existing opt-in skips,232.87s |
| Independent source review | QA: no blocking finding after current-destination and all-owned-location corrections; idle/acquisition review also clear |

The build retains the existing generated art manifest precache size warning (2.57MB); this material checkpoint does not accept the complete offline/PWA gate. An earlier full run was stopped by exact verified task process group when independent review required the additional ownership fix. It is not counted as passing validation.

The seven duplicate-ownership full-suite failures came from two constructed start helpers minting the same cap ID on repeated runs; their synthetic gear IDs are now unique within each retained inventory. The eighth expected partial terminal publication: the revised recovery assertion requires complete player/inventory/run-reward rollback, absent terminal actions, parked receipt and timer/remount safety. The corrected quest/Council files pass76 cases; the combat screen passes54. No runtime source was changed to bypass these failures.

Causal evidence: BUG112's original independent42-case reproduction failed34/42; root acquisition+sampling failed46/54 before implementation. Whole acquisition then passed210 loot cases. Quest observer regressions failed4/26 before rechecking current destinations. Shared ownership+stash regressions failed2/47 before checking other owned locations; current focused71 cases pass. See [BUG112](../../../production/bugs/BUG-112-quest-cache-material-identity.md) and [BUG113](../../../production/bugs/BUG-113-quest-reward-destination-drift.md). Historical fixture bytes, raw hashes and prior earned-route policy remain unchanged.

Worker evidence is scoped: native480/13, sim640/28 with2 existing opt-in skips, combat summary10 bilingual UI cases and the prior inventory browser2/2 seven-size proof. The full integrated result above controls the combined source. Inventory browser inputs were constructed: they establish UI/save conservation, not acquisition earned in combat.

## Remaining acceptance and next card

Earned material acquisition→inventory→manual Save→close→new-page Continue still needs a separately frozen production browser plan, authentic earned input/hash, ordinary controls, source/build freeze and independent evidence review. A proposed bounded next card is one declared bounded ActI Catacombs run from the retained earned L24 checkpoint, with exact next run ordinal and no retries or altered RNG. Freeze/review that plan and the actual input before execution. No permission to repeat the old frozen Radament challenge follows from this checkpoint.

The earned campaign remains stopped in ActII. The authentic L24 preparation's Radament draw supports the recorded cadence/mitigation concern for that build; it proves no winning alternative and no all-build balance conclusion. Full crafting/socket/runeword vertical paths, the seven-class/213-skill acceptance matrix, endgame and30–50 active-hour campaign pacing remain open.

## Artifact lifecycle

All worker dependency copies, temporary configs/caches and disposable symlinks were removed; their clean worktrees were released through `git-worktree`. All root task processes finished. The isolated production build was removed after its scan. Root consumed the diagnostics, recorded final results here, then removed and verified absent the exact task-owned directory `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-d10-materials-68zlesc4`. No cleanup failure remains for this integration. Shared caches, pre-existing `dist`, original checkout and immutable requested evidence are preserved.

Earlier required ActV diagnostic evidence remains at `/tmp/d2h5-a5-integration-650ka_is`, unchanged by this integration. Root owns its later removal after the existing evidence consumers finish; it is not a live build/server or this slice's disposable output.

Security check: PASS for bounded local material/save/grant/UI/sim work; no credentials, network destinations, permissions, CI policy or validation bypass changed. No push, PR, merge or deployment performed.
