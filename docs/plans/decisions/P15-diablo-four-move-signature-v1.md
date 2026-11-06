# P15 — Restore Diablo’s four-move signature

Date: 2026-11-05. Type: Tweak. Owner: root, solo local implementation.
Reference: monster-spec §7; existing Bone Prison decision and status engine.

## Problem and rules

The chapter override selects Inferno alone, discarding the authored four moves.
The design requires “Fire Breath: Cone 5 targets, applies Burn (3 stacks)” and
“Lightning Hose: Cone 5 targets, applies Paralyze.” Restore both using explicit
Diablo variants, followed by existing Bone Prison and Charge in that order in
both archetype and chapter data. Burn uses the canonical Ignite status.

| Variant | Damage | Geometry | Status | Cooldown |
|---|---|---|---|---|
| monster.diablo_fire_breath | Fire 40–60 | cone-3, at most 5 | Ignite, 3 stacks, .1 mitigated-hit DPS per stack, 3000ms | 5s |
| monster.diablo_lightning | Lightning 40–60 | cone-3, at most 5 | Paralyze, 1 stack, 1000ms | 4s |

Both are rank-one zero-Mana native spells, with ordinary hit/dodge/mitigation.
Existing shared Fire Breath/Lightning remain unchanged. Preserve existing
Bone Prison Arcane10–20/CD4/2000ms private action/dodge trap and Charge
Physical60–90 plus100%Attack/CD4. No boss-ID execution branch or save change.
Use existing localized spell names/icons, not new player-facing strings.

At native AS140, period=2500−140×8=1380ms. With CDs5/4/4/4 the actual first
moves must occur at1380/2760/4140/5520ms and repeat at6900/8280/9660/11040ms.
Shared CDs3/2 would let earlier moves starve the later ones. Keep authored
chapter44800Life/420Attack/460Defense/AS140, level/tier and loot source.

## Acceptance and scope

Verify real manual/idle chapter construction and action execution; cone targeting
and cap; landed status potency/expiry; misses and unrelated supported immunities; real trap and Charge;
validated immutable copied resolver output and aliases/delivery; deterministic
recorded/plain/re-record parity; bilingual action log names. Use selected tests
and strict scoped types/lint only. No campaign, pacing, economy or balance credit.
Enrage at15%HP and stun resistance remain separate unresolved design contracts.
The old “2 turns” prison interpretation is retained as the existing2000ms rule;
this slice does not invent a different duration. GDD §7 will reference variants.

Plan review: ready. Security check: pass (local pure code/data; no actionable risk).
Standing user implementation authorization covers this bounded restoration;
no routine design approval or new delegation is requested.

Fixture correction: native status immunities support only Freeze/Poison/Plague.
Tests prove those unrelated immunities preserve all Diablo hit/status/DoT events;
they do not invent supported Ignite/Paralyze immunity or assert its acceptance.
