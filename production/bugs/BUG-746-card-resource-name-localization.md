# BUG-746 — Localize card resource progress-bar names

- Severity: Medium; untranslated resource names in the accessibility tree.
- Status: Fixed locally on `feat/playable-foundations`; uncommitted.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited human2 edits.
- Environment: Chromium 147.0.7727.15, zh-CN/en, 360×640 and 1280×800.
- Affected systems: frontend `GameCard` resource-bar accessibility/i18n.
- Seed: Not applicable; fresh character UI, no combat or injected progress.

## Reproduction

1. Create a fresh Necromancer through ordinary UI.
2. Set language to 简体中文, then open the character sheet from the HUD.
3. Inspect the accessibility tree's progress bars on the hero card.
4. Repeat in English; the identifiers remain the same.

Expected: card resource bars use the localized Life and Mana names, as the
character's named derived-stat bars do.

Actual: the card bars expose literal `hp` and `mp` in both languages.
`GameCard.tsx` sets `aria-label={bar.kind}` rather than a translated resource name.

Evidence: all four cases' `axNames` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-statbar-accessibility-kd9doft3/browser-result.json`.
They show the corrected shared StatBar names alongside the separate card names.
This finding does not invalidate BUG745's bounded shared-component resolution.

Workaround: the character sheet also exposes translated Life/Mana in its derived
stats panel after BUG745. Other card surfaces need their own scoped verification.

Next: inspect the existing shared card/i18n contract, add a focused causal locale
regression, and translate names without changing card geometry or resource math.
Do not replay campaigns or infer whole-app accessibility acceptance from this fix.

## Resolution — 2026-11-05

`GameCard.ResourceBar` now maps all supported resource kinds to the existing
common Life/Mana/Stamina translations and subscribes to language changes.
`src/ui/GameCard.test.tsx` adds bilingual name/value checks and an unchanged-props
mounted language switch. All three new cases failed before the production fix;
the final affected file passes all 15 cases. Scoped strict TypeScript and
two-file ESLint pass. Four Chromium bilingual mobile/desktop cases verify actual
AX names, unchanged Life130/130 and Mana87/87, 228×4px card bars, no overflow and
no page warnings/errors. Stamina is covered at component level; no production
Stamina card caller exists. See [evidence](../../docs/plans/evidence/p16-card-resource-names.md).
No gameplay, resource formula, layout or save change. Wider v1 acceptance stays open.
