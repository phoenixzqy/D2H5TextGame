# Intended Martial Assassin — earned Act IV failed checkpoint

The accepted [Act III checkpoint](2026-11-03-martial-act3-completion.md)
continues from level 47 / next Normal ordinal 675 to level 49 / next ordinal
708. Thirty cleared-Travincal training admissions succeed. All three permitted
Plains of Despair attempts fail: two Izual draws followed by a draw in the
preceding wave. Act IV remains incomplete; no claim or Act V entry occurs.

| Observation | Result |
| --- | --- |
| New admissions / settled waves | 33 / 194 |
| Victories / hero defeats / draws | 191 / 0 / 3 |
| Training / route attempts | 30 / 3 |
| Route ordinals | 705, 706, 707; all exhausted |
| Izual remaining Life, attempts 705 / 706 | 16,277 / 22,029 |
| Attempt 707 | Fourth-wave Pit Lord retains 3,595 Life; no Izual wave |
| Unplayed staged waves / interrupted attempts | 0 / 0 |
| Earned XP / items added / salvaged | 3,286,482 / 2,071 / 2,094 |
| Native socket insertions / quest claims | 0 / 0 |
| Final investment | Tail 20, Talon 12, Fists 8, Cobra 6, Tiger 6; no spare points |
| Skill / stat reset allowances | Three each, unchanged |
| Companion | Existing Prayer; no recorded death or absent wave |
| Logical combat | 3,062,031.8459291547 ms |
| Driver / measured launch wrapper | 30,636.345073 / 35,751.162252854556 ms |

The retained two Izual waves show high mana (minimum 480 of 500), frequent
Cobra/Web and six Tail casts each. [BUG652](../../production/bugs/BUG-652-martial-act4-throughput.md)
records the reproducible throughput failure and exact seeds. No engine bug,
accepted new ordering or gameplay correction is established. Earlier rejected
ordering studies stay rejected. No combat replay, seed search, extra retry,
budget renewal or unrelated test suite occurs.

## Verification

Scoped strict TypeScript, explicit lint and no-gameplay preflight pass. The
reader was frozen before gameplay and passes on its first execution, including
nine negative accounting controls. It reconciles complete terminal native save,
ordered item custody, currency/material/XP/point accounting, unchanged prior
quests/items, Prayer continuity, online clocks, seeds/ordinals and the original
training/attempt limits. Failure analysis reads retained outputs only and
confirms that the third attempt never reaches Izual.

All 2,151 production and 131 campaign inputs remain unchanged. The accepted
Martial profile and all previous costs, failures and historical parent manifest
supplement are retained through the verified checkpoint chain.
Cumulative costs: 708 admissions, 46,637,513.68641636 logical combat ms,
467,142.31882999995 driver ms and 496,822.3220668733 measured execution ms.
These are development-path observations, not proof of population balance,
typical acquisition or the 30–50-hour pacing target. The reader does not
independently derive damage/drop laws, spawn planning, equipment scoring,
mercenary XP or training-source maxima. Root self-review does not replace
independent final acceptance.

## Evidence and cleanup

Root retains packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `p15-martial-earned-act4-v1`: setup, frozen plan/driver/reader, inherited
source/profile manifests, scoped checks, single launch, report/journal/native
export, first readback, failure analysis and closure.
Successor `p15-martial-earned-act4-v1.native-export.json`: 303,447 bytes, SHA256
`e1888fb3b5f58b9a7d52bfb1a39c018ca88113e10ada1956c90faaee1d47cd4d`.
Production tree remains
`2afb8a4d83a2b445f4cee5ed36b5e1f8c042232c87eec5967a44413340bdd83d`.

Closure verifies every recorded process absent and the exact owned compiler
configuration/cache removed; configuration contents/hash remain archived.
Root retains required evidence and claimed human2 through umbrella review and
owns eventual evidence cleanup/worktree release.

The preceding goal turn was status-only/no progress. This turn completes Act III
and verifies the failed Act IV checkpoint, changing the next action to BUG652
investigation or another eligible unfinished slice. No exhausted limit is
renewed. Intended five-act completions remain three; full private v1 is
incomplete and formal balance acceptance remains 0/210. Remaining intended
campaigns/all-area coverage, populations/holdouts, acquisition/economy,
fairness/pacing, broader idle/retry, performance, later difficulties/endgame,
integrated review/soak and owner playtest remain open. Browser works; CI stays
excluded; no pending answer or external blocker exists.

## Subsequent diagnostic closure — 2026-11-03

`p15-martial-tail-priority-v1` terminated with exit 1 in 5,516.834859 ms.
Three controls matched every retained event and final team; no candidate
battle ran. The driver incorrectly required equal timestamps from two native
exports made three milliseconds apart. This establishes a diagnostic assertion
failure, not a gameplay defect or a rejected/accepted priority candidate.
The comparison is closed without rerun, rewards, campaign admissions or renewed
attempts. BUG652 remains open and this checkpoint is unchanged. The retained
`-closure.json` verifies exact owned config/cache removal and recorded processes
absent; required original driver/config archive/failure evidence remains with
root in the same packet. Separate BUG653 work continues P03/G1/G5 save-import
failure visibility without modifying the Martial policy.
