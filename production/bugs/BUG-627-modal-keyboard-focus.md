# BUG-627 — Manage shared dialog keyboard focus

- **Status:** Fixed and verified in working tree; uncommitted by user instruction.
- **Severity:** Medium — pointer dismissal remains available, but keyboard focus can reach background actions.
- **Owner:** frontend-dev / accessibility-specialist (root implementing without delegation).
- **Requirement:** P16 / F15 / G5 keyboard and focus accessibility in `docs/plans/work-plan.md` and `docs/plans/playable-target.md`.
- **Build:** `feat/playable-foundations`, HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus accumulated private-v1 working-tree changes; exact pre-change sources retained in the evidence packet.
- **Environment:** React 18; jsdom regression reproduction; real Chromium desktop/mobile verification follows the fix. Locale-independent shared behavior; verify en and zh-CN. No combat RNG involved.

## Reproduction

1. Focus a button that opens a shared Modal, such as inventory bulk discard.
2. Open it and inspect keyboard focus.
3. Use Tab / Shift+Tab, dismiss, then inspect return focus.
4. Open nested dialogs and check their accessible title associations and Escape behavior.

**Expected:** Focus enters the named dialog without selecting a destructive action, stays within the active dialog, and returns to the opener after dismissal. Escape closes only the active dialog. Each title association is unique. Crafting retains its existing Cancel-first behavior.

**Actual:** Modal only installs a document Escape listener; it has no focus entry, containment or restoration. All headings use `modal-title`. Crafting separately implements a local focus trap, so adopting a shared manager must also remove that competing implementation while preserving its behavior.

## Evidence and diagnosis

`src/ui/Modal.test.tsx`: five regressions fail on the original Modal because focus remains on the opener/body. Retained `bug627-red-tests.{json,log}` records exit 1 and all five failures. The shared component is the source of the defect, rather than individual bulk-discard controls.

Evidence packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`. `bug627-plan.json` freezes the ready plan, security pass, targeted source hashes and backups before the correction.

## Scope and verification

Use the already installed Floating UI focus manager; no dependency installation. Cover default entry, empty content, callback/content rerenders, nested names/Escape, handled Escape, backdrop clicks, and crafting cancellation/return. Verify native Tab/Shift+Tab in real browser inventory/settings/crafting flows and check cancellation does not mutate the imported diagnostic save. Run affected UI tests, scoped strict types and explicit lint only.

The separate mobile inventory detail sheet is not the shared Modal and remains outside this correction. Full P16 accessibility, runtime performance, balance and private-v1 acceptance remain open. No commit, push or publication is authorized.

## Resolution and final verification — 2026-11-03

The installed Floating UI manager now owns shared Modal entry, containment,
restoration and unique title association. Escape propagates only within the
active dialog; crafting uses explicit Cancel and opener refs through the same
manager, with Button forwarding its native ref. The five Modal regressions
include StrictMode, callback/content updates, empty content and nested return.

Affected UI: 102 passes across seven files (`bug627-affected-tests-v2.{json,log}`).
After the test-only forbidden-assertion cleanup, Modal's five regressions pass
again (`bug627-modal-tests-v3.{json,log}`); unchanged checks are reused. Scoped
strict types and explicit five-file zero-warning lint pass (`bug627-types-v3`,
`bug627-lint-v3`). The earlier type config omitted the test setup's jest-dom
augmentation; corrected external scope includes it. No type suppression added.

Chromium 147.0.7727.15: desktop en1280×800 and mobile zh-CN360×640 pass public
import/delete/bulk/crafting keyboard flows, both wrap directions, Escape,
keyboard Cancel and return focus. Save exports match exactly before/after all
cancellations; browser exceptions, console errors/warnings and overflow are zero.
Report: `bug627-browser-v2-result.json` in the retained packet. The original
browser failure is retained: Chromium focuses the overflowing item preview before
Cancel. `bug627-browser-diagnostic.json` confirms that native order; final checks
preserve preview accessibility and await guard focus restoration, then assert
actual containment and buttons in both directions. No production workaround.
Four `bug627-v2-*.png` screenshots were visually inspected.

This is development Chromium evidence on an imported diagnostic save copy,
not campaign advancement, a production PWA rebuild, all-viewports certification,
full P16 or integrated gate acceptance. The mobile detail sheet remains separate.
No commit SHA is invented; no commit/push/publication occurred.
