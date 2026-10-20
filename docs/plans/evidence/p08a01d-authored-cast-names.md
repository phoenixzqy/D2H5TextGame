# P08a01d — Authored combat cast names

Date:2026-10-20. Status: accepted by root/producer/QA; final8browser passes.
Tests/browser checkpoint0df510a; converter runtime uncommitted at validation.
Structured bug:[BUG033](../../../production/bugs/BUG-033-fire-bolt-copy-units.md).

## Bounded behavior

New action log entries resolve authored SkillDef.name from exact authored and
canonical event IDs, then translate in the current locale. Exact authored IDs
win over generated aliases. Existing direct-key compatibility and exact unknown
original-ID fallback remain. Null/empty skill IDs keep basic-action wording.
Only eventToLogI18n.ts changes runtime behavior; no engine/event identity,
registry/data/locale/save/combat change. Existing log history is not retranslated.
Buff/status labels and whole skill/localization/campaign acceptance are separate.

All283 authored name references resolve both locales. Prior direct canonical
lookup missed197/283 per locale. Independent literal tests cover all seven
classes plus monsters/mercenary/aura. Merc names use authored skills:mercenary,
including Chinese Minor Heal 小型治疗. Full-corpus checks supplement literals.
Real seeded Fire Bolt recording/playback keeps canonical sorceress.fire_bolt,
first42MP after8cost, full resource transport, engine-control result and final
teams, unchanged input and recorded events. Desired copy is Fire Bolt / 火弹.

## Tests-first and source review

Root/producer/QA independently APPROVE frozen tests and genuine RED before any
runtime edit:33fail/12pass/45total,0skips,runner2.79/wall4.172seconds. Both real
engine→store tests fail only at final literal name after mechanics controls pass.
Initial test fixture readonly assignments failed TSC and were corrected through
immutable construction, without changing runtime or weakening assertions.
BUG033 preserves initial/revised evidence and exact hashes.

Same approved tests now pass45/2files,runner2.36/wall3.594seconds. Root/producer/
QA source/focused APPROVE. Browser diffs only change exact Fire Bolt/Weak Melee
cast literals and2stale comments; all MP/count/timing/damage/progression/pause/
Save/export/IDB/close-newPage-Continue/locale/production/error oracles remain.

Frozen SHA256:

- converter: `7ef1cfb95935073c3d818eb7f7bcbd1044701c252e0a811ca27e4a7f3af44aba`
- converter tests: `cca80526160525c802cea3a8e21688bfeaba8f312489df9c0ec0499c213a0eb0`
- playback tests: `c232c05c85c6295c21fc7bd6013d1358ff91c854d2ef2599053638ea4cc644c8`
- Fire Bolt browser: `1d546fcf3bc1488786748592f988668d47c98ab142a6ed60ccbac3331d79d5b6`
- Warmth browser: `066bb92db257d38acd9d60af1b81087fb3b2d77d7d50b54b139d8157927639c9`
- unchanged config: `ca32c864e08d64c5eaf1554b98cf00289bffb3b346746b4a2ca68a991bfde837`

## Combined validation

Exact commands/exit/wall records and complete logs live under the temporary
evidence root below. Each final command exits0:

| Label | Command | Tests/files; runner / wall seconds |
| --- | --- | --- |
| cast-green-focused | `npx vitest run --project ui src/stores/eventToLogI18n.test.ts src/stores/combatStore.test.ts --reporter=verbose` | 45/2;2.36/3.594 |
| cast-related | `npm run test:related -- src/stores/eventToLogI18n.ts src/stores/eventToLogI18n.test.ts src/stores/combatStore.test.ts` | 525/44;23.74/25.366 |
| cast-full | `npm test -- --reporter=dot` | 1939/127;27.96/29.459 |
| cast-final-typecheck | `npm run typecheck` | wall16.569 |
| cast-final-lint | `npm run lint` | wall35.581; purity50 engine test files |
| cast-browser-lint | `npx eslint tests/pwa/fire-bolt-earned.spec.ts tests/pwa/warmth-earned.spec.ts --no-ignore --max-warnings=0` | wall9.154 |
| cast-final-build | `npm run build` | build8.74/wall14.093 |
| cast-final-coverage | `npm run test:cov -- --coverage.reportsDirectory=<task-evidence-root>/coverage --reporter=dot` | 1939/127;31.97/35.428 |

No final unit failures/skips. Unchanged80% engine coverage gate passes:
94.21%statements/lines,89.02%branches,93.87%functions. Engine-only coverage does
not measure changed converter; no engine source edited. Related/full5/15second
budgets remain exceeded. Related/T/L/build overlapped; units then full then
coverage ran serial; browser follows coverage. No performance acceptance.
Existing >500KB chunk and2.57MB manifest-not-precached warnings remain.
Build756precache entries37327.82KiB, not full offline coverage acceptance.

SHA256 of final logs:

- cast-green-focused: `1fa3dc32e78e5316e1d3952153c2881565c8f9255c2de4f8a4f3a043d245a556`
- cast-related: `5275410fba667213b4093d9202be2b01c35787f1be14637e2cc26f7f5b021fd2`
- cast-full: `8d2e97072b320ee31fe1a39326de86f2d310a7d15137d0cda12bd02a6b9c6d25`
- cast-final-typecheck: `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`
- cast-final-lint: `f993e44b236baecc1c859ee65eddb3e93dd84768b4b42839e265cb8901074f9e`
- cast-browser-lint: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- cast-final-build: `60ee7fc286e6f082df52c0e8e2596b9b53d8671a3eecfedd3785ce47692ceca1`
- cast-final-coverage: `33b980c1a0e0efc5f55eb6d4da2798fc2a44b75bc815449697b63f6f30237528`
- coverage-final.json: `e848edd36e59ac44501069e3ea0e2283031972bae853b82a7e1fc521983b8450`

## Production browser and cleanup

Final8case native production matrix passes: both existing specs ×en/zh-CN ×
desktop1280×800/mobile360×640. Retries0, normal elapsed timers, fixed Date only.
No game-state/bridge injection; read-only IndexedDB comparisons. Dedicated
PWA server owns its lifecycle at4390. Root owns exact task evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-cast-names-wo20mia_`.
Retain all raw until root/producer/QA final consumers finish, then remove exact
scratch, task-owned dist and local .vite and verify. Installed dependencies/
browser/shared caches/source/history remain. Root worktree stays claimed for
full staged v1; C0–C4/G0–G7 remain unaccepted. No publication.


Final browser8/8,0failed/skipped/flaky/retries, top-level errors[];
runner260.803s/checker262.201s. Native8case matrix exceeds the4minute full-E2E
budget; no timing target acceptance. Four Fire Bolt cases20.991/21.627/19.483/
19.919s (desktop en/zh, mobile en/zh). Warmth101.838/103.905/100.045/102.231s.
Fire Bolt page-error collections are empty. Warmth page-error and console
warning/error collections are empty on original/reopened pages, by unchanged
assertions. Runner Node FORCE_COLOR/NO_COLOR warnings are separate
from browser console evidence.

Root decoded all12 actual attachments: four rank1 opening logs and four earned
Warmth plus four reopened timelines. Literal casts resolve Fire Bolt/火弹,
Weak Melee/弱近战 and merc Inner Sight/心眼. Status/buff raw IDs still present
and are explicitly outside this cast-name fix. Fire Bolt hit remains21 fire;
whole-save progression/reopen assertions pass. Independently rechecked exact
cap→spend→tail/MP/action-count boundaries in each actual Warmth attachment:

| Recording | Cap/spend/boundary observer indices in all4 cases | MP / hero casts / enemy actions |
| --- | --- | --- |
| ordinal1 oldwave1 | 138/140/147 | 99/7/7 |
| ordinal1 newwave2 | 185/187/198 | 101/7/6 |
| ordinal4 oldwave1 | 94/96/121 | 108/4/4 |
| ordinal4 newwave2 | 81/83/115 | 109/3/3 |
| reopenedrank2 | 2/4/15 | 103/1/1 |

Indices are observed diagnostic positions, not product timing oracles. Tests
retain literal74/75fire, rank-sensitive99/101/108/109, full-save equality and
reopened110→102→103MP. No raw sorceress/monster cast-ID fallback remains in
these attached timelines. Engine mechanics, canonical IDs and saved ranks
remain unchanged. Root/producer/QA final combined APPROVE / ADEQUATE. Both
independent consumers finished all raw evidence consumption before cleanup.

Exact final command:

```sh
PLAYWRIGHT_BROWSERS_PATH=/home/felixzhao/.cache/ms-playwright PWA_PORT=4390 \
PLAYWRIGHT_JSON_OUTPUT_NAME=<task-evidence-root>/cast-browser-report.json \
python <task-evidence-root>/check.py cast-browser \
npx playwright test --config=tests/pwa/playwright.config.ts \
fire-bolt-earned.spec.ts warmth-earned.spec.ts --reporter=line,json \
--output=<task-evidence-root>/browser-output
```

Reporter SHA256:
`62b51d13f0d03c8298f029321129d42762edb4cf8a3cb1d457b6aa2ee30551a3`.
Raw browser log SHA256:
`fee1c60b933b4c10181d286c2941098c54174040952be823306221339e1a0b58`.


After all consumers finished, root removed and verified absence of the exact
cast scratch root above, task-owned dist and local node_modules/.vite. Port4390
was closed; no task processes remain. Shared caches/dependencies preserved.
