# BUG-781 — Inspect crafting targets before choosing equipment

- Status: Fixed locally, uncommitted — current source and evidence recorded below
- Severity: Medium — item inspection is available elsewhere and after a valid preview
- Owner: frontend-dev
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited working changes
- Environment: WSL, Chromium 147, English, 360×640
- Seed: Not applicable; constructed equipment, no RNG or crafting execution

## Reproduction

1. Mount the actual CraftingPanel with a completed Steel short sword in the backpack.
2. Select Salvage and inspect the target row.
3. Try to inspect its damage, socket investments and rune order before selecting it.

Expected: An accessible touch/keyboard control reveals item stats and exact socket
contents without changing the selection or spending materials. Preserved v18 gear
can be inspected with its historical contents explicitly inactive.

Actual: The row contains only name, instance ID and location, plus its selection
checkbox. There is no details control, disclosure or item card. Players must
leave the picker or prepare a valid crafting preview to inspect their gear.

## Evidence and cause

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-crafting-inspection-fs43dppv/`:
`before-browser-result.json` and `before-en-360.png` capture the actual panel,
missing inspection controls and zero console/network errors or warnings.
`CraftingTargets.tsx` renders only the label and checkbox despite having full
item data. G4 informed gear/crafting choices and G5 accessible essential controls
require inspection at this decision point.

## Repair scope

Add lazy per-row inspection using the existing ItemTooltip and the same socket
readout as crafting confirmation. Keep checkbox selection independent. Preserve
native socket order, inactive historic contents, pagination, search, localization
and rendering bounds. No transaction, save, combat or balance change.

## Resolution

Localized lazy Details controls now expose the existing item card and the same
ordered socket readout as confirmation without changing checkbox selection or
performing any crafting action. Preserved v18 contents remain explicitly inactive.
The shared readout adds localized accessible list names. Four new bilingual
regression cases fail before the patch; all 58 affected crafting cases pass after.
Scoped strict types (991 imported files), four-file lint and two bilingual browser
flows across five viewport sizes pass with zero browser/network warnings/errors.
The initial runner-discovery and test-fixture type errors are preserved and
corrected without suppressions or weakened assertions.

Current base remains `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited
working changes; no commit is claimed. Regression coverage:
`src/features/inventory/CraftingTargets.test.tsx`; integration:
`src/features/inventory/CraftingPanel.test.tsx`.
See [implementation evidence](../../docs/plans/evidence/p16-crafting-target-inspection.md).
Root self-review only; no broad G4/G5, balance or full-v1 acceptance claim.
