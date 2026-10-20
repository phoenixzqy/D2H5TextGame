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
| P04a02 core/locales/UI | accepted talk path slice | `2d60095` ordered exact current-town talk; `392e671` localized roster/greetings; `0a84010` UI (agent `2702b81`). Root+producer source APPROVE; real Den→Akara→explicit claim→save browser matrix. Full town/quest families remain. |
| Remaining P03b/P04 | ready for reproduction | Shared capacity, atomic transactions/recoverable awards and quest event/reward integrity remain. |
| P05a | accepted slice | `2458ee7`; source-local error state, 13 focused tests and actual-component desktop/mobile proof. [Integrated evidence](evidence/P05a-P06a-foundations.md). D13/F19 remain open. |
| P05b01 | accepted resolver slice | `0c2d043`; D13 identity/metadata control, 29 new tests (25 red before fix), producer source APPROVE. Full suite + T/L/B pass. BUG-010; surface wiring remains. |
| P05b02 | accepted surface slice | `96eb70c` (agent `060cb4f`); all four consumers share instance identity, picker GameImage fallback; root source APPROVE and integrated four-case locale/viewport browser proof. |
| P06a | accepted slice | `10ce45d`; battle-local summon identity, full A/A and A/B/A replay, live/dead collisions. Independent TD approval. [Evidence](evidence/P05a-P06a-foundations.md). |
| P06b | accepted deadline slice | `2cd350b`; inclusive 60,000 ms deadline, no overshoot, tied actors and exact/early victory. Five boundary tests, independent parent APPROVE; BUG-006. |
| P06c01 | accepted periodic slice | `6c7f049` (agent `ff3787e`); shared status/lethal/expiry boundaries, fractional carry, simultaneous death/orphan transaction;31 focused regressions, root+producer source APPROVE. Boss milliseconds and cross-wave rebasing remain. |
| P06c02 | accepted boss-duration slice | `030de58` (agent `53c08fe`); configured boss multiplier once on unrounded milliseconds, legacy lifecycle retained;56 focused cases incl16 real combat cases; root+producer source APPROVE. Cross-wave rebasing remains. |
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
