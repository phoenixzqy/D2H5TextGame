# BUG-123 — Enforce authored runeword and mercenary equipment requirements

Severity: High
Status: Fixed locally in `167aaba`; no push or release claimed.
Owner: engine-dev / frontend-dev

## Reproduction

- Base `12607ee` plus the local native19 material/socket integration.
- Node/Vitest; no browser/viewport, locale or RNG dependency.
1. Complete Steel (required level13) in a level1 short sword.
2. Ask the shared equipment requirement resolver for its required level.
3. Transfer that owned sword to a new level1 Rogue.

Expected: hero/tooltips/merc share the stricter authored requirement; mercenary
transfer refuses with no publication or change to the stored object. Actual:
resolver ignores the word and mercenary transfer checks only the slot.

Core-stat requirements also need the shared predicate against the mercenary's
own core stats; item bonuses must not qualify their own ingress. No current base
authors core requirements, so that boundary uses an explicit custom-base fixture.

Evidence: `src/data/loaders/loot-requirements.test.ts` and
`src/stores/merc-equipment-transactions.test.ts`; task log
`d2h5-v19-materials-rh7euwd2/equipment-requirements-red.log`.
Keep stored-object transfer authority and bare mercenary growth/stat snapshots.

## Local correction evidence

The correction and regression tests pass the integrated full run:
`crafting-full-unit.log`, 10825 passed / 389 files / 2 existing skips.
Final corrected source passes10843 tests across390 files (2existing skips),
with types/lint/build and corrected en/zh mobile crafting checks passing.
Fix committed at `167aaba`; see `docs/plans/evidence/d10-native19-crafting.md`.
Earned campaign and full D10 acceptance remain open.
