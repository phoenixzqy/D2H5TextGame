# Design decisions required before tuning

These are preparation proposals, not accepted ADRs. Owner-approved inputs are full-game staged delivery and a
30–50 active-hour first campaign clear; other balance numbers remain proposals.
P01 records the controlling choice, rationale, affected specs/data, decision
owners, tests and version. Reconcile authoritative docs through normal design
review; architecture/save changes use technical-director review/ADRs as needed.
Routine implementation choices within this scope do not require repeated user
permission. Ask the owner for creative scope changes or irreconcilable intent.

| ID  | Conflict or missing contract                                                                                       | Proposed default / decision needed                                                                                                                                                                                                                                                                     | Owner                                                   | Blocks            |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ----------------- |
| D01 | First clear, two-week build maturity, L70/90 time targets and daily-time assumptions disagree                      | Honor owner-selected 30–50 active h first clear (center 40), in staged full-game delivery. Reconcile legacy two-week maturity with daily-time assumptions and post-campaign play; 14 days ×60–90 min cannot complete a 30–50 h campaign. Publish compatible maturity targets; no silent return to 16 h | creative director + game/level designers                | P11, P15, P18     |
| D02 | XP formula vs sampled table and checkpoint levels; Act V entry L55 vs clear L55                                    | Keep formula as calculation reference until a reviewed change, regenerate exact totals, then choose reward rates and chapter levels together. Formula alone does not establish good pacing                                                                                                             | game/level designers                                    | P11, P15          |
| D03 | GDD level-only difficulty vs old Nightmare/Hell workflow multipliers; audited reward path Normal-only              | Deliver five acts first; publish whether named replay difficulties are v1 and how their level maps unlock. Never add independent HP/damage multipliers merely because a stale skill says so. Full v1 endgame still required                                                                            | creative director + game designer + technical director  | P11, P15, P18     |
| D04 | "Turns" vs seconds, 60 s cap, damage/weapon scaling, missing healing, status aliases                               | Seconds authoritative, actions reported separately. Define physical weapon %, spell base/rank, added elemental/gear scaling, resist/mitigation, DoT integration and death priority in one contract. Normalize burn/ignite without losing saves/content                                                 | game designer + technical director                      | P06–P10, P15      |
| D05 | Passives/auras/buffs are names; utility/transformation/charges/corpse skills lack contracts                        | Every advertised skill has real behavior. Passive automatic; timed effects expire/revert; selected aura rules explicit; utilities receive useful text-combat adaptations. Removing/changing promised skills is a recorded scope/design choice, never a test shortcut                                   | game designer + technical director                      | P07–P10           |
| D06 | Summon once vs fill to cap at start; ranks/caps; insertion-order ties vs seeded ties                               | Follow canonical start-to-cap and seeded tie intent after resolving resource/corpse conditions; specify whether summon upkeep consumes actions, death refunds and stacking. Deterministic identity local to battle                                                                                     | game designer + technical director                      | P06–P10           |
| D07 | Manual challenge waves vs idle guaranteed kills, reward rate differences and retries                               | Shared authoritative combat-qualified reward service or mathematically equivalent simulation. Manual challenge/farm may differ if explicit; no loot/XP from invented victories, duplicate claims or partial failures                                                                                   | game designer + technical director                      | P11, P15          |
| D08 | Forced-normal trash, TC max levels below actual spawns; old loot reports diverge                                   | Explicit fixed-rarity guarantees vs randomized rarity; validate actual spawn-level eligibility. Derive quality rates from upgrade/acquisition targets. MF changes quality probabilities without guaranteeing upgrades                                                                                  | game/level designers + content designer                 | P11–P15           |
| D09 | UI 100/500 vs store 500/2000, original GDD open caps                                                               | Accepted ADR-002's 100/500 governs current v1; unify enforcement while preserving access to all existing over-cap saved items. Never truncate/discard legacy items to satisfy capacity                                                                                                                 | technical director + UX                                 | P03               |
| D10 | Gold/gambling quests vs removed-gold design; rune/gem/charm/material/wishstone roles; inconsistent ten-pull timing | Preserve no gold/no vendor gambling; merc-only gacha default. Publish each currency's faucet, sink, ledger identity and time-to-afford. At 80 wishstones/h a 90-cost ten-pull takes 67.5 min, not 8                                                                                                    | game/level designers                                    | P04, P11–P15      |
| D11 | Quest points/permanent rewards/respec descriptions conflict; inert towns and missing quest events                  | Enumerate every objective/reward kind and permanent bonus, exact point budgets, free/paid respec policy and town services. Rewards atomic/exactly once with visible overflow recovery                                                                                                                  | game designer + narrative director + technical director | P03–P04, P10, P14 |
| D12 | Offline engine vs unpersisted close timestamp; import vs running autosave                                          | Specify last-active/closed persistence, elapsed-time clamp, time rollback, grant/consume semantics and import synchronization. No raw offline rewards. Store schema change only if needed; migrate existing v7 saves                                                                                   | technical director + game designer                      | P03, P11, P17     |
| D13 | Art resolver precedence, weapon-prefix generic art, sticky failures                                                | One item identity policy: explicit override/unique/set/runeword/base/category fallback order agreed with art director; metadata-driven weapon category; reset failure on source changes; accessible stable fallback                                                                                    | art director + UX + frontend                            | P05               |
| D14 | Post-campaign dungeon/modifiers/achievements are canonical but under-specified                                     | Define a bounded repeatable high-difficulty dungeon using existing systems; state unlock, modifier pool, build checks, reward/sink loop and achievements. Avoid introducing new services or endless feature scope                                                                                      | creative director + game designer + technical director  | P18               |

## Minimum skill behavior contract

Each CSV row gets a record with: canonical/data IDs, player promise in both
locales, trigger, target, rank scaling, resource/cooldown, prerequisites/equipment,
effect composition/stacking/expiry, damage/weapon interaction, allies/summons,
corpse rules, UI presentation, save implications, positive and negative tests,
and disposition (`complete`, `partial`, `stub`, `decision-needed`).

An effect family's shared contract can cover repeated behavior, but each skill
must link its parameters and at least one identity-specific assertion. Test
rank 1, max rank and important intermediate breakpoints. Display calculations
and runtime use the same reviewed metadata; two matching wrong numbers are
not proof against the design contract.

## Decision record template

```text
Decision ID / version / status:
Problem and controlling sources:
Chosen player behavior and numeric targets:
Alternatives/tradeoffs:
Owners and review verdicts:
Affected design/ADR/data/runtime/UI/save/tests:
Verification and counterexamples:
Date and linked task/commit:
```

Until resolved, downstream tuning is blocked on that decision; independent
reproduction/inventory work continues. A recorded uncertainty is preferable to
presenting an arbitrary number as a proven balance target.
