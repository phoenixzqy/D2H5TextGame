# BUG-590 — Preserve future caster upgrades during surplus salvage

- Status: fixed after the frozen earned-Hell training process became terminal.
  Root owns the repair; no other agent is assigned.
- Severity: Medium. This affects an opt-in campaign diagnostic's retention
  policy; no player-facing automatic salvage or actual item loss is claimed
  from the constructed reproduction.
- Affected systems: campaign caster preparation, earned inventory retention
  and acquisition evidence.
- Source: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus current uncommitted
  work; authority29/source
  `560c14d931ba87527e20d43d5381584b73d6405abc9c4228b2bf7cbacc0ecc32`.
- Environment: Node/Vite SSR, constructed service-store fixture, fixed clock
  `1793304000000`. No browser or combat seed is involved.

## Reproduction

1. Create a constructed Sorceress, award the fixture's XP to26 and allocate
   its existing native cold-Nova profile points.
2. Fill the fixture backpack with120 ordinary rare caps and a rare Armet
   (`items/base/helm-armet`, required level45) with constructed strong Life/Mana
   comparison modifiers. Confirm the Armet fails current equip eligibility
   specifically because the character is level26.
3. Call `recoverCampaignCasterCapacity`; inspect the
   `caster-capacity-selection` record and stop by throwing before any native
   salvage request or debit.
4. Observe that the Armet is in `itemIds` and absent from `retainedItemIds`.
   No sink callback occurs and the entire pre-debit state stays exact.

Expected: future ineligible ownership participates in read-only retention
ranking, as required by
[the surplus policy](../../docs/plans/decisions/P15-travincal-earned-salvage-policy-v1.md:13).
Actual equipping must still require current native eligibility.

Actual: the retention loop filters candidates by current equip eligibility
before scoring. The best current plain cap is retained, while the future
upgrade is selected for destruction.

## Evidence and cause

`tests/campaign/caster-preparation.ts` applies
`checkEligibility(item, player, bases).eligible` in the surplus-retention loop.
This is the correct guard for equipping, but excludes future ownership from
the distinct retention decision.

Root-owned evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
The exact driver, runner, log and result use stem
`bug590-future-caster-retention-repro-v1`. The result records the failed
eligibility, selected destruction ID, zero sinks and exact unchanged state.
This is a constructed policy reproduction, not earned campaign evidence.

Workaround: preserve future gear in stash when there is room, or omit this
opt-in diagnostic salvage policy. The running Javelin training uses the
separate normal-only policy and is unaffected.

## Repair and validation

Remove current equip eligibility only from surplus retention ranking; leave
native equip checks, scores/floors, special/socket/reservation protection,
material costs, transactions and sink accounting intact. Add a focused
regression proving future candidate retention and native equip refusal, plus
actual surplus salvage conservation. Run only the affected cases and scoped
types/lint after the existing source freeze ends.

Implemented: the retention-only eligibility filter is removed. The new
constructed regression fails on the original code because only `junk-0`
survives; it passes with the fix, preserves the future Armet through an actual
native salvage transaction, reconciles the complete economy, and confirms that
native equipping refuses the unmet requirements without changing state.
Five related existing cases also pass: deterministic gear selection, stash
retrieval, protected surplus salvage, committed post-recorder-failure accounting,
and formerly equipped custody. Six actual cases passed; nineteen filtered cases
are excluded from the count. Scoped strict types and explicit two-file lint
pass. No combat, completed campaign, or unrelated suite was run for this repair.

Exact evidence: `bug590-red-v1.json`, `bug590-green-v1.json`, and
`bug590-final-checks-v1.json` in the packet above. The repair changes only
`tests/campaign/caster-preparation.ts` and its regression test. The running
Javelin path's normal-only salvage policy remains separate.

Security check: pass for local first-party fixture and diagnostic ownership
rules; no real save, credential, permission, dependency or external service is
changed. Plan review: ready for the narrowly separated retention/equip rules;
this repair does not authorize an expanded Javelin sink policy.
