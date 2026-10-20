# BUG-003 — Related-test command rejects its own flag

Severity: Medium (development validation unavailable).
Status: fixed; independently reviewed by producer on 2026-10-20.
Reproduced at `4445218` before correction.
Owner: technical/QA; card P00b.
Environment: Node 24.21.0, npm 11.19.0, locked Vitest 1.6.1.

Reproduce: `npm run test:related -- src/engine/save/validate.ts`.
Expected: run statically related tests once and exit.
Actual: exit 1, `CACError: Unknown option --related`, no tests execute.

Root cause: package script uses `vitest run --related`; installed CLI exposes
`related` as a subcommand. `npx vitest related --help` confirms `--run` disables
watch mode. Correct script to `vitest related --run`, preserving non-watch safety.
Verify against a source file with known related tests, not `--passWithNoTests`.

Validation after correction:

- `npm run test:related -- src/engine/save/validate.ts --project=engine --reporter=dot`:
  exit 0, 1 file / 25 passed, 1.45 s.
- `npm run test:related -- src/engine/save/validate.ts --reporter=dot`:
  exit 0, 22 files / 226 passed / 1 existing skipped, 10.70 s. This broad
  dependency run exceeds the 5 s related-test budget; no budget claim is made.
  Project scoping keeps the surgical engine loop within budget.

No production runtime change. Actual CLI execution verifies the one-line fix;
no implementation-mirroring test was added. Full integrated U/T/L remains the
next source-slice handoff gate.
