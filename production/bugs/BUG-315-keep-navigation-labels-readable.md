# BUG-315 — Keep complete navigation labels readable

Status: Open — actual production reproduction before padding correction.
Severity: Medium — essential link labels visibly truncate, especially English.
Environment: Chromium360×640/412×915/desktop1280×800/1920×1080, en.
Reproduction source: e7aeafcc plus the BUG314 equal-width layout; the subsequent
committed production spec preserves this exact source. No engine RNG dependency.

## Reproduction

1. Create a disposable character, select English and inspect navigation.
2. At360px, all eight targets now meet45px width, but Combat, Inventory and
   Settings labels truncate. At412px and in the desktop rail, Inventory truncates.
3. Read each label's `scrollWidth > clientWidth` and compare whole-viewport captures.

Expected: complete localized names fit inside their existing link targets at
the required sizes, alongside recognizable icons and44px touch bounds.
Actual: padding consumes eight horizontal pixels per link and forces ellipses;
the desktop rail also loses those eight pixels. Allowing equal target widths
revealed additional narrow English labels, so the layout is not yet complete.
Chinese labels and landscape labels fit in the measured matrix.
Evidence: root-owned
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-nav-icons-xgw7t06k/pre-ready-decoded-audit.json`
and `pre-ready-decoded/*-navigation-geometry.json`. Both360/412English original
visible-navigation PNGs were individually viewed; no cropped/composited image
is the basis for this finding. The completed readiness-aware matrix10/10PASS
69.334s verifies icons, geometry, keyboard/touch and actual SWofflineContinue;
it merely records label clipping and does not assert labels fit.

Affected systems: frontend/UX/accessibility/QA; root sole executor.
Root cause: `px-1` unnecessarily narrows every centered nav label while the
outer link already supplies the touch area. Workaround: full accessible names
remain available to assistive technology; the icon still identifies destination.

## Planned correction

Remove horizontal padding from the centered links, preserving icon/text sizes,
localized wording,45px mobile targets and the existing desktop rail. Promote
the existing clipping observation to a strict no-clipping assertion, and verify
both locales/all five required sizes, native keyboard/emulated touch and actual
offline continuation. Do not abbreviate translations or reduce font size.
Security check: pass; scoped first-party CSS/tests only. Author plan review ready.
