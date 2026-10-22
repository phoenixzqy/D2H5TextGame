# BUG-076 — Allow a damaging status to promote an active marker

Status: fix validated; local commit pending. The following execution-ledger
entry records the exact prerequisite commit for closure.

Severity: High — an active potency-free marker blocks the later damaging-status
path, including Poison Explosion after its Poison Dagger prerequisite. Waiting
for expiry avoids the marker, but cannot make the intended combined path work.

## Reproduction

- Baseline: `01d03aa` (`docs: define Poison Explosion and DoT refresh contract`).
- Environment: Linux, Node24.21.0/Vitest1.6.1 engine project, no browser or viewport; locale
  N/A (pure TypeScript engine). Seed: `7`.
- Run: `node_modules/.bin/vitest run --project engine src/engine/combat/status.test.ts src/engine/combat/periodic-timing.test.ts`.

1. Give a living enemy two Poison stacks with no `dotPerStack`, start0 and
   expiry3000ms; keep it alive and unable to act.
2. At1700ms, land the seeded ordinary20 poison hit with0.05 status coefficient.
3. Observe subsequent periodic events. A separate live case kills a2HP enemy
   carrying two1HP/s Poison stacks at1000ms beside a living Poison marker.

## Expected and actual

The [accepted contract](../../docs/plans/decisions/D06-poison-explosion-v1.md)
requires the first valid incoming finite-positive rate/source to promote an
active marker, retaining stacks, original start, normal expiry and accrued
fractions. In the hit case the new three-stack rate is3HP/s: periodic events
are2000:1,3400:4,5100:6,6700:4;20 direct plus15 periodic leaves965HP.
The death-spread case must deal27 recipient DoT, first2HP at1700ms.

Actual baseline behavior preserves the absent rate and old source while
incrementing stacks/expiry. Both live cases produce no recipient DoT. RED:
19 failed /76 passed across two files;17 payload failures and two live periodic
failures. Valid-rate retention and unrelated controls already pass.

## Evidence and ownership

Raw command, timing, exact source captures and receipt:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-dot-refresh-_63lf3av/red.log`
and `red.receipt.json` in that directory. Root retains this evidence until the
umbrella implementation consumers finish, then removes it.

Affected system/owner: engine-dev, shared `applyStatus` refresh in
`src/engine/combat/status.ts`; qa-engineer owns regression assessment. The
existing active branch copies the previous payload unconditionally. Correct
that shared boundary without a skill-ID branch or periodic-accumulator reset.
Malformed fresh status input and already-corrupted integral recovery remain
outside this fix. PE itself is not implemented by this prerequisite.

Regression paths: `src/engine/combat/status.test.ts` and
`src/engine/combat/periodic-timing.test.ts`.

## Resolution and validation

The shared active-refresh branch now adopts finite-positive incoming potency,
source and supplied type only when prior potency is invalid. Existing valid
payload, first matching alias, stacks/caps, clocks, expiry, optional type and
unrelated metadata retain the accepted behavior. No scheduler or accumulator
change, new event, RNG draw or PE-specific conditional was needed.

Final focused95/95, engine3659/91files, full7902/254files, typecheck, lint/purity
and production build/four-chunk bridge scan pass. Status coverage98.94% lines,
94.48% branches. The live15DoT/965HP and27DoT/973HP cases also use recursively
frozen inputs and A/A/B/A plus plain/recorded equality without counter resets.
Initial strict test-typing failures are retained in `types.log`; corrected
event narrowing/absent optional expiry weakened no behavioral assertion.
Independent QA ADEQUATE and GD/TD/code APPROVE cover the final sources.
Engine/full timing budgets, existing bundle/precache warnings, broader fresh
input validation and PE implementation remain outside this bug's resolution.
