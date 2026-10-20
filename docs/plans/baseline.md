# Playability baseline

## Identity and evidence rules

- Snapshot: `44f9c1b79739fd85744cd6ff0b863f7d392f18c1` (origin/main).
- Date: 2026-10-20. Repository: `phoenixzqy/D2H5TextGame`.
- Environment: Linux, Node `v24.21.0`, npm `11.19.0`; CI specifies Node 20.
- **Source-confirmed** means traced code/data behavior, not a browser reproduction.
- **Observed** means a command or runtime result from this preparation session.
- **Reported** means the owner's experience, not yet reproduced here.
- **Historical** means earlier reports/specs; **unmeasured** means no current evidence.

The owner's intermittent wrong item images are **reported**. The source causes
below are candidates; no particular candidate is declared the sole root cause.

## Local validation

Run in an isolated checkout of the snapshot, without source fixes. Dependencies
installed with `npm ci --no-audit --no-fund`.

| Command                                                          | Observed result                                                                                 | Limits                                                                                                        |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm test -- --reporter=dot`                                     | Exit 0; 83 files, 750 passed, 1 skipped; 21.54 s                                                | Existing assertions; not proof of skill or campaign completeness; concurrent checks make timing non-benchmark |
| `npm run typecheck`                                              | Exit 0                                                                                          | Types only                                                                                                    |
| `npm run lint`                                                   | Exit 0; engine purity check scanned 36 engine test files                                        | Static rules only                                                                                             |
| `npm run build`                                                  | Exit 0; Vite build 13.17 s                                                                      | Production browser behavior not established                                                                   |
| Desktop + mobile `@smoke`                                        | Exit 1: nine browser launch failures, one skipped; required Chromium headless shell 1217 absent | No gameplay executed; browser install rejected unsupported Ubuntu 26.04 host                                  |
| Coverage, complete E2E, five-act campaign, balance, offline play | Not measured in this session                                                                    | Must be established by P00/P02 and later gates                                                                |

Build warnings: main JS chunk 1,138.33 kB minified / 294.53 kB gzip;
756 precache entries totaling 37,293.34 KiB. Generated asset manifest is
2.57 MB and excluded from precache by the Workbox size limit. These are
observations, not proof that image loading or offline behavior fails.

No hosted CI result was inspected. This repository has GitHub Actions and is
outside the local owner override for `zai-*`/`BPlayer`; its normal PR/CI rules
apply to future delivery.

## Inventory of what exists

| Dimension           | Source inventory                                                                                          | What it does not prove                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Player classes      | Seven selectable skill catalogs                                                                           | Seven viable classes                                                                      |
| Player skills       | 213 definitions: 155 active, 58 passive                                                                   | 213 mechanically implemented skills                                                       |
| Maps                | Five acts; 29 subareas (6/6/6/5/6)                                                                        | Reachable, paced, complete campaign                                                       |
| Monsters            | 109 definitions                                                                                           | Every spawn/skill is valid or balanced                                                    |
| Generated asset map | 690 distinct asset URLs; all 690 files exist                                                              | Correct item identity, decode, retry or offline loading                                   |
| Saves               | Version 7; current migration implementation in `src/engine/types/save.ts`; store migration file is a shim | Reliable current snapshot/import or old-save compatibility                                |
| Planning artifacts  | Subsystem specs and one accepted inventory ADR                                                            | A coherent complete plan; `production/`, standalone pillars/anti-pillars docs were absent |

Machine-readable counts, targets and command results are in
[baseline-metrics.json](baseline-metrics.json); unmeasured gameplay values are
`null`, never zero or a fabricated score. Browser command and setup failure
are recorded there; the attempted install was `npx playwright install chromium
--only-shell` and exited 1.

Skill census follows `dataCatalog.ts` routing conditions, not prose labels.
The checked-in [CSV](skill-inventory.csv) is a static input inventory. Every
behavior-verification cell intentionally starts `unverified`.

| Class       | Total | Active/passive | Damage | Summon | Buff only | Debuff only |
| ----------- | ----: | -------------- | -----: | -----: | --------: | ----------: |
| Amazon      |    30 | 24/6           |     20 |      1 |         7 |           2 |
| Assassin    |    30 | 26/4           |     22 |      2 |         5 |           1 |
| Barbarian   |    30 | 18/12          |     10 |      0 |        15 |           5 |
| Druid       |    31 | 26/5           |     16 |      7 |         8 |           0 |
| Necromancer |    32 | 26/6           |      7 |      7 |         7 |          11 |
| Paladin     |    30 | 10/20          |      9 |      0 |        21 |           0 |
| Sorceress   |    30 | 25/5           |     18 |      0 |        10 |           2 |
| Total       |   213 | 155/58         |    102 |     17 |        73 |          21 |

## Prioritized findings

Severity here is an initial triage proposal: S0 = data loss/crash/security or
unrecoverable state; S1 = blocks progression or invalidates a promised core
mechanic; S2 = degraded but recoverable; S3 = cosmetic. A runtime reproducer
determines final severity. Source line numbers refer to the pinned snapshot.

| ID  | Evidence and finding                                                                                                                                                                                                                           | Confidence / next proof                                                                                                                   | Initial priority                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| B01 | `src/engine/combat/combat.ts:530–555`: buff branch records IDs/events; pure debuff branch records statuses without consumers for their promised effects. 73 buff-only + 21 debuff-only routes                                                  | Source-confirmed routing/branches; behavioral tests required per skill family                                                             | S1                                            |
| B02 | `src/features/skills/SkillsScreen.tsx:133–145`, `src/stores/combatHelpers.ts:48–70`, `src/stores/playerStore.ts:182–234`: passive definitions are not automatically composed into combat/stats; `passiveStatsPerLevel` is used by display code | Source-confirmed missing path in audited code; allocate/respec/load repro required                                                        | S1                                            |
| B03 | `src/engine/skills/dataCatalog.ts:122–175`: only first status retained; 13 multi-status definitions. Fire uses `burn`, status/combo expect `ignite` (`combat/status.ts:50–62`, `combat/combo.ts:40–43`)                                        | Source-confirmed mismatch; expiry/DoT and combo effect need fixed-seed checks                                                             | S1                                            |
| B04 | `combat/combat.ts:244–257`: skill damage uses base/rank with `increasedPct: 0`; lacks attack/weapon contribution. `src/engine/skills/summons.ts:18–50`: global summon counters; scheduler `combat.ts:770–786` uses insertion ties              | Source-confirmed implementation; decide scaling/tie contract and reproduce summon replay                                                  | S1                                            |
| B05 | `src/engine/progression/xp.ts:69–71`, `src/stores/combatHelpers.ts:481`: XP is 10×monster level; tier/difficulty/overlevel policy in progression spec not integrated here                                                                      | Source-confirmed; measure rewards per actual victory and idle cycle                                                                       | S1                                            |
| B06 | `src/data/loot/treasure-classes.json`: 73 trash item picks force `normal`; runtime `src/engine/loot/drop-roller.ts:198` honors forced rarity before MF                                                                                         | Source-confirmed; sample live engine, not historical loot script                                                                          | S1                                            |
| B07 | Boss spawn-level arithmetic yields 19/32/47/61/82; current equipment TC ranges give zero eligible equipment for Acts I/III/IV/V; Act II only three jewelry picks. 21 nonboss authored wave slots also exceed their TC ranges                   | Static derivation from `src/engine/combat/sub-area-run.ts:354`, act JSON and TC ranges; P02 must reproduce actual resolved spawns/rewards | S1                                            |
| B08 | `src/features/idle/useIdleTicker.ts:83–142`: assumes one kill per six seconds and awards XP/loot without resolving combat/death                                                                                                                | Source-confirmed; compare manual and idle outcomes on identical build/map fixtures                                                        | S1                                            |
| B09 | `src/features/quests/claimReward.ts:82–89` skips advertised reward kinds then claims reward; quest progress/completion APIs have no gameplay callers in audited non-test sources                                                               | Source-confirmed handler gap; event→objective→reward→unlock repro required                                                                | S1; potential S0 reward loss                  |
| B10 | `src/features/inventory/InventoryScreen.tsx:57–58` uses 100/500; `inventoryStore.ts:93` accepts 500/2000; `BackpackGrid.tsx:53` truncates to UI cap                                                                                            | Source-confirmed mismatch; insert/reload/locate item at capacity boundaries                                                               | S1; potential hidden items                    |
| B11 | `BackpackGrid.tsx:76` chooses base art; `ItemDetailPanel.tsx:78–84` prioritizes unique/set/runeword. `src/ui/GameImage.tsx:50–76` and `GameCard.tsx:295–315` retain error state across source changes                                          | Source-confirmed candidates for reported image bugs; identity and failed→valid mounted-image repro required                               | S2, raise if item identity becomes unreadable |
| B12 | `metaStore.ts:27–32` keeps last-close time only in memory; `useOfflineBonus.ts:68–74` depends on it; persistence saves idle state but not that time                                                                                            | Source-confirmed close/reopen risk; controlled-clock browser restart required                                                             | S1                                            |
| B13 | `SettingsScreen.tsx:50–58` rewrites stored record on Save; `:89–94` imports without store hydration in adapter; autosave errors are console-only (`persistence.ts:142–146`)                                                                    | Source risks; test latest unsaved state, immediate import, pending autosave and storage failure                                           | Potential S0; reproduce first                 |
| B14 | `TownScreen.tsx:21–35,66–82` reuses Act I NPC list with inert controls; `/gacha` redirects to `/mercs` (`src/app/routes.tsx:94–97`); inventory API has no craft/socket action                                                                  | Source-confirmed incomplete paths; investigate intended current recruitment flow before restoring obsolete UI                             | S1                                            |
| B15 | `src/data/quests/main.json:60` grants gold; side quest requests gambling (`side.json:49–53`) against GDD no-gold/no-gambling economy                                                                                                           | Source-confirmed content contradiction                                                                                                    | S1/S2                                         |
| B16 | `tests/e2e/full-loop.spec.ts:25–124` tests first encounter, tolerates defeat/zero loot and conditional equip/skills; PWA test proves SW control only; save/i18n specs explicitly skip mobile                                                   | Source-confirmed inadequate acceptance assertions                                                                                         | S1 evidence gap                               |
| B17 | `tests/sim/bloodMoor.sim.test.ts` is outside both workspace include patterns; `scripts/sim-loot-rate.mjs` discards forced rarity and differs in eligibility; prior balance uses simplified enemy/damage proxies                                | Source-confirmed harness divergence; historical reports cannot establish live balance                                                     | S1 evidence gap                               |
| B18 | Merc XP threshold uses level-1 baseline (`src/stores/mercStore.ts:179–180,194,297`); relevant test quarantined (`combatHelpers.test.ts:605`)                                                                                                   | Existing known defect; reproduce and restore assertion                                                                                    | S1/S2                                         |

The census additionally finds **18** damage skills with a first DoT status but
no `dotPctOfDamage` metadata; their current adapter cannot supply DoT strength.
CSV risk flags record this condition, the 13 multi-status rows and burn aliases.

## Design contradictions and unknowns

- XP formula totals are 11,064,193 at L40, 79,955,041 at L70 and
  193,772,764 at L90; the spec's table says approximately 7.6M/83M/206M.
  Its L70 ±0.5% assertion cannot agree with the formula.
- GDD §7.2 uses level-only difficulty; old workflows assume separate
  Nightmare/Hell multipliers. Their existence/completion is not established.
- Legacy "turns" and a 60-second combat cap cannot be compared as one unit.
- Endgame implementation, achievements, respec, crafting sinks and all quest
  cross-references require inventory; screen/data presence is not completion.
- Real fresh-character first-clear time, upgrade frequency, build diversity,
  class survival, browser image correctness and full offline play are unmeasured.

See [decisions](design-decisions.md) for resolution ownership. No gameplay
metric is marked green merely because this baseline's unit suite passed.
