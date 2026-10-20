# BUG-049 — Record the qualified Andariel quest objective

Status: Fixed in `47a70c6`; independent producer/QA final APPROVE, evidence ADEQUATE.
Severity: High — tracked Andariel quest cannot complete through combat.
Owner: store/content integration; independent design/producer/QA review.

## Reproduction

Input928edff, Linux/Vitest Node+jsdom. Locale/browser/viewport N/A for this
structural event proof; future ordinary desktop/mobile earned route remains.
Seed7, ordinal0, manual Catacombs. Source reproduces two independent blockers:

1. Track `quests/act1-sisters-to-the-slaughter` inProgress.
2. Actual map/chapter source uses areas/act1-catacombs and monsters/act1.andariel.
3. Its objective instead uses areas/act1_catacombs_4 and monsters/andariel.
4. Qualified final combat settlement only marks clear-area objectives; it emits
   no kill-boss event even after an actual chapter-boss defeat.

Expected: tracked, unclaimed, eligible objective completes once at qualified
settlement. Actual: objective stays false/inProgress. Evidence: main.json
Andariel objective; mapStore.ts markCleared/recordNpcTalk; combatHelpers.ts
advanceWaveOrFinish/playWave; canonical Catacombs chapter source. Workaround:
none for quest completion; existing Catacombs clear can still unlock ActII.

## Reviewed D11 correction

Producer/design/QA exact plan READY before edits. Five code files only:
main.json (Andariel two IDs), mapStore.ts/mapStore.test.ts, combatHelpers.ts/new
combatHelpers.quest-objectives.test.ts. Generic typed recordBossKill event
{actId,areaId,bossArchetypeId} matches exact authored kill-boss type/context,
tracked inProgress/unclaimed/unmet, predecessors true in pre-event progress.
No cascade, auto-tracking, history/backfill or rewards from the map action.

At the existing qualified finalwave branch, new event only requires current
installed outcome/events references and run/wave/count metadata. Capture one
authored chapterboss spawn with exact catalog membership and its built enemy
ID; require original enemy/monster/chapter-boss dead. Use activeRun act/area,
not mutable map location. Existing playerwin/originalheroalive/playbackcomplete
and terminal [0,60000] validation remain authoritative. No new difficulty,
level, wallclock, RNG or combat/reward/clear policy. Provenance gates only the
new quest event. Transient capture, no save/schema migration; objective ID stable.

Existing ActII unlock policy accepts completed quest OR Catacombs clear; new
completion can affect unlock state before reward claim. Unsupported Andariel
reward bag remains safely refused: no extra8000questXP/item/loot/claim flag,
while normal combat payouts continue. Reward implementation is separate work.
Security check: pass, local typed event/data wiring; no network/credentials,
permissions, validation bypass, external instructions or export implementation.

## Proof and limits

Freeze genuine RED before three runtime/data edits, independent review. Real
imported canonical wiring gear with explicit refill enables an actual manual
engine win; this proves event wiring, not earned survival or balance. Test
exact canonical IDs, ordered/no-op map state, final playback boundary, native
production stores/plan/engine and exported quest state; no spy or rewritten
outcome on positive path. Distinct stale run/wave/replay/ref/metadata tests.
Controlled malformed-result negatives may delegate to real runBattleRecorded,
then alter one final chapter result predicate before installation/capture;
preserve initial enemies/events/winner/hero/seed/earlier waves, confirm injection,
restore after each. These are explicit guard fixtures, not natural failures.
Inherited timeout/death/terminal suites suffice; no duplicated malformed clock.

Frozen GREEN, related event/quest/persistence/outcome/engine/data regressions,
full U/E/T/L and guarded build without fingerprint overlap; independent final
audit, exact owned cleanup, commit then ledger. No browser needed for this
bounded source/store card. Earned Andariel, quest rewards, broad quests, C1 and
C0–C4/G0–G7/full v1 remain open.
RAW=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-andariel-objective-vxzoooqx;
root owns all writes/cleanup after independent consumers release.


## Frozen RED and preserved incremental attempts

MapRED15tests12fail/3controls3.193s; positiveRED16tests13fail/3controls4.114s;
boundaryRED27tests15fail/12controls4.802s; final frozenRED34tests15fail/19controls
0pending5.507s, exit1. All original reports/sources retained in RAW. No test
oracle correction or runtime/data edit occurred. Final two existing-path failures
are actual completed manual run leaving tracked quest inProgress, including
tracking started before final settlement; one data failure is canonical IDs,
and12 interface failures are missing recordBossKill. Nineteen controls pass,
including injected malformed boss results, stale recording guards and original
map tests. Interface failures alone are not the bug proof.

Frozen maptest SHA0f506a3fbc67ab38a516938559a27a08903d67c9fef16b8eb3db384a73e11a00;
frozen combatquesttest SHAab065e15ae2e762eeb6d80113a58b5a7f7a92e3c0cf457237390c818546424f3.
Frozen report40a2029c0f9e2820c7cce30aed52fd106664dab507d40b3cb76d0b7a90c36999.
Three runtime/data sources remain exact original bytes, hashed in RAW.
QA independently approved scoped negative pre-installation fault injection:
delegate actual engine, alter only one final boss predicate, retain winner/hero/
events/initial source and assert one injection/current refs; positive unspied.
Independent producer/QA frozenRED APPROVE received before any runtime/data changes.

## Implementation and validation

Only the three reviewed runtime/data files changed. Andariel now references the
canonical area and monster. `recordBossKill` advances eligible ordered tracked
objectives; transient recording references and the original catalog-backed built
boss qualify the combat event. Existing combat payouts and area-clear behavior
remain unchanged. Producer implementation review: APPROVE, no material findings.

Original frozen GREEN34 passed, as did the later lint-only amended test. First
typecheck rejected an explicit undefined optional property; conditional spread
fixed the runtime construction. First lint rejected the indexed test loop;
independently approved synchronous forEach then required braces under the second
lint rule. Both lint failures and the typecheck failure are preserved, along with
original frozen/intermediate sources. No assertion, oracle or fixture changed.

Final source full unit2496/144, zero failures/pending/todo; engine1011/52,
related429/13, typecheck and lint/purity52 pass. Engine6.312s and final unit41.380s
exceed existing budgets; no threshold change. T20.944/L48.797 pass. Production
build/bridge guard8.805s passes after all test processes exit. Existing
Browserslist/chunk-size/2.57MB manifest precache warnings remain. Independent
producer/QA final audits APPROVE / ADEQUATE with all command/source/report hashes
and assertion preservation verified.

Versioned [outcome](../../docs/plans/evidence/fixtures/bug049-outcome.json)
records exact argv, exits, wall times, reports/assertions, source hashes and
failed attempts. Frozen original tests and first failed runtime source are
retained beside it. Both consumers released before exact RAW/dist/.vite cleanup;
all three paths verified absent. No task process/server remains. Root worktree
claim continues for the next plan slice; original checkout remains unchanged.
