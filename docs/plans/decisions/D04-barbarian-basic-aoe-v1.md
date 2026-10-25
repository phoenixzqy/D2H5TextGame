# D04 — Bash, Whirlwind, Leap Attack and War Cry

2026-10-25. Root-authored verification/presentation contract for the four
remaining direct Barbarian attacks. Independent design/QA and earned balance
remain open. This batch advances P10 without reducing the complete v1 objective.

## Existing behavior to preserve

The canonical `docs/design/skills-spec.md` Barbarian attack table and current
JSON define these paid Physical attacks. Preserve all tuning, unlock levels,
prerequisites and rank caps; do not invent extra hits, Attack conversion or
movement/range systems. The JSON values below are the current authored values.

| Skill | Base / growth per additional rank | Targets | MP / cooldown | Unlock |
| --- | --- | --- | --- | --- |
| Bash | 50–70 / +5 | One living hostile | 5 / 1s | 1 |
| Whirlwind | 60–90 / +6 | Every living hostile once | 25 / 2s | 30 |
| Leap Attack | 70–100 / +7 | Every living hostile once | 20 / 3s | 18 |
| War Cry | 30–50 / +3 | Every living hostile once | 30 / 3s | 30 |

Every attempt uses the existing direct Physical hit pipeline: independent
hit/crit rolls, Physical increases, ordinary Defense and Physical resistance,
shared status combos, shields, reflection and death settlement. A single cast
pays once and starts one cooldown, irrespective of target count. Misses still
pay but cause no HP loss or control. Dead/friendly bodies are not targets, and
caster death during resolution prevents further attempts. Bash does not gain
an additional snapshot Attack coefficient absent from the authored contract.

Leap Attack and War Cry apply the existing on-hit Stun:1s ordinary/0.5s boss,
inclusive start/exclusive expiry. Their actual scheduled enemy actions must be
interrupted; markers alone are insufficient proof. Whirlwind's existing Chill
and Burn interactions use the shared Physical combo matrix, including ordinary
boss scaling. No alternate skill-specific multiplier is introduced.

## Native configuration and presentation

Only legal native class/unlock/transitive prerequisite/capped rank configuration
can schedule these player skills. Allocation/priority edits leave the current
recording immutable and affect the next wave without HP/MP refills. Save22
roundtrips learned ranks and priorities, not transient combat status or pools.

Both locales must state the actual base damage, one attempt per selected target,
one payment/cooldown and on-hit ordinary/boss Stun lifetime where applicable.
Current/next/MAX views agree with computed JSON metadata. Replace positional
phrasing with truthful combat actions under the project's no-movement invariant.

## Validation and author review

The pre-edit external probe observed48legal native cases (four skills ×ranks
1/2/20 ×seeds7/19/41/97), with expected target counts and one payment each.
That probe is preliminary, not functional inventory or earned balance credit.
Add focused regression cases for actual HP/MP, misses/crit/mitigation,
dead/friendly targets, caster death, exact control expiry/interruption, native
allocation/wave authority and save roundtrip. Add bilingual current/next/MAX UI
checks before presentation edits, then production mobile/desktop public cast,
Save/Continue/offline and layout checks. Validate the frozen completed batch
with full unit/typecheck/lint/build checks and retain failures honestly.

Security check: pass for local verification and presentation changes; no
credentials, dependencies, persisted schema, network export or external action.
Plan review: ready. Runtime contract comes from existing authored data/spec;
any newly observed mechanic failure requires a reproduced bug before a repair.
Root remains sole writer/reviewer; independent and earned acceptance stay open.
