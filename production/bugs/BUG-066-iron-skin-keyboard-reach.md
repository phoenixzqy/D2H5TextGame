# BUG-066 — Diagnose Iron Skin forward-keyboard allocation failure

- **Status:** Open — production focus/preview timing defect confirmed.
- **Severity:** Medium — forward keyboard allocation skips the selected eligible skill; pointer allocation was covered previously.
- **Owner / affected systems:** frontend-dev, accessibility-specialist, qa-engineer; Skills focus/preview and browser harness.
- **Build:** `a1ab9c1`, product UI `edaa2b2`, exact approved uncommitted browser v1.
- **Environment:** Linux, Node24.21.0, Playwright1.59.1 bundled Chromium, desktop viewport1280×800.
- **Locale:** en; zh-CN did not run after maxFailures1.
- **Seed:** Not applicable; no combat simulation is invoked.

## Reproduction

1. Build via npm run check:test-bridge-shake (retained StageD bridge-free output).
2. Run tests/pwa/iron-skin.config.ts with the exact reviewed browser v1 and
   task-local output/fontconfig/temporary paths recorded in RAW environment JSON.
3. Create a Barbarian through UI, verify freshL1 lock, then import the explicit
   L18/two-point fixture through Settings. Select Iron Skin through its tree node.
4. Press native Tab up to100times, read whether the detail Allocate button is
   document.activeElement, and assert it was reached before pressing Enter.

## Expected and actual

The eligible selected skill's Allocate button should be reachable through native
keyboard navigation. The actual first execution fails reached=false at line110
before any allocation, viewport samples or Save/new-page reload cycles. en fails;
zh-CN is not run. Wrapper exit1, no stopReason or signals. The fresh lock/import
checks completed first. No browser acceptance is established by this attempt.

## Evidence and investigation plan

Root-owned RAW:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-iron-skin-c7fexii5`.
Preserve browser-iron-stage-e report/log/meta/process records, the original v1
drafts/freeze and failure error-context attachment. The test's finally closes
its page, so no failure PNG was retained. Do not claim a visual observation.

Source-risk hypothesis only: node onFocus changes the detail preview and its
allocation eligibility; the final node can be locked at L18. Native Tab may
choose its next target while the detail button is disabled, before node onBlur
restores the selected eligible Iron Skin. This has not yet been demonstrated.
Trace read-only active element, detail heading and enabled state before/after
each Tab against unchanged production; retain the same fatal reach oracle and
capture a screenshot before page close. Classify harness versus product cause
before applying any fix. Do not add focus()/DOM-click injection, retries or a
weaker success condition.

## Workaround

No workaround has been validated. Pointer allocation and unit tests passed
previously; that does not prove this production keyboard path.

## Diagnostic reproduction before fix

The exact reviewed diagnostic v2 (12460B, SHA256
5a6dddb2f87da81192e1731fae3e3cb265b0060852e954a8f9929dfe155ed13d)
adds only read-only snapshots around the unchanged100 native Tabs and pre-close
failure capture. All five StageD source hashes and761 retained output hashes
match the production build. The second run again fails en reached=false;
zh-CN is not run under maxFailures1. Wrapper8.886s, Playwright7.899797s,
exit1, no stop reason or signals; all11 observed process identities are absent.

`keyboard-diagnostic-trace.json` shows at steps2,43,84: focused Natural Resistance
is locked and its detail action disabled; one Tab lands on BODY while blur
restores Iron Skin and its enabled Allocate button. This repeats across the
forward traversal cycle. The product computes action eligibility from the
transient focused-node preview. Clearing that preview only on blur happens after
native focus navigation has skipped the disabled action. The valid imported
fixture is Barbarian18/two points; this is a product defect, not an eligibility
fixture or harness-only failure. It does not prove every keyboard route fails.

Evidence: RAW `browser-iron-diagnostic-report.json`, `.log`, `.meta.json`,
`.processes.json`, extracted trace and `keyboard-diagnostic-failure.png`.
The PNG captures the tree viewport; it is not a layout/font acceptance result.
Original v1 and its actual failure remain preserved.

Proposed minimal correction: synchronously clear transient preview on native Tab
keydown before default navigation, preserving selection, default Tab/Shift+Tab,
pointer previews, native activation and disabled semantics. Regression must
observe committed detail/action at document keydown before default, with
non-Tab and committed-locked controls. Then rerun the original browser oracle.
The unexecuted regression draft's zh heading was corrected from 自然抵抗 to
authored 自然抗性 before install; both drafts/freezes remain preserved.
