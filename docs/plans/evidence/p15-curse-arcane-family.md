# P15 — Five curse/arcane signature rows: evidence

The five-row list/curve adoption in [the bounded decision](../decisions/P15-curse-arcane-family-v1.md) is implemented locally. Inventory: **83 authored / 28 pending**; all 111 numerical acceptances remain unaccepted. CI is excluded/deleted; Chromium works. No runtime, skill payload, schema, locale, migration, dependencies or publication changes.

## Implementation and native checks

Ghost27.2/+4.25 retains Curse; Wraith32/+5 retains Rift; GreaterMummy32/+5 and HoradrimAncient35.2/+5.5 retain FireBreath/Curse; OblivionKnight35.2/+5.5 retains BoneSpirit. Remove only generic melee fillers, preserving signature order and every other field. Ordinary delivery remains melee, all five remain undead. These are provisional role curves, not balance acceptance.

33 native cases pin literal level/tier/range/delivery, nonattack/factory RNG equality, actual skill cadence and ordinary physical damage, actual ManaBurn exposure, immutable replay/plain parity, appended elite precedence, poison resistance caps, BoneSpirit flight, all-target Curse/Rift, resource drain and allied Amplify benefit. Greater/Horadrim remain signature-covered; actual ManaBurn exposes ordinary. Ghost/Wraith/Knight naturally alternate signatures and ordinary actions. Ghost ordinary74/111 depends on whether the previous Curse landed; Wraith ordinary stays87 because ManaBurn arcane combos do not boost physical.

Native full-roster/source integration uses seed7/ordinal0. Six Greater sources: LostCityW1 L22trash `GGMMMGGM`, W4 L24elite `SSGGSSGGSSG`; ArcaneW2 L24trash `GGVVGGVVG`, W4 L27champion `RRGGRRGGRRG`; TombW1 L27trash `GGGMMMGG`, W3 L29elite `GGHHGGHHGG`. G=Greater, M=Mummy, S=Scarab, V=ClawViper, R=SandRaider, H=HorrorMage. GreaterAttack137/191/147/243/162/224. Five Knight sources: PlainsW2 L46trash `KKAAKKAAK`, CityW3 L51trash `KKPPKKPPKK`, RiverW3 L54elite `KKAAKKAAKK`, ChaosW1 L56trash `KKKVVKKK`, W4 L58elite elevenKnights. K=Knight, A=AbyssKnight, P=PitLord, V=VenomLord. KnightAttack283/310/425/338/453. Izual actual challengeL49 retains oneIzual+twoKnights, allboss; KnightAttack479. Original source.waveId/encounter IDs and every ordered spawn/tier are literal oracles. These checks do not prove earned encounter viability. Ghost/Wraith/Horadrim have no literal authored consumers; no inference about dynamic use or full planner coverage.

Curse remains all-target arcane0–0 with minimum1 damage, raw event alias `amplify`, canonical stored `amplify-damage`,50physical-resistance-point reduction/3000ms, not JSONsingle/CD4/ManaBurn. Mixed Greater+Mummy atL22 has landed noncrit Mummy hits5820ms=256(Ignite+Amplify),11640=205(Amplify),13580=171(Ignite), proving native combo and independent expiry. Rift remains10–20all-targetarcane/CD3, indefiniteManaBurn; drainsfloor20%HPdamage capped atMP, with existing arcane×1.2/zeroMP×1.5 combos and actualMPgain clearing. Spirit stays40–60/CD2/500msflight. Ghost lacks mana drain, Greater lacks resurrection, Knight lacks Curse; these identities remain separate work. Ghost/Wraith authoredpoison100 resolves75 via factorycap, not immunity.

## Validation and corrections

Initial RED:33cases,29 intended source/list/curve/action failures and4 passing controls (9.555s wrapper). All eleven full-roster/source assertions reach intended action/curve failure; Izual reaches the intended Knight curve failure. External static-v1 PASS0diagnostics; independent preflight READY/APPROVE. Initial strict types6.989s/scopedlint8.927s PASS. Preflight corrected Wraith physical130→87 and Ghost blanket111→74/111 with positive111. Before capture, root separated raw Curse alias from canonical applied status and pinned3000ms expiry. No production mutation preceded genuine baseline.

Post-adoption green-v1:327PASS/1FAIL across3files,11.748s. Mixed-pack fixture assumed first two Mummy swings at seed13 were landed noncrit; retain seed/native RNG and assert the independently derived later landed clocks256/205/171. Test-only repair; no driver/recipe/production change. Native green-v2:33PASS,10.762s. First affected18file run:821PASS/1FAIL,30.346s, only older Knight priority oracle still expecting StrongMelee. After completed matched comparison, add Knight to existing authored ordinary expectation, preserving all endpoint/impact/dodge/replay assertions. Exact late test hashes retained separately; no measured arm was repeated.

Final affected-v2: **18 files / 822 PASS**,28.465s. Strict types-final-v1 PASS150.211s; types-final-v2 PASS10.698s covers the late test repair. Scoped lint-final-v1 PASS10.103s; final-v2 PASS8.929s covers both changed tests. Independent implementation QA: APPROVE, no material gaps. Independent evidence audit found no material inaccuracies in24cells/2400pairs/600controls, all totals/hashes/source deltas. Auditor independently verified both final-v2 receipts; no material issues remain. No clean full current-workspace one-shot suite or balance signoff is claimed.

## Frozen matched diagnostic

12specs×2starting-stat unequipped BasicBarbarian/FireBolt1Sorceress×100seeds0–99 = **24 cells / 2400 fights per arm**,2472native calls including72A/B/A/plain checks. Unspent stats. Five synthetic trash levels12/12/20/20/45; Greater22trash/29elite and Knight49boss/58elite are isolated native-level components. Three unchangedL12Tainted/DarkArcher/Disfigured controls give600pairs. These duels do not represent full encounters. Native60s/1000actions,600swall/256MiBcompressed caps; no tuning/retry/favorableseeds/reward/pacing/earned acceptance.

Baseline/candidate/compare exit0/sourceStable:true/sourceCount3072; no timeout/live owned descendants. Exact five lists/pairs structural delta, all other source/payload/runtime bytes unchanged apart from disclosed new-test delta. Internal candidate dirty porcelain metadata also records the disappearance of a generated Vite config timestamp file excluded by provenance; production manifests/hashes and3072wrapper inventories stay identical. This is not a production source delta. Full raw hashes/metrics/source reconciliation, input immutability, factory RNG/roster/resources, frozen driver/plan and replay/plain parity pass. Pair normalization removes only enemy skillOrder/Attack/attackRange, never simulated. All600unchanged control inputHash/recordingHash/metrics identical. Subject-only action histograms are separate from team DPS including periodic events.

| Arm | Victory | Defeat | Draw | Generic | Active | Ordinary |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 405 | 961 | 1034 | 47019 | 9973 | 3313 |
| candidate | 237 | 1363 | 800 | 0 | 34340 | 7499 |

Transitions:234draw→defeat,168victory→defeat,237victory→victory,800draw→draw,961defeat→defeat. Material threat increase in these unearned diagnostic fixtures; no accepted campaign balance.

baseline: native11.812s/wrapper12.872s;8,876,656compressed bytes; rawSHA256 `31022f8496ef8bd49997bd3014eff2dfe401a65abacd7eb097b6cfe84e22e281`. Hero status snapshots=5212; periodic events=5639, logged periodic damage=11919. These are snapshots/events, not unique applications or single-skill attribution.

candidate: native12.315s/wrapper13.327s;9,381,653compressed bytes; rawSHA256 `f9dcf1d3f72d246b59f3d67f1ce3a3629528452dcbfe4dae7d64844077fefe9d`. Hero status snapshots=52248; periodic events=34547, logged periodic damage=44378. These are snapshots/events, not unique applications or single-skill attribution.

Net terminal HP depletion differs from cumulative effective HP removed; both remain in raw/paired records. Victory-only TTK is censored with explicit denominators; no overall TTK is inferred from defeats/draws.

## All 24 cells

Each n=100; outcomes=win/loss/draw; DPS=enemy effective median HP/s. TTK=p50/p95ms among victories with n. Counts are original-subject ordinary/active actions; unchanged control signatures included.

| Cell | Outcomes before→after | DPS before→after | TTK before→after (n) | Ordinary/active after |
| --- | --- | ---: | --- | ---: |
| act1.ghost:L12:trash:barbarian | 0/0/100→0/100/0 | 0.42→11.14 | —/— (0)→—/— (0) | 631/646 |
| act1.ghost:L12:trash:sorceress | 97/0/3→5/95/0 | 0.42→9.74 | 39667/56800 (97)→27000/31500 (5) | 591/594 |
| act1.wraith:L12:trash:barbarian | 0/0/100→0/100/0 | 0.50→11.67 | —/— (0)→—/— (0) | 618/649 |
| act1.wraith:L12:trash:sorceress | 78/0/22→2/98/0 | 0.53→11.12 | 51200/59800 (78)→14500/22800 (2) | 542/567 |
| act2.greater-mummy:L20:trash:barbarian | 0/0/100→0/0/100 | 0.43→1.18 | —/— (0)→—/— (0) | 0/3500 |
| act2.greater-mummy:L20:trash:sorceress | 0/0/100→0/0/100 | 0.43→1.18 | —/— (0)→—/— (0) | 0/3500 |
| act2.horadrim-ancient:L20:trash:barbarian | 0/0/100→0/0/100 | 0.43→1.15 | —/— (0)→—/— (0) | 0/3400 |
| act2.horadrim-ancient:L20:trash:sorceress | 0/0/100→0/0/100 | 0.42→1.15 | —/— (0)→—/— (0) | 0/3400 |
| act4.oblivion-knight:L45:trash:barbarian | 0/100/0→0/100/0 | 12.68→36.91 | —/— (0)→—/— (0) | 388/417 |
| act4.oblivion-knight:L45:trash:sorceress | 0/100/0→0/100/0 | 11.92→34.71 | —/— (0)→—/— (0) | 385/404 |
| act2.greater-mummy:L22:trash:barbarian | 0/0/100→0/0/100 | 0.43→1.17 | —/— (0)→—/— (0) | 0/3500 |
| act2.greater-mummy:L22:trash:sorceress | 0/0/100→0/0/100 | 0.43→1.15 | —/— (0)→—/— (0) | 0/3500 |
| act2.greater-mummy:L29:elite:barbarian | 0/0/100→0/0/100 | 0.43→1.17 | —/— (0)→—/— (0) | 0/3500 |
| act2.greater-mummy:L29:elite:sorceress | 0/0/100→0/0/100 | 0.43→1.15 | —/— (0)→—/— (0) | 0/3500 |
| act4.oblivion-knight:L49:boss:barbarian | 0/100/0→0/100/0 | 13.48→78.53 | —/— (0)→—/— (0) | 242/249 |
| act4.oblivion-knight:L49:boss:sorceress | 0/100/0→0/100/0 | 12.73→74.12 | —/— (0)→—/— (0) | 249/258 |
| act4.oblivion-knight:L58:elite:barbarian | 0/95/5→0/100/0 | 13.06→67.33 | —/— (0)→—/— (0) | 266/286 |
| act4.oblivion-knight:L58:elite:sorceress | 0/96/4→0/100/0 | 12.41→56.47 | —/— (0)→—/— (0) | 274/285 |
| act1.tainted:L12:trash:barbarian | 92/8/0→92/8/0 | 9.56→9.56 | 13860/20020 (92)→13860/20020 (92) | 350/387 |
| act1.tainted:L12:trash:sorceress | 54/46/0→54/46/0 | 10.10→10.10 | 16500/22500 (54)→16500/22500 (54) | 451/486 |
| act1.dark-archer:L12:trash:barbarian | 42/58/0→42/58/0 | 20.00→20.00 | 9240/13860 (42)→9240/13860 (42) | 600/0 |
| act1.dark-archer:L12:trash:sorceress | 10/90/0→10/90/0 | 20.39→20.39 | 9000/16500 (10)→9000/16500 (10) | 623/0 |
| act1.disfigured:L12:trash:barbarian | 23/77/0→23/77/0 | 9.77→9.77 | 21560/29260 (23)→21560/29260 (23) | 675/690 |
| act1.disfigured:L12:trash:sorceress | 9/91/0→9/91/0 | 9.96→9.96 | 24000/37200 (9)→24000/37200 (9) | 614/622 |

## Retained packet and ownership

Exact packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`. Root retains raw/paired gzip, manifests, frozen driver/launcher/owned-wrapper/plan/specs/baseline metadata, static/validation logs and receipts, failed attempts and source inventories through umbrella acceptance. Root owns eventual cleanup. Existing task-typecheck.tsbuildinfo and worktree claim stay retained. Exact arm caches are absent; all collected wrappers have no live owned descendants. No disposable generation scripts or task processes remain after collection.

Measured test `src/engine/combat/monster-curse-arcane-family.test.ts`: before `7e41890cedd5bb0d2e2cc19ac020bc8cc5b2cbd3ac53e461fa420225f71142d4`; after `642acc1591dd11962e5ad1f6d1286b960295a6b4d208779bd83c6f19068a68de`. Only mixed-pack literal-clock fixture repair.

After compare, `src/engine/combat/monster-signature-priority.test.ts`: before `259a2243b3bec446d8583ed2bc455947fcbd01a01c08a90b6e4ac45d4a7351e2`; after `f7d78bff836f7bd6378422fd39aed8df500c33e9a51a2081146fb5ea72fec115`. One-string priority expectation correction, excluded from historical measured source deltas and never used to rerun arms.

`p15-curse-arcane-family-harness-v1.ts` SHA256 `73990bdc33e184cd39d3314665ffd369abbbad9485010cddbf7d8ccf3c73dad6`.

`p15-curse-arcane-family-plan-v1.md` SHA256 `5db31f1a2b97648a3ac35523060df28f6ad0e881e6ddce4a700db8929218b649`.

`p15-curse-arcane-family-v1.paired.jsonl.gz` SHA256 `b7a6ebcbaa0a9469b481d62e6af98228ec282fe9b94fe1e37aae49d7819844fe`.

