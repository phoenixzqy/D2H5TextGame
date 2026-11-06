# P15 — Caster/support numeric family evidence

Seven rows now have explicit Attack[13,13]/Growth[2,2], as specified in
[the bounded decision](../decisions/P15-caster-support-family-v1.md).
Inventory:74authored/37pending; all111 numerical acceptances unaccepted.
Skills/order and every other monster field remain unchanged. No production
runtime, registry, payload, schema or locale changes; no migration/dependency
install/publication. Chromium works in WSL; CI remains excluded/deleted.

## Implementation and functional validation

BurningDeadMage, HorrorMage, Cantor, SerpentMagus, DoomCaster, WarpedShaman and
Succubus use the provisional existing Shaman low-melee convention. This is new
numeric adoption, not reinterpretation of old act tables as level-one stats.
Ordinary Attack35 atL12 replaces87. Literal level/tier probes pin13/35/59/68/
90/191/72/59; all ordinary delivery remains melee. Six base rows remain spell-
covered; WarpedShaman has ordinary gaps. Native ManaBurn exposes ordinary
physical damage35 on all seven. Nonattack stats and factory RNG are preserved;
the legacy synthetic clone loses authenticated delivery, excluded only from
that comparison, with actual bundled delivery separately pinned.

28native cases include immutable replay/plain parity, exact preserved spell
cadence, appended elite Charge, fixed40HP/Attack10 minions with startup0ms,
two-living cap and replacements after death. Sarina challengeL40 retains one
SerpentMagus+fourFlayers, allboss; NihlathakL71 oneWarpedShaman+fourFrozenTerrors,
allboss. ThroneW3 L76 preserves threeeliteBaalMinions+twoeliteWarpedShamans and
original source/proof; both endgame modifiers W3 retain twoL90trashSuccubi.
These synthetic action/source checks do not prove earned encounter viability.

Pre-mutation RED:14/14 intended missing-curve/damage failures; controls run
14FAIL/8PASS. Additional contexts first gave19FAIL/9PASS with two wrong unprefixed
w3 fixtures. Correcting native worldstone-remnant/w3 yields19 intended numeric/
damage failures and9passing controls (context-red-v2,10.080s). Initial types/
lint missed explicit event-union predicates; annotation-only repair passed
red-v2 types/lint. External frozen harness staticv1:0diagnostics. Independent
preflight APPROVE.

Post-adoption focused3files/323PASS (green-v1,11.792s wrapper). Final related
16files/821PASS (affected-final-v1,27.362s wrapper), including loader/inventory,
prior families, factory, ManaBurn, summons, sub-area planning and endgame.
Strict types-green-v2 PASS146.751s; scoped lint-green-v2 PASS8.847s. Both initial
green-v1 types/lint launcher attempts used Python threads, so wrapper signal
registration failed before child launch; no tests/checks ran in those attempts.
Corrected independent processes passed; failed receipts/logs are retained.
No test/runtime repair was needed after baseline capture. The one test allowlist
entry has identical before/after SHA256, not an actual source delta.

Final independent implementation QA: APPROVE; independent evidence audit found
no material inaccuracies across all28cells/600controls/1600covered pairs; exact seven pairs, raw digests,
all600Warped records/arm, startup/caps/fixed minion stats and ordinary exposure
verified. Low owner physical hits are often minimum1 after fixture mitigation;
this does not establish earned threat. Numerical balance and full private-v1
acceptance remain pending.

## Frozen matched diagnostic

14specs×2unequipped starting-stat heroes×100seeds0–99=28cells/2800fights perarm;
2884native calls including84A/B/A/plain checks. BasicBarbarian/FireBolt1Sorceress
have unspent points. Seven trash rows use synthetic act levels12/20/30/45/60;
SerpentL40boss/WarpedL71boss/WarpedL76elite/SuccubusL90trash are isolated native-
level components. Three unchangedL12Tainted/DarkArcher/Disfigured controls give
600pairs. Component duels do not represent full native encounters. Native60s/
1000actions,600swall/256MiBcompressed bounds. No retries/tuning/favorable seeds/
reward yield/pacing/earned acceptance.

Baseline/candidate/compare exit0/sourceStable:true/sourceCount3070. Full raw
hash/metrics reconciliation, exact seven-pair structural delta, all other
runtime/payload/source bytes, frozen driver/recipe, input immutability and
roster/resources/factory RNG matching pass. Pair normalization only Attack/
attackRange; normalized inputs are never simulated. All600unchanged control
inputHash/recordingHash/metrics identical. All1600selected covered complete
native event streams/metrics identical; their final result stats may differ.
Warped startup0ms action/summons are counted separately from normal cadence.
Enemy minions and all native periodic damage remain included.

| Arm | Victory | Defeat | Draw | Generic | Active | Ordinary |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 238 | 2094 | 468 | 0 | 50939 | 4277 |
| candidate | 238 | 1769 | 793 | 0 | 55331 | 4740 |

Paired transitions: defeat->defeat=1769, draw->draw=468, defeat->draw=325, victory->victory=238.
Only WarpedShaman ordinary exposure changes outcomes:325defeats become draws;
no new victories. This is a material survivability change in unearned diagnostic
fixtures, not accepted campaign balance. No generic actions occur in either arm.

baseline: native15.050s/wrapper16.036s; 11,133,918compressed bytes; rawSHA256 `d234962490e26dbc214e8b1888d69e1409c58018f965cb025daf241fa5847271`.
Hero status snapshots=44245; periodic events=5668, logged periodic damage=12072. These are events/snapshots, not unique applications or single-spell attribution.

candidate: native17.992s/wrapper19.122s; 11,996,428compressed bytes; rawSHA256 `23ea1c355d1c7ed24534b10714c9e25ce3e26fb4a13aa8a9521e4d462ff351ab`.
Hero status snapshots=48205; periodic events=5668, logged periodic damage=12072. These are events/snapshots, not unique applications or single-spell attribution.

Net terminal HP depletion differs from cumulative effective HP removed; both
remain in full raw/paired records. Successful-only TTK is victory-censored with
explicit n; no overall TTK is inferred from defeats/draws.

## All28cells

Each n=100. Outcomes=win/loss/draw. DPS=enemy effective median HP/s. TTK=p50/
p95ms among victories, with n. Active/ordinary action counts are for the original subject only, including
unchanged control signatures. Team DPS includes native minions.

| Cell | Outcomes before→after | DPS before→after | TTK before→after (n) | Ordinary/active after |
| --- | --- | ---: | --- | ---: |
| act1.burning-dead-mage:L12:trash:barbarian | 0/100/0→0/100/0 | 10.89→10.89 | —/— (0)→—/— (0) | 0/1276 |
| act1.burning-dead-mage:L12:trash:sorceress | 0/100/0→0/100/0 | 11.37→11.37 | —/— (0)→—/— (0) | 0/1086 |
| act2.horror-mage:L20:trash:barbarian | 0/100/0→0/100/0 | 24.35→24.35 | —/— (0)→—/— (0) | 0/751 |
| act2.horror-mage:L20:trash:sorceress | 0/100/0→0/100/0 | 21.94→21.94 | —/— (0)→—/— (0) | 0/704 |
| act2.cantor:L20:trash:barbarian | 0/99/1→0/99/1 | 7.49→7.49 | —/— (0)→—/— (0) | 0/2352 |
| act2.cantor:L20:trash:sorceress | 0/100/0→0/100/0 | 7.35→7.35 | —/— (0)→—/— (0) | 0/2170 |
| act3.serpent-magus:L30:trash:barbarian | 0/100/0→0/100/0 | 13.79→13.79 | —/— (0)→—/— (0) | 0/1706 |
| act3.serpent-magus:L30:trash:sorceress | 0/100/0→0/100/0 | 12.71→12.71 | —/— (0)→—/— (0) | 0/1546 |
| act4.doom-caster:L45:trash:barbarian | 0/0/100→0/0/100 | 6.33→6.33 | —/— (0)→—/— (0) | 0/3600 |
| act4.doom-caster:L45:trash:sorceress | 0/0/100→0/0/100 | 6.30→6.30 | —/— (0)→—/— (0) | 0/3600 |
| act5.warped-shaman:L60:trash:barbarian | 0/9/91→0/0/100 | 6.82→5.83 | —/— (0)→—/— (0) | 75/3425 |
| act5.warped-shaman:L60:trash:sorceress | 0/91/9→0/0/100 | 14.18→6.05 | —/— (0)→—/— (0) | 404/3096 |
| act5.succubus:L60:trash:barbarian | 0/100/0→0/100/0 | 16.19→16.19 | —/— (0)→—/— (0) | 0/2378 |
| act5.succubus:L60:trash:sorceress | 0/100/0→0/100/0 | 16.07→16.07 | —/— (0)→—/— (0) | 0/2294 |
| act3.serpent-magus:L40:boss:barbarian | 0/100/0→0/100/0 | 14.86→14.86 | —/— (0)→—/— (0) | 0/1931 |
| act3.serpent-magus:L40:boss:sorceress | 0/100/0→0/100/0 | 13.89→13.89 | —/— (0)→—/— (0) | 0/1813 |
| act5.warped-shaman:L71:boss:barbarian | 0/44/56→0/1/99 | 7.25→6.47 | —/— (0)→—/— (0) | 74/3418 |
| act5.warped-shaman:L71:boss:sorceress | 0/100/0→0/21/79 | 24.43→8.37 | —/— (0)→—/— (0) | 393/2997 |
| act5.warped-shaman:L76:elite:barbarian | 0/10/90→0/0/100 | 6.82→5.87 | —/— (0)→—/— (0) | 75/3425 |
| act5.warped-shaman:L76:elite:sorceress | 0/93/7→0/0/100 | 22.99→6.12 | —/— (0)→—/— (0) | 404/3096 |
| act5.succubus:L90:trash:barbarian | 0/91/9→0/91/9 | 16.38→16.38 | —/— (0)→—/— (0) | 0/3290 |
| act5.succubus:L90:trash:sorceress | 0/95/5→0/95/5 | 16.29→16.29 | —/— (0)→—/— (0) | 0/3184 |
| act1.tainted:L12:trash:barbarian | 93/7/0→93/7/0 | 9.60→9.60 | 13860/20020 (93)→13860/20020 (93) | 355/398 |
| act1.tainted:L12:trash:sorceress | 58/42/0→58/42/0 | 10.14→10.14 | 16500/23300 (58)→16500/23300 (58) | 455/486 |
| act1.dark-archer:L12:trash:barbarian | 40/60/0→40/60/0 | 20.00→20.00 | 7700/13860 (40)→7700/13860 (40) | 602/0 |
| act1.dark-archer:L12:trash:sorceress | 14/86/0→14/86/0 | 20.39→20.39 | 9100/16750 (14)→9100/16750 (14) | 618/0 |
| act1.disfigured:L12:trash:barbarian | 24/76/0→24/76/0 | 9.77→9.77 | 21560/27720 (24)→21560/27720 (24) | 671/689 |
| act1.disfigured:L12:trash:sorceress | 9/91/0→9/91/0 | 9.96→9.96 | 24000/33000 (9)→24000/33000 (9) | 614/620 |

## Limits and retained artifacts

Native FireBall40–60/CD3, FrostNova20–30/CD3, BoneSpirit40–60/CD2 and ArcaneBolt
25–40/CD1 differ from JSON. Heal is a marker without healing; Curse applies
Amplify rather than ManaBurn; LightningBolt lacks Paralyze. Zero-rate Ignite
markers still enable combos. Cantor's LightningBolt/Heal and Succubus Curse
remain starved. Skill ordering/payload fixes, summon redesign, high-level
scaling, remaining37numeric rows and coherent earned campaign/balance milestones
remain pending; this increment changes none of them.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Root retains exact `p15-caster-family-v1.{baseline,candidate}.{raw.jsonl.gz,manifest.json}`,
`.paired.{jsonl.gz,summary.json}`, frozen specs/baseline-data/harness/launcher/
owned-wrapper/static/plan, complete source-before/source-after/verification/
exit receipts, and successful/failed check logs through umbrella acceptance.
Test SHA256 remains `c0b1a5828b2d802b8bf97cdf40deb177ad5ec146a0248d5b99ae09f482e7fb8f`.

All launched processes ended with no live owned descendants; baseline/candidate/
compare caches are absent. The two pre-child launcher failures have no child
identity. No disposable generation script was created. Established umbrella
type cache, evidence packet and registered worktree claim remain retained; root
owns eventual cleanup after umbrella acceptance.
