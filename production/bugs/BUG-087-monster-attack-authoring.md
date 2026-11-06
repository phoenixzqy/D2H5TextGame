# BUG-087 — Monster ordinary attacks omit authored archetype progression

Status: shared runtime fixed at `e3bf53a`; 83 of the current 111 catalog rows
now have authored numeric pairs locally, including physical and elemental families.
The remaining 28 need numeric review; all numerical balance remains unaccepted.
The catalog inventory also tracks action-mechanic gaps independently. Severity: High.
Owners: engine-dev/content-designer; GD/TD/QA.

Environment: Node production-service continuation, implementation `06f3c88`;
locale/viewport independent. Retained P14a01 Catacombs old/reviewed reports.

Reproduce: restore the earned four-map final saveSHA
`c32f919de346b2230322630254e7d1e2c3e0cd0185398cc210064aa7ae22c3e0`;
attempt all Catacombs waves at seed2223645302/ordinal106. Both boss packages
win W1–3 and lose W4 at7653.846153846154ms, before Andariel. Do not replay from
either failed diagnostic export or finance preparation with its guard rewards.

Actual: every archetype falls back to generic Attack32/+5 per level. Thirteen
ordinary/champion L17 enemies include six Shamans; their physical fallbacks
deal240of352incoming damage. The intended archetype attack/growth model is
absent from all109 JSON rows. Shaman ordinary Attack112/168 dominates its
actual zero-mana Fire Bolt. There are no summons in the failing wave.

Expected: [approved shared attack contract](../../docs/plans/decisions/P14a02-monster-attack-growth-v1.md).
Use data-authored level growth/tier scaling once, exact overrides and existing
mitigation; preserve active spells and Blood Raven's explicit base action.
The Shaman13/+2 package is new provisional numeric design, not proof the old
level-one range must remain fixed at L17. Remaining catalog migration remains
open; native resurrection is now locally verified separately in BUG-404.
Changing corpse revival would not solve this wave,
which has no enemy death.

Root cause: monster schema/type/factory lacks per-archetype attack/growth,
leaving one generic fallback as ordinary combat damage for all monster roles.
The shared schema/type/factory/combat gap is fixed, with genuine47RED/5controls,
finalE4121/U8536/T/L/build and four production browser cases passing. See
[P14a02 evidence](../../docs/plans/evidence/p14a02-monster-attack.md). Complete
matched cohort improves1→14wins/1000, but the original earned route still loses
CatacombsW4 before the boss; this does not accept campaign balance. Remaining
catalog numeric authoring stays open; see BUG-404 for current resurrection evidence.

## Current follow-on authoring

Carver Shaman and Devilkin Shaman now share the approved support-caster13/+2
ordinary attack/growth. Their permitted tier values are checked at L1/L12/L17;
ordinary damage is45 at L17 rather than the generic112. Fire Bolt event streams
and RNG are identical when comparing each row with its own legacy counterpart.
All existing life/spell/defense/resistance/XP/spawn/affix values and all other
monster rows are byte/structure-preserved by the four-array data delta.

Six intended data/factory/ordinary-damage regressions failed before authoring;
54 control checks passed. Updated attack/compatibility suites64/64 and central
loader292/292 pass. See [follow-on evidence](../../docs/plans/evidence/p15-shaman-followon.md).
This fixes two additional content rows, not campaign balance or resurrection.

## Current action-source finding

The subsequent native-priority audit shows that generic zero-cost one-second
melee skills can win every ordinary action, suppressing signatures and authored
fallback Attack. Further numeric authoring alone cannot establish role behavior.
The separately reviewed Tainted poison-active/ordinary-melee correction is now
applied locally with functional and matched diagnostic evidence below. Numeric
authoring of the remaining101 rows remains open; no balance gain is claimed.


### Tainted action-source reproduction (2026-10-30)

Affected systems: monster content, native skill selection/factory/projectile
combat; GD/content/engine/QA. Build is `b5a0898` plus retained local private-v1
changes. Locale/viewport independent; pure native engine fixture.

1. Load bundled Tainted through `buildMonsterUnit` atL3/trash with factoryseed7.
2. Load the default skill registry without reordering or substituting skills.
3. Run battle seed13against the disclosed passive tank fixture in
   `src/engine/combat/tainted-action-source.test.ts`.

Expected reviewed role: Poison Spit at1780ms, ordinary physical melee at3560ms,
then Spit at5340ms; Spit impacts500ms after each cast. Actual unchanged source:
zero-cost1scooldown `monster.weak_melee` takes every1780msaction, suppressing
Poison Spit and ordinary fallback. Stable2000msChill also keeps selecting weak
melee. Numeric fallback authoring alone cannot expose these actions.

Meaningful test-only RED `p15-tainted-action-red-v1.log`/`-exit.json`:5failed,
6passed; exit1in8.141s, no timeout/error/live owned descendants. This pins the
real current factory/default-order defect before data changes. The test's
passive/damage-endpoint fixtures are synthetic functional evidence, not earned
viability. A separately declared matched cohort will retain the native baseline
before removing only the Tainted row's generic weak-melee entry. All stats,
other rows, selector and registered skill mechanics stay unchanged. No balance
benefit or full-catalog acceptance is claimed by this RED.

### Tainted local correction and matched result (2026-10-30)

Only Tainted's skills list changed to `["monster-poison-spit"]`. The selector,
registry, stats, rewards, spawns and other rows are unchanged. This exposes
ordinary Attack32/+5 during Spit's cooldown. The native regression is GREEN:
7files/468tests, including11Tainted cases and loader292cases. Lint subsequently
found two asymmetric-matcher callback return types in the new test; after both
cohort arms completed, explicit `unknown` return annotations corrected those
types without changing assertions or runtime behavior. The final11cases passed
again. See [bounded evidence](../../docs/plans/evidence/p15-tainted-action-source.md).

The predeclared cohort completed once per arm: four constructed unearned cells,
1000seeds each,4000paired fights; native reconciliation, deterministic replay,
plain/recorded parity and full3053input inventories passed. Only act1.json
differed between arm inventories, with the exact single skill-list byte delta.
No retries or tuning were performed.

Deaths per1000 baseline→candidate: L3Barbarian0→60, L3FireBolt1Sorceress0→2,
L17Barbarian0→130, L17FireBolt1Sorceress0→919. Baseline selected only weak melee;
candidate naturally selected Spit and ordinary attacks. This is a material
increase in threat, not neutral cleanup or accepted campaign balance. The
heroes had no equipment and unspent stat points (and only rank1FireBolt for
the caster); these cells do not establish earned route viability, item yield,
five-act pacing or optimized-build balance. BUG087 stays open for catalog role
and numerical review.


### Ordinary physical family reproduction and adopted scope

The source audit identifies20physical rows with only generic CD1/MP0 skills.
With real bundled definitions/default registry at native cadence, every action
selects generic Weak/Strong/Ranged instead of skillId:null; five existing curves
are unreachable in normal cadence,15others retain legacy32/+5. This is the
existing BUG087action-source cause, not a new unrelated engine defect.

Adopt [catalog decision](../../docs/plans/decisions/P15-monster-catalog-v1.md):
allow required-empty skills, remove only20generic lists and author15role curves;
preserve five curves and all other fields. Native RED and genuine baseline
precede mutation. RaisedZombies and endgameL90Savage are material consumers.
No campaign or balance acceptance is implied; remaining86numeric rows stayopen
after this bounded batch.


### Post-adoption regression fixture findings

First related run509cases has506pass/3fail. New family fixture wrongly assumes
SandMaggotYoung canBeElite:true; actual preserved source isfalse. Two endgame
authority fixtures copy the first Savage into a synthetic million-Attack hero.
The newly authored monster attackRange is also copied, so scalar-only hero
Attack override no longer makes a decisive synthetic hero: both variants draw.
Correct the fixture to explicitly supply its intended million-point range;
keep real monster stats, battle assertions and reward-authority checks. These
are fixture assumptions, not evidence that real earned endgame is viable.


### Fallen family Panic repair

Fallen/Dark One/Devilkin now expose ordinary attacks except for one real finite
shaman-death reaction per original recipient/wave. Dark One/Devilkin32/+5 adopt
the old fallback provisionally; inventory27authored/84pending, all numerical
balance unaccepted.67focused/247combined cases, strict types/scoped lint and
independent bounded reviews PASS/APPROVE. Integration fixture/trace repairs and
remaining full-sweep collection are explicit in
[Panic evidence](../../docs/plans/evidence/p15-fallen-panic.md). No campaign rerun.


### 2026-10-30 — Melee signature family verified

20selected rows now use their signatures and authored ordinary curves; five
physical skills read validated immutable JSON payloads, with actual finite Rend
Bleed. Inventory47authored/64pending, all numerical balance unaccepted.
Final18files/975PASS, strict types/scoped lint PASS and independent reviews
APPROVE. Exact fixed5200fights/arm:561/143/4496wins/losses/draws→39/4622/539;
material threat increase. All400excluded controls are recording-hash-identical
and expose zero Rend. Native ShenkL60andL90oracles are separately verified;
L55diagnostic boss duels remain synthetic. Source/recipe/raw/parity/cleanup
checks PASS; complete cells and failures in docs/plans/evidence/
p15-melee-signature-family.md. Fixed high-level signatures remain a balance
concern; no earned campaign/pacing/reward acceptance. Next: elemental/poison/
ranged signature family, then remaining caster/hybrid/boss contexts.


### Elemental/poison/ranged action and numeric family

20more selected definitions now expose native signatures and ordinary gaps
with provisional per-role Attack/Growth. Inventory67authored/44pending; all111
numerical acceptance unaccepted. No runtime/schema/skill payload/locale change.
Final18files/753PASS and strict types/scoped lint PASS. Fixed6000/arm diagnostic
shows1024/431/4545wins/losses/draws→576/4304/1120, a material threat increase.
All600unchanged control input/recording/metric identities are exact; actual
challenge/Throne/L90native consumers have separate action/curve oracles.
Five signature-covered rows and known status-payload/high-level scaling gaps
remain explicit. [Evidence](../../docs/plans/evidence/p15-elemental-signature-family.md).
Next: remaining caster/support, hybrid and boss rows; coherent earned campaign
and balance acceptance remain pending. Browser works; CI excluded/deleted.


### Caster/support numeric seven

Seven rows now adopt explicit low-melee13/+2 without skill/order/payload changes.
Inventory74authored/37pending; all numerical balance remains unaccepted.
Final16files/821PASS, strict types/scoped lint PASS, independent implementation
QA APPROVE. Frozen2800/arm diagnostic:238/2094/468→238/1769/793wins/losses/draws;
325WarpedShaman defeats become draws; no new wins. All600unchanged controls and
1600covered event/metric pairs match. Native Sarina/Nihlathak/Throne/L90 and
summon startup/cap/replacement verified separately. Full limits/raw/hash/cleanup:
[evidence](../../docs/plans/evidence/p15-caster-support-family.md). Remaining37,
payload families and coherent earned campaign/balance acceptance remain pending.


### Four hybrid signature rows — bounded repair verified

Infidel40/+6.25, SaberCat35.2/+5.5, ThornedHulk40/+6.25 and FrozenTerror40/+6.25
now retain only native signatures, exposing ordinary cooldown gaps. All other
data/runtime/payload fields unchanged; ordinary delivery remains melee. All
seven Hulk challenge sources and native Frozen boss/Throne/L90 contexts pass.
Final789PASS/17files, strict types/scoped lint PASS; independent implementation
QA APPROVE and evidence audit found no material inaccuracies. Frozen2200fights/
arm changes240/361/1599wins/losses/draws→239/1961/0, with600exact unchanged
controls. This material threat increase is not balance acceptance. Existing
Enrage/Thorns marker effects, Saber throwing identity and FrostAura payload gaps
remain explicit. Inventory78authored/33pending; all numerical acceptance open.
See [complete evidence](../../docs/plans/evidence/p15-hybrid-signature-family.md).


### Five curse/arcane signature rows — bounded repair verified

Ghost27.2/+4.25,Wraith32/+5,Greater32/+5,Horadrim35.2/+5.5,Knight35.2/+5.5
retain only native signatures. Final822PASS/18files, strict types/scopedlint
PASS; independent implementation QA APPROVE, evidence audit found no material
errors. Six Greater native waves/fiveKnightwaves/Izual49boss479 and resource/
combo/expiry/replay controls pass. Fixed2400fights/arm405/961/1034→237/1363/800,
600exact controls; material threat increase, not earned/balance acceptance.
Native payload/identity gaps remain explicit. Inventory83authored/28pending;
all numerical acceptance open. See [evidence](../../docs/plans/evidence/p15-curse-arcane-family.md).


### 2026-10-30 — Stygian Doll death explosion verified

Ordinary35.2/+5.5 and native on-death35–60 mixed explosion replace the active
stub. Real dead-source authority, hostile capture and nested FIFO death tails
preserve authentic Conversion, hero defeat, refunds/orbs and corpse ownership.
Affected996case aggregate reconciled after two stale fixtures; final46native/
resolver cases, strict types8.341s/scoped lint PASS. Independent runtime QA has
no material findings; later root audit repaired an it.each rejection oracle.
Frozen300fights/arm: nativeW6 100wins→60wins/40defeats; combined curve/cadence/
death/eliteFireball effect, not isolated explosion damage or accepted balance.
All100fast-kill Damned controls identical. Arm provenance omitted new resolver;
post-run hash/type-only change and every fixture/error correction disclosed in
evidence/p15-stygian-doll-death.md. No live owned descendants/arm caches.
Inventory84authored/27pending, all numerical acceptance open. Umbrella claim/
evidence/typecache retained. Next: boss/special numeric catalog, payload families
and coherent earned campaign/balance. Chromium works;CIexcluded/deleted.


### 2026-10-30 — Eight boss caster numeric rows verified

Seven13/+2pairs and BloodRaven32/+5compatibility authored; every skill/order/
payload/other field unchanged. Production chapter overrides remain90/220/300/
420/520. Inventory92authored/19pending; all numerical acceptance open. Final
17files/624PASS, latest strict types7.232s/scopedlint10.733s PASS; independent
implementation/raw audit APPROVE. Frozen608fights/arm both148/459/1outcomes;
seven ManaBurn loggedDPS falls58.75–61.38% with0victories, not accepted balance.
All96raw controls and384event pairs identical;469source hashes/exact16array
change verified. BloodRaven Ignite fixture correction and pre-child wrapper
keyword failure disclosed in evidence/p15-boss-caster-numeric.md. All owned
processes collected/arm caches absent; umbrella evidence/cache/claim retained.
Next:19generic-first boss/special definitions, payloads and coherent earned
campaign/build/pacing acceptance. Chromium works;CIexcluded/deleted.


### 2026-10-30 — Remaining19boss/special signatures verified

Only19lists/38arrays across four monster JSONs changed; signatures retain
relative order and all five chapter overrides exact. Inventory111authored/
0pending; all numerical acceptance unaccepted. Native99PASS/related468PASS.
Full511file engine sweep14030PASS/8staleFAIL across14038cases; all8reconciled
with complete repaired melee56/Vengeance16/DarkStalker6case files PASS.
Original sweep remains failed, no one-shot clean-suite claim. Latest strict
types12.443s/scoped lint PASS. BUG419/420fixed locally. Frozen1536fights/arm:
228wins1169defeats139draws→193/1207/136; nativeAncients32draws→32defeats,
Radament victoryp95TTK25.5→47.6s. All96raw controls exact; independent3072raw/
6144hash/source/delta audit APPROVE. Adverse threat observations retained,
not accepted balance. Evidence/p15-boss-signature-family.md records bounds.
All sessions collected/no owned descendants/arm caches absent; umbrella claim/
evidence/typecache retained. Next BUG421sevenzero-rateDoTs; remaining payloads
and coherent five-act/14-build/pacing/defeat-retry acceptance remain open.
Chromium works;CIexcluded/deleted.


### 2026-10-30 — Seven monster periodic payloads verified

BUG421fixed locally: native Bolt/Ball/Arrow/Inferno/Cloud/Dagger/PlagueSpit gain
positive finite DoT without changing native direct ranges/CD/targets/projectiles/
delivery. Installed metadata also corrects7mercenary→monster; other281skills
exact. Final354schema/native/resolver/loader +428consumer cases PASS; strict
types207.748s/scopedlint23.472s PASS. Frozen512fights/arm296wins178defeats38draws
→291/198/23, new selectedDoT59095; all64controls exact and2048hashes independently
recomputed. No balance signoff. Draw-summary bug and measured→final redundant
schema restoration, failed comparator attempts and baselineWebSocket warning
retained in evidence/p15-monster-dot-family.md. All sessions collected/no owned
descendants/arm caches absent; umbrella claim/evidence/typecache retained.
Inventory111authored/0pending, all111numerical acceptance unaccepted. Next
BUG422Heal/lightningParalyze; remaining buff/prison/scaling and coherent five-act/
14-build/pacing/defeat-retry acceptance remain open. Chromium works;CIexcluded.


### 2026-10-30 — Monster Heal and three lightning payloads verified

BUG422fixed locally: Heal restores30%maxLife/self, lightning applies finite
Paralyze using existing primitives; native hits/CD/targets/projectiles/delivery
unchanged. Actual Cantor/DarkElder Heal remains naturally starved. Native27/
resolver17/loader292/registry71cases verified;12fileconsumer sweep335PASS/1stale
FAIL, BUG423literal oracle repaired with complete31PASS. Finaltypes9.065s/
lint12.055s PASS. Frozen192fights/arm64wins47defeats81draws→64/36/92; selfheal
83361/392events,905Paralyze,32exactcontrols. Standalone raw/source audit verifies
384rows/768hashes/exactfourrow scope;284other installed skills exact. Diagnostic
corrections retained in evidence/p15-monster-heal-lightning.md; no balance signoff.
All sessions collected/no owned descendants/arm caches absent; umbrella claim/
evidence/typecache retained. Next fourmonster selfbuffs, then BonePrison/scaling/
coherent five-act14-build campaign/pacing/defeat-retry acceptance. Chromium works;
CIexcluded/deleted; owner playtest follows implementation.


### 2026-10-30 — Four finite monster self buffs verified

BUG424/425fixed locally: private paid Enrage/Shout/Teleport/Thorns windows,
JSON-owned tuning and localized UI. Native29/resolver10/UI8/loader292/registry71
PASS; consumer376PASS/5staleFAIL reconciled with complete83PASS (incl.Infidel
109/163damage), original failed sweep retained. Strict types218.594s and final
scopedlint17.957s PASS. Chromium4locale/viewport probes16chips PASS, no errors/
overflow; constructed not earned. Frozen160fights/arm32W112L16draw→32/96/32,
564buffcasts/426reflection;32exactcontrols,320rawrows/640hashes verified. Exact
13sourcepaths/fourJSONrows,284other installed payloads exact. Natural Summoner
Teleport starvation retained. No numerical acceptance. Pre-child threaded-wrapper
and comparator locale-root errors retained in evidence/p15-monster-self-buffs.md.
All actual processes collected/no descendants/arm caches absent; umbrella claim/
evidence/typecache retained. Next BonePrison/scaling/coherent five-act14-build
campaign/pacing/defeat-retry acceptance. Chromium works;CIexcluded/deleted.


### 2026-10-30 — Monster Bone Prison verified

BUG426fixed locally: native10–20Arcane landed hit grants source-owned2s private
trap, actions/channel lock/bothdodge0; ordinary85%accuracy/nativebars/CD4/zeroMP/
spell scope preserved. No playerPrison/globalStun changes. Initial381PASS;
final28native27resolver2UI PASS, nineconsumerfiles253PASS. Finaltypes9.032s/
lint15.938s PASS. Chromiumfourlocale/viewportprobes eightactualcast/expiry checks
PASS/noerrors/overflow; constructed not earned. Frozen96fights/arm32W19L45draw
unchanged aggregate,644prisons, fourdraw→loss/fourloss→draw.32exactcontrols,
192rawrows/384hashes, exact10sourcepaths/oneJSONrow/287otherinstalledskills
verified. Fixture/channel timing and lint corrections retained in evidence/
p15-monster-bone-prison.md. Allprocessescollected/no descendants/armcachesabsent;
umbrella claim/evidence/typecache retained. Next scaling and coherent five-act/
14-build/pacing/defeat-retry acceptance. Fresh14-buildintro screen started on
completed payload source; no favorable reruns. Chromium works;CIexcluded/deleted.


### 2026-10-30 — First-success floor repaired; earned elite sequence still open

Current-source14intro baseline:9W1defeats/5W1wins; all14lose the challenge.
BUG427 scoped three basic Attack arrays (Fallen20/QuillRat17/Zombie18), retaining
all growth/armor/HP/skills/rewards/starting power/counts. Native RED9FAIL/5PASS→
14PASS; final539consumercases, stricttypes198.344s, scopedlint14.390s/build20.027s
PASS. Frozen fresh14candidate screen221.243s:all14W1wins/160XP/L2, all14W2defeats.
Exact comparison verifies actual fresh teams/admission/roster with Attack-only
first-enemy deltas; no favorable retries. Two public production Chromium cases
zh360/en1280PASS12.847s, actual L2/60XP/twoitems export/no bridge, clean errors/
overflow; neither claims a full challenge clear. Original failures retained.
One fresh cold earned ActI route wins40W1farms→L6, DenW1/W2 then loses W3at2236ms,
hero49/180HP; physical16 plus Arcane38, not OOM. BUG427 broader progression stays
open. Evidence/p15-opening-monster-budget.md records diagnostic limits and all
repairs. All processes collected/no descendants; disposable bundle removed after
hashed manifest, arm caches absent. Umbrella claim/evidence/typecache retained.
Next: earned elite/attrition sequence and high-level signature scaling, coherent
five-act/14-build/pacing/defeat-retry; final integrated acceptance remains open.
Chromium works in WSL;CIexcluded/deleted; owner playtest follows implementation.
