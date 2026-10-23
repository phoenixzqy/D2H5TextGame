# BUG-128 — Preserve viewport and observe errors before Continue startup

Severity: Medium
Status: Fixed locally in `a2b008c`; production-browser validation passed
Owner: qa-engineer
Affected systems: production crafting and runeword Playwright evidence

## Reproduction

Local Exile increment above `0456f35`, production Chromium, English360×640.
No engine seed dependency; constructed native19 Exile fixture.

1. Run the dedicated `tests/pwa/crafting.config.ts` runner for Exile en360×640.
2. Import and equip the fixture, Save, close the page and create a new context page.
3. Assert the requested viewport before navigating to Continue.

Expected: every reopened page has the case's viewport and error/warning listeners
before the first navigation, including the final Continue page.

Actual: `context.newPage()` inherits1280×720 from the runner. The old helper
navigated, Continued and exported before its caller resized or observed it;
the final reopened page was never observed. Crafting uses the same old pattern.
The explicit pre-navigation360×640 assertion fails with actual1280×720.

Evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-exile-grant-8gn5xy3v`:
`exile-reopen-viewport-red.log`; preceding10/10 functional matrix preserved as
`exile-browser-before-startup-fix-report.json`.

Root cause: page setup was placed after the shared Continue helper returned.
This is a test/evidence coverage defect; no product failure was established.
Previous exact-save equality remains valid, but previous runs do not prove
startup at the requested viewport or absence of startup console/page errors.

Regression: `tests/pwa/runeword-grants.spec.ts` and `tests/pwa/crafting.spec.ts`.
Set viewport and attach observers within each helper before navigation, retaining
the explicit viewport assertion and every existing persistence assertion.

## Local correction and validation

Both helpers now configure viewport and listeners before navigation on every
new page. Corrected `production/browser-report.json` and
`exile-browser-startup-corrected.log` under the evidence root:12/12 passed in
161.47s,0 retries/skips/flaky/errors. Exile covers both locales and all five
required sizes; crafting revalidation covers both locales at360×640.
Independent read-only QA confirmed the source and raw results/exports CLEAR.
Historical crafting reports remain unchanged and their startup limitation is
documented in `docs/plans/evidence/d10-native19-crafting.md`; the other crafting
sizes' startup was not rerun. The same final source/test tree passes complete
unit10868/394 with2existing skips, engine5251/148, typecheck and lint.
Full evidence/commands/cleanup: `docs/plans/evidence/d10-exile-grant.md`.
