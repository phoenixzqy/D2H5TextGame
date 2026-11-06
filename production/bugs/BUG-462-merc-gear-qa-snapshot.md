# BUG-462 — Respect save snapshot mirrors and time in merc gear QA

Status: fixed locally and verified; no commit. Severity: Medium (QA oracle).

Environment: HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained local
changes, Node24.21.0/Vitest1.6.1/WSL. Browser, viewport, locale and RNG seed are
not applicable: constructed owned-item fixtures exercise native equip services.

## Reproduction

1. Run `tests/campaign/merc-gear.regression.test.ts` in the campaign workspace.
2. Compare before/after `snapshotStores()` values after an actual merc equip.
3. Compare no-change snapshots under the real ticking clock.

Expected: canonical equipment changes appear in both the saved equipment map and
the saved mercenary equipment mirror. Raw owned mercenary stats/identity and all
item payloads remain conserved. No-op snapshot comparison uses a fixed clock.

Actual: the new test incorrectly requires serialized mercenary rows unchanged
after equip and compares differing snapshot timestamps. Four cases fail while
31 combined profile/gear checks pass. No production defect has been established.

Evidence: retained packet `p15-maintained-nova-merc-green-v1.log` and its exit
receipt in `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Only equipment mirrors differ in positive cases; only timestamps differ in
negative cases. `src/engine/save/serialize.ts` projects canonical merc equipment,
and `src/stores/persistence.ts` supplies `Date.now()` to snapshot construction.

Affected system: campaign QA; root sole writer. Correct the fixture clock and
assert base merc state plus explicit canonical saved mirrors, keeping complete
item conservation and native transfer assertions. Production changes are not
needed. Fixed clock and explicit raw-state/canonical-mirror assertions pass:
35 profile/gear checks in `p15-maintained-nova-merc-green-v2`, then six gear
checks inside the265PASS maintained campaign regression checkpoint. The retained
adapter/audit/dispatch40PASS also preserves the corrected oracle. Root retains
evidence through umbrella acceptance; no production change or commit.
