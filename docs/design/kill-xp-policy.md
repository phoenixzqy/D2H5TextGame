# D02 — Combat-qualified kill XP policy v1

Status: selected for local implementation and bounded screening; population,
economy and active-hour acceptance remain open. Date:2026-11-03. Owner:root.
Supersedes only the linear kill-reward baseline in progression-curve §2.2.

## Overview

Keep the native level-cost curve and existing Normal completion references
14/32/47/61/82. Increase the growth of later monster rewards to match the
level-cost exponent, instead of requiring progressively more kills per level.
This is one shared production reward curve, not a harness-only XP multiplier.
Native quest/clear entry conditions and evaluation preparation targets do not
change. References are planning targets, not new player-level entry gates.

## Player fantasy

Later, harder areas should advance a developed build at a useful pace. This
serves Challenge and Competence while preserving early skill discovery. The
correction changes no skill identity, combat rule, item stat or reward eligibility.

## Detailed rules and formulas

Author the five scalar values in `src/data/progression/kill-xp.json`; validate
them on load with the registered draft2020-12 schema. For resolved monster level
`m`, coefficient `b=10`, minimum `q=5`, anchor `a=18`, exponent `e=1.5`:

```text
baseKillXP(m) = max(q, round(b*m * max(1, (m/a)^e)))
winningWaveXP = sum(floor(baseKillXP(m) * activeIdleMultiplier))
xpRequired(L) = floor(100*L^2.5)                    [unchanged]
```

Levels1–18 retain their exact prior rewards. Above18, reward grows as m^2.5,
so equal-level kills per level approach `10*18^1.5`, about764. The existing
Normal references pair with cumulative active-hour centers5/12/22/30/40;
actual earned levels/times and menu overhead must still be measured. Preserve
the two-level safer-source margin, original caps, earned eligibility, costs and
three route attempts. Ranked source fallback remains a separately declared
evaluation policy. This document does not start a campaign or renew any budget.

## Edge cases and compatibility

Nonfinite or below-one monster levels retain the existing minimum-reward
fallback. Fractional positive inputs retain the API's continuous formula and
rounding behavior; native monster levels are integers. Do not clamp legitimate
Nightmare/Hell monster levels to the hero's90 cap. Resolved enemy level already
incorporates difficulty; add no second difficulty/tier/item multiplier or new
overlevel penalty. Only a settled victorious wave rewards slain nonsummons;
defeat/draw and duplicate settlement grant no XP. Idle bonus is floored per
enemy after integer base reward, and the existing fielded-merc share applies
to the resulting wave XP. No save version, earned XP or existing export changes;
new rewards apply only to future native settlements. Historical captures and
exhausted controllers remain immutable, including1434/original1235.

## Dependencies

`xpForKill` consumes validated immutable data and remains the shared reward
function. `combatHelpers` supplies resolved levels, qualified slain units and
the bonus; player/merc stores retain exact-once settlement and level-up logic.
The legacy ticker also imports this function; its separate combat-qualification
acceptance remains P11 work. Browser schema precompilation includes the new
registry member automatically; no runtime dependency or install is added.

## Tuning knobs and selection evidence

Coefficient/minimum are early feel knobs; anchor/exponent are curve knobs.
Chapter references and existing preparation caps are gate knobs. Schema bounds
keep coefficients positive, anchor1–90, exponent0–2 and minimum positive.
The selected values are an initial tune, not permanent balance certification.

Retained `d02-reward-candidate-screen-v1.py/.json` reconciles all200 original
River training admissions to final native slain teams and actual XP. At fixed
recorded Durance kill throughput, with hypothetical enemies two levels below
hero, anchors16/18/20/24 give ActIII/IV/V combat-hour models:

| Anchor | III:32→47 | IV:47→61 | V:61→82 | Original gap counterfactual crossing |
| ---: | ---: | ---: | ---: | ---: |
| 16 | 6.670 | 5.995 | 8.780 | entry96 |
| **18** | **7.957** | **7.153** | **10.477** | **entry114** |
| 20 | 9.321 | 8.377 | 12.270 | entry170 |
| 24 | 12.254 | 11.012 | 16.130 | none within200 |

Select18: leaves room for route/decision costs against the8/10h later-act
increments while reducing the excessive repeated-kill requirement.16 compresses
late advancement more;20 leaves less later-act overhead;24 retains an infeasible
fixed-history gap. Leaving linear rewards fails even a generous200-entry upper
bound. Lowering hero targets would change skill depth and gear access without
fixing the underlying growth mismatch. A flat multiplier would also accelerate
introductory play. Counterfactual crossings are arithmetic, **not earned XP**.
The chapter model assumes identical future kill throughput, ignores changed
combat/gear/source availability, and cannot prove pacing or build fairness.

## Acceptance criteria

Before another campaign screen: focused red/green exact reward cases at anchor,
late Normal and above-cap enemy levels; unchanged exact costs/inverse cap;
schema rejection of missing/unknown/invalid knobs; native high-level victory,
per-enemy bonus flooring, merc sharing, duplicate settlement and nonwin denial;
scoped strict types/lint. Existing campaign receipts keep their source authority.
Freeze a new authority and prospectively feasible source/count policy before
any new native continuation. Never grant the arithmetic XP to a save.

Before full acceptance: all14 earned populations/holdouts, acquisition and
recruitment affordability, chapter medians/fairness, manual/idle parity and
30–50 active-hour pacing including calibrated decisions. Faster XP means fewer
loot/currency opportunities per level; economy qualification is a material risk.

## Local preimplementation review

Plan review: ready for this production reward correction and focused evidence.
Security check: pass; authorized local JSON/TS/docs/evidence only, no install,
credentials, network, CI, publication or historical player-save mutation.
Design review: CONCERNS, no implementation blocker. All eight required sections
are present; numerical targets are paired and no scope/pillar identity shifts.
The repository lacks `docs/design/pillars.md`; inherited playable-target rules
and named Challenge/Discovery/Competence intent were used, not invented pillars.
Earned economy, real pacing and independent final signoff remain unresolved;
the arithmetic model is explicitly insufficient for those acceptance gates.
