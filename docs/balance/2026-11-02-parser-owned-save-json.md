# Parser-owned save JSON — 2026-11-02

Status: optimization retained in the working tree. BUG592 and full private v1
remain open; accepted balance remains **0/210**.

Current-version JSON loads and imports now enter `decodeSaveJson`, which parses
the text itself without a reviver. This private tree cannot contain native
accessors, cycles, Maps or Sets, so it avoids the full descriptor graph scan and
the recursive Map-normalization copy. All schema, semantic, ownership, socket,
charm, quest, recruitment and bounty checks still run. Restoration still creates
the same native values. Historical JSON uses the unchanged migration path;
public object decoding keeps its descriptor/cycle/Map handling. No caller can
request the private representation mode. Save version, authored data, storage
envelope and write/publication order are unchanged.

This addresses redundant work at the parser boundary. Caching validation across
calls would miss later object mutation; removing semantic checks would weaken
save integrity. Neither is used. Root self-review and security review found no
remaining finding in this scoped change; this is not independent release sign-off.

## Verification

**207 distinct affected cases pass** across validation, native descriptors,
sockets, charms, adapter storage, persistence and persistence lifecycle. New
coverage checks the graph-walk regression, full JSON/native state equivalence,
Map restoration, malformed/unsupported/non-string inputs, later native getters,
prototype-looking keys and paired corruption rejection. Historical v7 migration
remains equivalent. Scoped strict TypeScript, explicit lint of all five changed
files and engine purity pass. No unrelated suite or campaign was replayed.

Retained failed attempts are explained: the initial external Vitest invocation
omitted the repository workspace and therefore jsdom; the existing isolated
publication test mocked the old decoder. The corrected run uses the workspace
and updates only that spy/argument. Readonly fixture construction and the new
reflection callback were corrected before final types/lint. Assertions were not
weakened. Passing files were reused rather than rerunning the whole set.

Seven alternating warm direct Node pairs on the same earned current save reduce
complete parse/validate/restore median **230.256 → 95.186 ms (58.66%)**. Complete
decoded state is equal. This direct benchmark is separate from browser timings.

## Production browser comparison

Matched production builds use the exact three pre-change production source
snapshots for baseline and current source for candidate. Both assert production
environment replacements and absence of the test bridge. Chromium 147.0.7727.15
uses the genuine level-72/Hell-1043/8,540-item save, ordinary file-input imports,
native IndexedDB reads and downloaded public exports. Date is fixed at the save
timestamp; performance and animation clocks run normally.

Each profile/variant performs three imports and three reloads. All **24**
operations preserve complete native and public save values, with no page errors,
console errors or horizontal overflow. Only locale differs between profiles.

| Profile | Baseline import median | Candidate import median | Baseline reload median | Candidate reload median |
| --- | ---: | ---: | ---: | ---: |
| 1280×800 / en / 1× CPU | 467.536 ms | 292.534 ms | 767.558 ms | 824.613 ms |
| 360×640 / zh-CN / 4× CPU | 1359.632 ms | 957.485 ms | 3447.209 ms | 2494.105 ms |

Import improves 37.43% desktop and 29.58% mobile. Mobile reload improves 27.65%;
desktop reload median regresses 7.43%, while its two-warm-observation median is
735.318 → 726.653 ms. Do not infer a general desktop reload gain. Import longest-
task medians fall 351 → 193 ms desktop and 1196 → 808 ms mobile; reload longest-
task medians fall 315 → 258 and 1631 → 939 ms. Long tasks remain.

Three observations per operation/profile/variant on a shared WSL host are a
bounded production diagnostic, not representative-device or release-budget
acceptance. First imports include cold/JIT effects; two warm imports cannot
establish stable tail behavior. Activated service workers were observed; network
was not disabled, so this does not accept offline behavior or G6 as a whole.

Total JavaScript gzip changes 1,185,916 → 1,186,009 bytes (+93). All application
JS chunks remain below the unchanged 2 MiB precache cap. Both builds retain the
large-chunk warning and omit the existing 2.57 MB art metadata manifest from
precache. The stale Browserslist warning was not resolved by installing anything.
The first production harness correctly rejected a development-mode/test-bridge
build before launching a browser; its failed report/assets remain retained.
The final harness explicitly sets and asserts the actual production environment.

## Provenance and retention

The independent Python reader verifies the pinned driver, exact asset archives,
timing calculations and full source enumeration without replay. Authority73
freezes 2,141 production inputs, with exactly five changed source/test files from
72. All 107 campaign inputs and authored data are unchanged. Production hash:
`071889805aeef52b9dbc532c27c98c735a7552a4c653f2486aaf1859d81a442f`.
Data hash: `9a10343c0606d028d2c9b5738c45c983fddd322c5946abbb809909f41d3f47e8`.
The earned source SHA256 remains
`aa7f9ed5196513e1a0045c59624550c815876b745d5e48c4512129859ca8ed76`.

Evidence lives in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
The `bug592-json-boundary-closure-v1.json` index pins reports, scripts, before
snapshots, configs, emitted asset gzip archives and screenshots. Required
evidence and the active worktree remain with root through umbrella review.
Task-owned caches, build staging, type-build info and the observed browser
profile are absent; all consumers are terminal. Root owns eventual cleanup and
worktree release. Inherited unrelated artifact closure is not claimed here.

The preceding status turn was a verified wait on the live production driver.
This increment completes browser verification, retains the implementation and
records its limits. Next return to build acquisition/preparation policy using
retained Bow losses; do not extend exhausted histories or replay passing screens.
Full-v1 still requires 14 fresh build populations, independent holdouts, funding
fairness, recruitment/Hell economics, defeat/retry, manual/idle populations,
30–50 active-hour calibration, integrated G0–G7, two-hour soak/review and later
owner playtest. Browser works; CI is excluded; no pending answer/external blocker.
