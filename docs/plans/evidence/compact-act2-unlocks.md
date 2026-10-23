# Compact Act II unlock metadata

2026-10-23. Source base `9a4999f`; implementation `f7b6871`.
[Contract](../decisions/D11-compact-act2-unlock-metadata.md),
[BUG-101](../../../production/bugs/BUG-101-act2-canyon-unlock-metadata.md).

Horadric Staff and Arcane Sanctuary now have `unlocks: null`, removing two
references to the nonexistent `areas/act2_canyon_of_the_magi`. These are the
only runtime-source changes. The schema already supports null. No new area,
map gate, copy, objective, reward, save or balance behavior is introduced.
The existing act-wide area access and Act III quest-or-boss-clear gate remain.
This is metadata reconciliation, not an observed travel-softlock fix or a
campaign victory. C0/C1 remain historically accepted; C2 is underway and
C3/C4/full G0–G7 remain open.

The four new regression cases check both exact nulls, the six unchanged
canonical Act II areas, real objective references plus any remaining area
unlock references, and Seven Tombs' retained `acts/act3` value. The reference
check remains nonempty after the correction because it covers objectives.

Validation:

- Causal RED: 3 failures and 1 passing control, both before and after improving
  the reference check to include objective areas.
- Focused data/loader/map/object/Staff tests: **390 tests / 7 files PASS**.
- Final full unit: **9147 tests / 307 files PASS**, 188.73s, exit 0; exceeds
  the documented 15s full-suite target.
- Final typecheck, lint, clean production build and four-chunk bridge scan PASS.
- All 644 frozen source/config hashes remain unchanged during validation.
  The production build contains 760 files. `git diff --check` passes.
- No browser challenge was launched for this static metadata correction.
  The build is retained for the separately reviewed fresh campaign screen.

Producer plan READY/security PASS, QA-CANYON-SOURCE and QA-CANYON-EVIDENCE
APPROVE/security PASS. Final independent review verifies logs, causal failures,
all source/build hashes and the draft's scoped claims. No material findings;
all readers released. Campaign acceptance remains separate.

Raw diagnostic evidence is retained at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-canyon-nedn1k7r`.
Root owns it through C2/umbrella consumers and removes it after they finish.
All seven tracked validation command sessions are terminal. This task's
optional local `dist` and `cache` paths were never created. `cleanup.json`
verifies their absence and records the shared build's consumer and cleanup owner.

The shared build remains at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-fresh-act2-vtu72tc9/dist`
for the immediate fresh campaign-screen consumer. Root will remove that exact
build after the screen and its evidence readers finish. No shared package or
compiler cache is removed.
