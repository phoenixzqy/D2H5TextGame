# Intended Zeal owned-weapon comparison — 2026-11-03

The sole candidate is rejected. Native owned Razor Stitch improves the retained
Izual result, but still draws at the 60-second limit. No profile/gameplay change
is adopted, no route clears, and no attempt or training allowance is renewed.

## Evidence

Required packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `p15-zeal-physical-weapon-v2`, including result, frozen plan, preflight,
scoped type/lint receipts and closure. Root retains it through umbrella review
and owns eventual cleanup. Original earned save remains level49/next714;
[Act IV checkpoint](2026-11-03-zeal-act4-checkpoint.md).

The original ordinal713 wave5 control exactly reproduces all events and terminal
teams. One candidate retrieves/equips original eligible polearm `it-4hncc-dot`
through native APIs on the complete native save, including shield displacement.
Custody/economy/party and all non-gear dynamic battle state are conserved.
Native gear differences affect stats, both mana-regeneration fields and weapon
metadata; HP/MP are clamped to the changed maxima. No extra item, level, point,
seed, rank, aura, enemy, cooldown or combat ordering is supplied.

| Observation | Control | Owned polearm |
| --- | ---: | ---: |
| Hero Attack / speed | 212 / 183 | 377 / 193 |
| Terminal Izual HP | 10,118 | 2,415 |
| Terminal hero HP / MP | 935 / 523 | 935 / 489 |
| Outcome / combat time | draw / 60s | draw / 60s |

Exactly two battles were run. The native physical offense estimate improves
258.554 to498.263 (92.711%), before enemy mitigation; this is not a DPS guarantee.
V1 setup failed its overrestrictive field whitelist before any battle when
Energy removal legitimately changed `manaRegenBaselinePerSecond`; V2 prospectively
permits both native regen fields without changing the candidate/input. V1 failure
and its zero-battle closure are retained. No outcome-driven candidate change.

## Static contract inspection

[P15 Zeal growth](../plans/decisions/P15-zeal-rank-attack-growth-v1.md) and current
JSON/registration/combat agree: rank20 adds380% snapshot Attack to ranked flat
damage, with ordinary Defense, physical resistance, crit and native Might. The
existing literal Attack-sensitivity regression covers ranks1/2/20. This review
does not rerun it or establish a production damage defect.

The [cadence contract](../plans/decisions/D04-combat-timing-v1.md) uses
`clamp(2500 - floor(speed)*8, 400, 2000)`. Speed193 gives956ms; Zeal still has its
one-second cooldown. The retained candidate starts Zeal at956ms, Sacrifice at
1912ms, then Zeal at2868ms: cooldown expiry is checked at each scheduled action.
The candidate records36Zeal/14Sacrifice actions, versus46Zeal in the original.
These observations follow the discrete action/cooldown contract; they do not
justify bypassing cooldowns or changing the scheduler. No further gear/order
candidate is authorized on this closed snapshot.

## Verification and next action

Scoped types/lint, native preflight and comparison pass. All2,151production and
131campaign manifest inputs authenticate against current files and are unchanged.
Owned processes are terminal; exact transient config/cache are absent, while the
config archive remains. BUG646 remains Open with its proposed remedy rejected.
Continue another required intended-build progression/implementation task; full
private v1 and population/fairness/pacing/endgame acceptance remain incomplete.
Formal balance acceptance stays0/210.
