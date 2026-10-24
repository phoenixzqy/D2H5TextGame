# BUG-171 — Refresh the deterministic earned-equipment fixture for the expanded loot pool

Severity: Medium. Status: fixed locally; full rerun verified.
Owner: qa-engineer. Affected: production earned-adapter test fixture.
Build: `44477e9` plus D05 remaining masteries/new Act I bases.
Node/Vitest (viewport/locale independent), fixed production clock1792497600000,
target seed1, actual clock-derived single-farm acquisition; no earned-save actions.

## Reproduction

1. Run `tests/sim/production/earned-adapter.test.ts` on the expanded Act I pool.
2. The tiny positive variant attempts to equip its original earned glove/boots.
3. Observe the mercenary boots equip result and retained acquisition journal.

Expected: the positive adapter fixture earns and equips both exact original
items, preserving native ownership/resource/store isolation assertions.
Actual: the fixed old recipe no longer supplies its selected boots after the
intentional positive-weight spear/throwing additions; equip result is false.
Evidence: full unit run11848PASS/1FAIL/2existing skips,469files,602.96s;
`full.log` in `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-remaining-masteries-i5r4g6lk`.
Confirmed cause: fixture acquisition inputs assume the prior weighted pool.
Original clock still earns glove5 but no boots3; bounded18clock observations
retain every result. Offset17 (clock1792497600017, runSeed2330410292) earns
both exact original items legally, with the same hero resources/derived stats.
Only the positive variant uses this fixed diagnostic clock; original tiny unchanged.
Refresh only this diagnostic fixture to a retained deterministic legal acquisition;
never alter gameplay weights to force its old roll, inject equipment, weaken
positive equip assertions, retry real campaign actions or promote diagnostic saves.
The original tiny fixture and authoritative earned Rite save stay unchanged.
Workaround: all other tests pass; this fixture must be reconciled before commit.

Validation: positive fixture and all29other earned-adapter cases pass (30/30).
No discovery loop remains in required tests; one fixed clock/one farm, with
all original ownership/resource/equipment assertions plus an exact run-seed check.

Implementation commit: `1617315`.

Final validation:11849PASS/469files+2existing skips; engine5840PASS,
types/standard lint/build pass, production browser4/4. Raw logs and diagnostic
inputs retained in [versioned evidence](../../docs/plans/evidence/d05-remaining-weapon-masteries.md);
the historical temporary root is removed after archive-byte verification.
