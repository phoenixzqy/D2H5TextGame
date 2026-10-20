# P04a04a — Den and shared quest claim safety

Date:2026-10-20. Status: bounded core accepted by root/producer/QA.
Input8d47a92. Runtime and locale-only change at the existing claim boundary;
[contract](../decisions/D11-quest-claim-safety-v1.md),
[BUG044](../../../production/bugs/BUG-044-quest-claim-partial-and-reentrant-grants.md).
No push/PR/merge/deployment. Full D11/P04/campaign/C0–C4/G0–G7 remain open.

## Contract and root correction

Actual Den still requires clear→Akara→explicit Quests claim. Success grants
exactly500 cumulative player XP via existing progression, automatic level and
milestone points, one extra quest skill point and375 fielded-merc XP once.
No fielded merc is valid; gold0 changes no inventory/currency. Preserve existing
objectives, completed-status Act gating and unlock semantics.

Whole-bag preflight rejects no-player, unfinished hydration/pending import and
unsupported reward kinds before any writes. Positive gold is unsupported under
D10's no-gold direction. Existing executable numeric kinds/IDs remain operational;
known zeroes are no-ops and empty/all-zero bundles remain unclaimed. Global
synchronous guard refuses same/different nested claims and stays held through
success/restoration. canClaim deliberately remains basic action availability.
QuestsScreen runtime is unchanged; five new result strings exist in both locales.

Synchronous mutate-then-throw failures restore only participating player, merc,
currency and exact original target progress data through partial setState;
actions/other records/domains survive. All remaining restores are attempted when
one fails; AggregateError retains original cause and reports restoration failure
explicitly. A normal grant-failed result follows successful restoration only.
This is settled-state safety at return, not atomic subscriber publication or
crash safety. No persistence/engine/schema/store API/save/content changes.

## Genuine RED and independent review

Tests were authored and reviewed before runtime. QA corrected a draft absolute
merc XP oracle: normally hired InnerSight starts L3/cumulative216, so claims use
captured baseline+375. Initial RED35fail/40pass also exposed a false autosave
oracle: projection updates both save timestamp and idle lastOnline. Corrected
fake time precedes resets, and complete expected payload explicitly copies both
clocks. No selected-field weakening or runtime patch concealed either error.

Frozen RED34fail/41pass/75,0pending: core26fail/9pass; real persistence2fail/
1pass; UI6fail/10pass across both locales; talk13pass/town8pass. Of34failures,
22 are ordinary behavior,10 controlled recovery and2 supplementary missing
translations. These injected throws prove recovery contracts, not naturally
observed production exception incidents. Paid Den/autosave/hydrate/repeat,
normal/milestone grants, numeric currencies and basic eligibility pass as controls.

Root/producer/QA approved plan and frozen RED before source edits. Producer/QA
then independently approved runtime2c21221a and focused75GREEN with frozen test
hashes unchanged. No broad campaign or browser acceptance follows from this.

## Validation

`$RAW` expands to
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-den-claim-keme1h0d`.
Each command ran in the claimed isolated human-worktree-2; check.py writes exact
argv/exit/wall time and log. JSON reports independently expose all outcomes.

| Check | Exact command | Exit | Wall | Result |
| --- | --- | --- | --- | --- |
| red | `npx vitest run src/features/quests/claimReward.test.ts src/features/quests/claimReward.persistence.test.ts src/features/quests/QuestsScreen.test.tsx src/stores/quest-npc-talk.test.ts src/features/town/TownScreen.test.tsx --reporter=json --outputFile=$RAW/red-vitest.json` | 1 | 5.940s | 40 pass / 35 fail / 0 pending, 5 files |
| red-typecheck | `npm run typecheck` | 0 | 9.854s | — |
| red-lint | `npx eslint src/features/quests/claimReward.test.ts src/features/quests/claimReward.persistence.test.ts src/features/quests/QuestsScreen.test.tsx src/stores/quest-npc-talk.test.ts src/features/town/TownScreen.test.tsx --max-warnings=0` | 0 | 5.823s | — |
| red-final | `npx vitest run src/features/quests/claimReward.test.ts src/features/quests/claimReward.persistence.test.ts src/features/quests/QuestsScreen.test.tsx src/stores/quest-npc-talk.test.ts src/features/town/TownScreen.test.tsx --reporter=json --outputFile=$RAW/red-final-vitest.json` | 1 | 6.307s | 41 pass / 34 fail / 0 pending, 5 files |
| frozen-typecheck | `npm run typecheck` | 0 | 9.756s | — |
| frozen-lint | `npx eslint src/features/quests/claimReward.test.ts src/features/quests/claimReward.persistence.test.ts src/features/quests/QuestsScreen.test.tsx src/stores/quest-npc-talk.test.ts src/features/town/TownScreen.test.tsx --max-warnings=0` | 0 | 5.510s | — |
| green-focused | `npx vitest run src/features/quests/claimReward.test.ts src/features/quests/claimReward.persistence.test.ts src/features/quests/QuestsScreen.test.tsx src/stores/quest-npc-talk.test.ts src/features/town/TownScreen.test.tsx --reporter=json --outputFile=$RAW/green-focused-vitest.json` | 0 | 5.940s | 75 pass / 0 fail / 0 pending, 5 files |
| green-typecheck | `npm run typecheck` | 0 | 9.696s | — |
| green-scoped-lint | `npx eslint src/features/quests/claimReward.ts src/features/quests/claimReward.test.ts src/features/quests/claimReward.persistence.test.ts src/features/quests/QuestsScreen.test.tsx src/stores/quest-npc-talk.test.ts src/features/town/TownScreen.test.tsx --max-warnings=0` | 0 | 5.700s | — |
| green-related | `npm run test:related -- src/features/quests/claimReward.ts src/features/quests/QuestsScreen.tsx src/stores/playerStore.ts src/stores/mercStore.ts src/stores/mapStore.ts src/stores/persistence.ts --reporter=json --outputFile=$RAW/green-related-vitest.json` | 0 | 26.054s | 720 pass / 0 fail / 0 pending, 57 files |
| green-full | `npm test -- --reporter=json --outputFile=$RAW/green-full-vitest.json` | 0 | 34.763s | 2310 pass / 0 fail / 0 pending, 136 files |
| green-lint | `npm run lint` | 0 | 35.098s | — |
| green-coverage | `npm run test:cov -- --coverage.reportsDirectory=$RAW/coverage --reporter=json --outputFile=$RAW/green-coverage-vitest.json` | 0 | 40.722s | 2310 pass / 0 fail / 0 pending, 136 files |
| green-build | `npm run build` | 0 | 8.810s | — |
| green-bridge | `npm run check:test-bridge-shake` | 0 | 8.825s | — |

All final tests have zero failures/pending. No assertion/threshold weakening,
skips/retries, hooks bypass or runtime debugging bridge. Typecheck/full lint
including51-file engine purity pass. Full and coverage each2310/136; related720/
57; frozen focused75/5. Unchanged80% engine-only coverage gate:63files,
8102/8582statements(94.407%),1891/2104branches(89.876%),296/315functions(93.968%).
Coverage intentionally excludes claim/store/UI source; focused/integration assertions
own that proof. No engine source changed, so no separate engine-only run needed.

Real persistence tests fake only Dexie IO, inspect every complete saved payload,
prove500ms debounce captures paid/restored states, load/hydrate actual paid save
and refuse repeat, and pause a real import while hydration remains ready to
prove old/incoming/final payload integrity. No persistence implementation change.

Timing limitations: related26.054s exceeds5s budget, full34.763s exceeds15s;
full lint35.098s ran alongside full tests, so timings are not isolated performance
measurements. Coverage40.722s. Build retains existing stale Browserslist,
>500KB main-chunk(1195.44–1195.70KB) and generated2.57MB manifest-not-precached warnings.
No performance, offline-completeness or bundle-budget acceptance is inferred.
Ordinary-earned Den browser/production interaction proof remains the next slice.

## Exact source and raw provenance

- `src/features/quests/claimReward.ts`: `2c21221a8a9163665a8ba2e7ec1146dd846a5472c7bb2ca9645bf3b6fd625706`.
- `src/features/quests/claimReward.test.ts`: `70135ad4fbe35561562165061005c512fb6e6b44d392494243259de0161bdb8b`.
- `src/features/quests/claimReward.persistence.test.ts`: `a0dcfe2f6d43b985cd580ff8168fe8aeca2d675583b4df0e12e21c272bfd067a`.
- `src/features/quests/QuestsScreen.test.tsx`: `1684209f0576b7d1092c4a26d8b3894b86ccc29ffa3f36fae54c4ea38f1f8fc7`.
- `src/features/town/TownScreen.test.tsx`: `38fe4f86913dfa72ff236947fd871f3deab20aacd739ac934b92e1105bdcb237`.
- `src/stores/quest-npc-talk.test.ts`: `0f109390bc2977012f6fbdcedd19b0bb9e9b0bcb17d69bfcbc7529f248ee4b24`.
- `src/i18n/locales/en/quests.json`: `a5ebb3e8588ce56cf46a418c3a4b2b49ba3d4f1f2d93f36b25130d68bbd49699`.
- `src/i18n/locales/zh-CN/quests.json`: `be4e3bfca4d0c52e0bb6aa5776d4a22c3fef6bd5e3bc107ca8193bbc02157fe4`.

- `red-final-vitest.json`: `95000e78cbcb25abcf94a254d5a95ebc6a1d50d3394207355026b05d36d90a48`.
- `red-final.log`: `3d90c21979eafde3f0e1b3463037f12394a61f0e9f0ad278e3ebc931f988d2a6`.
- `green-focused-vitest.json`: `7b5a0d878dc6d1723d47f2458e270ba27325a7099879d9e3190be46afe760066`.
- `green-related-vitest.json`: `e6b9a7e4f09d5968009c476dbee1b769367f08f02d6b19469eebb73121e73df7`.
- `green-full-vitest.json`: `fe1514e593538f84c71ac38b810bb16f7ba08d6b616bcb064d0d2545ce1f70b0`.
- `green-coverage-vitest.json`: `566b92ed5b82b6a4fb1ed1a85ebdaeb181cdb05f08c194c910afadcc2f7ce512`.
- `coverage/coverage-final.json`: `d6259423d0c9c01bfe8919a26631d528a44decf15eef346e0686c290438a449f`.
- `green-build.log`: `509e92f9d3ac3f25ed92ed2a4eb881f70b3023a105dc54ae590b98a568f8b19e`.
- `green-bridge.log`: `cbd4b53f95dd9c7683b140b184311f5deae7953a969a03c1f4774e3c6ff427c2`.

## Retention and cleanup

Producer and QA independently returned final APPROVE/ADEQUATE after verifying
all commands, hashes, test counts and coverage. Both released raw-retention holds.
Root then removed the exact raw root above and task-created worktree `dist` and
`node_modules/.vite`; absence was verified for all three resolved non-symlink
paths. Shared dependencies/tool/browser caches, original checkout and recorded
Git history remain preserved. No task server was started in this core slice.
Root accepted this bounded core; ordinary-earned Den browser proof is next.
