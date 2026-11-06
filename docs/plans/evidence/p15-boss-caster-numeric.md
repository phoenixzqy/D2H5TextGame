# P15 — Boss caster numeric evidence

Eight definitions now have explicit ordinary Attack/Growth: seven low-melee
casters13/+2 and Blood Raven compatibility32/+5. Only16arrays added across five
act catalogs; every list, payload and other field unchanged. Chapter overrides
retain90/220/300/420/520. Inventory92authored/19pending; all111numerical
acceptances unaccepted. [Contract](../decisions/P15-boss-caster-numeric-v1.md).

## Verification

Native numeric tests RED27cases:16intended failures/11controls; production wave
consumer RED5cases:3intended failures/2controls. First green31PASS/1fixture
failure: existing Fire Arrow Ignite boosts Blood Raven physical by1.25, so the
literal30–50 assertion needs native ManaBurn to suppress Ignite. Corrected only
that fixture; normal complete-event equality retained. No runtime or arm rerun.
Final affected17files/624PASS,59.443s, including loader292, inventory, chapters,
BloodRaven, Summoner/Radament, previous caster/Doll and registry regressions.

Strict final-v1 PASS257.255s; latest-test final-v2 PASS7.232s. Scoped lint-v1
PASS12.462s before fixture correction; final-v2 PASS10.733s covers latest tests.
A first final-v2 wrapper invocation failed before child creation from the wrong
Python keyword; corrected to environment_overrides. No test result lost.
Independent read-only adviser reviewed native mechanics/oracles, exact delta,
all1216raw hashes/metrics and denominators: APPROVE, no material findings.
No clean full current-workspace suite or campaign acceptance is claimed.

## Frozen matched diagnostic

608fights/arm: eight L12boss subjects ×normal/ManaBurn ×32seeds0–31, plus
three unchanged L12trash controls ×32. Hero explicitly synthetic750HP/200Attack/
AS100, zero defense/resistance/dodge/crit; no earned build. Native60s limits,
seed0 replay/plain/immutability per cell and A/B/A. Arms never rerun/tuned.

Both148wins/459defeats/1draw. Ordinary1798→3684, active5425unchanged; logged
incoming damage389862→380650. Seven ManaBurn cells' logged DPS falls58.75–61.38%;
all still0/32victories, so victory TTK there is unmeasured. Equal outcomes do not
establish balance. BoneAsh base has no ordinary here because minions are killed/
replenished; separate native passive-cap test proves56ordinary. Base spell
coverage and BloodRaven calibrated explicit-basic behavior remain intact.

384event-equal pairs:256normal +32BloodRavenManaBurn +96controls. All96whole raw
control rows identical. Controls mostly die quickly; some act. This establishes
only bounded parity, not comprehensive live coverage. All469engine/data source
hashes stable within arms, including the new Doll resolver; exact eight-row/
16array delta across five paths, no other runtime changes. All1216input/recording
hashes and raw summaries independently recomputed. No loot settlement/drop yield.

Table: wins/defeats/draws per32; actions ordinary/active; damage is logged enemy
damage, not effective HP removed; DPS=damage/summed simulation seconds; victory
TTK seconds p50/p95 uses nearest-rank and its own denominator. Crit/dodge observed
counts share the damage-event denominator, including summons; they are not
configured probabilities.

| Cell/arm | W/D/draw | Ordinary/active | Logged damage / DPS | Victory TTK p50/p95 (n) | Crit/events, dodge/events |
| --- | --- | ---: | ---: | --- | --- |
|act1.bishibosh:base baseline|10/22/0|0/630|23693 / 20.843|35.70/40.80 (10)|59/622, 79/622|
|act1.bishibosh:base candidate|10/22/0|0/630|23693 / 20.843|35.70/40.80 (10)|59/622, 79/622|
|act1.bishibosh:mana-burn baseline|0/32/0|196/0|26127 / 74.888|unmeasured (0)|20/196, 23/196|
|act1.bishibosh:mana-burn candidate|0/32/0|473/0|24934 / 29.615|unmeasured (0)|47/473, 63/473|
|act1.bone-ash:base baseline|0/31/1|0/916|24955 / 16.062|unmeasured (0)|50/727, 90/727|
|act1.bone-ash:base candidate|0/31/1|0/916|24955 / 16.062|unmeasured (0)|50/727, 90/727|
|act1.bone-ash:mana-burn baseline|0/32/0|196/0|26127 / 76.610|unmeasured (0)|20/196, 23/196|
|act1.bone-ash:mana-burn candidate|0/32/0|473/0|24934 / 30.296|unmeasured (0)|47/473, 63/473|
|act2.dark-elder:base baseline|0/32/0|0/857|24666 / 17.564|unmeasured (0)|58/857, 125/857|
|act2.dark-elder:base candidate|0/32/0|0/857|24666 / 17.564|unmeasured (0)|58/857, 125/857|
|act2.dark-elder:mana-burn baseline|0/32/0|198/0|26056 / 81.232|unmeasured (0)|26/198, 30/198|
|act2.dark-elder:mana-burn candidate|0/32/0|464/0|24766 / 32.948|unmeasured (0)|51/464, 60/464|
|act2.the-summoner:base baseline|0/32/0|0/735|24685 / 21.496|unmeasured (0)|55/705, 90/705|
|act2.the-summoner:base candidate|0/32/0|0/735|24685 / 21.496|unmeasured (0)|55/705, 90/705|
|act2.the-summoner:mana-burn baseline|0/32/0|198/0|26056 / 81.232|unmeasured (0)|26/198, 30/198|
|act2.the-summoner:mana-burn candidate|0/32/0|464/0|24766 / 32.948|unmeasured (0)|51/464, 60/464|
|act3.mephisto:base baseline|0/32/0|0/639|24990 / 25.395|unmeasured (0)|49/639, 97/639|
|act3.mephisto:base candidate|0/32/0|0/639|24990 / 25.395|unmeasured (0)|49/639, 97/639|
|act3.mephisto:mana-burn baseline|0/32/0|198/0|26056 / 85.452|unmeasured (0)|26/198, 30/198|
|act3.mephisto:mana-burn candidate|0/32/0|457/0|24808 / 35.250|unmeasured (0)|56/457, 56/457|
|act4.diablo:base baseline|0/32/0|0/622|24874 / 28.933|unmeasured (0)|55/622, 87/622|
|act4.diablo:base candidate|0/32/0|0/622|24874 / 28.933|unmeasured (0)|55/622, 87/622|
|act4.diablo:mana-burn baseline|0/32/0|193/0|26091 / 97.961|unmeasured (0)|25/193, 24/193|
|act4.diablo:mana-burn candidate|0/32/0|466/0|24752 / 38.490|unmeasured (0)|52/466, 63/466|
|act5.baal:base baseline|0/32/0|0/818|24596 / 23.130|unmeasured (0)|62/818, 123/818|
|act5.baal:base candidate|0/32/0|0/818|24596 / 23.130|unmeasured (0)|62/818, 123/818|
|act5.baal:mana-burn baseline|0/32/0|188/0|26229 / 107.320|unmeasured (0)|29/188, 21/188|
|act5.baal:mana-burn candidate|0/32/0|456/0|24570 / 41.447|unmeasured (0)|49/456, 54/456|
|act1.blood-raven:base baseline|10/22/0|146/179|22571 / 48.539|15.30/18.70 (10)|33/356, 49/356|
|act1.blood-raven:base candidate|10/22/0|146/179|22571 / 48.539|15.30/18.70 (10)|33/356, 49/356|
|act1.blood-raven:mana-burn baseline|32/0/0|265/0|9316 / 26.863|10.20/13.60 (32)|17/265, 40/265|
|act1.blood-raven:mana-burn candidate|32/0/0|265/0|9316 / 26.863|10.20/13.60 (32)|17/265, 40/265|
|act1.tainted:control baseline|32/0/0|0/2|24 / 0.415|1.70/3.40 (32)|0/2, 1/2|
|act1.tainted:control candidate|32/0/0|0/2|24 / 0.415|1.70/3.40 (32)|0/2, 1/2|
|act1.dark-archer:control baseline|32/0/0|12/0|1152 / 19.361|1.70/3.40 (32)|2/12, 1/12|
|act1.dark-archer:control candidate|32/0/0|12/0|1152 / 19.361|1.70/3.40 (32)|2/12, 1/12|
|act1.disfigured:control baseline|32/0/0|8/27|1598 / 14.030|3.40/6.80 (32)|1/35, 2/35|
|act1.disfigured:control candidate|32/0/0|8/27|1598 / 14.030|3.40/6.80 (32)|1/35, 2/35|

## Provenance and retained evidence

Driver SHA256:0776c69c971144af24d139d1c93996a1dea42c4f3d166cd0f2a66f3278b54567.
Baseline gzip:5c1d11fa7dbcd2aca81c1281e28f922b609b0c6c47b7a3b392dddc9922c2cffc.
Candidate gzip:f63a5041d29b5f5f76161027569767d55e1a3def57c74419778c858f5c15cfbf.
Baseline wrapper9.121s/candidate7.486s,exit0/no owned descendants. Exact arm
Vite caches verified absent. All owned verification/diagnostic sessions collected.

Packet:/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1.
Root retains exact p15-boss-caster-* drivers/raw gzip/JSON/logs/receipts and
umbrella type cache through final acceptance, and owns eventual cleanup. Existing
worktree claim remains active for continuing implementation. Chromium works;
CI excluded/deleted. Payload identities,19remaining generic-first bosses and
coherent earned five-act/14-build/pacing/defeat-retry acceptance remain pending.
