# Current-head local release gates — 2026-10-28 UTC

Status: configured coverage and production bridge guard PASS; locale scanner
FAIL with qualified findings. Private-v1 acceptance remains unfinished.

## Binding and scope

Executed HEAD: `771ad71ec6c862d272c1d11d9cd9428be699a17a`.
All three checks preserved the same 5337 repository inputs, snapshot SHA256
`d7a3a2f9b83b3054d6b3090280ac9b8609450f9bda4714ee78156f5937fdb51a`.
The before/after coverage maps match; independent review rehashed current inputs.
Local environment: Node `v24.21.0`, npm `11.19.0`; actual CI on Node 20 was not run.
This checkpoint adds documentation only after those checks.

Raw artifacts below are relative to the retained root-owned packet:

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-h2-hell-b6de0n4x`

## Configured coverage — PASS

Unfiltered `npm run test:cov` ran all three existing workspace projects with
original V8 engine scope, discovery, workers, timeouts and all four global 80%
thresholds. Only report/output destinations and reporters were supplied.
Session 73350 completed outer/native 0 in 1668.204 seconds: **21,187 passed,
two existing skips, 989 passing physical files**. The two skips are the existing
authentic Rocky Waste continuation and bounded earned-farming policy cases;
neither receives pass credit.

| Metric | Covered / total | Percent |
| --- | --- | --- |
| Lines | 24573 / 24928 | 98.57% |
| Statements | 24573 / 24928 | 98.57% |
| Functions | 1207 / 1224 | 98.61% |
| Branches | 13337 / 14004 | 95.23% |

Installed `istanbul-lib-coverage` aggregation and an independent recomputation
agree on global totals, every per-file summary and all uncovered locations.
There are 215 report entries versus 227 non-test engine TypeScript inputs.
Read-only TypeScript AST review verifies the 12 omitted inputs contain only
type aliases, interfaces and explicit type imports. Their paths are retained in
the independent review; they do not have emitted coverage entries.

This is a global gate: 16 entries have branch coverage below 80%, including
`sha256.ts` (53.33%), `progression/skill-tree.ts` (55.55%) and `ai/policy.ts`
(57.89%), alongside zero-coverage barrel/type entries. The raw report and
aggregate retain 355 uncovered lines, 17 functions and 667 branch arms.

Artifacts: `coverage-validation/coverage-first.log`, `coverage-first-results.json`,
`coverage-first-summary.json`, both `coverage-first-inputs-*.json`,
`coverage-aggregate.json`, and `coverage-first-reports/coverage-final.json`
(all under `coverage-validation/`). Runner: `run-release-coverage.py`;
aggregation provenance: `aggregate-release-coverage.cjs`.

## Production bridge guard — PASS

Official `npm run check:test-bridge-shake`, session 15815, completed native 0 in
20.587 seconds with a fresh production build. Independent review rescanned all
six JavaScript chunks against the official forbidden patterns and found no
matches. Build chunk/precache warnings remain in the log. This establishes build
and bridge-symbol checks only.

Artifacts (all under `coverage-validation/`): `bridge-current-head.log`,
`bridge-current-head-summary.json`, `bridge-current-head-build-manifest.json`;
runner: `run-release-bridge.py`.

## Locale scanner — FAIL, findings qualified

`npm run lint:i18n -- --json`, session 54135, completed native 1 in 3.118 seconds.
Totals: parseErrors 0, dataLiteral 432, dataMissingKey 0, sourceMissingKey 6,
sourceLiteral 8, parityMissing 18. Independent source review establishes:

- Two `inventory.title` findings have existing flat dotted keys in both locales;
  the scanner splits dots and examines its inferred first namespace.
- Four English respec findings have existing plural forms and counted calls.
- All 18 parity records are six English plural pairs versus Chinese base keys.
- Eight DevUI literal labels were already recorded historically.
- The 432 data findings remain unadjudicated; runtime localization of their
  consumers was not audited. They are not 432 established rendered defects.

These qualifications preserve the failed native result and do not establish
whole-app locale acceptance or a regression count. No scanner/source changes or
weakened checks were used. An earlier stdout-pipe capture, session 55564, ended
outer 1 with truncated JSON; its native exit was not durably captured. The
original log is retained without native-result credit. The direct-file retry
provides complete JSON and the actual native 1 result.

Artifacts (all under `coverage-validation/`): `i18n-current-head.log` (original failed capture),
`i18n-current-head-fileout.log`, `i18n-current-head-fileout-native.json`,
`i18n-current-head-fileout-results.json`, `i18n-current-head-fileout-summary.json`;
runner: `run-i18n-file-output.py`.

## Review, cleanup and remaining acceptance

Independent coverage review: `release-coverage-independent-review.json`, SHA256
`e34f26f0c046ba1cf668f69bdab87a07401c9544f62a17d1b9be07a74b3c2af4`.
Independent static review: `release-static-independent-review.json`, SHA256
`8a0148568062f66d140aab2d410af80913a79dfda3339c8d6b8eeffffe02daf9`.
The latter reviewed bridge/qualified locale evidence only; coverage has its own
subsequent approval. Native coverage summary SHA256:
`3dd4071238bbe644bbf30e6fec63b87dc1a8165dee0f07fa0192edb8168e23c2`;
raw coverage SHA256:
`94f3fd5aabf8332afddc2eee1c2da95a5203ecbaacae14e97760bba12d5132fa`.

After terminal consumption and reader release, exact manifest/hash checks
preceded deletion of 762 build files/10 directories and 239 coverage rendering
files/16 directories (4,503,616 bytes of coverage rendering). Build `dist` is
absent; the report directory retains only `coverage-final.json`; cleanup failures
are empty. Receipts (both under `coverage-validation/`): `bridge-disposable-cleanup.json` and
`coverage-disposable-cleanup.json`. The coverage native PID is absent. Root
retains raw JSON, logs, maps, manifests, runner provenance and reviews through
unfinished full-v1/evidence consumers and owns their eventual verified removal.

[Cobra native recovery](cobra-mana-recovery.md) implements the user's cheaper
choice. BUG304 remains Open for dedicated public recovery/playback/persistence
and earned acceptance; the inventory remains 212 bounded plus one unverified
Cobra. BUG180/355/356/357 remain Open. H3 remains terminal failed-no-app with no
retry/new card or browser acceptance. Earned high-rune acquisition/source mix,
30–50 active-hour pacing, 14 builds × five acts, defeat/fresh retry, whole-app
locales/devices/a11y/performance/PWA, actual CI, human acceptance and soak remain
unfinished. These local gates do not establish private-v1 completion. Worktree
claim and umbrella implementation goal remain active; no publication or merge.
