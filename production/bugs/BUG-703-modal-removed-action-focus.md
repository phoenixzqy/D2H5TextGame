# BUG-703 — Restore modal focus after an action disappears

Status: Resolved locally, uncommitted; independent acceptance pending
Severity: Medium
Owner: frontend-dev (root implementing locally)
Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local changes.
Environment: installed Playwright Chromium, English1280×800; no engine RNG.

## Reproduction

1. Continue the genuine earned Fire Sorceress53 save.
2. Open the Barbarian Recruit's equipment dialog and weapon picker.
3. Equip a compatible backpack weapon using its Equip button.
4. After the candidate list disappears, press Escape.

Expected: focus remains inside the equipment dialog and Escape closes it,
returning focus to its opener.
Actual: the removed button leaves focus on BODY outside the dialog. Escape
does not close the dialog. Both Leaf removal and return reproduced this.
Workaround: click the backdrop or manually refocus the dialog.

## Evidence and cause

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-earned-leaf-eliqxwgr`.
`lifecycle-suffix-report.json` records BODY/inDialog=false and
escapeClosed=false for merc-removed and merc-returned. Their native exports
prove the equipment operations themselves succeeded; no action needs replay
to establish the failure.

`src/ui/Modal.tsx` creates a FloatingFocusManager with restoreFocus but never
registers its opener with useFloating's refs.setReference. Installed
`@floating-ui/react` installs its focusout recovery listeners only when both
the floating dialog and an HTMLElement reference exist. The existing opener
ref used for returnFocus does not register that reference.

Affected systems: shared UI modal keyboard accessibility, including mercenary
equipment. No item ownership, combat, cost, save-format or data change intended.

## Resolution and verification — 2026-11-04

Modal registers the captured opener with `refs.setReference`, enabling Floating
UI focus recovery after a focused action disappears. Stable refs dependencies
pass lint without suppression. The new regression fails before the edit; all18
affected Modal/merc-equipment/inventory-focus cases, scoped strict types and
explicit two-file lint pass. Native keyboard removal/return recovers focus,
Escape closes and opener focus returns. English desktop and Chinese360×640
entry/Escape also pass. Full save accounting preserves gameplay/items/resources,
including explicitly checked offline bonus accrual and online decay.

[Earned Leaf and focus evidence](../../docs/plans/evidence/p12b-earned-leaf-and-modal-focus.md)
records the exact two verification swaps, retained failed observers, corrected
read-only checkpoint observation, conservation audit and verified cleanup.
No engine/schema change or campaign admission; broader acceptance stays open.
