# P15 — Earned Dark Wood recovery and Catacombs boundary

Current local source: HEADb5a0898 plus private-v1 work, including BUG432/433.
Root sole writer in the existing claimed human worktree2; original checkout
read-only. CI excluded/deleted by owner; Chromium works in WSL. Owner playtest
follows implementation. No commits/push/PR/install/deploy.

Retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

## Fresh original cold policy, with bounded legal recovery

`p15-earned-act1-route-recovery-v1` extends the earlier fresh merc-equipped
full-training diagnostic. It preserves acquisition, actual hero/merc gear,
allocation and the native Den loss/recovery. After a later route nonwin it
trains the last fully cleared area to the next earned level, then retries the
whole failed challenge. Limits remain160admissions/600wallseconds/10logical
hours/L14, at most2route recovery cycles,12training admissions per cycle and20
total. This is a separately declared diagnostic; historical core policies and
recordings are unchanged. No imported checkpoint or favorable seed is supplied.

TechnicalPASS290.154s. Native source/campaign manifests, independent ownership/
XP/material/currency conservation and exported-v32 decode all pass.131admissions,
400waves/396wins/4nonwins/87completed challenges;271990earnedXP/3930items and
6479323.629ms raw combat (~107.99min). This is combat time, not measured active
player-hours or accepted pacing.

The original L6 Den loss and earned L7 recovery remain. Dark Wood ordinal107
loses W4 atL12. Eight complete Burial Grounds training challenges earnL13;
ordinal116 Dark WoodW4 draws at60000ms with33HP. Twelve more complete training
challenges earnL14; ordinal129 wins all five Dark Wood waves, ending66/355HP.
Catacombs ordinal130 then wins W1–W4 and loses W5 at23860ms. It never reaches
the sixth, appended Andariel wave; no Sisters Claim or ActII unlock is accepted.

The frozen Catacombs W5 starts with112HP/323MP, a210HP merc and twelve L18 Dark
Stalkers: one rare leader, three rare minions and eight trash. No enemy dies.
The hero continues alternating Blast/Nova with minimum304MP, so mana starvation
does not explain this loss. W4 leaves the carried112HP; the next loss combines
attrition with slow enemy removal. Damage/mitigation choices and better lawful
build preparation require separate investigation; this is not proof of a runtime
formula bug or impossibility for every build. The complete journal and
`p15-catacombs-frozen-waves-v1.json` retain all five actual waves.

All diagnostic-owned descendants exited, and its exact Vite cache is absent.
Scripts/recipe/full journal/report/earned exports are retained for umbrella QA;
root owns their eventual cleanup after consumers finish.

## Fresh Nova5-first measurement

`p15-earned-nova5-route-recovery-v1` runs the previously approved Nova5-first
allocation from a fresh character, using the same actual merc equipment,
training and route caps. Only lawful skill allocation changes. It is not a
retry of the failed declaration, imported save, gameplay tuning or acceptance
substitute. TechnicalPASS195.072s;396waves/392wins/4nonwins/86completed challenges,
265900earnedXP/3906items/5596976.997ms raw combat (~93.28min). Both bounded
recovery cycles train Burial Grounds toL13 andL14. AtL14 Dark WoodW4 now wins
in29579.619ms with264HP, but W5 defeats at48685.547ms. The original allocation
clears farther. Do not select only the improved W4 as evidence of viability.
Source/campaign manifests, independent economy and exact save decode pass;
its disposable cache and owned descendants are absent.

## Frozen cause checks

`p15-catacombs-entry-health-study-v1` replays all five original Catacombs waves
with identical events and outcomes. Original W5 seed1004680744 reproduces the
23860ms defeat. A hypothetical full-HP start for both allies draws at60000ms,
leaving101heroHP and9living enemies. Seeds0–31: actual carry0wins/30losses/2draws;
full HP0wins/3losses/29draws. Thus entry attrition is material, but extra healing
alone does not solve this frozen encounter. This is not an earned heal or a
proposal to refill between waves. TechnicalPASS21.145s,66paired fights.

`p15-catacombs-static-utility-study-v1` conserves the total allocated ranks by
replacing one Blast rank with Static Field1 and putting it before the existing
Nova/Blast priority. Actual health, mana, stats, gear and enemies are unchanged.
The original loses sooner at8160ms; the32seed grid has1win/31losses. Spending
an opening action on utility also changes control/action/RNG ordering; no simple
damage-only benefit or broad uselessness is inferred. This is a hypothetical
allocation, not a native-earned remedy. TechnicalPASS27.691s, exact five native
replays plus66fights. No fresh run of this rejected candidate was performed.

Both studies retain full raw input/events/outcomes, source manifests, recipe
and immutable-input checks. Their exact caches are absent and owned processes
exited. BUG435 now tracks the remaining authored durability diagnosis. No full-suite pass is claimed; the sweep outcome is recorded below.


## Frozen durability and allocation comparisons

`p15-dark-stalker-durability-study-v1` (99 fights; wrapper PASS 44.377s) tests
one axis at a time through the native tier/level formula. W5 wins in a 32-seed
grid: native 0, Defense 50→25 gives 2, HP 60% gives 12. Neither candidate wins
the original failed seed or the declared original+26/32 criterion; neither is
adopted. This is hypothetical combat evidence, with no JSON/gameplay tuning.

`p15-catacombs-durability-chain-v1` (449 fights; PASS 56.770s) carries actual
resources through all five frozen waves and reproduces all five native inputs,
events and outcomes exactly. Native 0/32 prefix wins; Defense25 1/32 and still
loses the original; HP60% 7/32, with original prefix winning at 137 HP. Neither
meets 26/32. Failures also occur on W4 (Bone Warriors/Fallen Shamans), so a
Dark Stalker-only change does not explain the complete obstacle. No adoption.

`p15-catacombs-nova-focus-chain-v1` (311 fights; PASS 38.381s) instead conserves
all earned rank totals and hypothetically replaces Nova1/Blast15 with
Nova15/Blast1, retaining priority, gear, stats, enemies and resource carry.
Native 0/32; Nova-focused 18/32 prefix wins. Its original prefix wins all five
waves (15.000/10.500/21.052/19.944/46.500s), ending with 213 HP. All five native
inputs/events/outcomes reproduce exactly. This suggests an allocation hypothesis,
not campaign acceptance: it neither spends earned points nor simulates Andariel,
reward-dependent growth or a fresh route. Declare any fresh allocation policy
separately before running it. Different grid derivations in isolated/chain
studies prevent treating their rows as the same seed cohort.

All studies retain source stability/input hashes/raw gzip events/recipes and
process receipts in the packet. Their exact disposable caches are absent and
owned descendants exited. The earlier losses and rejected candidates remain.


## Ordinary full-suite terminal result

`p15-mage-full-unit-v1` hit its declared 1800s bound at 20:04:41 UTC and was
stopped only by its owned process-group wrapper. Exit125/error records a
leader-reaping race after termination: the retained final members are zombies,
`noOwnedDescendantsAlive` is true, and a subsequent exact-PID audit finds no
remaining identities. This is an incomplete failed validation, never a pass.
Completed-file announcements: 396 files/9082 tests,
4 failures; see the full log/coverage audit for scope.
Ormus fixture (BUG436) and three boss comparison failures (BUG437) were observed;
BUG436 was corrected after that file ran. Source audit flags only
`src/stores/ormusRunAuthority.test.ts`; no gameplay byte changed during the sweep.
Focused regressions document the fixes independently; no full current-source
ordinary-suite pass or engine sweep coverage is inferred from this attempt.


## Fresh Nova-focused earned Act I completion

Declared decision `P15-nova-focused-earned-diagnostic-v1.md`; executed once as
`p15-earned-nova-focus-route-v1`, technical PASS119.906s. Exact constructed
consecutive-L1–14 allocation/once-only Den preflight passes and is reset before
the earned character. Same native acquisition, hero/merc gear, priority and caps;
no enemy/gameplay change or imported state. Source/campaign manifests, independent
economy and exported-v32 decode pass; native descendants/cache absent.

L6 Den defeat→five full Blood Moor farms→L7 Den win. Dark Wood ordinal107 loses
atL12; seven full Burial Grounds farms108–114 earnL13; retry115 wins. Catacombs
ordinal116 wins all six waves, including actual appended Andariel W6 at10188ms,
ending121HP. Actual once-only Sisters Claim grants8000XP/one item and unlocks
ActII. Terminal L13, Nova14/Blast1/Warmth1/nativeBolt1; no free ranks or refunds.

117admissions,346waves/344wins/2nonwins/75full challenges;222120earnedXP/3343items,
4021607.383ms raw combat (~67.03min), including40897.464ms failed combat.
This proves one lawful earned ActI route can complete under current gameplay.
It does not accept all cold allocations,14builds, active-hour pacing, five acts
or browser fresh acquisition. Native54s CatacombsW5 versus10.188s Andariel also
remains a balance observation. Earlier rejected policies/results remain unchanged.


## Exact fresh prefix reproduction and Act II first boundary

`p15-earned-nova-focus-act2-v1` technical PASS194.007s. All346original earned
ActI waves and the entire post-Sisters-Claim export reproduce exactly before
suffix entry. Actual native pre-Catacombs and post-ActI exports are retained
for public browser transport; no fabricated checkpoint. The same invocation
uses the existing native `runActTwo` actions/settlement/quest audit. It starts
five quests, visits DryHills/recovers the cube, then enters FarOasis ordinal117
atL13. W1 wins16980ms/343HP/1440XP/four items; W2 defeats20325ms/zeroincome.
The declared first-nonwin suffix stops there. No Radament/ActII completion.

Total348waves/345wins/3nonwins,223560earnedXP/3347items/~67.65min raw combat.
Independent economy, exact save decode, complete source/campaign stability,
quest/point/source audit and exact prefix equality pass. Owned descendants
exited and disposable SSR cache absent. This is measured under-preparation
for the later ActII encounter, not proof of a runtime defect or numerical
acceptance. The compact suffix does not fight or train DryHills beforeOasis;
ordinary earned preparation needs a separately declared policy/measurement.


## Segmented ordinary-suite reconciliation

Retained machine reconciliation `p15-ordinary-suite-reconciliation-v1.json` in
packet `d2-counted-source-z3jj3xa1` binds completed-file announcements to exact
source deltas and verifies ordinary workspace discovery:1214files/25894tests,
no missing or unexpected file. This is segmented coverage plus focused fixes,
not an uninterrupted full current-source green result. Historical failures stay.

| Attempt | Completed files/tests | Historical outcome | Wrapper seconds |
| --- | --- | --- | --- |
| `p15-mage-full-unit-v1` |396UI/9082 |1800s bounded stop;4failures |1800.086 |
| `p15-unit-uncovered-ui-v1` |290UI/2491 |PASS |745.914 |
| `p15-unit-unreached-engine-v1` |528engine+contracts/14321 |3failures;526files/14318tests pass |742.359 |

All seven failures have current-source focused bindings: BUG436 Ormus35cases
(with60PASS/2files), BUG437boss21cases(with88PASS/3files), BUG438Tainted11cases
(with71PASS/2files), BUG439compile1case(with9PASS/2files including native elitePack8).
Types and scoped lint pass after each correction; BUG439 latest15.048s/13.827s.
The only four files changed since the original broad source-before are those
four test files; hashes are retained. Production gameplay bytes did not change.
During the original run only Ormus differed; the supplements flag only the
later Tainted test edit. Compile deadline was corrected after supplements.
All three attempts have no live owned descendants; the original exit125
leader-reaping race remains explicitly recorded, not silently turned into zero.

## Earned production-browser integration

`p15-nova-focus-public-browser-v4` PASS2contexts/82.372s, zh-CN360×640 and
en1280×800 against hashed production build `p15-nova-focus-browser-build-v1`.
Ordinary real clipboard paste transports the unchanged earned pre-Catacombs
export (SHA25637558647e17020078b23358d7c37aacc9bde0d1605e681a438b60acde44e887b).
All six actual waves/Andariel, once-only SistersClaim, reload with disabled Claim
and actual DryHills combat entry pass. Exact player/ranks/points/XP/core stats,
all map quest/clear/ordinal/receipt state and3343canonical owned item identities
and intrinsic payloads agree. Canonical item placement flags and exact merc
compatibility projection are separately verified; post-clear automatic native
merc gear selection is intentionally not performed by the public browser task.
No testbridge or injected power; `window.__GAME__` undefined; no page/console/
HTTP errors or horizontal overflow; entry/Claim controls≥44px.

Preserve earlier failures: v1 helper double-counted10 exact legacy merc slot
projections before browser launch; v2 Playwright fill of1.32MB/56173line pretty
JSON stalled before import; v3 ordinary unchanged clipboard paste/all waves/Claim
succeeded but final comparison differed in four placement flags from two native
post-clear merc swaps. V4 independently checks placement validity and compares
all intrinsic item fields by exact canonical identity. No input/runtime change.

This proves earned-checkpoint transport and the stated public route, not browser
fresh acquisition, ActII victory or all-build/pacing acceptance. Visually reviewed
zh/en claimed-quest captures show completed/claimed Sisters correctly; the v4
victory captures center the middle of the long loot list and do not establish
a readable victory heading. A separately named bounded visual-only replay is
running against the same bundle/input; originals remain. Bundle retained until
that consumer exits, then exact hash-verified disposal. Root owns packet evidence
and eventual cleanup after umbrella QA.


Visual-only replay `p15-nova-focus-public-browser-visual-v1` PASS2contexts/98.801s
with all v4 functional/export assertions retained. Both victory headings are
inside the viewport; reviewed zh360 and en1280 captures show actual Andariel
death/victory log plus cleared-region title and rewards. Mobile DryHills entry
and both claimed-state captures reviewed. Earlier poorly framed captures remain.
All consumers exited; all production bundle files matched the retained exact
manifest before individual unlink/directory removal. Bundle absence verified;
cleanup receipt retained. No shared cache/build/worktree removed.

First ActII preparation diagnostic was externally interrupted at95.656s before
ActII, not a gameplay nonwin:89admissions/231settled waves/1732journal records,
last Den farm ordinal88. No terminal report/economy/source closure claimed.
SIGTERM sender unknown; exact three recorded PIDs absent, interrupted private
cache absent after exact disposal. Partial journal/preflights/checkpoints/receipt
retained. Identical fresh replay `p15-earned-nova-focus-act2-training-v2` is
declared/running with progress-only stdout instrumentation and retained PTY.


Preparation-v2 technical PASS127.075s, actual result `act2-nonwin`: DryHills
ordinal117/L13,123/L14 and132/L15 all lose. Thirteen full DarkWood training
challenges win and earn the two intervening levels; no training nonwin. Exact
346-wave/ActI export prefix, independent economy/quest/point/save/source audits
pass.133admissions,420waves/415wins/5nonwins,337270XP/3988items/~87.05min raw
combat. No ActII quest suffix/Claim or completion. Owned descendants/cache absent.
Declared separate authored-level/all-six-area diagnostic; earlier low-level
losses remain.


## Authored-level Act II and shared promoted-group correction

`p15-earned-nova-focus-act2-matched-v1` technical PASS122.288s; gameplay
nonwin. Same346-wave/entire-export ActI prefix,23full DarkWood training wins,
RockyWaste W3 defeats atL14/15/16 (ord122/132/142).143admissions/470waves,
465wins/5nonwins,424980earnedXP/4494items/~100.93min raw combat. Complete
independent economy/quest/point/save/source audits pass; no ActII completion.

Frozen source diagnosis is recorded in BUG440 and
`P15-promoted-group-budget-v2.md`. Native reconstruction of all nine original
waves is exact. Affix-only/removed-affix changes fail every original W3 and are
rejected. Existing three-champion composition with one affix owner wins all
three original inputs and32/32fixed gridcases each; three affix owners fail the
first original. This is diagnostic screening only.

Shared bounded challenge promotion is now implemented locally; legacy/ActI
plans remain exact. Genuine RED5tests fail before the change. Focused GREEN
92tests/3files PASS7.324s wrapper (2.65s Vitest). Independent before/after
comparison `p15-promoted-plan-control-after-v1` PASS10.120s:2349plans across
29areas,555exact legacy/ActI and1794later-act challenge projections;4594groups,
59672changed spawn tier/affix projections. Every other roster/order/index/level/
source/boss/pity/RNG-derived field remains exact. Natural spells are preserved.
No per-tier coefficient, save/data or player power changes.

`p15-earned-nova-focus-act2-bounded-v1` technical PASS151.086s; actual gameplay
`act2-nonwin`. It is byte-identical to matched-v1 driver after output-prefix
substitution and keeps all allocation/preparation/retry caps. ActI346waves and
entire successor export reproduce exactly. RockyW3 now wins every earned
attempt, but W4 defeats atL14/15/16 (ord122/131/141), entering157/238/251HP after
W3. Twenty-two whole DarkWood training challenges win.142admissions/468waves,
463wins/5nonwins,425290earnedXP/4516items/~100.67min raw combat. Exact economy,
quest/points/save/source audits pass; no technical exceptions, no ActII clear.
All descendants and the exact SSR cache are absent. Journals/exports retained
under packet `d2-counted-source-z3jj3xa1`; W4 cause analysis is next.

First strict typecheck `p15-promoted-types-v1` reaches its180s bound with no
diagnostics and owned process stopped; not a passing check. Longer bounded
rerun, scoped lint/compatibility and full engine checks are pending. Historical
ordinary-suite reconciliation predates this runtime change and does not prove
current-source green. No new browser victory/full-v1 acceptance is claimed.


## Earned Act II preparation and actual area victories

Subsequent results supersede the earlier pending-check and W4-boundary status,
while preserving every earlier attempt. BUG441 documents the old diagnostic's
3543-item backpack/no-disposal and monotone-only equipment limitations.

- Equipped-v1 technical PASS118.425s: native normal-item disposal/protected gear
  stashing/caster defensive tradeoffs improve resistance, still lose RockyW4.
- Prayer-v1 technical PASS109.386s: native authored ActII Prayer hire atL12,
  after exact ActI prefix. Rocky fully wins atL15/ordinal131, W4in29s/221HP.
  Latest-cleared-area training then loses Rocky3times and stops at its cap.
- Safe-farm-v1 technical PASS228.643s: after a nonwinning ActII training run,
  farm the already reliable cleared DarkWood until another ActII route success.
  Original budgets/counters/all losses retained. Rocky winsL15/ordinal131 and
  DryHills winsL16/ordinal141. FarOasis W1–W4win on all3attempts; W5draws at60s
  atL18/19/20 (ord167/184/203), hero469/481/493HP and369/369/378MP.

Latest total204admissions/776waves/768wins/8nonwins,81training admissions/two
training nonwins,956590XP/7501items/~159.44min raw combat. All original346ActI
waves and entire export reproduce exactly.7501earned item payloads equal terminal
ownership plus7239explicit disjoint discarded normal items; source/quest/point/
save/economy audits pass. Native equip/refusal/transfer/disposal/hire decisions
are retained. Strict original no-sink campaign audit remains unchanged. No
ActII completion/RadamentClaim, all-build/pacing or full-v1 acceptance.

Actual Oasis input extraction `p15-oasis-safe-farm-frozen-waves-v1.json` contains
all15native waves. W5Radament has5050HP/63flatMR; remaining4166/3702/3746HP.
Current build's Nova19/20 and low-rank IceBlast/merc Jab yield many1damage hits;
no resource exhaustion. BUG444 and `P15-act2-static-preparation-diagnostic-v1.md`
declare exact reproduction/frozen one-point Static screen, then separate native
fresh allocation. No boss/data/runtime tuning adopted.

## Promotion regression checks and earned browser victory

Full engine sweep `p15-promoted-engine-v1` terminal524files/14299tests,
14295pass/four stale tier-oracle failures. BUG442 test-only correction updates
three affected files:94PASS/12.563s, types8.999s/lint12.161s/purity0.135s.
Machine `p15-promoted-engine-reconciliation-v1.json` binds all observed tests,
exact three-test-only source delta and corrected failed files; production/data
unchanged. No uninterrupted current-source full-green claim. Original type
check180s timeout retained; v2PASS243.996s, scoped lint14.378s. Compatibility
15PASS/3files12.302s. Production build27.581s PASS. Campaign regression original
600s bound finishes8files/262tests; exactly20remaining are running separately.

`p15-promoted-rocky-public-browser-v2` PASS2contexts35.088s reproduces actual
unchanged earnedL14/ordinal122 W1–W3wins/W4defeat and exact3595owned items,
progress/quest/currencies/export/reload; champion cards agree. Original compact
subtitle-selector failure retained.

`p15-prayer-rocky-victory-public-browser-v2` PASS2contexts34.083s transports
unchanged actual earnedL15/ordinal131 Prayer checkpoint via ordinary public
clipboard import; all4waves/full Rocky clear. Exact imported IDs and all37new
predicted IDs3879..3915 plus intrinsic payloads agree. Terminal297owned items,
L15/XP8709/ordinal132, exact quest/currencies/material/export/reload. BUG443
records v1's incorrect uninterrupted-vs-hydrated allocator expectation and its
preserved31.496s failure. v2 predicts native persisted-ID highwater; no ID
stripping or product edit. Both zh360/en1280 final victory captures visually
reviewed; readable actual victory/death log, no horizontal overflow. All cases
have no bridge/power injection/page/console/HTTP errors.

All browser consumers closed.763bundle files matched retained recipe manifest
before exact disposal; bundle absence verified in
`p15-promoted-browser-build-cleanup-v1.json`. Evidence/scripts/journals/exports/
screenshots/typecache remain at packet `d2-counted-source-z3jj3xa1` for umbrella
QA; root owns eventual precise cleanup. Shared caches/worktree preserved.


Static preparation screening `p15-oasis-static-study-v1` PASS11.638s: all15
original Oasis waves/events/terminal teams reproduce exactly. Three isolated
W5inputs transfer one Nova point to Static and set its explicit native rank;
all originals win43.964/43.964/42.000s, fixed0..15grid wins44/48 versus0/48
native. All102screen rows/source/input immutability controls retained. These
are constructed inputs, without settlement or earned/build acceptance.

Fresh Static-v1 driver deliberately interrupted before ActII at28.150s to
replace readonly profile-array mutation with immutable profile assignment;
original partial journal/logs/receipt retained. Wrapper125/reaping-race receipt
is not a successful check; exact identities/cache absence verified afterward.
Static-v2 has identical declared gameplay policy, uses only native allocation
of the next earned point after exact ActI identity, and is running once.


Static-v2 technical PASS143.544s; gameplay `act2-budget`. Actual earned next
point buys Static; no transfer/free rank/respec/import. Same346-wave/entire-export
ActI prefix. Rocky winsL16/ordinal141 after retained L14/15defeats; DryHills wins
L16/142; full FarOasis winsL18/168 on first attempt. Its five wave times are
13.644/12.612/12.128/15.000/43.964s; W5 ends469HP. Actual once-only Radament
Claim and native skill-book read succeed. Extracted five earned winning inputs
are `p15-oasis-static-victory-waves-v1.json`.

The run then reaches its32-admission preparation-cycle cap before LostCity,
endingL20 versus authored target21. No actual LostCity admission/defeat yet.
201admissions/761waves/755wins/6nonwins,935000XP/7339items/~158.96min raw combat;
79ActII training admissions/two training nonwins. Every earned item reconciles
against terminal ownership plus7062disjoint explicit normal discards. All
point/quest/save/source/economy audits pass; owned descendants/privatecache absent.
`P15-act2-bounded-preparation-entry-v1.md` retains exactly that entire prefix/
export/cost/counter history, then attempts further native first entries at current
level without treating advisory area level as an access gate. Running once;
original budget stop retained, not relabeled a complete campaign.

Current campaign regression scope is complete across two segments:
`p15-promoted-campaign-reconciliation-v1.json` verifies all28discovered files/
565tests, original8files/262tests before600s bound plus remaining20files/
303tests PASS545.457s. All28current hashes match the frozen recipe and all
owned descendants exited. Original timeout/exit125 retained; no uninterrupted
current-source full-suite green claim.


## Actual LostCity boundary and rejected priority candidate

Bounded-entry-v1 technical PASS169.341s. Full761wave/201admission/export/
planned-sink/quest-action prefix matches Static-v2 exactly before the admission
policy changes. LostCity now actually admits, but L20/ordinal201 loses W1;
L21/224 and L22/249 win W1/W2 and lose W3. Three route attempts exhausted;
no Summoner/Duriel/ActII completion. All46intervening DarkWood training challenges
win; all counters/costs/losses retained.250admissions/998waves/989wins/9nonwins,
1324570XP/9581items/~203.86min raw combat,125training/two training nonwins.
Every item payload equals terminal ownership plus9304explicit normal discards;
quest/points/save/source/economy audits pass. Owned descendants/cache absent.

Seven actual LostCity waves are `p15-lost-city-earned-frozen-waves-v1.json`.
W1ordinary mummy physical hits under GreaterMummy curse cause attrition. W3
enters177/239HP and six natural HorrorMage lightning/cold casters kill the hero
in7.353/5.600s. AtL22 only Static casts1.500/4.700s, no Nova before death; mana
remains full. BUG445 records this route limitation without a product-defect claim.

Priority-only `p15-lost-city-control-study-v2` PASS8.149s,12exact original wave/
event/terminal controls and136rows. Nova first still loses all three original
LostCity inputs; grid wins3/16,0/16,0/16 versus2/16,0/16,0/16 native. Actual earned
Oasis W5 still wins43.964s. Candidate rejected; no native priority adoption or
balance edit. V1 fixture-loader syntax failure0.520s retained before simulation;
v2 syntax preflight passes. Both owned descendants and private caches absent.

`P15-act2-vitality-preparation-diagnostic-v1.md` separately declares native
stat-reset preparation after the same exact201admission/full-export prefix.
Three free native stat resets remain; all mana is available at prior deaths.
One actual allowance/refund is consumed, refunded/future points go to Vitality,
lower native mana/capacity/regen retained. No skill reset or free power. Same
route/retry/training/time/source/point/economy budgets. Native Vitality-v1
completed with technical PASS228.053s and the same three LostCity defeats.
AtL20 core `{str:10,dex:25,vit:48,energy:92}` becomes
`{str:10,dex:25,vit:105,energy:35}`; HP493→607, mana398→312,
defense163 unchanged. Independent `p15-vitality-reset-audit-v1.json` verifies
95refunded points, stat allowances3→2 and skill allowances3unchanged.
L21/L22 W3 enters315/393HP and dies9.300/5.600s, mana still available.
998waves/989wins/9nonwins/9581items/9304planned normal discards; full source,
quest, point, save and economy audits pass. Seven actual inputs are retained in
`p15-lost-city-vitality-frozen-waves-v1.json`; owned descendants/cache absent.

BUG446 and `P15-act2-socket-preparation-diagnostic-v1.md` next exercise unused
earned equipment resources before inferring an enemy defect. At the exact
201-admission prefix, actual empty capacities are chest2/boots2/head1/gloves1;
normal rubies6/diamonds5 are owned and MR0. Separately declared native insertion
spends two rubies in chest and four diamonds across boots/head/gloves, with
expected +60HP/+24flatMR. Each insertion audits exact prepare/preview/commit,
payload, one gem debit and material receipt. A separate verified transformation
reconciliation preserves the original strict economy audit. Native case technical
PASS221.395s and independent `p15-socket-transformation-audit-v1.json` pass:
all6actions/4IDs, exact costs, HP607→667/MR0→24 and final payloads. Still loses
LostCity ord201W1/224W3/249W3; W3 survives16.400/13.000s. 998waves/989wins/
9nonwins/9581items/9304planned normal discards; source/quest/point/save/economy
checks pass, owned descendants/cache absent. Actual7waves retained as
`p15-lost-city-socket-frozen-waves-v1.json`. Next frozen screen combines only
Nova-first priority on these real upgraded inputs and retains original controls.
No native priority/balance edit or build/campaign/pacing acceptance.

Socketed Nova-first screen technical PASS10.499s/12controls/136rows improves
originalW1 to victory but both originalW3defeats remain. One-paid-rank Glacial
screen PASS28.055s/12controls/272rows also fails both originalW3inputs and turns
Oasis into60sdraws; rejected with no native adoption. Privatecaches/descendants
absent for both. `P15-act2-earned-cold-evolution-v1.md` next declares nativeL24
Blizzard evolution after exact250/998/socketed-terminal reproduction; explicit
bounded extra training, native free skill-reset allowance/refund and actual
prerequisite/rank payment. No source/data balance change or acceptance inferred.

Earned cold-evolution-v1 technical PASS215.009s. Exact250/998/socketed full
terminal prefix retained. Native57additional safe DarkWood admissions all win;
actualL24 skill reset refunds30points, consumes one skill allowance3→2, preserves
stat allowance2 and spends30points: Blizzard20/Nova5 plus5prerequisite/support
ranks. Independent `p15-cold-evolution-transformation-audit-v1.json` passes full
refund/allocation, unchanged core/derived/inventory/map/merc state across reset,
all6gem actions/final payloads, current source and cleanup.

LostCity ord307W1/W2/W3 now all win, ending738/739/739HP in10.500/8.904/12.000s.
W4starts739/739HP, merc128/512HP, but loses5.887s. Actual19native elites
(10scarabs/9GreaterMummies) are authored/fitted elite tier, without a promoted
champion/rare affix. Hero receives780physical/18fire/6arcane damage; curse plus
physical burst is the new boundary. Scarabs often survive the single Blizzard
with2–55HP. Native carried Blizzard cooldown is2999.816ms at entry: hero casts
Nova1.5s, Blizzard3s, Nova4.5s and dies before another Blizzard. Mana available.
No lost mana/skill points or promotion-affix failure inferred.

1287waves/1277wins/10nonwins,1810470XP/12380items/~258.52min raw combat,
182ActII training admissions/two original training nonwins; complete source,
economy/quest/point/save audits pass. Four actual waves are retained in
`p15-lost-city-cold-evolution-frozen-waves-v1.json`. No ActII completion; owned
processes/private cache absent. No product balance/data edits.

Next separately declared screen tests Static during the carried Blizzard
cooldown, preserving all actual resources/ranks and four original controls.

Evolved priority screen technical PASS12.594s,4exact actual controls/204rows.
Blizzard→Static→Nova wins all4original inputs; grid16/16,16/16,16/16,10/16
versus native16/16,16/16,16/16,6/16. Static-first loses originalW4. Native
Blizzard→Static→Nova follow-through is now declared under the same evolution
contract, requiring identical prior L24export except comboOrder, all costs and
prior failures retained. No full-area/holdout acceptance from frozen screening.

Native Blizzard→Static→Nova follow-through technical PASS195.380s, but original
full-area fourth attempt still fails. Exact L24 pre-admission export differs only
by declared comboOrder; independent rank/refund/socket/source/economy audits pass.
W1/W2/W3 win ending739/739/551HP, W4loses3.774s. Frozen W4's739HP/merc128HP
was not inherited by this changed whole-area path; preserve this counterexample
to isolated victory. Same1287waves/1277wins/10nonwins/12380items/1810470XP,
12103planned item sinks are reconciled exactly by report; no full-area acceptance.
Native priority candidate rejected as a recovery solution. No further production
balance or skill-order adoption. BUG447 now isolates authored elite-copy fitting.

Explicit-marker screen technical PASS13.845s,8exact controls/198rows. The new
2elite/17trash candidate wins both originals (739HP/16.500s and345HP/22.500s),
but grid32/32 and13/32 still miss the declared both-input≥26/32criterion.
Repeated native/four-core rows remain unchanged; neither candidate adopted.
No runtime/data edit. Next inspect unused owned Rogue shield preparation under
BUG448 before inferring that player gear cannot recover this physical burst.


### 2026-10-30 — Authored elite copy correction qualifies for native follow-through

Shield/copy factorial PASS16.811s/8exact controls/264trials. Actual owned shield
plus four-authored-elite core wins both inherited originalW4inputs and32/32,
29/32grids; separate arms remain ineligible. No full-area claim. Shared fitter
contract P15-authored-elite-copy-budget-v1 preserves source elites, makes only
added ordinary-elite copies trash, and leaves promoted groups/bosses/RNG/roster
unchanged. New3regressions observed RED then pass with minimal fitter change.
Current2349plan comparison PASS1101exact/1248projected,14976tier-only changes
in ActsII–V; sampledActI unchanged. Engine/types/lint validation collecting.
Fresh native successor has its own contract P15-earned-authored-copy-route-v1;
oldActIIprefixes stay historical, old346-waveActI equality remains a control.
No commits/push/PR/install/deploy/newagents. CIdeleted; browser launch resolved.
Exact raw packet retained for umbrellaQA/root cleanup; completed screen/control
wrapper descendants and private caches absent. Private-v1 remains incomplete.


### 2026-10-30 — Lost City clears natively and in Chromium; Arcane is the next boundary

BUG447's shared fitter correction now has native follow-through. The fresh
`p15-earned-authored-copy-act2-v1` run reproduces the exact346-wave ActI and
historical998-wave socketed prefix; it pays the actual stat/skill resets and
six socket insertions, then transfers owned shield it-xwcq-2ku from the bench
Rogue through real unequip/equip actions. All6 LostCity waves win atL24/ordinal307;
W4 retains4authored elites plus15ordinary copies and ends410HP in22.675s.
All27 subsequent LostCity training admissions win. Whole run1465waves,
1453wins/12nonwins,13992earned items/2410980XP/~295.98min raw combat; strict
native economy/quest/save/point/source audits pass. Independent transformation
audit verifies refunds/socket debits/item payloads/unique ownership/shield transfer
and all6LostCity wins. Its source manifest predates final test-only oracle edits;
production/data are unchanged by those later edits.

Public production Chromium replay `p15-authored-copy-lost-city-public-browser-v1`
passes2contexts/36.785s: zh-CN360x640 and en1280x800. Actual earned public import,
all6waves, all19W4IDs/HP maxima,59predicted new items,336final owned items,
rewards/export/reload and ordinal308 are verified without bridge/power injection,
errors or horizontal overflow. Both victory captures and desktopW4 visually
reviewed; mobileW4 capture frames the player viewport while DOM assertions
validate all19enemies. Historical screenshot `champions` suffix is inaccurate;
these are ordinary authored elites.763hash-verified bundle files were removed
individually; directories/build/server absent, evidence retained for umbrella QA.

Regression evidence: engine525files/14302tests observed; initial7failures in
3files were stale all-elite roster expectations, corrected without weakening
attack/event/reward assertions. Those3files/67tests pass;522otherfiles/14295tests
passed initially. Focused4files/120tests pass. Typecheck172.844s, purity525files,
full ESLint242.180s and production build14.644s pass. Initial lint300s timeout
and original engine failures remain retained; this is reconciled segmented
coverage, not an uninterrupted full-current-source green claim. Build retains
existing large-chunk/manifest-precache warnings. UI/sim-contract suite collecting.

BUG449: Arcane308/L24 and321/L25 loseW4;337/L26 clearsW1-W5 then SummonerW6draws
60s, leaving1177/5342bossHP. Hero survives454HP/7mana. Boss50%cold/lightning
resistance plus81flatMR suppresses current cold attacks. Priority-only study
14exactcontrols/434trials/19.946s qualifies no arm. Paid Energy projection
6exactcontrols/76trials/7.421s preserves5nonboss wins but bossdraw leaves1338HP,
0/32grid wins despite22.88mana/s; no actual Energy reset adopted. Combined
Energy/priority factorial6exactcontrols/304trials/16.780s also has no qualifying
arm, all boss grids0/32. Those failures exclude a mana/order-only recovery
claim. Next scoped screen measures only Summoner's existing flat-MR-growth knob;
no enemy tuning yet. No ActII completion, universal impossibility or holdout
acceptance inferred. Exact raw packet remains in d2-counted-source-z3jj3xa1;
completed wrapper descendants/private caches absent, root owns final cleanup.
CIdeleted/excluded; Chromiumworks; owner playtest follows implementation.
No commits/push/PR/install/deploy/newagents. Private v1 remains incomplete.


### 2026-10-30 — Summoner profile implemented; dungeon UI fixture reconciled

BUG449 screening rejects flat-MR growth alone (including zero), Energy/priority
and their mitigation interactions. Keep global MR formulas and the hero build.
Legal owned defensive merc equipment improves life551→641, defense207→275,
lightning16→39 and physical18→39 while retaining attack100/102. Exact intrinsic
items, baseline merc/player state, currencies/materials and native settlement
audits pass. Gear alone wins actual337 but only9/32 variants; all33five-wave
prefixes clear, below the declared26/32full-area criterion. V1 merc offhand
eligibility and V2 mirror-oracle failures remain retained; corrected V3 passes
56.633s without altering the original scoring/criterion.

Supported boss profile screen passes33exact native controls and198trials
(14.997s). At current50resistance, original/Static-first/Blizzard-first orders
win9/32,14/32,0/32; candidate25 wins actual337 and32/32 with every order. Only
Summoner fire/cold/lightning50→25 is implemented in ActII JSON; all other fields
and archetypes unchanged. Original player order retained; no Energy reset.
See decision P15-summoner-earned-elemental-profile-v1. Final genuine REDv4
rejects exact profile and the native Blizzard landed47damage versus minimum96;
earlier fixture-invalid REDv1–v3 are retained and are not cast-regression proof.
GREEN7files/524tests23.507s, targeted lint9.107s, types141.191s and production
build15.256s pass. Build keeps the existing large-chunk warning. Fresh native
successor is collecting from L1 with exact complete pre337state equality, legal
merc preparation, same paid costs and400admission/20combat-hour/L28budgets.
No actual Arcane acceptance yet; production browser build retained for follow-up.

BUG450 reconciles the broad UI/sim suite's one failure:690/691files and
11599/11600tests passed initially. The synthetic L99 dungeon fixture kept L1
HP/mana/defense. Canonical deriveStats at99 plus a direct fixture assertion gives
genuine RED then13tests GREEN15.029s. Genuine L1 defeat and native victory,
receipt, reward and navigation assertions remain; no production runtime change.
Combined regression coverage remains segmented, not a clean uninterrupted run.

Completed wrappers report no owned descendants alive; private diagnostic caches
absent. Browser build p15-summoner-profile-browser-build-v1 remains temporarily
for the forthcoming actual earned replay. Raw packet d2-counted-source-z3jj3xa1
remains umbrella QA evidence; root owns exact disposal. CI excluded/deleted,
Chromium works, owner playtest follows implementation. No publication or new
agents. Private v1 remains incomplete.


### 2026-10-30 — Actual Arcane accepted; Duriel owned-order candidate qualifies

Fresh p15-earned-summoner-profile-act2-v1 technical PASS198.315s: actual
L1→pre337entire-save equality, legal Prayer gear, all6Arcane wins atL26; boss
W6wins39.356s, final899HP/196mana. Actual journal Read/Claim, tomb visit/staff
insertion follow. Whole1471waves/1459wins/12nonwins,14036items/2433610XP,
~297.30min raw combat. Strict economy/quest/point/save/manifests pass. Independent
transformation audit verifies all original998waves, both reset costs,6gemdebits,
shield transfer, exact pre337state, all owned merc item payloads/compatibility
mirrors and unchanged baseline states, plus exactly3SummonerJSON50→25fields.

Production public Chromium p15-summoner-profile-arcane-public-browser-v1 passes
2contexts35.856s, zh360×640/en1280×800: all6wave wins, all4W6enemyIDs/HPmaxima,
52new items/571owned, native questgraph/rewards/export/reload and ordinal338.
No bridge/power injection/errors/overflow. All4screenshots visually reviewed;
mobile boss frame shows the player viewport while DOM validates all enemies.
After consumers closed,763hash-verified staging files/42900143bytes and10dirs
were individually removed; disposal receipt retained. Server/contexts absent.
BUG449 fixed locally for the measured route; broad holdout/build acceptance open.

BUG451 next native frontier: tomb338/L26 wins W1–W5 but W6draw60s leaves
Duriel509/25600HP, hero785HP/5mana and Prayer679HP. Existing6recovery cycles
are exhausted; clean bounded stop, not an engine failure. Source remains frozen.
V1 pure-engine control lacked chapter-boss presentation intro; retain failure.
V2 reconstructs that canonical intro using native display resolver and validates
the entire event stream/outcomes/input immutability.6controls/342priority-only
trials13.005s: only Static1→IceBlast1 qualifies all6originals and32/32boss seeds
(unchanged≥26criterion). Original order fails actual338 but wins29/32 variants;
keep both observations. No boss/skill/formula tuning, ranks or resources edited.

Fresh p15-earned-duriel-priority-act5-v1 is collecting: exact full pretomb338save
then only public comboOrder changes, same prior costs/recovery/global bounds.
On real ActII clear/Claim export checkpoint then restore ordinary cold order
and continue existing canonical III–V routes in this same invocation, stopping
at their first nonwin. This is diagnostic continuation, not14build/pacing proof.
Temporary p15-duriel-priority-browser-build-v1 is being built solely for earned
Tomb/Claim replay and will be precisely disposed after consumers. Completed
wrappers/caches/descendants absent; raw umbrella packet retained, root cleanup.
CIexcluded,Chromiumworks,ownerplaytestlater. Privatev1 incomplete.


### 2026-10-30 — Earned ActII complete and public Claim/unlock verified

Fresh p15-earned-duriel-priority-act5-v1 technical PASS207.055s: exact1465wave
prior prefix and complete pre338save, then only ordinary comboOrder changes to
owned Static1→IceBlast1. All6Tomb waves win; Duriel27.284s, final785HP/473mana.
Genuine SevenTombs Claim grants12000heroXP/9000fieldedmercXP and native cache,
completes exact ActII graph and unlocksIII. Earned checkpoint retained before
restoring original cold order. Same invocation clears GreatMarsh/FlayerJungle/
KurastBazaar, then Travincal342W5draw leaves one raredoom-ape478/6894HP.
1493waves/1481wins/12nonwins,14263items/2534100XP/~306.06min rawcombat.
Strict native audit passes; independent transformation audit verifies both
exact prefixes, only-order state delta, all prior paid socket/reset/shield/
merc payload conservation and once-only native SevenTombs Claim.

Production public Chromium p15-duriel-priority-tomb-public-browser-v2 passes
zh360×640/en1280×800,38.245s:6wins, chapterboss ID/HPmax, qualified objective,
explicit Claim,46newitems/568owned, exact native currencies/questgraph/export,
persisted ActIIIunlock and disabled repeatClaim. No bridge/power injection/
errors/overflow. V1 failed a test-only tier oracle before W6 (boss versus native
chapter-boss); original retained and only that oracle corrected.763staging
files/42900384bytes/10dirs hash-verified and removed after consumers closed.
No temporary browser build/server remains;4screenshots retained, desktopDuriel
and mobilevictory reviewed so far. BUG451resolved by ordinary play configuration;
no production encounter/skill/formula tuning.

BUG452 describes the actual off-levelTravincal frontier (hero26, rare43);
CouncilW6unreached, no on-level impossibility inferred.5exact native inputs and
333priority-only trials collecting under fixed≥26/32criterion. No new source
change. Broad14build/economy/30–50active-hour/holdout/PWA acceptance remains open.
Rawpacket remains umbrellaQA evidence, root cleanup owner. Completed owned
processes/private caches absent. CIexcluded,Chromiumworks,ownerplaytestlater.


### 2026-10-30 — Travincal order screen rejected; earned Mastery training underway

BUG452 screen p15-travincal-earned-priority-study-v1 passes5exact controls and
333trials42.333s. No order qualifies: native actualW5draw and5/32grid;
Static→Blizzard→Nova wins all5original inputs but15/32grid versus required26.
Tomb's Static/IceBlast order fails packed waves (1/5original wins,0/32W5grid).
Retain every failed trial and original criterion; no priority-only acceptance.

New fresh p15-earned-travincal-training-act5-v1 is collecting under explicit
P15-travincal-earned-mastery-training-v1: exact1493wave/fullterminal-state
prefix including actual342draw, then normal cleared-Bazaar training toL30,
Mastery-first target added only for newly earned points. Authored Mastery1
reduces cold resistance15points; no grants, enemy edits or reset/refill. Bound
64training admissions/3nonwins, fallback only to already cleared Jungle/Marsh,
once-only next-earned-ordinal Travincal retry. Later diagnostic total600admits
(prior400historical) accommodates this suffix, unchanged20raw-combat-hour/
1200wall-second and all oldActII limits. Need1448126XP; observed Bazaar26680
suggests~55admissions, not a result or guarantee. Retain all native audits.

Both remaining Tomb screenshots now visually reviewed; all4captures reviewed
in total. Mobile boss screenshot frames the player viewport while exact DOM
assertions validate Duriel. No temporary browser build/server remains; completed
priority wrapper and private cache absent. Raw packet remains umbrellaQA
evidence; root owns exact disposal. CIexcluded,Chromiumworks,ownerplaytestlater.
No newagents/installs/commits/push/PR/deploy; privatev1 remains incomplete.


### 2026-10-30 — Native salvage sustains earned L30 training; Travincal retry remains open

Training V1 technical PASS213.112s retained all1493prior waves, then24wins/
133180XP before the diagnostic's all-nonnormal hoarding filled500stash and107bag.
No Mastery or retry occurred; independent capacity audit passes. BUG453 records
the test-policy restriction, without changing game storage capacity.

Fresh p15-earned-travincal-salvage-act5-v1 technical PASS273.447s reproduces all
1517waves and entire capacity terminal before first existing native salvage.
Three prepare/preview/execute actions consume974surplus magic/rare items and
produce6932authored scrap. No equipped/socket-filled/unique/set/runeword/
reserved/quest item consumed; strongest hero/merc comparison candidates retained,
including future ineligible gear. Full before/after state and native receipts
match exactly. Original strict earned-income audit remains unchanged; its audit
view restores precisely consumed payloads and removes conversion outputs, with
all previous six-gem/socket compensation intact.

All51completed-Bazaar training admissions343–393win,1451350XPearned, L26→30.
Actual growth allocates three new Nova points and one Mastery point; no new
reset/grant/direct-refill. Once-only next-ordinal Travincal394retry winsW1–W4,
thenW5draws60s with hero839HP/210mana and one rare doom-ape1074/6894HP left.
Actual input carries Mastery15cold-resistance reduction; CouncilW6unreached.
1804waves/1791wins/13nonwins,17963items/4007240XP/~437.71min raw combat.
Source/quest/economy/point/save/export audits pass; this is stillL30versus43,
not on-level impossibility or five-act acceptance.

Independent p15-travincal-salvage-transformation-audit-v1 passes exact prior
998/1465/1493/1517prefixes, paid transforms, once-only Claims, native training
XP/points, nextordinal394retry and all three salvage conversion/payload deltas.
Protection-auditV2 PASS4.850s independently recalculates126rankings/4126native
projections, including946future-base candidates and complete selected/protected
sets. V1 failed a test-only expected-row shape (`net` retained beside declared
`id,score`); original log/exit retained, V2 corrects only that projection. BUG453
resolved locally; maintained harness integration pending. BUG452 remains open.

New p15-travincal-mastery-priority-study-v1 collects the same nine owned orders
against five actual inheritedL30inputs/32W5seeds (333trials), with unchanged
all5actual/≥26grid criterion. No production change. Raw packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`
retained for umbrellaQA; root owns exact disposal. Completed wrappers/caches/
descendants absent; no browser build/server remains. Noagents/installs/commits/
push/PR/deploy. CIexcluded,Chromiumworks,ownerplaytestlater. Privatev1 incomplete.


### 2026-10-30 — L30 order screen rejected; bounded earned-level growth running

p15-travincal-mastery-priority-study-v1 PASS40.905s:5exact complete controls/
333trials, no qualifying order. Native14/32W5grid; Static/Blizzard22/32but
actualW5draw; Blizzard/Static wins5originals but13/32. Keep original26criterion
and every failure; no priority or enemy change. New explicit
P15-travincal-earned-mastery-growth-v1 preserves all1804waves/entire terminal,
trains to each next earned level31–35and retries once/level, bounded140new
training admissions/3training nonwins/five retries and same global/salvage
limits. Current fresh p15-earned-travincal-growth-act5-v1 running; no result
claimed. Independent XP/point/prefix/protection/conversion audits prepared.
No production changes, active test has private cache/owned process tracked by
wrapper. Completed study/protection/conversion processes and caches absent.
Raw packet retained for umbrellaQA/root disposal; CIexcluded,Chromiumworks,
ownerplaytestlater. Privatev1 remains incomplete.


### 2026-10-30 — Earned L32 Travincal clear and Khalim graph; Mephisto frontier

p15-earned-travincal-growth-act5-v1 technical PASS315.645s preserves all1804waves
and entireL30retry terminal before added ordinary growth.17Bazaar wins/503160XP
earnL31/Mastery2; actual412W5stilldraws.17further wins/471020XP earnL32/Mastery3;
actual430wins all6Travincal waves, Council25.560s/final875HP/81mana. Qualified
native Council proof permits actualFlail recovery, Will assembly/8000XPClaim,
orb destruction and Durance entry. No combat/skill/order/formula tuning.

Durance431/runSeed2103078363winsW1–W5; W6Mephisto draws60s with5578/33600HP
left, hero875HP/6mana from147mana entry. BossL47/cold50%/MR138 versus heroL32;
no chapterClaim or ActIVunlock. BUG452resolved locally for earned Travincal;
BUG454records this next off-level resource/TTK frontier.2025waves/2010wins/
15nonwins,20565items/5069600XP/~523.20min raw combat. Five native salvages
1586items→11828scrap; strict source/economy/quest/point/save/export checks pass.

Independent p15-travincal-growth-transformation-audit-v1 passes all old prefixes
and full1804terminal, native XP/skill/stat points for both new levels, exact
retry ordinals/full6wave clear, all paid transformations/salvage receipts and
ownership. p15-travincal-growth-protection-audit-v1 PASS5.251s recalculates
210rankings/6912native projections, including1763future-base candidates and
complete protected/selected sets. Both wrappers/caches/descendants absent.

New p15-mephisto-earned-priority-study-v1 collects six exact controls/342trials
of same9owned orders and32boss seeds, unchanged all6/≥26criterion. No production
change; no chapter/five-act/14-build/economy/pacing acceptance inferred. Raw
packet retained for umbrellaQA/root disposal. No browser build/server remains;
completed owned processes/private caches absent. CIexcluded,Chromiumworks,
ownerplaytestlater. Privatev1 remains incomplete.


### 2026-10-30 — Mephisto order qualifies; fresh native/public follow-through prepared

p15-mephisto-earned-priority-study-v1 PASS16.861s/six exact controls/342trials.
Only Blizzard→Static→Nova with original tail wins all6actual inputs and29/32
boss seeds. Nativeactualdraw/14gridwins and other rejected arms retained;
Static-first23/32, Static/IceBlast fails a packed-wave control despite30boss
wins. Criterion remains26. No production skill/enemy/formula change.

Fresh p15-earned-mephisto-priority-act5-v1 running under explicit full2025wave/
entireterminal preservation then only public comboOrder change before native
Durance432once-only retry. Genuine clear/GuardianClaim must precedeActIVunlock,
then original cold order/canonicalIV–V continue to first nonwin. Separate full-
prefix/progression/conversion/protection/only-order audits and public Chromium
replay prepared; no new success claimed yet.

Production build PASS14.852s with VITE_E2E=false. Temporary exact path
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-mephisto-priority-browser-build-v1`
retained solely for browser consumption; root will remove it after browser closes.
Manifest binds763files/42900422bytes/nine child directories to current source;
no server/browser currently started. Native process/private cache owned by
wrapper; completed build/study processes absent. Unused completion-only training
audit script precisely removed after descendant audits passed; hash/disposal
receipt retained. Raw packet remains umbrellaQA evidence/root disposal.
CIexcluded,Chromiumworks,ownerplaytestlater. Privatev1 remains incomplete.


### 2026-10-30 — Actual Mephisto order retry fails; earned Mastery-growth successor running

Previous continuation made progress: native salvage sustained training, actual
L32Travincal/Council clear and KhalimWill graph earned; native/independent
income/point/save/source/protected-set audits pass. Frozen Mephisto order screen
qualified29/32, but fresh p15-earned-mephisto-priority-act5-v1 technical
PASS321.979s retains all2025waves/entireterminal and only comboOrder changes,
then actual432W1–W5win/W6draw. Mephisto6152/33600HP remains, hero875HP/18mana;
367boss-entry mana and same2103078363seed show altered full-area carry.2031waves/
2015wins/16nonwins,20617items/5098300XP. No GuardianClaim or ActIVunlock.

Partial-auditV2 passes exact2025prefix/fullterminal/only-order delta, actual
retry failure, native progression/transforms/income and unchanged unclaimed
quest row. V1 required-field oracle failed because canonical inProgress row
omits optional rewardClaimed; original script/failure receipt retained. V2
compares the entire exact pre-retry row, never supplies defaults or claims
positive completion. Protection-audit PASS5.889s. Positive native/browser
acceptance remains unfulfilled; prepared positive script was not executed.

Explicit P15-mephisto-earned-mastery-growth-v1 now preserves all2031waves and
entireterminal before new ordinary training. Fresh successor
p15-earned-mephisto-growth-act5-v1 is live (same wrapper/session continued after
turn interruption): train to each next earnedL33–35, allocate only earned
Mastery4–6, retry once/level;100training admits/3training nonwins/three retries,
sameglobal600/20rawhours/1200wallseconds/64salvage bounds. Keep qualifying owned
order. Source/data unchanged; separately prepared positive progression/
conversion/protection/browser checks only execute if real native clear occurs.

The763-file production browser build remains reserved for that earned replay,
exact path and source binding in prior entry; no browser/server started. Root
owns disposal after consumers, including failed/abandoned replay. Required raw
packet retained for umbrellaQA. CIexcluded,Chromiumworks,ownerplaytestlater.
Privatev1 remains incomplete; no repeated source run or restarted live process.


## Earned Mephisto L33–35 terminal and public wave-priority successor

Growth technical PASS434.711s;2415waves/2396wins/19nonwins,497admissions.
61new native Bazaar wins earn33/34/35Mastery4/5/6, but Mephisto draws each
retry450/473/496with6531/5930/5878HPleft. L35hero929HP/118MP(min106MP).
6929440XP/25162items;9native salvage actions2822items→21752scrap.
Separate partial audit PASS24.643s and protection PASS8.643s; all paid input,
XP/point, ownership/conversion/source/save and nofalseClaim checks exact.
Positive chapter/browser unmet; original positive scripts unexecuted.

L35nine-arm screen PASS19.090s,6exactcontrols/342trials; no uniformorder
qualifies. Static/IceBlast actualboss45.184s,31/32grid, onepackedfailure.
Native crowdW1–W5plus boss-specific arm is a publicSkills switch policy;
actual fresh2415prefix/terminal + once-only497nativefullarea trial running.
[Contract](../decisions/P15-mephisto-earned-wave-priority-v1.md).
No production/data changes, no free resources. Fullv1 remains incomplete.
