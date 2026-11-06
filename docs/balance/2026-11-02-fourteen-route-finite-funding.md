# Finite recruitment funding across 14 retained routes — 2026-11-02

Status: deterministic finite-source budget complete for the retained endpoints;
chronological acquisition, current-source fairness and full-v1 balance remain open.
This extends the [one-route chronology](2026-11-02-recruitment-funding.md).
No gameplay, economy data, existing wallet or earned save changes.

## What the budget establishes

Under current rewards, the actual clears and successful quest claims recorded
at the 14 historical five-act route endpoints project to **455–485 wishes**,
with **zero kill wishes credited**. All endpoints claim the same 17 quests,
worth 340 current wishes. Their 23–29 cleared areas add 115–145 current wishes.
Do not credit unclaimed optional quests, repeatable bounties or later clears.

The current single/bulk prices are 10/90. The minimum cost of 50 paid draws
is 450 (five ten-draw purchases); the native banner guarantees SSR rarity by
the fiftieth draw. A named identity or star is not guaranteed. Thus each retained
endpoint's finite-source projection can fund the rarity floor while retaining
five wishes **if no paid resets or other wishstone expenses are charged**.
This is a current-rule counterfactual, not a claim that the historical saves
received or spent these amounts. Historical wallets are recorded but excluded.

| Retained build route | Cleared areas at campaign endpoint | Current finite wishes | After later all-29-area completion | Remaining after 50 draws and five-wish reserve |
| --- | ---: | ---: | ---: | ---: |
| sorceress-cold-nova-lineage | 25 | 465 | 485 | 10 |
| amazon-bow | 26 | 470 | 485 | 15 |
| necromancer-summon | 29 | 485 | 485 | 30 |
| necromancer-bone | 26 | 470 | 485 | 15 |
| barbarian-double-swing | 23 | 455 | 485 | 0 |
| barbarian-double-throw | 23 | 455 | 485 | 0 |
| paladin-zeal | 29 | 485 | 485 | 30 |
| paladin-holy-bolt | 29 | 485 | 485 | 30 |
| druid-fire | 29 | 485 | 485 | 30 |
| sorceress-fire | 29 | 485 | 485 | 30 |
| amazon-javelin | 29 | 485 | 485 | 30 |
| assassin-martial | 29 | 485 | 485 | 30 |
| assassin-traps | 29 | 485 | 485 | 30 |
| druid-summon | 29 | 485 | 485 | 30 |

All rows use the original retained campaign endpoint for the first budget.
The all-area column uses the separately hashed later continuation where one
exists. It does not move those later rewards earlier. These are endpoint source
sets, not necessarily the instant of first Baal death or first campaign claim.
None of the 14 original endpoint rosters owns an SSR. Their historical clears
therefore do not require a paid SSR or earned star; this is not a current-source
survival result for another party.

## Reserve and reset tradeoff

Follow-up: the [historical expense audit](2026-11-02-fourteen-route-wish-sinks.md)
now reconciles all selected net transitions and identifies one recorded five-wish
expense. Under those recorded expenses, all 14 original finite budgets still
cover the SSR floor and reserve. The scenarios below remain hypothetical.

The authored reset policy supplies three free skill resets and three free stat
resets; each subsequent reset costs five wishes. Terminal free allowances are
recorded per route. They do not reconstruct how many paid resets occurred.
The following reset expenses are explicit sensitivity scenarios, not observed
historical purchases. The five-wish reserve remains unspent throughout.

| Paid resets charged | Wish expense | Campaign endpoints still funding the SSR rarity floor, of 14 |
| --- | ---: | ---: |
| 0 | 0 | 14 |
| 1 | 5 | 12 |
| 5 | 25 | 9 |
| 6 | 30 | 9 |
| 7 | 35 | 0 |

After all 29 areas are recorded, every route has the same 485-wish finite
projection: 450 for five bulk purchases, 30 for six hypothetical paid resets,
and five retained. A seventh paid reset exceeds this finite-only budget.
No random-drop income is used to hide a shortfall. Spending on singles instead
of bulk changes the draw count; the raw report considers every legal mix of
single and ten-draw payments rather than assuming a fractional price per draw.

## Attribution by act

For the all-area endpoints, current source-act totals are:

| Source act | Clear wishes | Claimed quest wishes | Total |
| --- | ---: | ---: | ---: |
| I | 30 | 40 | 70 |
| II | 30 | 95 | 125 |
| III | 30 | 45 | 75 |
| IV | 25 | 65 | 90 |
| V | 30 | 95 | 125 |

These are source allocations, **not chronological payment or act-clear times**.
In particular, an act's quest may have been claimed later. No active-hour or
six-hour acquisition claim follows from this table. It identifies exactly which
finite rewards an eventual chronological analysis must place on the timeline.

## Verification and limits

The registered local reader verifies all 2,139 current authority47 source inputs,
all 28 endpoint references, unique legal clear/claim IDs, all five boss claims,
Normal-only finite sources, unchanged canonical earned70/Hell961 save, authored
prices and free-reset policy. Integer dynamic programming computes payment costs.
A separate reader reconstructs endpoint sums from the actual reports and uses
independent batch-count enumeration to reproduce all 280 payment scenarios.
Both readers pass. This is separate calculation by root, not independent review.
No combat, reward generation, game tests, build, install or server is run.
No disposable caches/build outputs are created.

The 14 routes are adaptive historical pilots under mixed revisions, with one
retained policy per build. They share a claim policy and are not 14 independent
population samples. Actual current grants, claim chronology, kill-income variance,
other sinks, party power, acquired stars, 14-build funding/fairness, holdouts,
30–50 active-hour pacing and all integrated acceptance remain unproven. Accepted
balance cells remain zero. These results do not justify a price/reward change.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Files prefixed `p15-fourteen-finite-funding-v1`: frozen policy/registration,
Python driver, raw JSON, separate readback and documentation script. Authority47
is unchanged; decision68 / artifact index21 / handoff22 carry this result.
Root retains the worktree and required packet through umbrella review and owns
eventual cleanup/release. Browser works; CI excluded; no pending answer.
