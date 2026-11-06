# Corpse Necromancer Act IV priority comparison — 2026-11-02

Status: reject the proposed CE → Decrepify adaptation as a solution to this
checkpoint. Full v1 remains unfinished; accepted balance cells remain 0/210.
No production code, game data, saved checkpoint or existing priority policy changed.

The fixed sample pairs seeds 1–100 from the same authenticated earned level45,
Normal ordinal930 Outer Steppes source. Expected elite is wave3, level45.
Baseline is CE → Decrepify → Teeth; candidate removes Teeth from priority only.
Both keep CE20, Teeth20, Decrepify1, four unspent skill points, all core stats,
hero/merc equipment, party, currencies and carried resources. The native priority
setter is free. The declared capacity discard selects no items. Every prepared
state is asserted to differ only in comboOrder; native combat and settlement
entry points are used with no refills or injected corpses.

| Metric | Baseline | Remove Teeth |
| --- | ---: | ---: |
| Complete areas | 100 | 100 |
| Full-area wins | 0 | 0 |
| Intended elite reached / won | 0 / 0 | 3 / 3 |
| Terminal deaths | 21 | 10 |
| Terminal timeouts/draws | 79 | 90 |
| Areas with observed zero mana | 4 | 0 |
| Median failed-area combat seconds | 102.196 | 99.790 |
| Hero basic actions | 7,854 | 14,001 |
| Teeth casts | 6,494 | 0 |
| CE casts | 2,638 | 2,798 |

All 100 pairs are loss→loss. Although overall deaths decrease, seeds32/35/40/45/
64/74/85 change from timeout to death. The frozen usefulness criterion requires
positive paired area success and no new deaths; it is false. Do not select this
rotation based on improved aggregate deaths or the three reached elites. No
victorious-area TTK is reported because neither arm has a victorious area.
For each arm the 95% Wilson win interval is approximately 0–3.70%; this is a
conditional repeat-context diagnostic, not intended-power or acquisition evidence.

Mana/action allocation is only a contributor. The candidate eliminates Teeth
spending and raises basic physical damage while the retained pack still fails
its damage/survival constraints. Corpse supply/payment and native mitigations
remain unchanged. No engine bug or need for a new damage formula is established.
The existing published pack policy is instead CE → Amplify Damage → Weaken;
a separate frozen study evaluates that already specified rotation on this source
and reuses all 100 baseline attempts. It is not adopted by this report.

The batch reuses current baseline seeds1/8; only198areas are new. Native execution
was 109.530 seconds, below its240second budget, with
24,283,390 compressed bytes below128MiB. No budget stop/failure.
The separate reader verifies all2141authority52inputs, reconstructs606settlement
deltas, verifies808retained-unit HP/mana/cooldown carry transitions, checks exact
preparation custody and reward/XP/material/currency conservation, and computes
paired outcomes/actions/damage from retained events without combat replay.
Scoped strict driver types pass. Unrelated acts, campaign, unit and browser
suites were not rerun.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.

| Artifact | SHA-256 |
| --- | --- |
| `p15-corpse-act4-priority-exploration-v1.policy.json` | `72ba8dba91221f5cfbb9ee01cbd6dae325770408989b07f583494049e33dea3b` |
| `p15-corpse-act4-priority-exploration-v1.json` | `11c222201e9cdaf5955a2902e1391d807252c73d09ff790d971e2d04e8f37197` |
| `p15-corpse-act4-priority-exploration-v1-readback-v1.py` | `1e3d13bb31646373f2cc03d81b412354c8be216bee86152e109dceb5a48a0d6d` |
| `p15-corpse-act4-priority-exploration-v1-readback-v1.json` | `67afb5b8b8d8303b02d6049d0d75f52dfed42e57ce153758f4d6616880955826` |

[Act II/IV current-runtime accounting](2026-11-02-act2-act4-current-runtime.md)
is complete and reused. Appropriate earned-power fixtures, population tuning,
independent holdouts, fresh campaigns, representative recruitment/Hell economics,
defeat/retry/manual-idle, performance including BUG592, calibrated30–50active-hour
pacing, integrated G0–G7, two-hour soak and independent review remain before owner
playtest. Root retains the required worktree/evidence through review and owns
eventual cleanup/release; browser works, CI excluded, no question/external blocker.
