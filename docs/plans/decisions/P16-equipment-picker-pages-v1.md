# P16 — Bounded equipment candidate pages

2026-11-05. Small UI behavior addition under the existing F05/F15/F21 contract,
not combat/economy tuning. Owner: root, solo. Existing implementation authority
is the full-v1 request; no additional owner decision is needed.

BUG772 reproduces2,001candidate rows and684.9–952ms opening in a constructed
Chromium fixture. Bound the picker to50candidate rows per page. Retain the
existing candidate order and every matching item; no inventory mutation or cap
enforcement is introduced by browsing. Reuse existing localized inventory page
labels and44px controls. Page selection selects that page's first candidate,
including an ineligible candidate whose reason and disabled Equip remain visible.
The compare panel and native equip boundary remain authoritative.

The selected candidate determines the visible page. Initial first-eligible
selection may therefore open on a later page. Arrow keys move through the
entire collection, Home/End reach its endpoints, and focus follows a keyboard
selection even when the target row mounts on a new page. Rows expose their
absolute position and full collection size for assistive technology. Page
controls retain normal focus and announce the range; they do not steal focus
to the list. If the selection disappears, existing first-eligible recovery
chooses the next displayed page. Empty and single-page collections keep their
existing behavior.

Acceptance: prove bounded rendering, reachability and exact ownership; crossing
page boundaries with keyboard focus; late first-eligible selection and disabled
ineligible choices; exact native equip of an off-first-page instance; shrink,
reopen and locale updates. Browser checks cover both locales at360×640,
412×915,640×360,1280×800,1920×1080 with before/after opening measurements.
Use only affected UI regressions, scoped strict types and changed-file lint.
No campaigns, samples, exhausted retries, CI or completed-act tests are run.
Variable-height virtual scrolling is unnecessary here; explicit pages bound
DOM work using controls already present in the game.
