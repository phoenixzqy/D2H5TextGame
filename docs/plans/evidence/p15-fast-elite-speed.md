# P15 — Fast elite attack speed

Locally implemented and verified on 2026-11-05; uncommitted. BUG773 fixed the
missing authored +50% attack-speed stat. Fast now carries multiplier1.5 through
native wave construction into the monster factory. Absent metadata preserves1;
invalid values/overflow fail before RNG. Charge, other stats, identities, planner,
source inputs and RNG remain unchanged. No UI, save or dependency change.

## Verification

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-elite-fast-qe1q81mq`.
Root retains this exact packet through full-v1 acceptance, then removes it after
all consumers finish. Source preimages, logs, JSON reports and driver retained.

- Two causal REDs show authored Fast leaves Fallen speed95 and action times
  1740/3480/5220ms. GREEN gives142.5 and1364/2728/4092ms through the real scheduler.
  The existing scheduler floors speed; +50% stat is not +50% actions per second.
- Seven native-store,12factory and17strict actual-schema cases cover metadata
  authority, defaults/fractions, invalid/overflow rejection, input/RNG preservation
  and actual manual/idle Den/Rocky Waste plans with constructed single-affix config.
- Nine affected files initially yield100pass/one failure out of101. BUG774 records
  the stale retired-stub import in the registry-preservation case. Only that case
  changes to assert all current native authored/canonical skills, projectile
  metadata, source immutability and literal ordinary Lightning40–60/Paralyze.
  Selected rerun passes one case;30filtered cases already passed previously.
  Combined evidence proves101distinct passing cases, not a single101-pass run.
- Scoped strict TypeScript imports930files with zero diagnostics; seven changed
  TS/test files pass ESLint. No whole-project suite or campaign rerun.
- Four Chromium147.0.7727.15 constructed runtime cases (zh-CN/en,360×640/1280×800)
  verify actual schema, affix label, native stats, skill order, scheduler and four
  manual/idle area plans each. All pass, zero errors/warnings/failed requests.

## Review and limits

Self-review: five production files carry one optional authored field through its
existing consumer; registry correction is test-only. New tests assert observable
native behavior and strict schema. No test skipping/weakening or special-case
ID/label/Charge inference introduced. Initial stale failure stays retained.
No independent review or earned/balance/pacing acceptance is claimed.
Historical14/14Normal completions,210checkpoint sources and formal0/210 unchanged.
Spent campaign/screening/sample/retry budgets stay closed. Full privatev1 remains
unfinished: progression/acquisition/economy/pacing, difficulty/endgame and
integrated mobile/PWA/accessibility/performance/soak acceptance remain open.

Driver handle40556 terminal exit0; server PID320851absent and port5173unbound.
Exact owned `vite-cache` removed and absence verified in browser-cleanup-receipt.
Reports/preimages/drivers are required evidence, not disposable caches. No active
task process, disposable directory or cleanup failure remains. CI excluded;
browser works; owner playtest follows implementation; no pending user question.
