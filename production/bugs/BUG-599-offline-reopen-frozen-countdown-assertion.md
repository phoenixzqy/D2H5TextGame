# BUG-599 — Refresh the read-only bonus view before an exact frozen-clock assertion

Status: Fixed locally; independent umbrella review pending. Severity: Medium (browser acceptance fixture timing).
Owner: root, qa-engineer responsibility.

## Reproduction

Uncommitted source based on HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`,
following BUG598's authored-precompiler fix. Chromium147, desktop1280×800 and
mobile360×640, en and zh-CN. No engine RNG seed applies.

1. Run `tests/e2e/offline-bonus-reopen.spec.ts` with its frozen browser clock.
2. Resume a20-minute bonus, then deliver exactly600seconds of online timers.
3. Check the chip immediately at that clock boundary without a new render.

Expected by the test: exactly10displayed minutes.
Actual:11minutes; the complete periodic save already matches the independently
calculated current bonus. The read-only display refreshes every30seconds, with
its phase determined by mount/render timing. At a frozen exact minute boundary,
the last legal projection can still ceil to11minutes. Real-time assertion polling
does not advance Playwright's paused application clock.

## Evidence and contract

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`bug592-storage-e2e-v2.log`, JSON and `bug592-storage-e2e-v2-output` traces/screenshots.
Failure at `offline-bonus-reopen.spec.ts:166`; preceding full periodic-save
assertions pass. D12's P17a04 contract explicitly allows30second refreshes and
requires actual wall-clock projection on render. `useOfflineBonus.ts` implements
that contract; no exact-minute timer phase is promised.

Correction: after checking the quiet periodic checkpoint, use ordinary character
sheet/settings navigation to remount the chip at the same frozen clock, then
retain the exact text/accessibility/full-save assertions. This does not change
elapsed time, grant a bonus, alter stored state, or relax save expectations.
No application behavior change is indicated by this failure.

## Verification — 2026-11-02

Only the test changes: ordinary navigation remounts the read-only chip at the
same paused clock after the exact periodic-save assertion. All4desktop/mobile
and en/zh-CN cases pass, with0skips/retries/flakes, in
`bug599-offline-e2e-v1.json` (60745.811ms). Changed-test lint passes. The previous
run's10save-management passes are reused; those cases were not rerun. No timer,
bonus grant, elapsed clock, full-save expectation or application source changes.
