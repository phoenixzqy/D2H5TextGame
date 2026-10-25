# D04 — Sorceress direct lightning attacks

2026-10-25. Root sole implementation/review; independent design/QA and earned
balance remain open. Thunder Storm's periodic strikes remain separate work.

| Skill | Lightning base / growth per additional rank | MP / cooldown | Recipients |
| --- | --- | --- | --- |
| Charged Bolt | 25–40 / +3 | 8 / 1s | Existing first two prioritized living hostiles, one bolt attempt each |
| Lightning | 45–80 / +6 | 15 / 1s | One hostile |
| Nova | 40–60 / +4 | 18 / 2s | All living hostiles |
| Chain Lightning | 50–70 / +5 | 25 / 2s | Up to five distinct living hostiles in actual bounce order; Paralyze |

Preserve existing production damage/growth/cost/CD/unlock/prerequisite/cap20,
native class/rank/alias authority, Lightning Mastery and Chill1.3synergy.
No save22 change; genuine Ancients401 remains exact.

The example design table says Cone and Hits5targets, while both player locales
explicitly promise bounces between up to5enemies. BUG231 proves line-3 cannot
deliver that promise. This author adaptation resolves the example Cone label
in favor of an actual bounded chain, without range or movement stats: start
at the first prioritized living enemy, then repeatedly choose the unvisited
enemy with the smallest Manhattan grid distance from the last selected enemy.
Distance ties preserve existing target-priority order. Missing positions use
that same priority as fallback; duplicate IDs are never revisited. Separated
and overflow positions remain reachable. Select the original pool before any
hit, and continue the chain after a miss or lethal hit. No replacement hits,
additional damage, hop delay or damage falloff are introduced. Exactly one
ordinary hit/critical/status decision occurs per selected enemy, paying once.

JSON uses area-enemies/chain/maxTargets5. Extend the shared pure AOE resolver
with optional target cap, applying existing Zeal/Double Swing caps at the same
point after geometric selection. Chain selection stops at the cap. Keep the
other shapes/defaults/order unchanged and retain strict per-identity schema
restrictions: maxTargets3 only for existing cross skills,5 only for this chain.
The production adapter already propagates target caps. Align the illustrative
legacy chain with production geometry/cap and its existing default fresh-hit
Paralyze application, rather than its stale20% metadata.

Chain's fresh landed hit applies existing1s Paralyze and5s residual marker.
During that marker, subsequent application uses the existing50% acceptance;
ordinary misses apply no status. Boss duration is the same1s under current
Paralyze configuration. Preserve actual action interruption, expiry and
reapplication rules. Charged Bolt/Lightning/Nova have no authored Paralyze.

Verification must prove actual recipients/order/damage/HP/MP, cap and no
revisits at ranks1/2/20 and fixed seeds; empty/singleton/sparse/overflow/tie/
missing-position boundaries; miss/lethal/cooldown/resource/native authority;
Lightning resistance/MR/critical/mastery/Chill synergy and real Paralyze
interruption/expiry/reapplication. Preserve exact seeded replay, immutable
inputs, runBattle/playback parity, allocation/current-wave isolation,
next-wave no-refill and real import. Show truthful bilingual current/next/MAX
previews; use public en/zh mobile/desktop casts and ordinary/offline Continue.
Run final quiet full after other task processes stop, retain actual failures
and terminal receipts, credit only proved skills and clean task-owned output.

Security check: pass. Local first-party seeded targeting/data/UI/tests only;
no dependencies, credentials, permissions, CI, remote or genuine-save actions.
Plan review: ready after including actual five-target bounce order, unchanged
cross cap semantics, no repeat/refill/replacement and Paralyze's real DR window.
This contract does not grant independent/earned acceptance or complete v1.

The causal matrix additionally reproduces BUG232: rejected repeat Paralyze
still emits successful-affliction feedback. Add a pure explicit status result
containing unit/applied while preserving the existing unit-returning API. Damage
and debuff emission must use actual acceptance; rejected applications still
preserve damage/payment and any separately updated status state. Keep identical
seeded acceptance, durations and residual markers. This fixes missing outcome
information at its origin, without a log-renderer exception.

The interruption fixture casts at400ms, before the enemy's first900ms action.
Lightning's control acts at900ms; Chain's target is interrupted at900ms and
acts at1800ms, with Paralyze expiring exactly1400ms and its marker at5400ms.
This applies to trash, boss and chapter-boss. The original tied1700ms fixture
failed because the seeded enemy acted before the cast and changed its hit RNG;
retain that diagnostic failure rather than altering the scheduler or tuning.
The corrected fixture's first attempted period was miscalculated as1000ms;
retain that assertion failure too. The shared debuff emitter also has five
independent seeded acceptance/state/payment/replay controls.

The first broad engine run found nine compatibility assertions: seven expected
internal calls through the former unit-only API, and two expected the old
three-target Chain on a four-enemy item-grant fixture. Poison Mastery now checks
the actual two-stack status snapshot with unchanged rate/source/expiry; Lightning
Mastery retains exact call input, clocks, marker, RNG and identity assertions
through the explicit result and checks acceptance. Item-granted Chain expects
all four distinct available enemies; its rank/payment/cooldown/status/replay
checks remain. The complete legacy neutral Thunder Storm recording is unchanged.
