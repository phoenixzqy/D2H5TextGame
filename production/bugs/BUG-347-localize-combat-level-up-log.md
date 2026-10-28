# BUG-347 — Localize combat level-up log messages

Severity: Low. Status: Fixed in `d6736f08e153be1e4c9fb7b83fa00f6a8a8df9d4`; final integration and production browser verification pass.
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
the current frozen integrated check. Root cause is established below.

## Causal native regression and root cause

After checkpoint988883ee, both en/zh regression cases fail at the missing
localized entry, after verifying the actual native victory, reached level and
exact XP delta. Original `level-up-red.log` and native receipt are retained
in the owned next-task evidence root. No XP path is mocked.

`src/stores/combatHelpers.ts` writes the raw `combat:levelUp:N` token into
`CombatLogEntry.message`. `CombatScreen` correctly renders this display-text
field verbatim. Peer event formatting already translates at the producer.
The producer already imports the i18n singleton and both locales already
provide `combat:levelUpToast` and `combat:event.system`. Correct those two
producer fields using the real reached level; no renderer parser is needed.

## Local correction and verification

The producer now translates actorName with combat:event.system and message
with combat:levelUpToast using the actual reached level. Both en/zh native
regressions pass (level-up-green), and the unchanged integration remains green
in imbue-allocation-green (92 tests across four files). The independent frontend
source review approves the two-line correction and matches its GREEN hashes.
Final integrated full20,656tests/977files/twoexistingoptinskips and all four actual en/zh production level-two log cases PASS. Independent frontend source/browser and combined packet reviews APPROVE. See [final evidence and exact retained paths](../../docs/plans/evidence/d11-charsi-selected-imbue.md). Regression: `src/features/combat/CombatScreen.level-up.test.tsx`; browser member `browser-level-up-v3/check.mjs` in the retained Charsi archive. Historical
original screenshots are retained in the verified Malus evidence archive at
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-malus-h9_rzp5t.evidence.tar.gz;
the original raw root has been cleaned.
