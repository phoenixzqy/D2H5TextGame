# BUG-072 — Preserve carried cooldowns at battle initialization

- **Status:** Fixed in `c80a7bb`; reproduced and documented before correction in task-owned evidence.
- **Severity:** Medium — an unrelated slotted skill can cast early after wave carry; removing that slot avoids the early cast.
- **Owner / affected systems:** engine-dev; battle initialization and carried wave skill cooldowns. Producer provisionally triaged Medium.
- **Build:** f630d2643aa7801f8224a40e2d4fb0dc5ce75a5e plus the reviewed five-path D06 v1c switch in progress.
- **Environment:** Linux, deterministic Vitest engine project, no browser/viewport/locale involved; seed7.

## Reproduction

1. Use each canonical rank6 Skeleton/Mage/Revive preparation with a living target and hero attack period400ms.
2. Supply input cooldowns90000ms for both that preparation and the slotted fixture.unrelated damage skill.
3. Run the battle through the hero first ordinary action.

## Expected

Preparation casts once at time0, replacing only its own old cooldown. At400ms, unrelated remaining duration is89600ms, so the hero basic-attacks. Input snapshot remains immutable.

## Actual

At400ms fixture.unrelated casts: cooldownExpiresAt was initialized empty, and refreshCooldowns erased its carried input duration. Canonical regression fails for all3skills.

## Evidence

Task-owned canonical-green-attempt.log records184pass/4fail;3 stale-CD failures plus the separately expected historical native pool mismatch. canonical-engine.log independently reproduces3 failures/3094 cases. Source at combat.ts initial unit loop sets every cooldownExpiresAt to new Map(). D06 v1b lines85–89 and v1c rule4 explicitly preserve unrelated cooldowns.

## Root cause and resolution

Initialize expiry maps from positive finite numeric input durations, already milliseconds at battle time0, preserving skill keys and snapshot immutability. Do this for both sides/all initial units. Keep scoped startup overwrite, existing alias lookup and legacy refund clearing. GD/TD approved this shared correction as enforcing existing contract. Add ordinary non-preparation exact-expiry, authored-alias and invalid-duration controls before applying it. Do not weaken the3 original failing assertions.


## Resolution and regression evidence

`c80a7bb` initializes expiry maps from positive finite carried durations for every
initial unit on both sides, preserving exact skill keys/milliseconds and snapshots.
The existing preparation overwrite and ordinary alias/refund paths remain intact.
`src/engine/combat/summon-preparation-corpses.test.ts` retains the three original
90-second unrelated-cooldown regressions plus ordinary canonical/authored Fire
Bolt exact-expiry controls and five invalid/expired-duration cases. They were RED
before the correction. Correct carried cooldowns also exposed a stale Meditation
fixture: separately reviewed `d541db8` changes only its synthetic cooldown100→1,
preserving all assertions and production behavior.

Final combined gates: focused212, engine3101, full5981/209, typecheck, lint and
production build pass serially. QA, GD/TD and producer approve bounded runtime.
Engine3s/full15s targets remain missed; bundle/precache warnings and all broader
performance/full-game acceptance remain open. Raw logs/freezes/independent replay
arithmetic remain owned by root under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-necromancer-preparation-edsqysz8`
until reviewed durable retention and exact cleanup.
