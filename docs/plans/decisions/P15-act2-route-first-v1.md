# P15 — Attempt Act II before training, v1

2026-11-04. Addition to the campaign diagnostic, under P15's earned
first-clear/acquisition requirement in `playable-target.md`. No game design or
combat formula changes. Historical prepared runs keep their original policy.

The current `challenge-prepared-act2-v1` controller trains before every area
to the native planner maxima 18/20/22/26/28/32. Thirteen retained completions
are consequently level32, with substantial farming and equipment. Their earned
power is valid evidence, but is not a representative first-entry distribution.
Charge's repaired Attack component does not resolve that distinction.

## Explicit diagnostic policy

- Register opt-in `route-first-act2-v1`, restricted to the Act II phase. Skip
  automatic level14 training at the Act II boundary and all first-entry area
  training. Native access checks decide whether current earned state can enter.
  Keep the existing fresh Act I policy and declared companion/equipment actions.
- Attempt each of the six native route areas with current earned state. Keep
  the real quest graph, claims, RNG/ordinals, earned points and item income.
  At most three settled route admissions per area, including carried attempts.
- Only a matching settled route nonwin authorizes recovery before another
  attempt. Earn one additional level from the failed attempt's **terminal**
  level, then retry. The recovery level ceiling is32; reaching it without a
  win stops as a budget result. No training follows a third route nonwin.
- Recovery selects the previously cleared Act I/II area with highest complete
  challenge maximum at most current hero level minus2; break ties by area ID.
  Keep the existing Dark Wood fallback after a training nonwin. If no eligible
  area exists, record a budget stop; do not grant power or force admission.
- Preserve existing shared600/per-area200 training admissions and
  three-consecutive/ten-total training nonwin bounds. Training losses keep
  their XP, items and ordinals. Technical, unsettled or mismatched failures do
  not authorize retries. Between-wave interruption stops and retains income.
- Route rows retain complete challenge maximum as `targetLevel` metadata;
  this is not an entry gate. Training rows record the one-level recovery target.
  An independent audit derives permitted training/entry from the preceding
  settled route failure and recorded terminal XP, not live stores or that label.
- Carry pending recovery target and route-attempt count through an audited
  training checkpoint. Prior route/training costs remain in their original
  spans; importing a continuation cannot reset limits or replay paid rewards.

## Verification and interpretation

Use constructed controller tests for no-pretraining admission, quest order,
one-level earned recovery, native nonwin versus interruption, shared bounds,
audit rejection and checkpoint continuity. Check CLI/native dispatch and scoped
strict types/lint. These checks do not require a campaign replay or browser
rerun: only the diagnostic controller changes.

The next gameplay experiment should branch from a pinned, retained Act I
completion rather than replay Acts I–V. Freeze its acquisition/equipment policy
and bounded cost before admitting it. Report success, nonwins and budget stops
equally. A single exploratory branch cannot establish typical-player power,
population win rates, active-hour pacing or formal balance acceptance.

Security check: pass; authorized local policy/readback work, no credentials,
network, dependency installs, protected holdouts or publication. Plan review:
ready after including the Act II boundary pretraining and recovery checkpoint
state. The prior goal turn was status-only/no progress. Root remains sole writer
in the existing claimed worktree; retain the exact task packet and remove only
its owned disposable artifacts after consumers finish.
