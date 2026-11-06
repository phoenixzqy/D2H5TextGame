# P15 — Holy Bolt dense-wave order comparison rejected

2026-11-04. The earned frontier remains level52/next913; no campaign admission,
reward, reset or saved allocation changed. Counts remain14/14ActI,
10/14intended Normal and formal balance0/210. Full privatev1 remains incomplete.

One control and one candidate use retained Ancients912 wave4, seed2417492996,
14initial enemies and the original hero-only party/resources/cooldowns. The
candidate changes only skill order to Hammer > Bolt > Sacrifice. The frozen
acceptance condition requires exact control and a living-hero victory within
the native60-second cap. Neither battle wins:

| Observation | Original Bolt first | Candidate Hammer first |
| --- | --- | --- |
| Hero casts |38Bolt |19Hammer,18Bolt |
| Direct damage |106,295 |110,952 |
| Living champions |1 /15,585Life |2 /17,828combinedLife |
| Hero terminal Life/Mana |1,059/549 |1,057/548 |

The original verifier wrongly omitted native result fields `events` and
`rounds` from its expected object. It stopped after retaining the control and
before running a candidate. Separate raw readback proves all946timed events,
full final parties, winner, untimed events and13rounds match. A separately
pinned candidate-only driver validates that complete retained control and
runs the sole permitted candidate once. No control replay or renewed allowance
occurs. Original assertion failure and its classification remain retained.

A separate Python readback verifies frozen input/candidate invariance, source
and campaign manifests, complete control and both result statistics without
executing combat. The order candidate is rejected; no area-specific override
is justified. The earlier cadence diagnostic also stays closed.

Prayer died in wave3 before this hero-only failure. Its survival and owned
equipment are the next investigation; no production defect or gear change is
established by this comparison.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-holy-dense-order-jx8413u7`.
`raw-readback.json` passes; all three recorded PIDs and three exact caches are
absent. Packet measured2,121,223bytes before the readback receipt, within16MiB.
No disposable artifacts or cleanup failures remain. Root retains the packet
through umbrella review and owns eventual exact cleanup. Self-readback is not
independent QA or balance acceptance. No broad checks/build, earlier-act replay,
new agents, dependency installation, commit, push or publication occurred.
