# D04 — Conversion effective combat allegiance

2026-10-25. Repair contract for BUG200. Root is sole writer/author reviewer;
independent design/QA and earned balance remain open. One bounded local
mechanic credit follows final verification at2a37023d/f93a4e23.

## Behavior and tuning

Preserve authored unlock24/cap20, Sacrifice→Zeal→Vengeance prerequisites,
Physical60–85/+5 per rank,25MP and3second cooldown. Author a provisional8second
conversion duration and eligible tiers trash/rare-minion in the Conversion JSON.
These are explicit new v1 tuning, replacing an accidental unknown-status1second
fallback; no rank duration scaling or canonical D2 balance claim. A paid landed
hit that removes positive HP from a surviving eligible original enemy monster
converts it with certainty; misses, fully absorbed hits, kills, elite/champion/
rare-elite/boss/chapter-boss hits do not convert. Immune tiers still receive the
ordinary damage. No extra resistance roll, movement, equipment gate or refill.

Only a living original player hero with native legal Paladin rank can cast;
exact aliases combine by MAX through the existing full prerequisite validator.
Contradictory registry identity/effects/costs cannot pay or create allegiance.
A bare/snapshot status is not authority. Fresh battle-local bindings can be
created only by the real paid hit. They expire at cast time+8000ms, inclusive
at onset/exclusive at expiry, or on source/target death or loss of eligibility.
Different targets may coexist; a currently converted ally is not a hostile
candidate, so it cannot be refreshed until it becomes hostile again.

Effective allegiance governs ordinary attacks, every registered damage/debuff/
healing skill, readiness, hostile aura effects/pulses/slow, reflection and hostile
hit recovery. Converted monsters keep their real schedules, skills, cooldowns,
resources, stats and ordinary target policy for their effective side. With no
hostile candidate they wait; they do not attack the hero or manufacture victory.
Player party-only beneficial auras retain their existing original-party scope.
Existing DoTs/control remain and settle normally; Conversion never heals or
cleanses. Pending attacks choose fresh targets at execution; action phase changes
only when an actual aura slow changes.

Live original enemy summons (existing or newly spawned) recursively follow their
living owner’s effective allegiance. Their original side/owner stay unchanged;
expiry restores their original side immediately; owner death retains the existing
orphan death closure and cannot leave an allied descendant alive. Resolve owner
cycles safely. Converted monsters remain enemy identity for original-side
victory, corpses, orb drops, rewards and final result teams. Conversion alone
cannot clear the last enemy, transfer kill credit twice or persist across waves.
Source hero death remains sticky enemy victory.

## Implementation and outcome proof

1. Preserve BUG200 native rank1/20 RED; authored contract precedes runtime edits.
2. Extend strict skill schema/types with narrow JSON tuning; copy immutable
   definition, exact paid-skill guard and native rank through existing authority.
3. Add a single effective allegiance boundary separate from original-side
   `aliveOf`/death/victory. Wave-local authenticated bindings plus live checks;
   apply it to combat targeting/support/hostile effects and summon ancestry.
4. Test actual rank1/20 native monster→former-ally HP loss, payment, no hero
   damage; real registered area/debuff/heal/summon behavior, expiry and source
   death, immunity/miss/kill/forged markers, last enemy, no duplicate deaths,
   input immutability/replay and unchanged non-Conversion controls.
5. Bilingual descriptions/current-next previews explain damage,8seconds,
   eligible tiers and expiry. Production en/zh desktop/mobile and exact
   Save-close-new-page-Continue; synthetic fixtures disclosed.
6. Required engine/full/typecheck/lint/production build and appropriate browser
   verification before mechanic credit. Preserve original failures, clean only
   exact task-owned artifacts and leave earned campaign state untouched.

## Author reviews

Security check: pass. First-party local combat/data/UI repair; no credentials,
external calls, dependencies, permissions, CI or persistence expansion. Keep
untrusted snapshot markers powerless and original reward ownership immutable.

Plan review: ready after including registered monster skills/support, recursive
summon ownership, hostile aura scope and original hostility captured before the
converting hit changes allegiance (for that hit’s retaliation/settlement).
Directly swapping `.side` or disabling monster skills would violate the contract.
This is author self-review, not independent acceptance. Full privatev1 remains
unfinished; local work only, no genuine campaign actions or remote operations.
