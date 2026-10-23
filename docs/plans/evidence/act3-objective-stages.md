# Act III prerequisite foundation: objective stages and frozen v14

2026-10-23; local branch `feat/playable-foundations`, implementation parent
`a1d0101`. Foundation only; the five Act III flows remain open.

Optional `QuestDef.objectiveStages` is a closed, complete partition of unique
objective IDs. Peers are unordered; every earlier stage is required. Omission
preserves serial behavior. A pure helper is shared by explicit item actions,
object/Talk/clear/kill/boss events and live receipt validation. Events use the
pre-event flags; recipe inputs must precede assembly by stages, independent of
display order. Unknown IDs and non-own/non-true flags fail closed. The loader
rejects empty, duplicate, unknown or omitted stage IDs and duplicate objective
identities. [ADR-007](../../decisions/ADR-007-explicit-quest-objective-stages.md)
records the decision and its limits.

Literal frozen v14 validation preserves the historical serial Book/Cube/Shaft/
Amulet/Staff graph, consumed-item reciprocity and explicit completed/claimed
repair receipts. It runs after migration to v14 and before future migrations or
live validation. Historical versions through v14 reject a present reserved
`map.questReceipts` before normalization, including non-JSON values. Future
live definitions and stages cannot widen historical validation.

No authored quest data, save version or fields changed. This grants no item,
proof or reward. Cross-quest Cube and action consumers, v15, Council/Orb/Mephisto
admission, five complete flows, rewards and town/UI/persistence acceptance remain
required by the [frozen contract](../decisions/D11-compact-act3-contract.md).

Validation against the final corrected source:

| Check | Result |
| --- | --- |
| `npm test -- --cache=false` | 9190 tests / 310 files PASS; exit 0; 219.07s |
| Engine suite | 4385 tests / 114 files PASS; exit 0; 60.67s |
| Focused final behavioral set | 451 tests / 7 files PASS |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0; engine purity included |
| Production build, `VITE_E2E` unset, isolated outDir | exit 0 |
| Equivalent repository test-bridge forbidden-token scan | all 4 emitted JS chunks pass |
| Frozen source/test inputs | 15 hashes match; drift [] |

All 24 peer acquisition orders are covered in pure object events. Real production
recovery/assembly APIs work with reverse display order and real receipts; flags
alone cannot assemble. Store cases cover Talk, clear, kill and boss stages.
Save regressions preserve partial repair history and reject future proofs/live
stage widening. The initial causal RED retained 10 behavioral failures with 410
passes; recipe RED retained 2 failures / 17 passes. A test setup attempt used
nonexistent areas; actual compact areas corrected that fixture. An initial
full 9190-test pass preceded one equivalent lint correction; all final gates
above were then rerun with repository edits stopped. No integrity check changed.

Known suite-time budgets remain exceeded. Production build warnings about chunk
size, Browserslist age and the oversized asset manifest remain. This foundation
has no browser acceptance or new earned campaign evidence.

Independent reviews inherited from the completed review turns: `/root/design_contracts`
TD-ARCH-REVIEW APPROVE for ADR007/stages; `/root/qa_save_review` APPROVE, security
PASS, including the applied recipe correction; `/root/producer` found no scope
mismatch and retained all five flows as open. QA was informed that the final
code change was only the equivalent optional-chain expression required by lint.
All readers are released.

Exact diagnostic root retained through A3/umbrella integration:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-a3-stages-1413g41j`.
It contains RED/focused/final logs, frozen input hashes, build chunk hashes,
`validation-final.json`, and `cleanup.json`. Root owns removal after integration
consumers finish. All final command sessions are terminal. Exact task-owned
`dist` and `tmp` removed; `cache` absent; verified remaining [] / failures [].
No browser/server was started. C0/C1 remain narrowly accepted; C2 underway;
C3/C4 and full G0–G7 remain open. Work remains local; no PR/push/merge/deployment.
