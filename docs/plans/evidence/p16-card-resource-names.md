# P16 — Localized card resource names

BUG746 is fixed locally, uncommitted, on `feat/playable-foundations` at base
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` with inherited edits.
`GameCard.ResourceBar` used raw `hp`/`mp` identifiers as accessible names.
It now subscribes to the existing common namespace and names every supported
resource using Life/Mana/Stamina translations. Values, fill calculation,
palette, geometry and public props are unchanged.

## Verification

- `node node_modules/vitest/vitest.mjs run --project ui src/ui/GameCard.test.tsx --no-cache`:
  original production source: three new failures / 12 prior passes;
  final source: 15/15 pass. Includes English/Chinese names and numeric values
  for all three kinds, plus mounted locale changes with identical memoized-card
  props and DOM identity preserved. No mocked translation layer.
- Scoped strict TypeScript: 311 imported files, zero diagnostics, exit0.
  Initial test-only typecheck found seven unsupported Testing Library `exact`
  options; removed them (role string matching is already exact). Original output
  is retained. Final tests, types and explicit two-file ESLint all pass.
- Chromium147.0.7727.15: four cases, zh-CN/en ×360×640/1280×800. Fresh Necromancer
  created through ordinary controls, then settings and character sheet. Actual
  CDP AX tree exposes translated Life/Mana names for the hero card as well as
  existing derived-stat bars; no raw `hp`/`mp`/`stamina` progress-bar name remains
  on this screen. Each card retains Life130/130, Mana87/87, 228×4px tracks and
  100% fills across languages. No horizontal overflow, failed requests or page
  warnings/errors. Mobile Chinese and desktop English screenshots inspected.
  Browser terminal log contains the pre-existing Browserslist age advisory.

Browser scope is character-sheet integration; other card variants share the
same implementation but were not separately exercised in a browser. Stamina
has no production caller and is verified by component cases. Full G5/P16 and
full private v1 remain incomplete. No broad suite or campaign replay.

## Retained evidence and cleanup

Exact packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-card-resource-names-maybm987`.
Contains original/final sources and incremental patch, RED/final GREEN and
type/lint output, browser driver/results/screenshots and cleanup receipt.
Browser/server close in `finally`; driver PID89166 is absent. Task-owned Vite
cache removed and absence verified. No task-owned disposable remains. Root
retains this evidence through full-v1 acceptance and removes it after consumers
finish. The preceding goal turn was status-only and made no progress; this
increment changes production behavior and supplies focused regression evidence.
