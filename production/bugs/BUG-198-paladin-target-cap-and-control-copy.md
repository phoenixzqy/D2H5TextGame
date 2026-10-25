# BUG-198 — Honor Zeal's target limit and describe Paladin control accurately

Severity: Medium — excess area damage and misleading duration/target promises.
Status: Reproduced; repair pending. No new inventory credit.
Owners: engine-dev / content-designer / frontend-dev; root sole writer.

## Reproduction

Base `e4c66fd`, Linux/Node 24.21.0, native `playerToCombatUnit`, actual registered
battle engine, seed 7. Native engine probe; no browser or earned campaign claim.

1. Create a disclosed synthetic L30 Paladin with Zeal rank 1 or 20 selected,
   legal learned active prerequisites, 5000 MP, no gear/aura or mana recovery.
2. Supply nine living zero-defense/resistance/dodge enemies at every 3×3 cell.
   Hold enemies indefinitely and the hero after its first action at 1700 ms.
3. Require one actual paid cast, positive damage, immutable input and exact replay.
4. Count damage targets against both locales' promise of at most three enemies.
5. Repeat the same isolation for Smite, Charge and Fist of Heavens at both ranks.

Expected: Zeal affects no more than three enemies. Smite/Charge remain single
target and Fist remains all-target. Duration copy must use actual simulation
seconds and existing boss rules, respecting the no-movement invariant.

Actual: Zeal hits five enemies at both ranks. All eight cases pass 48 native
selection/payment/damage/immutability/replay controls; the other three skills
publish expected Stun/Paralyze markers and cardinality. Those markers alone are
not causal control proof. Charge's locales promise one turn, but the shared Stun
definition is one second (boss multiplier 0.5), while turn cues span five seconds.

## Root cause and evidence

Zeal authors generic `area-enemies`/`cross` without a maximum target count. The
shared grid resolver correctly finds a five-cell cross; the cast boundary has no
authored limit. Globally shrinking cross would break unrelated area attacks.
Charge uses static turn wording instead of the existing pure control duration.

[Original exact native RED](../../docs/plans/evidence/fixtures/paladin-control-repro-198/raw.tar.gz)
and [byte audit](../../docs/plans/evidence/fixtures/paladin-control-repro-198/packet.json).
The eight-case probe exits 1 in 4.980 s, with exactly two Zeal cardinality failures.
Active task scratch is owned by root and retained until integrated proof and
archival; its exact path/removal condition is in the packet.

Security check: pass — first-party local targeting/data/UI repair, with no
credential, permission, network, dependency, CI or persistent save-field change.
Independent/earned acceptance, the other two Paladin active skills, Baal and
C2–C4/full G0–G7/private v1 remain open.
