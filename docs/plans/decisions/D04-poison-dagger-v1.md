# D04 — Poison Dagger damaging Poison

2026-10-26. Provisional root-author implementation contract for BUG256, under
the existing full-v1 authorization. No independent GD/TD/QA approval, earned
balance, player-feel or final skill credit is claimed. Root remains sole writer.

## Problem and existing authority

[BUG256](../../../production/bugs/BUG-256-apply-poison-dagger-periodic-damage.md)
reproduces actual paid rank1/20 casts with no periodic damage. The JSON supplies
a Poison marker without damage potency. The ordinary data adapter and periodic
integrator already support authored potency; the fix belongs in source data.
[D06 Poison Explosion](D06-poison-explosion-v1.md) explicitly leaves Dagger's own
missing potency open. Its shared active-refresh rules remain controlling.

Preserve Dagger's authored unlock6, no prerequisite, ranks1–20, single-enemy
active target,5MP,1s cooldown and direct Poison damage25–40,+5 per additional
rank. This game has no range/move-speed mechanics; retain ordinary prioritized
target selection and current equipment/skill ownership rules. Do not invent a
dagger-equipment restriction, physical damage component, corpse cost or summon.

## Proposed numeric and timing contract

Add `statusEffect.dotPctOfDamage: 0.05` to the existing Dagger row. This is a
new provisional tuning choice, consistent with the existing Poison Explosion
and Poison Nova coefficient; it is not a recovered historical Dagger authority
or a claim about original Diablo II balance. The author chose it to complete the
advertised damaging status through the existing JSON-driven mechanism.

Each successful non-dodged hit applies one Poison stack. A fresh stack's rate is
`max(1, floor(finalDirectHitDamage * 0.05))` HP/second; duration5s, maximum10stacks
come from the shared Poison defaults. Rank1 base25–40 gives1–2HP/s; rank20
base120–135 gives6HP/s under unmodified noncritical controls. Final-hit damage
already includes ordinary rank, critical, combo and mitigation; do not mitigate
or critically roll the periodic rate again.

Apply at the actual paid hit boundary. Integrate only active overlap through
`[appliedAtMs, expiresAtMs)`, with existing fractional carry and no free initial
tick. With seed1 and the BUG256 one-cast400ms controls, rank1 deals25direct plus
5periodic HP, ending470of500HP; rank20 deals120direct plus30periodic HP, ending350.
These are isolated causal oracles, not earned DPS/TTK evidence.

An active valid first Poison rate/source remains authoritative when later hits
add stacks and extend aggregate expiry. A potency-free marker adopts the first
positive incoming payload prospectively, preserving previously accrued damage
and clocks. Cap and death spread keep the existing shared implementation.
Future/expired records follow the existing fresh-application rule. No new
per-stack provenance system or special Dagger branch is needed.

## Resources, lifecycle and presentation

Selection/commitment, paid mana, minimum1s cooldown, native learned-class
ownership, dodge and fallback remain the ordinary existing damage path.4MP
cannot buy the cast or status. Failed authority/unlearned/malformed ranks grant
no Dagger priority. Current native recordings remain frozen when allocating a
point; fresh waves use current legal ranks and carried resources. Persist only
ordinary learned/priority/player state; import clears transient battle potency.
No save format/version/migration change.

Reuse the existing generic periodic current-next/MAX display, deriving damage,
rate percentage,5s/max10 and5MP/1s from actual data/defaults. Bilingual Dagger
copy should describe one prioritized target, paid hit, damaging Poison and
refresh behavior without promising an unmitigated final DPS or a weapon gate.
Keep the 44px allocation control and all five required geometries, keyboard
operation and actual public save/offline continuation evidence.

## Delivery, review and validation

Security check: pass. Scope is first-party local content/tests/copy; no new
dependencies, credentials, network endpoints, save trust, CI or permissions.
Root-cause review: author the omitted payload at the source; retain the existing
adapter/status/integrator. Plan review: ready for bounded increments after the
Amplify frozen-input full run and final audit close; no approval is inferred.

1. At most five source paths: JSON payload, narrowly scoped schema requirement
   and native causal/schema/preview regression cases. Preserve the original RED
   evidence; prove literal rank1/20 direct-plus-periodic HP, payment, exact expiry,
   reapplication/cap/first-rate, dodge/refusal, deterministic equality and immutable
   input. Check PE prerequisite compatibility and ordinary Nova/Poison behavior.
2. Separate presentation increment: bilingual description, existing Skills
   interpolation when needed and current-next/MAX UI regressions. Avoid engine
   or store changes unless a new reproduced failure requires them.
3. Native wave/import and public en/zh desktop/mobile allocation/actual cast/
   positive periodic HP/status/save/offline continuation, then full units,
   types/lint, official build/bridge/precache and exact source/evidence audits.
   `validate:data` is absent from current package scripts; use the actual Ajv
   skill validator/data tests rather than claim that nonexistent command passed.
4. Final author review is explicitly distinct from independent acceptance.
   Retain raw failures/results and clean only exact task-owned disposable paths
   after consumers finish. A bounded inventory credit requires complete local
   acceptance; earned builds/balance and full-v1 gates remain open.

This contract does not close broader Poison/Plague design, other skills, genuine
Baal, all-class builds, campaign pacing/economy/endgame or full private-v1.
