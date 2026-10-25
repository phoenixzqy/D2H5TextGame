# BUG-226 — Investigate the player-first import test timeout

- Status: observed once; isolated and unchanged quiet full pass; cause open.
- Severity: Medium — full regression validation fails; no gameplay failure established.
- Owner: root, test/runtime module initialization; independent QA remains open.
- Build: `98ad7970` plus the frozen warcry-control implementation and tests.
- Environment: local Node24/Vitest, default repository `npm test`; no browser,
  locale or engine seed applies to the failed module-entry assertion.
- Affected systems: player/inventory initialization, XP/equipment regression,
  full-suite validation reliability.

## Reproduction

1. Run `npm test` on the frozen warcry-control inputs.
2. Observe `src/stores/playerStore.experience-equipment.test.ts`, test
   `player/inventory module entry order > supports player-first without an initialization cycle failure`.
3. Preserve the complete full-suite output and terminal receipt when available.
4. Run the exact file separately with one worker and unchanged assertions,
   source, timeout and configuration.

Expected: both module-entry orders initialize and retain the asserted equipment
and experience behavior within the existing test budget.

Actual: the first full run exits1 after827.503s with15435passed, one failed
test and two existing skips across707files. It reports `Test timed out in 5000ms`
for player-first; the13-test file takes9072ms. The isolated check passes all13tests (11.73s
Vitest,13.490s wrapper). This does not prove that a runtime defect is absent
or that resource contention caused the original timeout.

The initial full run overlaps typecheck/lint and browser validation. A retained
resource observation establishes CPU affinity/pressure only, without causal
proof. The new warcry helper adds an authored-schema validation at module
initialization, but no measured attribution establishes that as the cause.
No timeout is increased, assertion weakened, test skipped or speculative
runtime change made. All recorded task processes are absent and ports4506–4509
are closed before an otherwise quiet full comparison starts on identical
frozen inputs. Investigate further if it recurs.

Quiet comparison: unchanged full suite exits0 after726.949s (725.07s Vitest),
15436passed/707files/two existing skips. The affected13-test file passes in
4467ms. All1198frozen source blobs match source commit `eeaaa48d`;761build
files and genuine save also remain exact. No code fix is claimed for this
timeout, and a single quiet pass does not establish a causal diagnosis.

Evidence: `full-final.log`, its terminal receipt, `import-timeout-repro.log`,
`import-timeout-repro-result.json`, `resource-observation.json` and
`frozen.json` in the warcry-control task packet to retain. The isolated pass
is diagnostic evidence, not a replacement for the full regression gate.
