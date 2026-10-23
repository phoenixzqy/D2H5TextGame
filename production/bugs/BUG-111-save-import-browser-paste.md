# BUG-111 — Paste the exact native save through the browser clipboard

- Status: Corrected; bilingual production checks pass at all five viewports.
- Severity: Low (automation transport; no product input defect established).
- Owner: root / QA.
- Runtime: `d9326ed` production build; harness head `a8e596a` plus the frozen
  uncommitted Act V finale spec. Playwright 1.59.1 Chromium, 360×640, en/zh-CN.
- Seed: not applicable; both cases stop before importing or entering combat.
- Affected systems: `tests/pwa/act5-finale.spec.ts`; product Settings unchanged.

## Reproduction

1. Open the production build and create a Sorceress through ordinary controls.
2. Open Settings, select the locale, and open Import Save.
3. Call the browser test's `locator.fill(raw)` with the exact prior native
   service export: 391243 UTF-8 bytes / 391241 characters / 16433 newlines,
   SHA256 `977f1f09a2a737f9f54c8ccba76e147954e5839517762db6e212f24356f03746`.

Expected: insert the unmodified save text, then exercise the normal Import
button and compare all persisted domains to the production-decoded save.

Actual: both cases exhaust the 600000ms test timeout in `locator.fill`.
Neither presses Import nor tests any finale behavior. The terminal report is
`/tmp/d2h5-a5-integration-650ka_is/browser-finale-mobile/report.json`:
0 expected, 2 unexpected/timedOut, 0 skipped/flaky/retries, global errors `[]`,
622712.203ms total. Preserve this report, frozen inputs and both traces.

## Diagnosis and smallest correction

Independent read-only reduction traced Playwright textarea `fill` to Chromium
CDP `Input.insertText`. A default controlled React textarea preserves this
exact finale text through real clipboard paste in 451–586ms; the 1.38MB native
earned save takes 1655–1954ms. Disabling spelling and wrapping does not resolve
the slow `fill` path. Settings only stores text on change and parses on Import.
This supports changing the automation input method, not product styling or
validation. The precise Chromium internal algorithm was not profiled.

Grant the isolated browser context clipboard permissions, write the exact raw
text with `navigator.clipboard.writeText`, focus the native textbox and press
the platform paste shortcut. Assert exact text/hash, then retain the ordinary
Import button, production decoder and all-domain equality checks. No minified
substitute, DOM-value assignment, store bridge, timeout increase or assertion
removal. Full diagnostic:
`/tmp/d2h5-a5-integration-650ka_is/save-paste-diagnosis.md`.

Root owns the retained reports/inputs/traces through Act V and umbrella
consumers and removes disposable artifacts after those consumers finish.

## Verification

The corrected production scenario passes2/2 en/zh-CN360×640 in107.171s,
retry/skipped/unexpected/flaky0, global errors `[]`. It reaches every finale
control and all eight persisted-state attachments in each locale. Report
SHA256:`ad046186467b8aaf3b13ff513aee19b166284720337c5fb89a944feca9e79168`;
the failed original remains SHA256
`130bce279e215273dc6985edcac690a5f42c4124e20340d986d69f194976ae0a`.
Typecheck/scoped lint and independent source/evidence QA pass. Independent
manifest checks confirm741source/760build/3harness inputs and unchanged raw
service input. [Bounded finale evidence](../../docs/plans/evidence/act5-finale.md)
records the supported claims and retained actual final native saves.

The remaining four-size matrix also passes8/8, giving10/10 total. Its report
SHA256 is`f8411651d3fa2740a7f6877f7e444a7405442865cf5d1dd7dd796e9e1b10c266`;
independent QA verifies all64 additional staged save attachments and unchanged
source/build/input lineage. There are no retries/skips/flaky/browser errors.

## Earned-material continuation follow-up — 2026-10-23

The new materials-earned harness reused locator.fill with the exact authentic
native17 export (2,452,888 UTF-8 bytes, 104,014 lines), reproducing a setup stall.
Root interrupted its exact Playwright PID before import-baseline export or
challenge-start; zero combat attempts occurred. The report records one test
that did not run to completion, not a combat loss or successful material check.
The helper now uses the same clipboard transport and exact textbox equality
above. Product input remains unchanged. Independent review and the actual
earned browser continuation remain required before acceptance.
