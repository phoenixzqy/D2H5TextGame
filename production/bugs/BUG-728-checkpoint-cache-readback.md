# BUG-728 — Read the actual checkpoint failure cache path

- Severity: Medium (local retained-output verifier).
- Status: Locally fixed in retained V2 reader; no commit/production edit.
- Owner: root / QA tooling. Production game and checkpoint attempt are unaffected.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, dirty `feat/playable-foundations`.
- Environment: WSL, Python 3, Node CLI log; browser, viewport and locale not applicable. No gameplay seed is needed to reproduce this parsing error.

## Reproduction

Evidence packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-checkpoint-balance-l9jm0h4c`.

1. Read the retained `command-overwrite-rejected.log`; no command or gameplay rerun is necessary.
2. Apply `re.search(r'cache path: ([^\n]+)', log)` as the original readback did.
3. Assert that the captured value is an absolute filesystem path. The assertion fails: the value is the literal `${cache}` followed by source punctuation.

Expected: identify exactly one absolute cache path from the actual `AggregateError:` line, validate its task-owned parent/name, then check whether that exact path exists.

Actual: Node prints the throwing source line before the error. The unanchored regex matches that source first. A nonexistent relative literal is incorrectly recorded under `cachePathsAbsent` in `command-readback.json`.

## Root cause and correction

Anchor the reader to the real error line, require exactly one match and the expected absolute task-owned cache location, then check the actual path. Preserve the flawed original readback and native reports. Repeat all other assertions over retained outputs and publish a new exclusive V2 readback. No new native attempt or production change is needed.

## Validation

The original regex/absolute-path assertion reproduces the error. `reader-v2.py`
passes over unchanged native outputs and writes exclusive `command-readback-v2.json`.
Both exact cache paths are absent; original source/report hashes, engine input,
nonwin, journal phases and terminal process identity reconcile. Reader SHA256:
`c83951416d37103ce04965fa18fc33fe69c9969c12f52ee025b695f22e215eb5`.
The flawed `command-readback.json` remains and is explicitly superseded.

The first V2 draft also incorrectly compared the complete outcome object to the
string `defeat`; `reader-v2.failed1.py` and `.log` preserve that failed assertion.
The corrected reader checks `outcome.winner`, native `advanceResult` and measured
`metrics.outcome` separately. No gameplay or production change occurred.

See [checkpoint runner evidence](../../docs/plans/evidence/p15-checkpoint-balance-runner.md).
