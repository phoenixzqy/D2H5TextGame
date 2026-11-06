# BUG-745 — Give resource progress bars localized accessible names

- Severity: Medium; screen-reader users cannot identify the shared resource bars.
- Status: Fixed locally; uncommitted. Bounded producer source review approved.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited human2 edits.
- Environment: Vitest/jsdom, en and zh-CN. Browser verification follows at
  Chromium 360×640 and 1280×800. No RNG or existing save is involved.
- Affected systems: frontend shared `StatBar`, character sheet and combat Mana.

## Reproduction

1. Run `node node_modules/vitest/vitest.mjs run --project ui src/ui/StatBar.test.tsx --no-cache`.
2. Mount Life, Mana and XP bars with their actual translated labels.
3. Query each progress bar by its accessible name; also change Mana locale and values.

Expected: each progress bar exposes its translated visible label as its accessible
name and preserves the current/minimum/maximum values when it rerenders.

Actual: all three tests fail; the accessibility query reports `Name ""` for the
progress bars. Their visible labels are sibling elements and do not name them.

Evidence:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-statbar-accessibility-kd9doft3/test-red.log`.
The packet retains the exact original component in `before-StatBar.tsx`.

## Root cause and planned resolution

`label` is optional and is only rendered visually. Require it and pass it to the
existing `role="progressbar"` element as `aria-label`. All four production callers
already pass localized labels. Preserve numeric behavior, layout and gameplay.
Producer's bounded plan review found no material gaps. Check only the component,
its callers' types and the character-sheet browser surface; full-v1 acceptance
remains separate.

## Resolution and verification

`src/ui/StatBar.tsx` now requires `label` and applies it as `aria-label`. All four
production uses already supply localized labels. The three assertions in
`src/ui/StatBar.test.tsx` fail before this fix and pass afterward. Scoped strict
TypeScript checks the component, test and production callers with zero
diagnostics across 988 imported files. Explicit two-file ESLint exits zero.

Chromium 147 passes four character-sheet cases: zh-CN/en at 360×640 and 1280×800.
Fresh characters use ordinary UI only. Role/name queries and the CDP accessibility
tree expose XP/Life/Mana correctly; visible totals match ARIA values, including
zero XP. Language changes preserve numeric values. No horizontal overflow,
console warnings/errors or page exceptions occur. Mobile and desktop screenshots
were inspected. Combat receives the shared fix; no campaign was replayed.

Three unsuccessful browser observer revisions remain in the packet: a cold
15-second network-idle timeout, a zero-width XP-fill visibility assertion, and
an English XP query that ran before navigation removed the previous route's HUD.
The final observer awaits the character route/HUD removal and checks the visible
track plus semantic progress bar. These are not counted as product passes.

See [P16 evidence](../../docs/plans/evidence/p16-statbar-accessible-names.md).
Browser/server processes are terminal; exact task caches were removed and their
absence verified. Root retains the named diagnostic packet through full-v1
acceptance, then removes it after consumers finish. Whole-app accessibility and
the full objective remain incomplete.
