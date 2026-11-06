# P15 — Monster Frost Nova and Arcane Bolt level curves

2026-10-30, HEAD b5a0898 plus retained private-v1 work; root sole writer in
claimed human worktree2. [Contract](../decisions/P15-monster-cold-arcane-level-v1.md),
[BUG428](../../../production/bugs/BUG-428-monster-cold-arcane-flat-stubs.md).
Numerical/campaign acceptance remains open.

The two fixed native stubs now consume validated, copied and frozen JSON
definitions. Frost Nova starts6–9, gaining1–2 per actual monster level above1;
Arcane Bolt starts12–18, gaining2–3. Nova preserves all-enemy targeting/CD3/Chill;
Arcane uses authored CD2/single target/500ms flight. Shared direct-hit input owns
the opt-in level increment independently of allocated rank/Attack/victim level.
Other actor kinds receive no increment; converted monsters retain their level.
The existing Act I Lightning rank-binding contract is unchanged. No extra DoT,
combo tags, monster stats/counts/elite coefficients/orbs/rewards/starter/save or
route changes. Obsolete stub entries are removed rather than shadowed.

## Verification

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `p15-level-spells-*`. Node24.21.0/WSL, existing installed tools only.

- Native RED25FAIL/3PASS10.011s; initial GREEN28PASS9.030s. Final native file
  contains36cases; resolver13cases. Endpoints L1/3/7/15/50/90, both range ends,
  rank/tier independence, normal mitigation/crit/dodge, scope/CD/flight/Chill,
  immutable/plain-recorded parity, nonmonster/conversion and schema negatives.
- Final consumer-v2:702PASS/13files30.655s, including loader292 and registry71.
  Strict incremental types-v2 PASS8.246s; scoped lint-v2 PASS19.621s.
- Production build PASS23.443s,759precache entries/763actual output files;
  existing build warnings do not establish blanket performance/PWA acceptance.
- Public production Chromium:2PASS12.958s, zh-CN360×640/en1280×800. Public fresh
  creation/free Rogue/battle/Skip/Flee/Export, no bridge/store injection. Both
  exports actually L2/60currentXP/twoitems/v32, Blood Moor uncleared. No page,
  console or HTTP errors/horizontal overflow; zh360 screenshot visually inspected.
- Separate browser-native engine check:four locale/viewport contexts,192
  constructed probes PASS34.189s, L3/7/90/seeds0–7/both spells. Actual direct
  damage/Chill/flight/parity checked. This is pure engine execution in Chromium,
  not earned gameplay or rendered spell-feedback acceptance.
- Full engine-v2 sweep:14282PASS/2FAIL across521files, wrapper436.209s. Both
  failures are stale literals: Blood Raven's pre-BUG427 Zombie78→68 and shared
  Lightning's pre-BUG422 JSONall/CD3/40–65→single/CD2/40–60. BUG429/430 retain
  reproduction and contract references. Complete four-file affected rerun
  `p15-engine-oracles-green-v1`:137PASS18.856s, no runtime changes/assertion
  suppression. The original sweep remains failed; this is not a one-shot
  clean full ordinary suite. Historical25014PASS predates current changes.

Failed artifacts remain: focused-v1470PASS/1FAIL caught obsolete stub-list
membership; consumer-v1698PASS/4FAIL caught stale Arcane CD1 oracles. Removed
obsolete entries and reconciled cooldown assertions; Succubus now alternates
Arcane/Curse at native1580ms cadence rather than starving Curse. Types/lint-v1
caught a test union narrowing issue, repaired through discriminated flatMap.
Serial engine-v1 stopped after158passing files/no observed failures in637.577s
to use repository-default four-worker configuration. It is partial, never
acceptance. Its original cleanup error/zombie records remain; subsequent
`serial-cleanup-v1.json` verifies all three exact owned PIDs are absent.

## Earned route result

One fresh unchanged core sorceress-cold route/no recovery or favorable retry:
technicalPASS29.019s,40BloodMoor first-wave farms→L6, DenW1/W2 wins, W3 defeat.
Hero enters W3 at97/180HP and Rogue93/196, previously49/27; defeat4240ms,
previously2236ms.43played waves/42wins/41admissions/11750XP/174items,
897197.415ms raw combat (~14.95min). No full challenge clear or quest claim.
Raw logical combat is not observed player time or30–50-hour pacing.

`act1-compare-v1.json` verifies stable manifests within each run, identical
campaign policy, exactly equal first41wave records (40farms plus DenW1), and
all noncombat actions exactly equal. Exactly12source paths differ; only the
two selected monster-skill rows differ,42others exact. Original compressed
journal hashes retained. DenW2 cold damage89→41; other incoming components
and actual four9HP health orbs (=36HP) unchanged. Recovery was never absent.

Separate pre-existing alternate profile `sorceress-cold-nova5` also fails:
technicalPASS45.236s, W3 entry24HP/merc already dead, defeat1735.294ms after
DenW2 takes31435ms. This is an alternate diagnostic, not a core14result.

## Diagnostic limits and remaining work

`p15-elite-attrition-study-v1.json` exactly replays original three Den records.
Isolated32-seed W2: native8wins/24losses; proposed spells24/8; halved elite
life23/9; combined31/1. All W3 arms lose from original49HP carry. No elite-life
change adopted. `p15-elite-spell-ownership-study-v1.json` exactly replays candidate
W2/W3: one champion caster per group improves isolated W2 to32/32wins, yet all
W3 arms still lose from97HP carry. No production pack rule changed. The latter
SSR attempt logged a WebSocket port warning; computation/replay passed and its
wrapper reports no live descendants. Warning retained, no port process killed.

The route equips only the hero, defers gear until L6, and does not retry the
initial Den. These restrictions do not prove all legal preparation fails.
Separate `p15-native-preparation-v2` retains the same40farm acquisition, adds
native monotone earned merc gear atL6, and allows two training/retry cycles
(up to40BloodMoor first waves per cycle/160totaladmissions). TechnicalPASS
37.493s, but L6DenW3 loses (entry77HP/defeat5400ms); L7retry atordinal71 loses
W2 with15enemies. Next training stops at40farms beforeL8, retaining all state.
112admissions/115playedwaves/113wins/2defeats/442items/31590XP,1417559ms raw
combat (~23.63min), zero full clears/claims. Independent economy and exported
v32decode exact; source/campaign manifests stable. V1 had a native merc
offhand-compatibility refusal before any Den admission: hero picker allowed a
katar but merc slots do not. V2 filters existing native merc rules; no gameplay
failure discarded. Both attempts/journals/checkpoints/recipes retained, no
production power/policy changes. No farming or all-routes impossibility claim.
DenW2 actual native monster level is4, W3level7; the latter includes the
challenge's+3waveoffset and rounding of the authored4-vs-base3spread.
Continue with coherent encounter/attrition diagnosis and
remaining high-level monster signatures; retain old policy and failures.
All14 builds/five acts/economy/30–50-hour pacing/integrated acceptance remain
open; owner playtest follows implementation.

Production bundle hashed then removed after browser/server consumers finished;
build-manifest-v1 records763files. Browser/study Vite caches removed by launchers.
Evidence, source copies, scripts, journals, screenshots, dummy exports and the
existing type cache remain for active umbrella review; root owns eventual
cleanup. All sessions collected/no living owned descendants; diagnostic Vite
caches removed. Active umbrella claim retained. No commits/push/PR/deployment/
dependency installs. CI remains locally deleted by owner request. Security
check passes for this authorized local gameplay repair; no credential/network/
permission change.
