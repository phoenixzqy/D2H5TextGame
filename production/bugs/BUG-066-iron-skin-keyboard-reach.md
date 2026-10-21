# BUG-066 — Diagnose Iron Skin forward-keyboard allocation failure

- **Status:** Open — observed production-browser failure; root cause unclassified.
- **Severity:** Low — QA/browser acceptance failure under investigation; no gameplay defect yet established.
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
