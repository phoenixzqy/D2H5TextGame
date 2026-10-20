# Execution ledger

Objective: full v1 through C0–C4, seven classes, all advertised skills, five
acts, 30–50 active-hour fresh first clear, all G0–G7. Checkpoint progress does
not reduce the objective. No public deployment.

2026-10-20; phoenixzqy/D2H5TextGame; branch `feat/playable-foundations`;
implementation base `9e0ef64`. Historical baseline remains unchanged.
Current implementation evidence lives in `evidence/`.

## Current cards

| Card | State | Evidence / remaining |
| --- | --- | --- |
| P00 | in-progress | Producer F01–F21 mapping and assertion audit below. Expand current-head measurements and strict tests with each fix. |
| P00b | accepted tooling fix | `test:related` now invokes Vitest's `related --run`; scoped 25 tests pass in 1.45 s, broad 226 pass/1 existing skip in 10.70 s (over budget). Producer approval; BUG-003. |
| P01 | in-progress | D12 save/import contract recorded. Offline portion, D01–D11/D13–D14 pending; D04/D06 source reconciliation under review. |
| P02a01 | accepted contract slice | `5adaeec`; strict fresh recipe/provenance/hash contract, 35 discovered self-tests. Producer independent APPROVE. No combat measurement yet. |
| P02a02 | in-progress | Explicit seed/ordinal production boundary; independent technical agent. Preserve defaults, atomically reject invalid inputs, expose resolved metadata. |
| Remaining P02 | pending dependencies | Production adapter/reporting/CLI and diagnosed manual/idle/reward comparison remain. Historical proxy sim stays excluded. |
| P03a | accepted slice | `6f1dafd` + `76db166`; independent source approval, U/T/L/B and 10 browser cases pass. [Evidence](evidence/P03a-save-integrity.md). Full D12/G1/G6 remain unaccepted. |
| P03b01 | accepted visibility slice | `90e4a67`; all legacy items remain selectable above grid cap, seven boundary tests, four ordinary-control browser cases. BUG-005. |
| Remaining P03b/P04 | ready for reproduction | Shared capacity, atomic transactions/recoverable awards and quest event/reward integrity remain. |
| P05a | accepted slice | `2458ee7`; source-local error state, 13 focused tests and actual-component desktop/mobile proof. [Integrated evidence](evidence/P05a-P06a-foundations.md). D13/F19 remain open. |
| P05b | needs D13 | Resolver precedence, metadata category, cross-surface identity. |
| P06a | accepted slice | `10ce45d`; battle-local summon identity, full A/A and A/B/A replay, live/dead collisions. Independent TD approval. [Evidence](evidence/P05a-P06a-foundations.md). |
| P06b | accepted deadline slice | `2cd350b`; inclusive 60,000 ms deadline, no overshoot, tied actors and exact/early victory. Five boundary tests, independent parent APPROVE; BUG-006. |
| Remaining P06–P10 | pending dependencies | D04–D06/shared effects first. All skills remain behavior-unaccepted. |
| P11–P15 | pending dependencies | Rewards/idle, eligibility, economy, campaign and pacing. |
| P16–P18 | pending | Critical UI/a11y/performance, offline/PWA, endgame and achievements. |
| P19 | pending dependencies | Full matrix, actual required CI, independent review/QA, holdout, soak, human playtest. |

C0 in progress; C1–C4 pending. No G0–G7 gate is fully accepted.

## Feature traceability

Paths relative to `src/`. Existing test anchors are starting points, not proof.
Every feature requires positive/negative assertions, final SHA, exact commands,
evidence, independent review/QA and explicit remaining gaps before acceptance.

| ID | Owner / cards | Data → engine → store → UI | Required proof / test anchors |
| --- | --- | --- | --- |
| F01 | design/engine/frontend/QA; P06–P10 | classes → progression → playerStore → character | Seven legal growth/allocation/respec/save paths; playerStore/CharacterCreate tests; earned seven-class browser matrix. |
| F02 | technical/engine/QA; P06–P09 | monster/skills → combat/damage/turn-order → combatStore → CombatScreen | Exact seeded replay with summons, action timing, defeat/draw/resource failures; combat/turn-order tests. |
| F03 | design/engine/QA; P01/P06–P10 | skills → effects/combo → skillsHelpers/playerStore → SkillsScreen | 213 per-ID contracts, rank/breakpoint effects, automatic passives, real combos, eligibility and locale promises. |
| F04 | engine/frontend/QA; P07–P10/P13 | merc/skills → summons/mercToCombatUnit → merc/formation → merc/combat | Legal cap/start, actual contribution/death, one fielded merc, XP/equip/reload; summon/merc tests. |
| F05 | content/engine/frontend/QA; P03–P05/P08/P11–P12 | items/loot → loot/equipment-mods → inventory → inventory | Eligible materialized drops, combat delta, sets/granted skills/two-hand restrictions, art identity; loot/award/equip tests, earned boss proof. |
| F06 | content/engine/frontend/QA; P12 | runes/runewords/recipes → crafting → inventory actions → crafting | Earn→stash→assemble→consume→equip→persist; invalid transaction atomic; recipe/transaction/UI/browser tests. |
| F07 | design/engine/frontend/QA; P01/P13 | gacha → roller → meta/merc → MercsScreen | Earn/spend/pity/duplicate/collect/field/reload; roller/MercsScreen tests and earned recruitment browser case. |
| F08 | content/engine/frontend/QA; P04/P11/P14 | maps/monsters → sub-area-run/unlock → map → MapScreen | 29 reachable areas, five real boss wins, earned transitions; map/sub-area tests and fresh campaign checkpoints. |
| F09 | narrative/writer/frontend/QA; P04/P14 | dialogue/acts → loaders → map/quest → TownScreen | Correct hub/NPC/dialogue/services every act; new town/browser assertions. |
| F10 | content/engine/frontend/QA; P04/P14 | quests → objectives → map/claimReward → QuestsScreen | Event→complete→claim→unlock once, all reward kinds, recoverable overflow; event/claim/transaction tests. |
| F11 | game/level design/engine/QA; P01/P11/P15 | progression/economy → xp/stats/tree → player/rewards → character/skills | Exact XP/points/respec budgets, faucets/sinks/time-to-afford; production reward and simulation evidence. |
| F12 | engine/frontend/QA; P11 | maps → online-tick/combat → rewards → useIdleTicker | Manual-equivalent qualified outcomes, honest losses, no stop/map/background duplication; production caller still required. |
| F13 | engine/store/QA; P03/P11/P17 | idle contract → offline-bonus → meta/persistence → bonus UI | Persisted capped next-online bonus only, restart/rollback/consumption, no reload refresh; controlled clocks/restart tests. |
| F14 | technical/engine/frontend/QA; P03a | versions → validation/migration → adapter/persistence → SettingsScreen | Current Save/Export, serialized live import, identity/corrupt/future/quota/v7; validate/persistence/save-management unit/browser specs. Broader restart gate pending. |
| F15 | UX/frontend/writer/a11y/QA; P05/P16 | locales/tokens → formatting → settings → critical screens | Both locales, all target sizes, keyboard/focus/contrast/44px/zoom/stealth; full task matrix. |
| F16 | frontend/QA; P17 | manifest/cache → SW → persistence → install/reload | Production network-disabled warm reload/navigation/combat/save/update; PWA extension plus production mobile. |
| F17 | design/engine/content/frontend/QA; P01/P18 | D14 dungeon → runtime → progression → dungeon | Earned unlock, modifiers, two repeat clears, useful rewards, loss/retry/reload; new scenarios. |
| F18 | design/content/frontend/QA; P18 | D14 achievements → real events → owned rewards → achievements | Actual qualifying event/reward exactly once, ownership/utility/reload; new tests. |
| F19 | art/frontend/QA; P05/P16–P17 | overrides/manifest → cardAssets → identity → shared images | Cross-surface identity, failed-A→valid-B, fallback, provenance/payload/offline; resolver/shared images/browser tests. |
| F20 | frontend/UX/QA; P16 | agreed destination → settings → SettingsScreen | Low-key default-collapsed support link, no power purchase; generic expanded homepage insufficient. |
| F21 | performance/QA; P16/P19 | budgets → combat/playback → queues → screen/log | Measured feedback/frame/memory/log bounds, full inventory, two-hour soak. Build output alone insufficient. |

All feature rows remain partial/unverified. Mapping accepts no feature.

## Assertion and tooling debt

Strengthen required regressions atomically with their associated fixes.

- `full-loop.spec.ts`: require victory, intended nonzero loot, successful equip
  and legal allocation; remove optional paths/swallowed failures.
- `save-load.spec.ts`: remove mobile exclusion; replace allocation ≥0 with a
  known successful allocation and exact persistence.
- `no-gold-currency.spec.ts`: require victory/reward summary before currency
  assertions; verify no-gold runtime/data identities separately.
- `merc-fights.spec.ts`: require an actual merc action/contribution.
- `post-victory-cta.spec.ts`: require victory before victory controls.
- `loot-drop-rate.spec.ts`: boosted fixtures prove transport/eligibility only.
- Resolved tooling defect: `test:related` now uses `vitest related --run` for
  locked Vitest 1.6.1. Use `--project=engine` for a surgical engine loop; broad
  dependency fanout can exceed the related-test budget (BUG-003).

## P05a-image-source-recovery

State: accepted slice at `2458ee7`; independent frontend/QA implementation,
parent source review and integrated U/T/L/B plus D/M validation.
Own: `ui/GameImage.tsx`, `ui/GameCard.tsx`, their tests, focused browser spec,
and BUG-002. Depends on existing contracts; D13 resolver policy is separate.

1. error(A)→rerender(B) displays B without parent remount.
2. failure(B) restores stable fallback; missing source safe.
3. Preserve sizing/crop/stealth behavior.

Reproduce/report before patch, related RTL, integrated U/T/L/B and focused
actual-component desktop/mobile browser proof. This card does not accept F19.

## P03b01-legacy-container-visibility

State: accepted visibility slice at `90e4a67`; independent frontend/QA worktree,
parent source approval and integrated checks. Producer approved this
child before capacity/award changes. Own `BackpackGrid.tsx`, focused RTL and
browser specs, BUG-005 and scoped visibility contract (five files).

1. Every saved item remains visible/selectable above the display capacity.
2. Capacity controls empty placeholders only; 99/100/101 and 499/500/501 covered.
3. Ordinary import can recover the final over-cap item using existing actions
   on desktop/mobile; preserve unrelated items and persist recovery.

Do not lower insertion limits while reward callers ignore rejected `addItem`.
Shared limits, transaction atomicity and recoverable awards remain later P03b.

## Integrated validation at 22a2d13

P02a01, P06b and P03b01 are integrated. BUG-007 (`22a2d13`) additionally restores
saved language before startup ready; independent QA APPROVE. Test-first locale
reproduction: two failures before correction, then 46 related checks pass.
Inventory browser language reselection workaround was removed.

- U: 89 files / 856 passed / 1 existing merc-XP skip, 24.27 s.
- E: 38 files / 351 passed, 4.95 s.
- T/L/B: pass; build still warns about large bundles and unprecached asset
  manifest. No offline/performance acceptance follows from this build.
- D/M: all three focused specs (save-management, image-source-recovery,
  inventory-overflow-recovery), both projects, 16/16 passed, 52.3 s. Ordinary
  rendered locale/legacy recovery paths now agree after reload.

Exact commands for the integrated browser and U/E counts are in BUG-007.
Engine/full-unit timings exceed their 3 s/15 s budgets under concurrent checks.
P02a01 alone: 35 self-tests pass (1.46 s); full discovered suite at that slice
was 842 pass/1 existing skip (59.89 s). Type/lint pass, including forced lint
over the new test-tool files (normally ignored by repo lint); no suppressions.
`test:sim:contracts` is self-test validation, not a balance command.

Verified removed: `/tmp/d2h5-foundations-browser-locale`, task-owned `dist` and
`node_modules/.vite`. Dependencies and shared browser cache preserved. No push,
PR or deployment. C0 and every full feature/checkpoint/G0–G7 remain unaccepted.

## P02a03 next production adapter

Producer is deriving an implementation-ready production adapter/report split.
It must use actual creation, run/playback and award APIs. Current discovered
limitations to report rather than conceal: item allocator global state, idle
elite pity, and draw outcomes that currently advance/clear if the hero survives.
Current UI idle mode runs real combat; separate presumed-kill `useIdleTicker`
has no production caller. Fresh fixtures cannot inject clears to unlock idle.
