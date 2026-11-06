# BUG-431 — Include flat Magic Resist in equipment comparisons

Status: fixed locally (uncommitted); broader campaign acceptance remains open.
Severity: Medium (misleading equipment decisions).
Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus private-v1 work.
Environment: both locales, mobile360×640/desktop1280×800; no RNG dependency.

## Reproduction

1. Compare a canonical cap with a chipped Diamond in its socket against an
   otherwise identical plain cap. This is a constructed inventory fixture,
   not an earned campaign result.
2. The canonical equipment pipeline adds2flat `magicResist` from the real gem
   definition. Inspect the prediction and actual equipment action.
3. Open compare and currently equipped item stat sheets.

Expected: show exact current/candidate/delta flat Magic Resist and include it
in net-upgrade/monotone-upgrade calculations. Single-item inspection must use
the same derived stat. Losing MR while gaining armor is a visible tradeoff.
Actual: `ComparableStatKey`/comparison keys, stat-sheet order/metadata and
equipped-modal projection omit MR. Consequently an MR-only gain looks neutral,
and a replacement losing MR can be described as a clear upgrade. The engine
already applies MR correctly; do not change its formulas or add gear power.

Affected systems: inventory/frontend/QA, root sole writer.
Authority: D04-independent-magic-mitigation-v1; G4 equip→combat comparison.
Scope: add one existing derived stat to comparison, single-item projection,
format metadata and both localized compare labels. Preserve percentage elemental
resistance rows and all other calculations. Regression tests use actual Diamond
socket semantics, real equip parity, negative/clamped/tradeoff cases and both
locale/mode DOMs; then scoped consumers/types/lint/build/browser.

Plan review: ready; all consumers and negative semantics covered. Security
check: pass, local UI/comparison correction, no dependency/network/permissions/
credentials/save/publication changes. No commit/push/PR/install/deploy.

## Local verification

See [evidence](../../docs/plans/evidence/p16-equipment-magic-resist.md).
Native/DOM comparison consumers:78PASS/eightfiles; strict types/scoped lint/
production build PASS. Public production browser:tenlocale/viewportcases plus
twostablevisualcases PASS, actual equip/exportMR2, no errors or overflow.
Regressions: `src/features/inventory/compareEquip.magic-resist.test.ts` and
`src/ui/magic-resist-comparison.test.tsx`. Original RED/failing fixture/lint
artifacts retained. No engine/formula/save change or commit.
