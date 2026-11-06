# P15 — Four finite monster self buffs

BUG424/425 fixed locally; numerical and earned-campaign acceptance pending.
[Contract](../decisions/P15-monster-self-buffs-v1.md). Enrage grants50%direct
increased damage for5s/CD6; Shout30%ordinary Defense for5s/CD5; Teleport50points
magical dodge for1s/CD3; Thorns50%physicalHP-loss reflection for60s/CD0. Each
pays one scheduled action; no recast inside its interval. JSON owns tuning.
Private per-source windows require exact immutable registered sources and real
living original monster consumers. Imported markers/player copies/replacements
grant no power. Half-open expiry, death withdrawal, Conversion personal identity,
ordinary mitigation/dodge/reflection paths preserved. No global generic buffs,
new save format, installs, remote writes or CI. Native bars/curves exact.

## Verification

RED19intendedFAIL/7controls across26. Green389PASS (26native/292loader/71registry).
Expanded29native/10resolver PASS; initial8UI failures arose from missing formation
positions in constructed fixtures, then corrected8UI PASS. Scoped lint20.235s
PASS; final fixture/testlint17.957s PASS. Strict types218.594s PASS. Consumer
sweep376PASS/5staleFAIL across381. BUG425updates four boss schedule slots,
Infidel sixthslot and its exact109/163Enrage ordinary-damage oracle. Initial
correction82PASS/1staleamountFAIL; complete repaired files83PASS22.894s. Failed
broad run retained; no one-shot clean sweep claim.

Chromium36.531s PASS: zh-CN/en ×360×640/1280×800,16localized blue buff chips,
no horizontal document overflow, no page/console/request errors, four enemy-grid
screenshots. Constructed paid observations at1700ms and constructed UI removal;
not earned progression. Screenshot's raw monster names come from constructed
fixture identity, not proof of natural catalog-name rendering. Firstthree buffs
have native exact expiry checks. Thorns activation is verified, but a61700ms
expiry lies beyond the60sbattle limit, so no natural end-to-end expiry claim.
All completed owned wrappers have no surviving descendants, except the two
pre-child wrapper errors below (no child launched). Arm caches absent.

## Frozen matched diagnostic

160fights/arm: fourL20native/probe pairs ×16seeds0–15 plus Tainted/DarkArcher
controls16each. TreeheadWoodfist/AncientBarbarian/Summoner boss tier, ThornedHulk
trash. Synthetic2000HP/80AttackheroAS100/zero defense/resists/dodge/crit/no skills;
60s/1000actions. No drops/rewards/earned/pacing/balance inference; no outcome-based
reruns. Native Summoner still starves Teleport behind its attacks.

32wins112losses16draws→32/96/32;16losses→draws. Buffcasts112→564; reflection0→426;
heroactions2301→2578, enemyactions2463→2752. Direct270868→259795, periodic3951
unchanged. Total simtime4142520→4597100ms. Direct totals include reflection;
logged damage is not effectiveHPremoved. Repeated buff actions displace ordinary
attacks, so aggregate damage alone does not measure potency. No balance signoff.

| Cell / arm | W/L/draw per16 | Direct / periodic / reflection | Buffcasts / heroactions | Logged DPS | Victory TTK p50/p95 s (n) |
| --- | --- | ---: | ---: | ---: | --- |
|act1.treehead-woodfist:native baseline|0/16/0|33820/0/0|16/213|79.753|unmeasured (0)|
|act1.treehead-woodfist:native candidate|0/16/0|34621/0/0|68/253|70.716|unmeasured (0)|
|act1.treehead-woodfist:probe baseline|0/16/0|34154/0/0|16/160|117.287|unmeasured (0)|
|act1.treehead-woodfist:probe candidate|0/16/0|34662/0/0|42/151|126.126|unmeasured (0)|
|act5.ancient-barbarian:native baseline|0/16/0|33932/0/0|16/179|108.603|unmeasured (0)|
|act5.ancient-barbarian:native candidate|0/16/0|33840/0/0|66/236|81.613|unmeasured (0)|
|act5.ancient-barbarian:probe baseline|0/16/0|35296/0/0|16/124|155.970|unmeasured (0)|
|act5.ancient-barbarian:probe candidate|0/16/0|34534/0/0|52/161|121.300|unmeasured (0)|
|act2.the-summoner:native baseline|0/0/16|19700/3581/0|0/513|24.251|unmeasured (0)|
|act2.the-summoner:native candidate|0/0/16|19700/3581/0|0/513|24.251|unmeasured (0)|
|act2.the-summoner:probe baseline|0/16/0|32530/0/0|16/396|46.916|unmeasured (0)|
|act2.the-summoner:probe candidate|0/0/16|22166/0/0|304/560|23.090|unmeasured (0)|
|act3.thorned-hulk:native baseline|0/16/0|33861/0/0|16/272|71.834|unmeasured (0)|
|act3.thorned-hulk:native candidate|0/16/0|33279/0/213|16/266|72.270|unmeasured (0)|
|act3.thorned-hulk:probe baseline|0/16/0|33861/0/0|16/272|71.834|unmeasured (0)|
|act3.thorned-hulk:probe candidate|0/16/0|33279/0/213|16/266|72.270|unmeasured (0)|
|act1.tainted:control baseline|16/0/0|4754/370/0|0/93|32.410|8.50/15.30 (16)|
|act1.tainted:control candidate|16/0/0|4754/370/0|0/93|32.410|8.50/15.30 (16)|
|act1.dark-archer:control baseline|16/0/0|8960/0/0|0/79|66.716|8.50/11.90 (16)|
|act1.dark-archer:control candidate|16/0/0|8960/0/0|0/79|66.716|8.50/11.90 (16)|

Standalone comparator-v2 recomputes320raw rows/640input-recording hashes,
160equalinputpairs,32whole-row exactcontrols and48recording-equal pairs.
Sources732→733; exact13production paths/fourJSONrows, five prepended schema
clauses plus sole added root property, fourstubremovals and registration;
284other installed skills exact by unique canonicalID. All unselected source
hashes exact. Locale changes limited to four descriptions and eight names per
language. Runtime integration scoped to private paid map and existing damage/
Defense/dodge/reflection/scheduler/presentation paths; no monster rows changed.

## Corrections and retained evidence

- First authoring script prepared12edits in memory but asserted on a duplicate
panicanchor before writing any; newmodule already separately existed. Corrected
anchor in author-v2 then wrote12files. No green ran on that partial state.
- Eight initialUI failures: absent grid positions in fixtures; only fixture
corrected. No production rendering workaround.
- BUG425stale permanent-marker schedules and damage expectations corrected as
above; failed logs preserved. No assertions skipped or weakened.
- Comparator-v1 used a wrong combat locale root and failed before writing a
comparison. V2uses effect.status/buff, preserving all other assertions and arms.
- Parallel Python-thread wrapper attempt failed125before child creation because
signal handlers require the main thread. Both v2receipts preserved; v3runs used
separate main-thread processes and passed. No child was started by v2.

Packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1
Root retains exact p15-monster-self-buffs-* drivers/launchers/original12files,
measured JSON/raw gzip, comparators, screenshots/browserreport/logs/receipts until
umbrella private-v1 acceptance. Arm caches absent and all real processes collected.
Umbrella worktree claim/typecache retained. Next BonePrison/scaling/campaign.

p15-monster-self-buffs-driver-v1.ts: `549712ac172722dc1950c28741ffcc60461b3679b7db5e50b2974a354e14ce16`

p15-monster-self-buffs-baseline-v1.jsonl.gz: `c0f64e47627b4c5d84ff3399cbda58f169dcf8fff249790135a31e13a8dca5d0`

p15-monster-self-buffs-candidate-v1.jsonl.gz: `270c58b97ae46ce91ec85510dcada1a30cf3add03508082572dfe646d50f8ad7`

p15-monster-self-buffs-compare-v2.json: `3224bf5e69e211613c0670bfbb4579496a29f6cadb7d03fa48fabb7432a89f56`
