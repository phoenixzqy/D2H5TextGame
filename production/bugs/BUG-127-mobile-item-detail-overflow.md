# BUG-127 — Keep mobile item details within the bottom sheet

Severity: Medium
Status: Fixed locally in `2dd0865`; production-browser validation passed
Owner: frontend-dev / qa-engineer

## Reproduction

Production build above `0456f35` with the Exile increment, Chromium at360×640,
English. No combat seed dependency; constructed native19 Exile import.

1. Import a level60 hero wearing a real valid Exile Monarch through Settings.
2. Inspect the equipped word, close the inspection and unequip to Backpack.
3. Select the Backpack item to open its mobile details and comparison.

Expected: readable item details and comparison inside the available sheet width,
without horizontal overflow or clipped controls.

Actual: document-level width fits360px, but `inv-detail-panel.scrollWidth` is332px
against328px `clientWidth`. The header Close button extends4px rightward because
of its `-mr-1` margin. No document overflow or clipped control was observed.

Evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-exile-grant-8gn5xy3v`:
`exile-browser-pilot3.log`, `exile-browser-pilot3-report.json`,
`exile-browser-pilot3.png`. These also prove import repair and prior removal
assertions passed before the layout failure. No earned or balance claim.

Regression: `tests/pwa/runeword-grants.spec.ts` (en360×640). Dimensions captured in
`exile-browser-dimensions.log` identify the44px Close button as the only child
extending past the panel. Removed its negative right margin; its44px hit target
and vertical alignment remain. Corrected production matrix:
`exile-browser-startup-corrected.log`, `production/browser-report.json`,12/12
passed in161.47s with no retries/skips/flaky/errors. Exile covers en/zh across
all five required sizes; the original strict panel-width assertion remains.
Independent read-only QA confirmed scoped closure. Final source/test checkpoint
`a2b008c` also passes full10868/394 with2existing skips. Complete gate evidence
is recorded in `docs/plans/evidence/d10-exile-grant.md`.
