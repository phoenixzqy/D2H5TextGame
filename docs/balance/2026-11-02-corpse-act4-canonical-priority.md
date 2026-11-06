# Corpse Necromancer Act IV canonical rotation — 2026-11-02

Status: completed diagnostic; the existing canonical pack rotation fails the
frozen usefulness criterion on this source. Full v1 remains unfinished;
accepted balance cells remain0/210. No production code/data changed in this study.

Seeds1–100 pair the same earned level45/Normal930 Outer Steppes source. Baseline:
CE → Decrepify → Teeth. Canonical candidate: CE → Amplify Damage → Weaken,
already published in P15-corpse-pack-priority-v1.json. Exact prepared-state
assertions permit only comboOrder to differ. Gear/stats/ranks/points/party,
native payments and preceding-wave resource carry stay identical. No injected
corpses, refills or rewards. The expected matched elite is wave3.

| Metric | Baseline | Canonical rotation |
| --- | ---: | ---: |
| Full-area wins | 0/100 | 5/100 |
| 95% Wilson win interval | 0–3.70% | 2.15–11.18% |
| Intended elite reached / won | 0 / 0 | 39 / 21 |
| Terminal deaths | 21 | 32 |
| Terminal draws/timeouts | 79 | 63 |
| Areas with observed zero mana | 4 | 0 |
| Median victorious-area seconds | unavailable | 133.061 (n=5) |
| Median failed-area seconds | 102.196 | 90.800 |
| Hero basic actions | 7,854 | 10,139 |
| CE casts | 2,638 | 3,239 |

All100pairs are retained:95loss→loss and5loss→win. Twenty-four candidate deaths
occur on seeds that were baseline timeouts; the frozen criterion requires no
new deaths, so the criterion is false. Do not treat faster failed durations as
better successful-clear TTK or declare the five wins viable balance.

The sample is one retained repeat-farming checkpoint, not a population or
first-encounter power proof. Rotation alone does not solve its damage/survival
constraints. The observed mana improvement does not explain away those failures.
No corpse/curse/mitigation engine bug is established.

All100baseline areas were reused; only100candidate areas ran (65.530execution
seconds,14,399,576compressed bytes; no failure/budget stop). The separate Python
reader verifies2141authority52inputs, independently reconstructs660settlement
deltas and878retained-unit HP/mana/cooldown carry checks, validates preparation
custody, and derives outcomes/actions/damage from retained events without replay.
Scoped strict driver types passed. Native session56652 and reader42348 are
terminal exit0. The launcher's exact Vite cache was removed.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.

| Artifact | SHA-256 |
| --- | --- |
| `p15-corpse-act4-canonical-priority-v1.policy.json` | `a211caa1c1c9e972f9f244ca5f2ece27b6fddd7c434cc9e816185d3bc834bf68` |
| `p15-corpse-act4-canonical-priority-v1.json` | `46c844d60307a5ace149ca7c9974e4baa60f45c13c434cf482b49961ec3a10bd` |
| `p15-corpse-act4-canonical-priority-v1-readback-v1.py` | `50ed764d1051e27ba286692b1bf6367d1f3fb25af79030d7001b18371ad4434d` |

The [Act II/IV comparisons](2026-11-02-act2-act4-current-runtime.md) and
[remove-Teeth experiment](2026-11-02-corpse-act4-priority.md) are complete.
The next bounded change is the explicit [rank-growth candidate](../plans/decisions/P15-corpse-explosion-growth-v1.md),
not more seed-fitted rotation variants. Full-v1 population/holdouts, fresh
campaigns, recruitment/Hell economics, defeat/retry/manual-idle, performance
including BUG592, calibrated30–50active-hour pacing and integratedG0–G7/soak/
independent review remain before owner playtest. Browser works; CI excluded;
no pending question/external blocker. Root retains required evidence/worktree.
