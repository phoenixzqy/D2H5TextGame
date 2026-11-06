# P15 — Fast elite uses its authored speed modifier

2026-11-05. Type: Tweak, repair of existing monster-spec §9 requirement.
Root sole implementer/self-reviewer; full-v1 and independent balance acceptance
remain open. BUG773 reproduces the missing effect with two causal RED tests.

## Rule and authority

Monster-spec §9 states **Extra Fast: +50% attack speed**. Existing Fast currently
only adds Charge. Preserve Charge and add optional `attackSpeedMultiplier` to
the existing JSON elite-affix definition. Fast authors1.5; absent means1.
The selected affix's field, rather than its ID/name/skill, is the stat authority.
The strict schema accepts only finite positive numbers; no unknown fields.
Monster construction independently rejects an invalid supplied multiplier or
nonfinite resolved speed before consuming RNG. Fractional speed is preserved;
existing scheduler flooring/clamps remain authoritative. Base speed fallback95
continues for legacy definitions. No multiplier is applied more than once.

Native wave construction forwards only an attached affix's optional multiplier.
No planner/RNG/cardinality change: D07 Lightning specialization and P15 elite
group rules remain intact. Unaffixed promoted members/fillers and ordinary
Charge-bearing monsters receive no speed bonus. Affix-bearing actors use the
modifier in both manual/idle and later-act/legacy paths. No new UI, save field,
skill, proc, currency or movement/range mechanic is introduced.

## Motivation and scope

The displayed Fast threat must change turn order and attack pressure as promised
by the design. This repairs challenge fidelity; it makes no claim that the
result is population-balanced. Do not copy the other old §9 affix behaviors:
D07/P15 decisions supersede several of those alternatives. No GDD numeric
change is required; this implements the existing +50% rule.

## Acceptance and verification

1. Real JSON Fast/native consumer gives Fallen95→142.5 and recorded action
   times1364/2728/4092ms, versus1740/3480/5220ms unaffixed. Existing Charge,
   non-speed stats/IDs, input immutability and deterministic RNG are preserved.
2. Factory validates before RNG, retains fractional/default speed, and applies
   custom authored multipliers without guessing identity. Schema rejects zero,
   negative, nonfinite/wrong-type/unknown properties; legacy absent is valid.
3. Native manual/idle Act I and later-act planner consumers affect exactly the
   affix carriers. Relevant existing factory/elite/Charge/cadence regressions,
   scoped strict types/lint/schema, and bounded Chromium runtime proof pass.

No broad suite, completed campaign replay, CI, or renewal of exhausted budgets.
Constructed runtime proof is not earned progression, human pacing, population
balance, independent review or owner playtest acceptance.

## Plan and security review

Plan review: ready. Root cause is the missing authored stat channel between
affix data and monster construction. One optional multiplier plus the existing
native consumer repairs all actual carriers; no per-ID scheduling patch or
global Charge change. Required negative controls and RNG/schema boundaries are
included. Exact preimages, reports, self-review and cleanup remain in BUG773's
packet; root owns cleanup after full-v1 consumers finish.

Security check: pass. Owner-authorized local gameplay implementation; no
credentials, network data flow, dependency/permission/CI/save-format change,
publication, destructive operation, commit or push.
