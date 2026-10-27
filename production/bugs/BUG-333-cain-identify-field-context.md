# BUG-333 — Require current town for Cain Identify

- **Severity:** Medium
- **Status:** Invalid reproduction assumption; scratch-only null-area guard withdrawn before integration
- **Build:** `40bb9c35408c24fd25ea5d8dde69df6f6f37b184` plus uncommitted Cain prerequisite; Identify service is task-local scratch only.
- **Environment:** Vitest 1.6.1 / jsdom; no viewport/locale dependency or RNG.
- **Affected systems:** frontend-dev / current-town service authorization.

## Reproduction

1. Construct real Cain rescue proof and a validated claimed entitlement.
2. Select an actual eligible backpack weapon while in town.
3. Set current location to `areas/act1-dark-wood` with no active combat.
4. Enumerate candidates and invoke the selected-item service.

## Expected

No candidates; return `not-eligible` without writes outside current town.

## Actual

Candidate enumeration still includes the item. Availability checks canonical Cain presence in the act without checking that the hero is currently in town.

## Evidence

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-cain-identify-9029ruba/field-context-red.log`: “refuses the field even with valid rescue, Claim and unlocked act” fails at candidate assertion. Overall 26 pass / 2 fail; the other failure independently reproduces BUG332.

## Root cause and planned correction

Require `currentSubAreaId === null` in shared service availability so rendering, selection, execution and post-publication authorization use the same current-town condition. The ordinary UI is already reached through town, but the public service API must enforce its own contract.

## Owner clarification and corrected expectation

Read-only design-contracts review establishes that `currentSubAreaId` remembers the last map/combat area; it does not identify whether the Town route is open. `MapScreen.tsx:115–122` records it; ordinary BottomNav/route/TownScreen navigation never clears it. Existing `questServices.ts` likewise authorizes unlocked current-act canonical NPC presence rather than a null area. The null-area expectation above is therefore invalid, and the proposed guard would itself introduce a regression.

Keep the original availability checks and expose Identify in the selected canonical Cain conversation. Retain the area in publication-context comparison to detect a change during the transaction. Replace the invalid test with remembered-area → current-town service success, asserting the saved area remains exact. The actual TownScreen integration test earns rescue in Dark Wood and renders town with that area retained. Original invalid-test logs and scratch source/test copies are preserved for diagnosis. No routing, save, or production source change was made for this rejected guard.
