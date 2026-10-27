# BUG-302 — Keep touch-only skill details stable through viewport changes

Status: Fixed locally in81fbd496a7ca081910137c21956e100811b0fefb; focused and original production-browser recheck pass. Physical-device touch and whole-app acceptance remain open.
Severity: Medium — the selected skill's allocation control is replaced by another skill's locked control during the constructed mobile flow.
Build: 9b0039a80531d329116e0c1456f58dd6bde00af8.
Environment: Chromium production preview, 360×640 mobile context with touch; English. Public imported level30 Assassin fixture with20points; no earned progression or combat. Desktop en/zh cases pass. The probe uses Playwright mouse clicks inside the mobile context; physical touch behavior is not independently established.

## Reproduction

1. Create an Assassin through the public UI and import the documented constructed level30/20point fixture.
2. Select Tiger Strike using keyboard focus/Enter, move the mouse to0,0 and allocate rank1.
3. Cycle the viewport through360×640,412×915,640×360,1280×800,1920×1080, then return to360×640.
4. Attempt the next ordinary allocation click without changing skill selection.

Expected: On a touch-only browser, incidental compatibility hover during reflow does not replace the committed skill. Tiger Strike remains selected and can receive another legal point. Genuine mouse-hover previews and keyboard-focus previews remain supported.

Actual: The detail panel changes to unlearned Wake of Inferno with a disabled Need Prereq button. Skill points remain19; the allocation click waits until the180second test limit. The terminal run is2PASS/1timeout/1not-run, not a mobile pass.

## Evidence and cause

Exact root-owned task: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-charges-zt17emhc`.
`charge-preview-public.json` verifies all2518repository inputs,765external inputs and HEAD unchanged. `preview-public-report.json` and `preview-public-output/charge-preview.public-nati-a44a8-n-and-offline-continuity-en-preview-mobile/{trace.zip,error-context.md,test-failed-1.png}` retain the terminal failure. Trace call@137 resolves Allocate, then repeatedly observes a disabled control; the final DOM names Wake of Inferno.

`src/features/skills/SkillsScreen.tsx` sets previewSkillId unconditionally from onMouseEnter, and that transient ID overrides selectedSkillId. The mouse handler does not check whether the device can hover. A focused regression must preserve explicit selection, keyboard focus/Tab restoration and ordinary desktop hover while suppressing hover previews on a browser with no hover capability. Do not mask the failure with force-click, direct allocation, removed viewport samples or a larger timeout.

Affected systems: frontend-dev/ux-designer and qa-engineer. Root remains sole executor. Full charge-feature, whole-app mobile/a11y and private-v1 acceptance remain open.

## Local correction and verification — 2026-10-27

`SkillsScreen` previews from mouse entry only when `window.matchMedia('(any-hover: hover)')` reports hover capability (or the API is absent). Explicit selection, genuine mouse hover and keyboard focus remain. Regression: `src/features/skills/SkillsScreen.hover-capability.test.tsx`, canonical2FAIL/2PASS before source correction, final4PASS and combined92PASS/3files. Strict scoped types/lint and production buildPASS.

The original public spec, four cases, allocation steps, all five viewports, assertions and180s timeout are unchanged: charge-hover-public4/4PASS165.065s. Attachment audit confirms80previews/400geometry/eight exact seven-domain save pairs/four actual offlineContinues; all eight mobile originals viewed. Source2519/external765inputs and HEAD unchanged. No force click, direct allocation or relaxed checks. BUG303 separately tracks the visible Chinese Cobra labels missed by that spec. Full charge lifecycle/public-combat/independent/private-v1 gates remain open.
