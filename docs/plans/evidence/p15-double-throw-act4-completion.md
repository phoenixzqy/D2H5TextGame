# Double Throw — earned Act IV continuation verified

Date: 2026-11-04. This supersedes the earlier lack of an earned Act IV clear;
it does not erase the original failed attempts or certify final balance.

The adopted Double Throw rank Attack growth of 30 percentage points clears
Plains of Despair, River of Flame and Chaos Sanctuary from the exact failed
level-49 checkpoint. Three admissions (ordinals 709–711) produce 18 victories,
zero training, retries, nonwins or unplayed waves. All three quest rewards are
claimed and Act V is unlocked; the terminal save is level 49 / next ordinal 712.

| Area | Ordinal | Run seed | Victorious waves |
| --- | --- | --- | --- |
| Plains of Despair | 709 | 4103990709 | 5 |
| River of Flame | 710 | 3425530697 | 6 |
| Chaos Sanctuary | 711 | 132309777 | 7 |

## Evidence and validation

Retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `p15-throw-post-tuning-act4-v1`.
The plan, driver and accounting reader were frozen before gameplay. Scoped
strict TypeScript, explicit driver ESLint, five negative schedule controls and
no-gameplay input preflight pass. The single native launch takes 13.915 seconds
including startup; independent retained-output readback passes without replay.

The reader reconciles ordered item custody, currency/material/XP/point deltas,
quest receipts and claims, living party/resource carry, clocks, seeds, ordinals
and exact native save export. Observed gains: 750,801 XP and 203 items; 161 owned
items salvaged through native actions, no socket insertion. The native save is
333,762 bytes, SHA256
`659ed3968bda78f4eae3393db9d1e7c86c3fefa57997030f46e2edee60685a76`.
Report SHA256:
`fa7d9571075bd5f4901601d2cae82929b1efe70fe82abdb953f38edccfa46d99`.
Journal SHA256:
`be85e4409402f8f69dd3052cc2cf20221fd5e76faff623e230205870c44ca22e`.

Closure verifies all frozen inputs/checks, current production and campaign
manifests, terminal process receipts/PID absence and exact config/cache removal.
Cumulative costs remain 712 admissions / 40,166,737.22937232 logical combat ms /
425,812.697201 driver ms / 459,935.8705887571 measured execution ms, inside the
unchanged global envelope. Historical failures 706–708 and their exhausted
preparation controller remain terminal; this was a separate, prospectively
frozen post-change check. Original failed save/journal hashes are unchanged.

## Limits and next step

BUG656 is locally resolved for Act IV progression. This single retained-save
continuation, including underlevel later areas, earns no matched-level,
population, first-attempt, within-three, pacing or final balance acceptance.
Independent final design/QA review remains outstanding. Overall intended
five-act Normal completion remains 3/14 until this build clears Act V; formal
balance remains 0/210. Full private v1 remains incomplete.

Continue Act V from the exact new save. No earlier-act replay, seed search,
controller reset or prior income replay is needed. Browser works; CI excluded;
no pending question or external blocker. Root retains the required packet and
claimed human2 worktree through umbrella review and owns eventual cleanup and
release; all task-owned disposable configs/caches and processes are absent.
