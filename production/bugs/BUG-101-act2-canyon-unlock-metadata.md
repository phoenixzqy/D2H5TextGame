# BUG-101 — Remove nonexistent Canyon unlock references

- Severity: Low — stale authored metadata; no observed runtime access failure.
- Status: Reproduced at `9a4999f`; fix pending.
- Environment: source/data reproduction, locale-independent. Browser, viewport
  and RNG seed are not applicable to this static reference mismatch.
- Owners: content-designer / QA; producer coordinates the compact Act II contract.

## Reproduction

1. Read Horadric Staff and Arcane Sanctuary in `src/data/quests/main.json`.
2. Compare their `unlocks` values with Act II's six subareas in
   `src/data/maps/acts.json`.
3. Both quests reference `areas/act2_canyon_of_the_magi`, which does not exist.

Expected: metadata describes the authored compact campaign. Neither quest
unlocks another area; Staff insertion and journal reading retain their separate
objective roles. Seven Tombs retains the Act III reference.

Actual: two quests advertise an absent area. Current map predicates already
open all six authored Act II areas together, so no gameplay lockout is inferred.

Evidence: `static-repro.json` at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-canyon-nedn1k7r`.
Regression: `src/data/__tests__/act2-quest-unlocks.test.ts`.

Root cause: stale quest metadata from a larger map. Correct the two values to
schema-supported null; adding a fake area or changing runtime gating would not
match the current campaign contract. Existing quest copy promises no Canyon
unlock and needs no change.
