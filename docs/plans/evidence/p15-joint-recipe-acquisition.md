# P15 — Joint direct recipe-material acquisition

2026-11-04. The conditional joint material model is locally verified. P15,
all-source affordability, pacing and full private v1 remain incomplete.

`tests/sim/production/recipe-acquisition.ts` models capped joint inventories
from empty stock, retaining every material drop. It uses native ordinary rune/gem
identity intervals, replacement boss/goblin quantity distributions and live TC
material projections. Different identities in the same draw are exclusive;
separate channels are independent under the stated uniform-output model.
Bundle quantities mix whole inventory distributions, preserving correlations.
Repeated recipe inputs require their full counts. Suppressed ordinary boss
materials are not added back.

Eight fixed Normal/manual plans (seed 7, ordinal 0) cover Blood Moor, Den of Evil,
Cold Plains, Catacombs, Tomb of Tal Rasha, Durance of Hate, Chaos Sanctuary and
Throne of Destruction: 65 reward contexts and 380 planned spawn occurrences.
Cold Plains includes a native planned goblin, and Den includes a live mixed TC.
Seven authored demands cover Stealth, Insight, Spirit, Infinity, Last Wish,
three-El fusion and three-chipped-ruby fusion. All direct costs and target
predicates accompany the results, including the two Ber inputs for Infinity,
three Jah for Last Wish, and the gem-shard cost of ruby fusion.

The report contains 56 joint distributions with a 128-clear horizon. Completion
here means owning the direct rune/gem inputs, conditional on repeating the same
plan and settling every planned spawn once. Quantiles count whole clears; a null
quantile means its probability threshold was not reached within the horizon.
The restricted mean is E[min(T, 128)], not an uncensored completion expectation.

| Fixed plan | Stealth median / p95 clears | Insight median / p95 clears | Spirit median / p95 clears |
| --- | ---: | ---: | ---: |
| Blood Moor | 26 / 78 | unavailable | unavailable |
| Den of Evil | 8 / 24 | unavailable | unavailable |
| Catacombs | 10 / 42 | unavailable | unavailable |
| Tomb of Tal Rasha | 20 / 61 | 19 / 58 | 15 / 56 |
| Durance of Hate | 21 / 64 | 45 / >128 | 50 / 124 |
| Chaos Sanctuary | 21 / 62 | 44 / >128 | 49 / 121 |
| Throne of Destruction | 9 / 27 | 20 / 57 | 22 / 53 |

Unavailable means zero support from the selected repeatable sources. Infinity
and Last Wish have zero completion probability in all eight selected plans.
Different boss rune bands explain why later-act material counts need not make a
specific recipe faster. These results do not independently justify tuning.

## Verification and limits

Five distinct focused cases pass: exclusive identity arithmetic; repeated inputs
and random bundle counts; independent channels/direct quantities/counts;
malformed-input and capacity refusal; and native channel/marginal/catalog/CDF
reconciliation. The four synthetic cases passed after the inventory access
refactor; only the affected native case was rerun for plan selection changes.
Final native case execution took about 1.9 seconds. Scoped strict types and
explicit two-file lint pass. No broad suite, build, browser or campaign replay.

Retained failed attempts are explicit: missing-module RED; missing-native-export
RED; a six-plan selection had no live mixed TC, so Den was added without dropping
the source-coverage assertion; the initial scoped type config omitted Vite's
environment declarations, and one test indexed a union currency bag incorrectly.
Those were corrected at the test/config boundary. Cold Plains was then added
to cover native variable-quantity goblin bundles.

A separate Python tuple-state implementation uses sequential settlements rather
than the TypeScript binary powers. It reproduces all 7,168 CDF points, both
quantiles and restricted means; maximum CDF error is 1.73e-13. It also checks
native plan/context identity against the previous supply report, direct demand
against current JSON, and every captured source hash. All 2,100 production files
remain unchanged from both this task's before snapshot and the previous supply
report. Root self-review is not independent acceptance.

The model assumes independent uniform output draws, not a proved seeded PRNG
population. It excludes combat failures, changing plans, dynamic summons, Find
Item, once-only rewards, quest-specific replacement settlements, endgame,
salvage, currencies, gear acquisition, intervening spending and fusion policies.
It does not establish eligible bases/sockets/levels, actual crafting, all-source
affordability, player hours, campaign wins or formal balance acceptance.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-joint-recipe-budget-q_0bs97f`.
Final report: `report-final.json`, SHA256
`70e454452f658dd4e8b10991f7361a566493ce3c2aa4533e1a50f93e608dc2d3`.
It retains checks, failed attempts, source snapshots, report provenance and
separate reader/results. All owned tool sessions are terminal; the scoped config
is archived as text and removed. No task server, disposable cache or cleanup
failure remains. Root retains the packet and human2 through unfinished umbrella
review, then owns exact packet cleanup and worktree release.

Next economy work must account for authorized encounter/time policies and actual
currency, equipment and spending channels before recipe affordability or pacing
acceptance. **14/14 Act I; 10/14 intended Normal; formal balance 0/210.** Holy
Bolt, Zeal, Double Swing and Javelin, wider difficulty/endgame, app/performance,
soak and independent acceptance remain open. No user or browser hold.
