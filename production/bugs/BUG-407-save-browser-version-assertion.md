# BUG-407 — Use the current save version in the ordinary browser assertion

- Severity: Low — a stale browser assertion prevents reaching the remaining persistence checks.
- Status: Locally fixed; exact stale-version browser RED followed by four locale/device GREEN cases, strict types/lint and independent review.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus disclosed local private-v1 work.
- Environment: WSL/Linux, Playwright Chromium; zh-CN/en, mobile360×640 and desktop1280×800. RNG seed is not applicable to this save-version assertion.
- Owners: qa-engineer/frontend; save/export/import acceptance.

## Reproduction

1. Run `tests/e2e/save-management.spec.ts` against the current application.
2. Create the ordinary character, choose locale, disable sound and use public Save/export.
3. Inspect `expect(backup.version).toBe(7)` at line63 before the pending-autosave/import assertions.

Expected: an ordinary current export uses the current native save version, while
separate historical-v7 migration tests preserve compatibility coverage.
The original browser assertion required7; the native
`src/engine/types/save.ts` exports `CURRENT_SAVE_VERSION = 32`. V3 reproduced
the exact expected7/received32 mismatch after the public export checks.
The first attempted reproduction did not reach this assertion:
its external runner added an unsupported Vite `--configLoader runner` option.
Vite rejected that option before application or browser startup; this is a
runner preparation error, not evidence of a product/browser-launch defect.

## Evidence and intended correction

Read-only P17 audit:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-next-gap-audit-v1.md`.
It records the current test and native version source hashes. The existing
production and native save checks establish the intended current-format
contract; their historical passes do not constitute a fresh run of this case.

The v3 English desktop case now reproduces line63 exactly: expected7,
received32. The preceding real export/name/sound/locale assertions pass.
The final correction retains the type-only `SaveCurrent` import and declares
`const currentSaveVersion = 32 satisfies SaveCurrent['version'];`. The exact
export equality uses that expected version. TypeScript rejects a future stale
literal; the Node test runner does not load browser migrations. Every latest-
state, pending-autosave, full-save equality, failed-import, locale and reload
assertion is preserved. Production serialization, migrations and old-v7
compatibility tests are unchanged.

First-attempt evidence: packet `bug407-run-outcome-v1.md` and
`bug407-evidence-identities-v1.json`. The owned wrapper finished exit1 in1.459s;
source inputs stayed identical, owned processes exited, the port closed and
task temporary directories were removed. The failed attempt is retained.

V2 reached Chromium but its long packet-local TMPDIR exceeded the Unix socket
path limit before the test body. V3 used an exact owned short `/tmp/b407v3-*`
directory and reached the unchanged assertion. Its wrapper finished exit1
in16.797808s without timeout or termination actions. All14captured owned
process identities were gone, the49173loopback port closed, task temp/cache
paths were removed and source inputs stayed identical. These runner failures
remain retained separately from the reproduced stale test assertion.


## Final correction and verification

V4's superseded value import loaded the save module's runtime migrations and
JSON data into Node, failing collection with a missing JSON import attribute.
Zero selected tests ran; this result remains preserved separately. The final
source is `tests/e2e/save-management.spec.ts` SHA256
`3d99494c97014462d12d3b925f414065786ad538f619da477ee486230cd4d87e`.

V5 passes all four existing English/Chinese cases on original desktop1280×800
and Pixel5 mobile360×640 projects, with one worker and zero retries. Playwright
reports4passed in41.9s; the owned wrapper exits0 in42.999989s without timeout,
error or termination actions. All30captured process identities exited, port54139
closed, exact task temp/cache paths were removed, and source/prior evidence
remained unchanged. Evidence: packet `bug407-run-outcome-v5.md`,
`bug407-save-management-four-cases-v5.log`, `-exit.json`, and cleanup/manifest.

Strict types `p15-impale-types-v2` pass in8.065s and cached lint
`p15-impale-lint-v2` passes in1.826s. Prior cold runs hit their120/180s limits;
their receipts are retained and are not passes. Independent review
`p15-impale-and-save-test-independent-review-v1.md` approves the final test
without weakened assertions. This fixes a test oracle; it is not acceptance of
all PWA/update paths or earned progression.
