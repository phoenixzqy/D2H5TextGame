# P15 — Direct gem-fusion inputs and catalyst

2026-11-04. All 28 direct gem-fusion acquisition budgets now include the
catalyst fee. This locally completes one P15 currency-cost component and adds
P12b family evidence; whole-economy, campaign pacing and full v1 remain open.
Root worked in the existing claimed human2 worktree on
`feat/playable-foundations`, HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
plus retained changes. The preceding goal turn was status-only/no progress.

## Cost and acquisition policy

The earlier [joint recipe report](p15-joint-recipe-acquisition.md) modeled direct
materials and explicitly excluded currencies. Every current gem fusion also
costs one gem-shard. Starting with empty materials/currency, reserve the required
target gems and acquire a distinct surplus gem to dismantle for that fee.
The same gem cannot simultaneously pay a fusion input and its catalyst.

`tests/sim/production/gem-fusion-acquisition.ts` reads the validated live catalog
and refuses contracts outside this policy: one gem input, exactly one gem-shard
fee, and a free one-gem dismantle yielding at least one shard for every gem.
All 35 current dismantles meet those conditions. For input count k, completion
requires either k target gems plus another gem, or k+1 target gems. The joint
model preserves exclusive identities, quantities, independent channels and
whole-bundle quantity mixtures. It combines the two completion events with
their overlap removed. Original supplies are validated before non-gems collapse.

The existing native source builder is shared with the earlier recipe model;
its measured values remain exactly equal after extraction. Eight fixed
Normal/manual plans, seed 7 and ordinal 0, provide 65 contexts and 380 planned
spawn occurrences. The report contains 224 recipe/plan combinations, with
material-only and complete-cost CDFs through 128 clears, median/p95,
restricted mean and unresolved probability, plus source and recipe provenance.

| Fixed plan | Chipped-ruby fusion complete-cost median / p95 clears |
| --- | ---: |
| Blood Moor | 52 / 121 |
| Den of Evil | 36 / 88 |
| Cold Plains | 58 / >128 |
| Catacombs | 31 / 73 |
| Tomb of Tal Rasha | 29 / 67 |
| Durance of Hate | 29 / 67 |
| Chaos Sanctuary | 24 / 57 |
| Throne of Destruction | 16 / 36 |

These are whole clears of the stated fixed plans, conditional on settling every
planned spawn once. They do not measure earned attempts, encounter frequency,
combat success or active hours. A null quantile means its threshold is not
reached within 128 clears; restricted mean is E[min(T,128)].

Other gem drops usually pay this small catalyst fee before all target inputs
arrive: median/p95 values are unchanged from material-only values in all 224
combinations. The largest CDF decrease is about 0.00061813, for normal-amethyst
fusion in Tomb. There are 63 combinations with zero direct-input support in the
selected sources: 28 normal-quality and 35 flawless-quality inputs. This does
not establish their availability under lower-grade fusion chains or other plans.

## Verification

Six new focused cases pass across scoped invocations: distinct sacrifice,
same-target sacrifice, multi-unit/random-draw rewards, invalid inputs, native
paid actions, and the complete native family report. The native action case
checks 56 constructed-inventory dismantle→fusion flows: each recipe with a
same-target or other-perfect-gem sacrifice, exact costs/output/ordinal and
unchanged input state. Insufficient catalyst currency is rejected. These are
pure native action checks, not earned-save or browser evidence.

The prior native report case also passes. Comparing the regenerated prior report
to its retained predecessor finds no difference except source provenance.
The final selected native cases take about 2.1 seconds of test execution;
scoped strict TypeScript and explicit three-file ESLint pass. CLI name filters
exclude unrelated cases; no source skip, weakened assertion or lint suppression
was introduced. Original missing-module RED and the initial void-expression
lint failure are retained; an explicit block fixes that lint failure.

A separate Python reader uses sequential capped (target, other-gem) tuple-state
convolution and a direct completion predicate, without TypeScript inclusion/
exclusion or binary powers. It reproduces all 57,344 CDF points, quantiles and
restricted means: maximum CDF error 2.48e-13, mass error 1.03e-13 and restricted
mean error 1.42e-11. It verifies all 2,240 captured source hashes, all 2,237
protected production/campaign before hashes, current JSON costs/yields and
unchanged earlier source/report values. Root self-review is not independent
acceptance. No gameplay, save, RNG, data or earned campaign state changed.

## Limits and retention

The probability model assumes independent uniform 32-bit outputs; it does not
prove independence across PRNG seeds. Every acquired gem is retained for this
single craft. Existing currency, competing sinks, lower-quality fusion chains,
other crafts, gear acquisition, Find Item, dynamic summons, first-kill/quest/
endgame rewards and quest-specific replacement settlements are excluded.
No menu/decision time, actual crafting execution time, all-source affordability
or 30–50 active-hour pacing is inferred. No combat/campaign replay, browser,
build, broad suite, install, new agent, CI, commit or push was needed.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-gem-fusion-cost-jfkgq6dq`.
Final report: `report-final.json`, SHA256
`d74a93bfbe4e2e384d3c125f7363592cab9a6b547b5debe990ecab2b5bf06246`.
The packet retains source snapshots/diff, plan/security/self-review, original
and final checks, reports and separate reader/results. Executed configs are
archived as text; disposable cache/config paths and exact owned process IDs
are checked in the cleanup receipt. Root retains this required packet and
human2 through unfinished umbrella acceptance, then owns exact cleanup/release.

**14/14 Act I; 12/14 intended Normal; formal 0/210** remain unchanged. Zeal,
qualifying earned Double Swing, wider economy/time policies, higher difficulty,
broader endgame/app/PWA/a11y/performance, soak and independent acceptance remain.
Full private v1 stays active/incomplete; no pending answer or external hold.
