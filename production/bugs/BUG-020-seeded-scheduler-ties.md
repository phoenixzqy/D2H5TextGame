# BUG-020 — Seed production scheduler ties

Severity: Medium (deterministic but permanently insertion-biased tied actions).
Owner: engine developer / technical director. Card: P06c04.
Status: corrected and independently approved, 2026-10-20.
Prepatch HEAD: `8117744e414935056e35ff962dfe0fe1c00a3840`.
Environment: Node 24.21.0 / Vitest 1.6.1, pure Node engine project;
browser/viewport and locale not applicable. Seeds 1–32, explicit control seed 7.

## Reproduction before runtime changes

1. Run `npm run test:engine -- src/engine/combat/deadline.test.ts --no-cache --reporter=dot`.
2. Observe identical-AS durable hero/enemy across seeds 1–32: the only first
   actor is the hero, instead of both actors across the fixed seed set.
3. Give both units the same registered guaranteed freeze debuff. At seed 7,
   D04v1e priorities are hero .6984279857 and enemy .9727973754; enemy should
   cast at 1700ms and suppress the hero's tied action. Actual first cast is hero,
   suppressing the enemy instead. The fixture uses real scheduler, skill/status
   resolution and action events, without hit rolls or combat mocks.

Initial focused command: 2 failed / 6 passed, 1.24 seconds. The untied seed7
1300ms lethal battle's complete recording was captured as an inline prepatch
oracle and passes. This report and D04v1e precede the runtime patch.

Expanded prepatch focused suite: 5 failed / 10 passed in 1.46 seconds, adding
repeated ties, coincident unequal periods and a genuine startup summon selected
ahead of earlier registrants. The summon fixture initially assumed rank-one
per-rank scaling changed speed; corrected it to the actual skeleton AS70 and
matching 1940ms participants before recording this final expanded RED evidence.

Expected: earliest scheduled time remains authoritative; exact ties use the
approved isolated fixed battle-local seeded priorities. Actual: ties ignore seed
and always prefer earlier registration, including every player before enemies.

Root cause: `pickNextActor` compares only `nextActionAt` then `insertionIdx`.
The seed-based `calculateTurnOrder` helper is not used by the production runner
and its speed-first sort does not implement the timeline contract.

## Approved boundary

One dedicated `scheduler-ties` RNG fork and one priority at first registration
per unit ID; no main-combat RNG consumption or per-query/boundary reroll. Rank
all exact timestamp ties, including unequal speeds, with insertion fallback for
exact rank collisions. Preserve insertion order for targeting, periodic phases,
startup summons and final teams. No cadence, cooldown/summon policy, status,
balance, API/save or content changes. Root and producer approved exactly five
files; report out-of-scope old-order test mismatches before adapting assertions.

Security check: pass. Battle-local deterministic PRNG state only; no IO,
credentials, permissions, cryptographic usage, persistence or policy bypass.

## Final validation and review

Implemented one isolated tie RNG fork, a battle-local priority map and first-ID
registration draw; exact scheduled timestamp remains the primary comparator.
Other insertion-order consumers remain untouched. Existing owned deadline cases
now assert seed7 enemy-first order, seed3 hero-first victory and seed7 enemy-first
victory, retaining exact timestamps/counts and stopping the remaining tied actor.
No out-of-scope regression fixture required changes.

Producer review requested a stronger untied stochastic oracle. After all other
source consumers finished, preserved the exact task-owned runtime temporarily
outside the repository and restored only combat.ts from original prepatch HEAD.
Captured seed7 actual untied AS150/AS100 battle: hero crit200 at1300ms, enemy
miss at1700ms, hero hit100 and victory2600ms. The original source passed the
frozen complete-recording oracle. Deliberately consuming main RNG for registration
priorities made that same oracle fail: initial hero miss, enemy hit50, different
later critical hits/orb, victory3900ms. Restored the exact isolated-fork runtime
byte-for-byte; the frozen oracle passes. No mutated source or postpatch-generated
replacement oracle remains.

- Final focused deadline/tie suite: 17 passed, 1.18 seconds. Real freeze/action,
  spawned identity/rank, repeated and unequal-speed ties, collision fallback,
  inert-boundary/RNG and both deadline victory directions are covered.
- `npm run test:engine -- --no-cache --reporter=dot --silent`: 42 files /
  497 passed, 7.83 seconds.
- `npm test -- --no-cache --reporter=dot --silent`: 106 files / 1159 passed /
  one existing skip, 30.60 seconds. Existing periodic death/effect ordering,
  targeting, boss, summon, replay and cross-wave regressions pass unchanged.
- `npm run typecheck`, `npm run lint`, `npm run build`: pass. Initial test-only
  union-narrowing errors were corrected with explicit discriminant guards;
  final focused/engine/full-unit/coverage runs include those guards.
- Changed combat.ts V8 coverage: 95.57% statements/lines, 84.16% branches,
  100% functions; 17 related files / 228 tests passed. Configured threshold
  passes without reducing coverage requirements.
- Engine/full-unit runs exceed documented 3/15-second budgets. Passing functional
  gates do not establish performance-budget acceptance. Build retains existing
  Browserslist-age, large-chunk and PWA precache-size advisories.
- Root and producer independently reviewed final source/tests/D04: APPROVE.
  Producer's stochastic-oracle validation finding is resolved; reviewers assessed
  source and evidence independently without claiming to rerun these task gates.

Task-owned `dist` and `coverage` were removed after all consumers finished;
verified no `node_modules/.vite` or `/tmp/d2h5-p06c04-combat-patched.ts` remains.
Pre-existing dependencies/shared caches preserved. No browser or campaign-balance
acceptance is claimed.
