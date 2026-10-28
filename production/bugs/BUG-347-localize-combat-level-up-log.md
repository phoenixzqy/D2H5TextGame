# BUG-347 — Localize combat level-up log messages

Severity: Low. Status: open; deferred until the current frozen integration gate ends.
Owner: frontend-dev / QA (root sole writer).

## Reproduction

Base checkpoint `345cd7082ed220567651c70e04a24a93d333dcee` plus the
Countess/Malus physical integration. Production browser snapshot
`fd0313bfa94275b5d4838ef9c78cece1c95b727b88a7ba4c81e6adc99bf54c0f`.
Environment: headless Playwright Chromium, English at1280×800; the independent
review also observes the raw message in the Chinese desktop originals. This
is a UI translation case; no particular RNG seed is required. Fixtures are
constructed, with no genuine progression or balance credit.

1. Use the existing constructed browser matrix's fresh Countess fixture from
   `browser-gate-countess/check.mjs`.
2. Enter the ordinary Map Countess challenge and finish its native victory,
   earning the level-two transition from ordinary combat XP.
3. Inspect the Combat Log in the original desktop victory screenshot.

Expected: a localized level-up sentence with the reached level.
Actual: the literal `combat:levelUp:2` appears as the final log row. The other
combat rows and quest mutations complete successfully.

## Evidence and scope

Root and independent frontend reviewer both viewed
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-malus-h9_rzp5t/browser-gate-countess/en-1280-fresh-victory.png`.
The full16-case browser state/persistence evidence remains approved for its
bounded physical/Countess behavior, with this explicit cosmetic localization
caveat. The current final snapshot differs only by a test-only declaration;
production inputs are unchanged. No source fix, disabled assertion or genuine
replay is claimed. Root retains the original screenshot/script and will include
them in verified retention before exact task-root cleanup.

Next: trace level-up event formatting into log translation, preserve the native
event/value, add causal en/zh rendering coverage, and fix that boundary after
the current frozen integrated check. Root cause is not yet established.
