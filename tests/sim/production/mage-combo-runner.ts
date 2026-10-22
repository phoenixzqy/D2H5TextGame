import type { RecordedBattleResult } from '@/engine/combat/combat';
import { activeStatusView, expireStatuses } from '@/engine/combat/status';
import { applyOrbs } from '@/engine/combat/orbs';
import { mageJsonHash } from './mage-balance-fixture';
import { MAGE_MASTERY_RECIPE, type MageMasteryFixture } from './mage-mastery-fixture';
import { inspectMageMasteryBattle, recordMageMasterySeed, verifyMageMasteryDeterminism,
  compareMageMasteryRuns, summarizeMageMasteryRuns, type MageMasteryMode } from './mage-mastery-runner';
import { buildMageComboFixture, assertMageComboFixture, type MageComboFixture, type MageComboCase } from './mage-combo-fixture';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Mage combo missing exposure identity');
  return value;
}
function assertMode(mode: unknown): asserts mode is MageMasteryMode {
  if (mode !== 'physical' && mode !== 'elemental') throw new Error('Mage combo mode');
}

function legacyInput(fixture: MageComboFixture, expectedCase: MageComboCase): MageMasteryFixture {
  assertMageComboFixture(fixture, expectedCase);
  const value = { recipe: { ...MAGE_MASTERY_RECIPE, masteryRank: 0 as const }, snapshot: fixture.snapshot, allocation: fixture.allocation };
  return { ...value, hash: mageJsonHash(value) };
}

/** Replay frozen initial records at actual event clocks; no explicit expiry event is invented. */
function strata(fixture: MageComboFixture, recorded: RecordedBattleResult, mode: MageMasteryMode) {
  const units = new Map([...fixture.snapshot.playerTeam, ...fixture.snapshot.enemyTeam].map(unit => [unit.id, unit]));
  const enemyIds = new Set(fixture.snapshot.enemyTeam.map(unit => unit.id)), condition = fixture.recipe.caseId;
  const mageIds = recorded.events.flatMap(event => event.kind === 'summon' ? [event.unit.id] : []);
  const rows = mageIds.flatMap((mageId, index) => (['flayer', 'horror-mage'] as const).flatMap(species =>
    (condition === 'none' ? ['none'] : ['active', 'expired']).map(exposure => ({
      mageId, type: mode === 'physical' ? 'physical' : required(['fire', 'cold', 'lightning', 'poison'][index]), species, exposure,
      attempts: 0, landed: 0, crits: 0, critDenominator: 0, dodges: 0, dodgeDenominator: 0,
      loggedDamage: 0, effectiveHpRemoved: 0, noncritValues: {} as Record<string, number>, critValues: {} as Record<string, number>
    }))));
  for (const event of recorded.events) {
    // The accepted direct meter validates finite/nonnegative/nondecreasing clocks first.
    for (const [id, unit] of units) if (unit.life > 0) units.set(id, expireStatuses(unit, event.simClockMs));
    const activeParalyze = (id: string) => condition === 'paralyze' && enemyIds.has(id) &&
      activeStatusView(required(units.get(id)), event.simClockMs).statuses.some(status => status.id === 'paralyze');
    if (event.kind === 'status' && enemyIds.has(event.target)) throw new Error('Mage combo unsupported enemy status refresh');
    if (event.kind === 'action' && activeParalyze(event.actor)) throw new Error('Mage combo action during active paralyze');
    if (event.kind === 'stunned' && enemyIds.has(event.target) && !activeParalyze(event.target)) throw new Error('Mage combo unsupported enemy stun window');
    if (event.kind === 'summon') units.set(event.unit.id, event.unit);
    else if (event.kind === 'damage') {
      const target = units.get(event.target);
      if (!target) throw new Error('Mage combo unknown stratum target');
      const effective = event.dodged ? 0 : Math.min(Math.max(0, target.life), event.amount);
      units.set(target.id, { ...target, life: Math.max(0, target.life - effective) });
      if (!mageIds.includes(event.source)) continue;
      const species = target.id.includes('undead-flayer') ? 'flayer' : target.id.includes('horror-mage') ? 'horror-mage' : null;
      const exposure = condition === 'none' ? 'none' : activeStatusView(target, event.simClockMs).statuses.some(status => status.id === condition) ? 'active' : 'expired';
      const row = rows.find(value => value.mageId === event.source && value.type === event.damageType && value.species === species && value.exposure === exposure);
      if (!row) throw new Error('Mage combo unclassified stratum');
      row.attempts++; row.dodgeDenominator++;
      if (event.dodged) row.dodges++;
      else {
        row.landed++; row.critDenominator++; if (event.crit) row.crits++;
        row.loggedDamage += event.amount; row.effectiveHpRemoved += effective;
        const values = event.crit ? row.critValues : row.noncritValues;
        values[String(event.amount)] = (values[String(event.amount)] ?? 0) + 1;
      }
    } else if (event.kind === 'heal' || event.kind === 'orb' || event.kind === 'death') {
      const target = units.get(event.target);
      if (!target) throw new Error('Mage combo unknown HP target');
      units.set(target.id, event.kind === 'orb' ? applyOrbs(target, [event.orb]) : { ...target,
        life: event.kind === 'death' ? 0 : Math.min(target.stats.lifeMax, target.life + event.amount) });
    }
  }
  return rows;
}

function decorate(fixture: MageComboFixture, mode: MageMasteryMode, run: ReturnType<typeof recordMageMasterySeed>) {
  assertMode(mode);
  const observed = strata(fixture, run.recorded, mode);
  for (const field of ['attempts', 'crits', 'critDenominator', 'dodges', 'dodgeDenominator', 'loggedDamage', 'effectiveHpRemoved'] as const) {
    if (observed.reduce((sum, row) => sum + row[field], 0) !== run.summary.metrics.mages[field]) throw new Error('Mage combo stratum reconciliation');
  }
  return { ...run, mode, caseId: fixture.recipe.caseId, fixtureHash: fixture.hash, source: fixture.source, overrides: fixture.overrides,
    summary: { ...run.summary, strata: observed } };
}

/** Full fixture validation precedes the legacy primitive; its meter also guards event clocks. */
export function inspectMageComboBattle(fixture: MageComboFixture, expectedCase: MageComboCase,
  recorded: RecordedBattleResult, mode: MageMasteryMode, seed: number) {
  return decorate(fixture, mode, inspectMageMasteryBattle(legacyInput(fixture, expectedCase), recorded, mode, seed));
}

/** One recording at a time in the importing immutable Git engine domain. */
export function recordMageComboSeed(fixture: MageComboFixture, expectedCase: MageComboCase, mode: MageMasteryMode, seed: number) {
  return decorate(fixture, mode, recordMageMasterySeed(legacyInput(fixture, expectedCase), mode, seed));
}

/** A/A, A/B/A, plain/recorded parity and input preservation without registry resets. */
export function verifyMageComboDeterminism(fixture: MageComboFixture, expectedCase: MageComboCase, mode: MageMasteryMode) {
  return verifyMageMasteryDeterminism(legacyInput(fixture, expectedCase), mode);
}

function assertRun(run: ReturnType<typeof recordMageComboSeed>, fixture: MageComboFixture,
  expectedCase: MageComboCase, mode: MageMasteryMode) {
  const actual = { caseId: run.caseId, fixtureHash: run.fixtureHash, source: run.source, overrides: run.overrides, mode: run.mode,
    inputHash: run.inputHash, masteryRank: run.masteryRank };
  const expected = { caseId: expectedCase, fixtureHash: fixture.hash, source: fixture.source, overrides: fixture.overrides, mode,
    inputHash: mageJsonHash({ ...fixture.snapshot, seed: run.seed }), masteryRank: 0 };
  if (!Number.isInteger(run.seed) || run.seed < 0 || run.seed >= 1000 || mageJsonHash(actual) !== mageJsonHash(expected)) {
    throw new Error('Mage combo expected pair identity');
  }
}

/** P→E pairs share one externally expected fixture and preparation. */
export function compareMageComboRuns(before: ReturnType<typeof recordMageComboSeed>, after: ReturnType<typeof recordMageComboSeed>,
  fixture: MageComboFixture, expectedCase: MageComboCase) {
  assertMageComboFixture(fixture, expectedCase);
  assertRun(before, fixture, expectedCase, 'physical'); assertRun(after, fixture, expectedCase, 'elemental');
  compareMageMasteryRuns(before, after);
  return { caseId: expectedCase, fixtureHash: fixture.hash, source: fixture.source, overrides: fixture.overrides,
    seed: before.seed, before: before.summary, after: after.summary };
}

/** Same seed/domain, distinct independently validated no-condition and intervention inputs. */
export function compareMageComboControl(neutral: ReturnType<typeof recordMageComboSeed>, intervention: ReturnType<typeof recordMageComboSeed>,
  fixture: MageComboFixture, expectedCase: MageComboCase, mode: MageMasteryMode) {
  assertMode(mode);
  if (expectedCase === 'none') throw new Error('Mage combo intervention/domain');
  assertMageComboFixture(fixture, expectedCase);
  const control = buildMageComboFixture('none');
  assertRun(neutral, control, 'none', mode); assertRun(intervention, fixture, expectedCase, mode);
  if (neutral.seed !== intervention.seed || mageJsonHash(neutral.preparation) !== mageJsonHash(intervention.preparation)) {
    throw new Error('Mage combo control seed/preparation');
  }
  return { caseId: expectedCase, mode, source: fixture.source, neutralFixtureHash: control.hash, fixtureHash: fixture.hash,
    seed: neutral.seed, before: neutral.summary, after: intervention.summary };
}

/** Successful-only nearest-rank TTK and observed control/death denominators. */
export const summarizeMageComboRuns = summarizeMageMasteryRuns;
