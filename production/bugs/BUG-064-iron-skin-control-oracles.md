# BUG-064 — Correct existing-behavior oracles in Iron Skin controls

- **Status:** Open; test-oracle defect reproduced before the production adapter change.
- **Severity:** Low — internal QA false failures; no gameplay defect established.
- **Owner / affected systems:** qa-engineer/reviewer; Iron Skin engine control fixtures.
- **Build:** `0653d66` plus reviewed uncommitted Stage B v4 tests; production adapter unchanged.
- **Environment:** Linux, Node/Vitest engine project; browser, viewport and locale not applicable.
- **Seed:** 7.

## Reproduction

1. Install the reviewed consumer v3 draft, SHA256
   `cc78b9a00169d87c4559dfb5b17a6899b173603b336ed408aa31a9dfb20d6a76`,
   as `src/engine/combat/iron-skin.test.ts` with the production adapter unchanged.
2. Run that test through the bounded runner, retaining JSON output.
3. Repeat with verbose and JSON reporters to inspect exact received values.

## Expected and actual

The new existing-consumer controls should describe the unchanged engine.
Both runs instead fail 3 of 14 cases (11 pass). The physical hit with paid Frozen
Armor, Armor Melt and Inner Sight receives 106, whereas the draft expects 81.
The RNG tests receive four chance calls `.85, 0, .25, .25`, whereas the draft
expects only hit and crit `.85, 0`.

## Root cause and correction plan

The physical oracle omitted Armor Melt's existing ×1.25 physical combo in
`engine/combat/combo.ts`. Its correct result is
`floor(100*1.25 - 21.84*1.6*.7*.75) = 106`. Retain that physical control and add
a neutral fire control expecting 81 to distinguish the defense factors.

The fixture kills the attacking trash monster with pre-existing poison at
2000 ms. `deathEffects` calls `rollOrbDrops`, which always makes two independent
`.25` chance draws. Preserve those draws; the next seed7 value is the fifth,
`0.5214452685322613`. Do not change product combo, death or RNG behavior.

Freeze and independently review the corrected oracles before executing them.
Existing adapter RED remains separate: 26 cases = 16 behavioral failures and
10 passing cases before integration. One of those 16 failed cases is mixed: it
contains both missing-defense-overlay assertions and an unrelated incorrect
magicResist expectation. Consumer fixture failures establish no Iron Skin
runtime defect or new behavior RED.

## Additional adapter oracle defect found before correction

Independent QA review of the preserved adapter RED messages found
`expected 11 to be 31` inside the fractional-defense case. Its imported gear
adds flat magicResist11. `engine/progression/stats.ts` derives magicResist from
the authored friendly player base0 plus that flat modifier, not from energy.
The correct unchanged value is11. Preserve the original v3 bytes and report;
correct only this assertion, independently review the revised draft, then rerun
RED with the production adapter still unchanged. Classify the original report
as 15 solely behavioral failed cases, one mixed failed case and10 passing cases;
do not describe every failing assertion as missing Iron Skin behavior.

## Strict fixture typing failure

After the corrected behavioral tests passed focused, engine and full suites,
`npm run typecheck` failed TS2379 at adapter test lines46/47. Two casts to the
optional `Player['skillLevels']` type admit undefined, which cannot be supplied
as a present field under exactOptionalPropertyTypes. The malformed rank fixtures
remain intentional; narrow only their containing record casts to
`NonNullable<Player['skillLevels']>`. Preserve the failure report and review
this annotation-only correction before installation. Product source has no
reported typing error.

## Evidence

[Iron Skin evidence](../../docs/plans/evidence/p07a04-iron-skin.md). Root-owned RAW:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-iron-skin-c7fexii5`.
`stage-b-drafts-freeze-v4.json`, both `focused-iron-consumer-control` and
`focused-iron-consumer-diagnostic` JSON/meta/log/process records retain unchanged
oracles, repeated failures and the actual verbose diff. `stage-b-baseline-freeze.json`
binds the unchanged production adapter. Original drafts remain preserved.

## Workaround

Use source-correct, independently reviewed expectations. No product workaround
or engine change is needed for this test-oracle defect.
