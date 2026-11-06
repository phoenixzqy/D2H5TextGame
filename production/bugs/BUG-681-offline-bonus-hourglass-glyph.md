# BUG-681 — Render the offline-bonus icon without an emoji-font dependency

- **Status:** Fixed and verified locally, 2026-11-04; wider offline/integration acceptance remains open.
- **Severity:** Low; accessible bilingual text remains usable.
- **Owner / affected systems:** Root / frontend offline-bonus chip.
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained MF source.
- **Environment:** WSL Chromium,1280×800 and360×640, en and zh-CN.
- **Seed / clock:** Constructed MF fixture, return2026-10-20T20:00:00Z.

## Reproduction

1. Run `tests/pwa/magic-find-rewards.spec.ts` against the production build.
2. Observe the top-right bonus chip after the synthetic eight-hour return.

**Expected:** A recognizable icon independent of installed emoji fonts.
**Actual:** The leading hourglass renders as a missing-glyph box in all four
boosted captures. Text and accessible names are correct.

Evidence: retained `p17-real-mf-v1/pwa-*-boosted-loot.png` captures under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.
Use the existing code/SVG icon system; no raster generation or font install.

## Local resolution

Both home and HUD now use the same decorative inline SVG, independent of emoji
fonts. Accessible labels, translations, bonus calculations and saves are unchanged.
[Focused evidence](../../docs/plans/evidence/p17-bonus-hourglass.md) records four
passing production browser cases with actual offline reopening, eight inspected
captures, 12 existing offline unit passes and scoped lint/types. Initial service
worker timeout failures remain retained; the test now uses the established
60-second activation allowance. Disposable build/config output was removed and
the server is stopped. This is local verification, not independent review or
full P17 acceptance.
