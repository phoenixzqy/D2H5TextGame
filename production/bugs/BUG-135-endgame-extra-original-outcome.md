# BUG-135 — Reject extra original monsters in endgame outcomes

Status: fixed in the local P18a foundation; final implementation commit is linked
from `docs/plans/evidence/p18a-endgame-foundation.md`.
Severity: High — an invalid mixed-wave result advances the new dungeon path.
Owner: engine-dev; discovered by independent qa-engineer source review.

## Reproduction

- Base: `69999d7dbc515cfc9dbdf9fb33da3096746ea197` plus P18a endgame foundation.
- Environment: Vitest engine project, pure TypeScript; browser/viewport/locale not applicable.
- Seed: `hashSeed(JSON.stringify(['endgame-run-v1','hero','endgame/worldstone-remnant','ashen',0]))`.
1. Prepare an Ashen attempt using valid Act V campaign receipts.
2. Capture the four canonical first-wave originals and a living hero.
3. Submit a player-win outcome with all four originals dead and an extra dead
   monster whose ID is `other-wave-original`.
4. Run `npm run test:engine -- src/engine/endgame/runtime.test.ts`.

Expected: failed proposal, unchanged wave index and no completion cache.
Actual: active proposal advances to wave two.

## Evidence and cause

`src/engine/endgame/runtime.test.ts`, case `ends extra-original without
completing or proposing a cache`, fails with expected `failed`, received
`active`. Original log:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-endgame-10850na9/membership-red.log`
(one failure, fourteen passing controls).

The original-member `every()` predicate checks required members but does not
reject an additional non-summon member. Compare the final original population
with the captured population before proposing advancement. Native recording
authentication and once-only settlement remain separate integration work.

Workaround: keep P18a disconnected from native entry and settlement until fixed.

## Resolution

Compare the final non-summon population size with the captured original count,
then retain exact per-ID/archetype/tier/level/death checks. `inferKind` preserves
the engine's explicit summon classification. The causal failing case now
passes, alongside both modifiers' four real-factory/real-battle sequences and
an enemy-summon control. Final focused gate: sixty tests across three files.
No native recording or settlement authority is inferred from these proposals.
