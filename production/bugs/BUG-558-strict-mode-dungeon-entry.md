# BUG-558 — Keep dungeon entry idempotent during repeated mount effects

Status: Locally fixed; affected checks and browser reproduction pass. Severity: High.
Owner: root, frontend. No commit/publication.

## Reproduction

Branch `feat/playable-foundations`, HEAD `b5a0898` plus preserved changes.
Current source identity: `bug557-source-audit-v1.json`, hash
`0eba061fc55b3b948679f9d8005e4320a479486c253ca55b1546f3f3fa77cf58`.
Chromium 147.0.7727.15, 360×640, en, Vite development with React StrictMode.
This is a lifecycle/admission bug, not an engine seed defect. Native Ashen
attempt ordinal 5 was pending; no browser defeat is accepted.

1. Import the retained diagnostic save through Settings; Save and restart the
   browser, then Continue. Import/export equality and restart equality pass.
2. Open Map and click the enabled Ashen dungeon entry button.
3. Observe the combat screen.

Expected: one admitted battle and visible battlefield; repeated lifecycle
callbacks consume no additional attempt and do not refuse the admitted battle.
Actual: the first effect starts combat; its StrictMode replay sees captured
`inCombat=false`, calls the entry preflight again, receives `combat-active`,
and permanently displays the entry-refusal message instead of unit cards.
The source entry ordinal has already been consumed. No console/page/HTTP error.

## Evidence

Retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

- `p18-current-browser-defeat-v3.json`: actual browser reproduction.
- `p18-current-browser-defeat-v3-stopped.png`: refusal with no battlefield.
- `p18-current-browser-defeat-v3-failure.txt.gz`: full failure.
- `p18-current-browser-defeat-v3-exit.json`: terminal, exit 1, no descendants.
- `bug558-before-inputs-v1.json.gz`: exact pre-edit UI/test/planning bytes.

Affected systems: frontend CombatScreen automatic admission, shared with manual
and quest encounter entry. Root cause: admission uses a render-captured combat
flag across repeated effects instead of the current store state. Production
bundles do not perform development StrictMode effect replay; this report proves
the development-source defect and requires safe repeated lifecycle handling.
Workaround: no reliable UI workaround established for this development path.
Keep StrictMode and entry guards enabled; fix the shared admission boundary.

## Resolution — 2026-11-01

The shared automatic entry effect reads live `useCombatStore.getState().inCombat`
instead of its stale render capture. Both StrictMode regressions fail before
this one-boundary fix and pass afterward, including fresh retry and exact
recording/ordinal counts.85affected UI tests, scoped types/lint and the actual
browser reproduction pass. Two actual defeats preserve all earned domains;
three acknowledged browser-process restarts restore exact saved states.
Regression: `src/features/combat/CombatScreen.endgame.test.tsx`.
[Evidence](../../docs/plans/evidence/p18-current-browser-defeat-retry.md).
No commit/publication; locally fixed source hash
`c40ea546cb3459ca8e8148fa19542ea68d7c3dcbf4456955084e199bbafb640d`.
