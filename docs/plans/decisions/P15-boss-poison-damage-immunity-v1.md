# P15 — Explicit boss poison damage immunity

2026-11-05. Existing named encounter contract correction, BUG759.

monster-spec§10 explicitly grants Andariel/Mephisto Poison100% immunity and
reserves full elemental immunities for authored bosses/select champions.
The named exception takes precedence over combat-formulas§8.1's generic75%
resistance cap. Resolve the conflict with an independent damageImmunities array,
not a higher numeric resistance cap. Author poison for these two bosses only.
Status immunity remains independent; BUG750's Poison/Plague rejection stays.
This resolves the damage question left open by the earlier status-only decision.

Closed schema accepts unique canonical DamageType values. The native factory
copies/freezes this transient metadata. Shared post-roll mitigation returns zero
for the matching type before resistance/minimum-one arithmetic; hit/base/crit
RNG and miss decisions are preserved. Penetration/curses cannot break literal
immunity. Each typed component resolves separately, so physical/other damage
continues. Numeric resistance100 without metadata still caps at75; nonimmune
damage retains the existing minimum1. No monster-ID engine branch.

Periodic settlement, lethal prediction, recovery attribution and legacy tick
accounting share an immunity-aware rate. Prefer a status's explicit damageType;
legacy poison/plague, burn/ignite and Bleed use their canonical element when
untyped. Unknown untyped records retain their existing behavior. Damage immunity
does not itself reject a control/status or change its expiry.

Acceptance: failing direct/RNG/component/factory/periodic reproductions; native
manual/idle bosses using real Poison Nova/Plague Javelin; nonimmune controls,
other-type hits, schema rejection, input immutability and actual playback HP.
Update earlier native tests whose positive poison-damage oracle is superseded.
Only affected regressions, scoped strict types/lint/schema. No presentation
change or new browser diagnostic; no earned/balance acceptance or spent retry
renewal. Root retains the exact evidence packet through full-v1 acceptance.

Plan review: ready; shared mitigation and all periodic consumers are covered,
including zero-damage floors, legacy records and source attribution. Security
check: pass; local data/engine/tests only, no credentials/network/dependencies/
CI/permissions or persisted-format changes. Full-v1 authorization applies.
