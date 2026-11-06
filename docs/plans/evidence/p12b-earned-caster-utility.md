# P12b — Earned, level-eligible caster amulet utility

Verified 2026-11-04 in the existing claimed human2 worktree. The completed Cold
Sorceress legitimately crafts, equips and persists an earned eligible amulet.
This closes the eligibility/utility gap in the previous
[recipe-source qualification](p15-earned-recipe-affordability.md), using its own
Cold lineage and resources. No production source, requirements or costs change;
full recipe economy, pacing, balance and independent acceptance remain open.

## Earned source and native actions

Source `d2-cold-post-blizzard-jjevk1ng/p15-cold-post-blizzard-act5-v1.native-export.json`
is Save33, level74, Normal next1227, material ordinal1185; SHA256
`037ee71a0a542c1b96b961c697a8ef2016884eab98fd58c24dc8759d102a94c9`.
Magic zircon `it-4vn8g-1el2` drops in its retained journal line142, Throne
admission1226, runSeed2424838254, settled wave2. The exact payload matches the
native source. Its ilvl76 base requires60 and is legal at74.

Installed Playwright drives real WSL Chromium against the production-mode Vite
source app with the test bridge absent. Native Settings import uses the untouched
source. The zircon is equipped for comparison, then swapped with the original
tin amulet to return it to the backpack. Swaps preserve181 backpack/289 stash
items; ordinary unequip would refuse the over-capacity backpack. No item is
salvaged, staged into another lineage or manufactured.

Exactly two new paid actions commit:

| Ordinal | Native recipe | Exact cost and output |
| --- | --- | --- |
|1186|Perfect amethyst fusion|3flawless amethyst +1gem-shard →1perfect amethyst|
|1187|Caster amulet|Ral +that perfect amethyst +20scrap +1,000rune-shards; same zircon becomes rare|

The fixed package is Energy5/Mana20. Random prefix Mystic tier2 rolls57mana
and suffix Bat tier2 rolls27mana, both inside their authored ilvl/type/value
bounds. Base, identity, level and requirements remain unchanged. The old magic
amulet's60+54flat mana is replaced, not retained.

Final stock is Ral176, flawless amethyst305, perfect amethyst0, gem-shards2,
scrap188858 and rune-shards36,799,596. All unrelated item payloads, exact native
swap ordering, custody, other currencies, map/quest state, mercs, formation,
endgame, earned levels/points and challenge ordinal reconcile. No combat,
farming, leveling, Claim or earlier economic action is repeated.

## Useful effect with a real tradeoff

The production decoder restores serialized affix Maps. Every off-browser
`playerToCombatUnit` projection hydrates the matching complete player/inventory/
map/endgame/mercenary/formation context. All six full projected stat sheets equal
the native UI exports. Restoring the original tin restores the entire original
combat unit; crafted/equipped, pre-Continue and post-Continue units match exactly.

| Complete contribution | Magic zircon | Crafted zircon |
| --- | ---: | ---: |
|Allocated Energy|254|254|
|Raw Energy including all equipment|259|264|
|Effective Energy after soft cap|229.5|232|
|Complete equipment flat mana|204|194|
|Maximum mana|890|884|
|Mana regeneration/second|47.736|48.256|

Independent arithmetic includes Torch of Iros Energy5/Mana20, boots Mana32,
gloves Mana38, plus the old114mana or new20+57+27mana amulet. The soft cap halves
Energy above200. Mana is `floor(50 +73*4 + effectiveEnergy*1.5 + flatMana)`.
Authored recovery0.2 and Warmth rank1's0.04 give
`effectiveEnergy*0.2*1.04`. Crafting therefore trades6maximum mana for0.52mana/sec;
it is not a guaranteed upgrade. Current Life120/Mana102 stays unchanged rather
than refilling on swaps. No new combat or victory is claimed from this projection.

## Persistence and browser evidence

Native Save, close page, new page and Continue preserve all gameplay domains and
the exact crafted item/receipt at1187. Metadata is explicitly qualified:
English replaces the source's Chinese preference; all other settings and gacha/
recruitment state stay exact. Timestamps/lastOnline advance natively. Initial
Continue adds1,973ms informational offline time without a multiplier.

A supplemental read-only Continue inspects the actual saved equipped item.
Computed opacity is1 and animations are finished before capture. The retained
`en-mobile-crafted-successor-settled.png` visibly shows the legal level requirement
and all three affixes at360×640; a native welcome-back notice is also visible.
No document overflow or browser errors/warnings occur. This proves this bounded
inspection, not whole-app mobile/a11y acceptance. The original confirmation
screenshot was caught during fade-in and is retained without settled-readability
credit; the spent recipe is not replayed for another picture.

This extra reopen natively adds235,722ms away time, producing a78.574s fresh
bonus window; after1.579s online the export has76.995s remaining and multiplier
1.005133. Only clock/offline metadata changes; no XP/items/rewards are awarded.
The saved successor, current resources and all gameplay fields remain exact.

## Verification, review and custody

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-earned-caster-utility-7l_o0d56`.
It retains the bounded plan/security result, native stage exports, source/drop
provenance, observer, production projection, independent `audit.py`/`audit.json`,
settled screenshot/report, original reader failures and cleanup/review receipts.
Producer final review: **APPROVE** for this bounded utility/persistence evidence;
broader balance, affordability timing, active-hour pacing and full-v1 acceptance
remain excluded. The exact qualification is retained in `review.json`.

Both browser runs, projection and final audit exit0. Four reader bookkeeping
errors (swap ordering, two equipped-flag normalization boundaries and the rank
field) are corrected with exact checks retained; no gameplay is repeated.
All2,104files under `src/` remain byte-identical. No broad test suite or build runs.

Owned server4103876/session45722 closes cleanly and is absent. Browser contexts
close; exact browser-profile/vite-cache/projection-cache directories are removed
and verified absent. Root retains the required packet and referenced predecessor
evidence through unfinished umbrella review, then owns exact cleanup. The
human2 worktree remains claimed for the active full-v1 objective.

Counts remain14/14intended ActI,11/14intended Normal and formal0/210. Remaining
Zeal/Javelin/Double Swing acceptance, population economy and30–50active-hour
pacing, higher difficulties/endgame, PWA/device/a11y/performance, soak and
independent acceptance are not closed by this slice.
