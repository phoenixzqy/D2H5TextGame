# Native mercenary Jab QA

QA-PLAN: APPROVE — reviewed readiness, 2026-10-28. Native primary 2, focused
237/11 files, engine 11,198/418 files, scoped lint and project types pass on the final corrected source;
historical full-unit validation was stopped for the BUG-371 boundary breach;
safe full lint/build checks pass. Reviewed structural boundary repair now permits
ordinary unit verification: guard 14/14, source audit 989 tests / 1,571 modules,
focused 280 tests / 13 files pass with all 36 diagnostic tests byte-identical.
Ordinary units pass 21,037 tests / 989 files with zero skips, alongside full lint/
engine purity and production build on the reviewed predecessor map. Two reviewed
helper-only corrections then pass publication/classifier 43 tests / two files
and explicit scoped lint on the successor map; final project types also pass.
Separate final review and commit bindings govern the local source checkpoint.
The two maps and retained failures are distinguished in the evidence.
QA execution and feature acceptance are incomplete.
[Evidence](../../../docs/plans/evidence/merc-jab.md).

Contract: [D04 mercenary Jab](../../../docs/plans/decisions/D04-merc-jab-v1.md).
Base: `8b279e6d55b69b4597493fb872190d85d9c4ed7a`; root owns implementation.

| Criterion | Cases | Verification |
| --- | --- | --- |
| Real mercenaries execute the advertised combo | TC1: seed 7 real pool/factory/projection/default-registry Holy Freeze first-action three outcomes and Attack 100/200 numeric arrays; preserve Chill ×1.1. TC2: all six authored Act II configurations cast native Jab. | Native Vitest integration; original input immutable and repeated events/results identical. |
| Damage and failure behavior are correct | TC3: independent literal flat20/Attack100 → 180, plus30% increase → 216, zero Attack → 30. TC4: independent miss/crit attempts, mitigation/minimum one, zero MP and rank1/20 unchanged potency. TC5: inside/exact cooldown opportunities, one sequence payment. TC6: original-target retention, target death and caster reflection death stop later attempts. TC7: closed schema rejects malformed/duplicate/missing/wrong-ID/type/target/mode metadata; resolver deeply copies/freezes valid tuning. | Engine/schema Vitest; no production damage helper computes expected numbers. |
| Integration remains truthful | TC8: consume actual native recording through public playback and compare observable terminal units/results; native run equality and no input mutation. TC9: absent/zero bonus on basics, merc arrows and player Amazon Jab; same Attack/Might source configuration cannot leak the Jab bonus or alter saved stats. TC10: both locale descriptions state three hits, Attack and the damage bonus. | Native integration/locale assertions plus complete engine/full/types/lint/build checks. |

Browser at 360×640, 412×915 and 1280×800; keyboard/screen-reader/contrast;
both-locale layout; actual recruitment/field/equip/save/reload; earned balance
and campaign acceptance require later browser/manual verification. These remain
open under terminal `H3_PREREQUISITE_FAILED_NO_APP`; native tests do not replace
them. No browser launch/retry, acquisition or lineage experiment is authorized
by this checkpoint. There is no save-format or persisted-state change.

Use real seeded engine randomness except narrow deterministic damage-pipeline
fixtures that hold hit/base/crit decisions explicitly. Do not use wall-clock
assertions, timers, `Math.random`, conditional skips or weakened thresholds.
The legacy `maxRounds` property does not bound the native simulation. Preserve
failed reproductions/diagnoses, original primary lineage and all native receipts.
BUG-180/366 timeout recurrence stops source continuation; passing suites do not
prove a timeout cause/fix or performance improvement.
