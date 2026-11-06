# BUG-757 — Enforce Baal’s authored status protection

Status: Fixed locally; not committed or independently accepted. Severity: High
(missing final-boss mechanic). Date:2026-11-05.
Owner:root, solo. Build:b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited changes.
Systems:monster data/schema, shared status engine, ambient aura, projectile binding,
Mana Burn and retaliation feedback. Environment:WSL/Node deterministic combat;
locale/viewport independent. Seed13. Diagnostic pools are synthetic, not balance.

## Reproduction

1. Build native level82 chapter Baal with buildMonsterUnit.
2. Apply Poison/other debuffs or spread Poison from a dead body.
3. Record diagnostic combat with mercenary Holy Freeze, learned Slow Missiles,
   an arcane Mana Burn carrier or a paid Frozen Armor defender.

Expected:monster-spec§8 rejects all statuses except Stun, whose duration is halved.
Actual:Baal has no authored protection; statuses/spread succeed, ambient Chill
slows cadence/grants combos, private missile speed slows, Mana Burn drains and
retaliation logs Chill. Six focused cases fail; three Stun-duration cases pass.
Evidence:/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-baal-status-99e6yyxj/red.log.
Regression:src/engine/combat/baal-status-immunity.test.ts.
Workaround:none for the authored boss challenge.

## Mechanics decision

Use the explicit Baal boss rule in§8 over the contradictory§10 summary’s
"All status75% (reduced)". Reconcile that table and record
docs/plans/decisions/P15-baal-status-protection-v1.md. Extend the existing closed
statusImmunities enum with all-except-stun rather than enumerate every current
debuff or add another metadata field. Existing factory copy/freeze and transient
lifetime suffice. Share canonical eligibility with ambient/private paths.
Damage resistance is independent; direct damage remains eligible. Keep boss
stats/rewards/waves, Stun’s current half-duration and ordinary bodies unchanged.

## Local verification

Six failing cases now pass, with existing three Stun-duration controls. All90
selected cases pass across seven affected files, including native manual/idle
chapter construction/playback, Holy Freeze, Mana Burn, Slow Missiles and merc
Frozen Armor. Final stronger direct-Arcane assertions pass all11new cases.
Initial strict/lint checks exposed test-only optional-property/narrowing errors;
native susceptible archetypes replace undefined metadata and flatMap narrows
events. Final strict scoped602files/zero diagnostics and changed-file lint pass.
Strict Ajv validates11ActV archetypes and rejects malformed policy/unknown keys;
source comparison preserves every existing field except the added Baal policy.
No UI/layout change or new browser diagnostic; previous browser evidence is not
claimed as acceptance of this fix. Exact packet retained by root through full-v1
acceptance; all check handles terminal, no task process or disposable remains.
