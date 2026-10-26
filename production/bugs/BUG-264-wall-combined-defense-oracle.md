# BUG-264 — Include Cyclone resistance in the combined Wall test oracle

- Severity: Low; author test expectation, no observed existing-defense regression.
- Status: Corrected in `4ab9d984`; unchanged existing-defense arithmetic verified.
- Owner: root; independent QA/design acceptance remains open.
- Environment: Vitest node engine project, synthetic cross-class unit, seed7;
  browser, viewport and locale are not applicable.
- Base: 57945879 plus the uncommitted Wall settlement increment.

## Reproduction

1. Run the retained `wall-damage-green` command in the active bone task.
2. A200Fire hit targets paid Cyclone20/Holy Shield20/Wall1/Energy Shield20/
   Bone Armor1, with zero base resistance and100MP.
3. The draft asserts Cyclone100/Holy40/Wall40/Bone8 and88remainingMP.
   Actual first event is Cyclone80/Holy32/Wall40/Bone4 and zero HP damage.

## Root cause and correct expectation

The draft omitted Cyclone's existing JSON-owned1%resistance per rank. At20,
200Fire first becomes160 through ordinary20%resistance. Existing2.5%Cyclone
absorption per rank then removes80. Existing2%Holy absorption per rank removes32
of the remaining80. Wall removes40of48. Energy Shield20 diverts floor(8*.6)=4MP;
Bone Armor absorbs the remaining4, leaving8capacity and96MP. HP loss is zero.
Do not change existing tuning, mitigation, damage settlement or rounding to
match the incorrect draft. Correct only these literal test values.

## Evidence and correction boundary

Original test, failure114pass/1fail and typed-lint failure are retained under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-bone-defenses-6z98386v`.
The separate lint issue is string+number in a diagnostic status ID; use an
explicit string conversion without changing its timing or behavior. No skip,
suppression, resource change or native fixture change is authorized by this bug.
The original native Wall causal failure and14fail/2pass prospective settlement
packet remain valid separate evidence. No skill credit follows this oracle fix.

## Integrated validation at bdc747b8

Full18359tests/845files/two existing opt-in skips, engine9382/352, strict types, lint, official build/bridge and756URLprecache pass. Regression: src/engine/combat/bone-wall-damage.test.ts. Original failures are preserved; details and immutable receipts are in docs/plans/evidence/d06-bone-defenses-core.md and its integrated packet. No new inventory credit or independent/earned/full-v1 acceptance.
