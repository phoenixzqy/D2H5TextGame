# BUG-212 — Psychic Hammer Knockback has no observed combat effect

- Status: locally repaired and verified at `884b0839`; independent/earned acceptance open.
- Severity: High — the advertised control component has no observed consumer.
- Environment: Node24.21.0, actual JSON/default registry/native L30 Assassin;
  ranks1/2/20 × seeds7/19/41/97; synthetic resources and isolated first actions.
- Build: `178e69c0` plus the pending Cloak repair; Hammer data/adapter unchanged.
- Browser/viewport/locale: engine probe; browser and localized presentation
  acceptance are not established. Both locales advertise psychic knockback.
- Owner: root; independent design/QA and earned balance remain open.
- Affected systems: class-active adapter, on-hit statuses, combat control, copy.

## Reproduction

1. Compose the actual learned Psychic Hammer through `playerToCombatUnit`.
   Select only Hammer; provide100MP and an enemy with2000HP.
2. Let the hero act at1700ms, then isolate it with a synthetic hold starting1701.
   Let the enemy's first action occur at2000ms; hold it from2001 onward.
3. Record each rank/seed case, immutable input and exact repeated recording.
4. Compare the same snapshot with only Hammer's registered on-hit Knockback
   removed. Keep native damage, resource, timing and targeting unchanged.

Expected: the paid control promise has a defined observable combat consequence.
The design prohibits movement/range stats, so a concrete adaptation must be
authored before implementing a timing replacement. This report does not assume
an interruption duration, spatial displacement, or a particular repair.

Actual: all twelve casts pay6MP once and attempt the native Arcane hit. Nine
landed cases emit Knockback; three misses emit none. Actual and control enemy
action clocks are `[2000]` in all twelve cases. Grid positions remain absent in
both snapshots. No timing or spatial consequence is observed in any landed pair.

The probe retains all observations before intentionally failing its final
assertion requiring some control consequence. Source search found no Knockback
consumer under `src/engine/combat`. Missing grid positions limit the spatial
claim: this fixture proves no movement in this path, not every possible layout.

Evidence: [native reproduction](../../docs/plans/evidence/d04-psychic-hammer-repro.md).
No Hammer source patch, inventory credit, genuine campaign or remote action.

## Subsequent local repair

The [author contract](../../docs/plans/decisions/D04-psychic-hammer-v1.md)
explicitly replaces inert Knockback with shared on-hit Stun,1s ordinary/0.5s
boss, without moving targets or changing Arcane damage/payment. This is a new
author adaptation, not historical tuning or independent balance approval.

Commit `884b0839` includes37schema/adapter/causal/native/UI cases. Landed
actual/control pairs interrupt the first enemy action2000→4000ms; misses keep
timing, bosses expire at2200ms and ordinary targets2700ms. Engine7753/287,
full14965/675/two existing skips, types/lint/build and production4/4 pass.
[Delivery evidence](../../docs/plans/evidence/d04-psychic-hammer.md).
Only bounded skill functionality is credited; independent/earned acceptance,
campaign/Baal, C2–C4/fullG0–G7 and complete privatev1 remain open.
