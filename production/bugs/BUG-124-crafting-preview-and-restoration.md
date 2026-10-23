# BUG-124 — Show complete crafting previews and stop after unverifiable restoration

Severity: High
Status: Fixed locally in `167aaba`; no push or release claimed.
Owner: frontend-dev / engine-dev

## Reproduction

Base `12607ee` plus the uncommitted native19/crafting integration. Vitest/jsdom,
both en and zh-CN; no browser viewport or combat RNG dependency.

1. Preview El insertion into a two-socket short sword: the preview lists El but
   omits its canonical +50 Attack bonus. Complete Steel to observe the same
   omission for the completed-word package.
2. Inspect a preserved v18 invalid-placement Lore recovery: the source uses the
   older inspection view, says capacity is unverified and omits recorded rune order.
3. Make both material publication and rollback fail, leaving a partial state and
   matching receipt. The confirmation remains enabled and a retry can report a
   replay as successful. The deferred save must not overwrite recovery evidence.

Expected: preview the actual canonical socket bonuses, inspect validated v18
capacity and recorded contents without activating unsupported effects, and stop
crafting/saving on an unverifiable restoration until successful save recovery.
Ordinary fully rolled-back failures retain the same-request retry.

## Residual review findings before correction

4. Um insertion shows `+0.05 Crit Chance` and Eld armor insertion
   shows `+0.02 Physical Dodge` rather than +5% and +2%. The shared stat display
   formats ratio-valued critical/dodge fields as raw numbers. Attack speed uses
   authored whole points and must retain its value; raw resolved values must also
   remain unchanged.
5. After an unverifiable restoration, `hydrateFromSave()` with no stored save or
   first-time `initPersistence()` with `hasSave() === false` marks hydration ready
   without restoring damaged runtime state. Writes remain blocked, but crafting
   reopens because it uses hydration readiness. Both empty-save paths must retain
   the recovery error until an actual complete recovery succeeds.

Evidence: independent source review of `CraftingConfirmation.tsx`,
`ItemTooltip.tsx`, `materialActionTransaction.ts`; regression checks will be
recorded in the task evidence directory `d2h5-v19-materials-rh7euwd2`.

## Local correction evidence

Canonical socket packages drive the tooltip and preview; preserved v18 capacity
and rune order are visible without activating unsupported effects. Unverifiable
restoration blocks saving and hydration readiness. Both missing-save paths now
share the same guarded completion, while successful complete restore/import can
clear the block. Exactly four ratio-valued critical/dodge paths display percentage
text; raw values and whole-point attack speed remain unchanged.

`crafting-residual-red-corrected.log`: 14 failures / 47 passes before correction.
`crafting-residual-green.log`: 108 passes / 7 files after correction, including
bilingual Um weapon/Eld armor insertion previews, raw-value/point controls and
both actual failed-rollback→missing-disk recovery paths. Independent read-only
residual source review: CLEAR. Final corrected source passes10843 tests across
390 files (2existing skips), types/lint/build and corrected en/zh360×640 browser
checks2/2. Fix committed at `167aaba`; full evidence is recorded in
`docs/plans/evidence/d10-native19-crafting.md`. No earned campaign acceptance
is claimed.
