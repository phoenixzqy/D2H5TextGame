# BUG-313 — Render navigation icons without emoji fonts

Status: Open — reproduced before product change.
Severity: Medium — essential destinations keep text labels, but missing glyph
boxes impair recognition on the supported mobile environment.
Build: c49748d18e3176d5b4c84b05be802c41a3b6b0df.
Environment: retained production Chromium mobile360×640 en/zh-CN; current RTL
ScreenShell reproduction. No engine RNG dependency; no seed needed.

## Reproduction

1. Create a character and inspect the bottom navigation on a font-limited device.
2. Observe the eight destination icons. Retained shadow mobile originals show
   missing glyph boxes for six destinations, while the text labels remain.
3. Current `src/ui/BottomNav.tsx` provides only emoji strings. The two corrected
   locale regressions in `src/ui/BottomNav.test.tsx` fail at the absent
   font-independent decorative icon; five existing gate controls still pass.

Expected: every destination has a recognizable icon independent of installed
emoji fonts, readable localized text, native keyboard link behavior and current
route announcement. Icons must not duplicate accessible names.
Actual: Unicode placeholder icons depend on platform emoji coverage; missing
font glyphs render boxes. The idle sidebar gear and development-only tool icon
share that dependency.
Evidence: [retained visual records](../../docs/plans/evidence/fixtures/assassin-shadow-combined/integrated-checkpoint.json),
all16individually-viewed mobile matrix originals and their member hashes;
current RED8.391s/two failures/five controls at root-owned
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-nav-icons-xgw7t06k/nav-corrected-red.json`
and `.log`. All1940tracked task source/config inputs and HEAD remain exact.
The initial test used guessed translations and changed global language after
render; its wrong Chinese-name failure/act warnings are retained separately.
Corrected tests use actual labels and isolated locale instances before rendering.

Affected systems: frontend/UX/accessibility/QA; root sole executor.
Root cause: BottomNav's icon model is a Unicode string with no font-independent
rendering path. Installing fonts in the test environment would leave other
devices affected. Workaround: use the visible localized destination names.

## Planned correction and author checks

Use small co-located inline SVG paths for the existing eight motifs, development
tool and idle gear; inherit existing text colors and20px icon sizing. Keep
routes, labels, focus rings, current-page announcement and safe-area layout.
No shared icon library, bitmap generation, dependency or font download is needed.
Verify both locale regressions, neighboring shell tests, all five required
viewport sizes, native keyboard/touch navigation and offline production reload.

Plan review: ready — includes idle/dev consumers, accessible names, current
route, font-independent rendering and scoped real-browser validation. Root
author review only; no independent approval. Security check: pass for authorized
first-party presentation code, with no credential/network/CI/save/permission
change. Full-v1/whole-app mobile/a11y and performance gates remain open.
