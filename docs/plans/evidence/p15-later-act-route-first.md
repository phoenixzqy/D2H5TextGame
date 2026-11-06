# P15 — Later acts attempt progression before recovery training

2026-11-05. [BUG747](../../../production/bugs/BUG-747-later-act-route-first-measurement.md)
is fixed locally. Opt-in `route-first-campaign-v1` execution uses the existing
Act II route-first policy and extends first-entry measurement through Acts
III–V. Earlier measurements trained toward full challenge maxima before entry;
their training totals cannot prove natural pacing. Historical results retain
their original interpretation.

## Implemented behavior

- Attempt earned routes before advisory training. Only a matching settled route
  loss authorizes recovery to its terminal level plus one.
- Retain three total route attempts, native XP/clear custody and existing
  training/nonwin bounds. The final authored challenge maximum bounds recovery
  farming without gating first entry. Proven wall continuations derive pending
  recovery and spent attempts from retained history.
- Skip generic boundary preparation. Act V requires the main-quest route.
  Retain native quest actions, Claims, costs, equipment choices, reward accounting
  and save/export paths. Keep controllers and independently derived audit
  results after both success and technical interruption.
- Preserve existing executions and absent-policy behavior. Route-first state
  cannot adopt a historical direct-route prefix.

Integration exposed and fixed three additional gaps within this change:
the native callback mistook training recovery for an Act I flee flag; the retry
audit omitted runtime's recovery ceiling; and the CLI's outer recovery assertion
recognized Act II losses only. An explicit adapter, matching ceiling check and
canonical, nonoverlapping later-act loss reconciliation address these. A legacy
profile case proves the selected entry policy authorizes its training rule
without an unrelated historical profile flag.

## Verification and limits

Ten affected constructed controller/dispatch/audit files pass 375 cases. After
final test typing/lint corrections and the legacy-profile fix, a focused
selection passes 41 cases, with 45 intentionally filtered skips. Selections
overlap. Coverage includes under-advisory first wins, earned-prefix losses,
bounded recovery/retries, proven wall continuations, nonwin limits, invalid
sources/policies, premature farming, unearned retries and forged ceiling/overlap
records. Retained RED outputs reproduce the actual integration defects.

Native dispatch wiring uses constructed combat only. Both an intended build and
a legacy diagnostic profile reach all five acts with zero generic preparation,
64 native quest actions and economy/quest/controller audits. The recovery case
completes both training waves with learned curse recovery and no unintended
flee. Three separate technical stops retain the spent later-act admission and
partial controller/audit, avoid later-act dispatch, and restore the outer realm.
These are functional checks, not earned completions or balance populations.

Scoped strict TypeScript passes across 990 transitive files with zero
diagnostics. Explicit eleven-file `--no-ignore` ESLint passes with zero warnings.
CLI syntax passes; intro, Act I and minimum-route Act V fail before output
creation. All 2,116 production source hashes and original-checkout status match
their pre-change records.

Root reviewed the incremental diff on correctness, readability, architecture,
security and performance; no material finding remains. This is self-review,
not independent final acceptance. The change adds no dependency, network use,
credential, permission, production reward/save change or CI action. No earned
campaign, sample budget, browser, build or broad suite was run.

## Execution and evidence custody

Select `CAMPAIGN_EXECUTION=route-first-campaign-v1` with an Act II–V phase;
Act V additionally requires `CAMPAIGN_ACT5_ROUTE=main-quests`. A valid execution
still needs a prospective frozen source/profile, complete ancestral costs and
separate remaining admission/combat/wall/storage budgets. Selecting this mode
does not renew an exhausted experiment or authorize replaying a completed one.

Root retains this exact evidence packet through full-v1 acceptance, then removes
it after its consumers finish:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-later-route-first-5wdbs4lg`.
It contains originals, incremental diff/hashes, original failures, final scoped
checks, CLI validation, source-invariance and cleanup receipts. The temporary
typecheck config is removed after recording its contents. All task test/check
handles are terminal; no browser/server/cache was created for this increment.

Counts remain 14/14 historical intended Normal completions, 210/210 supplemental
checkpoint sources and 0/210 formal balance acceptance. Natural active-hour
pacing, acquisition/economy, build fairness, difficulty/endgame and integrated
app/soak/independent acceptance remain incomplete. Next address the unresolved
early Fire progression and Duriel challenge findings, preserving prior failures
and spent allowances.
