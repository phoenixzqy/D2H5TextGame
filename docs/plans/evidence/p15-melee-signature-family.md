# P15 — Melee signature family evidence

The 20-row family and five JSON-backed physical actions are implemented under
[the bounded decision](../decisions/P15-melee-signature-family-v1.md). Functional
validation passes; earned campaign and numeric balance acceptance remain open.
The inventory is 47 authored / 64 pending, with all 111 numerical acceptances
unaccepted. No CI, publication, dependency install or save-format change.

## Implementation and functional evidence

Only the selected 20 monster rows change skills/Attack/AttackGrowth. Five monster
skill leaves migrate to validated immutable native payloads; six schema clauses
constrain them; duplicate builder/alias payloads are removed. Leap alone receives
a bilingual description correction. Selector, combat formula, RNG, generic
skills, global Bleed defaults, other rows and chapter identities stay unchanged.

Charge 60–90/CD4, Rend 25–40/CD2, Leap 40–60/CD3, LeapAttack 50–70/CD3,
WarCry 20–30/CD4; all MP0/rank1. Rend applies 10% final landed damage per second
for 3000ms, cap1 and first-potency refresh. LeapAttack has 50%/1000ms Stun;
WarCry has 30%/1000ms Stun. WarCry retains spell contact delivery while existing
Physical dodge rules apply. Existing Bleed also amplifies subsequent Physical
hits by 10%; assertions account for that pre-existing rule.

Native tests pin all 20 literal curves/lists/tier/cadence oracles, actual ordinary
and signature actions, immutable input/replay/plain parity, appended elite
priority, schema/payload rejection, mitigation/miss/minimum Bleed, finite expiry,
and all landed refresh pairs across fixed seeds0–15 with distinct implied rates.
Crusher remains signature-covered at1860ms; no ordinary gap is asserted there.
Later BUG413 validation found that this increment's18-file run omitted inventory
integrity, which rejected the new `signature-covered` category. The inventory
now uses its established `spell-covered` category, with physical Crusher scope
explicitly retained. This follow-up is outside the975-case validation below;
its verification is recorded in the elemental-family evidence.
Actual Shenk challenge is L60: one Overseer Attack523 and three Maulers654,
all boss tier. L90 ordinary Overseer/Mauler are477/596. Exact excluded consumer
lists are pinned and native Rend exposure tested separately.

Final exact-source validation: **18 files / 975 tests PASS**
(`p15-melee-affected-final-v2`,23.560s wrapper), strict typesv2 PASS7.420s,
scoped lintv2 PASS10.422s, diff whitespace PASS. Focused proofv2 is56/56PASS;
physical adapter103cases and priority32cases are included in the broader run.
Independent design-contract review APPROVE and P15-MELEE-QA APPROVE; both QA
hardening points are implemented. No extra full-suite rerun follows this bounded
increment. Prior full-sweep reconciliation is recorded in Panic evidence.

Initial native RED41/41 preceded production edits. Retained intermediate failures:
strictRequired schema reference, six ordinary-hit assertions missing existing
Bleed amplification, asymmetric predicate types, WarCry delivery/dodge conflation,
legacy Shenk planner and assumedL55 oracle, and equal refresh rates underseed13.
The final fixed seed grid and actual challenge oracle repair the test assumptions;
production rules were not changed to satisfy them. Affected-final-v1 was974PASS/
1FAIL; review-proof-v1 was54PASS/2FAIL. All logs remain available.

## Fixed matched diagnostic

Frozen recipe:26 row/level/tier specs ×2 unequipped starting-stat heroes ×100seeds
(0–99) =52cells/5200fights per arm. Basic Barbarian and FireBolt1 Sorceress retain
unspent points; no earned equipment. Synthetic Act levels12/20/30/45/60, twoL90
trash rows, twoL55boss components and two excludedL17boss controls. Native60s/
1000actions,600s/256MiB limits. No tuning, rerun or favorable seed selection.
L55boss probes do **not** establish actual L60 four-body Shenk difficulty.

Each arm made5356native calls including156 replay/plain controls. Baseline:
23.900s native /24.916s wrapper,22,112,786compressed bytes. Candidate:
14.141s native /15.131s wrapper,13,952,594bytes. Compare7.230s. All exit0,
sourceStable:true, no timeout/live descendants; exact owned Vite caches removed.
Python inventories3066→3068 reflect the added source/test files. Comparator
verifies the exact20row/fivepayload/Leap-only locale delta, other source bytes,
frozen driver/recipe, input immutability, full raw hashes and normalized roster/
resources/factory RNG parity. Only skillOrder/Attack/attackRange are normalized
for matching; normalized objects are never simulated. Exact hashes for all three
permitted test-source changes appear in the paired summary.

| Arm | Victory | Defeat | Draw | Generic actions | Signature actions | Ordinary actions |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Baseline |561|143|4496|168388|13466|0|
| Candidate |39|4622|539|15000|26864|26074|

Paired transitions:525victory→defeat,3954draw→defeat,36victory→victory,
3draw→victory,143defeat→defeat,539draw→draw. This is a material threat increase,
not accepted balance. Candidate selected cells contain no generic attacks; the
15000generic actions belong entirely to the excluded controls. Crusher accounts
for the139remaining selected-cell draws and has no ordinary actions.

Candidate canonical signature counts: Charge7073, LeapAttack7463, Rend9246,
Leap1425, WarCry1657. There are8866Bleed state snapshots and17336hero periodic
events totaling18803logged periodic damage. These are snapshots/events, not
unique applications; mixed-status periodic damage is not attributed solely to
Rend. Raw records preserve source, potency and timestamps. Terminal net HP
depletion is distinct from cumulative effective HP removed.

All400excluded Pitspawn/Griswold recordings are hash-identical between arms;
all400draw, with zero native Rend actions because StrongMelee/CD1 retains
priority. Thus these controls do not measure Rend bleed; focused native tests
expose the shared registered Rend payload deliberately.

Fixed signatures can be weaker than high-level ordinary attacks: candidate
L90Overseer effective enemy DPS medians57.70/55.69 and Mauler66.51/64.20
(Barbarian/Sorceress), each100/100defeats. Provisional ordinary curves and fixed
signature scaling require coherent later balance work; no global scaling was
silently introduced. No reward, economy, earned-build, pacing or campaign
acceptance can be inferred from these duels.

## Every cell

Outcomes are victory/defeat/draw out of100. DPS is median cumulative effective
hero HP removed per simulated second (including periodic damage). Successful
TTK is median milliseconds with its victory denominator; `—` means no victories.
These are survivor-only statistics; fewer victories can change the median.

| Cell | Outcomes before→after | Enemy DPS before→after | Successful TTK before→after (n) | Candidate ordinary/signature |
| --- | --- | --- | --- | --- |
| act2.bloodhawk:L20:trash:barbarian | 53/0/47→4/96/0 | 0.55→12.87 | 40040 (53)→20020 (4) | 1140/602 |
| act2.bloodhawk:L20:trash:sorceress | 86/0/14→2/98/0 | 0.54→12.32 | 48000 (86)→24500 (2) | 1040/554 |
| act2.sand-leaper:L20:trash:barbarian | 5/0/95→0/100/0 | 0.52→11.49 | 46200 (5)→— (0) | 1236/643 |
| act2.sand-leaper:L20:trash:sorceress | 11/0/89→0/100/0 | 0.52→10.96 | 58000 (11)→— (0) | 1103/575 |
| act1.disfigured:L12:trash:barbarian | 100/0/0→23/77/0 | 0.44→9.77 | 33880 (100)→21560 (23) | 674/691 |
| act1.disfigured:L12:trash:sorceress | 100/0/0→9/91/0 | 0.46→9.96 | 35800 (100)→24000 (9) | 613/620 |
| act2.vulture-demon:L20:trash:barbarian | 8/0/92→0/100/0 | 1.03→17.38 | 50820 (8)→— (0) | 732/398 |
| act2.vulture-demon:L20:trash:sorceress | 4/0/96→0/100/0 | 1.00→15.65 | 58500 (4)→— (0) | 747/404 |
| act3.jungle-hunter:L30:trash:barbarian | 69/0/31→1/99/0 | 0.45→14.74 | 46200 (69)→41580 (1) | 775/776 |
| act3.jungle-hunter:L30:trash:sorceress | 0/0/100→0/100/0 | 0.47→18.11 | — (0)→— (0) | 649/649 |
| act5.overseer:L60:trash:barbarian | 0/0/100→0/100/0 | 0.45→41.63 | — (0)→— (0) | 632/335 |
| act5.overseer:L60:trash:sorceress | 0/0/100→0/100/0 | 0.45→39.63 | — (0)→— (0) | 629/346 |
| act1.vile-hunter:L12:trash:barbarian | 0/0/100→0/100/0 | 0.62→17.17 | — (0)→— (0) | 581/327 |
| act1.vile-hunter:L12:trash:sorceress | 15/0/85→0/100/0 | 0.63→16.88 | 57000 (15)→— (0) | 536/304 |
| act1.dark-stalker:L12:trash:barbarian | 0/64/36→0/100/0 | 4.55→17.17 | — (0)→— (0) | 581/327 |
| act1.dark-stalker:L12:trash:sorceress | 0/79/21→0/100/0 | 4.36→16.88 | — (0)→— (0) | 536/304 |
| act2.marauder:L20:trash:barbarian | 49/0/51→0/100/0 | 0.43→19.74 | 47740 (49)→— (0) | 608/330 |
| act2.marauder:L20:trash:sorceress | 5/0/95→0/100/0 | 0.43→17.78 | 59000 (5)→— (0) | 618/338 |
| act2.invader:L20:trash:barbarian | 0/0/100→0/100/0 | 0.45→18.19 | — (0)→— (0) | 534/534 |
| act2.invader:L20:trash:sorceress | 0/0/100→0/100/0 | 0.45→16.39 | — (0)→— (0) | 498/498 |
| act2.cave-leaper:L20:trash:barbarian | 0/0/100→0/100/0 | 0.53→14.18 | — (0)→— (0) | 514/1031 |
| act2.cave-leaper:L20:trash:sorceress | 0/0/100→0/100/0 | 0.52→12.77 | — (0)→— (0) | 492/984 |
| act2.undead-scavenger:L20:trash:barbarian | 0/0/100→0/100/0 | 0.48→13.07 | — (0)→— (0) | 495/996 |
| act2.undead-scavenger:L20:trash:sorceress | 0/0/100→0/100/0 | 0.48→11.77 | — (0)→— (0) | 484/977 |
| act4.abyss-knight:L45:trash:barbarian | 0/0/100→0/100/0 | 0.47→38.73 | — (0)→— (0) | 501/284 |
| act4.abyss-knight:L45:trash:sorceress | 0/0/100→0/100/0 | 0.47→36.42 | — (0)→— (0) | 531/291 |
| act1.brute:L12:trash:barbarian | 0/0/100→0/100/0 | 0.45→17.89 | — (0)→— (0) | 478/272 |
| act1.brute:L12:trash:sorceress | 32/0/68→0/100/0 | 0.43→15.64 | 54000 (32)→— (0) | 441/258 |
| act1.yeti:L12:trash:barbarian | 0/0/100→0/100/0 | 0.45→12.80 | — (0)→— (0) | 522/522 |
| act1.yeti:L12:trash:sorceress | 1/0/99→0/100/0 | 0.52→13.98 | 60000 (1)→— (0) | 457/458 |
| act1.crusher:L12:trash:barbarian | 0/0/100→0/16/84 | 0.45→3.18 | — (0)→— (0) | 0/3158 |
| act1.crusher:L12:trash:sorceress | 0/0/100→0/45/55 | 0.52→3.35 | — (0)→— (0) | 0/3034 |
| act1.hell-bovine:L12:trash:barbarian | 0/0/100→0/100/0 | 0.45→17.89 | — (0)→— (0) | 478/272 |
| act1.hell-bovine:L12:trash:sorceress | 23/0/77→0/100/0 | 0.45→15.64 | 53000 (23)→— (0) | 441/258 |
| act2.dune-beast:L20:trash:barbarian | 0/0/100→0/100/0 | 0.40→20.11 | — (0)→— (0) | 466/466 |
| act2.dune-beast:L20:trash:sorceress | 0/0/100→0/100/0 | 0.40→18.28 | — (0)→— (0) | 402/403 |
| act3.doom-ape:L30:trash:barbarian | 0/0/100→0/100/0 | 0.48→30.22 | — (0)→— (0) | 491/267 |
| act3.doom-ape:L30:trash:sorceress | 0/0/100→0/100/0 | 0.48→27.85 | — (0)→— (0) | 530/290 |
| act5.death-mauler:L60:trash:barbarian | 0/0/100→0/100/0 | 0.47→47.99 | — (0)→— (0) | 399/399 |
| act5.death-mauler:L60:trash:sorceress | 0/0/100→0/100/0 | 0.47→45.68 | — (0)→— (0) | 395/395 |
| act5.overseer:L90:trash:barbarian | 0/0/100→0/100/0 | 0.45→57.70 | — (0)→— (0) | 632/335 |
| act5.overseer:L90:trash:sorceress | 0/0/100→0/100/0 | 0.45→55.69 | — (0)→— (0) | 629/346 |
| act5.death-mauler:L90:trash:barbarian | 0/0/100→0/100/0 | 0.47→66.51 | — (0)→— (0) | 399/399 |
| act5.death-mauler:L90:trash:sorceress | 0/0/100→0/100/0 | 0.47→64.20 | — (0)→— (0) | 395/395 |
| act5.overseer:L55:boss:barbarian | 0/0/100→0/100/0 | 0.45→116.87 | — (0)→— (0) | 256/148 |
| act5.overseer:L55:boss:sorceress | 0/0/100→0/100/0 | 0.45→110.84 | — (0)→— (0) | 260/147 |
| act5.death-mauler:L55:boss:barbarian | 0/0/100→0/100/0 | 0.47→89.81 | — (0)→— (0) | 265/265 |
| act5.death-mauler:L55:boss:sorceress | 0/0/100→0/100/0 | 0.47→85.19 | — (0)→— (0) | 259/259 |
| act1.pitspawn-fouldog:L17:boss:barbarian | 0/0/100→0/0/100 | 0.72→0.72 | — (0)→— (0) | 0/0 |
| act1.pitspawn-fouldog:L17:boss:sorceress | 0/0/100→0/0/100 | 0.77→0.77 | — (0)→— (0) | 0/0 |
| act1.griswold:L17:boss:barbarian | 0/0/100→0/0/100 | 0.58→0.58 | — (0)→— (0) | 0/0 |
| act1.griswold:L17:boss:sorceress | 0/0/100→0/0/100 | 0.63→0.63 | — (0)→— (0) | 0/0 |

Paired successful-TTK deltas (only seeds victorious in both arms):

| Cell | Paired n | Delta p50 ms | Delta p95 ms |
| --- | ---: | ---: | ---: |
| act2.bloodhawk:L20:trash:barbarian | 1 | -20020 | -20020 |
| act2.bloodhawk:L20:trash:sorceress | 2 | -19750 | -7750 |
| act1.disfigured:L12:trash:barbarian | 23 | -9240 | 3080 |
| act1.disfigured:L12:trash:sorceress | 9 | -3000 | 10500 |
| act3.jungle-hunter:L30:trash:barbarian | 1 | -7700 | -7700 |

## Retention and cleanup

Root retains the exact packet through umbrella acceptance:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Raw/manifest files: `p15-melee-family-v1.{baseline,candidate}.{raw.jsonl.gz,manifest.json}`;
paired raw/summary: `p15-melee-family-v1.paired.{jsonl.gz,summary.json}`.
Frozen driver/recipe/specs/launcher/static checks and before-source snapshots are
retained alongside `p15-melee-family-v1-{baseline,candidate,compare}` logs,
exit receipts, source-before/source-after and verification JSON. All failed and
final test runs retain their named logs/exit receipts. Root owns eventual cleanup.
Disposable implementation script removed after consumers finished; owned cache
absence verified. Established umbrella type cache, evidence and registered
worktree claim remain required until the umbrella goal is accepted. Browser
works in WSL; GitHub CI remains intentionally removed.
