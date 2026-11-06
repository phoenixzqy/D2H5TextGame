# BUG-677 — Playback refund fixture uses a hostile owner

- **Status:** Fixed locally; baseline reproduces all three original failures; corrected friendly/hostile controls pass.
- **Severity:** Low; regression fixture contradicts player-only death-refund policy.
- **Owner:** Root / combat playback tests.
- **Environment:** WSL, Vitest UI, deterministic seed7.

## Reproduction

Run `npx vitest run src/stores/combatPlayback.test.ts`.
The two positive death-refund cases and the full-cap carry-reset case create an
`enemy` owner and child, then expect the player-only legacy refund behavior.

**Expected:** Friendly synthetic legacy summon fixtures verify absolute MP/carry
transport; separate hostile controls prove no free mana/cooldown refund.
**Actual:** Three cases expect refunds that current combat deliberately excludes
for hostile replacements. Initial cadence work revealed these existing failures.
One additional observed failure was new nonhero cadence inserted before summon;
restricting cadence to heroes preserves summon adjacency without changing combat.

## Evidence

`src/stores/combatPlayback.test.ts` refund helper;
`src/engine/combat/combat.ts` player-only death refund guard.
Original/affected/baseline outputs retained in the p17-attack-cadence-v1 packet.
No production refund, reward, RNG, skill or campaign behavior change is intended.

## Local resolution

See [attack-cadence evidence](../../docs/plans/evidence/p17-attack-cadence.md)
for source behavior, original failures, final219affected/4browser passes,
local review and verified task cleanup. No umbrella completion claim.
