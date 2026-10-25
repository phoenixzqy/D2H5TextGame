# BUG-215 — Double Throw loses its second throw against a lone enemy

- Status: locally fixed in `25ae9b20`; independent/earned acceptance open.
- Severity: High — the advertised two-throw skill resolves one singleton attempt.
- Owner: root; independent design/QA and earned balance remain open.
- Build: `7229ffcf` plus the frozen Double Swing repair; Double Throw data and
  its ordinary scalar registration are unchanged.
- Environment: Node24.21.0, native L30 Barbarian, default JSON registry,
  Bash1/Double Swing1 prerequisites; ranks1/2/20 ×seeds7/19/41/97 ×one/four enemies.
- Browser/viewport/locale: engine probe only; current en/zh-CN descriptions
  promise throwing two weapons. No browser or earned balance acceptance.
- Affected systems: skill hit-sequence metadata, original target-pool behavior,
  registration and truthful presentation.

## Reproduction

1. Compose legally learned Double Throw as the native Barbarian's sole priority.
2. Supply synthetic100MP/100000HP; allow one hero action at1700ms and hold from
   1701ms. Hold enemies after2001ms. Use standard three-column positions.
3. Record native ranks1/2/20 across four seeds and one/four enemy layouts.
4. Confirm exact immutable replay, one action/12MP payment and count actual
   attempts, including misses, per target.

Expected: an explicit contract implements the advertised two throws and defines
their fixed target-pool selection, rotation, miss/death and payment behavior.
The existing description does not independently specify two attempts per enemy.

Actual: all24cases pay12MP once, ending88MP. Each of12singleton cases resolves
one attempt. Four-enemy cases resolve one attempt on each of the first two
enemies, none on the other two. The registered Physical50–75/+5rank effect has
no hitSequence, shape or cap metadata. Complete observations precede the final
intentional exit1. This establishes a singleton multiplicity defect without
choosing a new shape, per-target attempt count or guaranteed damage.

The first copied probe incorrectly expected90MP and stopped before retaining
observations. It is preserved as a fixture error. The corrected run expects
the literal authored12MP cost and reproduces all24scenarios.

Evidence: [native reproduction](../../docs/plans/evidence/d04-double-throw-repro.md).
No Double Throw repair/credit, genuine campaign or remote action.


## Local repair

`25ae9b20` opts into two total original-pool attempts under the [author contract](../../docs/plans/decisions/D04-double-throw-v1.md).40new regressions, production4/4, full15103/687/two existing skips and final types/lint/build pass. [Delivery evidence](../../docs/plans/evidence/d04-double-throw.md) retains original RED/type failure, synthetic limits, committed-source hashes and cleanup. Historical reproduction remains; independent design/QA and earned balance open.
