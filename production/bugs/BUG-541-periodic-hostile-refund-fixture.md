# BUG-541 — Align periodic summon-refund fixture with ownership

Severity: Low. Status: corrected; affected checks pass. Owner: root (QA).
Environment: Node24.21/Vitest, periodic-timing.test.ts living-owner case.
Expected: a living player owner receives one15MP refund when its summon dies
independently to periodic damage. Hostile minions never refill hostile owners.
Actual: the test constructs both owner and child on the enemy side, then expects15.
Evidence: p15-periodic-phase-affected-v1.log, expected15/actual0. The untouched
before-image combat.ts already explicitly requires dead.side==='player' and
owner.side==='player' in settleDeathEffects. Fractional phase changes do not
participate in this test. This is a stale fixture, not a phase-fix regression.
Correction: retain a hostile no-refund control with zero refund events; add the
intended player-owned positive case with exactly one death and one15MP refund.
No runtime rule or assertion about the player-owned refund is weakened.

Resolution: retained hostile negative control and added the player-owned positive
control. The positive fixture isolates the summon death from the separate5MP enemy
kill orb. Final periodic timing file40/40 and affected periodic set324/324 pass.
Runtime ownership/refund rules are unchanged; intermediate fixture failures remain
retained and are not described as engine regressions.
