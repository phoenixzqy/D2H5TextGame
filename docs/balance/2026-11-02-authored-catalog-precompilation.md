# Static authored catalog precompilation

Ten unchanged quest, recruitment, material and socket schemas now compile in
Vite's Node process for browser builds. The matched production diagnostic reduces
saved-character reload by another 10.4% on mobile CPU emulation. The six loaders
retain their validation/integrity rules and original caller-owned Ajv on SSR.
Large-save startup and the full-v1 objective remain open.

## Implementation and scope

`src/data/authored-schemas.ts` holds the ten original schemas, including the exact
mercenary-array wrapper. A typed factory delegates to each existing caller's Ajv
on SSR. The browser factory imports the actual standalone functions generated
from the current data-only registry with unchanged strict/allErrors/default
options. Metadata uses the original registry's schema objects. Every input is
still checked afresh with complete errors; no validation-result cache is added.
[ADR-016](../decisions/ADR-016-precompile-authored-catalog-validation.md) records
the boundary, options, alternatives and maintenance constraints.

Only six loader compile declarations and schema imports move. A separate
readback compares their remaining bodies with pre-edit bytes and confirms that
all secondary checks are exact. No engine/store code, authored JSON/schema,
reward, ownership guard, save format or migration changes. Existing installed
Ajv, esbuild and Vite suffice; no dependency install or version change occurs.
The skill standalone chunk is byte-for-byte identical to its retained baseline.

Registry and schema edits invalidate generated code and request a development
reload. Invalid schemas reject consistently without stale-validator fallback;
repair recovers. A task-local configured Vite probe executes actual virtual
modules and checks schema identity, schema/registry edits, rejection and repair
through module-graph/watch/HMR hooks. Events are manually delivered, so this is
not a claim about operating-system watcher delivery.

## Production evidence

Baseline is authority41's retained skill-only production run. Candidate is the
same default minified production configuration, now frozen by authority42.
Chromium147, desktop1280×800/en and mobile360×640/zh-CN at4×CPU use the same
complete earned level70/Hell961 source. Both have a warm activated service worker
and no E2E bridge. Reload endpoints match: saved-character navigation/locale plus
two frames. These are single profiled localhost diagnostics, not physical-device,
percentile, cold-network, Web Vitals or soak acceptance.

| Diagnostic | Desktop baseline → candidate | Mobile baseline → candidate |
| --- | ---: | ---: |
| Public import, confirmation to dialog close | 736.533 → 760.814 ms | 3044.575 → 3181.768 ms |
| Saved-character reload | 1590.933 → 1426.102 ms | 6608.842 → 5918.844 ms |
| Longest reload task | 673 → 500 ms | 3129 → 2340 ms |
| Save-validator inclusive sampled CPU | 334.789 → 355.095 ms | 1414.123 → 1368.609 ms |
| Save-adapter inclusive sampled CPU | 572.577 → 585.561 ms | 2441.982 → 2458.772 ms |

Reload improves 10.36% desktop and 10.44% mobile. Import is slightly slower in
both single samples; no import benefit is claimed. Inclusive source rows overlap
and must not be summed. Save loading/storage and other initialization costs
remain material. This change does not certify performance budgets.

The new authored-schema chunk is 637,105 bytes / 46,068 gzip, below the unchanged
2,097,152-byte Workbox cap. Total application JS/CSS gzip grows from 1,042,094 to
1,088,944 bytes. Build time is19.870s versus18.553s baseline. The actual precache
checker passes759URLs, all ten application JS/CSS assets and required PNG icons.
Existing bundle-size/Browserslist/art-provenance warnings are retained; no cache
cap or warning threshold is raised and no database/dependency update is run.

Ordinary public file Import → explicit Save → reload → Export and native
IndexedDB preserve the full migrated version33 save and all7,413items. Only the
declared desktop locale differs. Both reloads read one full save and neither has
page/console errors or horizontal overflow. Root inspected both screenshots;
save controls/navigation remain intact. The canonical earned source is unchanged.

## Focused checks

The resource RED fails on the original browser loader's runtime compile call.
Its ten filtered cases are excluded; the reporter's aggregate pass count is not
used for that run. Six existing affected loader suites then pass408assertions.
The generated/catalog suite passes11cases and the prior skill suite passes3:
422distinct affected cases across retained runs, without an unrelated/campaign
suite. Generated functions preserve admissions, complete errors, input bytes,
schema identity and reset behavior across754input comparisons, including a
mutated previously valid object/array for each of the ten schemas. The earlier
skill group's1,444-case comparison also passes in its affected regression run.

Final scoped strict types and explicit lint pass. Initial unchecked indexed
schema access and unsafe-any spread are corrected using entry iteration and an
unknown-array cast; raw failures remain evidence. No suppression or weakened
assertion is added. Direct tests rerun after final source fixes; unaffected
loader suites are reused because their bodies and original SSR helper are exact.

The first production driver stops before build because its old data-hash guard
includes intentionally edited TypeScript under `src/data/`. The corrected driver
separately verifies every authored JSON entry and records the actual new data-tree
hash. No JSON content is exempted or changed. A separate Python readback checks
all2,136source inputs, exact eleven-input delta, unchanged authored JSON/canonical
save, loader bodies, actual assertions, packaging/archive bytes and cleanup.
Its first test tally merges two equally named cases; v2 keys cases by file,
ordinal and name. This is root recalculation, not independent review.

Authority42 source hash:
`7e5a0c7eb39c09f7d94a30c1c963aab27380b8acd792d4805ae12f7ea08c39bc`.
The source/data-tree hash changes because loader/helper TypeScript lives under
`src/data/`; all authored JSON/schema bytes remain identical to authority41.

## Retention and remaining work

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Stems: `bug592-authored-*`, `bug592-production-startup-v4-authored*` (excluded
harness failure), and `bug592-production-startup-v5-authored*` (accepted diagnostic).
Exact emitted code/maps/worker/HTML are losslessly compressed in
`bug592-production-startup-v5-authored-profile-assets/`. The27archive files are
verified against original bytes. All owned jobs are terminal; exact disposable
builds, caches, probe roots, build-info and transient config modules are absent.
Raw failures, baselines, final checks and profiles remain needed for review.

Root retains the active human2 worktree and shared packet through full-v1/umbrella
review, and owns eventual release/cleanup. Remaining startup/storage/inventory/
runtime budgets, representative recruitment/Hell economy variance, chronological
14-build funding/fairness/holdouts, defeat/retry/manual-idle, calibrated30–50
active-game-hour pacing and integratedG0–G7/two-hour soak/independent review remain
before later owner playtest. Accepted balance cells remain0. Browser works;
CI stays excluded; no pending user question or external blocker.
