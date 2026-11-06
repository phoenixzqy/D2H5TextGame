# Intended Act I acquisition — 2026-11-03

The thirteen additional intended builds produced five Act I clears, six native
first-boss entry fixtures and eight terminal nonwins. The separate intended
Corpse/Bone route already completed all five acts. Fourteen historical five-act
routes remain valid historical reachability evidence; they do not establish
acceptance of the current intended growth policies.

Two campaign defects are corrected: omitted early signatures (BUG621) and a
stale constructed decoy fixture (BUG622). Three affected earned reruns execute
the repaired skills, but none clears Act I. No production balance correction
or viable-build certification follows from those repairs.

## Original declared cohort

| Intended build | Terminal result | Level | Admissions | Settled waves | First-boss entry |
| --- | --- | ---: | ---: | ---: | --- |
| Cold Sorceress | Act I complete | 14 | 133 | 408 | Yes |
| Fire Sorceress | Opening training retry limit | 6 | 42 | 45 | No |
| Bow Amazon | Opening training retry limit | 6 | 45 | 56 | No |
| Javelin Amazon | Den wave 4 defeat | 7 | 50 | 75 | No |
| Summon Necromancer | Act I complete | 13 | 115 | 342 | Yes |
| Double Swing Barbarian | Opening training retry limit | 6 | 46 | 58 | No |
| Double Throw Barbarian | Opening training retry limit | 6 | 46 | 58 | No |
| Zeal Paladin | Opening training retry limit | 6 | 42 | 46 | No |
| Holy Bolt Paladin | Act I complete | 13 | 115 | 343 | Yes |
| Fire Druid | Act I complete | 12 | 109 | 313 | Yes |
| Summon Druid | Act I complete | 12 | 107 | 310 | Yes |
| Martial Assassin | Opening training retry limit | 6 | 46 | 58 | No |
| Traps Assassin | Catacombs wave 5 defeat | 14 | 131 | 405 | Yes |

Totals: 1,027 admissions, 2,517 waves, 2,494 victories and 23 nonwins;
30,134,855.125724 combat ms; 191,558.321702 driver wall ms; 42,670,655 compressed
journal bytes. Native actions record 108 legal stat and 134 legal skill
allocations. No technical failures. The separate reader reconciles complete
native saves, item custody, income/spending, rewards, clocks and source inputs.
The five clears are earned observations under the declared policy, not
population win-rate estimates. Zeal's level-twelve unlock is correct.

## Early signature repair and affected acquisition

Fire had learned Inferno but omitted it from its rotation. Both Barbarian
profiles bought Shout before their available Double Swing. BUG621 corrects
those two policy choices, without changing production skills or numbers.

The frozen three-case rerun uses the original creation timestamp
`1793469600000`, existing native training, recovery, equipment and companion
policies, and existing stop bounds. Native histories/seeds can diverge after
the repair; these are not paired causal balance estimates. No unaffected build
was replayed, no seed search occurred, and no exhausted controller was extended.

| Build | Terminal result | Level | Admissions | Waves / wins | Repaired signature casts across run |
| --- | --- | ---: | ---: | ---: | ---: |
| Fire Sorceress | Den wave 2 defeat | 8 | 60 | 104 / 101 | Inferno 394 |
| Double Swing Barbarian | Den wave 4 defeat | 7 | 49 | 76 / 75 | Double Swing 245 |
| Double Throw Barbarian | Den wave 3 defeat | 7 | 48 | 71 / 70 | Double Swing 218 |

Totals: zero clears, zero first-entry fixtures, zero technical failures;
157 admissions, 251 waves, 246 wins, five nonwins; 5,256,440.200002 combat ms;
25,632.624115 driver wall ms; 4,946,404 compressed journal bytes; 19 legal stat
and 23 legal skill allocations. Launcher exit 0, wall 61,737.978479 ms;
independent reader exit 0, wall 2,654.716221 ms. Reader reconciliation covers
each complete native export, custody, XP/currency/material balances, clocks,
reward deltas and zero income on failed waves.

## Retained failure diagnosis

Only saved journals were read for this diagnosis. Wave numbers here are
one-based; evidence stores zero-based indices.

- Fire's final loss enters wave 2 at 210/212 Life and 162/162 Mana. Minimum
  Mana is 152. It receives 64 direct damage (36 Physical, 12 Cold, 6 Poison,
  10 Fire) and 176 periodic damage; the wave contains seven revivals and leaves
  seven of sixteen enemies alive. The recording's aggregate `dot` event does
  not identify a damage type; do not infer a typed breakdown from it.
- Double Swing enters wave 4 at 29/222 Life and 42/98 Mana after native resource
  carry. Earlier waves cost 151 periodic damage in total. The boss then deals
  77 Physical damage; the boss and one trash enemy remain. Shout is a passive,
  so its absence from projected active actions is correct.
- Double Throw enters wave 3 at 117/222 Life and 22/98 Mana. It receives
  23 Physical and 150 Lightning direct damage, with no hero periodic damage in
  that wave. One rare elite remains at 146 Life; minimum Mana is 3.

These observations prioritize sustained damage, recovery and legal equipment/
skill adaptation. They establish neither an engine defect nor the sole cause
of any loss. A stopped bounded acquisition is incomplete progression evidence;
it is not proof that the build can never progress. Further evaluation must
declare adaptations and budgets before running, retain losses and full carry,
and avoid granting healing, levels, equipment or selected seeds.

The initial `p15-first-entry-early-repair-v1-failure-triage.json` is rejected:
it compared an outcome object to `victory`, accidentally including wins.
Version 2 filters `wave.metrics.outcome` and matches all five failures already
reconciled by the independent reader. The rejected artifact remains diagnostic
history, not failure-count authority. No gameplay replay was needed.

## Scoped verification and source authority

Final `p15-early-signatures-v3-{tests,types,lint}.{log,json}` all exit 0:
seven selected cases, scoped strict TypeScript, explicit ESLint with
`--no-ignore --max-warnings 0`. The earlier candidate had 160 passes and one
decoy failure; the seven final cases include six of those passes plus the
corrected failure. Thus **154 retained unaffected + 7 final = 161 distinct
cases**. The executed frozen plan's reference to 157 unaffected cases is an
arithmetic error; it is retained unmodified rather than silently rewritten.

The decoy failure also reproduces with exact pre-BUG621 source bytes loaded
externally. Native staged Dexterity gives hero speed 296: Attract at 400 ms,
Confuse at 800 ms and a lethal fallback at 1200 ms. Speed-40 constructed
enemies cannot act first. Only their fixture speed changes to 200 (900 ms).
The rejected speed-125 candidate actually acts at 1500 ms and remains retained.
Original assertions plus explicit paid-curse/no-earlier-hero-hit checks pass.

The first scoped typecheck failed because its external config omitted
`src/vite-env.d.ts`; accepted config includes it. Both failed diagnostic receipts
and the accepted config are retained. The disposable config was removed and
its absence verified. No broad suite, build, install or browser run was required
for these campaign/test-only changes.

Authority: `p15-early-signatures-v3-source.json`, SHA256
`be16fe79e6f0ad27f0347378666f6d17757e8c9a578c239f21569a6f9c360fb7`.
All 2,149 production/provenance and 128 campaign inputs reauthenticate. Production
tree remains `8bf6b59060bf9920a8f97a7fa0cc5236780c43938816ce81fdf315b9cdf315a0`.
Exactly two campaign paths change from the preceding source authority:
`intended-growth-v1.json` and `intended-growth.regression.test.ts`.
BUG621/622 are verified working-tree fixes, with no fabricated fixed commit SHA.

## Evidence, ownership and remaining scope

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.
Authorities include both cohort readbacks, their native reports and gzip journals,
all launch/process receipts, scoped check receipts, retained baseline/rejected
decoy traces, and `p15-first-entry-early-repair-v2-failure-triage.json`.
Three-case plan SHA256:
`3f05b046bc073f319c076a634cc270c287640ff8b0f553ad4da6862128b2918e`.
Original thirteen-case plan SHA256:
`f96d5d140818977de2e13e3976ff84c3699fe9a680ec6ad126b4bfe548e86655`.

No live launcher remains. Root retains the required packet and registered human2
worktree through umbrella review and owns eventual artifact cleanup/worktree
release. Diagnostic saves do not replace the genuine final Eve Claim continuation
at level 75, 19/19 Act V actions, next ordinal 1658; its export SHA256 remains
`74d41e2b3a95172f244c2b34b50096b16835ba18190a6a4062b19240623f50c1`.

Formal balance acceptance remains 0/210. Intended-build acquisition/populations,
holdouts, pacing/economy/recruitment/fairness, adaptation/manual-idle/defeat-retry,
remaining Hell/endgame, G0–G7, soak, review and later owner playtest remain open.
BUG611 and BUG592 remain open. Browser works; CI is excluded by owner instruction.
There is no pending user question or external blocker.


## Rejected learned control and early defensive defaults

The retained-wave Fire control experiment used all 25 Den waves from the repaired
run, including all 22 victories and three losses. Every unchanged baseline
reproduced its complete events and final teams. Prepending already learned rank-one
Frost Nova retained 22/25 wins but exchanged one previous victory for one previous
loss. The declared no-regression criterion failed (`eligible: false`); no campaign
or canonical rotation change followed. Evidence: `p15-fire-learned-control-v1*`,
plan SHA256 `4ddf4e669f29f65085d4d112bc38ab5722ca51749b9810a1654b951f7efd55f1`.

A separate owned-armor diagnostic found legal helmet trades improving a fixed
six-type incoming-damage proxy by approximately 1.6%, 5.8% and 5.7%. Those scores
were hypotheses, not observed combat improvements. BUG623 adds explicit hero-only
Act I selection and fixes the shared selector's capacity fallback: an equipable
backpack candidate can free room for the stronger stash candidate on its second
bounded pass. Weapons, Mana floor, current resources and item custody remain
preserved. Existing Act II behavior remains covered.

The candidate temporarily enabled this policy on all intended profiles, but only
the three predeclared affected builds were run. All three native campaigns
completed technically and failed progression:

| Build | Terminal result | Level | Admissions | Waves / wins |
| --- | --- | ---: | ---: | ---: |
| Fire Sorceress | Opening training retry-limit | 6 | 46 | 58 / 56 |
| Double Swing Barbarian | Den wave 4 defeat | 6 | 42 | 48 / 47 |
| Double Throw Barbarian | Den wave 4 defeat | 6 | 42 | 48 / 47 |

Totals: zero clears, zero first-boss fixtures, zero technical failures; 130
admissions, 154 waves, 150 wins and four losses; 3,398,514.438625 combat ms;
17,414.295577 driver wall ms. Launcher wall 53,527.109 ms. The separate reader
reconciles complete native exports, intrinsic item custody, XP/currency/material
balances, native seeds/clocks/admission ordinals, each recorded point allocation
and zero rewards on failed waves. Same initial timestamp does not make these
paired comparisons: policy changes alter native histories and subsequent seeds.
This evidence establishes neither a causal regression nor useful progression.

The canonical default is therefore removed. The early selector remains an
explicit diagnostic opt-in; its fixed six threats are retained in
`tests/campaign/act1-defense-v1.json`. No further campaign, earlier-act replay,
seed search or extension of a stopped controller was run to remove this default.
The capacity correction remains independently useful.

Candidate authority `p15-act1-defense-v3-source.json` authenticates the executed
campaigns. Final authority `p15-act1-defense-default-source.json`, SHA256
`ade338116b102bd46fb8c9a5967f4aaacf26ee34074696cf063d595bc73db66f`, authenticates the retained implementation. Its only changes from the
candidate are `intended-profiles.ts` and `intended-equipment.regression.test.ts`;
all 2,149 production/provenance and 129 campaign inputs are checked. Production
and data hashes remain unchanged. Candidate campaign outcomes must not be
presented as executions of the final default.

Validation is deliberately scoped. Original selector verification comprises
106 retained unaffected plus two final capacity cases (108 distinct cases,
not one fresh all-pass run). After removing the default, the four affected
Act I opt-in/Mana-floor and Act II gating cases pass; two first failed against
the provisional default. Scoped strict types and explicit two-file lint pass.
Receipts: `p15-act1-defense-default-{red,tests,types,lint}.{json,log}`.
The disposable external TypeScript config is removed after all consumers end;
installed tools, required source/receipts and native journals remain root-owned
through umbrella review. No new cache, build, install or browser run was needed.

BUG611 remains open. Next diagnose the retained opening losses and native
sustain/recovery constraints before choosing another change; do not infer that
better equipment scores solve acquisition. The genuine level-75 Necromancer
continuation still has 19/19 Act V actions and next ordinal 1658. Formal balance
acceptance remains 0/210; full v1, broader populations/holdouts, pacing/economy,
Hell/endgame, integrated gates, review, human soak and later owner playtest remain
incomplete. Browser works; CI is excluded; no pending user question.

## Bounded Den acquisition and loss-accounting repair

The next predeclared diagnostic uses the two Barbarians that previously stopped
on their first post-quest Den farm. `den-bounded-v1`, together with selected
`act1-training-v1` recovery, reuses native training to target level 12 with at most
99 admissions, three consecutive nonwins and ten total nonwins. Existing global
budgets, level ceilings and legacy first-loss screens remain unchanged. The
rejected defensive-equipment default stays disabled.

| Build | Actual terminal gameplay | Level | Admissions | Waves / wins |
| --- | --- | ---: | ---: | ---: |
| Double Swing Barbarian | Act I complete | 13 | 115 | 342 / 340 |
| Double Throw Barbarian | Den acquisition retry-limit | 7 | 50 | 77 / 74 |

Double Swing's acquisition interval contains 61 admissions, 60 wins and one loss,
earning level 12. Its first-boss checkpoint is native ordinal 106. Double Throw's
interval contains nine admissions, six wins and three consecutive losses. Both
pass their former ordinal-41 stop and at least one reaches first boss, satisfying
the frozen diagnostic adoption criterion. Retain the canonical opt-in, without
claiming causal population benefit or that Double Throw progression is solved.
The original thirteen-build cohort remains historically five clears/eight stops;
this new Double Swing clear belongs to the revised acquisition policy.

The two histories total 165 admissions, 419 waves, 414 victories and five nonwins;
6,182,222.348820495 combat ms and 33,693.635435 native-driver wall ms. Separate
whole-save/journal readback verifies complete exports, item custody, currency,
materials and XP, 18 legal stat and 23 legal skill allocations, seeds/clocks,
failed-wave zero rewards, first-boss checkpoint and exact training reconciliation.
It does not certify pacing, drop laws, grant provenance or browser durability.

Both original native screens exit unsuccessfully after writing their reports:
new acquisition losses were missing from recovery accounting. BUG625 adds a
structured checkpoint and independent training reconciliation, then includes only
verified losses in the existing recovery assertion. The final-code audit of
retained histories passes: the original assertion still fails, corrected
accounting passes, and missing/forged checkpoints fail. Original reports and
failed exits remain preserved; no combat replay or fresh all-pass screen is
claimed. The first runner's Vite CJS import error is retained as a rejected setup
attempt; its ESM correction consumes the same journals.

BUG624 and BUG625 are fixed/verified in working tree, with no commit. Policy
verification has 50 affected cases; the final accounting scope has 81 distinct
cases (41 recovery + nine training + 31 recovery-audit), reusing unchanged passes.
Scoped strict TypeScript and explicit six-file zero-warning lint pass. No broad
suite, build or earlier-act replay was run for this repair.

Gameplay authority: `p15-den-acquisition-v2-source.json`, SHA256
`5f48de0a4063adb684ae569a48d6949274b7a3b3be8f4c4b5e37a252d843e79c`.
Final audit authority: `bug625-final-source.json`, SHA256
`d8015e1969ef0f860484bd1413df0ab7c7a9a17adc85e424fd298c44ece9757a`.
Exactly six campaign paths differ; all 2,149 production/provenance inputs remain
unchanged. Required receipts, native reports/journals and the first-entry export
remain in the root-owned packet. The retained auditor is terminal and its exact
task-owned cache is removed/verified absent. Root retains packet/worktree through
umbrella review and owns eventual cleanup/release.

The genuine main continuation remains the level-75 Corpse/Bone five-act clear,
next ordinal 1658. Formal balance acceptance remains 0/210; BUG611, BUG592 and
the broader private-v1 scope remain open. Next inspect Double Throw's retained
losses for resource/skill progression constraints before another gameplay change.


## 2026-11-03 — Double Throw bridge rejected and canonical allocation restored

Exactly one prospective native Act I trial of Double Swing rank 5 before
Throwing Mastery reaches the boss at level 14 (first entry ordinal 134), then
loses Catacombs wave 5. Totals: 135 admissions, 419 waves, 414 victories and
five nonwins. Its Den interval reaches level 12 with 62 admissions; this is
an early acquisition improvement in this diagnostic, not population acceptance.
The full Act I-clear adoption criterion fails. BUG626 and BUG611 remain open.

Separate readback passes full terminal-save/journal/source reconciliation and
13 legal stat / 16 legal skill allocations. Native driver wall time is
33,358.580 ms, versus 6,472,648.866 logical combat ms. Seven candidate checks,
scoped strict types and explicit lint passed; gameplay still failed.
Candidate source is `p15-throw-bridge-v1-source.json`; result/readback is
`p15-throw-bridge-readback-v1.json` in the retained root-owned packet.

The rejected two source files are preserved as
`p15-throw-bridge-rejected-intended-growth-v1.json` and
`p15-throw-bridge-rejected-intended-growth.regression.test.ts`. Canonical
Throw targets now match the prior native profile; the regression file matches
its previous bytes. The JSON retains the candidate's formatting normalization,
so five scoped growth checks were run and pass. Canonical bounded Den farming
remains enabled. No production skill/data tuning or additional combat occurred.
`p15-throw-bridge-rollback.json` records restoration; the task-owned type config
is removed and verified absent. All consumers are terminal. Root retains the
worktree/evidence through umbrella review and owns eventual cleanup/release.

The previous goal turn was a status report only (no progress). Current genuine
continuation stays level 75, Act V 19/19, next ordinal 1658; formal balance
0/210 and full private v1 remain open. No external blocker/pending answer;
browser works, CI excluded. Do not rerun or extend this closed Throw trial.


## 2026-11-03 — Intended Fire spare investment clears Act I

[BUG629 result](2026-11-03-fire-spare-points.md): the retained
Fire8 export had two unused points and Inferno1. Append Inferno5 after existing
targets; original later unlocks and final goals remain. Seven affected checks,
scoped strict types and explicit lint pass. No production tuning/reset/gear or
training-limit changes. Exactly one prospective acquisition clears Act I13:
124admissions/359waves/351wins/eight defeats. First Catacombs115 losesW4; lawful
recovery earns13, retry123 wins six waves. Separate complete terminal-save/
journal/custody/economy/clock/training/native-allocation reconciliation passes.

Retain the two-file candidate under its predeclared completion rule. This is one
acquisition history, not representative or causal population acceptance. Formal
0/210 and BUG611 remain open. Source authority `p15-fire-spare-v1-source.json`,
readback `p15-fire-spare-readback-v1.json`, closure `p15-fire-spare-v1-closure.json`
in root's retained packet; all2151production inputs unchanged. Root retains the
claimed human2/required packet through umbrella review and owns cleanup/release.
The original thirteen-build cohort remains historical; do not rewrite its
original five clears/eight stops using subsequent revised-policy results.

## Follow-up — Bow unlock investment accepted

[BUG630 result](2026-11-03-bow-unlock-investment.md): defer only intended Bow's
Critical Strike20 level1→20. Native growth buys Multiple Shot3/Dodge1 at6 without
reset; original final ranks remain. One declared run clears Act I13:
117admissions/351waves/350wins/one retained defeat and lawful recovery. Six
affected checks/types/lint and independent complete save/journal/economy/clock/
training/point readback pass. No production tuning or other-build replay.
BUG611 stays open; this is one acquisition history, not population acceptance.
