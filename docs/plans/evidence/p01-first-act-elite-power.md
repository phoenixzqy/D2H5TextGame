# P01 — Act I elite groups bounded independently of wave size

This is planner composition acceptance only. Earned Den/Andariel, campaign
balance/pacing, native combat presentation and mobile remain unaccepted.
[D07 decision](../decisions/D07-first-act-elite-power-v1.md) records the intended
power rule and the unchanged40-win earned screening ceiling before implementation.

## Change and retained controls

Within active Act I promoted challenge waves, fit the existing ordered roster to
the existing8–20 count, then assign first3champions or first1rare leader/next3
minions; remaining bodies are trash with no eliteAffix property. Authored elite
flags within promoted waves cannot create a second elite group. Keep levels,
roster/count, fitted per-archetype unique indices, wave metadata and exactly one
shared-affix RNG pick. Rare transient monster indices intentionally normalize
from the old global sequence. Dedicated/chapter bosses, legacy planner, later
acts, idle pity/probabilities, tier coefficients and reward services are unchanged.
Actual tiers can still change tier-dependent orbs and loot.

Root sole writer/executor. Original runtime SHA256
2824bc43ab1671be7187cf688e16a5f5a6f96916b1685f4dc0f6f8460c85d0d3;
final runtime3c1187400587f7546555ea00775c4c5cb3363c30cb5756341d1f574a6fd455f6;
final planner testsabf428df9182ec77817577c561437e0839d38d017f7c93d6dfeb33d4f9daf51b.
Decision5bb18756696a655e724ad16bcd427cd27a36af6d697fb6c876421ec35aeb13f1
was installed before runtime edits. Code/GD review APPROVE those final bytes.

## Regression and diagnostic evidence

Final unchanged tests genuinely RED against exact original runtime:30failed,
27passed. Restore implementation in finally, then GREEN57. Cases cover actual
Den/Cold ordinal40,13default count residues and1–4requested bounds clamped8,
champion/rare core/filler/affix/index rules, immutable config/rosters, six seeded
multi-wave count/affix/boss RNG controls, idle promotion/miss/disabled/pity,
unpromoted authored flags and Acts II–V all-count guards.

Initial boss-level7oracle was wrong: existing scale rounds5+(4−2)*0.5 to6.
It was corrected before final RED/GREEN; no runtime scaling change. Initial
fixture typing/lint failures were corrected with required configuration fields
and explicit String(number) interpolation. Original failed receipts remain.

Source-backed production planner/factory before/after comparison covers58plans
across29areas/manual+idle.46later-act plans,29legacy plans and6ActI dedicated/
chapter-boss controls are deeply unchanged.31promoted ActI waves obey the new
rule while preserving roster/order/levels/count/metadata (rare indices as above).
The fixed historical epoch1792497600000/ordinal40 Den HP totals change
[423,1948,3514,715]→[423,1043,2511,715]; Cold Plains changes
[771,843,5256,1904]→[771,843,2783,1298]. These are factory snapshots, not victories.
The after-probe printed a nonfatal occupied HMR-port warning before valid JSON;
its server closed normally. Later probes explicitly disable Vite websockets.

The broad related run exposed four stale synthetic fixture expectations in
three store suites, then reached its declared210s timeout (exit−15/owned group
stopped). Do not treat it as a complete related pass. Compatibility childddfab2c
freezes the exact historical seed7/manual/ordinal0 Moor plan in those suites.
All original assertions remain; real factory/combat/rewards/settlement/playback/
replay remain. Exact JSON/clone/guard probes, both planner versions86/3PASS and
complete carry/poison trace equality to the historical real planner establish
fixture compatibility. This narrowed integration scope grants no C1 acceptance.

## Final validation

- Final typed planner RED30failed/27passed; unchanged GREEN57PASS1.828s.
- Engine3920tests/95files PASS73.923s on the same runtime (before type-only
  fixture corrections); the final full run also includes the final typed tests.
- Integrated final-source typecheck PASS23.870s and lint/purity PASS54.991s.
- Clean external production build/bridge scan PASS11.266s, VITE_E2E absent;
  all4application JS chunks scanned. Existing Browserslist/chunk-size/optional
  generated-manifest precache warnings remain; no performance/PWA acceptance.
- Integrated full8296tests/260files PASS514.134s wrapper (Vitest512.63s),
  one serial invocation/retries0/default test limits unchanged:
  `npm test -- --fileParallelism=false --poolOptions.threads.maxThreads=1 --poolOptions.threads.minThreads=1`.
  Final source manifest binds all six runtime/test/fixture TS paths and proves
  no source change through validation. The child was committed during the run;
  documentation/commit metadata changed, tested runtime/test bytes did not.
  This is serial-only acceptance. Earlier default-parallel timeout/performance
  remains open; expected refusal/React test warnings were retained in the log.
- Independent CODE/GD APPROVE final runtime/decision/test bytes; final result/
  publication QA and exact disposable cleanup are recorded in the ledger.


Raw exact sources, commands, failed/corrected RED/GREEN receipts, planner/factory
JSON, compatibility traces and independent reviews remain root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-first-elite-r7una0p6`.
Root retains required evidence until umbrella consumers finish and removes it
afterward. Disposable cache/tmp/build cleanup follows all consumer releases;
its exact result is recorded in the execution ledger. No push/PR/merge/deploy.

A separate earned Den browser screen must still use the frozen same40ceiling,
real combat carry and exact existing equipment. Claim500XP/+1skill only after
actual full clear→Akara→explicit claim. No extra grinding/refill/import, alternate
recipe or victory claim is authorized by the arithmetic comparison. C0 remains
in progress; C1–C4/G0–G7/fullv1 remain unaccepted.
