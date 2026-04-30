---
name: design-system
description: Maintain the project's reusable component library and design tokens (Tailwind config, palette, typography scale, spacing, motion, iconography). Used when adding a new shared component, adjusting tokens, or auditing for drift.
---

# Skill: design-system

## When to use
- A new shared component is needed (and a one-off won't suffice).
- A token (color, type, spacing) is being added or adjusted.
- A drift audit before milestone close.

## Source of truth
- `tailwind.config.js` / `tailwind.config.ts` — tokens.
- `src/ui/**` — components.
- `docs/art/style-guide.md` — visual palette (owned by `art-director`).
- `docs/design/ux/flows/**` — interaction patterns (owned by
  `ux-designer`).

## Token rules
- Palette: D2 dark slate / parchment + 6 rarity colors
  (white / blue / yellow / gold / green / orange).
- Typography: 1 family (system stack with fallback to a D2-style
  display font for headings). Scale: 12 / 14 / 16 / 18 / 24 / 32 px.
- Spacing: 4 px base unit. Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
- Radius: 0 / 2 / 4 / 8 — sharp by default; D2 panels are rectangular.
- Motion: durations 100 / 200 / 300 ms; easings ease-out / ease-in-out.
  Respect `prefers-reduced-motion`.

## Component rules
- Lives under `src/ui/<Component>/<Component>.tsx`.
- Has a sibling `*.test.tsx` (smoke or RTL).
- Has TSDoc on its public props.
- Handles loading / error / empty / disabled states.
- No business logic; a presentation component never imports from
  `src/engine/**` or `src/data/**`.
- Uses Tailwind classes; no inline `style` except for dynamic
  numerical values.
- Has been verified at 360×640 + 1280×800 in both locales.
- Touch target ≥ 44×44 px when interactive.

## Phase 1 — Need check
Is the component reusable in 2+ places? If not, keep it co-located.

## Phase 2 — Token audit
Are you reaching for a value not in the token scale? Either add it
to `tailwind.config` (with `technical-director` sign-off) or pick the
nearest existing token.

## Phase 3 — Implement
Build the component; run `npm run dev` at both viewports.

## Phase 4 — Document
Add a one-paragraph entry to `docs/design/components.md` with:
name, purpose, props, do / don't, screenshot.

## Phase 5 — Hand off
- `frontend-dev` consumes.
- `accessibility-specialist` reviews if new interactive patterns.

## Owner
`frontend-dev` builds; `ux-designer` owns the patterns;
`art-director` owns visual tokens.
