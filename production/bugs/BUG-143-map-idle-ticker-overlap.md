# BUG-143 — Reserve layout space for the map idle ticker

Status: corrected locally after ff47a50; bilingual browser regression passes10/10.
Severity: Medium — persistent ticker obscures trial text and portions of controls;
scrolling or activating a different exposed button point can work around it.
Owner: root integrator / frontend-dev; QA evidence review.

Environment: local production after ff47a50 plus uncommitted endgame UI;
headless Chromium, English360×640. No combat RNG dependency.

1. Open Map with the constructed endgame save.
2. Scroll to the unlocked or claimed endgame panel.
3. Observe the idle helper strip crossing the panel and Claim control.

Expected: the persistent idle strip occupies reserved space outside scrollable
map content so text and controls can be read and reached without overlap.
Actual: `IdleTickerStrip` is a sticky-bottom child of the same scrolling main
as the map content. It floats over content rather than reserving a visible
footer region. Overflow/dimension checks alone do not detect this.

Evidence: `claim-ui-browser-elemental-screen1-evidence/en-360x640-claimed.png`
and `en-360x640-unlocked.png` under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-endgame-native-sapkemp7`.
Independent QA screenshot review reproduced the same obstruction.

Correction: a non-scrolling footer slot in ScreenShell and Map-owned
ticker placement there, preserving summary/Stop behavior. Native browser
regression must require the scrollable main's bottom edge at or above the
ticker's top edge across both locales and all required viewports.

`claim-ui-layout-red-results.json` fails with mainBottom583/tickerTop467.
After the correction, `claim-ui-layout-matrix1-results.json` passes English and
Chinese at360×640,412×915,640×360,1280×800 and1920×1080. All cases assert the
main/ticker boundary and retain lower Claim screenshots, with zero browser
errors or console warnings. Focused UI29/4, complete engine5449/161, final
typecheck/lint/build pass. Final standalone full unit11203/419 plus two existing skips passes
(`claim-ui-layout-full.log`); independent bounded matrix evidence review ADEQUATE.
The matrix has no active idle target; Stop behavior is not browser-certified
by these cases. Its target now uses44×44px minimum sizing.
