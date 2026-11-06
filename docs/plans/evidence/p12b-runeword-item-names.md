# P12b/P16 — Shared localized runeword identity

Status: BUG706 fixed locally, uncommitted. Broader and independent acceptance open.
Root is sole implementer/verifier. Requirement: F05/P12b item identity and P16
localized equipment/crafting UI. Previous goal turn was status-only/no progress.

## Change and affected checks

Both shared naming paths ignored `runewordId`, so Leaf appeared as Staff/法杖.
The existing canonical catalog already supplies all 35 translated names.
`tItemName` now resolves known word names after unique/set identity and before
generated/base fallback; `resolveItemDisplay` delegates naming to it. Definition
stats, requirements, set activation, socket mechanics and saves are unchanged.

The focused pre-edit run records 72 failures, two passing fallback cases and six
excluded unrelated tests (the JSON reporter's aggregate count includes excluded
cases). Post-edit: **143/143** cases pass in `i18nKey.test.ts`,
`itemDisplay.test.ts`, `ItemTooltip.test.tsx`, and `ItemDetailPanel.test.tsx`.
Scoped strict TypeScript and lint of the three changed source/test files pass.
No broad suite/build/typecheck or completed campaign replay.

## Native component verification

The unmodified earned Leaf from `d2-earned-leaf-eliqxwgr/final.native-export.json`
is rendered through real BackpackGrid, ItemDetailPanel and ItemTooltip components.
Its two equal native-save projections represent the same mercenary weapon;
the initial fixture selector's single-occurrence assumption is recorded and
corrected. The source save's hash and fixture equality remain exact.

All four en/zh-CN × 360×640/1280×800 cases show Leaf/叶子 in detail/tooltip text
and the card's accessible name, without document overflow or page, console or
HTTP errors. Screenshots are retained; English mobile/Chinese desktop were also
visually inspected. This is source-browser component evidence, not a production
bundle/PWA check, campaign admission, crafting replay or save lifecycle claim.

## Evidence, cleanup and remaining scope

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-runeword-names-p7jnenwr`.
It retains the plan, before copies, RED/GREEN/check logs, fixture/provenance,
browser harness/scripts, four screenshots, runtime report and exact closure.
Root retains it through umbrella review and owns eventual exact removal.

All six tool sessions are terminal; owned server/browser PIDs are absent. Exact
browser profiles/temp/cache and scoped configs were removed and absence checked;
no remaining disposables or cleanup failures. Canonical runeword data/translations,
existing display tests and the original earned save are unchanged. The inherited
Browserslist age notice in the dev-server log was not acted on; no installation.
Umbrella worktree stays owned while the full task continues.

Counts remain **14/14 Act I, 7/14 Normal, formal balance 0/210**. Remaining builds,
item/acquisition families, economy/30–50 active-hour pacing, higher difficulties/
endgame, broader app/PWA/accessibility/performance and final acceptance remain
open. No renewed closed combat/training/diagnostic allowance, agents, CI,
commit/push/publication or pending user question.
