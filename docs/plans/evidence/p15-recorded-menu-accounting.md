# P15 — Offline accounting for recorded menu actions

2026-11-05. Implemented locally; full private v1 and 30–50 active-hour pacing
acceptance remain incomplete. The previous goal turn was status-only/no progress.

The campaign journal retains decisions but existing reports publish only combat
time. [The accounting script](../../../scripts/account-campaign-pacing.mjs)
now reads those artifacts without importing gameplay, changing saves or replaying
campaigns. It streams concatenated gzip JSONL, hashes the compressed bytes read,
and reconciles admission/wave identity, duration, outcome, advance and hero Life
against the report. Known failed-attempt and unobserved combat costs are retained;
unknown durations remain unknown. Native v3 summaries are cross-checked. Older
retained v1 continuation reports lack independent admission history/summary
fields: their available wave/combat/admission totals are checked, that missing
verification is explicit, and adjusted totals stay unknown.

## Counting and timing contract

Classification is `campaign-recorded-decisions-v1`; output format is
`campaign-pacing-accounting-v1`. Raw kind counts, classified action units,
excluded telemetry, unknown kinds, repeated priorities, empty reviews and
candidate checks are retained separately.

- An action attempt counts once regardless of success/refusal. Allocation and
  salvage count their recorded batches, not each point or item. Quest-action
  records use `quest-action:<action>` categories; current callers suppress the
  nested start record, so the wrapper represents one action.
- Priority counts the first order and subsequent distinct consecutive orders.
  Repeated orders add no unit; these are scripted configurations, not proven
  human decisions or actual changes from the initial game state.
- Equipment reviews count each nonempty candidate set, including ineligible or
  no-change reviews. Empty sets add no unit. Candidate checks are descriptive
  counts, not additional charged actions. Execution of an equip is separate.
- Only explicitly inspected telemetry kinds are excluded. Wrapper selection/
  preparation costs must be included in the associated leaf-action cost, without
  overlapping review/equip costs. New kinds remain unknown.

The optional inert JSON policy has `format: "campaign-menu-costs-v1"`, a nonempty
versioned `id`, `basis: "assumed"`, and `costsMs` mapping each observed action
category to a finite nonnegative millisecond cost. Its exact bytes/hash and
values are embedded in output. There is no default timing or claim of human
calibration. Costs assume serial non-combat decisions; overlapping decisions
during combat are outside this model.

Missing category costs, unknown event kinds, unobserved waves or missing native
admission-history verification withhold `recordedMenuMs` and
`recordedDecisionAdjustedMs`. `coveredMenuMs` remains an explicitly partial
subtotal. Combat-only time, driver execution time and assumed action time stay
separate. `economicMs`, `humanActiveMs` and `afkOfflineMs` remain null: navigation,
Return/recovery, reading, idle/offline waits and ordinary-clock human calibration
are not reconstructed. Even a fully costed recorded-action estimate is not a
complete economic-time estimate or a pacing acceptance result.

Run with absolute local paths and an unused output outside every repository:

```sh
node scripts/account-campaign-pacing.mjs \
  --report /absolute/report.json \
  --journal /absolute/native.journal.jsonl.gz \
  --output /absolute/new-accounting.json
```

Add `--policy /absolute/assumed-costs.json` for a sensitivity estimate. Outputs
use exclusive creation and refuse repository ancestors, including symlinked
parents. Inputs are never rewritten. Malformed/truncated input or report/journal
disagreement fails before publishing an accounting report.

## Retained Act I readback

The [fresh Double Swing lineage](p15-swing-fresh-observed-lineage.md) Act I
report/journal hashes match the previously retained hashes. All 118 admissions
and 355 waves reconcile: 354 victories, one defeat, 3,388,035.782052 combat ms
(56.4673 minutes), including 3,080 failed-attempt ms. Driver execution remains
28,395.483 ms, not player time.

There are 3,245 journal records and 2,075 classified action units. The tool
excludes 180 repeated priorities and 78 empty reviews; 27,586 candidate checks
are descriptive, not extra decisions. No unknown kinds or unobserved waves
occur in this stage. Without a policy, adjusted time remains null.

A separate policy, `uniform-five-second-sensitivity-v1`, explicitly assumes
5,000 ms per classified unit: 10,375,000 assumed menu ms plus combat gives
13,763,035.782052 ms (3.82307 hours). This intentionally uniform example only
exercises policy arithmetic. It is not a recommended timing policy, calibrated
player time, a bound or evidence that the campaign meets its pacing target.

## Retained later-act readback

The same retained Double Swing lineage continues through Acts II–V. Each stage's
available report/journal wave identities, durations, outcomes and counts
reconcile. No gameplay or campaign was replayed.

| Act | Combat ms | Classified action units | Waves / victories |
| --- | ---: | ---: | ---: |
| I | 3388035.782052 | 2075 | 355 / 354 |
| II | 9498992.66419037 | 22147 | 1740 / 1740 |
| III | 8975832.700248389 | 10099 | 1297 / 1297 |
| IV | 11587691.501376195 | 9903 | 1225 / 1225 |
| V | 12267999.651440699 | 11664 | 1644 / 1644 |

Total retained combat is45718552.299307644ms, or12.69960h. This historical
advisory-farming lineage is not a natural first-session pacing measurement.
Acts II–V use the older continuation format: `admissionHistoryVerified:false`,
zero unobserved waves and no adjusted/human/economic total. Unclassified kinds
remain explicitly unknown:

| Kind | Act II | Act III | Act IV | Act V |
| --- | ---: | ---: | ---: | ---: |
| `actN-area-prepared-attempt` | 325 | 224 | 225 | 261 |
| `campaign-socket-preparation` | 692 | 224 | 225 | 261 |
| `campaign-socket-skip` | 5151 | 224 | 224 | 261 |
| `continued-native-checkpoint` | 1 | 1 | 1 | 1 |
| `intended-act2-companion` | 1 | 0 | 0 | 0 |

Original Act I outputs predate the final format/history fields and are preserved
as such. Later-stage outputs are `act2-accounting.json` through
`act5-accounting.json`; `later-stages-attempt2.log` records their final readback.
All outputs retain exact input byte hashes. No new default timing or silent
telemetry classification was introduced to fill the later-stage gaps.

## Validation and custody

[Eight focused Node tests](../../../scripts/account-campaign-pacing.test.mjs)
pass, covering failed time, counts/double charging, refused actions, unknown
kinds/prototype-shaped keys, missing costs/history, old continuation format,
invalid policies, truncated gzip/JSONL, report disagreement, exact hashes,
input immutability and exclusive external output. Original missing-module RED
and continuation-format RED results are retained. The two-file standalone
ESLint recommended check passes; its first CLI invocation used an unsupported
option and is retained. No TypeScript/gameplay source changed, so no broad
suite, build, browser or campaign rerun was needed. Review is root self-review,
not independent acceptance. Self-review of all236 source and175 test lines
confirms inert input processing, gzip-member streaming, per-wave reconciliation,
explicit incomplete-history handling, disjoint recorded counts and exclusive
external output. No material finding remains within that accounting contract.

Exact evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-pacing-accounting-70_ef_5d`.
Root retains plans, source snapshots, accounting reports/policies, original
failures, validation logs and closeout inventory through full-v1 acceptance,
then removes that exact packet. The predecessor campaign packets retain their
existing owners/lifetimes. Test fixture directories are removed and their
absence asserted in each test's finally block. Final accounting handle66953
exited0. `closeout-inventory.json` records exact retained files/source hashes;
no task process, task-local cache or disposable artifact remains. Original
failures remain preserved; no unchanged tests were rerun for this closeout.

Historical counts remain 14/14 intended Normal builds, 210/210 supplemental
checkpoint sources and formal balance 0/210. Natural pacing, wider progression/
acquisition/economy, difficulty/endgame and integrated app/owner acceptance
remain open. Exhausted campaign/sample/retry budgets remain closed.
