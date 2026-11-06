# Mobile inventory detail focus — BUG628

Status: fixed and verified in the accumulated private-v1 worktree,2026-11-03.
Requirement:P16/F15/G5. [Bug and full result](../../../production/bugs/BUG-628-mobile-inventory-focus.md).

The mobile details dialog uses the existing translated Details key and Floating
UI focus manager. Desktop remains a non-modal sidebar. Focus enters safely,
wraps, and returns after Escape/Close/backdrop; sibling Discard cancellation
preserves the sheet and restores the Discard trigger.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

- `bug628-plan.json` and `bug628-before-InventoryScreen.tsx`: pre-edit plan/security/source.
- `bug628-red-tests.{json,log}`: four mobile failures/two desktop passes before fix.
- `bug628-affected-tests.{json,log}`: all20affected cases pass afterward.
- `bug628-types.{json,log}`,`bug628-lint-v2.{json,log}`: scoped strict types/zero-warning lint pass.
- `bug628-browser.mjs`,`bug628-browser-result.json`: ten real Chromium profiles,
  both containers, native Tab/Shift+Tab/Escape/keyboard Close and nested return,
  exact save equality, no overflow/errors, Close44px minimum.
- `bug628-<size>-<locale>-<container>.png`: twenty captured screenshots; eight
  representative images inspected across all sizes/both locales.
- `bug628-closure.json`: final source SHA, comment-only browser-source delta,
  five-axis self-review and exact cleanup verification.

All configs/caches created for this slice are removed; consumers terminal.
Reports/scripts/screenshots/source baseline stay required through umbrella
review; root owns their eventual cleanup and worktree release. The evidence
uses a historical diagnostic save copy and advances no campaign. Browser is
available, CI excluded, no user answer pending. Full G5/P16, balance, performance,
independent review, soak and owner playtest remain open. No agents/installations/
commits/pushes/publication.
