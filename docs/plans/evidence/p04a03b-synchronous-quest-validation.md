# P04a03b — Synchronous quest document validation

Date: 2026-10-20. Input head c0877aa. Status: source/focused root/producer/QA
APPROVE; final combined independent APPROVE/ADEQUATE. BUG043 is the reproducer.
One runtime file: src/data/loaders/quests.ts. Existing schema and all JSON,
public types, grouping/helpers, reward execution and saves remain unchanged.
Full D10/D11/P04/F10/C0–C4/G0–G7 acceptance remains open.

## Contract and reproduced bypass

The synchronous UI/reward/map consumers bypassed the accepted central-loader
schema. Actual imported-document fixtures reproduce24 accepted-invalid field
cases,6 duplicate cases,4 valid→invalid→valid cases and2 validation-precedence
cases across both APIs/documents. Four missing-envelope context failures are
supplementary TypeErrors, not accepted-invalid behavior. Frozen RED40fail/
5pass/45total,0skip,runner1.46s/wall2.697s. Independent producer/QA approved
all assertions, exact descriptor/reference restoration and actual failures
before runtime edits. Earlier lint failure and initial RED remain recorded in
BUG043; sole braces-only assertion edit fixes the lint rule without weakening.

The guard compiles strict Ajv2020 once, validates both complete unknown
main/side documents on every call, then checks IDs before returning rows.
It returns fresh shallow-frozen arrays retaining original row identity/order.
Errors identify quests/main.json or quests/side.json and the schema field or
duplicate ID. No mutation options, async central loader import or extra
cross-reference/gameplay interpretation is introduced. Both46 actual authored
rows and empty/optional/zero/null/schema-valid unsupported gameplay shapes
retain existing acceptance. Acceptance of authored shape does not promise
reward delivery.

Frozen test SHA256: a53a98073beb0cc52c1a1ad4392365a4185bfe05b5e8c77be30bb0c98a8ad69b.
Runtime SHA256: a167d00f3bb661bc0462be639d04ec3ba5a90287d4a5c97c80a95c8fff85b985.
Unchanged schema SHA256: e250814c1459a1c9f5fcf388dc73cc8623f7bff442627eac4dc89aee560fb132.
Security check: pass; local bundled validation only, no new dependency or
network/credentials/permissions/data-export behavior.

## Current-source verification

Node24.21.0/Linux/Vitest1.6.1. All GREEN commands exit0,0failed/skipped.
Focused268/5 =45synchronous +195central +13NPCtalk +10clear +5QuestScreen.
Initial focused invocation mistakenly included nonexistent src/data/integrity.test.ts;
that unmatched filter did not validate integrity. The separate correct-path
integrity run passes30/1, including reward references and duplicate IDs.
Related595/48; full and coverage2261/134. Typecheck and full lint including
51 engine-purity files pass. Production build and four-chunk bridge-shake pass.

Configured engine coverage gate remains80% unchanged: observed63files,
8102/8582statements(94.40%),1891/2104branches(89.87%),296/315functions(93.96%).
UI/data/store code is outside this engine coverage scope; focused behavior
assertions own this guard's proof. Coverage JSON SHA256:
29c258758c5e5f279c177790848ff0dd65c3362afd6cee62fa52a3246fb09757.

Related/full timings exceed5s/15s budgets. Commands overlapped during part of
this run; no performance acceptance. Existing React act/test warnings, stale
Browserslist, >500kB bundles and unprecached2.57MB manifest persist. This child
adds no UI or new ordinary-browser acceptance; native Den proof is a separate
planned child after claim integrity. All broader quest/campaign gates remain open.

Exact commands and checker wall times (paths are retained historical provenance):

- sync-quest-frozen-red: `npx vitest run --project ui src/data/loaders/quests.test.ts --reporter=verbose`; exit1, 2.697s; log SHA256 `418da234efc8de3038b50a14552cd77a2716880ae117bcb40c0753222935c86a`.
- sync-quest-frozen-lint: `npx eslint src/data/loaders/quests.test.ts --max-warnings=0`; exit0, 5.148s; log SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- sync-quest-green: `npx vitest run --project ui src/data/loaders/quests.test.ts src/data/loader.test.ts src/data/integrity.test.ts src/stores/quest-npc-talk.test.ts src/stores/quest-area-clear.test.ts src/features/quests/QuestsScreen.test.tsx --reporter=verbose`; exit0, 5.462s; log SHA256 `93a584dcb166ab7b99125bdca9b090acc83fc26b1791642914790da53c47adc1`.
- sync-quest-integrity: `npx vitest run --project ui src/data/__tests__/data-integrity.test.ts --reporter=verbose`; exit0, 3.568s; log SHA256 `d69b0205ff6141f4632e16ec6529341e8557b31296739b661316349a2fee1f5d`.
- sync-quest-related: `npm run test:related -- src/data/loaders/quests.ts`; exit0, 29.271s; log SHA256 `70c3706d7daaf29dc3ebfaa5aa504840b884784590d8a9c794b2b6c487f18209`.
- sync-quest-full: `npm test`; exit0, 41.495s; log SHA256 `458dfc217d683d580ffbc6ee5f1fcf09acb8d24f293ce69aaf1673851175ca7a`.
- sync-quest-typecheck: `npm run typecheck`; exit0, 9.882s; log SHA256 `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.
- sync-quest-lint: `npm run lint`; exit0, 25.493s; log SHA256 `64ef18bd16f812a048e5d016a57900763eaa6c02c2e7a32bb2a3cbbdaed0531f`.
- sync-quest-build: `npm run check:test-bridge-shake`; exit0, 17.853s; log SHA256 `09a4ae749d0fc98d51d7d0ac10141cd78d6deabb39546d15b88a7002373eb3f6`.
- sync-quest-coverage: `npm run test:cov -- --coverage.reportsDirectory=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-sync-quest-vrg73hnd/coverage`; exit0, 43.449s; log SHA256 `bf8f0daaae96e8c6fd13345219eb4742c4cc50bef5f964c825ca19f628ac54cd`.

## Independent review and artifact ownership

Root and independent producer/QA final combined verdicts APPROVE/ADEQUATE.
Each separately rehashed frozen source/tests/schema, all10 command results and
log hashes, full/coverage counts and the engine coverage JSON/counters. All
consumers finished and explicitly released their raw retention holds.

Exact task root: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-sync-quest-vrg73hnd.
Contains check.py, initial draft, RED/GREEN logs/result records and coverage.
After all consumers finished, root removed that exact root and task-owned
worktree dist/node_modules/.vite and verified every path absent.
Shared dependencies/caches and source/history are preserved. No browser/server
process started in this child. Original checkout is read-only; root worktree
claim continues for full v1. No push/PR/merge/deployment.
