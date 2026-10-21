# BUG-056 — Make mobile combat cards and names readable

Status: Resolved by the independently reviewed P16a01 presentation repair;
implementation commit recorded in the closing evidence update.
Severity: Medium — desktop/scrolling workarounds exist, mobile readability is poor.
Owner: frontend-dev; root implements, independent producer/QA/UX/TD review.
Affected systems: combat presentation only; no engine, formation or save change.

## Reproduction

Build parent28be484 with unchanged CombatScreen SHA256
`d708f8d0917f3988eb96339c386060c29ad2a830c5841bdf2548859b695d7b72`.
Linux/Playwright Chromium production PWA, en,360×640; actual Chromium version
is retained in browser report. No engine seed override; native fresh Druid/free
starterRogue run. Date fixed2026-10-21T00:00Z; native timers remain active.

1. Create ordinary16-character `ReadabilityProof` Druid.
2. Select English, freehire/field actual starterRogue; explicitly Save.
3. Enter BloodMoor once, observe native feedback, Pause duringW1.
4. Measure inner compact cards, name line boxes, HP, cells, toolbar and main.
5. Resize the same paused state through8reviewed viewports, then Flee.

Expected: below1024px teams stack while retaining3columns and cell identities;
inner cards≥84px at360 and≥100px at412; full wrapped14px/18px names,6px HP,
112px minimum cells/content growth, compact40–48px separator;44px toolbar
hit areas and usable scrolling main. Desktop battlefield remains unchanged.

Actual at360: inner occupied card minimum20.296875px,10px truncated names,
4px HP,109.5px image,288px separator. Cellminimum144/empty128 instead of
112/0. At412cards28.953125px;640landscape62.953125px. Side-by-side teams and
oversized empty rows persist below1024. Screenshot shows near-unreadable
names, overlapping feedback and metadata squeezed beside the toolbar.

## Evidence and root cause

Frozen specSHA256 `c7bfb76ef6e5a54a94cb8e66e2bc206ef53c9f55041f4f82651e6f354286930f`.
The genuine production RED reaches577soft geometry assertion failures in one
completed13.517s case/26.072s bounded process, not a selector/font/collection
failure. All8size samples, paused10representatives/18cells, unchanged visible
state/readonly committed save and successfulW1Flee remain in the report.
Browser error array empty; no timeout, signal or surviving process. Synthetic
extra-row/stack controls plus existing combat UI tests pass before patch.

RAW `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-combat-readable-5nscfev_`:
`pilot-red-report.json`, `pilot-red.log`, frozen sources, process records,
`red-360.png`, `red-geometry-summary.json`. Durable packet follows validation.

CombatScreen unconditionally uses two three-column team grids and a wide
vertical separator across360px, and compact names explicitly truncate at10px.
Fix the responsive container/card/header classes at their source; preserve
cell/group algorithms, handlers, true-resource calculations and game state.
No horizontal-scrolling workaround or product font dependency is needed.

No campaign clear, balance, fullP16/G5/accessibility acceptance is inferred.
Host CJK glyph consumption/visual judgment remains separate validation.

## Post-patch containment finding

First layout patch resolves the measured card/text/HP/cell/separator/header/
scroll/save checks in both locales across8sizes, and CDP confirms actual four
WenQuanYi CJK glyphs. The attempted GREEN remains failed:9en/7zh soft failures,
all at frozen badge-top containment assertion. Existing animate-bounce translates
its badge upward by25% of badge height, exceeding the4px top inset (observed
0.03–4.53px outside allowed boundary). This is a real presentation defect,
not a flaky test to weaken. Preserve `pilot-green-report.json` and its39.330s
command/failure artifacts. No timeout/signal/survivor.

Proposed root correction: change only this badge's bounce motion to opacity
pulse, retaining localized feedback, color, placement, status timing and reduced
motion behavior while removing spatial translation. Independent UX/TD review
precedes correction; frozen assertions remain exact.

## Resolution

The reviewed responsive classes and opacity pulse pass the unchanged frozen
four-case/eight-size production matrix in both locales. Final3454 unit tests,
typecheck and lint pass; producer/QA/UX/TD approve the scoped result. Both failed
attempts and their original sources remain in the independently verified
[durable evidence](../../docs/plans/evidence/p16a01-combat-readability.md).
Full accessibility, campaign, balance and private-v1 acceptance remain open.
