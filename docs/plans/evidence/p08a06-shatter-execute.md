# P08a06 — Shatter execution on current authored physical hits

Status: validated scoped engine repair; full private-v1 acceptance remains open.
Active pre-hit Freeze now lets a landed positive direct physical hit execute a
living target strictly below20%HP. Exact20%, crossing below on that hit, miss,
elemental/thorns/DoT and Freeze first applied by that hit do not execute.
Basic attacks and current authored physical skills qualify on every side/tier.
No campaign, earned-clear, pacing or prior native-draw causality claim follows.

## Contract and causal evidence

[D04](../decisions/D04-shatter-v1.md) records GD/TD-approved pre-hit eligibility,
existing strict predicate, half-open/legacy status activity, boss eligibility,
single event, ordinary DoT potency and existing death closure. Current authored
physical skills do not apply Freeze; the catalog invariant flags future mixed
physical/Freeze additions before extending the bounded no-self-combo claim.
Generic future source-skill provenance remains unresolved.

Producer and QA independently reviewed the draft before freeze. Corrections
preserve actual summon-first target order, normalize only intended differences
in recorded/plain event arrays, and compare frozen19/100 with frozen1/5HP.
The latter is Shatter-ineligible at exactly20%; seed5's MP-only ordinary drops
would become HP-only after one extra execute RNG draw. All exact tests were
approved at SHAe88edaa0941322d50b7d0162adc466723ba9334be9e3ca09e28628a51405bcc6
before execution; no post-freeze test change occurred.

Against parent179748c, bounded RED reaches14 runtime assertion failures and15
passing controls,2.509s/exit1. Actual authored Frost Nova applies33cold plus
Chill/Freeze at500ms; its later basic attack deals ordinary16 at1000ms rather
than executing157/1000HP. Minimal seed7 frozen19/100 similarly takes1 instead
of19 at1700ms. BUG-054 was filed before patching runtime.

Runtime SHAcbf1cbee0bb566bae986e8dc63422f75f0040a7cd793c4820a1e6396c6060547
uses the existing unchanged `shouldShatter` on an active pre-hit view after
ordinary damage resolution. The single event and HP update use
`max(ordinaryFinal,preHitLife)` on execute; crit/overkill survive and poison
potency retains ordinaryFinal. No new RNG draw, API/save/stat/data/threshold
change or death handler. Existing ordered death closure handles orphan
suppression, schedule removal, primary effects, summon refunds and orbs.

## Validation

| Command | Observed result |
| --- | --- |
| Engine |1160 passes/60 files,7.740s; all29 Shatter cases pass |
| Full unit with coverage |3343 passes/164 files,67.857s; no skips/failures |
| Typecheck |exit0,25.110s |
| Lint including engine purity |sequential rerun exit0,28.462s |
| Engine coverage |94.6% lines/statements,94.54% functions,90.66% branches; unchanged80% thresholds |
| Production build and bridge-removal guard |exit0,8.827s; four clean JS chunks |

The complete85-event no-Freeze recording and full result are identical before
and after patch. Normal/recorded replay and input immutability remain covered.
Tests include roles/sides, exact threshold/crossing/miss, status boundaries,
nonphysical/periodic/current-hit negatives, bosses, crit/overkill, graph closure,
refund caps, poison potency and downstream RNG, and real Frost→basic combat.

The first lint attempt was interrupted by the task monitor at36.267s when
concurrent completed coverage deleted `coverage/.tmp/coverage-1.json` during
size traversal. No lint product diagnostic was emitted. Both exact-owned TERM
identities and all metadata are retained; no survivors. After coverage ended,
the identical command passed sequentially. The interruption counts as no pass.
Existing3s/15s engine/full timing targets remain exceeded; no gate was weakened.
Existing chunk-size, art-manifest-precache and Browserslist warnings remain.

Commands use focused30/engine120/unit120/types90/lint90/build210s caps plus2s
exact-owned cleanup,32MiB per log/report and64MiB total RAW/dist/.vite. Coverage
ran before build; build waited for all test/source/fingerprint consumer releases.
No broad signals or shared-cache cleanup occurred.

## Review and retention

GD/TD, producer and QA approve the runtime/contract and causal evidence;
producer/QA approve the exact frozen tests. Independent final durable review
follows the indexed packet. [Packet](fixtures/p08a06-shatter-execute/packet.json)
indexes every retained regular record by exact bytes/SHA256, including draft
corrections, frozen/before/after sources, original RED, interrupted lint,
complete controls, reports and process metadata. The adjacent raw archive
preserves those records. QA found an inherited `ownership.json` parent167bc11 in the first packet.
The original is retained as `ownership.original.json`; corrected metadata now
names the actual179748c execution parent, consistent with initial-source,
freeze, original runtime and packet. The previous review/hash record is retained.
No product/test/contract change followed. The archive was rebuilt after all
readers released. Its evidence-document snapshot predates final review notes. Root owns disposable cleanup after consumer release;
a separate closing ledger records exact cleanup and commit.

No browser/earned-loop, full D04/P08, campaign/balance or C0–C4/G0–G7 acceptance.
No push/PR/merge/deployment. The root worktree claim continues for the full goal.

Producer and QA independently APPROVE the corrected final packet
8313f69c6501ad411c5c3e6d28369505905695f2366a180303e16478563425f3 and archive
ec63441513af88ef9e1c726ab6085e100733e030739c853b62df829bd424ecff. All146safe
regular records/4,737,678raw bytes/564,173compressed bytes match index and RAW.
The seven commands, source stages, controls and all832nonlive process identities
were independently verified. All source/RAW/archive/dist readers released.
