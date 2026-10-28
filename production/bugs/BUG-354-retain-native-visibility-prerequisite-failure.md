# BUG-354 — Retain visibility and target identity before preflight cleanup

- Status: Open — QA harness evidence gap; no game defect established.
- Severity: Medium. The failed prerequisite blocks the reviewed C2 hidden-tab
  diagnostic, and its failure evidence cannot establish the visibility cause.
- Found: 2026-10-27.
- Build: `b2ab4f84edb548cc9af27b9b69d60de8271d63a0`.
- Owner: `qa-engineer` / `technical-director` (native browser prerequisite).

## Reproduction

1. Use the separately reviewed blank-page prerequisite after the pinned default
   browser installer rejects Ubuntu26.04-x64. Preserve that installer failure.
2. Launch the exact existing Chromium1248 executable through Playwright1.59.1's
   explicit `executablePath` option. Its actual reported version is156.0.8078.4;
   no general cross-version compatibility is claimed.
3. Create two blank pages at1280×800 / English on DISPLAY`:0`, remove the three
   background-throttling-disable defaults, and disable CDP focus emulation on
   both pages. No app, source import or gameplay is involved; engine seed is
   not applicable.
4. Bring the placeholder page forward. The native foreground-page visible
   check succeeds; the subsequent cover-page hidden check times out5000ms at
   `browser-prerequisite.mjs:40`.

Original session60062 exits1 and is consumed. The native child receipt records
8.109s, `exitCode:1` and `inputDifferences:[]`. No retry or tuning occurs.

## Expected

Capture native target/window identities, current visibility and original
trusted event histories before evaluating the first prerequisite, and retain
the reached failure state before closing the browser. Confirm that the cover
control actually creates the intended tab relationship. A failure should leave
enough evidence to distinguish a harness placement error from a visibility or
host limitation.

## Actual

The result records browser launch/version/PID and the timeout, but its phase
array is empty. The first state record follows both initial assertions and is
never reached. The catch path records the exception without capturing the
pages' reached visibility/event state or native target/window identities, then
the finally path closes the browser.

The exact browserPID564612 is absent after closure and the executable hash is
unchanged. This establishes clean closure and a failed prerequisite, without
establishing why the cover-hidden condition was not observed. Different native
windows and host limitations remain hypotheses. No app was navigated or run,
and the prepared gameplay harness was neither approved nor executed.

## Evidence and follow-up

Root retains this card at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-c2-idle-preflight-7jxcfc0i.evidence.tar.gz`
with sibling manifest, retention and cleanup receipts. Decisive members:
`browser-prerequisite.mjs`, `browser-selection.json`,
`browser-preflight-results.json`, `browser-preflight.log`,
`browser-preflight-process.json`, `browser-preflight-receipt.json`, and
`preflight-freeze-before.json` / `preflight-freeze-after.json`.

Preserve this failed prerequisite unchanged. Before a separately reviewed
future diagnostic, correct the evidence placement and establish the native
tab/window relationship. Do not retry this card, infer synthetic visibility,
relax the required actual hiding, or claim any C2/gameplay acceptance. No
harness or game-code repair has been attempted after this observation.
