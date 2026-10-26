# BUG-256 — Apply Poison Dagger periodic damage

Status: reproduced; production fix pending.
Severity: High — the advertised damaging Poison application has no periodic effect.
Date: 2026-10-26. Root author only; no independent approval.

## Reproduction

- Commit: `82f0669834794aeb49c81e4fee5820f1e639bd33`.
- Environment: native production player projection and deterministic combat,
  Vitest/jsdom on Linux; browser, viewport and locale are not applicable to this
  numerical reproduction. No browser acceptance is claimed.
- RNG seed: `1`.
1. Create a Necromancer through `createMockPlayer`, with actual learned
   `skills-necromancer-poison-dagger` rank1 or20 in combo priority; call the real
   `playerToCombatUnit` adapter and load the default skill registry.
2. Isolate a single scheduled cast at400ms using constructed500HP pools, zero
   resistance/dodge/critical,263 attack speed, a caster hold starting401ms and
   a held living enemy. Give exactly5MP and disable regeneration. These are
   explicitly unearned numerical controls, not an earned build or balance run.
3. Run recorded combat, then repeat and compare the plain production result.
   Assert actual cast/payment/hit/status, immutable input and positive periodic
   poison damage. Separately check4MP and wrong-class/unlearned/malformed ranks.

## Expected and actual

Expected: a successful paid Poison Dagger hit applies damaging Poison, causing
positive subsequent periodic HP loss during its active interval. This report
does not invent a previously accepted coefficient or claim an exact tuning value.

Actual: both ranks pay5MP at400ms, produce the real skill action and Poison
status, and hit for25/rank1 or120/rank20. Neither causes any periodic event or
periodic HP loss; the target finishes at475/380HP. The positive-periodic assertion
fails twice; insufficient-resource and malformed/native ownership controls pass.
Repeated recorded/plain result equality and input immutability pass before the
failing assertion. Four cases total:2failed/2passed in9.378s including command
overhead. No required repository test was committed failing.

## Evidence and cause

Required active evidence owned by root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-poison-dagger-ujbpvvn4`.
The exact reproduction is `native-red.test.ts` with `repro.workspace.ts`;
`native-red-result.json` contains the literal native events and command receipt.
Original `native-red.log` SHA256:
`f9e026b00fa8662ae73f1b6e26637150f146f8f058b2e55edd2d74d1d4ac390b`.
Eight unchanged source copies and hashes are retained in `before-source/` and
`before-source-manifest.json`. Root retains this evidence through BUG256 and
full-v1 consumers, then owns lossless retention/read-back and exact cleanup.

`src/data/skills/necromancer.json` authors the Poison marker but supplies no
`statusEffect.dotPctOfDamage`. The ordinary adapter in
`src/engine/skills/dataCatalog.ts` propagates that field only when authored;
`src/engine/combat/combat.ts` therefore receives no `dotPerStack` payload.
The existing shared periodic integrator has no positive rate to settle.
[D06 Poison Explosion](../../docs/plans/decisions/D06-poison-explosion-v1.md)
already records this independent Dagger gap and leaves its own potency open.

Affected systems: skill content/schema, generic damage adapter, skill previews,
bilingual player copy and native/public acceptance. Root owns this slice under
the session's no-delegation constraint. No known workaround restores Dagger's
own missing damage; another Poison skill is a separate mechanic.

Next: record a provisional root-author coefficient/refresh/display contract,
then make the smallest JSON/schema/test correction after the current Amplify
full-input audit closes. Preserve the original failures. No skill credit,
campaign action, independent acceptance or full-v1 completion follows here.
