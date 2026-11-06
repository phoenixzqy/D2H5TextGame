# P15 — Mephisto’s three-stack Poison Cloud

2026-11-05. BUG751 fixed locally; full private v1 remains incomplete.

Native manual/idle Mephisto now selects `monster.mephisto_poison_cloud`, an
explicit authored variant of the ordinary cloud. Only the identity and applied
Poison stacks differ: three instead of one. Existing localized name/description/
icon, direct Poison15–25, CD3s, MP0, all-enemies targeting,5% mitigated-hit DPS
per stack and5000ms duration remain shared. Schema requires exactly three stacks
for this variant and one for the original skills. The copied/frozen monster-dot
resolver installs it; delivery is explicitly spell. Only Mephisto’s archetype and
Durance chapter select it. No combat branch, actor override framework or save
format change. [Decision](../decisions/P15-mephisto-poison-cloud-stacks-v1.md).

## Verification

57 distinct selected cases pass:

- 33 monster-dot resolver/schema cases, including variant aliases, malformed
  potency/duration/stack rejection and unchanged generic cloud constraints.
- 7 engine cases using actual Mephisto/Swamp Dweller sources and seed13 with
  declared synthetic single-skill tanks: all-party targeting, actual periodic
  totals/expiry, misses/immunity, capped refresh/first potency, input isolation
  and plain/recorded/re-record parity. These are not earned balance fixtures.
- 3 native manual/idle/schema cases assert stack/source/potency/apply/expiry and
  preserve AS120’s1540/3080/4620ms repeating cold/lightning/poison cadence and
  exact stats. The recorded action resolves to Poison Cloud/毒云 in real locales.
- 5 existing boss-construction cases; only ActIII’s expected skill ID changes.
- 8 directly related Mephisto status-immunity cases (9 other cases filtered).
- 1 native damage-delivery coverage case (33 other cases filtered).

`red-native.log` retains two genuine stack-count failures and one passing schema
case before the fix. `green-native.log`, `focused-payload.log`,
`final-native.log`, `related-mephisto-immunity.log` and `related-delivery.log`
record the selected passing results. `final-engine.log` records seven passing
engine cases after lint cleanup. No unchanged runtime check was rerun for this
closeout. The boss-construction table ran once; later related checks filtered
to Mephisto. No campaign/sample/per-area retry budget was renewed.

Initial lint found redundant type guards; the cleanup then removed a necessary
guard in a different composite filter. Original `lint.log`/`types-final.log`
retain these failures. The required guard was restored without suppression;
`lint-corrected.log` exits0 and `types-corrected.log` reports strict scoped
601 implementation/data files, zero diagnostics. Other changed TypeScript files
passed initial lint. All check handles are terminal. No compiler setting,
assertion or validation rule was weakened.

## Source review and limitations

Six production files change: skill schema/catalog, ActIII archetype/chapter,
monster-dot resolver and damage-delivery catalog. Structural comparison against
retained baseline verifies every pre-existing skill row exact; the new variant
differs from the shared cloud only in ID/stacks; ActIII references change only
for Mephisto; delivery adds exactly one entry. Existing formatting is preserved.
Only two schema rules and one resolver identity extend the existing pipeline.
Self-review found no material remaining issue; independent/owner acceptance
remains open. CI deletion remains preserved.

This completes the stack payload contract. It does not settle old poison100%
versus the75% damage-resistance cap, earned difficulty, acquisition/economy,
30–50 active-hour pacing, build fairness or wider app acceptance. Historical
14/14Normal completions,210checkpoint sources and formal balance0/210 remain
unchanged. The immediately preceding goal turn was status-only/no progress.

## Custody and cleanup

Exact retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-mephisto-poison-stacks-r1sasw7c`.
Root retains baseline/final source snapshots, hashes/production patch, original
failures, corrected logs and exact inventory through full-v1 acceptance, then
removes this exact directory. No browser/server or task-local cache was started;
all check processes are terminal and no disposable task artifact remains outside
this retained packet. Shared caches remain. Browser works; CI is excluded; no
user question is pending. Full private-v1 work continues in the claimed worktree.
