# BUG-632 — Move dialog entry focus before hiding its opener

- Status: Fixed/verified in working tree
- Severity: Medium
- Affected systems: frontend shared Modal and mobile inventory detail sheet
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus accumulated uncommitted changes; exact source manifest in retained browser report.
- Environment: Chromium 147.0.7727.15, Linux/WSL, production preview, 1280×800 en (also mobile transitions within the same context). No engine seed applies.

## Reproduction

1. Import the earned 8,540-item backpack save through Settings.
2. Open Inventory, exercise pagination and resize the selected item details through mobile and desktop sizes, then dismiss details.
3. Focus and activate the normal-item bulk-discard button.
4. Inspect the browser console during confirmation entry, before cancellation.

Expected: focus enters the named confirmation before background content becomes hidden to assistive technology; the opener remains available for focus return after cancellation.

Actual: Chromium reports “Blocked aria-hidden on an element because its descendant retained focus.” The focused element is the bulk button and the hidden ancestor is its toolbar. Dialog focus eventually enters and cancellation returns it, so end-state-only tests missed this transition.

## Evidence and diagnosis

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
`bug592-mobile-pages-v1-candidate.json` and `bug592-mobile-pages-v2-candidate.json` reproduce the warning; v2 records phase `bulk-normal-entry` despite awaiting actual entry/return focus. No mobile timing samples ran in either candidate.

Installed FloatingFocusManager schedules initial focus in a layout-effect microtask, but background isolation is a passive effect. React can flush the latter before that queued focus move. Both app dialog shells rely on this delayed initialization. Fix the entry ordering in those shells; retain library trapping, nested Escape, custom initial-focus targets and return behavior. Do not suppress the warning or remove background isolation.

Workaround: cancellation still works, but background accessibility isolation is unreliable during entry. This does not resolve BUG592's separate performance scope.

## Verified correction

[Final evidence](../../docs/plans/evidence/dialog-entry-order.md): move focus in
the two shells' layout effects before queued isolation. Three behavioral RED
regressions become GREEN; final28directly affected cases/types/lint pass after
rejecting separate pagination. Final production Chromium desktop en/mobile zh
checks bulk/nested mobile entry, retained isolation, exact saves and zero
console errors/warnings. No performance or whole-v1 acceptance follows.
