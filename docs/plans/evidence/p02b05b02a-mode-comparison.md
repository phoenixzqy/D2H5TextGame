# P02b05b02a — pure restored-mode comparison

Status: source and test-contract independently APPROVE; final durable packet
verdicts are recorded in the fixture reviews. This accepts the bounded comparator,
not full P02/D07, earned idle eligibility, UI routing/repeat/stop, a clear, Den,
Andariel, campaign, pacing, general balance, C0–C4/G0–G7 or private v1.
No push/PR/merge/deployment.

Adds only `mode-comparison.ts` and its test under `tests/sim/production/`.
All27 preserved harness/config/contract hashes, including the accepted adapter
and its assertions, remain unchanged. No product, game data or dependency edit.
The typed comparator consumes closed observations without rerunning gameplay,
mutating values or resetting any process-global identities/ordinals.

Each paired wave compares complete opening player/enemy actors and the actual
native seed `(runSeed ^ ((index + 1) * 0x9e3779b1)) >>> 0` before classifying
recordings. Equal inputs with unequal outputs report `mismatch`; different
inputs report `different-inputs`. Missing handle/wave or unequal indices report
`unpaired`, retaining indices and explicit null equalities. Recorded events,
outcome, opening and actual played logs, played teams/cursor/completion, native
advance result and terminal sim clock form the battle-output projection.
Presentation, pity and complete combat observations are separate.

Separate source/baseline/handle/reward/domain/timing/full-raw projections retain
original values. The named semantic reward comparison omits only known Items'
top-level IDs in raw wave awards, actual added items and terminal run rewards.
Nested IDs, removed item IDs, clear IDs, currency keys/values remain significant.
Ordered item identity streams retain duplicates. Full raw observation equality
includes mode, source dirty metadata, wall time and every original ID. Explicit
battle/reward coverage distinguishes no-wave/zero-award controls; victory flags
alone never certify exercised paths.

## Reviewed tests and RED

Producer/GD/TD/QA approved plan and exact tests+typed throwing boundary before
execution. Concrete review corrected nonexistent actor probe fields to actual
native own fields, semantic/order input immutability, actual played-log coverage,
lossless spill encoding, complete unpaired nullable/index rows, and a genuine
capability matcher before comparator invocation. Every sensitivity corruption
uses cloned observations; no alternate seed/build/pity search.

Original frozen test SHA1253aa21594ec81c34fb07cce35da8fb62bc189963aaec76dca88123b5d850df;
throw boundary SHA1f473290ca3702b13d39032c34b772bda5f5cbe0cb04d389e84ef0fa40ddce3d.
Missing module RED: zero tests/assertions, exit1/3.633s. Boundary RED:79failed
tests/88actual matcher calls, exit1/5.947s. Deeper assertions were unreachable;
no runtime defect or per-assertion RED beyond reached matchers is claimed.
Input-stage subset57pass/22filtered11.404s. First complete GREEN79pass/
439actual matchers14.114s, under unchanged30s deadline+2s exact-owned-PGID cleanup
grace; no timeout/grace/signals.

Initial related79pass29.031s/full3249pass159files58.108s/lint55.248s passed,
but typecheck exited2/20.729s: strict test indexed-access and mixed-length
Vitest callback path inference. Original freeze, RED, GREEN and failure retained.
Independently approved exact amendment adds throwing `requiredAt` guards and
`readonly Path[]` annotation only. QA inverse-transform reproduces the frozen
original exactly; all79cases, matcher expressions/expected values and four-call
acquisition remain. No comparator implementation change. Amended test
SHA68da6bd46f0cf4b54a5c5f5608c252895f17e295778a31fddcd7e72b81efd7fc.
Old evidence is not substituted for amended-byte verification.

## Native verification and final checks

Exactly four calls per acquisition process: manual0,idle0,manual11,idle11,
with the accepted synthetic baseline/fixed clock/seed/ordinal. At most12native
battles per process, actual8; all W1win/W2defeat, no W3/clear. Ordinary-pity
pair has equal baseline/handle and actual inputs/outputs in W1/W2, despite pity,
presentation and original award IDs. Shallow semantic rewards match. Hard-pity
pair's W1 enemies differ and W2 both teams differ: both rows `different-inputs`,
with differing semantic rewards. Matching seed/ordinal alone is insufficient.
No new primary balance screen: b01 remains the primary historical dataset.

Throw boundary, input stage, first GREEN, original related/full and amended
related/full each acquire4cases/8battles:28adapter calls/56computed battles,
scoped only to this comparator test file. Other existing full-suite harness
activity is outside that accounting. Three retained complete observation sets
(boundary/firstGREEN/finalrelated) each have8source states/494manifest entries;
root reconstructs all fingerprints using the exact boundary/original/amended
source bytes appropriate to each stage, plus all27preserved hashes.

Amended related79pass/439matchers29.284s; full3249actualpasses/159files, zero
other statuses57.455s; typecheck20.658s/lint56.031s incl engine purity pass.
Existing5srelated/15sfull budgets exceeded and unchanged; concurrent timings
are not performance acceptance. After all tests and all source consumers
released, production build/test-bridge check8.794s passed and scanned4clean
chunks. Existing large-chunk/generated-art-manifest precache warnings remain.
No browser/coverage acceptance for this Node-only measurement module.

Final measured source parent4049a98b80d922321732342c07b421856d6e5de3 plus exact new
implementation/test bytes; tree22185dd47c647614ed9e9d0c78cbeb3566a9deeff62fcd090c36b87c4de7a9ea.
Implementation SHAba3cb6542c2d5424619b5569b0e408ec7c7d9fbf6b87bbbceba74c1f6fe7607a.
Feature commit subsequently changes Git SHA; source snapshots preserve measured
inputs. [Packet](fixtures/p02b05b02a-mode-comparison/packet.json) and indexed
archive retain exact plans/freezes/candidates/approved amendment/source snapshots,
commands/logs/reports/full lossless observations/audits. [Final reviews](fixtures/p02b05b02a-mode-comparison/reviews.md)
record concrete and durable independent gates. Exact task-owned cleanup follows
all reader releases and the feature commit, in a separate closing ledger.
Next is before-import report/CLI orchestration, then earned full-clear/UI proof.
