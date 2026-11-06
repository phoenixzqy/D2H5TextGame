# P15 — Earned Act I recovery and terminal cold screen

The bounded optional [recovery policy](../decisions/P15-earned-act1-recovery-v1.md)
is implemented and locally verified. Production combat, allocation, equipment,
route, RNG, rewards and global budgets are unchanged. The fresh screen completed
technically, exercised earned recovery, and still failed in Act I.

## Functional validation

The initial test-only RED has seven failures and five passing controls.
Expanded focused validation passes seven files / 100 tests; the final three
recovery files pass 34 tests after two additional budget cases and the recorder
reference correction. There are 102 distinct focused cases across those seven
files. Separate campaign contracts pass four files / 23 tests; the default
import boundary passes fourteen cases. Strict incremental types, zero-warning
focused lint, and runner syntax pass. Independent read-only review returned
`RECOVERY-POLICY-REVIEW: APPROVE`, with no numerical acceptance.

Native-return fixtures use valid disclosed quest/service prerequisites and
assert persistent ownership conservation. The refill fixture observes native
hero death, then explicitly depletes only the outgoing merc combat projection
to make the merc refill assertion nonvacuous. It does not claim both actors
naturally died. Earlier invalid quest, zero-map-shape and natural-merc-death
fixture failures remain retained. The first type check exceeded its process
budget; the next exposed an incorrect `MetaState.idleTarget` test reference.
The corrected `idleState.idleTarget` check passes. The wrong-project contract
attempt found no tests; the correctly selected project passes. Initial lint
failures and the corrected pre-entry retry-reference regression are retained.

## One fresh earned screen

Declared case: `sorceress-cold`, target `act5`, recovery `act1-training-v1`.
No checkpoint import or manual seed. Wrapper exit zero in 80.203 seconds;
all 3,059 source inputs match before/after, without timeout, technical error or
live owned descendants. Gameplay stops on `Recovery training admission limit`.

| Measure | Observed |
| --- | --- |
| Admissions / played waves | 127 / 387 |
| Victories / defeats | 385 / 2 |
| Logical combat time | 7,254,038.652 ms (about 2.015 hours) |
| Earned XP | 255,050: waves 254,550 plus Den claim 500 |
| Earned items | 3,892 |
| Terminal hero | Level 13, 58,218 XP into level, no held stat/skill points |
| Terminal merc | Level 17, unequipped under the existing hero-only gear policy |

1. Dark Wood wave four loses at ordinal 105, hero level 12.
2. Burial Grounds admissions 106–114 earn level 13.
3. Whole-area Dark Wood retry 115 starts at wave one and loses at wave four.
4. Burial Grounds admissions 116–126 consume the remaining training allowance.
5. The twenty-admission total cap stops recovery before level 14. No second
   retry is fabricated. Both failed waves award zero XP/items; economy, quest
   and recovery audits reconcile all earnings and retained losses.

Both Dark Wood admissions naturally have run seed `4274560282`; native ordinal
differences produce different populations. The screen's frozen clock can yield
the same native seed. Seed uniqueness is not claimed.

The first failed wave lasts 17.621 seconds: hero enters at 283 HP / 267 MP,
ends at zero HP / 272 MP, with minimum observed mana 259. The retry lasts
11.895 seconds: entry 171 HP / 276 MP, ending zero HP / 281 MP, minimum 268.
Thus mana starvation is unsupported. Hero direct damage is 1,021 then 481;
hero periodic damage taken is 149 then 80. All three/four stun events target
enemies, so they do not establish hero stun-lock. Native Frost Nova rank one
is learned and cast; the sequential profile prioritizes Ice Blast investment.
Exact failed-wave reconciliation is 134 direct plus 149 poison = 283 entry HP,
then 91 direct plus 80 poison = 171 entry HP. Champion Tainted's appended native
Frost Nova supplies all 57 / 53 direct cold damage to the hero and three Chill
applications each. Poison Spit applies two stacks, reaching the native ten-stack
cap. Even a one-point direct hit supplies the native minimum one DPS per stack.
The recorded poison intervals integrate to the exact 149 / 80 HP totals. Poison
is a shared target status; its retained first source ID does not attribute all
periodic damage to one Tainted. Carried Ignite lacks a periodic payload and
deals zero damage in these failed waves.

At ordinal 105 the hero casts five Nova / six Blast actions; at 115, four / three.
Eight landed Nova hits across the first wave's two Dark Stalker champions each
deal one damage (plus two misses). Nova-first casting with Blast-first investment
is therefore a concrete policy mismatch worth a separate diagnostic. It does
not establish a production spell defect. The first rogue enters wave four at
48 / 244 HP, dies after 3.780 seconds, and deals 49 damage; the retry has already
lost its merc. Unequipped mercs and the conservative scalar hero gear policy
limit this result's applicability to optimized builds. No outcome-driven cap
increases or reruns follow this case.

## Retained evidence and limits

Root retains evidence through umbrella acceptance at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
The owner will remove disposable evidence only after its consumers finish.

- Functional receipts/logs: `p15-recovery-red-v1`, `p15-recovery-green-v4`,
  `p15-recovery-green-final-v5`, `p15-recovery-native-v5`,
  `p15-recovery-contracts-v2`, `p15-recovery-boundary-v1`,
  `p15-recovery-types-v3`, `p15-recovery-lint-final-v3`, and
  `p15-recovery-cli-syntax-v1` (matching `-exit.json` / `.log`).
- Method: `p15-recovery-next-plan-v1.md`,
  `p15-earned-cold-recovery-v1-plan.md`, `-owned.py`, `-binding.json`,
  `-source-before.json`, `-source-after.json`, and `-verification.json`.
- Complete result: `p15-earned-cold-recovery-v1/sorceress-cold.json`, its
  compressed JSONL journal and process/execution metadata; derived `-summary.json`,
  `-failed-waves.json` and `-terminal-analysis.json` retain the actual failures.
  The journal is 10,992,711 compressed bytes / 448,268,107 raw bytes.

No owned process remains from this measurement; the source freeze is released.
Act I/Act V clear, fourteen-build viability, 30–50 active-hour pacing and complete
private-v1 acceptance remain unfulfilled. CI remains excluded by user decision;
WSL browser launch is already verified and is not a blocker.
