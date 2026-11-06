# BUG-702 — Count only equipped pieces in current set-bonus details

Status: Resolved locally (uncommitted; independent acceptance pending)
Severity: Medium
Owner: frontend-dev (root implementing locally)
Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local changes.
Environment: Vitest UI project/jsdom, en and zh-CN; viewport not applicable to
the pure resolver reproduction. No RNG involved.

## Reproduction

1. Wear only Iratha's gloves.
2. Inspect Iratha's helm in the backpack without equipping it.
3. Read the current two-piece bonus in item details.

Expected: two-piece bonus is inactive until two distinct pieces are equipped.
Prospective comparisons may show it active in their explicit after-loadout.
Actual: current details mark the two-piece bonus active while only gloves are
worn. Inspecting a third unworn piece with two worn pieces similarly claims
the three-piece bonus. The equipment engine does not apply these bonuses.

Cause: `resolveItemDisplay` adds the inspected piece to the supplied equipped
piece IDs unconditionally. Stash details also omit current equipment context.
Workaround: count worn pieces manually; use current character resistances.

## Evidence

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-set-activation-4nqzntqv`.
`red-tests.log`: 8 failing / 36 passing resolver cases; failures reproduce
current/duplicate/third-piece counting in both locales before production edits.
Regression: `src/ui/itemDisplay.test.ts` and
`src/features/inventory/ItemDetailPanel.test.tsx`.

Genuine earned reproduction save: `source.native-export.json`, Fire Sorceress53,
Normal next921, material ordinal908. SHA256:
`ac953ed34af41dac8500ce4fbf684db35694cdacbb6c7cf9d556830dd5d0a043`.
Gloves `it-9jn9w-dc7` are equipped; helm `it-8qn3x-e73` is in the backpack.
No fabricated save, farming or campaign admission is needed.

## Resolution

Removed the resolver's implicit inspected-piece count and supplied actual
equipment to stash details. Explicit after-loadout comparison behavior persists.
All 44 resolver and 8 detail component cases pass; four-file ESLint passes.
Nine functional native browser observations plus two settled visual observations
cover en/desktop and zh-CN/mobile. Earned helm equip activates only two-piece,
Fire Resistance55→85, and exact item/resource preservation plus durable Continue
pass. Inspection-only comparisons check all gameplay including offline bonus.
Observer failures/corrections and source hashes are retained. No combat, broad
suite/build/typecheck, commit or independent sign-off. See
`docs/plans/evidence/p12b-current-set-bonuses.md`. Owned server/profile/cache
cleanup is verified; root retains required evidence through umbrella review.
