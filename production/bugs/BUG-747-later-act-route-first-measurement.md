# BUG-747 — Measure later-act progression before advisory preparation

- Severity: Medium; evaluation gap, no production gameplay restriction.
- Status: Fixed locally; scoped verification complete, uncommitted.
- Owner: root acting as QA/engine developer, solo.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited changes.
- Environment: local Node/TypeScript evaluation runner on WSL; browser,
  viewport, locale and combat seed do not apply to this control-flow defect.

## Reproduction

1. Inspect `tests/campaign/challenge-area-preparation.ts` at `enterArea`.
2. Observe that its training loop runs before the first native route admission
   and requires the complete challenge maximum as its target.
3. Inspect the Act III–V exports and `native-runner.ts`: no explicit selectable
   route-first later-act policy exists. Act II already supports this policy.

Expected: an explicit prospective measurement can attempt earned routes before
advisory training, retaining all native costs, settled failures and retry limits.
Actual: the shared controller always prepares first. Historical totals therefore
cannot establish natural route-first progression or the active-hour pacing gate.
Evidence: the source ordering above and the constructed regression below; no
campaign replay is needed to reproduce this gap.

## Implementation and review plan

1. Add opt-in `entryPolicy: 'route-first-v1'` to the shared Act III–V controller.
   Preserve absent-policy historical behavior, labels, fallback and all limits.
2. First attempt has no training gate. A matching settled route nonwin authorizes
   recovery to its terminal level plus one, then a retry, with three total route
   attempts. Recovery ceiling is the act's final authored challenge maximum;
   the ceiling bounds farming only and never gates the first route entry.
3. Audit training authorization, actual earned recovery, cap/continuation custody,
   interruptions and source selection. Never adopt or relabel historical routes
   into the new policy.
4. Expose `route-first-campaign-v1` through the native runner and CLI for Act II–V,
   using existing Act II route-first behavior and native later-act quest routes.
   Require Act V main quests so the controller's area order is exact. Record and
   independently audit every new controller state in the report.
5. Constructed regression cases only: first wins, settled losses and rewarded
   prefixes, interrupted recovery/resume, technical failures, exhausted bounds,
   ceiling/no safe source, tampering and dispatch. Run affected files, scoped
   strict types and explicit lint. No earned campaign, balance sample or browser.

Integration findings, 2026-11-05: the native callback's fourth argument is an
Act I flee flag, whereas the shared controller supplies training recovery there.
The focused two-wave recovery regression reproduces unintended abandonment;
an explicit adapter now forwards recovery to combo selection. Ceiling tampering
also reproduced an audit-only acceptance gap; the retry audit now enforces the
same ceiling as runtime. The CLI's outer recovery assertion must additionally
receive each independently audited later-act nonwin, with canonical source and
cross-controller overlap checks; otherwise a valid later-act loss cannot pass
the final report assertion. These are parts of this measurement integration.
The legacy-profile integration case also reproduced a late Act III failure:
route-first was explicitly selected, but a historical profile flag was still
required. The explicit entry policy now owns its lower-level training selection,
matching Act II; the absent-policy assertion remains unchanged.

## Verification

- 375 affected constructed regressions pass across ten controller, dispatch and
  audit files. After final test typing/lint corrections and the legacy-profile
  fix, 41 focused cases pass with 45 intentionally filtered skips. These
  selections overlap; they are not 416 distinct tests.
- Intended and legacy profiles complete the constructed five-act route without
  generic preparation; all 64 native main-quest actions reconcile. Two-wave
  training recovery reaches combo selection without a flee. Technical stops in
  each later act retain spent admissions, partial controllers/audits, exported
  state and outer-realm restoration without fabricating a victory.
- Scoped strict TypeScript: 990 transitive files, zero diagnostics. Explicit
  eleven-file ESLint: zero warnings/errors. CLI syntax passes; intro, Act I and
  minimum-route Act V fail before creating their requested output paths.
- All 2,116 production source hashes and original-checkout status are unchanged.
  No earned campaign, balance sample, build, browser or broad suite was run.
  Original failing regressions and test-fixture/type/lint failures remain in the
  packet; the latter establish no production defect or balance result.

Root reviewed the incremental source diff against retained originals for
correctness, readability, architecture, security and performance. No material
finding remains. This is self-review, not independent final acceptance.
Pacing/economy and full-v1 gates remain open.

Plan review: ready. Integration includes CLI validation, skip of generic training,
native quest callbacks and final checkpoint audits; compatibility stays explicit.
Security check: pass. Local runner/tests/docs only, no dependency, credential,
network, permission, CI, production reward/save change or historical-save writes.

## Evidence custody

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-later-route-first-5wdbs4lg`.
Root retains sources, focused outputs and receipts through umbrella acceptance,
then removes exact retained evidence after its consumers finish. Disposable
configs/caches/processes must be removed before handoff. Full private v1 remains
active; 14/14 historical Normal completions, 210/210 supplemental sources and
0/210 formal balance acceptance do not change from runner regression tests.
