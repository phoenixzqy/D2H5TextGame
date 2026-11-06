# BUG-417 — Stygian Doll explosion is an active fire stub

Status: fixed locally; bounded native checks complete, campaign balance pending.
Severity: High. Owners: engine-dev/content-designer; QA/game-designer.
Environment: HEADb5a0898 + private-v1 local work; Node24.21.0, native engine.

Reproduce: factory Stygian Doll, default registry, passive living opponent.
Its generic WeakMelee suppresses signature opportunities; the registered
Corpse Explosion is active CD3/fire40–60 and does nothing on death. No explicit
ordinary Attack/growth pair exists.
Expected: ordinary melee while alive and one hostile primary-death mixed
physical/fire explosion, including the last enemy's lethal retaliation.
Actual: ordinary role, authored damage split and death trigger are absent.

Root fix/acceptance: P15-stygian-doll-death-v1. Keep player Corpse Explosion,
shared rewards/corpses and authentic Conversion authority intact. Nested burst
deaths must not run refunds/orbs/spread before remaining original bursts.
Provisional numeric authoring is separate from earned campaign acceptance.

Outcome: native on-death mixed damage, authentic eligibility, dead-source
pipeline authority and nested FIFO recovery/corpse settlement implemented.
Affected996case aggregate reconciled after two stale-test repairs; final46native/
resolver cases and strict types/scoped lint PASS. Fixed300fights/arm shows40new
native-W6 losses, a material combined threat increase; not balance acceptance.
Initial fixture/type/test-oracle corrections and provenance limits are explicit
in [evidence](../../docs/plans/evidence/p15-stygian-doll-death.md).
