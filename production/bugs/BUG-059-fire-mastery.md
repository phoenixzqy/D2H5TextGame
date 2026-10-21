# BUG-059 — Apply learned Fire Mastery to hero fire damage

Status: Runtime fixed in this increment; copy and browser acceptance pending.
Severity: High — allocated Fire Mastery has no advertised damage effect.
Owner: engine-dev; root implements, producer/QA independently review.

## Reproduction

Runtime commit `2fe7f4e` plus independently reviewed reproduction tests.
Node v24.21.0/Linux, Vitest; browser/viewport/locale do not apply to this
pure engine reproduction. Imported ranks and eligible levels are explicit
integration scaffolding, not earned progression or campaign/balance evidence.

1. Run `node_modules/.bin/vitest run src/engine/progression/fire-mastery-composition.test.ts`.
2. Compose a Sorceress at character level30, effective Energy20 and allocated
   Fire Mastery rank1,10,20 or99 under either exact alias. Do not supply a combo.
3. Compare missing/malformed/wrong-class/ineligible allocations and learned
   Warmth rank1/20 controls. Recompose repeatedly and remove Mastery.

Expected, per [D05](../../docs/plans/decisions/D05-fire-mastery-v1.md):
exact aliases resolve the maximum finite positive integer allocation once,
clamped to authored cap20. Eligible Sorceress level30+ receives +4% fire per
rank, additive with Warmth (+1% per rank). Both rank20 produce +100% fire;
rank1 plus Warmth1 produces +5%. Recovery, resource pools and nonfire damage
remain unchanged. Automatic passive needs no combo/action/MP/CD/marker.

Actual: Mastery contributes zero; rank20 alone produces fire0 instead of.8,
and both rank20 produce only Warmth's.2 instead of1. Baseline mana recovery
and unrelated/ineligible controls remain intact.

## Evidence and root cause

Genuine prepatch pure RED:14 failed/25 passed,39 tests, exit1 in1.782s;
no deadline/cap stop, cleanup signals or survivors. Frozen pure test SHA256
`64274af4fe3329132fe6c8bd523d8d6e8697bbf3e10613c3a78955805465b90c`.

`composeHeroRecovery` composes only Warmth fire despite the authored Mastery
contract/rank resolver. Add independently eligible allocated Mastery at that
upstream boundary. Existing native adapters refresh this map, direct fire
consumes it once, and fresh Burn derives from final hit. No downstream runtime
patch is justified unless genuine RED establishes a further gap.

Root-owned temporary evidence:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-fire-mastery-3c7zf7mr`.
Records: `focused-runtime-pure-red` log/report/command/process metadata.
Complete actual prepatch seed7 Mastery0/Warmth1 recording is frozen unchanged
as `unaffected-recording.json`, SHA256
`0a6c53176ff4184cc99bc676d785c2695ce45138ed09e033460265a1c683a054`.
Its89 events and complete result are literal regression assertions independent
of the new runtime. Native and real Fire Bolt/Burn RED/GREEN execution is retained; no
browser persistence, campaign, balance or coverage acceptance is claimed.

No gameplay workaround supplies this automatic passive. Preserve RAW through
whole-card durable evidence/review, then root removes exact task-owned outputs.
No save field/version/migration, global tuning or remote action belongs here.

Full reviewed prepatch behavioral RED:30 failed/34 passed,64 tests across
3files, exit1 in4.397s; no deadline/cap stop, signals or survivors. Evidence:
`focused-runtime-full-red` log/report/command/process records. Failures isolate
missing Mastery in pure composition, actual Fire Bolt/Burn and native fresh
wave/save reconstruction. Full unaffected recording, invalid/eligibility,
nonfire, passive exclusion, replay/resource and existing Warmth controls pass.

## Runtime resolution

The minimal fix adds independently eligible Mastery in hero composition, using
the immutable authored definition and shared allocation resolver. Warmth and
recovery remain unchanged. Focused64/64 pass with the reviewed behavioral
oracles intact. Strict typecheck exposed an exact-optional fixture-helper
construction error; independently approved correction omits an absent property
without changing assertions or product interfaces. Original RED/GREEN/type
outputs are preserved. Earlier overlapping unit/type attempts are historical;
final accepted gates must run strictly sequentially. Copy reconciliation and
production browser save/reload proof remain required before full acceptance.

Final runtime validation: unchanged engine bytes pass1625tests/69files in9.109s;
final native5tests in4.436s, full unit3934tests/175files in66.344s, typecheck11.366s,
lint28.948s and clean production bridge/build8.986s pass strictly sequentially.
The latter final runs include both approved helper corrections. Earlier overlap,
TS2379 and require-await failures remain distinct historical evidence. No stop,
cleanup signals or survivors occurred. Existing engine3s/unit15s targets are
still missed; Browserslist, large-chunk and precache warnings remain. No new
coverage or browser/earned campaign/balance acceptance follows runtime GREEN.
