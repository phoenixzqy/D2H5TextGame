# BUG-729 — Distinguish dropped gems from gem-shard currency in retained readback

- Severity: Low; diagnostic reader only.
- Status: Fixed locally; retained-output readback passes.
- Owner: root acting as qa-engineer; no delegation requested.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, working production tree
  `7da811f06a9ecd1d23ac4eab9a4cc036b223dd51751954632313e03603860941`.
- Environment: Python 3 on WSL; browser/viewport/locale not applicable. Retained
  native manual benchmark seed 1; no new combat needed.

## Reproduction

1. Read the retained `amazon-bow-act3-elite-firstclear-benchmark.json`, wave 4,
   in `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-repeat-firstclear-benchmark-ki97ejnm`.
2. Compare `actualDelta.currencies['gem-shard']` (0) with
   `rawRewardDelta.gems` (1).
3. Run that packet's original `readback.py`; its line 136 raises AssertionError.

Expected: the verifier reconciles the one normal topaz to
`rawRewardDelta.materials` and actual material custody, while gem shards remain
unchanged. Actual: it compares different quantities and rejects a valid award.

Evidence: the retained attempt, native journal, and failed reader in the exact
packet above. `src/stores/combatHelpers.ts` adds gem-cache material counts to
the raw gem counter; `tests/sim/production/earned-playback.ts` retains that
counter separately from material and currency changes.

Root cause: the new external verifier assumed every raw reward counter maps to
a currency. Fix the reader's quantity mapping; preserve the failed version and
all native outcomes. Original sources, production code and simulation budgets
remain unchanged. Validation uses the retained outputs only.

## Local correction and validation

The corrected reader reconciles raw gem/rune counters to dropped materials and
checks gem-shard currency separately. The complete retained-output review passes
in 2.098 seconds: all 16 attempts, 81 waves, 11 exact postclear exports and five
failed branches reconcile. No native run was repeated and no production file
changed. The original failed reader remains `readback.failed-v1.py`.

Corrected reader SHA256:
`4dce7e7f60a276abe7c2e36af6430cb0e1c92c8161ad5d916f6ed6a6c57884d5`.
Native report SHA256:
`96b529ab3b66e880cbb77d41838abccb901156d3d180e180d0fd5be7d165b568`.
The packet's `readback.json` and `cleanup.json` pass; evidence remains owned by
root through umbrella acceptance. This fixes verification, not game balance.
