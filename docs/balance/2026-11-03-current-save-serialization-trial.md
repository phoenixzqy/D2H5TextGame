# Current-save serialization trial — rejected and restored

The typed-current serializer fails its frozen mobile reload gate. Its source
changes are removed; earlier verified save optimizations remain. BUG-592 stays
open. There is no delivered performance gain from this trial.

The candidate converted declared affix-value and skill-synergy Maps before native
JSON serialization, replacing the whole-tree replacer only at the current-save
adapter. Generic/native/historical serialization was unchanged. Frozen criteria:
at least 20% direct serialization improvement, at least 10% mobile production
reload improvement, and no desktop reload regression greater than 10%. No timing
retry was permitted or performed.

Seven alternating pairs on the same retained 8,540-item save reduce direct
serialization median 47.828310 → 30.707855 ms (35.795651%). Compact/pretty bytes
and complete decoded state match. All 175 affected cases across nine files,
scoped strict types and four-file lint pass for the final candidate.

One matched production comparison uses desktop en 1280×800 at CPU1 and mobile
zh-CN 360×640 at CPU4, with three public imports and three reloads per context.
All 24 operations preserve complete native IndexedDB and public exported save
identity. No page/console errors or horizontal overflow; all four screenshots
were inspected. Ordinary production builds and active service workers are
recorded; no game bridge, store injection or campaign replay is used.

| Profile | Baseline import | Candidate import | Baseline reload | Candidate reload |
| --- | ---: | ---: | ---: | ---: |
| Desktop | 383.852 ms | 315.282 ms | 930.280 ms | 847.316 ms |
| Mobile | 1458.684 ms | 1264.237 ms | 3232.380 ms | 3825.671 ms |

Desktop reload improves 8.918180%; mobile reload regresses 18.354625% and fails.
Mobile reload samples are baseline 4536.185/3197.971/3232.380 ms and candidate
3825.671/3084.419/3875.140 ms. These are local CPU-emulated measurements, not
representative-device or full-v1 performance acceptance. The browser driver exits
1 solely on `Frozen browser reload performance gate failed`.

Restore only authenticated preimages of `src/stores/save-adapter.ts` and
`src/stores/save-adapter.storage.test.ts`; remove only the two new
`src/engine/save/current-json{,.test}.ts` files. All 2,151 restored production
inputs authenticate against the recorded source manifest plus exact baseline
overrides and original test preimage. Generic `serialize.ts` is unchanged.
All 24 archived emitted assets authenticate after gzip decompression. No
unrelated source is reverted, and exact restoration needs no timing or campaign
replay.

Setup failures remain recorded: the initial missing-module run was not a
behavioral RED; the first expanded invocation omitted the Vitest workspace and
ran UI cases without DOM globals; the first scoped type invocation had a wrong
fixture type import and lacked Vite ambient types. Corrected final invocations
pass. No production workaround was added for these setup errors.

Evidence prefix: `bug592-current-save-stringify-v1`, including `-plan.json`,
`-candidate-manifest.json`, `-bench.json`, `-affected-v2.txt`, `-types-v2.txt`,
`-lint-v2.txt`, `-production.json` and `-closure.json`, under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
All consumers are terminal; ten exact disposable config/cache/build paths are
verified absent. Root retains scripts, reports, source snapshots, maps, assets
and screenshots through umbrella review and owns their eventual cleanup, along
with the claimed human-worktree-2. No installation, commit, push or CI occurs.
Full private v1 remains incomplete; formal balance acceptance remains 0/210.
