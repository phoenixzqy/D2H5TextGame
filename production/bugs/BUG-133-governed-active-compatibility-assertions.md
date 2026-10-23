# BUG-133 — Reconcile legacy assertions with the approved active projection

Severity: Medium (validation). Status: Corrected and validated locally.
Owner: qa-engineer / frontend-dev; root is the sole writer.

Reproduction: local2317d54 plus active integration; Node/Vitest UI/jsdom,
readiness tests in en/zh-CN. Browser/viewport are not applicable. Readiness
uses the existing seed7; direct adapter check uses no battle RNG.

1. Run standard `npm test` alone.
2. Observe16 initial combo-value failures in `SkillsScreen.readiness.test.tsx`
   and the direct adapter assertion in `merc-equipment-combat.test.ts`.

Expected: preserve the complete replay-refusal/ownership/recording invariants
while using the approved canonical governed priority ID; represent an unarmed
mercenary with the shared canonical weapon resolver's empty result.

Actual: all16 readiness cases stop before exercising refusal because the old
assertion expects `skills-sorceress-fire-bolt` while the select now correctly
uses `sorceress.fire_bolt`. The adapter case expects undefined rather than the
new shared resolver's `{}`. Later readiness invariants have not yet run, so
the initial failures alone do not establish that they still pass.

Evidence: root-owned
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-runeword-actives-33rokgzu/full-integrated.log`.

Suspected root cause: assertions predating the approved canonicalization and
weapon projection contract. Reduction must retain all refusal/recording and
identity/stat assertions; never remove or skip the cases. Fix source if any
remaining invariant fails. No full-head acceptance follows from this report.

Reduction/correction: learned allocation and initial legacy stored alias stay
unchanged in fixture setup; select/edit expectations use the approved governed
canonical ID. All16 cases now reach and pass every original refusal, ownership,
recording, notification and explicit-replay assertion, with new unchanged
learned-allocation checks. The direct adapter requires exact `{}` and retains
all identity/grid/priority/stat assertions. Combined145/3files pass, independent
follow-up source review CLEAR. Final commit and integrated evidence will be
recorded in `docs/plans/evidence/d10-runeword-actives.md`.

Integrated final gate: corrected root pool, standard `npm test`,407files/
11027pass/2existing opt-in skips,340.55s,exit0. No source/config drift through
that run; see `docs/plans/evidence/d10-runeword-actives.md`. Broader full-v1
acceptance remains open.
