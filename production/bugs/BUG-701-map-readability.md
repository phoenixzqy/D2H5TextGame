# BUG-701 — Make map details and full area names readable

Status: Resolved locally (uncommitted; independent acceptance pending)
Severity: Medium
Owner: frontend-dev (root implementing locally)
Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local changes.
Environment: installed Playwright Chromium, native Vite source app with
`NODE_ENV=production`, English, 360×640. No test bridge. Seed: not applicable
(presentation; no combat or farming).

## Reproduction

1. Create a Sorceress through New Game and open Map in English.
2. Read uncleared Act I rows, then expand locked Act V.
3. Import the retained genuine completed-Normal Fire Sorceress backup through
   Settings' file input. Open Map and expand Act V.
4. Inspect enemy details, status badges and full area names at 360×640.

Expected: body/helper text at least 14px; full translated names wrap; status
and controls retain readable contrast, 44px targets and visible keyboard focus.

Actual: enemy details are 12px and status badges 10px. Long names are truncated;
cleared rows apply opacity to their text and controls. The Stop Idle banner
control also has 12px text and no explicit 44px target.

Cause: local `text-xs`, `text-[10px]`, `truncate`, nonwrapping title layout and
cleared-row `opacity-80` in `src/features/map/MapScreen.tsx`.
Workaround: browser zoom; does not restore the full truncated labels.

## Evidence

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-map-readability-xrtuteyn`.
`before-v3.mjs` and `before-report-v3.json` reproduce 45 small-text/clipping
observations across fresh uncleared, fresh locked and earned cleared states,
with zero page/console errors or warnings. `before-fresh.png` and
`before-earned.png` capture Act V; `MapScreen.before.tsx` preserves the source.

Original observers remain retained: v1 selected the decorative GameImage wrapper
as row content; v2 tried inline fill for a backup larger than the native
32,768-character inline limit. V3 uses the content wrapper and native file
import. No economic transaction or campaign admission was repeated.

## Resolution

MapScreen now uses wrapping full names/badge rows, 14px details/status text,
readable palette colors and opaque cleared rows. Banner Stop Idle declares a
44px minimum target and visible keyboard focus; action groups wrap and expose
focus outlines. Handlers, gating, strings and gameplay are unchanged.

All 12 existing `src/features/map/MapScreen.test.tsx` cases and explicit one-file
ESLint pass. `after-v3.mjs`/`after-report-v3.json` pass 80 act-layout observations
covering all 29 areas in both locales, five required viewport sizes and 200%
text sizing; minimum measured font14px/contrast6.4683:1. Two keyboard act-toggle
flows and three exact gameplay-save comparisons pass. No browser errors or
warnings. Source AST audit confirms only presentation classes changed.

No active idle target exists in the earned save: the banner Stop Idle branch
receives static class/unchanged-handler verification, without starting farming.
No commit created. See `docs/plans/evidence/p16-map-readability.md`; full P16,
production/PWA, whole-app and independent acceptance remain open.
