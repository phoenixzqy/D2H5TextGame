# BUG-699 — Show readable localized attributes on the character sheet

- **Status:** Fixed locally; uncommitted, umbrella acceptance remains open
- **Severity:** Medium
- **Owner / affected systems:** frontend-dev; character sheet HeroStrip, F15/P16
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local changes
- **Environment:** WSL, installed Playwright Chromium, native Vite development app; zh-CN/en, 360×640
- **Seed:** Not applicable; fresh character creation and sheet navigation, no combat

## Reproduction

1. Select either language in Settings and create a Necromancer through New Game.
2. Open the character sheet through the character HUD.
3. Inspect the four attribute labels in the hero card.

**Expected:** Existing translated attribute names at least 14px, with full values, readable contrast and a fitting mobile/desktop layout.

**Actual:** Both languages show hardcoded STR/DEX/VIT/ENG at 10px. Default compact four-column card plates do not meet the project's readable-body requirement. Displayed values are otherwise correct; no combat or persistence defect is alleged.

## Evidence and cause

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-character-sheet-c5oehy_d/reproduction.json`
and `before-360-en.png` / `before-360-zh-CN.png`. Browser page/console errors: zero.

CharacterScreen's HeroStrip supplies literal abbreviations to GameCard and accepts its compact default typography. Correct this at this caller using existing translations and locally sized readable rows. Preserve the shared card API and effective Vitality composition.

**Workaround:** Refer to the larger attribute panel below the card.

## Intended resolution and checks

Use existing fluid card sizing within a parent-owned portrait rectangle, localized labels, four readable label/value rows, stronger contrast and complete wrapping title/class text. Keep values, equipment, formulas, saves and allocation controller unchanged. Verify relevant browser layouts in both locales and existing Vitality/stat rendering cases only; no campaign replay or broad suite/build.

## Resolution

Applied the planned local HeroStrip layout/translation correction. All14unique
browser layouts and two keyboard sheet entries pass; nine selected existing
stat/Vitality cases and explicit two-file lint pass. Existing numeric, resource
and cap assertions remain intact. Eight source inputs reconcile with final
closure, and exact process/port/cache cleanup passes. See
[P16 evidence](../../docs/plans/evidence/p16-character-sheet-readability.md).
