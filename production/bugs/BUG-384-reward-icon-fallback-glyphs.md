# BUG-384 — Render readable reward icons in WSL Chromium

- Severity: Low — reward text remains readable and actions work.
- Status: Fixed locally; focused tests, independent source review and production browser verification pass.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus local current25 changes.
- Environment: headed WSL Chromium executable revision1248, ordinary production
  build; zh-CN360×640 and en1280×800.
- Seed: not applicable to font rendering; constructed imported Ormus capability.
- Owners: frontend-dev/QA; root tracks, independent reviewer observed.

## Reproduction

1. Public Import a valid tracked Ormus capability and earn its full clear/Talk.
2. Open the Side journal and scroll the Ormus card into view.
3. Inspect the XP and charm reward badges in either locale.

Expected: reward badge icons render recognizable glyphs or an intentional
fallback; their descriptive text stays readable.

Observed: some badge icons show square fallback glyphs. The named charm and
XP amount remain legible; Claim and exact reward/save behavior pass. No missing
item art or functional reward defect is established.

Evidence: root-owned packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-ormus-urhb34ei/browser-visual-v2/`,
`mobile-zh-quest-element.png` and `desktop-en-quest-element.png`; independent
`cobra_browser_evidence_review` visual inspection. Suspected font availability
or glyph fallback is unconfirmed. P16 comprehensive presentation remains open.

## Correction and verification

Reward badges now use small decorative inline SVG paths with adjacent localized
text instead of platform-font emoji. Icons are hidden from assistive technology
and nonfocusable; the label continues to communicate the reward. Gold also uses
its existing localized reward label. Claim/reward logic is unchanged.

Four existing journal suites46/46, scoped zero-warning ESLint and independent
source review pass. The ordinary production browser v4 verifies SVG paths,
positive rendering bounds, adjacent labels and no horizontal overflow across
main quest XP/skill/stat/item/mercenary rewards. Independent screenshot review
confirms clear XP/star and gift icons on the Ormus Side card in en1280×800 and
zh-CN360×640, without clipping, overlap or fallback squares.

Retained packet `d2-counted-source-z3jj3xa1/p15-idle-browser-v4/` contains
`journal-ormus-en.png`, `journal-ormus-zh-CN.png`, locale DOM observations and
`evidence-review.json`. The result and independent cleanup audit pass; all
owned browser/server processes and temporary profiles are gone. Isolated build
bindings remain; both consumed disposable build directories were removed after
manifest verification (`p15-idle-browser-build-cleanup-v1.json`). This closes
the observed icon defect, not the full P16 presentation milestone.
