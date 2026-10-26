# D04 — Necromancer direct bone and poison spells

2026-10-26. Provisional author contract; root sole writer/reviewer. Independent
design/QA, earned builds, balance and private-v1 acceptance remain open.

## Overview

Verify Teeth, Bone Spear, Bone Spirit and Poison Nova through authored registration,
native authority, actual recorded combat and truthful bilingual presentation.
Existing schema/registration assertions alone do not credit these four skills.

## Player fantasy

Bone attacks provide focused or bounded-area Arcane pressure; Poison Nova builds
poison on the living enemy group. Resource and allocation choices remain visible.
Seeking/piercing flavor does not promise extra targets or unavoidable hits.

## Detailed rules

| Spell | Typed base / growth per additional rank | MP / cooldown | Recipients / payload |
| --- | --- | --- | --- |
| Teeth | Arcane20–35 / +4 | 7 / 1s | First two prioritized living hostiles, one attempt each |
| Bone Spear | Arcane60–90 / +7 | 20 / 1s | One living hostile, one attempt |
| Bone Spirit | Arcane110–160 / +12 | 30 / 2s | One living hostile, one attempt |
| Poison Nova | Poison20–30 / +4 | 25 / 3s | All living hostiles, one attempt each; two Poison stacks on a hit |

Preserve JSON unlocks1/18/30/30, prerequisites, cap20 and native MAX-alias authority.
No authored damage/cost/CD, engine mechanic or save22 change is planned. Arcane
resistance then flat magic resist mitigate bone attacks; ordinary Defense does
not, so Bone Spear already satisfies its armor promise without another bypass.
Poison resistance then Defense mitigate Nova. All retain ordinary seeded dodge,
critical, personal/mastery/combo and death rules. Each cast pays/starts CD once.

Nova's explicit rate is5% of the final mitigated direct hit per stack per second,
rounded down with minimum1. Two stacks are applied together, maximum10; duration5s.
Reapplication adds two up to cap and refreshes expiry; an active damaging status
keeps its original source/type/rate. Expired status starts afresh. Misses pay but
apply no Poison. There is no second mitigation of its periodic damage.

## Formulas

For rank r in1–20, base endpoints are min+growth*(r-1), max+growth*(r-1).
Nova per-stack DPS=max(1,floor(finalHit*0.05)); fresh two-stack full-duration
loss=2*DPS*5seconds when the target survives. Outcome depends on real mitigation,
mastery, dodge/critical and existing poison, so the preview shows a rule, not a
promised final DPS. Preserve all old one-stack periodic display object shapes.
Expose a multi-stack count only for an integral positive count within that
status's real cap; Bleed2 remains invalid because shared Bleed cap is1.

## Edge cases

Ranks0/1/2/19/20, illegal/foreign/underlevel/nonfinite ranks, missing transitive
prerequisites, insufficient mana, active CD, misses, mitigation floor, separated/
overflow targets, exact Poison expiry, refresh/cap and original rate, deaths,
input purity, deterministic replay, native next-wave/current-recording isolation,
ordinary/offline Continue and unchanged allocations. Missing/invalid preview
metadata must not invent damaging status behavior.

## Dependencies

Existing JSON -> shared adapter -> native owned active selection -> ordinary
scheduler/damage/status -> staged native playback -> pure display -> i18n UI.
No new package, global RNG, save schema, external publication or genuine campaign.

## Tuning knobs

Existing JSON base/growth, MP, CD, unlocks and prerequisites remain unchanged.
Shared Poison5s/10stack and authored0.05/2stack defaults remain provisional for
feel/pacing. Local functional evidence does not establish earned build viability.

## Acceptance criteria

Retain actual causal observations at ranks1/2/20 and seeds7/19/41/97, negative
native authority/resource cases, independent typed mitigation, exact poison
stacks/rate/expiry and deterministic inputs/replay. Reproduce the omitted Nova
periodic preview before repair. Verify unlearned/current/next/MAX bilingual
payment/damage/recipient/mitigation and status descriptions. Then validate native
wave/import boundaries and public en/zh desktop/mobile save/offline flows;
run focused/engine/full/types/lint/build/precache checks on exact frozen bytes.
Only proven complete local skill contracts receive inventory credit. Independent
review, earned campaign/build balance and full-v1 gates stay open.

## Author reviews

DESIGN-REVIEW: CONCERNS

All eight required sections are present; existing tuning and invariants remain.
Independent experiential/numerical acceptance is unavailable and remains open.
Plan review: ready after checking actual Arcane mitigation, Nova stack metadata,
legacy one-stack shape and real native/bilingual/browser boundaries. Root's
review is author review, without an independent signoff claim.
Security check:pass; first-party local tests/display only. Preserve native grants,
allocations/genuine save, dependencies, permissions, CI and external state.
