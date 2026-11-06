# P16/F21 — Empty crafting search performance

2026-11-04. BUG720 locally resolved on retained `feat/playable-foundations`
HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus working-tree changes.

`CraftingTargets` now returns the input list immediately for an empty normalized
query. Previously it localized every item to evaluate `includes('')`. The only
production change is this shortcut; nonblank search, ordering, pages and
selection retain their existing behavior.

## Evidence

Required packet (root retains through umbrella acceptance, then owns cleanup):
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-crafting-empty-search-u8uw5wli`.
Input: `fixtures/earned-endgame7-production/retained-final.json.gz`, raw SHA256
`d3371bd8f0e11c6d7d4684d4a3f5b84b5f44f0e7106814ea1e26e07c293f7250`.
27,633 backpack items; no combat, crafting Preview/Confirm, economic or RNG action.

Chromium 147.0.7727.15, WSL, Vite development server, English 360×640. Seven
category openings per source, measured from change-event dispatch through two
animation frames with the same imported save and fixed clock:

| Source | Samples (ms) | Median |
| --- | --- | --- |
| Before | 414, 336, 319, 336, 320, 320, 336 | 336 ms |
| After | 47, 32, 31, 30, 33, 31, 48 | 32 ms |

Median reduction: 90.48%. Same first twelve item IDs/labels. This bounded
development measurement does not establish production/device/Core Web Vitals
or whole-app performance acceptance. Development bridge was present but unused.

- Corrected RED: two workload failures, eight behavior passes. On 301 entries,
  the original empty query made 313 base-name translations for twelve rows.
- GREEN: 30/30 affected cases (`CraftingTargets.test.tsx`, 10; existing
  `CraftingPanel.target-work.test.tsx`, 20). Final component rerun after test-only
  lint/type repairs: 10/10. Final explicit two-file ESLint and scoped strict
  TypeScript checks exit 0. No broad suite or production build.
- English and Chinese 360×640/1280×800: search, selection, pages and geometry
  pass; all four screenshots visually inspected, with no horizontal overflow.
- Baseline and supplemental public Import/Export show complete save equality.
  Locale restored before supplemental export. No store injection or bridge calls.

Original failed setup/test runs remain in the packet: mistaken test labels,
development-bridge preflight assumption, initial lint findings and scoped type
configuration/unsupported RTL option. The initial after-browser run completed
all seven measurements and English checks, then timed out on `中文` instead of
the actual `简体中文` button. Its `passed:false` report is retained. The corrected
supplement ran Chinese layout/state checks only, no timing repetition, and passed
with complete final save equality.

`final-source.json` matches both current source files. Production change is one
line. `cleanup.json` verifies all three browser PIDs and port 5173 terminal, all
three exact Vite caches removed, active scoped config archived as evidence, and
no cleanup failures. Required logs, reports, drivers and screenshots remain at
the packet path above; root owns their eventual removal.

Full private v1 remains incomplete. Counts stay 14/14 Act I, 12/14 intended
Normal, formal 0/210; Zeal/earned Double Swing and wider economy/pacing, higher
difficulty/endgame, PWA/device/a11y/performance, soak and independent acceptance
remain open. No user/browser/CI hold.
