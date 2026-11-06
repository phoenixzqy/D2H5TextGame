# BUG-628 — Name and manage mobile inventory detail focus

- **Status:** Fixed and verified in working tree; uncommitted by user instruction.
- **Severity:** Medium — pointer Close/backdrop work, but keyboard focus remains behind the modal sheet.
- **Owner:** root / frontend; no delegation.
- **Requirement:** P16 / F15 / G5 keyboard focus and accessible names.
- **Build:** accumulated `feat/playable-foundations` working tree; exact source baseline hash and backup in `bug628-plan.json` in the retained root evidence packet.
- **Environment:** mobile below768px; en and zh-CN; React18/jsdom and Chromium. No RNG dependency.

## Reproduction

1. Open Inventory at360×640 and focus a Backpack or Stash item card.
2. Select the card and inspect the resulting `inv-detail-sheet` dialog.
3. Tab, close via Escape/Close/backdrop, and inspect focus.
4. Open Discard inside details and Escape the confirmation; details must remain.

**Expected:** A translated Details name, focus entering the sheet without triggering
an action, containment in both Tab directions and return to the still-connected
item card. Nested confirmation closes first and restores the Discard trigger.
Desktop remains a sidebar with Escape dismissal.

**Actual:** MobileBottomSheet renders an unnamed `aria-modal` dialog with no focus
manager, leaving focus on the background item. The shared Modal fix does not
apply to this separate shell. ItemGridLayout also listens globally for Escape.

## Evidence and correction plan

Retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
`bug628-plan.json` records ownership, source baseline, ready plan review and
security pass. Add bilingual failing regressions, then use the installed Floating
UI focus manager on the existing sheet, its translated Details label and local
Escape handling. Limit ItemGridLayout's global Escape to the desktop sidebar.
Preserve sheet geometry, Close/backdrop and inventory actions. Verify native
keyboard traversal and save equality in local Chromium. This does not close
full P16, performance, balance or integrated acceptance. No commit/push allowed.

## Resolution and verification — 2026-11-03

The existing mobile shell now has the translated Details name and the installed
Floating UI focus manager. Initial focus enters the panel, Tab stays inside,
and Escape/Close/backdrop return to the opening card. Escape is local to the
mobile sheet; desktop retains its global sidebar dismissal and honors handled
Escape. The sibling single-discard Modal closes first and restores its own
trigger before the sheet closes.

Four bilingual mobile regressions fail before the correction; both desktop
cases pass. Afterward all20affected cases pass (six focus, fourteen pagination).
Scoped strict types pass. Explicit two-file lint passes after one narrowly
explained accessibility-rule exception for dialog Escape; the first lint result
is retained. That comment is the only source difference after browser testing,
verified by removing it in memory and matching the tested SHA256.

Real Chromium147 passes all ten profiles:360×640,412×915,640×360,1280×800,
1920×1080, each in en and zh-CN. Backpack and Stash both verify native keyboard
opening, mobile safe entry/both wrap directions, three dismissal paths, nested
Discard Escape/return, or desktop sidebar/Escape as applicable. Exact whole-save
exports match before/after in every profile. All profiles have no horizontal
page overflow, Close≥44×44px, and zero page exceptions/console errors/warnings.
Eight representative screenshots across all five sizes and both locales were
opened and visually inspected. Report: `bug628-browser-result.json` in the
retained packet; closure/source/self-review/cleanup: `bug628-closure.json`.

This is local development Chromium using diagnostic save copies, not campaign
advancement, real-device touch/safe-area/screen-reader certification, production
PWA or full G5/P16 acceptance. Source geometry and item actions are unchanged.
No independent agent review, commit, push or publication occurred. All consumers
are terminal and exact disposable configs/caches are absent. Root retains the
required reports/scripts/screenshots/baseline in the packet through umbrella
review and owns eventual cleanup/release.
