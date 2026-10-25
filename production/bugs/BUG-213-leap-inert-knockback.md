# BUG-213 — Paid Leap has no observed control consequence

- Status: reproduced; author adaptation contract and repair open.
- Severity: High — the skill's declared Knockback has no observed effect.
- Owner: root; independent design/QA and earned balance remain open.
- Environment: Node24.21.0; native L30 Barbarian, actual JSON/default registry,
  ranks1/2/20 × seeds7/19/41/97, synthetic resources and isolated hero action.
- Build: `dee1342b` plus the Hammer repair subsequently committed as `884b0839`; Leap data/runtime unchanged.
- Browser/viewport/locale: engine probe only; no browser acceptance. The data
  declares Knockback; no spatial implementation is authorized by this report.
- Affected systems: pure-debuff registration, combat control and skill display.

## Reproduction

1. Compose learned Leap through `playerToCombatUnit`, with Leap as sole priority.
2. Supply100MP, a single hero action at1700ms, then a synthetic hold from1701.
   Place three ordinary enemies at explicit grid positions `(0,0..2)` with
   ordinary2000ms action intervals. Enemies remain unheld throughout the probe.
3. Record each actual case and exact replay without mutating input.
4. Compare the identical snapshot after replacing only the registered debuff's
   status ID with a synthetic inert control marker. Keep action/payment/targeting
   and the ordinary debuff application path unchanged.

Expected: a paid control skill has a defined observable consequence. The
project forbids movement/range stats; a controlling author adaptation is needed
before choosing a timing replacement. Existing active physical-damage scaling
metadata also requires an explicit disposition before complete skill acceptance.

Actual: each of twelve cases pays once (8/8/6MP at ranks1/2/20), acts once and
emits three Knockback markers. All three enemies' actual/control action arrays
are identical, beginning2000/4000/6000ms and continuing through60000ms. Explicit
grid positions remain unchanged in both recordings. No timing or spatial
consequence appears in any pair. This probe does not establish an offensive
benefit from the physical-damage metadata: the caster is held after Leap.

The complete observations are written before the intentional exit1 assertion.
Evidence: [native reproduction](../../docs/plans/evidence/d04-leap-repro.md).
No Leap source patch/credit, genuine campaign or remote action.
