# BUG-726 — Read retained rewards from the actual report contract

- Severity: Medium (local evidence reader; native gameplay succeeds).
- Status: Locally fixed in retained V3 reader; no commit/production edit.
- Owner: root / QA tooling. No production change.
- Build: `feat/playable-foundations`, current uncommitted private-v1 worktree.
- Environment: WSL, Python retained-output reader; browser/viewport/locale not applicable.
- Seed: no new combat; original native seeds remain in the retained journal.

## Reproduction

1. Read the completed Act IV packet at `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-zeal-act4-remaining-g9z4__7p`.
2. Execute its frozen `reader.py` against `remaining.json` and the existing compressed journal.
3. Observe `KeyError: 'rewards'` at line 272; retained `readback-attempt1.log` and `readback-attempt1.json` show exit 1.

Expected: verify journal rewards against the actual native report summaries and complete exported state.

Actual: the reader additionally expects a top-level `rewards` array. The frozen driver records full reward deltas in its journal and audits them into report `economy`; its report does not serialize that array.

## Root cause and correction

A copied reader retained an assertion for a different report shape. Preserve the frozen reader, plan, first failure and all native outputs. A separate V2 reader uses the actual contract: exact wave summaries and quest actions, economy totals, ordered item custody, currency/material balances, hero/mercenary XP and points, and complete snapshot/export equality. It must not replay combat, alter a report, insert a synthetic rewards array, or claim the original prospective reader passed.

Original packet reader SHA256: `fd59b8a960b880319bcbf109b061a3dc6b7873db0a24b346b8bfa2cf7b99e090`.

The original reproducible failure serves as the negative case. Run V2 once over unchanged outputs and record its hash, result and limitations separately. This is root's local readback, not independent final QA.

Validation: `remaining-readback-v3.json` passes over unchanged native output; frozen reader SHA256 `d5053c1293e597f202cf08e3be34274ae99b302d710bc34b0023171b51a12e6b`. Original negative cases remain. See [qualified Act IV evidence](../../docs/plans/evidence/p15-zeal-earned-act4-completion.md).
