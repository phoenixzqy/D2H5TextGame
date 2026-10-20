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
| P02a02 | accepted input slice | `e5428a2` (agent `b35155d`); validated explicit seed/ordinal, preserved defaults/counter, 20 new regressions and independent source APPROVE. Full-run rewards remain open. |
| P02a03 | accepted screening/tooling slice | `3820a19` (agent `994cfd9`); real fresh creation/run/playback/awards, full recordings+hashes, actual source provenance, safe external CLI output. Root+producer APPROVE; evidence below. Full-run/idle/campaign measurement remains. |
| Remaining P02 | pending dependencies | Expanded production scenarios and diagnosed manual/idle/reward comparison remain. Historical proxy sim stays excluded. |
| P03a | accepted slice | `6f1dafd` + `76db166`; independent source approval, U/T/L/B and 10 browser cases pass. [Evidence](evidence/P03a-save-integrity.md). Full D12/G1/G6 remain unaccepted. |
| P03b01 | accepted visibility slice | `90e4a67`; all legacy items remain selectable above grid cap, seven boundary tests, four ordinary-control browser cases. BUG-005. |
| P04a01 | accepted objective slice | `ac49f52` (agent `d0343c8`); canonical Den area and atomic tracked clear objectives after qualified victory. Ten regressions, independent source APPROVE and integrated four-case browser proof. Return/talk/claim remain separate. |
| Remaining P03b/P04 | ready for reproduction | Shared capacity, atomic transactions/recoverable awards and quest event/reward integrity remain. |
| P05a | accepted slice | `2458ee7`; source-local error state, 13 focused tests and actual-component desktop/mobile proof. [Integrated evidence](evidence/P05a-P06a-foundations.md). D13/F19 remain open. |
| P05b01 | accepted resolver slice | `0c2d043`; D13 identity/metadata control, 29 new tests (25 red before fix), producer source APPROVE. Full suite + T/L/B pass. BUG-010; surface wiring remains. |
| P05b02 | in-progress | QA owns four consumers + browser proof from `3820a19`; shared instance helper and existing GameImage picker fallback. |
| P06a | accepted slice | `10ce45d`; battle-local summon identity, full A/A and A/B/A replay, live/dead collisions. Independent TD approval. [Evidence](evidence/P05a-P06a-foundations.md). |
| P06b | accepted deadline slice | `2cd350b`; inclusive 60,000 ms deadline, no overshoot, tied actors and exact/early victory. Five boundary tests, independent parent APPROVE; BUG-006. |
| Remaining P06–P10 | pending dependencies | D04–D06/shared effects first. All skills remain behavior-unaccepted. |
| P11a / P11a02 | accepted finalization slices | `d39fe64` actual-win/living-hero/playback guard and single clear; `d8db75c` truthful draw UI. Six root regressions, six RTL, 4/4 browser locale×viewport cases; independent QA/producer APPROVE. BUG-008. |
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

## Integrated validation at d8db75c

Includes P02a02 and qualified finalization plus draw UI. P02a02 test-first:
20 failures, then focused 46 passed/1 existing skip and 35 sim-contract checks.
P11a test-first: all six outcome regressions failed before patch. Six focused
UI terminal cases then reproduced both locale draw failures before correction.

- U: 92 files / 888 passed / 1 existing merc-XP skip, 28.59 s (>15 s budget).
- T/L/B: pass, including engine purity; build 13.47 s, same large-chunk and
  unprecached art-manifest warnings. Existing React act/router warnings remain.
- D/M: `combat-draw.spec.ts`, both projects × locales, 4/4 pass, 22.4 s. Actual
  import→map entry→Skip→failed run→return→export/save/reload preserves player
  and inventory, no clear/idle unlock. Imported durable fixture proves wiring,
  not fresh balance. Exact command/environment: BUG-008.
- No engine module changed since P06b; latest E evidence remains 351 passed.

Verified removed `/tmp/d2h5-combat-draw-browser` and scratch
`/tmp/d2h5-draw-test-draft.txt`, then task-owned `dist` and `node_modules/.vite`.
Root worktree remains claimed. Agent P02a02 worktree released cleanly.
No push, PR or deployment. All C0–C4/full feature/G0–G7 acceptance remains open.

## P02a03 production adapter

Implemented by `3820a19`, independently reviewed by root and producer. Six-file
exception approved: export existing `canonicalJson` instead of duplicating the
serializer. Source/data collected before dynamic gameplay import and after
restoration; drift rejects output. Includes actual HEAD/tools, working/untracked
allowlisted bytes, manifest and dirty state. Six stores, idle pity and exact
Date.now restore in finally; active runs rejected, playback/progression bounded.
External absolute new-leaf output only, no overwrite or repository output.

Actual command at clean `3820a192ad336f1f5b739313cdd19212689595f2`:
`SIM_REPORT_PATH=/tmp/d2h5-p02a03-integrated-3820a19.json npm run sim:production -- --reporter=dot`
passed 1 measurement test, 3.98 s. Default fixture
`fresh-sorceress-blood-moor-v1`, seed1 twice, ordinal0, fixed clock1792454400000.
Full raw teams/events/results/rewards preserved with versioned event hashes.
Root independently parsed report and recalculated every event SHA-256.

- Each repetition wins wave1, loses wave2 of3: defeat, no victory or map clear,
  diagnostics empty. Retains160 cumulative XP (level2+60), three items and
  actual currency awards. No boost/injected clear or fake fresh progression.
- Raw battle recordings equal. Raw rewards/full replay unequal because item
  IDs differ; semantic rewards equal after omitting only top-level Item.id.
  Allocator remains process-global/unreset with unobserved initial sequence.
- Logical duration48.96 s; summed UI-delay hints62.82 s; measured wall time
  0.114/0.066 s. Hints are not browser time or active campaign time.
- Source tree `1febfbad994508bb3d3379c1c11cd1594989f58c98d0fe9ec6a358d4c582a1e9`,
  data `554a37ebe4c901d0ae62a7cf787627cb6e351a780dd330e1e3680e198dd28e41`,
  fixture `417c23da69d805daaefa8b9169eb55ad7d641b6818d642dd644d5d20a8c7eae6`;
  401-file manifest, dirty=false. Report SHA-256
  `5f8b6e1df28c5ed6567f1f530b01a829244cd22fdfc969fddd1bc9220222189f`.
- Wave event digests:
  `6c324846b1207d9212b01b1e2c044c980805b1b7537d6a30f18353e00ca69f4b`,
  `3357e5b7b771c0012bff7eb5531d22f532667a5c07c535197d072f9d90a3236a`.

Full recordings were consumed before disposable report cleanup. No idle
comparison: fresh fixture is ineligible. Current UI idle uses real combat;
separate presumed-kill useIdleTicker still has no production caller.
No campaign/pacing/statistical/whole-P02 acceptance follows from one seed.

## Integrated validation at 3820a19

Includes P04a01, P05b01 and P02a03. Den's authored return objective remains
false/inProgress/no claim after a real clear; its Chinese return text currently
falls back to English. That localization gap and NPC interaction remain open.

- U:96 files /939 passed /1 existing merc-XP skip,23.17 s (>15 s budget).
- T/L/B:pass, including forced lint on normally ignored sim files; production
  build6.51 s, existing large chunks/unprecached manifest warnings remain.
- D/M: Den spec4/4 pass,28.4 s, en/zh-CN ×1280×800/360×640. Ordinary import,
  quest start/map entry/Skip/victory/return/export/save/reload; partial objective
  and exact player/inventory/map persistence asserted. Imported powerful hero
  proves event wiring, not earned balance. Exact command:
  `E2E_PORT=4290 npx playwright test tests/e2e/quest-area-clear.spec.ts --project=chromium-desktop --project=mobile-portrait --workers=2 --reporter=line --output=/tmp/d2h5-den-integrated`.
- P05b01 focused47 pass, final1.79 s. Source producer APPROVE; no new art.
  No engine source changed; latest standalone E remains351 passed.

Verified removed root task-owned `dist`, `node_modules/.vite`,
`/tmp/d2h5-den-integrated`, `/tmp/d2h5-integrated-unit-3820a19.log` and
`/tmp/d2h5-p02a03-integrated-3820a19.json` after consumption. Agent adapter's
report also consumed/removed; its worktree released cleanly. Installed
dependencies/shared browser cache preserved. Root worktree remains claimed.
P06c shared periodic timeline/death transaction has technical plan approval;
game-design contract review underway, no runtime edit yet. P04a02 talk/NPC
contract planning is read-only. No push/PR/deployment. Full v1 remains open.
