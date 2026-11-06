# P15 — Four hybrid signature family evidence

The four-row list/numeric adoption in [the bounded decision](../decisions/P15-hybrid-signature-family-v1.md) is implemented. Inventory78authored/33pending; all111 numerical acceptances remain unaccepted. CI excluded/deleted; Chromium works. No runtime, skill-payload, schema or locale changes, migration, dependencies or publication.

## Implementation and native checks

Infidel40/+6.25 retains Charge/Enrage; SaberCat35.2/+5.5 retains LeapAttack; ThornedHulk40/+6.25 retains ThornsAura; FrozenTerror40/+6.25 retains FrostAura. Remove only generic melee/ranged fillers, preserving signature order and every other field. All ordinary delivery remains melee. Provisional role curves are new adoption, not balance acceptance.

26new native cases pin literal lists/level/tier/range/delivery, ordinary physical damage and real ManaBurn exposure, exact native cadence and signatures, nonattack/factory RNG equality, immutable replay/plain parity, appended elite precedence and FrostAura all-target cold/Chill. Actual source/roster/tier/curve integration includes all seven Hulk challenge sources; EldritchL63 oneOverseer+threeFrozen allboss; NihlathakL71 oneWarpedShaman+fourFrozen allboss; exact ThroneW2 fourBaalMinions+twoFrozen L75elite with original source/quest projection; Glacial sixL90trashFrozen acrossW2/3/4, absent fromAshen. Native source/cadence checks do not prove earned encounter viability. Infidel/Saber have no literal authored consumers in current inventory; no claim of absent dynamic use.

Hulk challenge levels/tiers at ordinal0/seed7: SpiderForestW4 L30champion; GreatMarshW2 L30trash; FlayerJungleW2 L32trash; BazaarW3 L38elite; TravincalW3 L41elite; DuranceW2 L43trash/W4 L45champion. Full original-source ordered rosters are pinned in the native test. Native challenge planning differs from raw authored rows and seed-omitted resolveWavePlan. Frozen boss/Throne/L90Attack values684/764/653/596 are literal oracles.

Enrage and ThornsAura remain one-time markers without speed/damage/reflection effects. SaberCat's old WeakRanged was already unreachable; removing both fillers does not implement throwing. FrostAura stays active all-enemy cold15–25/CD3 plusChill, rather than passive pulses orFreeze;75%coldresist preserved. Existing ChillPhysicalx1.1 makes L12noncrit ordinary damage119 when active, otherwise109; Saber96. Real ManaBurn suppresses spells and leaves ordinary damage109/96. Charge/LeapAttack remain existing immutable JSON-backed payloads. These known identity/payload gaps require later implementation.

## Validation and corrections

Initial19case RED:17intended failures/2passing native controls,9.227s. Added seven Hulk cases first assumed generated challenge wave.id equaled authored wN; allseven failed fixture lookup. Correct source.waveId lookup yields context-red-v2:24intended numeric/list/ordinary failures and2controls,9.023s. Every native roster/source assertion reaches its intended curve failure. Updated older Frozen priority test has1intended failure/1unchangedBloodLord control (7.989s); damage/status/physical endpoint and replay assertions retained.

Preflight caught external unchanged Disfigured metadata40/+6.25 copied incorrectly; corrected harness/specs to actual32/+5 BEFORE any arm. No production control changed. External staticv1/v2 PASS0diagnostics; independent corrected preflight APPROVE, then driver/recipe frozen. Initial types/lint passed before capture.

Post-adoption green-v1 has322PASS/1FAIL: new Frozen ordinary fixture omitted the existing ChillPhysicalx1.1 combo. Correct only its expected literal set109/119, retaining positive119combo, physical damage, ManaBurn109 and all endpoint/replay assertions. Green-v2:4files/323PASS (11.618s wrapper). Final affected17files/789PASS (28.540s wrapper). Strict types-final-v1 PASS8.723s; scoped lint-final-v1 PASS10.804s. Earlier types-green-v1 PASS143.148s/lint-green-v1 PASS9.674s; final checks cover the fixture repair. All failed attempts retained.

Final independent implementation QA: APPROVE, no material gaps. Independent read-only evidence audit found no material inaccuracies: all22cells,2200pairs,600full control identities, metrics/hashes/source deltas, final checks and cleanup reconcile. All numerical balance and private-v1 acceptance remain pending.

## Frozen matched diagnostic

11specs×2starting-stat unequipped BasicBarbarian/FireBolt1Sorceress×100seeds0–99=22cells/2200fights perarm,2266native calls including66A/B/A/plain checks. Unspent points. Fourtrash rows use synthetic act20/20/30/60; Frozen63boss/71boss/75elite/90trash are isolated native-level components. Three unchangedL12Tainted/DarkArcher/Disfigured controls give600pairs. These duels do not represent full encounters. Native60s/1000actions,600swall/256MiBcompressed caps; no tuning/retry/favorable seeds/reward yield/pacing/earned acceptance.

Baseline/candidate/compare exit0/sourceStable:true/sourceCount3071; no timeout/live owned descendants. Exact4lists/4pairs structural delta; all other source/payload/runtime bytes unchanged apart from disclosed test allowlist. Full raw hashes/metrics/source reconciliation, input immutability, factory RNG/roster/resources, frozen driver/plan and replay/plain parity pass. Only enemy skillOrder/Attack/attackRange normalize comparison; normalized inputs are never simulated. All600unchanged control inputHash/recordingHash/metrics identical. Subject-only action histograms are separate from team DPS including native periodic events.

| Arm | Victory | Defeat | Draw | Generic | Active | Ordinary |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 240 | 361 | 1599 | 39996 | 21191 | 3303 |
| candidate | 239 | 1961 | 0 | 0 | 6950 | 9605 |

Transitions:1599draw→defeat,1victory→defeat,239victory→victory,361defeat→defeat. This is a material threat increase in unearned diagnostic fixtures; no accepted campaign balance. Candidate generic actions=0, including unchanged controls.

baseline: native12.701s/wrapper13.704s; 9,683,085compressed bytes; rawSHA256 `43ec4c693fe12c215a128f5167655f3d43f0d4a23519b11886cdfe2d8e53d840`.
Hero status snapshots=34341; periodic events=5677, logged periodic damage=12092. These are events/snapshots, not unique applications or single-skill attribution.

candidate: native7.214s/wrapper8.219s; 5,063,464compressed bytes; rawSHA256 `029c8182f527678f546e87ac774118ff532c0ab9ad9d9e3b762cdbf7f663db13`.
Hero status snapshots=10490; periodic events=5677, logged periodic damage=12092. These are events/snapshots, not unique applications or single-skill attribution.

Net terminal HP depletion differs from cumulative effective HP removed; both remain in raw/paired records. Victory-only TTK is censored with explicit denominators; no overall TTK is inferred from defeats/draws.

## All22cells

Each n=100; outcomes=win/loss/draw; DPS=enemy effective median HP/s. TTK=p50/p95ms among victories with n. Action counts are original-subject ordinary/active counts; unchanged control signatures included.

| Cell | Outcomes before→after | DPS before→after | TTK before→after (n) | Ordinary/active after |
| --- | --- | ---: | --- | ---: |
| act2.infidel:L20:trash:barbarian | 0/0/100→0/100/0 | 0.47→20.71 | —/— (0)→—/— (0) | 532/440 |
| act2.infidel:L20:trash:sorceress | 0/0/100→0/100/0 | 0.47→18.66 | —/— (0)→—/— (0) | 500/425 |
| act2.saber-cat:L20:trash:barbarian | 1/0/99→0/100/0 | 0.52→22.98 | 55440/55440 (1)→—/— (0) | 650/352 |
| act2.saber-cat:L20:trash:sorceress | 0/0/100→0/100/0 | 0.52→20.70 | —/— (0)→—/— (0) | 631/339 |
| act3.thorned-hulk:L30:trash:barbarian | 0/0/100→0/100/0 | 0.42→34.98 | —/— (0)→—/— (0) | 510/100 |
| act3.thorned-hulk:L30:trash:sorceress | 0/0/100→0/100/0 | 0.40→32.23 | —/— (0)→—/— (0) | 531/100 |
| act5.frozen-terror:L60:trash:barbarian | 0/0/100→0/100/0 | 5.52→63.99 | —/— (0)→—/— (0) | 367/368 |
| act5.frozen-terror:L60:trash:sorceress | 0/0/100→0/100/0 | 5.40→45.68 | —/— (0)→—/— (0) | 367/379 |
| act5.frozen-terror:L63:boss:barbarian | 0/0/100→0/100/0 | 5.68→99.69 | —/— (0)→—/— (0) | 231/232 |
| act5.frozen-terror:L63:boss:sorceress | 0/0/100→0/100/0 | 5.63→76.05 | —/— (0)→—/— (0) | 248/262 |
| act5.frozen-terror:L71:boss:barbarian | 0/0/100→0/100/0 | 5.68→109.57 | —/— (0)→—/— (0) | 231/232 |
| act5.frozen-terror:L71:boss:sorceress | 0/0/100→0/100/0 | 5.63→83.95 | —/— (0)→—/— (0) | 248/262 |
| act5.frozen-terror:L75:elite:barbarian | 0/0/100→0/100/0 | 5.52→114.51 | —/— (0)→—/— (0) | 243/243 |
| act5.frozen-terror:L75:elite:sorceress | 0/0/100→0/100/0 | 5.40→73.25 | —/— (0)→—/— (0) | 272/272 |
| act5.frozen-terror:L90:trash:barbarian | 0/0/100→0/100/0 | 5.52→88.68 | —/— (0)→—/— (0) | 367/369 |
| act5.frozen-terror:L90:trash:sorceress | 0/0/100→0/100/0 | 5.40→64.20 | —/— (0)→—/— (0) | 374/384 |
| act1.tainted:L12:trash:barbarian | 92/8/0→92/8/0 | 9.60→9.60 | 13860/20020 (92)→13860/20020 (92) | 359/402 |
| act1.tainted:L12:trash:sorceress | 54/46/0→54/46/0 | 10.14→10.14 | 16500/22500 (54)→16500/22500 (54) | 453/481 |
| act1.dark-archer:L12:trash:barbarian | 40/60/0→40/60/0 | 20.00→20.00 | 9240/13860 (40)→9240/13860 (40) | 597/0 |
| act1.dark-archer:L12:trash:sorceress | 17/83/0→17/83/0 | 20.39→20.39 | 10100/17375 (17)→10100/17375 (17) | 616/0 |
| act1.disfigured:L12:trash:barbarian | 26/74/0→26/74/0 | 9.77→9.77 | 21560/29260 (26)→21560/29260 (26) | 667/688 |
| act1.disfigured:L12:trash:sorceress | 10/90/0→10/90/0 | 9.96→9.96 | 24000/36400 (10)→24000/36400 (10) | 611/620 |

## Source hashes and retained artifacts

- `src/engine/combat/monster-hybrid-family.test.ts`: `abac4cfbd00ff788150af461614b55100d03eb5eb91201f7e92475297eaabbfa` → `c1ab0913b8be91303c84ffbd447e4a8326d0956511771eedcdd2b2d850c290c8`.
- `src/engine/combat/act5-elemental-priority.test.ts`: `36e20b4c9afc33c5d54885914697e85c9e5c23a2d371b9324c439e3c5b9034b9` → `36e20b4c9afc33c5d54885914697e85c9e5c23a2d371b9324c439e3c5b9034b9`.

The new test's only measured source change is the Chill combo fixture correction. Older priority test was updated before baseline and has identical measured hashes. No runtime/test/source changes follow comparison.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`. Root retains exact `p15-hybrid-family-v1.{baseline,candidate}.{raw.jsonl.gz,manifest.json}`, `.paired.{jsonl.gz,summary.json}`, frozen specs/baseline-data/harness/launcher/owned-wrapper/static/plan, full source-before/source-after/verification/exit receipts, and successful/failed logs until umbrella acceptance. All launched processes ended with no live owned descendants; three exact launcher caches absent. No disposable generation script was created. Established umbrella type cache, evidence packet and registered worktree claim remain retained; root owns eventual cleanup.

Next: remaining33numeric rows, actual monster payload/effect identities and coherent earned campaign/balance milestones. StygianDoll needs real death-burst semantics separately; data-only filler removal would expose the wrong repeated active spell.
