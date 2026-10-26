# BUG-263 — Draft Prison rank20 cooldown oracle used different rounding

- Severity: Low; author test/contract error, no newly observed runtime regression.
- Status: Locally corrected test/contract; runtime rounding remains unchanged.
- Owner: root; no independent acceptance or functional skill credit.

## Reproduction and expected versus actual

Run the retained prison-combat-green command.128 assertions pass; the exact
rank20 cast schedule fails: expected first casts[500,4000], actual[500,3500].
The original prospective test and failing log remain under the active bone task.
The ordinary effectiveCooldown function, untouched by this fix, uses
Number((4 + -.05 * 19).toFixed(1)), which yields3.0s. The draft assumed decimal
half-up3.1s while simultaneously requiring preservation of ordinary rounding.

## Cause, correction and validation

The test/contract expectation is inconsistent with the existing shared helper.
Preserve that helper and authored4/-.05 values. State its exact rounding and
assert the literal[500,3500] schedule instead; rank1 remains[500,4500]. This
changes no resources, clocks, fixture, timeout, retry or production cadence.
The failure and complete original test are retained at
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-bone-defenses-6z98386v;
cooldown-oracle.json captures the exact source and observation. Corrected
focused152/5 and native2case validation pass; engine9242/347, full types/lint,
production build/bridge/precache pass. Integrated full18359/845/two existing skips now passes at bdc747b8. This
is not a gameplay fix credit.

## Integrated validation at bdc747b8

Full18359tests/845files/two existing opt-in skips, engine9382/352, strict types, lint, official build/bridge and756URLprecache pass. Original failures are preserved; details and immutable receipts are in docs/plans/evidence/d06-bone-defenses-core.md and its integrated packet. No new inventory credit or independent/earned/full-v1 acceptance.
