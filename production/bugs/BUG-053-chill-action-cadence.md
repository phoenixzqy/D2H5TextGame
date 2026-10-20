# BUG-053 — Apply active Chill to action cadence

Status: fixed; causal regression and independent source review pass.
Severity: High — the advertised attack-speed debuff has no scheduling effect.
Owner: engine-dev; GD/TD timing contract approved, independent QA reviewing.

## Reproduction

Commit84a0388 (definition prerequisite only), Node/Linux Vitest engine project;
browser/viewport/locale not applicable to this pure deterministic engine repro.
Seed1, actual default Sorceress Ice Bolt or Frost Nova, rank1, hero AS150 and
20mana, target AS100 and100000HP; test-only future hero hold1301 isolates one
native cast. No production skill replacement or seed search.

1. Run the frozen `src/engine/combat/chill-timing.test.ts` against the unchanged
   scheduler with `npx vitest run --project engine src/engine/combat/chill-timing.test.ts`.
2. Observe actual native cold cast and Chill application at1300ms; secondary
   Frost Nova Freeze fails naturally for seed1.
3. Compare the same surviving target's first action with the independent D04
   phase-preservation oracle.

Expected: active Chill multiplies base AS by authored0.5; existing period1700
becomes2000. At onset1300 preserve400/1700remaining progress: first action
`1300+400*2000/1700=30100/17`, then expiry3300 restores next action3700.
Actual: target acts at1700,3400,5100 as though no Chill existed. Both actual
authored-skill cases reach their status assertions and fail on1700 versus
1770.5882352941176. Initial/legacy/player/merc/summon/future/expiry probes also
expose raw-speed scheduling. Twenty of23 frozen cases fail, three controls
pass; one failure separately exposes startup action0 inclusion in the test and
is not attributed to the runtime defect. Original failure remains preserved.

## Evidence and source

[Durable evidence](../../docs/plans/evidence/p06e-chill-cadence.md)
retains `focused-b-red-report.json`, command/process metadata, frozen test
SHAa11ac2c5ac90efb1cb763b3b2a4f1661760f7cbc5ae09a59de9ce0b646e470df
and `combat-before.ts`. Run2.455s/exit1, no timeout, signals or survivors.
The indexed archive also retains the independently approved startup-fixture
correction and corrected causal RED:20 failures/3 controls,2.597s.

Root cause: all three scheduler installation paths use raw
`unit.stats.attackSpeed`; active Chill status has a lifecycle but never changes
scheduled periods or remaining action progress. The fix belongs at scheduling,
preserving immutable base stats, existing duration authority and RNG streams.
No workaround provides the promised stat effect. Different builds are not a
fix. This repro establishes no cause for the separate P02b05c native draw.

## Resolution

All scheduling paths use the validated authored multiplier and atomic prior
period/due-time records. Reconciliation preserves remaining action progress at
status boundaries and action effects, then reselects the next actor. No base
stat, save shape or RNG stream changes. All23 timing cases pass, including
actual authored casts, refresh/expiry/future timing, clamps/fractions,
Freeze/ties, crosswave carry, summons and complete no-Chill control equality.
Producer, QA and GD/TD approve the runtime; final amended full suite3314/163,
typecheck, lint and unchanged80%engine coverage pass. Build/cleanup evidence is
tracked with the scoped implementation, not inferred from test success.
