import assert from 'node:assert/strict';
import type { CampaignWave } from './policy';
import type { CampaignRecovery } from './route';
import type { auditCampaignOpening } from './opening-audit';
import { listSubAreasForAct, resolveSubArea } from '@/stores/subAreaResolver';
import { challengeEnemyLevelRange } from '@/engine/combat/sub-area-run';

/** Detailed area-controller audits own these settled losses; this check reconciles global custody. */
export interface LaterActRecoveryAudit {
  readonly act: 3 | 4 | 5;
  readonly nonwinOrdinals: readonly number[];
}

/** Independently reconcile historical losses and every resolved recovery to actual admissions. */
export function assertCampaignRecovery(recovery: CampaignRecovery, waves: readonly CampaignWave[], status: string,
  preparationNonwins: ReadonlySet<number> = new Set(), opening?: ReturnType<typeof auditCampaignOpening>,
  actTwo?: { readonly nonwinOrdinals: readonly number[] }, laterActs: readonly LaterActRecoveryAudit[] = []) {
  const actTwoNonwins = new Set<number>();
  for (const ordinal of actTwo?.nonwinOrdinals ?? []) {
    const failure = waves.find(row => row.ordinal === ordinal && row.outcome !== 'victory');
    const area = failure && resolveSubArea(2, failure.area);
    assert.ok(failure && area?.id === failure.area && (area.actId === 'acts/act2' ||
      failure.phase === 'farm' && area.actId === 'acts/act1'),
    'Undeclared Act II nonwin source');
    assert.ok(!actTwoNonwins.has(ordinal) && !preparationNonwins.has(ordinal), 'Overlapping Act II exclusion');
    assert.ok(!recovery.cycles.some(cycle => cycle.failure.ordinal === ordinal || cycle.retryOrdinal === ordinal ||
      cycle.trainingOrdinals.includes(ordinal)), 'Act II exclusion overlaps ordinary recovery');
    actTwoNonwins.add(ordinal);
  }
  const laterNonwins = new Set<number>(), laterOwners = new Set<number>();
  for (const audit of laterActs) {
    assert.ok([3, 4, 5].includes(audit.act), 'Unknown later-act recovery audit');
    assert.ok(!laterOwners.has(audit.act), 'Repeated later-act recovery audit'); laterOwners.add(audit.act);
    for (const ordinal of audit.nonwinOrdinals) {
      const failure = waves.find(row => row.ordinal === ordinal && row.outcome !== 'victory');
      const area = failure && resolveSubArea(audit.act, failure.area);
      const permittedActs = failure?.phase === 'farm'
        ? Array.from({ length: audit.act }, (_value, index) => `acts/act${String(index + 1)}`)
        : [`acts/act${String(audit.act)}`];
      assert.ok(failure && area?.id === failure.area && permittedActs.includes(area.actId),
        'Undeclared later-act nonwin source');
      assert.ok(!laterNonwins.has(ordinal) && !actTwoNonwins.has(ordinal) && !preparationNonwins.has(ordinal),
        'Overlapping later-act exclusion');
      assert.ok(!recovery.cycles.some(cycle => cycle.failure.ordinal === ordinal || cycle.retryOrdinal === ordinal ||
        cycle.trainingOrdinals.includes(ordinal)), 'Later-act exclusion overlaps ordinary recovery');
      laterNonwins.add(ordinal);
    }
  }
  const openingNonwins = new Set<number>();
  for (const [ordinals, area, phase, message] of [
    [opening?.failureOrdinals ?? [], 'areas/act1-den-of-evil', 'route', 'Opening exclusion requires a Den route nonwin'],
    [opening?.trainingNonwinOrdinals ?? [], 'areas/act1-blood-moor', 'farm', 'Opening training exclusion requires a Blood Moor farm nonwin']
  ] as const) {
    for (const ordinal of ordinals) {
      const failure = waves.find(row => row.ordinal === ordinal && row.outcome !== 'victory');
      assert.ok(failure?.area === area && failure.phase === phase, message);
      assert.ok(!openingNonwins.has(ordinal), 'Repeated opening exclusion');
      assert.ok(!preparationNonwins.has(ordinal), 'Opening exclusion overlaps preparation');
      assert.ok(!actTwoNonwins.has(ordinal), 'Opening exclusion overlaps Act II preparation');
      assert.ok(!laterNonwins.has(ordinal), 'Opening exclusion overlaps later-act preparation');
      assert.ok(!recovery.cycles.some(cycle => cycle.failure.ordinal === ordinal ||
        cycle.retryOrdinal === ordinal || cycle.trainingOrdinals.includes(ordinal)),
      'Opening exclusion overlaps an ordinary recovery');
      openingNonwins.add(ordinal);
    }
  }
  for (const ordinal of preparationNonwins) {
    const failure = waves.find(row => row.ordinal === ordinal && row.outcome !== 'victory');
    assert.ok(failure?.phase === 'farm', 'Preparation exclusion requires a farm nonwin');
    assert.ok(!recovery.cycles.some(cycle => cycle.failure.ordinal === ordinal ||
      cycle.retryOrdinal === ordinal || cycle.trainingOrdinals.includes(ordinal)),
    'Preparation exclusion overlaps an ordinary recovery');
  }
  const nonwins = waves.filter(row => row.outcome !== 'victory' &&
    !preparationNonwins.has(row.ordinal) && !openingNonwins.has(row.ordinal) && !actTwoNonwins.has(row.ordinal) &&
    !laterNonwins.has(row.ordinal));
  const terminal = waves.at(-1);
  const terminalIsExcluded = terminal !== undefined &&
    (preparationNonwins.has(terminal.ordinal) || openingNonwins.has(terminal.ordinal) ||
      actTwoNonwins.has(terminal.ordinal) || laterNonwins.has(terminal.ordinal));
  assert.equal(nonwins.length, recovery.cycles.length + (status === 'nonwin' && !terminalIsExcluded ? 1 : 0),
    'Retained nonwins do not reconcile with recoveries and terminal stop');
  assert.ok(recovery.cycles.length <= 2);
  if (recovery.mode === 'none') assert.equal(recovery.cycles.length, 0);
  const admissions = new Map<number, CampaignWave[]>();
  for (const wave of waves) {
    const rows = admissions.get(wave.ordinal) ?? [];
    rows.push(wave); admissions.set(wave.ordinal, rows);
  }
  const failureOrdinals = new Set<number>(), trainingOrdinals = new Set<number>();
  assert.ok(new Set(recovery.cycles.map(cycle => cycle.trainingPolicy)).size <= 1,
    'Mixed recovery training policies');
  for (const cycle of recovery.cycles) {
    const lowerLevelTraining = cycle.trainingPolicy === 'cleared-level-margin-v1';
    assert.equal(failureOrdinals.has(cycle.failure.ordinal), false, 'Repeated recovery of one failure');
    failureOrdinals.add(cycle.failure.ordinal);
    const failure = nonwins.find(row => row.ordinal === cycle.failure.ordinal);
    assert.ok(failure, 'Missing settled recovery failure');
    assert.deepEqual({ area: failure.area, phase: failure.phase, ordinal: failure.ordinal,
      index: failure.index, outcome: failure.outcome }, cycle.failure);
    assert.equal(failure.xp, 0); assert.equal(failure.items, 0);
    assert.ok(cycle.resolution !== null && cycle.endLevel !== null, 'Unresolved recovery');
    assert.equal(cycle.targetLevel, cycle.fromLevel + 1);
    assert.ok(cycle.targetLevel <= 14);
    assert.ok(cycle.trainingOrdinals.length <= (lowerLevelTraining ? 40 : 12));
    if (lowerLevelTraining) {
      if (cycle.trainingArea === null) {
        assert.ok(!listSubAreasForAct(1).some(area =>
          challengeEnemyLevelRange(area).max <= cycle.fromLevel - 2 &&
          waves.some(row => row.area === area.id && row.ordinal < cycle.failure.ordinal &&
            row.outcome === 'victory' && row.advance === 'victory')),
        'Eligible cleared recovery area was omitted');
        assert.equal(cycle.trainingOrdinals.length, 0); assert.equal(cycle.retryOrdinal, null);
        assert.equal(cycle.resolution, 'stopped');
        assert.ok(cycle.reason?.includes('No cleared lower-level recovery area'));
      } else {
        const area = resolveSubArea(1, cycle.trainingArea);
        assert.ok(area?.actId === 'acts/act1' && area.id === cycle.trainingArea, 'Invalid recovery training area');
        assert.ok(challengeEnemyLevelRange(area).max <= cycle.fromLevel - 2, 'Recovery training level margin');
        assert.ok(waves.some(row => row.area === cycle.trainingArea && row.ordinal < cycle.failure.ordinal &&
          row.outcome === 'victory' && row.advance === 'victory'), 'Missing prior recovery training clear');
      }
    }
    let previousOrdinal = cycle.failure.ordinal;
    for (const ordinal of cycle.trainingOrdinals) {
      assert.equal(trainingOrdinals.has(ordinal), false, 'Repeated training admission');
      trainingOrdinals.add(ordinal); assert.ok(ordinal > previousOrdinal); previousOrdinal = ordinal;
      const rows = admissions.get(ordinal); assert.ok(rows?.length, 'Unobserved training admission');
      assert.ok(rows.every(row => row.area === cycle.trainingArea && row.phase === 'farm'));
      assert.equal(rows[0]?.index, 0);
    }
    if (cycle.retryOrdinal !== null) {
      assert.ok(cycle.retryOrdinal > previousOrdinal);
      const rows = admissions.get(cycle.retryOrdinal); assert.ok(rows?.length, 'Unobserved retry admission');
      assert.ok(rows.every(row => row.area === cycle.failure.area && row.phase === 'route'));
      assert.deepEqual(rows.map(row => row.index), rows.map((_, index) => index), 'Retry skipped waves');
      assert.ok(cycle.endLevel >= cycle.targetLevel);
      const last = rows.at(-1); assert.ok(last);
      if (cycle.resolution === 'retry-won') {
        assert.equal(last.outcome, 'victory'); assert.equal(last.advance, 'victory');
      } else if (cycle.resolution === 'retry-nonwin') assert.notEqual(last.outcome, 'victory');
    } else assert.equal(cycle.resolution, 'stopped');
  }
  assert.ok(trainingOrdinals.size <= (recovery.cycles[0]?.trainingPolicy === 'cleared-level-margin-v1' ? 80 : 20));
}
