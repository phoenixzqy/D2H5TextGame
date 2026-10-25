# D04 — Sacrifice's explicit life tradeoff

Local repair contract for reproduced BUG197. Root is the sole writer/reviewer;
independent design/QA and earned balance remain open. Other Paladin actives and
complete private v1 remain in scope. No skill credit before integrated proof.

## Behavior

Preserve Sacrifice's actual Physical 40–60 base, +4/rank, zero MP, 1 s cooldown,
unlock1/cap20, single target, native ownership, current damage/RNG and targeting.
Its bilingual promise says it damages the caster, but supplies no numeric rule.
Use provisional JSON tuning: `onHitSelfDamage.lifeFraction: 0.08` and
`minimumLifeLoss: 1`. This is an explicit local default, not canonical D2 or
accepted earned balance. Both values remain authored and strictly validated.

A selected, paid ordinary Sacrifice hit that removes positive actual enemy HP
costs the living caster `max(minimumLifeLoss, floor(actualHpRemoved * lifeFraction))`
life, capped at the caster's remaining life. Absorption and overkill do not enter
the enemy-HP basis. A miss, zero actual HP loss, later basic attack, periodic
loss, fallback, aura pulse or ineligible/unselected skill pays no self damage.
No new RNG, extra action, MP payment or reflected self-hit chain is introduced.

Settle the ordinary target hit, target death/orbs and incoming reflection first.
If the caster survives, debit the life cost exactly once. It bypasses the
caster's dodge, armor, resistance and personal shields, does not spend MP,
and can kill the caster. A caster already killed by reflection pays no second
cost and cannot revive. The final hero death follows existing sticky defeat,
orphan cleanup and qualified reward rules, including an otherwise final kill.
Do not change those rules to force victory. Orb healing may precede the cost;
that is observable and must be documented/tested.

Publish an ordinary positive self-target Physical damage event with no crit/dodge
or absorption flags so actual HP playback/logs agree with final engine state.
Self damage must not recursively invoke enemy-hit payloads, reflection or
healing. Do not persist temporary tuning on Player or add a save migration.

## Implementation and proof

1. Preserve the original two-case native RED (12 passing controls, four behavior
   failures) and its exact scripts/logs. BUG197 is filed before source changes.
2. Add strict JSON schema/type metadata for this exact active single-target
   Physical identity. Require both finite positive tuning fields; reject foreign
   ownership, missing opt-in, malformed values and contradictory recovery,
   composition, hit sequences, statuses or bypass. Add schema and actual native/
   engine RED tests before implementing the metadata or consumer.
3. Copy the metadata into the registered damage effect. Extend the existing
   actual-HP-removed post-hit boundary with a direct life debit and existing
   death closure. Preserve every unrelated effect/RNG path and resource carry.
4. Assert rank1/2/20, aliases/class/unlock/selection, zero MP, cooldown fallback,
   mitigation/miss/overkill/shields, self shields/MP, lethal/nonlethal reflection,
   direct/periodic/basic exclusion, no recursion, exact-once death/orphan/corpse/
   orb behavior, immutable deterministic replay and compatibility controls.
5. Pure current/next/unlearned/MAX stats and both locales explain actual damage,
   percentage/floor, life-cost bypass, settlement order and lethal cost. Production
   en/zh × desktop/mobile public allocation/selection/combat and exact five-domain
   Save-close-new-page-Continue, five-size geometry and visuals precede credit.
   Synthetic fixtures do not prove earned progression/balance.
6. Final engine/full/types/lint/explicit-false build/bridge/precache, frozen source/
   build/Git/genuine maps and actual committed-source audit. Archive original
   failures and required diagnostics, remove exact owned scratch after consumers
   finish, update only Sacrifice's inventory row. `validate:data` is absent;
   existing strict schema/data test commands provide the real validation.

## Author plan and security review

Security check: pass. First-party local combat/data/UI repair; no credential,
permission, network, dependency, CI, persistent data shape or agent behavior change.
Schema and native class/rank authority remain controlling.

Plan review: ready after specifying positive-HP basis, an authored minimum,
original settlement ordering, lethal cost/hero defeat, exact-once orphan cleanup,
self-shield bypass and real playback. A static MP/life cost or event-only marker
would not implement the promised hit tradeoff. This is author self-review, not
independent design approval. No genuine campaign or remote action is authorized.
