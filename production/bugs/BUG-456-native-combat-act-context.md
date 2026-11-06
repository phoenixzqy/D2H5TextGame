# BUG-456 — Pass native campaign act context into battle staging

Status: root fix locally verified; earned and browser current-source rebaseline passed.
Severity: High for act-dependent combat behavior and truthful ActIV acceptance.
Affected systems: combat staging/native run context; root sole writer.
Build: b5a0898+privatev1/BUG447/449, WSL Node24.21.0, native store noDOM/locale.
Actual Plains498/runSeed3190695251/wave4, all original inputs retained.

1. Complete native earnedActsI–III via wave-priority Mephisto497 and Claims.
2. Enter Plains498 ActIV; preserve all5initial inputs/events/final outcomes.
3. Replay exact inputs with correct act4 in `p15-earned-plains-priority-study-v1`.
4. Exact event control fails: standalone emits generic boss enrage for Izual
   at27822.9167ms and Knightat50225ms; native recording omits those events.

Expected: accepted native run.act enters immutable engine snapshot for both
first/new-wave staging and public priority replay; standalone exact snapshot
reproduces native events/outcome. Actual: `stageWave` snapshot in
`src/stores/combatHelpers.ts` omits act. `stageRecordedWave` forwards snapshot
unchanged; `runBattleRecorded` initializes act=snapshot.act??1. Therefore all
native area runs use defaultActI for act-dependent generic boss behavior.
Authored per-unit enrage may still operate; do not claim all enrage absent.

Evidence: failed priority-study owned log/exit (PASScleanup5.436s, exit1),
actual five-wave packet and source staging/engine default. No result or
criterion weakened; failed study produces no accepted arm/report.

Root correction: pass run.act at shared snapshot construction, add meaningful
regression comparing captured native snapshot/staging and standalone correct
act with enrage boundary and replay. Finish current frozen-production ActIII
browser consumers, dispose owned bundle, then make focused source/test change
inside claimed worktree and validate. No gameplay numeric tuning/installs/
newagents/commits/push/PR/CI. Rebaseline ActIV earned continuation afterfix.
Fullv1 and ActIV–V acceptance remain open.


Onefieldsharedsnapshotcorrection `act:run.act` plus7case regression. Original
RED7fail: sixactualcontext failures and one next-wave fixture that defeated
beforecontextassertion. Firstgreen71/72fails samefixture; nativefactory
recomposesderivedAttack, so finalfixture usesdeclaredconstructedfinisher and
corevitality instead. No assertion weakened, no production finisher/gear/rank
change. Final focused72/5PASS19.407s, scopedlintPASS13.751s (originalloop
lintfail retained), finalstrictTSC PASS246.670s, productionbuildPASS21.063s.
OldtypecheckV1cancelled afterfixtureupdate; receipt125records cleanupwarning
but finalnoOwnedDescendantsAlive=true; no passclaimed. FinalV2 cleanexit0.

`bug456-final-source-delta-v1.json` rehashes2069priorinputs: exactlyoneold
filechanged andone newregression; gameJSONunchanged. Sourcefreezeactive. Full
ordinarysuite session73965/labelbug456-full-unit-v1 and freshnative session
72896/labelp15-earned-act-context-act5-v1 running. Preserve allhistories;
current earnedActIVacceptancepending. Current763file/9dir build retainedin
packet bug456-native-context-build-v1 forrootbrowserconsumer/disposal.

Final rebaseline `p15-earned-act-context-act5-v1` PASS577.063s, exact oldprefix
and Mephisto completion/Claim/ActIVunlock. Correct ActIV enrage events present;
same Plains498failure remains separate BUG455. Independent transformation
PASS30.629s/protectionPASS8.692s. Current production bilingual browser
PASS50.570s; four screenshots reviewed, exact763file bundle disposed.
Correct-act standalone five-control priority study now passes.

Full ordinary suite ended at1200s with642passingfiles and one endgame UI
failure; no full-green claim. Focused failure reproduces independently and
is tracked as BUG457. All original suite child PIDs absent; preserve timeout
and wrapper cleanup-warning receipt. No remaining act-context defect observed.
