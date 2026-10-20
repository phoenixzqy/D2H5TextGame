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
| P03b02 | accepted ingress slice | `a79ef1f`; retain complete earned/returned overflow, actual victory/merc/save integration,16 focused regressions; producer source APPROVE. Shared regular-action guards remain. |
| P04a01 | accepted objective slice | `ac49f52` (agent `d0343c8`); canonical Den area and atomic tracked clear objectives after qualified victory. Ten regressions, independent source APPROVE and integrated four-case browser proof. Return/talk/claim remain separate. |
| P03b03 | accepted transfer slice | `6d76f64` shared constants/copy (agent `d9f5835`), `36a819d` authoritative100/500 transfer guards and selected refusal/retry. Producer source APPROVE; four ordinary locale/viewport recovery cases. Equipment guards remain. |
| P03b05a | accepted merc equipment integrity slice | `45d44c3`; current source/owner validation, complete transfer/normalized returns and localized retained refusal. Root/producer APPROVE/ADEQUATE;58focused/1307full and4/4browser. [Evidence](evidence/p03b05a-merc-equipment-integrity.md). Manual capacity accepted below; combat/stat integration remains. |
| P03b05b | accepted manual merc capacity slice | `854e88f`; refuse manual return at>=100 before publication; preserve non-growing swaps/equips and unbounded durable ingress; persistent localized recovery. Root/QA/producer APPROVE/ADEQUATE;75focused/1349full and4/4browser. [Evidence](evidence/p03b05b-merc-equipment-capacity.md). |
| P04a02 core/locales/UI | accepted talk path slice | `2d60095` ordered exact current-town talk; `392e671` localized roster/greetings; `0a84010` UI (agent `2702b81`). Root+producer source APPROVE; real Den→Akara→explicit claim→save browser matrix. Full town/quest families remain. |
| P04a03a | accepted central schema prerequisite | `b4d2764` runtime / `74cb889` tests. Central quest document schema and validate-before-collect; BUG039, reviewed genuine20 accepted-invalid RED, frozen tests136 plus unchanged integrity30 pass. Full1904/127, T/L/build and unchanged80%engine coverage pass. Direct imports, crossrefs, quest execution/rewards remain open. |
| Remaining P03b/P04 | ready for reproduction | Shared capacity, atomic transactions/recoverable awards and quest event/reward integrity remain. |
| P05a | accepted slice | `2458ee7`; source-local error state, 13 focused tests and actual-component desktop/mobile proof. [Integrated evidence](evidence/P05a-P06a-foundations.md). D13/F19 remain open. |
| P05b01 | accepted resolver slice | `0c2d043`; D13 identity/metadata control, 29 new tests (25 red before fix), producer source APPROVE. Full suite + T/L/B pass. BUG-010; surface wiring remains. |
| P05b02 | accepted surface slice | `96eb70c` (agent `060cb4f`); all four consumers share instance identity, picker GameImage fallback; root source APPROVE and integrated four-case locale/viewport browser proof. |
| P06a | accepted slice | `10ce45d`; battle-local summon identity, full A/A and A/B/A replay, live/dead collisions. Independent TD approval. [Evidence](evidence/P05a-P06a-foundations.md). |
| P06b | accepted deadline slice | `2cd350b`; inclusive 60,000 ms deadline, no overshoot, tied actors and exact/early victory. Five boundary tests, independent parent APPROVE; BUG-006. |
| P06c01 | accepted periodic slice | `6c7f049` (agent `ff3787e`); shared status/lethal/expiry boundaries, fractional carry, simultaneous death/orphan transaction;31 focused regressions, root+producer source APPROVE. Boss milliseconds and cross-wave rebasing remain. |
| P06c02 | accepted boss-duration slice | `030de58` (agent `53c08fe`); configured boss multiplier once on unrounded milliseconds, legacy lifecycle retained;56 focused cases incl16 real combat cases; root+producer source APPROVE. Cross-wave rebasing remains. |
| P07a01a/b/c1 | accepted definition/composition slices | `a35ef02` authored validated recovery coefficient, `07e8514` authored trigger identity, `938ed96` pure authoritative Energy/rank composition. Independent review and exact boundary controls recorded below; no timed recovery acceptance. |
| P07a01c2 | accepted adapter slice | `1860bc6`; authoritative per-wave gear/core/learned config, frozen ordinary recording, original-resource replay/clamp/no refill. Genuine RED13/56; full1602/124/T/L/B pass. Store coverage diagnostic exits1 at77.9%branches; engine-only threshold applicability and changed43/43 statements independently reviewed. Warmth runtime/browser remain open. |
| P07a01d | accepted fire/passive slice | `5a53d37` (worker `f80b6a9`), separate active-buff fixture `727da6b`; actual composed fire bonus and passive action exclusion. Genuine RED22/38; engine780/full1640/T/L/B/coverage pass, root/QA/producer APPROVE. Timed recovery and browser remain open. |
| P07a01e | accepted mana transport slice | `dd236eb`, reviewed RED/BUG036 `48e1412` + post-fire RED `35365c3`; exact absolute cast/refund/orb playback and resulting-cap carry cleanup. Focused32/full1661/T/L/B/80%engine coverage pass; producer/QA APPROVE. No timed recovery yet. |
| P07a01g UI prerequisite | accepted bounded display slice | BUG037; live hero MP strip and true bar maxima. Genuine corrected RED2/12; GREEN12/full1667/T/L/B pass. Ordinary Fire Bolt102→94MP,14/14 viewport/locale geometry and readable en/zh screenshots, independent QA/producer APPROVE. Full earned Warmth proof remains open. |
| P07a01f | accepted exact recovery slice | `775eab7`; exact decimal MP-ms integration, reviewed genuine RED,893engine/900related/1790full/T/L/build/unchanged80%enginecoverage pass. BUG038 and independent root/producer/QA final APPROVE. Timing and build warnings remain open. |
| P07a01g earned browser | accepted bounded earned/save proof | Four production cases, en/zh-CN × desktop1280×800/mobile360×640, no retries/skips/page errors. Ordinary learned/upgraded rank, old/fresh wave MP99/101/108/109, old/new fire74/75, complete save/reopen and resumed102→103MP. [Evidence](evidence/p07a01g-earned-warmth.md); root/producer/QA APPROVE/ADEQUATE. |
| Remaining P06–P10 | pending dependencies | D04–D06/shared effects first. All skills remain behavior-unaccepted. |
| P08a01 | accepted fire-status-family slice | `11eb6b3` (worker `ca66d0a`); central burn/ignite identity, production ranked Fire Bolt full3s DoT and legacy/combo/refresh/removal. BUG029; root/producer APPROVE/ADEQUATE. Combined1332pass; ordinary skill UI/fullP08/C1 remain open. |
| P08a01b/c | accepted earned skill and display slices | `0dbbef2` ordinary earned Fire Bolt/save/reload production route; `a150f5b` truthful damage/CD/DoT units in both locales. Independent evidence below; full skill behavior remains open. |
| P08a01d | accepted bounded cast names | Tests/browser `0df510a`; authored/canonical names, genuine33RED/12controls; focused45, related525/full1939/T/L/build/engine coverage and native8browser pass. Root/producer/QA final APPROVE/ADEQUATE; exact evidence below. |
| P08a04a | accepted representation prerequisite | Tests5fe184b; exact-two optional secondary Freeze schema/shared types and general exclusive nonempty readonly on-hit list. Focused195, engine893, related1142/full1998, T/L/build/coverage pass; root/producer/QA APPROVE. No authored/adapter/combat behavior change; B remains open. |
| P08a02 | accepted bounded curse slice | Metadata `8b1f497`, authored definition `554a922`, runtime `f3f9086`; BUG031 fixed after genuine RED. Actual Amplify Damage rank/duration/resistance/refresh/replay controls independently approved; full curse families remain open. |
| P08a03a/b | accepted Minor Heal slices | `091d9b0` actual authored range/registry, `ec0de97` deterministic lowest-relative-HP targeting and true healing. Independent root/QA/producer review and final combined evidence below; broader healing/merc acceptance remains open. |
| P11a / P11a02 | accepted finalization slices | `d39fe64` actual-win/living-hero/playback guard and single clear; `d8db75c` truthful draw UI. Six root regressions, six RTL, 4/4 browser locale×viewport cases; independent QA/producer APPROVE. BUG-008. |
| P11–P15 | pending dependencies | Rewards/idle, eligibility, economy, campaign and pacing. |
| P13a | accepted progress-default slice | `8e6076e` (agent `6db69b6`); actual-level defaults/getter/award and UI fallback, explicit stored thresholds retained, real combat skip restored. Root/producer APPROVE; full1290pass/no skips. |
| P13b | accepted visible earned-progression slice | `5143a2c`; live owned core stats/unknown definitions, genuine2-case RED, ordinary production obtain/field/three qualified waves/L3→L4/Save/close-reopen,4/4 locale×viewport. [Evidence](evidence/p13b-earned-mercenary.md). Root/producer APPROVE; fullP13/economy open. |
| P17a/P17b children | accepted bounded slices | Bonus/save/true close-reopen/offline/art-help/configured-version update evidence recorded below; installation/Lighthouse/fullG6/P17 remain open. |
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

## Integrated item surfaces and quest talk core

At `96eb70c` plus P04a02 core (committed `2d60095`), root validation:

- U:97 files /952 passed /1 existing merc-XP skip,25.75 s (>15 s budget).
- Focused core:13 talk +10 clear =23 passed,2.66 s then2.53 s. Before patch
  12 missing-API failures; BUG-012 filed before runtime changes.
- T/L/B pass, including explicit ignored-E2E lint. Build5.02 s; existing
  large chunk and2.57 MB manifest precache warnings remain. No engine source
  changed; latest standalone E remains351 passed.
- D/M: item-art+prior Den specs8/8 pass,40.5 s, en/zh-CN×1280×800/360×640.
  Command is in BUG-010. Shared art is verified through ordinary inventory
  controls, including identity-specific failure/recovery. Den spec here still
  proves only clear objective and persistence, not NPC hand-in.
- Core API validates current-act canonical roster, tracked/unclaimed/current-
  act quest and pre-event predecessors. Actual seed7/ordinal0 Den clear,
  separate talk, separate explicit claim and exact XP/level/quest-point budgets
  pass. Strong hero proves wiring only. No automatic rewards/new map unlock.
- Producer independently APPROVE of the five-file core and five-file locale
  child. Locale `392e671` adds all5 authored ActI NPC names/greetings and honest
  Akara states, corrects Den return objective in both locales. Agent JSON leaf
  parity town23/quests155,15 focused tests,U939/1skip,T/L/B,4 Den browser cases
  pass. Combined NPC UI/claim/save validation follows in P04a02c.

Verified removed `/tmp/d2h5-p04a02-unit.log`, `/tmp/d2h5-p04a02-browser`, root
`dist` and `node_modules/.vite` after every consumer/process completed. Locale
agent also cleaned/released worktree4; root remains claimed. No push/PR/deploy.
P06c01 periodic timeline/death transaction implementation is in progress in
worktree3 after23-test RED evidence. C0–C4 and full feature/G0–G7 remain open.

## P06c01 periodic timing and P03b02 lossless ingress

P06c01 integrated as `6c7f049` (agent `ff3787e`), six-file bug-report exception
approved; root and producer independently APPROVE. Initial23 periodic cases:
21failed/2passed before patch; final31 pass. Shared simulation boundaries now
settle living units together through inclusive60000ms, pooled fractional damage,
earliest integer-ms lethal boundaries and half-open status intervals. Deaths
close transitive orphan sets before ordinary effects; simultaneous hero lethal
cannot be rescued by boss orbs. Legacy/future status and refresh semantics are
explicit in D04. Boss milliseconds/cross-wave rebasing/seeded ties remain open.

Clean exact agent `ff3787e` production screening independently consumed and every
event hash recalculated by root. Report SHA256
`bcd2e2f630974715f2198e3280f0e0a09fc929ee34121dbb3ac7888567a30398`, source tree
`9f15f36a5c90376faffb39733f39a1862e5e2cac857c90fc76566d9785a1499f`, unchanged
data/fixture hashes from P02a03. Fresh seed1 twice still wins wave1 then loses
wave2/3:160XP,3items,80rune-shards,1gem,no clear,empty diagnostics.48.96 logical
seconds/62.82 UI hints are not active/browser time. Raw recordings/semantic rewards
equal; raw reward IDs/full replay differ. Scenario emits zero DoT events, so it
does not accept periodic behavior. Event wave0 count297/hash
`21df75abe7e9f9a412dcaaff2123f05a2be15fe607da904e0f15435435e57351`; wave1 count63/
hash `3357e5b7b771c0012bff7eb5531d22f532667a5c07c535197d072f9d90a3236a`.
Earlier wave0 digest differs; cause is unproven because old raw report was
already removed. Report was consumed before agent cleanup/release.

P03b02 `a79ef1f` removes only silent ingress rejection.16focused pass3.83s
(initial final baseline8failed/8passed); real stock-TC seed7 awards3nonzero items,
rendered merc unequip/swap conserves all owned IDs, public serialization/import/
reload preserves overflow and affix Maps. Producer independent source APPROVE.
Regular100/500 transfer/equipment guards and whole P03b remain open. BUG-013
contains exact reproduction and command evidence; no save-shape change.

Root combined validation at `6c7f049` plus final four-file ingress patch:

- U99 files/999passed/1 existing merc-XP skip,27.01s (>15s budget).
- E39 files/382passed,5.77s (>3s budget); agent E3.18s. Agent periodic-focused
  coverage combat95.52%lines/83.92%branches, status99.02%lines/93.61%branches.
- T/L/B pass; lint-only redundant test condition fixed and focused/T/L rerun.
  Build10.95s with existing chunk/2.57MB manifest precache warnings.
- Existing overflow browser4/4pass26.4s,en/zh-CN×1280×800/360×640; actual award/
  merc ingress remains integrated RTL/store proof. Command in BUG-013.

Town UI child P04a02c final review APPROVE after mounted act roundtrip focus
regression correction; agent final gates active, not yet integrated. P06c02
boss-duration plan under independent review; no runtime change yet.

Verified removed root task-owned `dist`, `node_modules/.vite`, exact
`/tmp/d2h5-p03b02-{focused,related,unit,build,browser}.log` leaves and
`/tmp/d2h5-p03b02-browser` after every consumer/process ended. Agent periodic
report/build/coverage cleaned and worktree3 released; root remains claimed.
No push/PR/deployment. Full v1/C0–C4/G0–G7 acceptance remains open.

## Integrated town dialogue, guarded transfers and boss milliseconds

Current implementation head `030de58` includes town UI `0a84010` (agent
`2702b81`), capacity/copy prep `6d76f64` (agent `d9f5835`), guarded transfers
`36a819d`, and boss duration `030de58` (agent `53c08fe`). All scoped source
reviews independently APPROVE; no feature/checkpoint/global gate is accepted.

Town source-before-patch RTL2locale failures and desktop browser missing-region
failure preceded runtime edit. Review found mounted act1→2→1 Close targeting a
detached button; two-locale failing focus regression preceded selected rendered
button ref fix. Final8 town RTL +13 talk +10 clear =31 pass; root integrated
3.91s. Agent full960/1skip27.05s,T/L/forced3filelint/B pass5.27s. Agent browser
initial3/4 had unexpected welcome during combat; unchanged-source rerun4/4 and
final reviewed-source4/4 pass30.3s. Root integrated town4/4 pass20.7s. Ordinary
strength-only import→early no-banking→track→real Den waves→wrong NPC no-op→Akara
completes without grants→explicit500XP+automatic level points+extra1skill→repeat
disabled→save/export/reload equality. Imported power proves wiring, not balance.
Town current-act roster, localized live stages, focus/keyboard and44px controls
covered. Later-act authored dialogue/services and all objective/reward kinds open.

Transfer initial12/12 fail4.46s and desktop browser no-toast failure preceded
runtime edits. Final12 pass4.24s; preboss full1019/1skip31.45s,T/L/B pass5.65s.
Review confirmed refusal no publication/state change, missing-source precedence,
exact one-item transfer and retained selection. Existing browser changed
deliberately from accepting full targets to refusing both directions at101/501,
then exact three explicit discards and successful transfers. First4/4pass42.2s;
forced lint found legacy stream typing, replaced with typed download-file read;
forced lint and4/4 rerun26.1s pass. Exact commands in BUG-015. Ingress remains
lossless; equipment/merc/crafting atomic guards remain open. Prep locale140leaf
parity/unique/nonempty,T/L passes; no behavior claimed for constants/copy alone.

Boss timing initial56 cases29fail/27pass1.05s, including8 actual exact-expiry
combat failures and8 inside-interval controls. Final56 pass1.01s, agent438engine
pass3.44s/full1039pass1skip23.63s,T/L/B pass. Explicit milliseconds win before
one boss multiplier; positive scaled values floor/min1ms, zero/nonpositive fresh
control inactive. Existing finite/indefinite refresh and legacy lifecycle remain.
Root+producer reviewed exact four files. Cross-wave clocks/ties/full D04 open.

Root final combined validation at clean implementation `030de58`:

- U102files/1075passed/1 existing merc-XP skip,28.41s (>15s budget).
- E40files/438passed,4.27s (>3s budget).
- T/L/B pass, including40 engine-purity files; build7.79s with existing large
  chunks and2.57MB manifest precache warnings. No PWA/performance acceptance.
- Browser8/8pass53.7s, two specs×en/zh-CN×1280×800/360×640. Command:
  `E2E_PORT=4300 npx playwright test tests/e2e/inventory-overflow-recovery.spec.ts tests/e2e/quest-town-return.spec.ts --project=chromium-desktop --project=mobile-portrait --workers=2 --reporter=line --output=/tmp/d2h5-030de58-browser`.

Next: P06c03 exact terminal-clock cross-wave rebasing plan, P03b04a authoritative
stored equipment before P03b04b net-displacement capacity/UI. BUG-016 reserved
cross-wave; BUG-017 equipment capacity; BUG-018 stale equipment payload.

Verified removed root `dist`, `node_modules/.vite`, the exact tracked task-owned
`/tmp/d2h5-town-integrated-*`, `/tmp/d2h5-p03b03-*` and `/tmp/d2h5-030de58-*`
leaves listed by cleanup after every consumer/process ended. These prefixes
describe verified individual paths, not wildcard deletion. Agent town/copy/boss
worktrees cleaned/released. Root remains claimed for the continuing objective.
No push/PR/deployment; full v1/C0–C4/G0–G7 remain open.

## Authoritative equipment, residual status clocks and persisted bonus arithmetic

Integrated source: P03b04a `76c178c` (agent `d0fbeeb`), P17a01 `15da36b`,
P06c03 `cae5501` (agent `3b3f8d6`). Root and producer independent reviews
APPROVE each scoped source/contract. Complete checkpoints remain open.

P03b04a resolves the current first matching backpack item before base/eligibility
checks, uses that complete authoritative payload and removes one source index.
Nine real-store behavioral RED failures1.78s precede the patch; GREEN9pass1.70s.
Related347pass/1existing skip19.07s; agent full1084pass/1existing skip,103files,
57.94s; T/L/forced lint/B pass11.56s. Exact Maps/flags/derived mods, both stale
handedness/requirement directions, same-ID conservation and no-op refusal
publications covered. BUG-018 retains evidence; hero capacity remains P03b04b.

P06c03 captures the original finite bounded terminal simulation clock before
presentation, fails closed before recording publication, and rebases status
timestamps once at qualified actual next-wave transitions. Genuine production
two-wave poison RED2/2 preceded runtime changes (BUG-016). Engine13/UI16focused
pass; agent engine451pass7.78s/full1104pass/1existing skip,104files,58.08s;
T/L/B pass. Related coverage284pass/1skip: status99.1%statements/96.39%branches/
100%functions, combined95.62%/83.65%/97.14%. Root integrated cross-wave plus
outcome qualification35pass3.08s. Periodic-only500ms terminal, residual/future/
expired clocks, real control actions, replay/pause/no-double-subtraction, merc/
summon policy and malformed-clock abort covered. Seeded ties and broader
cooldown/buff carry policy remain open; no campaign balance acceptance.

P17a01 is an uncalled pure three-file foundation, not a runtime offline fix.
v7 current multiplier/remaining seconds support linear checkpoints and resume
against max(lastOnline,save.timestamp), retaining stronger/tied windows.
offlineTime is cumulative informational milliseconds; fresh bonus uses only
the current gap. Nonfinite inputs/derived overflow reject; rollback reanchors.
Initial missing-module RED had0collected cases,.937s (no behavioral bug claim).
Numeric tuple regression1fail31pass1.19s preceded rounded-to-one cleanup.
Producer found uncapped tie comparison error; added1.16/7 after2h regression
failed1/34in2.98s, then stored-multiplier comparison fixed it. Final pure34+
existing8pass1.22s. Lint found unsafe JSON assignment in test; explicit fixture
cast fixed it without suppression; final T/L pass. Reward/UI authority,
startup/import/close persistence, hidden interval ownership and PWA remain open.

Root combined equipment+arithmetic full1118pass/1existing skip,104files,29.10s;
final arithmetic engine472pass,41files,3.98s. These predate P06c03 integration;
do not present them as final combined timing validation. Current `cae5501`
build passes6.01s with existing large-chunk/manifest precache warnings. Earlier
concurrent engine470pass15.22s and build28.29s predate tie correction and are
superseded. Test-loop timing budgets remain unmet. Browser follow-up and final
combined gates remain pending. Agent worktrees cleaned/released; root continues
claimed. Root `dist`/`.vite` are task-owned, pending cleanup after consumers.

## Persisted startup, capacity, seeded ties and online checkpoints

Integrated P17a02 `6af6893`, P03b04b `b9da90b` (agent `e16c5c5`),
P06c04 `b97b12e` (agent `a6d87f4`), P17a03 `50bee46`. Root/producer independent
source/test/control reviews APPROVE each. Full v1/C0–C4/G0–G7 remain open.

P17a02 reconciles startup once per page, persists before publication and orders
startup/raw restore/import/delete. BUG-019 records behavioral RED3/3, expanded
original-source10fail/3pass, delayed IO/recovery and exact restore coverage.
Focused48pass3.94s; pre-capacity/scheduler U1160pass/1existing merc-XP skip,
107files38.74s; E485pass42files3.93s; T/L/B pass17.42s. No reward/UI/PWA proof.

P03b04b preflights complete hero equipment displacement against max(100,current
backpack length); legal nongrowing/reducing overflow swaps remain usable.
Refusals retain exact refs with no publication/recompute and localized feedback,
including inline picker polite live region. BUG-017 agent RED23cases11fail/
12pass preceded source; GREEN23pass5.57s/related66pass6.26s/U1107pass1skip,
104files41.75s/T/L/B pass6.43s. Root integrated equipment/capacity/startup45pass
6.66s; ordinary en/zh-CN×desktop/mobile capacity4/4pass27.4s on4314. Both later
browser matrices also capacity4/4pass at final checkpoint runtime source.
Merc/craft/full P03b remain open.

P06c04 exact scheduled-time ties use fixed per-unit priority from dedicated
seed fork, including summons, preserving non-scheduler insertion consumers and
main combat RNG. BUG-020 retains actual prepatch first-actor/freeze failures,
deadline/unequal-period/collision/inert-boundary/real-summon coverage. Producer
found initial untied oracle too weak; genuine prepatch stochastic oracle now
freezes crit200@1300, miss@1700, hit100/victory@2600 and fails a main-RNG-rank
mutation. Source restored/scratch removed. Agent focused17pass1.18s/E497pass
7.83s/U1159pass1skip106files30.60s/T/L/B pass. Combat.ts95.57%statements/
84.16%branches/100%functions,228related tests. No out-of-scope fixture edits;
broader D04/P06/balance acceptance remains open.

P17a03 one transient anchor accompanies the sole raw idle tuple. Shared read-only
projection consumes online time; save/export use one sampled timestamp and leave
tuple/anchor untouched. Exact raw restore/import preserve historical fields and
anchor at successful publication; startup retains reconciliation sample including
awaited storage time. Partial bonus edits project before merge; metadata/no-op
edits preserve basis; explicit timestamp supplies basis. Changed mixed patches
deliberately replace explicit numeric/basis values even if equal to raw history.
Projection failure preserves flushSave's rejected-Promise shape/error/retry.
No schema/duplicate tuple/UI/reward changes. BUG-021 actual stale production
save/export RED3/3failed2.87s, expanded22/22RED3.28s before source; GREEN22pass
3.21s/related70pass3.68s. Two mixed-patch contract tests bring total to24.

Final combined source through `50bee46`: U1219pass/1existing merc-XP skip,
109files27.01s; E497pass42files3.98s; T/L/forcedlint/B pass, build6.98s.
Full15s/engine3s budgets remain exceeded. Existing React act/router, large-chunk
and2.57MB manifest precache warnings remain. No PWA/performance acceptance.

Browser regression initially8pass/6fail41.7s: legacy tests expected old idle
clocks. Approved sixth-file update retains the original old-autosave/import
durable cancellation oracle. First corrected14case run11pass/3fail1.1m exposed
invalid fixed500ms checkpoint assumption and frozen mobile toast covering Cancel.
Final tests observe native IDB read-only, verify complete committed payload
against known fixture with bounded projected clocks, derive exact startup gap,
require full restored equality and same-clock second reload. Frozen malformed
import uses ordinary Escape. Final save-management10/10pass22.4s on4320; all
capacity cases pass at same runtime source in prior runs. Forced-spec lint and
diffcheck pass. No runtime changed after U/E/T/L/B, only browser/docs corrections.

Verified absent after all consumers ended: root dist/node_modules/.vite,
`/tmp/d2h5-b9da90b-capacity-browser`,
`/tmp/d2h5-b97b12e-checkpoint-browser`,
`/tmp/d2h5-b97b12e-checkpoint-browser-final`,
`/tmp/d2h5-b97b12e-save-browser-observed`.
No root processes remain. Finished claims released; original main untouched.
No push/PR/merge/deployment performed.

Next approved P17a04 shared displayed bonus, controlled ordinary save/reload/
countdown proof; D12 records contract. Root worktree2 remains claimed. Design
agent claimed worktree3 for independent BUG-023 prerequisite: positive XP strips
equipment stats. Fix the root before actual XP/MF integration; no snapshot-only
workaround. Reward rounding/MF policy, lifecycle/hidden intervals/PWA and broader
checkpoint acceptance remain pending.

## Shared bonus UI, XP equipment integrity and lifecycle ownership

Integrated BUG023 `2fdf9e7` (agent `f42fb6e`), P17a04 `2145535` (agent
`8c2887f`), P17a06 `22e2461`. Root/producer independent final source/test/control
reviews APPROVE all three. Original main remains untouched; no push/PR/merge/
deployment. Full v1/C0–C4/G0–G7 remain open.

BUG023 extracts existing equipment stat composition into one private pure helper
and uses it for recomputeDerived and every positive XP award at the capped target
level. Authoritative inventory gear is read once at action time; one publication,
no modifier stacking, source mutation or stale player.equipment authority. Real
equip→XP RED8fail/5pass1.78s before runtime, GREEN13pass1.68s; repeated/level/
multilevel/cap/clamps/unequip/noop/entry-order cases. Agent related427pass/1skip
17.28s, U1208pass/1skip25.91s,T/L/Bpass5.28s at its dependency base. Final combined
head below includes its13 cases. It is the required root fix before repeated-wave
XP/MF bonus integration, rather than snapshotting around equipment loss.

P17a04 real mounted UI now reads the common raw-tuple/anchor projection at actual
render time. Localized banner/chip show current percentage and ceil-minute window,
no invented original peak. <=30s/short-expiry timer plus visible-return wake never
publish/reanchor. Old transient helper accrual tests are explicitly superseded by
real hook/UI/import/timer/StrictMode tests; engine arithmetic tests remain.
Genuine original RED10/10 then visible extension11/11 preceded runtime. Producer
found rollback left one-shot duration unchanged and stopped scheduling; actual
RED1fail/11pass3.60s preceded wake-counter correction, final12pass3.45s. Final
agent U1227pass/1skip109files37.89s,T/L/forcedlint/Bpass13.27s. Ordinary en/zh×
desktop/mobile4/4pass24.3s covers import600online seconds→Save/same-clock reload→
home banner/remount→600seconds→expiry and mounted short replacement. Imported
fixtures prove wiring, not earned campaign progress. BUG022 retains full evidence.

P17a06 persistence owns one30s interval and visibilitychange hidden/visible+
pagehide projected checkpoints. stop removes domain/event listeners, interval
and debounce; already submitted writes may finish. Open hidden/BFCache pages
remain online and cannot grant fresh bonus. Startup alone resumes away gaps.
Obsolete App/meta lastClosedAt/markClosed removed after UI integration, without
stopping cached page-lifetime initialization from App cleanup. No schema/reward
change. Pagehide IO remains best effort; throttled/terminated callbacks cannot
guarantee a30s staleness bound. P11 background combat catchup remains open.

BUG024 genuine initial lifecycle RED12fail/4pass2.89s. First source15pass/1fail
revealed pre-hasSave startup suppression gap; fixed16pass2.78s. Removing only
queued-replacement flush guard makes real rawHydrate→queuedImport callback case
fail2writes vs1; exact source restored. Related four persistence suites67pass
9.59s under concurrent checks. Final combined source through22e2461:
U1256pass/1existing merc-XP skip111files29.56s; T/L/Bpass, build6.67s. Full15s
and surgical5s loop budgets remain unmet; existing React act/router, large-chunk,
stale Browserslist and optional2.57MB art-manifest precache warnings remain.

Final ordinary save-management+bonus browser matrix14/14pass40.2s on4322,
en/zh-CN at1280×800/360×640. Preserves complete export/import/reload equality,
malformed-input state, quota/export recovery and all tested viewport controls.
No runtime source changed after combined checks. These dev-server checks do not
establish true-close/away, production network-disabled/PWA, earned progression,
performance or fullP17 acceptance.

All agent task outputs/claims released; root remains claimed worktree2. Verified
absent after all consumers finished: agent worktree3/4 dist/.vite, exact worker
browser output paths in BUG022, root dist/node_modules/.vite and
`/tmp/d2h5-p17a06-browser`. No task processes/cleanup failures/disposable artifacts
remain. Source/history/installed shared browser/tool caches retained.

Next: design agent owns approved six-file P17a05 actual production-wave rewards
from2fdf9e7, BUG025; root owns integration/control. Locked math is per-kill XP
floor before sum with same total for current merc share, and multiplier AFTER
existing effectiveMF inner floor with no new outer floor/cap (raw300×1.5 gives
effective490.5). Qualification/playback/winner/live-original-hero precede one
award-time clock sample. No bonus mutation or extra RNG draws. True-close/reopen
ordinary browser P17a07 is a separate QA card under review; production/PWA,
broader P11/P17 and the campaign/class/economy checkpoint gates remain open.

## Actual bonus rewards, true close/reopen and production offline gameplay

Integrated P17a05 `e21545c` (agent `56ee222`), P17a07 `6354bd8` (agent
`a05f85a`) and root P17b01 `f7b6346`. Independent root/producer final
source/test/control reviews APPROVE each. Full v1/C0–C4/G0–G7 remain open;
original main is untouched and no push/PR/merge/deployment was performed.

P17a05 samples the shared bonus once after playback/qualified win/live original
hero/slain non-summon checks, before side effects. XP sums per-kill floors;
existing merc share uses the boosted total. Effective MF multiplies after the
existing diminishing-return floor with no new cap/outer floor, default1 and no
extra RNG draw/fork. Forced/direct rewards, GF/currency quantities, noDrop and
first-kill semantics remain. BUG025 genuine RED4fail/13pass5.44s preceded source;
final19pass3.19s includes real two-wave combat/XP/gear/merc path with controlled
unforced TC only at loader boundary, separate real-data forced-rarity control,
tight490.5-vs490/raw-MF threshold and complete default reward/next-RNG oracle.
Imported high-power fixtures establish integration, not earned campaign/balance.

Combined runtime at `e21545c`: U1275pass/1existing merc-XP skip112files34.07s;
E497pass42files8.43s. Runs were concurrent, exceeding15s/3s loop budgets; these
are functional results, not performance certification. Subsequent work through
f7b6346 is tests/docs/config only. Final T/L/forced PWA config+spec lint pass;
fresh guarded production build runs before each PWA preview and passes. Existing
React act/router, large-chunk, stale Browserslist and optional2.57MB manifest
precache warnings persist. Ubuntu26.04 unsupported-host caveat remains.

P17a07 ordinary UI/actual close/new page retains one installed context clock.
Old app closes before away clock advances. Known inactiveA→B+1h saves1.08/1200
once; sameB complete equality. Quiet600online seconds require an actual periodic
IDB timestamp in[B+570s,C] and a complete fixture-derived projected payload before
manual Save establishes1.04/600. D=C+180s retains stronger bonus, adds exact away
time; sameD complete equality. Locale/banner/chip/overflow/errors checked for
en/zh×1280×800/360×640. First browser4/4pass26.9s; worker U1256pass/1skip111files
38.51s at88189a2,T/L/forcedlintpass. Report
`docs/plans/evidence/p17a07-close-reopen.md` distinguishes development-page proof
from pagehide IO durability/PWA/rewards/fullP17.

P17b01 dedicated tests/pwa config avoids existing debug-enabled prod discovery
and forces a fresh no-bridge guard build with reuseExistingServer:false.
Ordinary saved character and activated controlling SW precede network disable.
Both offline reloads require successful SW document+entry/loadedJS responses,
complete stored/exported equality and bridge absence. Offline town/inventory/
skills/merc/map render; enter actual map combat, ordinary Skip must advance the
numeric wave or finish the run. Ordinary flee/end then Save and offline reload
retain full outcome-derived persistence baseline. No independent balance/reward
claim from that baseline. First two attempts each4fail from premature ready
state and overlength test-name assumptions; runtime unchanged. Third4/4pass
38.1s; final unconditional-town/numeric-wave4/4pass37.4s on4326. Full evidence:
`docs/plans/evidence/p17b01-production-offline.md`. Update/install/Lighthouse,
optional-art explanation/fullG6 remain open.

All completed worker claims released. After all consumers/processes finished,
removed+verified absent worktree3/4 owned dist/.vite, worker
`/tmp/d2h5-p17a07-browser-1`, root dist/node_modules/.vite and
`/tmp/d2h5-p17b01-browser-1`, `-2`, `-3`, `-final`. Downloads explicitly deleted.
No task processes or cleanup failures remain; shared tools/caches preserved.
Root worktree2 remains claimed for continuing umbrella work.

Next approved P17b02: localized offline capability note in Settings explaining
possibly unavailable uncached art without claiming observed image failure.
BUG026 reserved after genuine missing-note assertion; five worker-owned files
(Settings, two locale files, existing PWA spec, bug) plus root D12 control above.
Two-version update safety needs a separately reviewed harness. Broader earned
campaign/class/skill/economy/crafting/merc/background-idle gates remain open.

## Optional-art explanation and configured-version worker update

P17b02 integrated `c11a7e2` (agent `f2e0afa`): localized Settings note initialized
from native online status, owned online/offline listeners with immediate
resampling and cleanup. Honest copy says some uncached art may be unavailable;
no claim about observed image failure, image/cache/save/schema policy changes.
Genuine real-network-offline missing-note RED preceded runtime, retained BUG026.
Production en/zh×desktop/mobile4/4pass56.4s on4328: live offline event without
reload/same performance.timeOrigin, offline remount and online restoration;
complete IDB/export equality and prior offline gameplay oracles retained.
U1275pass/1existing merc-XP skip112files36.52s; T/L/forcedlint/fresh guarded build
pass. Unit15s budget remains unmet. Worker3 clean/released; exact dist/.vite and
`/tmp/d2h5-p17b02-red`, `-green` removed/verified, port stopped. Root+producer
final source/control/evidence APPROVE.

P17b03a `797a878`: five-file harness/control/evidence slice, runtime unchanged.
Existing VITE_APP_VERSION makes guarded same-source/schema A/B app+SW bytes
distinct. Dedicated serial config, fresh contexts/resetA and test-only contained
loopback deployment switch. Ordinary creation/locale/activated controller/Save
establish whole baselineS. Ordinary sound toggle exports known pending payload
with only soundEnabled flipped while disk remainsS under paused debounce.
Preinstalled native controllerchange observer proves a distinct activated
controller after real registration.update. Live A retains pending state; Save
commits it. Actual B document/newJS and offline B reload both come from SW and
retain full IDB/export equality, locale/no bridge/no overflow/no page errors.
First/final en/zh×1280×800/360×640 matrices each4/4pass1.1m, retries0, on4330.
Fresh guard builds/scan, node-check, T/L/forced config+spec lint pass. No new
full unit for this harness-only child; c11a7e2 runtime gate above applies.

Producer review corrected synchronous-build shutdown and failed-launch cleanup.
Actual Vite-transform interruption of wrapper773572/owned group773580 via
SIGTERM exited0, no live owned group/dist/exact staging remained. Final config
grants explicit SIGTERM/15s grace; wrapper asynchronously tracks/signals only
its owned POSIX group before cleanup. First browser's default forceful teardown
left logged staging despite server exit; root verified server/port absence and
removed only that exact directory. Final graceful teardown and parent verified
staging/dist/.vite absence; both exact browser output directories removed after
completion. All exact paths, preflight dangling-symlink refusal and limitations
are in `evidence/p17b03a-worker-update.md`. Root/producer final APPROVE and root
test-evidence review ADEQUATE for this bounded integration. Uncatchable kills,
Windows descendants, migrations/arbitrary code compatibility/install/Lighthouse
are not certified. Existing host/build warnings remain.

Root worktree2 remains claimed, original main untouched, no push/PR/merge/public
deployment. Full v1/C0–C4/G0–G7 remain open. P13a approved control `d5ca217`
dispatched to design worker with separate worktree ownership; fixes actual-level
defaults in three store paths and UI fallback, preserving explicit stored
thresholds. Restore deterministic actual-combat assertion with share>=60 and
complete expected L10/residual/6362. Root owns ledger/control. Historical wrong
explicit thresholds/phantom gains require separate compatibility policy.

QA's subsequent read-only finding: MercCard displays def.baseStats instead of gained
merc.coreStats. Separate RED/report/UI slice needed before claiming visible stat
gains. Actual ActI hire is immediate/free and auto-fields reqLevel3 InnerSight;
this can prove ordinary obtain/field/earned L3→L4/save but not earned-currency
recruitment. QA is preparing that route without runs/edits/artifacts; economy,
broader skills/campaign/idle/critical UI/performance gates remain open.

## Level-aware mercenary defaults and visible earned progression

P13a integrated8e6076e (agent6db69b6): new/missing progress uses owned merc level
in insertion/getter/positive award. Getter stays pure; UI fallback shares it and
retains explicit-progress/level subscriptions. Explicit saved thresholds, even50,
remain authoritative. No gain/share/curve/factory/schema/migration change.
Canonical L1=60,L3=304,L4=527,L10=6362,L11=9098. Historical explicit incorrect
thresholds/phantom gains need separate compatibility policy.

Genuine RED12fail/47pass3.25s, focused59pass3.30s, related461pass/39files20.69s;
full1290pass/112files/no skips26.86s; T/L/build pass. Restored real-combat case
uses runSeed7/challengeOrdinal0, actual BloodMoor victory/original living hero/
playback award and literal heroXP160/merc120. Share>=60/<6362 keeps original
L10 entity unchanged except XP120/6362. Root+producer source/final APPROVE.
Worker3 clean/released, exact owned dist/.vite removed/verified.

P13b5143a2c: MercCard now binds existing STR/DEX/VIT to owned coreStats. Genuine
mounted actual-store threshold RED2/2preceded runtime; known definition stayed
STR12 after realSTR13, unknown definition showed dashes. Both UI suites7pass/
2files3.97s, full113files1292pass/no skips32.31s, T/L/final forced ESLint/diff
check pass. Full-unit15s budget unmet in both slices; no performance acceptance.

Ordinary fresh guarded production en/zh-CN×1280×800/360×640 matrix4/4pass1.1m,
retries0,port4332. Fixed Date only/native timers, ordinary Druid creation,
InnerSight free hire/unfield/re-field. Three actual won first waves yield
hero160/180/200 and merc120/135/150; Pause/Flee after numericwave2 bounds grants.
Complete independently expected merc state and localized live stat/XP checks
precede whole-save persistence baseline. L3XP0/304→120/304→255/304→L4XP101/527,
core12/22/16/14→13/25/16/15,life148→156. Save/readonlyIDB/actual page close/new
page/Continue retain full save, locale/fielded identity and UI, no bridge/
overflow/page errors. This is earned XP from first-wave victories, not full-area
clear, paid recruitment, contribution/balance or fullP13/economy acceptance.

Producer source/final evidence APPROVE/ADEQUATE; root review ADEQUATE. Exact
commands/limits in evidence/p13b-earned-mercenary.md and BUG027. After all
consumers finished, root verified4332 stopped and removed/verified absent
worktree2 dist/node_modules/.vite and /tmp/d2h5-p13b-earned-browser-1.
No task process/disposable artifact remains; shared tools/caches retained.

P03b05a45d44c3 now accepted: complete authoritative first-backpack-index transfers,
owned-merc/current-base preflight, discriminated refusal, complete affix Maps and
same-ID backpack/stash conservation; returned flags normalized. Paired synchronous
domain publications promise settled state, not atomic subscriber snapshots.
BUG028 genuine store8fail and mounted3fail before runtime; focused58pass/4files,
full1307pass/115files/no skips31.46s (15s budget unmet), T/L/build/forcedlint pass.
Ordinary imported-integrity fixture en/zh×desktop/mobile4/4pass15.0s retries0:
equip/swap-back/unequip/Save/reload/export match complete independent saves.
First4selector failures hit nested Details; corrected label clicks retained all
oracles/timeouts. Root/producer final APPROVE/ADEQUATE. Exact dist/.vite/browser
outputs removed and verified absent after consumers;4334 stopped. No earned-loot,
production/PWA/capacity/equipment-combat/fullP03b acceptance.

Next ready investigation P03b05b: net-capacity/UI policy, read-only with QA.
P08a01 integrated11eb6b3 (worker ca66d0a): central canonical identity handles
config/application/lookup/stacks/removal, fresh ignite and preserved active
legacy payload/first-match mixed records. Actual registry Fire Bolt seed7
rank1hit30+burn9→HP461/rank20hit106+burn30→HP364, exact final4700ms interval;
mana/CD/miss/weapon-independence/replay/immutable/rate-less controls pass.
Genuine4file17fail/60pass before runtime; focused77pass; worker engine522,
related644,full1317/no skips,T/L/build and changed status coverage99.13%lines/
96.52%branches/100%functions pass. Timing misses remain explicit in BUG029.

Root combined11eb6b3 validation started07:23:48UTC:full1332pass/115files/no skips
34.49s,engine522pass/42files7.17s,T/L/build pass (build12.49s), concurrent runs.
Functional passes do not accept3s engine/15s full budgets. Root/producer final
source/evidence APPROVE/ADEQUATE. Worker clean/released; exact owned build/
coverage/cache outputs removed/verified. Root combined dist/node_modules/.vite
also removed/verified after processes finished. No engine browser claim, no
rate invention for Firestorm, no fullP08/skill/C1 acceptance.
P08a02 actual Amplify Damage contract investigation is read-only with design
agent: status currently inert, duration missing and must be settled before code.
Root worktree2 remains claimed, original main untouched, no push/PR/deployment.
Full v1/C0–C4/G0–G7 remain open.


## Guarded manual mercenary returns and next authored curse

P03b05b854e88f accepted: authoritative manual unequip refuses at>=100 after
owner/slot preflight, leaves both stores/references untouched, retains localized
polite feedback outside picker.99→100 preserves complete normalized payload;
non-growing swaps and overflow-reducing equips remain legal, durable addItem
remains unbounded. Existing obsolete500→501 manual-return expectation explicitly
revised;500-item swap and prior ingress/save/integrity controls preserved.

BUG030 genuine corrected RED7fail/10pass/2files3.93s before runtime; initial RED
also contained one wrong test-only stash baseline, documented and corrected.
Focused75pass/6files4.67s; full1349pass/117files/no skips29.37s; lint/build9.63s/
forced browser lint pass.15s unit budget unmet. Typecheck caught explicitundefined
optional payload; final required Item|null correction then typecheck/component
lint and both mounted suites7pass/2files5.61s pass. Full/build/browser preceded
that absence-only correction; producer reviewed and accepted that evidence limit.

Ordinary imported fixture en/zh×1280×800/360×6404/4pass27.4s,retries0,4336:
refusal at101/100, legal swaps/equips, explicit discards then retry, Save/reload/
export all match complete independent wire-safe expected saves, Maps/sentinels
retained. Imported overflow is labeled, no earned-loot/production/PWA claim.
Root/QA/producer source and final evidence APPROVE/ADEQUATE. Evidence:
`evidence/p03b05b-merc-equipment-capacity.md`. After all consumers finished,
exact root dist/node_modules/.vite and /tmp/d2h5-p03b05b-browser-1 removed/verified
absent;4336 stopped, downloads deleted, no task processes or cleanup failures.

P08a02 D04 authored Amplify Damage contract now root/producer approved:
3000ms new design choice/50 percentage points authored once, physical direct-hit
projection before existing clamp/defense, canonical/legacy identity and first
active damage read. Three sequential<=5-file slices with independent reviews;
metadata/definition alone do not fix gameplay. Security PASS. Actual runtime
RED/BUG031 required before fix. QA investigating narrow Sorceress passive next.
Root worktree2 remains claimed; original main untouched; no push/PR/deployment.
Full v1/C0–C4/G0–G7 remain open.


P08a02a integrated8b1f497 (workerff06347,parentbf840d7), exact5files: shared
readonly status metadata, finite nonnegative optional schema fields, exact
rawAmplifyID/canonicalfirststatus adapter forwarding with explicit0/omissions.
No actual JSON/runtime change, curse still inert. Genuine acceptance-gap RED
19fail/28pass07:38:17UTC; focused47pass, engine551/42files4.46s, related674/53
21.20s, full1378/117files30.65s; T/L/B/diffcheck pass.3/5/15s budgets unmet.
Changed dataCatalog100%stmt/line/functions,93.54%branches (87/93); producer
independently consumed coverage, root reviewed complete corrected diff. Generic
optional schema fixture and stable production subset permit later exactID
required metadata without weakening strict adapter assertions. No validate:data
script exists; strict Ajv tests+actual corpus loader/integrity run in fullunit.
Root/producer final APPROVE/ADEQUATE; worker clean/released. Exact worktree3
dist,coverage/p08a02a+emptycoverage,.vite/vitest+empty.vite removed/verified.
B authored-definition five-file child dispatched from8b1f497; c runtime/BUG031
waits review. Final combined validation follows actual runtime integration.

P08a03 MinorHeal future contract approved after root/QA/producer source review:
actual30–50/rank1=20/CD4/zero cost, one lowest-ratio living injured same-side
patient including self/summons, actualpositivecapped healing/currentstate,
no-target pureheal fallback/noRNG and exactID override. Explicit zero/range/
mixed-effect semantics and four-file factory/runtime split. Acolyte tavern is
not currently ordinarily hireable; no earned-acquisition claim. No code dispatched
yet; shared engine waits Amplify. D05 fullWarmth/recovery contract under review.

D05 Warmth full-passive/recovery control now root/producer/QA approved. Explicit
new provisional hero0.2×effectiveEnergyMP/s baseline, authoredJSON, Warmth
+.04regen/+.01fire perlearnedrank. Per-wave config freezes: authoritative pull
every playWave clears removed modifiers/ranks and clamps fresh maxima without
free healing; current recording unchanged except existing explicit combo replay.
Continuous recovery settles surviving MP through terminalT after periodicdeath
phase; cap discards overflow/fractionalbank, carry persists only actual nextwaves.
Every changed mana path emits silent absolute playbackstate. Seven sequential
bounded children; code not dispatched and fullWarmth/C1 remains unaccepted.

P08a02b integrated554a922 (worker8d6f436), exact5files150insertions: actual
NecromancerJSON3000ms/50points, exactIDconditional schema requires both using
existing numeric refs, pure exactone-row immutable scalar definition without
registry cycle/tuning duplication. Generic optional/zero metadata preserved.
Genuine acceptance RED07:45:06UTC5fail/17pass22total2.10s beforeJSON/schema;
focused78pass/3files2.12s,engine560/43files4.90s,related868/66files24.82s,
full1398/118files29.11s,T/L/B8.89s/diffcheck pass.3/5/15s budgets unmet.
Definition coverage31/31statements,1/1functions,14/14branches,100%lines;
strict actual283skills/9JSON corpus and integrity30tests pass. No validate:data
script exists. Root+producer independent source/evidence APPROVE/ADEQUATE.
Both consumed artifacts before worker removed exact dist,coverage/p08a02b+
emptycoverage,.vite/vitest+empty.vite; absence verified,clean/releasedworktree3.
Actual curse gameplay remains inert; c gets explicit BUG031 ownership and
must present production/status RED before runtime. Final combined validation
follows c. Root worktree2 remains claimed; no push/PR/deployment.


## Amplify runtime, ordinary earned Fire Bolt, and combined validation

P08a02c integrated `f3f9086` (worker `e0447b9`): defined milliseconds and
potency reach fresh canonical statuses; alias family defaults come from JSON.
Direct physical hits use the first active curse and subtract once before the
existing act penalty, clamp and defense. Aggregate first-stored refresh keeps
source/start/potency and indefinite lifetime. Explicit zero, duplicate/pending/
expired aliases and elemental/thorns/physical-periodic controls are covered.
Production ranks 1 and 20 now give target HP 500 → 410 → 370, with hits 90 at
1700 ms and 40 at exact expiry 3400 ms. RNG/replay/immutability remain pinned.

BUG031 final pre-runtime RED was 31 failed / 48 passed at 08:00:37 UTC,
1.22 s. Worker focused 79, engine 607, related 698 and full 1445 passed;
T/L/build and changed coverage passed. The first related run correctly rejected
source changes during measurement; frozen-source rerun passed. Root and producer
independently reviewed source/tests/report and consumed raw coverage before
cleanup: status 367/370 statements, 121/125 branches, 15/15 functions;
combat 1026/1071, 296/348, 42/42. Both APPROVE / ADEQUATE. Timing budgets remain
unmet. Exact evidence and limitations are in BUG031. Worker verified task-owned
dist/coverage/cache absence, clean status and worktree-3 release; no task process
or cleanup failure remains.

P08a01b integrated `0dbbef2` (worker `41e0acf`): ordinary fresh Sorceress/free
Inner Sight hire, real Fire Bolt learning and sole-combo setup, literal first
21-damage hit leaving target 26/47, first-wave victory and 160 earned XP, then
real rank-2 point allocation and full-save close/new-page/Continue equality.
Guarded production PWA en/zh-CN × desktop 1280×800/mobile 360×640 passed 4/4,
1.3 minutes, native timers, retries zero. An initial four fixture failures
omitted the label's Active suffix; corrected exact labels and actor filtering
preserve all numeric acceptance. Persistent battle resources, unrelated loot,
rank-2 browser damage and full-campaign acceptance are explicitly unclaimed.
Root/producer final independent source/evidence APPROVE / ADEQUATE. Exact browser
outputs and owned dist removed/verified; worker-4 clean and released. BUG033
records real misleading percentage/turn copy and canonical cast-name fallback.

Root validated the combined source at `0dbbef2` on 2026-10-20: full 1445/118
files passed with no skips in 27.26 s (08:07:54), then standalone engine 607/43
files passed in 3.79 s (08:08:28). Typecheck, lint and build passed; build phase
6.51 s. Actual schema/corpus/integrity, registry and runtime controls are included
in full unit. These results do not accept the 15 s full or 3 s engine budgets.
Existing stale Browserslist, >500 kB chunk and 2.57 MB optional generated manifest
precache warnings remain. No new browser run is needed to certify Amplify's
engine-only scope; the Fire Bolt worker production proof remains bounded above.
Root removed and verified exact task-owned dist and node_modules/.vite after all
processes finished; shared node_modules retained. No disposable outputs or task
processes remain.

Next approved cards are P08a03a authored Minor Heal registration and P08a01c
truthful flat-damage/seconds presentation in disjoint files. The units control is
D04-skill-display-units-v1.md, reviewed by root and producer; BUG033 stays partly
open for the separate cast-name identity issue. Minor Heal registration alone
will not repair runtime healing. Root worktree-2 remains claimed for continuing
umbrella work. Original checkout untouched; no push/PR/merge/deployment.
Full v1 and C0–C4/G0–G7 remain open.


## Authored recovery baseline and Minor Heal registration

P07a01a accepted as `a35ef02`: four new files provide a strict draft-2020
schema, actual JSON singleton `combat/recovery` with the explicit provisional
0.2 MP per effective Energy per second, pure once-compiled Ajv validator and
independent frozen definition. No runtime consumer or mana recovery is added.
Scaffolding RED at 08:11:58 UTC failed to load the missing JSON: one failed
suite, zero collected tests, 761 ms. This is a missing-feature baseline, not
a reproduced gameplay defect. Producer independently approved plan, RED,
source and final evidence; final APPROVE / ADEQUATE, no material findings.

Commands: focused `npx vitest run --project engine
src/engine/combat/recovery-definition.test.ts --reporter=dot --silent` passed
21 tests in 887 ms; `npm run test:engine -- --reporter=dot --silent` passed
628/44 files in 4.50 s; `npm run test:related --
src/engine/combat/recovery-definition.ts --reporter=dot --silent` passed 21/1
in 6.87 s; `npm test -- --reporter=dot --silent` passed 1466/119 files with no
skips in 41.62 s. T/L/build 6.86 s/diff-check pass. Focused coverage included only
the changed definition and passed 21 in 1.12 s, all metrics 100% (23/23 statements,
1/1 functions, 3/3 branches). Both consumers inspected raw hash
`bbbbd73a73e74ac74388bffb4b77093292ed463e48751dcbe958dee9e1f06696` before
root removed exact dist, coverage/p07a01a and node_modules/.vite plus empty
created coverage; absence verified, shared node_modules preserved. No task
process or output remains. Engine/related/full 3/5/15 s budgets remain unmet;
usual build warnings remain. Full Warmth/recovery acceptance stays open.

P08a03a integrated `091d9b0` (worker `ea37e99`): readonly ranged HealEffect,
pure exact-row/active/single-ally/ally/integer-range mapper, complete independent
deep freezing and exact Minor Heal override after merc stubs. Actual factory
loadout resolves the authored 30–50, CD 4, zero-cost definition; repeated loading
restores it and all unrelated merc/aura stubs remain. Registration-only, no
ordinary acquisition or runtime healing acceptance. Root filed BUG032 before
source implementation. Genuine registry/factory/reload RED at 08:11:28 UTC was
3 failed / 48 passed in 1.10 s; combined mapper scaffolding RED at 08:12:25
retained the same failures plus an uncollected missing-module suite, 1.14 s.

Worker exact focused registry+mapper command passed 71/2 files in 1.07 s;
`npm run test:engine -- --reporter=dot --silent` passed 631/44 in 4.68 s;
`npm run test:related -- src/engine/skills/effects.ts
src/engine/skills/minor-heal.ts src/engine/skills/registry.ts --reporter=dot --silent`
passed 733/54 in 27.35 s (08:14:14 UTC);
`npm test -- --reporter=dot --silent` passed 1469/119 in 51.19 s. T/L/build8.89 s/
diff-check pass; 3/5/15 s budgets unmet, usual build warnings. Engine changed
coverage passed 631/44 in 4.63 s: mapper 48/48 statements, 20/20 branches,
1/1 functions; registry 90/92, 14/14, 5/6. Type-only effects has no executable
entry. Root/producer independently consumed raw hash
`290b43717cc483fc55923d311c17129fc91a970e20e9b909932f027868106f91` and gave
final APPROVE / ADEQUATE. Worker verified exact owned dist/coverage/cache absence,
clean Git and release. Runtime P08a03b next; root combined validation follows
actual registry/runtime integration. Units P08a01c production browser is running
on the worker's own worktree, port 4338; root does not own that process/output.
Original checkout untouched; no push/PR/merge/deployment. Full v1 gates stay open.


## Truthful skill units integrated; Minor Heal runtime underway

P08a01c integrated`a150f5b`(worker78cd0c9),fivefiles100+/18−. Flat damage
ranges/deltas/descriptions and seconds now agree with authored display values;
real passive percentages preserved. Genuine mounted RED6fail/38pass preceded
source edits. Final focused44pass6.76s, related60/2files11.49s, full1453/0pending
48.39s; full preceded a test-only RTL exact-option removal, focused/T/L afterward.
T/L/build5.43s/forced PWA ESLint/diffcheck pass. Fresh guarded production
PWA_PORT4338 four-case en/zh-CN desktop/mobile55.9s,retries0,native timers:
actual first21hit/target26of47,eight-enemy160XP,earnedrank2,whole-save/read-only
IDB/close-newpageContinue retained. First four browser failures were the added
dt accessible-name locator only; visible exact label→definition correction
preserves all mechanics/timing assertions. Root+producer final independent
APPROVE/ADEQUATE, consumed raw before worker verified exact disposable output
absence, no processes, clean Git and release4. BUG033 remains partiallyOpen
for raw canonical cast identity. Combined-head checks follow Minor runtime.
Related/full budgets and usual build warnings remain; full v1 gates stay open.

P08a03b runtime worker claimed3 from73838c1, exact combat.ts/healing.test.ts/
skill-resolution.test.ts/stores/merc-healing.test.ts. Actual-registry/factory
RED must be reviewed and appended to BUG032 before runtime source changes.
P07a01b metadata worker next froma150f5b, exact effects.ts/dataCatalog.ts/
registry.test.ts; no overlap. Authored trigger identity only, no automatic
Warmth bonus/runtime exclusion claim. Root continues authoritative composition
boundary design in read-only source; no shared source ownership collisions.

## Trigger metadata, pure Warmth composition, and Minor Heal runtime

P07a01b integrated `07e8514` (worker `ca1e8f2`): three files carry the
authored active/passive/aura trigger through RegisteredSkill/dataCatalog.
Actual Might/Prayer author `trigger: passive` with `aura: true`; those facts
remain distinct. Literal aura is tested by a labeled synthetic adapter row;
active Frozen Armor retains its active classification despite passive-stat
metadata. No passive action guard or automatic effect is implemented here.
Genuine registry RED: 8 failed / 53 passed, 61 total. Focused 61 (1.09 s),
engine 662/45 (4.68 s), related 731/53 (22.58 s), full 1508/120 (real 35.37 s,
no pending), typecheck, lint, build (7.48 s) and diff-check passed. Related:
`npm run test:related -- src/engine/skills/dataCatalog.ts
src/engine/skills/effects.ts --reporter=dot --silent`. Changed dataCatalog
coverage 221/221 statements, 7/7 functions, 88/93 branches. Root/producer
independently consumed raw evidence; APPROVE / ADEQUATE. Worker verified exact
output cleanup, clean Git and worktree-4 release.

P07a01c1 integrated `938ed96`: pure immutable JSON-driven recovery/fire
composition and additive optional transient CombatUnit fields. Energy input is
already effective; learned canonical/data aliases use MAX once, finite positive
integer ranks clamp 20, absent/invalid/wrong-class/ineligible ranks give zero
Warmth. Baseline remains authored 0.2 × Energy; rank adds .04 regen/.01 fire.
Explicit zero fire clears removed allocations. No runtime consumer yet.
Scaffolding RED 08:25:40 UTC was a missing-module failed suite with zero
collected tests (690 ms), not a gameplay repro. Focused 42 passed; final engine
694/46 at 08:31:44 (5.43 s). Related 704/52 (20.83 s), full 1540/121 at
08:30:41 (34.29 s, zero skips), build 10.45 s preceded the final equivalent
optional-guard syntax correction; final engine, typecheck, lint and coverage
followed it. Producer accepted this disclosed ordering pending combined-head
checks. Coverage 47/51 statements, 1/1 functions, 13/15 branches; uncovered
import-time missing-definition/coefficient throws. Raw SHA-256
`a8d598770d0683739e3b188009b23b08b276e039240f2bcdee14672ff3badb21` consumed
before exact dist/coverage/p07a01c1/.vite cleanup and verified absence.
Producer independently reviewed plan, scaffolding RED, source and evidence:
APPROVE / ADEQUATE. c2 fixture-authority/lifecycle split is under investigation.

P08a03b integrated `ec0de97` (worker `89f7b04`): positive-potential no-RNG
target selection, pure-heal availability, fixed/range/percentage precedence,
one lazy shared roll per ranged effect, actual capped healing and authoritative
sequential state. Actual production seed-1 rank-1/20 and unchanged Acolyte
factory regressions pass; details and REDs are in BUG032, now bounded runtime
Fixed. Final focused 85/3 (1.68 s), engine 690/46 (4.49 s), related 800/58
(21.63 s), full 1529/122 (31.44 s, no skips), T/L/build 6.46 s/diff-check pass.
Related command: `npm run test:related -- src/engine/combat/combat.ts
src/engine/combat/healing.test.ts src/engine/combat/skill-resolution.test.ts
src/stores/merc-healing.test.ts src/stores/mercFactory.ts
src/stores/mercToCombatUnit.ts --reporter=dot --silent`.
Changed combat coverage 1066/1097 statements/lines, 44/44 functions,
337/388 branches. Root/producer independently reviewed full source/test diff
and consumed raw SHA-256
`679f057ce8748048455ece4d509a0f2096cdaaf7488e43d5c7257ea16226f156`:
APPROVE / ADEQUATE. Worker verified exact dist/coverage/p08a03b/.vite cleanup,
clean Git and worktree-3 release. Acquisition/browser acceptance remains open.

Root combined-source validation at `ec0de97` on 2026-10-20 passed:
`npm test -- --reporter=dot --silent` 1589/123 files, no skips, 08:34:46 UTC,
27.70 s (real 29.22); `npm run test:engine -- --reporter=dot --silent`
742/47 files, 08:35:19 UTC, 4.47 s (real 5.58); `npm run typecheck`,
`npm run lint`, `npm run build` (5.47 s). The actual corpus, factory and
runtime controls are included. Engine/related/full 3/5/15 s budgets remain
unmet; existing stale Browserslist, >500 kB main chunk and optional 2.57 MB
manifest precache warnings remain. Full v1/C0–C4/G0–G7 stay unaccepted;
root worktree-2 remains claimed, original checkout untouched, no publication.


## Authoritative fixture prerequisite and Warmth wave adapter

Tests-only prerequisite`9ae162e` (worker`644b51f`) migrates four legacy store/
quest fixtures from boosted derived caches to explicitly imported synthetic
helm-cap gear through real inventory actions. All236 original assertion lines
retained in order, genuine60000ms draw retained; exact before/after DerivedStats
proof independently inspected by root+producer. Focused56/4baseline3.28s→3.08s,
related56/4 5.44s, full1589/123 25.59s, T/L/build6.81s/diff-check pass. Worker
verified exact scratch/dist/.vite cleanup, clean Git and release4. This proves
fixture equivalence, not earned campaign balance or the new adapter.

P07a01c2`1860bc6` changes four files. Source now composes authoritative equipped
core/gear and effective Energy once; every wave pulls fresh configuration,
ordinary recordings remain frozen, missing learned levels explicitly clear,
resources preserve/clamp without refill, cap clears carry/compensation, and
replay preserves original/rebased baseline without repeated resource loss.
Missing/replaced persistent hero and actual mercenary remain isolated. Legacy
weapon authority intentionally remains a separate boundary.

Genuine final pre-source RED at08:46:15UTC:13failed/43passed/0pending56total,
reviewed independently by producer and QA before source. Initial GREEN54/56
exposed two provably wrong oracles: L4expandedmana520 rather than524, and fresh
persistent-pool metadata144/335 after no-heal re-equip while actual replay
resources restore190/400/.75/.125. Both reviewers approved exact corrected
whole-recording oracles; original outcome reference immutability remains pinned.
Typecheck caught readonly mutations in first expected fixture correction; final
immutable mapped replacement retains the same exact expected values.

Final focused56/56 3.730s, related464/42files23.263s, engine742/47files5.181s,
full1602/124files31.069s; all zero failed/pending. Final T/L/build5.63s/diff-check
pass. Full includes final immutable expected-object correction. Engine overlapped
tail of related/typecheck; no isolated timing acceptance inferred. Budgets
3/5/15seconds remain unmet. Existing build warnings persist.

Extra store coverage diagnostic full1602pass40.49s **exited1** because77.9%
branches is below inherited80%. The configured threshold targets engine files,
explicitly excluding UI/store; the CLI store target is diagnostic, not a new
applicable gate. No setting/threshold was weakened. Raw658/688statements,
20/21functions,134/172branches; changed43/43statements and17/24branches hit.
Unhit added alternatives are defensive defaults on fields the current composer
always populates. Producer+QA independently consumed raw hash
`dbb75b64da03598b76811cc729ec27582c00e7fbb701d7de2648cafe98a3d477` and all source/
JSON evidence: APPROVE / ADEQUATE, diagnostic failure explicitly disclosed.
Exact commands and remaining limits are in BUG034; disposable paths are removed
and verified after both consumers finish. Root worktree2 remains claimed for
continued implementation; original checkout untouched. No publication.

P07a01d source-confirmed two-file fire/passive plan is approved by producer;
worker awaits root input/reviewed RED and bug record before runtime edit.
Full Warmth/C0–C4/G0–G7 remain unaccepted; UI true maxima, ordinary earned
browser/save proof, fire/recovery and absolute mana playback remain open.


## Warmth fire/passive runtime integrated

P07a01d accepted at `5a53d37` (worker `f80b6a9`) after structured BUG035 and
reviewed22-failure RED. Separate fixture prerequisite `727da6b` replaces passive
Might with active Frozen Armor in the existing non-recast control, preserving
the original count-one assertion; baseline742engine tests pass. Minimal source
consumes the attacker's per-type modifier in increasedPct and rejects exactly
authored trigger:passive at the shared scheduled/start eligibility boundary.
Actual Fire Bolt rank0/1/2/20, burn original potency/cap5, replay, RNG, other
damage types, allies, active Frozen Armor and legacy/literal auras are covered.

Final focused38/1.29s, engine780/48files4.42s, related752/20.30s,
full1640/125files26.78s; T/L/build5.48s/diff-check/unchanged80% engine coverage
all pass, zero skips/failures. Combat97.17%statements/100%functions/86.98%branches;
both changed statements/all alternatives covered. Coverage digest and exact
commands are recorded in BUG035; all raw evidence was independently consumed
by root, QA and producer before verified worker cleanup/release. Three final
APPROVE/ADEQUATE verdicts. Engine3s/related5s/full15s budgets remain unmet.
Build warnings remain; no full Warmth, campaign or performance acceptance.

Stage e strengthened tests and structured BUG036 committed `48e1412`; accepted
fire head rerun `35365c3` reproduces unchanged13fail/19pass/32total and exactly
three missing mana-union type diagnostics. First source GREEN31/32 exposed one
over-broad negative oracle: simultaneous enemy owner/summon death forbids owner
refunds but legitimately drops seed7 MP orb for the living hero90→95@500ms.
Root, QA and producer independently approved exact hero orb expectation plus
explicit no-owner/no-refund checks; no runtime change for that assertion.
Focused32/32 now pass; remaining combined validation is underway.


P07a01e final accepted `dd236eb`: focused32/1.93s, engine780/4.29s,
related781/57files20.69s, full1661/125files27.48s, final T/L/build5.99s/diff-check
pass. Configured80% engine coverage passes1661tests35.48s with T/L overlap; all
34 added statements/12 branch locations exercised. Combat97.25%statements,
100%functions,87.99%branches; stores intentionally excluded but behaviorally
reviewed. Exact commands/hashes/oracle correction in BUG036. Independent QA and
producer final APPROVE/ADEQUATE, all raw evidence consumed before cleanup.
Timing budgets remain unmet; no recovery/browser/fullWarmth acceptance.

P07a01f dispatched from accepted `dd236eb` with exclusive five-file recovery
scope and tests-only RED first. Precision plan uses cumulative compensated
MP-ms plus whole-granted counter; all cap paths reset local and unit carry.
Root separately owns two-file UI prerequisite: truthful maxima and readable
full-width hero MP above the battlefield, then ordinary learned/upgrade/save/
reopen/fire+recovery desktop/mobile×both-locales browser evidence.

P07a01g UI prerequisite accepted after BUG037 and independent producer/QA
RED, source/GREEN and production-browser review. Exact two source/test files:
truthful lifeMax/manaMax and existing StatBar showing actual hero runtime MP
above grid. Focused12/full1667/T/L/build pass; related8.09s/full28.11s exceed
5/15s budgets. Ordinary controls in real production show102→94/max102;
14geometry checks, en/zh ×320/360/412/640landscape/768/1280/1920, pass without
horizontal overflow. Both locales360/1280 screenshots independently inspected.
Temporary Chinese font addressed missing host glyph support; one failed launch
from XDG browser lookup was preserved and corrected via existing browser path.
No game-state injection or source change for browser proof. BUG037 preserves
exact hashes, commands, evidence boundaries and environment diagnostic.
Full recovery, earned Warmth upgrades/frozen recording/next-wave/save/reopen,
whole-screen accessibility, narrow-card usability and campaign remain open.
After reviewer consumption, verified cleanup removed13 exact UI raw files,
the complete task-owned browser scratch directory including temporary font/
caches, root `dist/` and `node_modules/.vite/`. Port4386 has no listener;
dependencies/source/history preserved. Prior d/e cleanup also confirmed in
BUG036. The original checkout remains clean on main.


P07a01f final source worker`a793b73` integrated root`775eab7` after independent
root/producer/QA functional approval. BUG038 preserves the exact-number contract,
wrong-oracle correction, genuine near-one RED and final approved source hashes.
Combined source with adapter passes893engine/900related/1790full, T/L/purity/build
and unchanged80% enginecoverage. Engine4.91/related20.52/full28.48seconds exceed
3/5/15 budgets; existing build warnings remain. Coverage helper100%statements/
functions,94.34%branches; changedcombat37/37statements19/19branches. Combined
review and earned browser/save proof remain pending; no checkpoint/G acceptance.
Worker exact artifacts removed after all consumers finished; managed worktree3
released with history preserved. Root claimed worktree2 and task scratch remain
for continued authorized implementation and production browser validation.

Root/producer/QA final combined APPROVE / ADEQUATE P07a01f functional boundary
at`775eab7`; all8source/test hashes match. Engine recovery child is accepted,
with timing/bundle/offline/performance caveats above. Warmth as a whole and
P07a01g ordinary-earned browser/save proof remain open.


P07a01g ordinary earned Warmth browser/save proof accepted after final native
4/4 GREEN (runner212.159s/wall213.547s), frozen spec `128eb18a` / config
`ca32c864`, reporter `af1f1ea2`. Root/producer/QA independently decoded all
four actual DOM attachments and confirmed rank-sensitive boundaries,74/75fire,
whole-save equality and reopened110→102→103. T9.600/explicitL5.590/fullL25.860s
pass; production bridge shaken out, empty page warning/error collections.
Evidence document preserves exact commands/full hashes and caveats. All
consumers finished; root verified deletion of exact Warmth scratch,dist and
local .vite cache; ports4387/4388 closed. Original checkout untouched.
P04a03a is the next producer-ready three-file central quest-schema prerequisite;
structured BUG039 and reviewed genuine loader-accepts-invalid RED precede
runtime edits. Direct quest imports/references/reward grant correctness remain
separate. C0–C4/G0–G7 remain unaccepted; continue full staged v1.


P04a03a central quest-schema source/focused APPROVE from root/producer/QA;
tests checkpoint74cb889. Final combined runs pass focused166/2files,
related166/2, full1904/127, typecheck/lint/purity/build and unchanged80%engine
coverage gate (94.21statements/lines,89.01branches,93.87functions). BUG039
preserves exact commands/source/test/log hashes and failure corrections.
Related6.378/full27.674wallseconds exceed5/15budgets; existing bundle/manifest
warnings remain. Engine-only coverage does not measure the changed loader.
Root/producer/QA final combined APPROVE/ADEQUATE. All raw consumers finished;
exact scratch, task-owned dist and local .vite removed and verified. Direct
quest imports still bypass central validation; crossrefs/objective/reward
execution, transactions/economy and full C0–C4/G0–G7 remain unaccepted.


P08a01d accepted bounded authored/canonical cast-name lookup after genuine
33RED/12controls and independent root/producer/QA source/final review. Only
runtime file eventToLogI18n.ts; frozen tests/browser checkpoint0df510a. Focused45,
related525/44, full/coverage1939/127, T/L/purity/build and explicit browser lint
pass; engine-only coverage94.21/89.02/93.87 excludes converter. Native en/zh ×
360/1280 production8/8 passes,0retries/skips/flaky/errors. All12attachments and
20Warmth MP boundaries independently decoded; numeric/save/progression oracles
retained. Final evidence preserves exact commands/full hashes and Fire Bolt
pageerror-only versus Warmth console/pageerror distinction. Related/full/browser
timing budgets and existing build warnings remain open. All raw consumers
finished before root verified exact cast scratch/dist/.vite removal; port4390
closed. Full status/buff/history/localization/skill/campaign and C0–C4/G0–G7
remain unaccepted. Continue bounded Frost Nova representation/behavior work.


P08a04a accepted after root/producer/QA independently approved genuine11RED/
184controls, source/frozen195GREEN and complete final validation. Tests5fe184b;
four source files only, exact-two opt-in metadata schema preserving legacy
corpus, required secondary chance and general exclusive/nonempty readonly
engine list. Actual JSON/adapter construction/combat remain unchanged. Final
engine893/50, related1142/61, full/coverage1998/127, T/L/purity/build pass;
engine-only94.21/89.02/93.87 coverage excludes schema. Initial fixture and Ajv
strictRequired repairs documented separately in BUG040, no tests weakened.
Timing/bundle/offline caveats remain. All raw consumers finished before root
verified exact A scratch/dist/.vite cleanup. Continue actual Frost B tests-first
RED; no runtime/ordinary-browser/fullskills/campaign or C0–C4/G0–G7 acceptance.


P08a04b accepted at13b5378 after root/producer/QA independently approved frozen
actual authored22RED/71controls (test checkpoint a936182), minimal3source-file
fix, focused93GREEN and final combined validation. Player Frost alone opts
in to Freeze10%; adapter preserves full ordered primary+configured tail and
legacy scalar/no-status shapes; shared damage loop retains hit gating, RNG
order, per-target processing and statuses-before-death. No A schema/type/test
change. Final engine925/51,related1388/74,full/coverage2030/128,T/L/purity/build
pass; changed instrumented locations fully covered, unchanged80%engine gate
passes (reporter94.27statements89.33branches93.87functions). BUG040 preserves
exact command/results/source/test/log hashes, coverage methods and caveats.
Engine/related/full timing, React test warnings and bundle/manifest/Browserslist
remain open. All raw consumers finished before root verified exact B scratch/
dist/local .vite cleanup. Original checkout clean; root worktree remains claimed.
No ordinary-earned Frost browser/fullskill/campaign or C0–C4/G0–G7 acceptance.
Continue legal Amazon starter content→class recipe→exactly-once creation→
versioned conservative repair→canonical weapon readers.


P08a05a accepted legal Training Bow content/acquisition after frozen actual
7RED/3controls checkpoint9809698 and independent root/producer/QA source/final
APPROVE/ADEQUATE. Four JSON files only; old content preserved. Focused211/3,
related989/67,full/coverage2040/129,T/L/purity51/build pass; unchanged80%engine
coverage gate passes (7993/8478statements,1836/2054branches,291/310functions).
BUG041 preserves commands/hashes/caveats. Timing/build warnings remain. All
raw consumers finished before verified exact content scratch/dist/.vite cleanup.
Creation/save/readers/balance/browser/BUG041 and C0–C4/G0–G7 remain open.
Continue producer-approved P08a05b recipe-backed factory with genuine RED.


P08a05b accepted at9f00779: four-source-file recipe-backed factory, genuine
24RED/18controls frozenf0ed731 and independent root/producer/QA approval.
Strict optional authored schema/reference/identity validation, legal fixed13
Training Bow with ilvl1/cloned rolls and actual eligibility. Other factory
fields/classes preserved; no grants or canonical mutation. Focused247/3,
related496/32,full/coverage2080/129,T/L/purity51/build pass; unchanged80%engine
coverage7993/8478s1836/2054b291/310f. BUG041 records inclusive-bound refinement,
lint correction, exact hashes/commands/caveats. All raw consumers finished
before verified exact recipe scratch/dist/.vite cleanup. Root claim continues.
C plan revised/approved to reject retained item-ID collisions before mutation;
next existing-screen genuine RED. Creation/save/readers/balance/browser/
BUG041/C0–C4/G0–G7 remain unaccepted; continue full staged v1.
