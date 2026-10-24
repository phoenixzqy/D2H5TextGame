# BUG-148 — Make the authored respec policy available in town

Severity: High. Status: fixed locally in `b67f0a0`; independent acceptance pending.
Owner: root (engine/store/frontend). Browser target: Chromium 360×640 and1280×800, zh-CN/en. Seed: not applicable.

1. Continue an allocated character and visit Akara or Drognan in town.
2. Look for stat/skill reset and a confirmation showing the refund/cost.
3. Inspect `playerStore.respec`: only synthetic gold callbacks exist.

Expected: progression-curve §§4.3/5.3: independent three free stat/skill resets,
then five wishstones; explicit confirmation; exact earned-point refund and persistence.
Actual: no service, counters or lawful currency payment. Tests invoke a gold-only port.
Evidence: `src/stores/playerStore.ts`, `src/features/town/TownScreen.tsx`,
`docs/design/progression-curve.md:128`. Source reproduction; no gameplay ordinal consumed.
Root cause: authored policy never connected to runtime/persistence/town.
Workaround: none in ordinary UI. Do not fabricate gold or alter the earned save.

Production browser reproduction additionally found the missing Drognan NPC in
ActII. `respec.test.ts` has a causal configured-NPC presence regression; the
canonical dialogue and both locale keys are added. The original browser setup
and interrupted broad run are retained under the D11 evidence root.

Final validation: full11326/430+2 existing skips; types/lint/build and bridge scan
pass; production8/8,56 native saves and8 exact Continue pairs audited. Regression
paths: `respec.test.ts`, `respec-v21.test.ts`, `respecActions.test.ts`,
`TownRespecPanel.test.tsx`. See `docs/plans/evidence/d11-town-respec.md` for limits,
raw evidence ownership and verified disposable cleanup.
