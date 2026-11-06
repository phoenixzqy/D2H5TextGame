BALANCE-CHECK: CONCERNS

# Martial builder investment growth — local correction

2026-11-04. Implements [D06](../plans/decisions/D06-martial-builder-investment-growth.md)
for [BUG652](../../production/bugs/BUG-652-martial-act4-throughput.md).
The local damage correction is verified; campaign progression and formal balance
acceptance remain open. This is implementer evidence, not independent QA.

## Change and before/after

The retained Act IV journal established that paid rank-6 Cobra and rank-8 Fists
landed for one damage. Their scalar skill bases ignore weapon Attack. Change
only authored per-rank damage: Cobra 5→360 and Fists 5→120. D06 derives the raw
marginal budget from the existing three-strike Talon. It does not equate authored
cooldowns with actual action cadence or prove equal DPS. No outcome-driven
numeric search, new mechanic, selector change or save migration occurs.

| Quantity | Before | After |
| --- | ---: | ---: |
| Cobra rank 1 raw range | 55–80 | 55–80 |
| Cobra rank 6 raw range | 80–105 | 1,855–1,880 |
| Cobra rank 6 ordinary noncritical landed range, observed defenses | 1 | 564–577 |
| Cobra rank 20 raw range | 150–175 | 6,895–6,920 |
| Fists rank 1 raw range | 45–70 | 45–70 |
| Fists rank 8 raw range | 80–105 | 885–910 |
| Fists rank 8 ordinary noncritical landed range, observed defenses | 1 | 522–547 |
| Fists rank 20 raw range | 140–165 | 2,325–2,350 |
| Fists raw release from captured ranks [1,8,20] | 132–170 | 1,627–1,665 |

Observed defenses are Defense 363, Physical resistance 50%, Fire resistance 0%.
Resistance applies before flat mitigation; Fire uses Defense. The raw ranges
and landed intervals follow that native pipeline. A fixed-seed paid-hit fixture
checks a hit inside each interval, not every possible random outcome. Criticals,
misses, statuses, rotation, survival and multi-target behavior are outside these
interval claims.

Rank-one damage, costs (Cobra 9 / Fists 5), cooldowns (2s / 1s), priority,
prerequisites, other tuning, private charge pools, captured ranks, cap, expiry,
consumption, Burn and Cobra's 0.1 recovery coefficients remain unchanged. Exact
structural comparison with the retained pre-change JSON verifies that only the
two planned scalar values differ. Existing Talon/Tail/trap changes are inherited
and preserved.

## Executed verification

Five new tests exercise actual registered skills, the paid combat pipeline,
schema validation, current/next/MAX previews, source immutability, mixed-rank
Fists release and once-only consumption/recovery. The one-hit fixture gives both
units deterministic statuses to isolate one paid hero cast, checks exactly one
correct action and mana debit, and verifies immutable input, landed/noncritical
damage, unchanged rank-one floor and high-Defense floor. It is not a campaign
character or an earned clear.

- Original RED: five failures; two native cases stopped at an incorrect exact
  event assertion that omitted recorded timing fields. Original test/output kept.
- Corrected RED, before production changes: five failures, including both native
  invested hits remaining at one damage. Projecting kind/actor/skillId preserves
  the exactly-one-action requirement without rejecting valid timing metadata.
- GREEN: 98/98 tests pass across exactly five files: the new builder-growth file,
  existing charges, charge previews, Assassin Fire and Dragon Talon files.
  Vitest duration 9.63s; wrapper wall time 10.371s; test execution 308ms.
- Strict types: initial scoped config failed because it omitted existing
  `src/vite-env.d.ts`; include that actual declaration and the new test to pass.
  Both configs and outputs retained. No production type suppression added.
- Explicit new-test ESLint passes with zero warnings. No broad suite, build,
  typecheck, old-act replay, browser run or population simulation was executed.

The repository has no `validate:data` script. Tests use the actual Ajv skill
validator; the native martial catalog also validates authored Assassin sources.
No nonexistent npm command is claimed as verification.

## Limits, review and next work

Local five-axis self-review finds the implementation matches D06 at the data
source, uses existing schema/runtime/display paths and adds no dependencies,
production branches, persistence changes or new runtime allocations. Security
check passes for authorized local JSON/tests/docs. The unit results do not prove
the cross-build DPS/clear-time invariants, TTK/death distributions, loot rates,
economy, pacing or higher-difficulty balance. Those remain unaccepted; no ship
or independent design/QA approval is claimed.

BUG652 stays Open until actual legal progression is verified. Terminal Martial
state remains level 49 / next ordinal 708. Original admissions 705–707,
training, ordering and equipment comparisons stay closed; no replay, income,
native preparation or new campaign admission occurs. A future continuation
must use the retained successor with an explicit bounded prospective plan.
Counts remain 14 intended Act I / 7 intended five-act Normal / formal 0 of 210.
Full private v1 remains active and incomplete, including the other intended
builds, acquisition/crafting, economy/pacing, higher difficulties/endgame,
broader app acceptance and final review. User extended playtesting follows
implementation. Browser works; CI excluded; no pending answer/external blocker.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-martial-builder-growth-_ttuy38p`.
It retains prospective plan/baselines, original and corrected failures, successful
checks, exact source diff, post-change hashes, review, manifest and closure.
Owned check processes terminate; exact task cache/config are removed and their
absence verified in closure. Root retains the required packet and human2 through
umbrella review, then owns exact cleanup/release. No agents, installation,
commit, push or publication.
