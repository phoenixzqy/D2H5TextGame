# BUG-552 — Grow Druid summons with the earned owner

Status: implemented; focused checks and historical five-act earned route pass; broad balance acceptance open.
Severity: High (summon build identity).
Owners: engine-dev/content-designer/game-designer. No commit/publication.

## Reproduction

HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce, dirty human2 worktree;
current source dc39535bf1015c366a1e3e933683dfacc5ad4bdc55180ab616a85d105148a1d8.
Node24.21.0 production-store simulation; no browser/locale-specific trigger.
Retained packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

1. Restore independently approved `p15-earned-act5-druid-summon-v1/druid-summon.json`
   (SHA52284d4d8ddd489740d5e3f35464a7008385a0bb5bffaff26afbb4050f7c9ee1).
2. Actual12/XP3211/next104; only Den/Blood Moor cleared; original Inner Sight Rogue15.
3. Forecast Cold Plains admission104/runSeed1454279208, using production preparation,
   normal awards and four waves; discard all projected state/income.
4. Compare original/wolf-first orders, eligible owned mixed gear, and two free-reset
   policies concentrating14ranks into Spirit Wolf or Raven.

All six controls fail wave3 (defeat or60s draw). MP remains available. All nine
original summons die. Rank14 Wolf has145HP/46Attack/23Defense; champion Stalker
has638HP/79Defense/111Attack. Even max-rank Wolf58Attack cannot clear that armor.
There is no owner-level growth, so further character levels stop helping capped pets.

Expected: earned summoner progression supports actual summon damage and survival,
with truthful owner-level previews and existing paid one-batch rules.
Actual: pets hit the1damage floor and die rapidly; ordinary hero/merc weapons carry.

Evidence: `p15-druid-summon-act1-controls-v1.json`, `...resets-v1.json`,
`p15-druid-summon-owned-gear-v1.json`, `...paid-weapons-v2.json` and receipts.
Owned gear audit finds no set pieces, zero free points and3stat/3skill resets.
Four owned Eld insertions in two owned swords win W3 in21.56s, but summons deal
15direct damage versus3951hero/merc damage and all die by7.7s. This is a paid
campaign workaround, not evidence that the summon identity works. No farming,
crafting or native retry has been committed.

## Root correction

Use the existing owner-level summon composition seam already used by Skeletons:
strict immutable per-template JSON HP/Attack/Defense growth after rank growth,
before current auras; only fresh player-hero bodies. Same composition in previews.
Preserve owner1 bases, skill-rank growth, costs/caps/cooldowns, Blind/Poison/vines,
one complete missing batch per wave, owner authority and all other template families.
See [numeric contract](../../docs/plans/decisions/P15-druid-summon-owner-growth-v1.md).
Broader balance, campaign and final v1 acceptance remain open.

## Verification and earned follow-through

The seven-template JSON growth contract is implemented through the existing
Skeleton owner-growth seam, including matching previews. Ten new regression
checks failed before the change. The affected nine-file selection then passed
210/210 checks (`bug552-green-v1.log`); final strengthened schema and nested-copy
controls passed10/10 (`bug552-growth-final-v2.log`). Scoped types/lint passed
(`bug552-types-v2-exit.json`, `bug552-lint-v2-exit.json`). No save migration.
Full2091-input audit: `bug552-source-audit-v1.json`, source
`3ec0567f2eb3b29ecdc4d929d0e24b16d7bef11d5cfa84965860f9c24f3bd82c`.

The original unmodified Cold Plains policy now clears the former failure with
2870 summon damage versus283 hero/merc damage and all nine pets alive. Native
Acts I–II subsequently complete. At the earned Act II frontier, eligible owned
armor/shield/amulet/wand and a free mixed Spirit/Dire Wolf reset clear Arcane
and Duriel without additional socket costs. `p15-druid-summon-act2-native-v3.json`
and independent `p15-druid-summon-act2-readback-v3.json` retain all earlier losses,
costs and rewards. Act III progression continues from that exact save.

These are focused correctness and earned-route results, not a balance sign-off:
later packs, all summon identities, holdouts and full-v1 pacing remain open.


Five-act follow-through,2026-11-01: actual49/XP202871/next942,29areas/64canonical
actions. `p15-druid-summon-act5-native-v2.json` / independent readback-v2 pass;
all five final Claims/native Baal receipt pass the14-route roster audit. Original
Rogue/stat3skill1/two inherited Elds remain. Free Poison Creeper/Grizzly/wolves
and Barbs use earned points; no production tuning beyond this correction.
Retain all prior losses and partial native income. Ancients56.96s/Baal9.10s and
cold-pack variance keep numerical/holdout/pacing/final-v1 acceptance open.
