# Selected save structural validator precompilation

Follow-up: BUG596's seven inherited test failures are corrected locally at
authority45, with91/91passing cases; see its linked bug record. The original
232pass/sevenfailure results below remain historical evidence.

Current33, literal frozen32 and ledger-context structural validators now compile
in Vite's Node process. In the retained production comparison, complete earned-save
import improves 22.6% desktop and 25.8% with mobile CPU emulation. Reload improves
only slightly and longest tasks increase; startup/runtime budgets remain open.

## Change and preserved boundaries

The private `src/engine/save/schema-validator.ts` helper captures the three actual
assembled schemas without rebuilding them. The generator uses normal Vite SSR
JSON/glob handling, original Draft07 `Ajv({ strictNumbers: true })` options/defaults,
and the existing installed standalone/esbuild tools. Its nested loader has no
application plugins, watcher, discovery, file output or listening socket, and
closes in `finally`. Exactly three registry keys are required.

Only the browser helper is transformed. Selected getters bind generated functions
and attach the original captured schema objects on first use. Unselected historical
schemas retain the original caller-owned lazy compiler; ordinary SSR remains exact.
No input-admission result is cached. All schema assembly, native descriptor/domain/
ownership guards, migration bodies, cloning, queued writes and durable-before-publish
behavior stay intact. All three captured schema hashes match their pre-edit originals.
[ADR-017](../decisions/ADR-017-precompile-selected-save-validation.md) records the boundary.

Engine/data edits conservatively invalidate the generated promise/module and request
reload. The actual configured-Vite hook probe verifies edits, invalid-schema failure
without stale fallback, repair and zero listening socket calls using a task-local
three-schema registry. Events are manually delivered; this does not certify OS watcher
delivery. The unit test separately checks original browser schema metadata identity.

## Production comparison

Baseline is retained authored-only production v5; candidate is corrected production
v7. Both use Chromium147, desktop1280×800/en and mobile360×640/zh at4×CPU, activated
service workers, the same full earned level70/Hell961 source and no E2E bridge.
Endpoints and fixed Date match the baseline. Focused Node jobs overlap candidate
build/setup; there is no contention control. These are single profiled localhost
diagnostics, not physical-device/percentile/Web-Vitals or integrated acceptance.

| Diagnostic | Desktop baseline → candidate | Mobile baseline → candidate |
| --- | ---: | ---: |
| Public import, confirmation to dialog close | 760.814 → 588.615 ms | 3181.768 → 2361.469 ms |
| Saved-character reload | 1426.102 → 1389.312 ms | 5918.844 → 5804.651 ms |
| Longest reload task | 500 → 558 ms | 2340 → 2511 ms |
| Save-validator inclusive sampled CPU | 355.095 → 232.554 ms | 1368.609 → 1034.289 ms |
| Save-adapter inclusive sampled CPU | 585.561 → 465.640 ms | 2458.772 → 2104.253 ms |

Import improves22.63%/25.78%; reload2.58%/1.93%. Longest tasks worsen. The retained
change benefits the known large-backup recovery path; it does not close startup
performance. Inclusive rows overlap and must not be summed. Prior Dexie attribution
identifies native put/get materialization rather than evidence for disabling its
cache; no storage representation or caching change is made.

Public file Import → explicit Save → reload → Export and native IndexedDB preserve
the complete migrated33save/all7,413items. Only the declared desktop locale differs.
Each reload reads one full save. Both contexts have an activated controller, no
page/console errors or horizontal overflow. Root inspected both screenshots; controls
and navigation remain intact. The canonical earned source is untouched.

New production chunk625,716bytes/66,681gzip fits the unchanged2,097,152-byte cap.
Total application JS/CSS gzip1,088,944→1,155,705bytes. Build22.835s. Actual precache
checker passes760URLs/all11application assets/required icons. Existing bundle-size,
Browserslist and generated-art-manifest warnings remain; no threshold, database,
dependency or CI change is made.

## Affected verification and failures

The resource regression fails before implementation on browser runtime compilation.
Five new tests pass, exercising the real transformed factory/generated module across
2,283nested valid/malformed input comparisons, complete errors, input preservation,
metadata identity, mutations of previously admitted objects, reset and historical
fallback laziness. A separate configured-plugin probe matches the original compiler
on41rich earned-save/malformed inputs and pins all three pre-edit schema hashes.

The nine selected suites exercise239cases:232pass; seven quest-item assertions fail
with identical names/messages against the retained original validator. The original
suite has84passes/seven failures. These are recorded as
[BUG596](../../production/bugs/BUG-596-quest-item-save-test-preconditions.md): one
relabels a historical save as current without required recruitment fields; six call
the current-only API on historical saves and assume an older error prefix. No
assertion or production guard is weakened. Final five-case generator rerun passes
after the socket fix; unchanged native/persistence results are reused. Scoped strict
types/lint pass. No campaign or unrelated suite is replayed.

The first mixed test invocation omitted the workspace flag, producing23environment
failures in addition to the seven baseline failures; corrected explicit workspace
execution restores the DOM setup. Initial lint catches unsafe Vite map-key typing
and a test Function constructor; explicit unknown narrowing and Node VM execution
resolve them without suppressions.

The first schema-size probe uses plain esbuild on Vite-specific imports and fails;
its corrected Vite-loader probe passes. Production v6 exposes Vite's middleware
WebSocket listener despite `hmr:false`. Root intentionally terminates that exact
task-owned driver; later log readback shows desktop had completed and mobile was
underway, contradicting the earlier inference of a stuck close. That partial run is
excluded. `ws:false` fixes the actual unwanted-listener cause; the corrected hook
probe asserts zero listen calls and production v7 passes without the socket error.
No other process is terminated.

## Authority, retention and remaining work

Authority44 has2,139inputs; source hash
`7e14012b58ecde8ab43c32330bfef2d6c975325fac9b9a55a741a7220b73f01a`.
Exactly five inputs differ from authority42: the new helper/plugin/test, the three
selected declarations/compiler wrapper in `validate.ts`, and Vite registration/chunk.
All authored JSON/schema and the full data-tree hash remain unchanged. Authority43
is the excluded pre-socket-fix candidate, not current authority.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Stems `bug592-save-*`, `bug592-native-precompile-probe-*`, storage attribution and
`bug592-production-startup-v6-save*`/`v7-save*`. Exact candidate code/maps/worker/HTML
are retained losslessly in `bug592-production-startup-v7-save-profile-assets/`
(29files). Terminal jobs and exact disposable cleanup are recorded in the closure.
Root retains worktree/packet through umbrella review and owns eventual cleanup.

Next repair BUG596's test preconditions, then continue remaining startup/storage/
inventory/runtime budgets, representative recruitment/Hell economy variance,
chronological14-build funding/fairness/holdouts, defeat/retry/manual-idle, calibrated
30–50active-game-hour pacing and integratedG0–G7/two-hour soak/independent review
before later owner playtest. Accepted balance cells remain0. Browser works; CI is
excluded; no pending user question or external blocker. Full v1 remains active.
