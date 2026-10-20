# BUG-009 — Advance tracked clear objectives after a qualified area victory

Severity: High (main-quest objective cannot advance). Owner: store/content/QA.
Status: fixed in the containing P04a01 commit; reproduced at
`d39fe6467fdcd81c74e339bc8d0346126073f4e6`, 2026-10-20.
Affected systems: `mapStore`, Den quest data, combat-to-quest integration.
Environment: Node 24.21.0, Vitest 1.6.1 UI project (jsdom); run seed 7,
challenge ordinal 0, fixed epoch 1792454400000. Browser/viewport/locale are not
applicable to the initial store reproduction; both rendered locales are a
separate browser validation below.

## Reproduce before patch

1. Run `npx vitest run --project ui src/stores/quest-area-clear.test.ts --reporter=dot`.
2. Track `quests/act1-den-of-evil` with both objectives false.
3. Start canonical `areas/act1-den-of-evil` through the production planner,
   using the declared durable/high-attack integration fixture. Drain each
   recorded wave and advance only after its real player victory.
4. Inspect quest state after the final win. Repeat after clearing the area
   before tracking the quest.

Expected: one canonical final clear updates only `obj-clear-den` to true.
`obj-return` stays false, status stays `inProgress`, and claiming is refused.
A replay can progress a newly tracked quest in an already-cleared area.

Actual: the area becomes cleared, but its quest objective stays false.
Evidence: five failures / five passes in the first focused run (6.47 s).
Failures cover authored identity, actual final win, replay after an old clear,
atomic publication, and completion only after all authored objectives are true.
The committed regression source retains the exact fixtures and assertions.

Root cause: the quest references legacy `areas/act1_den_of_evil` rather than
the playable `areas/act1-den-of-evil`. `markCleared` stores only area membership
and returns early for old clears; it never evaluates tracked objectives.
The prerequisite BUG-008 already qualifies wins and emits one final clear.

## Correction scope

Correct only Den's clear-objective area reference. Update matching clear-area
objectives for `inProgress` quests at the existing `markCleared` boundary,
publishing area membership and merged objective state atomically. Evaluate
objectives even for an already-cleared area; repeated satisfied events are
no-ops. Preserve claim flags and all nonmatching progress. Completion requires
every authored objective. Do not manufacture talk progress or grant rewards.

Security check: pass; bundled quest data and local progress only. No network,
credentials, dependency, permission, save-shape or validation-policy changes.

## Validation and remaining limits

Producer independent source/test review: APPROVE. Final browser cases use
ordinary creation, import, quest tracking, map/combat, save/export and reload
controls in en/zh-CN at 1280×800 and 360×640. Imported powerful heroes prove
event/persistence wiring only; they do not establish earned campaign balance.

All commands below exited 0 on the final source change:

- Focused: `npx vitest run --project ui src/stores/quest-area-clear.test.ts --reporter=dot`:
  10 pass, 2.92 s after the five-failure baseline.
- Related: `npm run test:related -- src/stores/mapStore.ts src/data/quests/main.json src/stores/quest-area-clear.test.ts`:
  29 files, 296 pass / one existing skip, 19.97 s. Includes the actual data
  loader (11), data integrity (30) and item catalog integrity (6) checks.
- Full: `npm test`: 92 files, 892 pass / one existing merc-XP skip, 32.72 s.
- `npm run typecheck`, `npm run lint`, `npm run build`: pass. Final browser
  and store files also pass `npx eslint --no-ignore src/stores/mapStore.ts src/stores/quest-area-clear.test.ts tests/e2e/quest-area-clear.spec.ts --max-warnings=0`,
  covering the browser spec excluded by default repository lint. Existing large-bundle
  and unprecached asset-manifest warnings remain; no offline/performance
  acceptance follows. Full/related timings exceeded their budgets during
  concurrent validation; thresholds and assertions were preserved.
- `E2E_PORT=4297 PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_HTML_OUTPUT_DIR=/tmp/d2h5-den-objective/html npx playwright test tests/e2e/quest-area-clear.spec.ts --project=chromium-desktop --project=mobile-portrait --output=/tmp/d2h5-den-objective/results --reporter=line --workers=2`:
  four pass, 18.0 s (Playwright 1.59.1 Chromium). English/Chinese ×
  1280×800/360×640; ordinary UI import,
  start tracking, Enter, Skip, return, Save, Export and reload. Only timer
  transport is controlled. The engine, rewards and advancement remain real.

The first browser attempt passed English twice but had two test-reader
failures on the Chinese wave label. The second exposed the initial 1/1
mount placeholder and the counter's appended area/kind text. Corrected the
test to await the installed plan and assert the localized wave prefix; the
final four cases pass without changing product behavior or lowering any
victory/objective/save assertions. Initial outputs are disposable after the
evidence is recorded here; raw tool output remains in the session history.

Regression paths: `src/stores/quest-area-clear.test.ts` and
`tests/e2e/quest-area-clear.spec.ts`. No save shape/version change or migration.

Akara talk integration, actual quest completion/claim/unlocks, unsupported
reward kinds, recoverable inventory overflow, and D10/D11 economy/permanent
reward reconciliation remain unaccepted. Den's `gold: 0` adds no gold.
The existing missing zh-CN translation for the return-to-Akara objective
still uses its English data fallback; this child does not accept locale parity.

Task-owned disposable paths: `/tmp/d2h5-den-objective` (browser outputs and
unit log), worktree `dist`, and `node_modules/.vite`: verified removed after
all validation finished. Installed dependencies and shared caches retained.
