# BUG-413 — Elemental signature catalog suppression and missing curves

Status: fixed and functionally verified; numerical balance remains unaccepted.
Initial reproduction:42meaningful failures/5controls across47native cases before
production mutation. Severity: High. Owners: content-designer/engine-dev,
game-designer/QA. Private claimedworktree HEADb5a0898+retained local changes;
Node24.21.0, deterministic native engine; browser/locale independent.

1. Build Afflicted/DarkRanger/Salamander/Fetish/BaalMinion from actual JSON,
   default registry at native cadence, seed13, versus a declared passive tank.
2. Record native actions; observe CD1/MP0 generic suppressing the signatures.
3. Inspect the20selected definitions: paired Attack/Growth remain absent.

Expected: scoped20-row action/numeric adoption in the next-family decision.
Actual:16generic-first/4generic-later rows; generic cooldown fillers instead of
ordinary actions, absent curves. Five base signature-covered rows remain valid
exceptions to ordinary reachability. Existing elemental skill payload/JSON
mismatches are separate pending work, not corrected or accepted here.

Cause: redundant generic-first/filler lists and incomplete role authoring, not
a selector/damage/RNG defect. Expose signatures by removing generic entries
only in the adopted rows. Do not mix in global payload/scaling/default-DOT edits.
Evidence: retained packet p15-elemental-red-v1.log/-exit.json,42FAIL/5PASS,
8.822s wrapper, no timeout/live descendants. First40row oracles plus appended
elite/endgame assertions fail at intended lists/curves; fiveManaBurn controls
pass. This is the preserved pre-mutation reproduction; current results follow.

## Related fixture findings after comparison

The18-file affected run reproduces749PASS/3FAIL in
`p15-elemental-affected-final-v1.log/-exit.json` (35.031s). Two delivery tests
try to mutate Rend's effects/base lengths, which the prior melee increment
now intentionally freezes; both throw TypeError on the frozen length. Preserve
sparse-mutation/reload/recovery coverage on still-mutable native WeakMelee,
and separately pin Rend's immutable mutation rejection and retained delivery.
The old Tainted negative control assumes Afflicted still has StrongMelee;
seed13 now correctly yields Spit/ordinary/Spit at1740/3480/5220ms. Update that
oracle to the newly adopted role, keeping the real bundled source and cadence.
These are test-fixture assumptions, not reasons to alter combat production.
The separate ActV stale fixture reproduces1FAIL/1PASS: BloodLord now has
ordinary/null at3240ms, FrozenTerror remains StrongMelee. All elemental,
physical-damage, status and immutable replay assertions remain required.


Final20-row data/action adoption verified:18files/753PASS, strict types/scoped
lint PASS. Initial and fixture failures retained; no production payload repair.
Fixed6000fights/arm: baseline1024wins/431defeats/4545draws→candidate576/4304/1120.
All600unchanged control input/recording/metric identities match exactly; no
retries/tuning, owned cache or live descendants. Inventory67authored/44pending;
all111numerical acceptance unaccepted. Complete evidence:
[Elemental signature family](../../docs/plans/evidence/p15-elemental-signature-family.md).
