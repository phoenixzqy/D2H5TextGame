# P15 — Remaining boss/special signature family evidence

Implementation, frozen diagnostic and bounded regression/static closure verified.
BUG419 fixed locally; numerical and earned-campaign acceptance remain open.

All19remaining generic-first boss/special definitions now retain only their
original signatures in original relative order, with provisional Attack/Growth.
Only19lists/38arrays across Act1/2/4/5. Every other field and all other definitions,
engine/schema/payload/locale data remain exact. [Contract](../decisions/P15-boss-signature-family-v1.md).
Inventory111authored/0pending, all111numerical acceptances unaccepted.

## Native behavior and limitations

57native cases pin literal L1/L12/L90 boss curves/ranges, delivery, unchanged
nonattack construction/RNG, first8native actions, all19ManaBurn ordinary damage,
immutability/plain/recorded replay. Seven covered cases are Coldcrow, Pitspawn,
Countess, Andariel, AncientKaa, Radament and Beetleburst. Andariel Charge stays
hidden behind Spit/Cloud. Coldcrow ordinary delivery remains ranged, other18melee.
Coldworm/Radament startup summons and cap behavior remain native. Enrage/Shout
are exposed permanent one-time markers with no stat effects; default low-life
enrage does not change cadence without authored multipliers. Native Whirlwind
stays40–60/CD3 and Lightning40–60/CD2. Ancient ordinary804/L75 and954/L90 dwarfs
its fixed Whirlwind; payload/scaling/earned balance remains explicitly pending.

Seven production buildEnemiesForWave tests pin full rosters/sources, levels,
tiers, curves/order and actual signature actions: RadamentL22+fourtrashMummies,
IzualL49+two bossKnights, threeL75Ancients, CountessL13singleton, CowKingL13+
two trashBovines, both endgame fullW4L90Ancient+two modifier guards. All five
chapter override stats/orders remain exact90/220/300/420/520.
Comprehensive planner/quest coverage is still pending, separately from these checks.

Initial native RED54intendedFAIL/3compatibilitycontrols across57cases,17.369s;
consumerRED7intendedFAIL,21.874s. Preflight strict typesPASS11.777s/lintPASS16.016s.
Source audit then corrected Coldcrow's expected ranged identity before production
mutation; the prior test hash is retained. Initial green5files/99PASS,47.640s.
Broad sweep/static findings and final closure results are recorded below.

## Frozen matched diagnostic

1536fights/arm:19L12boss subjects ×normal/ManaBurn ×32seeds0–31, threeL12trash
controls ×32, sevenactual fullnativewaves ×32. Duels use synthetic750HP/200Attack,
native waves50000HP/2000Attack, allAS100/zero defense/resistances/dodge/crit.
These are stress fixtures, not earned builds. Native60s limits; all inputs
immutable, seed0percell plain/recorded replay and A/B/A verified. No rerun/tuning/
seed selection. No rewards/drop settlement, campaign or pacing inference.

228wins/1169defeats/139draws→193/1207/136.35wins→defeats,69draws→defeats,
66defeats→draws. Corpsefire base15wins→0; Coldcrow21wins/11draws→1win/31defeats;
actual Ancients32draws→32defeats; AshenW4 32draws→26defeats/6draws. Radament
keeps32wins but victoryTTK p50/p95 rises20.4/25.5s→32.3/47.6s. This material
threat increase does not establish accepted campaign balance.

Logged incoming damage3429547→6676748; ordinary8408→14503, active25448→16160,
generic21598→0. Action counts cover original enemy IDs, including native guards,
excluding summoned minion actions. Incoming logged damage includes summoned
sources and periodic events; it is not effective HP removed. Crit/dodge counts
cover incoming targethero damage events only, not enemy avoidance of hero hits.
DPS uses summed simulation seconds. Victory TTK nearest-rank p50/p95 seconds has
its own explicit denominator; losses/draws are not assigned a victory TTK.

All3072raw rows/input/recording hashes and summaries recomputed;731source hashes
stable within arms, exact19-row structural delta across fourJSONpaths and no
other runtime changes. All1536paired inputs equal after normalizing only selected
enemy Attack/range/order.96whole raw controls exact,192event-equal pairs
(96controls +96compatibility ManaBurn cases). Controls mostly die quickly; some
act. Bounded parity does not prove broad live equivalence. No drop yield measured.

| Cell/arm | W/D/draw per32 | Ordinary/active/generic | Logged damage / DPS | Victory TTK p50/p95 (n) | Crit/events, dodge/events |
| --- | --- | ---: | ---: | --- | --- |
|act1.corpsefire:base baseline|15/17/0|0/641/641|23076 / 19.214|37.40/44.20 (15)|49/641, 96/641|
|act1.corpsefire:base candidate|0/32/0|129/139/0|26001 / 51.577|unmeasured (0)|22/268, 31/268|
|act1.corpsefire:mana-burn baseline|0/32/0|196/0/0|26127 / 71.667|unmeasured (0)|20/196, 23/196|
|act1.corpsefire:mana-burn candidate|0/32/0|215/0/0|25671 / 64.194|unmeasured (0)|22/215, 26/215|
|act1.rakanishu:base baseline|0/32/0|0/684/684|24639 / 22.236|unmeasured (0)|52/684, 97/684|
|act1.rakanishu:base candidate|0/32/0|69/247/0|25453 / 48.956|unmeasured (0)|35/316, 28/316|
|act1.rakanishu:mana-burn baseline|0/32/0|198/0/0|26056 / 81.232|unmeasured (0)|26/198, 30/198|
|act1.rakanishu:mana-burn candidate|0/32/0|198/0/0|26056 / 81.232|unmeasured (0)|26/198, 30/198|
|act1.coldcrow:base baseline|21/0/11|0/1142/1142|11540 / 6.457|54.40/57.80 (21)|95/1135, 154/1135|
|act1.coldcrow:base candidate|1/31/0|0/940/0|24398 / 16.748|48.43/48.43 (1)|68/940, 144/940|
|act1.coldcrow:mana-burn baseline|0/32/0|198/0/0|26056 / 85.452|unmeasured (0)|26/198, 30/198|
|act1.coldcrow:mana-burn candidate|0/32/0|177/0/0|26412 / 96.896|unmeasured (0)|25/177, 23/177|
|act1.treehead-woodfist:base baseline|0/32/0|0/668/668|24647 / 20.273|unmeasured (0)|51/668, 93/668|
|act1.treehead-woodfist:base candidate|0/32/0|112/187/0|25814 / 47.437|unmeasured (0)|27/267, 39/267|
|act1.treehead-woodfist:mana-burn baseline|0/32/0|196/0/0|26127 / 73.242|unmeasured (0)|20/196, 23/196|
|act1.treehead-woodfist:mana-burn candidate|0/32/0|161/0/0|27004 / 92.158|unmeasured (0)|19/161, 20/161|
|act1.pitspawn-fouldog:base baseline|0/32/0|0/686/686|24637 / 24.599|unmeasured (0)|55/686, 103/686|
|act1.pitspawn-fouldog:base candidate|0/32/0|0/554/0|24632 / 30.021|unmeasured (0)|49/553, 75/553|
|act1.pitspawn-fouldog:mana-burn baseline|0/32/0|197/0/0|26056 / 90.592|unmeasured (0)|26/197, 29/197|
|act1.pitspawn-fouldog:mana-burn candidate|0/32/0|177/0/0|26412 / 102.206|unmeasured (0)|25/177, 23/177|
|act1.the-countess:base baseline|0/32/0|0/686/686|24633 / 21.631|unmeasured (0)|53/686, 100/686|
|act1.the-countess:base candidate|0/32/0|0/654/0|24708 / 22.428|unmeasured (0)|55/654, 89/654|
|act1.the-countess:mana-burn baseline|0/32/0|198/0/0|26056 / 79.275|unmeasured (0)|26/198, 30/198|
|act1.the-countess:mana-burn candidate|0/32/0|464/0/0|24766 / 32.154|unmeasured (0)|51/464, 60/464|
|act1.griswold:base baseline|0/32/0|0/677/677|24662 / 20.936|unmeasured (0)|48/677, 95/677|
|act1.griswold:base candidate|0/32/0|89/193/0|26354 / 53.709|unmeasured (0)|23/282, 36/282|
|act1.griswold:mana-burn baseline|0/32/0|196/0/0|26127 / 76.610|unmeasured (0)|20/196, 23/196|
|act1.griswold:mana-burn candidate|0/32/0|161/0/0|27004 / 96.395|unmeasured (0)|19/161, 20/161|
|act1.the-smith:base baseline|0/32/0|0/673/673|24703 / 20.621|unmeasured (0)|50/673, 93/673|
|act1.the-smith:base candidate|0/32/0|108/183/0|25811 / 49.830|unmeasured (0)|27/259, 33/259|
|act1.the-smith:mana-burn baseline|0/32/0|196/0/0|26127 / 74.888|unmeasured (0)|20/196, 23/196|
|act1.the-smith:mana-burn candidate|0/32/0|161/0/0|27004 / 94.228|unmeasured (0)|19/161, 20/161|
|act1.andariel:base baseline|0/32/0|0/684/684|24639 / 22.236|unmeasured (0)|52/684, 97/684|
|act1.andariel:base candidate|0/32/0|0/462/0|24708 / 32.345|unmeasured (0)|35/461, 55/461|
|act1.andariel:mana-burn baseline|0/32/0|198/0/0|26056 / 81.232|unmeasured (0)|26/198, 30/198|
|act1.andariel:mana-burn candidate|0/32/0|163/0/0|27610 / 104.560|unmeasured (0)|25/163, 23/163|
|act1.cow-king:base baseline|0/32/0|0/668/668|24647 / 20.273|unmeasured (0)|51/668, 93/668|
|act1.cow-king:base candidate|0/32/0|112/187/0|25814 / 47.437|unmeasured (0)|27/267, 39/267|
|act1.cow-king:mana-burn baseline|0/32/0|196/0/0|26127 / 73.242|unmeasured (0)|20/196, 23/196|
|act1.cow-king:mana-burn candidate|0/32/0|161/0/0|27004 / 92.158|unmeasured (0)|19/161, 20/161|
|act2.fire-eye:base baseline|0/32/0|0/687/687|24830 / 22.875|unmeasured (0)|53/687, 102/687|
|act2.fire-eye:base candidate|0/32/0|64/211/0|27324 / 62.717|unmeasured (0)|27/275, 35/275|
|act2.fire-eye:mana-burn baseline|0/32/0|198/0/0|26056 / 83.289|unmeasured (0)|26/198, 30/198|
|act2.fire-eye:mana-burn candidate|0/32/0|163/0/0|27610 / 107.207|unmeasured (0)|25/163, 23/163|
|act2.coldworm-the-burrower:base baseline|0/32/0|0/707/675|24752 / 20.601|unmeasured (0)|51/677, 95/677|
|act2.coldworm-the-burrower:base candidate|0/4/28|19/1065/0|16700 / 8.753|unmeasured (0)|55/683, 97/683|
|act2.coldworm-the-burrower:mana-burn baseline|0/32/0|196/0/0|26127 / 74.888|unmeasured (0)|20/196, 23/196|
|act2.coldworm-the-burrower:mana-burn candidate|0/32/0|473/0/0|24934 / 29.615|unmeasured (0)|47/473, 63/473|
|act2.fangskin:base baseline|0/32/0|0/677/677|24755 / 24.377|unmeasured (0)|56/677, 94/677|
|act2.fangskin:base candidate|0/32/0|67/239/0|25174 / 53.906|unmeasured (0)|32/306, 30/306|
|act2.fangskin:mana-burn baseline|0/32/0|198/0/0|25952 / 87.380|unmeasured (0)|25/198, 30/198|
|act2.fangskin:mana-burn candidate|0/32/0|177/0/0|26412 / 99.480|unmeasured (0)|25/177, 23/177|
|act2.ancient-kaa:base baseline|0/32/0|0/677/677|24705 / 21.466|unmeasured (0)|52/677, 92/677|
|act2.ancient-kaa:base candidate|0/22/10|0/1060/0|24004 / 13.204|unmeasured (0)|97/1060, 148/1060|
|act2.ancient-kaa:mana-burn baseline|0/32/0|199/0/0|26335 / 77.845|unmeasured (0)|22/199, 26/199|
|act2.ancient-kaa:mana-burn candidate|0/32/0|199/0/0|26335 / 77.845|unmeasured (0)|22/199, 26/199|
|act2.radament:base baseline|0/32/0|0/710/678|24744 / 21.468|unmeasured (0)|54/682, 95/682|
|act2.radament:base candidate|0/4/28|0/1137/0|16926 / 8.944|unmeasured (0)|68/687, 101/687|
|act2.radament:mana-burn baseline|0/32/0|199/0/0|26335 / 77.845|unmeasured (0)|22/199, 26/199|
|act2.radament:mana-burn candidate|0/32/0|199/0/0|26335 / 77.845|unmeasured (0)|22/199, 26/199|
|act2.beetleburst:base baseline|0/32/0|0/677/677|24662 / 20.936|unmeasured (0)|48/677, 95/677|
|act2.beetleburst:base candidate|0/32/0|0/603/0|24781 / 23.618|unmeasured (0)|42/603, 81/603|
|act2.beetleburst:mana-burn baseline|0/32/0|196/0/0|26127 / 76.610|unmeasured (0)|20/196, 23/196|
|act2.beetleburst:mana-burn candidate|0/32/0|179/0/0|26454 / 84.935|unmeasured (0)|20/179, 21/179|
|act2.duriel:base baseline|0/32/0|0/677/677|24755 / 24.377|unmeasured (0)|56/677, 94/677|
|act2.duriel:base candidate|0/32/0|90/192/0|26596 / 62.875|unmeasured (0)|30/282, 29/282|
|act2.duriel:mana-burn baseline|0/32/0|198/0/0|25952 / 87.380|unmeasured (0)|25/198, 30/198|
|act2.duriel:mana-burn candidate|0/32/0|163/0/0|27610 / 112.924|unmeasured (0)|25/163, 23/163|
|act4.izual:base baseline|0/32/0|0/677/677|24755 / 24.377|unmeasured (0)|56/677, 94/677|
|act4.izual:base candidate|0/32/0|86/298/0|26025 / 45.182|unmeasured (0)|38/384, 60/384|
|act4.izual:mana-burn baseline|0/32/0|198/0/0|25952 / 87.380|unmeasured (0)|25/198, 30/198|
|act4.izual:mana-burn candidate|0/32/0|163/0/0|27610 / 112.924|unmeasured (0)|25/163, 23/163|
|act5.ancient-barbarian:base baseline|0/32/0|0/686/686|24637 / 24.599|unmeasured (0)|55/686, 103/686|
|act5.ancient-barbarian:base candidate|0/32/0|138/130/0|26592 / 67.962|unmeasured (0)|19/236, 30/236|
|act5.ancient-barbarian:mana-burn baseline|0/32/0|197/0/0|26056 / 90.592|unmeasured (0)|26/197, 29/197|
|act5.ancient-barbarian:mana-burn candidate|0/32/0|163/0/0|27610 / 116.018|unmeasured (0)|25/163, 23/163|
|act1.tainted:control baseline|32/0/0|0/2/0|24 / 0.415|1.70/3.40 (32)|0/2, 1/2|
|act1.tainted:control candidate|32/0/0|0/2/0|24 / 0.415|1.70/3.40 (32)|0/2, 1/2|
|act1.dark-archer:control baseline|32/0/0|12/0/0|1152 / 19.361|1.70/3.40 (32)|2/12, 1/12|
|act1.dark-archer:control candidate|32/0/0|12/0/0|1152 / 19.361|1.70/3.40 (32)|2/12, 1/12|
|act1.disfigured:control baseline|32/0/0|8/27/0|1598 / 14.030|3.40/6.80 (32)|1/35, 2/35|
|act1.disfigured:control candidate|32/0/0|8/27/0|1598 / 14.030|3.40/6.80 (32)|1/35, 2/35|
|native:areas/act2-far-oasis baseline|32/0/0|1038/223/191|130717 / 202.882|20.40/25.50 (32)|58/1233, 174/1233|
|native:areas/act2-far-oasis candidate|32/0/0|1873/460/0|233523 / 224.822|32.30/47.60 (32)|108/2156, 310/2156|
|native:areas/act4-plains-of-despair baseline|0/0/32|1088/2432/1280|570299 / 297.031|unmeasured (0)|289/3520, 529/3520|
|native:areas/act4-plains-of-despair candidate|0/0/32|1408/2112/0|755802 / 393.647|unmeasured (0)|298/3520, 545/3520|
|native:areas/act5-ancients-way baseline|0/0/32|0/3936/3936|143519 / 74.749|unmeasured (0)|348/3936, 595/3936|
|native:areas/act5-ancients-way candidate|0/32/0|2109/1239/0|1615414 / 980.894|unmeasured (0)|278/3252, 469/3252|
|native:act1-dw-countess baseline|32/0/0|0/125/125|4525 / 21.294|5.10/10.20 (32)|8/125, 13/125|
|native:act1-dw-countess candidate|32/0/0|0/116/0|3050 / 15.467|5.10/10.20 (32)|8/84, 11/84|
|native:act1-dw-cow-king baseline|32/0/0|210/263/122|34905 / 90.054|11.90/15.30 (32)|30/473, 66/473|
|native:act1-dw-cow-king candidate|32/0/0|230/247/0|38261 / 97.854|11.90/17.00 (32)|23/445, 60/445|
|native:ashen:worldstone-remnant/w4 baseline|0/0/32|1152/2528/1312|870850 / 453.568|unmeasured (0)|220/3680, 551/3680|
|native:ashen:worldstone-remnant/w4 candidate|0/26/6|1879/1580/0|1602530 / 882.606|unmeasured (0)|173/3427, 518/3427|
|native:glacial:worldstone-remnant/w4 baseline|0/0/32|1152/2528/1312|721733 / 375.903|unmeasured (0)|218/3680, 549/3680|
|native:glacial:worldstone-remnant/w4 candidate|0/0/32|1984/1696/0|1451726 / 756.107|unmeasured (0)|205/3648, 557/3648|

## Independent attribution audit

Read-only implementation/evidence review APPROVE. Independently recomputed all
6144input/recording hashes across3072rows, recipe/driver/raw hashes,731sources,
exact19-row delta,1536normalized pairs,96controls and every metric/transition.
Coldcrow ordinary is0in both base arms; its worse outcomes follow exposed479
FrostBolt/461FrostNova casts and796Chill applications, not its authored ordinary
curve. Corpsefire candidate ordinary17551of26001logged incoming damage, with
1610DoT. Native Ancients ordinary1563177of1615414direct damage (96.77%), logged
DPS74.749→980.894; AshenAncient ordinary806047of829265subject direct damage.
GlacialW4 stays32draws but incomingDPS375.903→756.107. Radament Attack219/
ordinary0 is compatible; summons32→220 and hero actions379→611 prolong fights.
Companion/minion direct damage123183→227686; only10FireBreath casts due preserved
replacement priority. These are retained adverse numerical/pacing observations,
not grounds for favorable fixture retuning or acceptance.

## Provenance and retained evidence

Driver SHA256:674064651b917cf7aaf5cf2f771166be8d5d0dfdaac71784bcaf1ea88ef07a0f.
Baseline gzip:bcee8537144a5a2812a177cc7cb9ac46b09f7ed04975e983a7203d92d435c229.
Candidate gzip:123a230cf997f1ee482fbcfdb16657a26d3ae0a51f0b736f06912436340dbabe.
Baseline wrapper16.547s/candidate31.904s,exit0/no owned live descendants. Exact
arm Vite caches absent. No runtime edits after capture; later fixture edits do
not alter measured data. Root comparator verifies hashes/structural/input/raw
parity, metrics and process-cache limits without battle reruns.

Packet:/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1.
Root retains exact p15-boss-signature-* preflights/recipe/drivers/rawgzip/JSON/
logs/receipts and existing umbrella typecache/claim through complete-v1 acceptance,
and owns eventual cleanup. Browser works; CI excluded/deleted. Payload identities
and coherent earned five-act/14-build/pacing/defeat-retry acceptance remain open.

## Regression and static closure

Focused native/consumer green5files99PASS; related16files468PASS60.704s.
Full engine sweep completed511files/14038cases in619.586s wrapper:
508files14030PASS,3files8FAIL. All8failures were stale catalog oracles:
2Rend consumer list expectations, Vengeance's death-only composite member and
5DarkStalker generic fillers superseded by the prior melee-family contract.
No runtime code was changed to satisfy these tests. Repaired full files:
melee56+chapter5PASS24.102s, Vengeance16PASS24.836s, DarkStalker6PASS15.659s.
Thus all14038 pre-DoT engine cases are covered by the original sweep plus
focused repairs; the original sweep remains failed, not a clean one-shot PASS.
New BUG421 DoT tests were authored afterward and are outside that snapshot.

Initial final scoped lint failed on the now-always-true chapter authored flag;
all5chapter range assertions are now unconditional. Scoped final lint18.089s,
Vengeance26.260s and DarkStalker16.804s PASS. Strict types final-v1 PASS317.745s;
latest incremental final-v2 PASS12.443s covers all repaired fixtures before
BUG421's later test addition. Prior preflight types/lint also passed. BUG420
tracks the cross-increment oracle repairs, with Doll/Stalker evidence linked.
No gameplay/payload changes beyond the exact19lists/38arrays described above.

Every reported wrapper ended without timeout or owned live descendants; all
sessions collected. Frozen arms were not rerun. Exact arm caches remain absent.
Umbrella raw evidence/typecache/worktree remain retained for ongoing v1 work.
