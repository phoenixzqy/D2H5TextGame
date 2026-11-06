# D06 — Invested Cobra and Fists damage

2026-11-04. Author tuning decision for [BUG652](../../../production/bugs/BUG-652-martial-act4-throughput.md).
The user has authorized completing private v1 and prefers cheaper solutions and
affected checks. This is a local implementation decision, not independent design
approval, campaign acceptance or formal balance sign-off.

## Cause and scope

[Retained attribution](../evidence/p15-martial-retained-attribution.md) establishes
that rank-6 Cobra and rank-8 Fists both roll 80–105 against Izual's 363 Defense;
Cobra also encounters 50% Physical resistance. Landed hits, including criticals,
deal one damage. These skills are scalar: a higher-Attack claw does not increase
their damage. Current charge ownership and first-eligible selection implement
D05 correctly; the retained inventory does not establish a preparation defect.

The missing progression is in the authored per-rank damage budget of these two
builders. Restore useful invested damage at that source. Keep their first ranks,
recovery role and paid charging, rather than adding a weapon-scaling mechanic or
changing selection to fit the recorded encounters.

| Parameter in `src/data/skills/assassin.json` | Before | After |
| --- | ---: | ---: |
| Cobra Strike `scaling.damagePerLevel` | 5 | 360 |
| Fists of Fire `scaling.damagePerLevel` | 5 | 120 |

Talon already has three attempts, each gaining 60 damage per rank, on a one-second
cooldown: 180 marginal raw damage per rank per authored cooldown second. Cobra's
two-second cooldown and absence of a damage release give the same growth budget
at 360/2. Fists' one-second direct hit plus the existing 50% paid release gives
120 × 1.5 = 180 marginal damage per builder rank before the extra finisher action.
This is a budget reference, not a claim that cooldowns equal action cadence or
that raw growth establishes equal DPS. Misses, resistance, flat mitigation,
critical hits, Burn, saturation and the cost of the finisher still matter.

At the retained ranks, Cobra becomes 1,855–1,880 and Fists 885–910. On an ordinary
noncritical landed hit against those exact defenses, the native pipeline gives
Cobra 564–577 and Fists 522–547. Resistance precedes flat Defense; Fire also uses
Defense, not Magic Resist. At rank 20 their raw ranges are 6,895–6,920 and
2,325–2,350. No global numeric range has been independently accepted yet.

This explicitly supersedes only D05's preservation of these two per-rank scalar
increments. Costs, cooldowns, rank-one ranges, unlocks, prerequisites, other
skills, private pool cap/lifetime, captured ranks, saturation, release ordering,
once-only consumption and Cobra's 0.1 recovery coefficients remain unchanged.
No persisted data shape changes, migration, new system or engine branch is needed.

## Verification and limits

Write focused RED before changing JSON: paid native hits at rank 6/8 must leave
the mitigation floor, while rank-one controls and very high Defense retain the
ordinary floor. Verify data-schema acceptance, current/next/MAX damage, mixed-rank
Fists release arithmetic and unchanged recovery/costs. Run the existing charge,
charge-preview, Fire and Talon files, plus scoped strict types and explicit lint.
The repository currently has no `validate:data` script; the focused tests use its
actual Ajv skill-schema validator instead. Do not invent a successful npm command.

No old encounter replay, native campaign admission, training, ordering/equipment
trial or 1,000-run broad simulation is authorized by this decision. The user's
affected-only requirement controls the local check scope. No numeric search after
observing the result. BUG652 stays open until actual legal progression is verified;
earlier failed attempts and closed budgets remain spent. Independent cross-build,
population, economy, pacing, higher-difficulty and public-browser acceptance remain
open. Counts stay 14 intended Act I / 7 intended Normal / formal 0 of 210.

Plan review: ready after distinguishing a growth budget from DPS, checking the
actual resistance-before-Defense pipeline, preserving charge payoffs and refusing
to treat a constructed regression as campaign completion. Security check: pass for
authorized local JSON/tests/docs; no credentials, network, permissions, installation
or CI changes. No agents, commits, pushes or publication. Root retains the owned
human2 worktree and required evidence through umbrella review, then owns cleanup.

## Local implementation result

[Before/after record](../../balance/2026-11-04-martial-builder-investment-growth.md):
the exact two-value edit is applied. Corrected RED demonstrates both invested
paid native hits at one damage before the change; all98affected tests then pass,
with scoped strict types and explicit lint. Original action-assertion and type-
config mistakes are retained separately. Campaign and formal balance remain
unverified; this decision grants neither replay nor renewed closed allowance.
