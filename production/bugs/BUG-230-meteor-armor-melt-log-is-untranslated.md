# BUG-230 — Localize Meteor's Armor Melt combat feedback

Severity: Low. Status: locally fixed and verified; independent acceptance open.
Owner: root (frontend/localization); independent QA open.

## Reproduction

Chromium360×640, en/zh-CN, source71fcfd62 plus the direct-fire work;
the frozen source/build manifest identifies the exact tested input. Synthetic
L30 Sorceress, rank2 Meteor, fixed Date.now2026-10-25T12:30Z; ordinary native
campaign seed generation, diagnostic cast only.

1. Import the explicitly synthetic direct-fire browser fixture.
2. Allocate Meteor1→2, select priority, enter Catacombs and observe the cast.
3. Read the status-application log and enemy effect chips.

Expected: Armor Melt / 护甲熔毁 in the selected locale.
Actual: raw `armor-melt` appears in both locales. The retained Chinese mobile
`browser-final-zh-CN-360/zh-CN-360-meteor-cast-visible.png` shows it.

Evidence: direct-fire packet's pre-label-fix browser reports/screenshots;
`src/stores/eventToLogI18n.test.ts` adds literal en/zh regression oracles before
the fix. `eventToLogI18n.ts` and CombatScreen correctly use the shared
`combat:effect.status` namespace, but its two locale files omit `armor-melt`.
Existing names in damage-types.json do not populate that namespace.

Workaround: read the skill description. Fix the missing shared keys;
no renderer special case or combat behavior change is needed.

## Verification

Source `5ef31577` adds exact shared combat translations in both locales. Two literal event-rendering REDs turn GREEN; all12final production browser cases pass with localized Melt required for Meteor. Chinese mobile and English desktop final combat screenshots inspected. Final full15743/715/two existing skips; types/lint/build/precache pass. [Evidence](../../docs/plans/evidence/d04-sorceress-direct-fire.md). Independent QA/full accessibility acceptance remains open.
