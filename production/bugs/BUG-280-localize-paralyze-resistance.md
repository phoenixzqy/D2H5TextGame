# BUG-280 — Localize the visible Paralyze resistance marker

- Severity: Low — player-facing untranslated effect name.
- Status: Reproduced; fix pending.
- Owner: root, frontend/localization; no delegation.
- Build: `cbd99f8f` presentation, production Chromium through Playwright;
  reproduced in zh-CN and en at360×640,412×915,640×360,1280×800,1920×1080.

## Reproduction

1. Create a native Necromancer and import the explicitly unearned Mage6/
   Mastery20/survival-gear fixture retained by the native Mage browser test.
2. Select Mage in native combo controls and enter Catacombs at the fixed
   Date epoch1792454400000; native area/Date seed derivation remains unchanged.
3. Observe the effect chips of an enemy hit by the Lightning Mage.

Expected: both locales describe the five-second resistance to repeated Paralyze
in player terms: “麻痹抗性” / “Paralyze Resistance”.
Actual: both show `Paralyze Cd`, the humanized internal `paralyze-cd` identifier.
It describes the existing50% rejection window, not full immunity.

Evidence: every `observed-playback.json` under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-mage-signatures-kwew5kh6/browser-evidence/signatures-final/`
retains the untranslated marker in living-enemy labels. This is ordinary
production DOM evidence; no event or status injection.

## Cause and correction

`CombatScreen.tsx` correctly looks up `effect.status.<id>`, but both combat locale
tables omit `paralyze-cd`. Add the two keys at that source and require the actual
living resistance chip in native playback. Preserve mechanics, clocks and saves.
There is no player workaround for the label; the mechanic itself functions.

Security check: pass for first-party locale/test-only correction; no dependency,
credential, network, permission or save-format changes. Root retains the evidence
through continuing Mage/full-v1 consumers and removes the task artifacts afterward.
