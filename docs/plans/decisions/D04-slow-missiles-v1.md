# D04 — Slow Missiles and finite hostile projectile flight

Provisional author contract, 2026-10-26. Independent design/technical/QA and
earned balance acceptance remain open. No scope reduction or skill credit.

## Player behavior

Slow Missiles slows actual already-launched and subsequent hostile projectiles.
It does not change action/launch cadence, accuracy, dodge, movement or range.
Preserve unlock12, Inner Sight prerequisite, all-enemy active, cap20,10MP minus
0.1/additional rank and3sCD minus0.05/additional rank. Remove inert passive dodge
scaling. JSON owns a provisional6000ms window and33% normal projectile speed;
ranks retain their existing resource/CD improvements. These are author defaults,
not measured balance targets. Ordinary debuff refresh replaces, never stacks.

Automatic-selection refinement,2026-11-02 ([BUG-602](../../../production/bugs/BUG-602-slow-missiles-redundant-automatic-refresh.md)):
skip Slow Missiles while every current living opponent has a private paid window
whose expiry is strictly after the action clock. Recast when any living opponent
is uncovered or expired, including a newly spawned opponent. An allowed cast
still replaces all target windows without stacking. Visible/imported markers
never suppress a paid cast; this adds no projectile-capability filter. The
original refresh rule permitted early refresh; this is an explicit behavioral
refinement, with no change to authored values, flight or save contracts.

## Projectile identity and timing

Explicit JSON flight metadata identifies monster weak-ranged, Blood Raven fire
arrow, fire arrow/bolt/ball, frost bolt, ice shard, lightning bolt, arcane bolt,
poison/plague spit, Bone Spirit and Frozen Orb. Each has provisional500ms normal
flight. Melee, beams, auras, explosions and other immediate damage are unchanged.
Other skills' existing no-projectile contracts are not broadened.

Launch chooses the ordinary original target(s), pays once, starts cooldown and
emits its ordinary action. A private wave-local queue tracks remaining normal
flight work. No HP/status/dodge/crit RNG occurs until impact. Each elapsed interval
consumes work at100% or the strongest active paid Slow Missiles speed; mid-flight
application/refresh/expiry preserves distance already traveled. Next impact uses
the earliest integer simulation millisecond at which work is exhausted. Example:
500ms at33% arrives after1516ms. Existing status expiry boundaries split travel.
No range, coordinates, spatial collision, homing, extra attack or target reroll.

Impact uses current source/defender stats and ordinary damage, hit/crit/resist,
absorption, status, reaction/death/reward code at the impact clock. This explicit
impact-time evaluation does not snapshot offense at launch. A launched projectile
survives source death while combat continues; it cannot revive/heal its source.
Dead/missing original targets discard their impact without hit RNG or retargeting.
Source death does not erase the private finite slow interval for its in-flight
shots. All tiers use the same flight speed. Existing final-death victory, hero
loss,60s/action caps terminate combat and discard outstanding shots; no post-end
settlement. Periodic deaths and paid ambient pulses retain their priority, then
queued impacts in launch order, then actions at a tied clock. Newly launched
shots always have positive travel and cannot land in the launching action.

## Authority, lifecycle and presentation

Only an eligible learned paid exact Slow Missiles effect writes the private slow
intervals and finite visible enemy marker. Bare/forged/imported markers confer
no slowing. Original living hostile targets only; actual paid source death does
not cancel a window. No MP refund, passive dodge, permanent buff, save field,
queued-shot save or cross-wave flight. Fresh/replay runs start empty and remain
deterministic. Live status chips and truthful bilingual duration/speed previews
must explain the impact-time promise; browser proof must observe a real paid
cast and delayed actual damage, save/online/offline continuity.

## Implementation and verification

1. Retain native seed7 RED: arrows impact at1700ms rather than2200ms and paid
   ranks1/20 leave the second impact at3400ms. Launch cadence remains unchanged.
2. Add a pure battle-local flight clock with exact ordinary/slowed timing,
   mid-flight onset/expiry, multiple shots, stable ties, invalid-input and queue
   isolation checks. It is not skill acceptance until consumed by combat.
3. Add closed JSON/schema/types/adapter metadata in increments of<=5 paths;
   then exact finite Slow Missiles definition/paid authority and combat consumer.
4. Native real allocation/equipment ranks1/20; ordinary vs slowed impacts,
   unchanged launches/payment/cooldown; mid-flight start/expiry/death, dead target,
   all tiers, no projectile/melee controls, copied marker refusal, replay/input
   immutability and lifecycle. Test current mitigation/status at impact.
5. Source-backed bilingual Skills UI/public production/offline proof; consolidate
   required broad validation, retain decisive evidence and clean exact artifacts.

Author plan challenge:ready after specifying mid-flight progress, impact-time
stats/RNG, source death, target death, tie/cap/end/wave semantics and unaffected
contracts. This is not independent approval. ADR-012 remains Proposed.
Security check:pass for authorized local first-party gameplay/data/tests; no
credentials, dependencies, networking, CI, agent behavior or save-format change.
Root is sole writer; no delegation or genuine campaign actions authorized here.

Raw RED and continuing evidence are root-owned at
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-support-ssrbktv_.
