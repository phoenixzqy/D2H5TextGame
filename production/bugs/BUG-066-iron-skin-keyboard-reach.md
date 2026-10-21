# BUG-066 — Diagnose Iron Skin forward-keyboard allocation failure

- **Status:** Fixed in `9e3dcdd` — production-browser regression passes.
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

## Actual focused regression RED

Exact reviewed regression v2 (11044B, SHA256
ae35f2a3953c87fc8b136c821d1c5c4fae391c96855adaad37d9fe26ef6afdb6)
runs against unchanged UI source02998918. Actual26 cases:6fail/20pass,
6.894s wrapper, exit1/no stop reason/signals. Four before-default assertions
(two Tab directions × two locales) observe locked Natural Resistance instead of
committed Iron Skin; the two committed-locked controls still show Iron Skin
after Tab rather than restoring the locked selection. Failures stop subsequent
assertions in each case. Existing20 controls pass.

Evidence: RAW focused-keyboard-red report/log/meta/processes and
keyboard-red-classification.json. No production change preceded this RED.

## Test-only type correction

Focused GREEN passes106 across4 files (7.294s wrapper). The following type gate
fails TS2769 at three new RTL getByRole options: exact is unsupported. The serial
chain stops before full unit/lint/build. Remove only those ignored options;
string role-name matching is exact by default, so assertions/fixtures and source
fix remain unchanged. V2, actual RED/GREEN and failing type log are preserved;
v3 is separately fingerprinted in keyboard-types-correction.json.

## Validated correction and production acceptance

SkillsScreen now flushes transient-preview clearing synchronously on a tree
node's Tab keydown. It preserves native default focus movement, Shift+Tab,
Enter/Space, pointer previews, committed selection and native disabled semantics.
The minimal source adds one import and four handler lines; no allocation/combat
logic changes. Regression path: src/features/skills/SkillsScreen.iron-skin.test.tsx.

Final v3 serial gates: focused106/4 files (6.283s Vitest/7.371s wrapper), types
11.538s, full4755/191 (78.193/79.402s), lint31.476s and fresh production
bridge/build9.062s all pass with no skipped/todo tests, stops or signals.
Existing15s full-test target and build warnings remain; no performance signoff.

Unchanged fatal100-Tab browser oracle plus reviewed diagnostic snapshots now
passes en and zh-CN:2/2,22.797621s Playwright/23.773s wrapper, no retries,
skips/flaky results, stop reason or signals. Each of four rank/locale traversals
reaches enabled Allocate in3 native Tabs, with the exact selected Iron Skin
heading; native Enter learns ranks1/2. The final locked Natural Resistance node
now leads directly to Allocate rather than BODY. FreshL1 locked controls,
explicit importedL18/two-point eligibility,4/8% current and8/12%(+4%) next,
all9 combo-slot passive exclusions,18 viewport samples and four actual Settings
Save/newpage/Continue cycles pass. Save equality covers full player, inventory,
mercs, map, formation and meta.settings; it does not assert whole-meta equality.

Root visually reviewed18 exact screenshots through3 contact sheets plus full-size
zh-CN360×640/en915×412. Allocate/heading hit tests use9 sampled points in separate
scrolled states; action bounds≥44px, prose≥14px and no horizontal page overflow.
CDP records Noto Sans CJK SC30 prose glyphs and DejaVu Sans12. Both app console
arrays are empty. Below-fold rows still require scrolling and existing icon
glyph boxes remain. This is desktop Chromium with CSS viewport resizing, not
real touch devices, all-browser/full accessibility, earned campaign, browser
process restart, autosave, balance or private-v1 acceptance.

RAW final records: keyboard-final-gates.json, keyboard-browser-final-evidence.json,
keyboard-contact-sheets.json, browser-iron-keyboard-fixed report/log/meta/processes,
keyboard-final-source-freeze-v3.json and iron-all-process-union.json. All6125
cumulative Iron Skin PID/birth identities are absent. All761 fresh output hashes
match after browser; outputs await reader release and exact cleanup. Independent
final browser/evidence review remains pending at this document freeze.

## Closure

QA and producer independently approve whole final evidence and all18 screenshots;
TD/UX approve the minimal source. Review records are root transcriptions.
After commit/all reader release, root freshly checks source hashes and6125 absent
PID/birth identities, removes exactly761 outputs40,965,732B and16 task-local
browser/font-cache files827,806B, and verifies all777 files/three owned roots
absent with no failures. Shared cache parents and installed fonts remain.
[Durable packet](../../docs/plans/evidence/fixtures/p07a04-iron-skin/packet.json)
preserves actual failures, drafts/corrections, reports, hashes and review records.
RAW evidence remains root-owned until independent archive verification and exact
cleanup; that final cleanup outcome is recorded in the packet/evidence ledger.
