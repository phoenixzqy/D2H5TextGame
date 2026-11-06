# BUG-736 — Reconcile cleared Act I recovery sources in Act II

- Severity: Medium; the campaign audit can misclassify valid diagnostic losses.
- Status: Fixed and locally verified in the uncommitted increment on
  b5a0898806bfba369a2d84a1b6c41d0bbb057fce; no new commit exists.
- Owner: root acting as qa-engineer/engine-dev.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus existing human2 changes.
- Environment: WSL/native TS; browser, viewport, locale and combat seed not
  applicable to these constructed admission/accounting cases.

Reproduction:
1. Construct the route-first Act II fixture at level14 with Blood Moor cleared.
2. Settle a route defeat, then the authorized Blood Moor training defeat.
3. Pass the successful detailed preparation audit into `assertCampaignRecovery`.

Expected: the outer audit reconciles both retained losses. Actual: it rejects
the training loss with `Undeclared Act II nonwin source`. A second constructed
control also shows it accepts an unauthored Act II area through a string prefix.
Root cause: the outer source check assumes only Dark Wood can supply Act I
training and identifies Act II sources by prefix instead of canonical identity.
The detailed preparation audit already validates cleared status, source levels,
recovery authorization and admission custody. Correct the outer source boundary,
preserving all overlap and unmatched-loss checks. No production combat change.

Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act2-route-first-02brsjk1/recovery-red.log`
and matching exit receipt; two expected failures, three negative controls pass.
Affected tests: `tests/campaign/act2-area-preparation.regression.test.ts` and
`tests/campaign/recovery-audit.regression.test.ts`.

Resolution: `assertCampaignRecovery` resolves the canonical area and checks its
`actId`, allowing authored Act I farming and rejecting unknown IDs, Act I route
exclusions and Act III farming. The detailed preparation audit still requires
cleared/eligible sources, earned recovery, exact admissions and shared bounds.
`recovery-green-v2.log` records26 affected passing cases with120 intentionally
filtered skips. Scoped strict types and explicit no-ignore lint pass. The
retained Bow native branch and separate v2 readback reconcile40 admissions,
including31 authorized Act I recovery admissions; no combat replay was needed.
See [Act II evidence](../../docs/plans/evidence/p15-act2-route-first.md).
