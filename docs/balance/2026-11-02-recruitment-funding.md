# Chronological recruitment funding diagnostic — 2026-11-02

Status: one conditional pilot complete; representative funding and full-v1
balance remain open. No gameplay, reward data or saved wallet is changed.
This adds chronology and actual hiring to the
[acquisition diagnostic](2026-11-02-recruitment-acquisition.md).

## Method and controls

Read the 18 retained contiguous Normal javelin pilot segments once: 7,020
waves, 90,262 rewarded nonsummon kills and 20.3333 recorded combat hours.
Reconstruct each victory's current rewards through unmodified native
`rollKillRewards`, using the actual seed, spawn identities/order, treasure
class, MF/GF and per-enemy wishstone fork. Every nonwish item payload,
material and currency matches the historical journal. Failed waves receive
no rewards. No combat is replayed.

Credit current first-clear rewards only at the 23 actual new-clear receipts,
and current quest wishes only at the 17 actual successful claims. No missed
optional quest is credited. Preserve the actual free opening Inner Sight
Rogue and later level-24 Holy Freeze hire; both reconcile to every segment's
terminal historical roster. Two recorded skill resets use free allowances;
remaining skill/stat resets are 1/3. Historical terminal wishes exactly equal
historical wave wishes, so net historical wishstone spending is zero. This
reconciliation does not establish other routes' expenses.

128 independent labelled native recruitment streams each run three fixed
strategies: bulk with no reserve, bulk retaining five wishes, and one opening
single followed by bulk retaining five. The five-wish reserve models keeping
one paid respec available; it is not an observed paid reset. Use native
`planRecruitment` and `planStarUpgrade`, with no store publication. Pay only
before a recorded admission, after a successful claim or at a recorded idle
hire; never during an active admission or after an arbitrary intermediate
wave. Newly acquired mercs remain unfielded and cannot change recorded combat.
A previously drawn hire identity remains owned without a free duplicate grant.

Freeze policy, source identity, horizon, seed label, wall/output budgets and
runner/driver hashes before execution. Stop at the fixed trace endpoint;
never extend to obtain an identity. The continuous labelled recruitment RNG
is conditional sampling, not reconstruction of live wall-clock-derived seeds.

## Results

Current sources yield **1,969 wishes**: 1,514 kills, 115 first clears and 340
quest claims. The historical 98,607 wishes were earned under older rules;
they are preserved in the saved history and are not present-day affordability
proof. Finite rewards provide 23.1% of this conditional budget.

| Strategy | First payment, combat hours | Final paid draws | Wishes spent / left | First paid SSR p10 / p50 / p90, combat hours |
| --- | ---: | ---: | ---: | --- |
| Bulk, reserve 0 | 1.051 | 210 | 1,890 / 79 | 1.051 / 5.294 / 6.061 |
| Bulk, reserve 5 | 1.112 | 210 | 1,890 / 79 | 1.112 / 5.328 / 6.174 |
| Opening single, then bulk, reserve 5 | 0.319 | 211 | 1,900 / 69 | 1.286 / 5.446 / 6.174 |

Quantiles use nearest ranks across 128 streams per strategy. All first paid
SSR milestones are observed; 67/128 finish by six combat hours in each
strategy. The paid SSR floor does not imply a six-hour population guarantee.
Actual Holy Freeze hiring occurs at 1.962 combat hours, so first *owned* SSR
p50/p90 is 1.962 for all strategies. Distinguish the optional paid result
from access to base mercs. Final ownership p10/p50/p90 is 23/24/25 identities.

No stream earns a star within the trace: 128/128 per strategy remain
right-censored at 20.3333 combat hours and 210/211 draws. Do not assign a
zero time, extrapolate a star date or require unearned stars for campaign
viability. No tuning follows from this single pilot.

## Verification and limits

Native extraction plus all 384 funding simulations pass in 119.49 seconds.
A separate Python implementation reproduces all 80,768 labelled native draws,
checks all 8,192 payments against safe chronological events and prices/reserves,
and reconstructs exact ownership, duplicate shards, upgrades, pity and retained
history. It independently checks source-report wave chronology, finite claim/
clear sets, source/journal hashes, all 2,129 current source-manifest inputs,
unchanged canonical earned70/Hell961 source and exact cache removal. This is
an independent calculation by root, not independent reviewer sign-off.

These are one adaptive historical pilot's current-reward counterfactual and
recorded combat cadence. The trace did not acquire the simulated roster in
live play. Menu time, player decisions, changed party power, representative
reward variance and other builds are not measured. This does not accept a
current earned successor, active-hour pacing, 14-build funding/fairness,
holdouts or any balance cell. Accepted balance remains zero.

## Evidence and next work

Retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Files prefixed `p15-recruitment-funding-v1`: registered policy, registration,
native TS driver, Vite runner, raw JSON/log, independent Python reader and
readback JSON/log. Native handle 36864 and reader handle 93225 exit 0. Exact
`p15-recruitment-funding-v1-vite-cache` is absent. No game-source tests,
campaign replay, install, agent, commit, push or CI run was needed for this
read-only diagnostic. Authority38 remains current.

Next: representative funding and Hell income variance, remaining browser
startup/inventory/storage performance, chronological 14-build fairness and
holdouts, defeat/retry/manual-idle, 30–50 active-game-hour pacing, integrated
G0–G7, two-hour soak, independent review and later owner playtest. Browser
works; CI excluded; no pending answer or external blocker. Root retains the
active human2 worktree and required packet through umbrella review and owns
eventual cleanup/release.
