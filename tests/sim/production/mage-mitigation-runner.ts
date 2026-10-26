import type { RecordedBattleResult } from '@/engine/combat/combat';
import { applyOrbs } from '@/engine/combat/orbs';
import { mageJsonHash } from './mage-balance-fixture';
import { MAGE_MASTERY_RECIPE, type MageMasteryFixture } from './mage-mastery-fixture';
import { inspectMageMasteryBattle, recordMageMasterySeed, compareMageMasteryRuns,
  summarizeMageMasteryRuns, verifyMageMasteryDeterminism, type MageMasteryMode } from './mage-mastery-runner';
import { assertMageMitigationFixture, type MageMitigationFixture, type MageMitigationCase } from './mage-mitigation-fixture';

function legacyInput(fixture: MageMitigationFixture, expectedCase: MageMitigationCase): MageMasteryFixture {
  assertMageMitigationFixture(fixture, expectedCase);
  const value = { recipe: { ...MAGE_MASTERY_RECIPE, masteryRank: 0 as const },
    snapshot: fixture.snapshot, allocation: fixture.allocation };
  return { ...value, hash: mageJsonHash(value) };
}

/** Observed per-Mage/type/target-species hit values, including zero-attempt strata. */
function strata(fixture: MageMitigationFixture, recorded: RecordedBattleResult, mode: MageMasteryMode) {
  const units = new Map([...fixture.snapshot.playerTeam, ...fixture.snapshot.enemyTeam].map(unit => [unit.id, unit]));
  const mageIds = recorded.events.flatMap(event => event.kind === 'summon' ? [event.unit.id] : []);
  const rows = mageIds.flatMap((mageId, index) => (['flayer', 'horror-mage'] as const).map(species => ({
    mageId, type: mode === 'physical' ? 'physical' : ['fire', 'cold', 'lightning', 'poison'][index]!, species,
    attempts: 0, landed: 0, crits: 0, critDenominator: 0, dodges: 0, dodgeDenominator: 0,
    loggedDamage: 0, effectiveHpRemoved: 0, noncritValues: {} as Record<string, number>, critValues: {} as Record<string, number>
  })));
  for (const event of recorded.events) {
    if (event.kind === 'summon') units.set(event.unit.id, event.unit);
    else if (event.kind === 'damage') {
      const target = units.get(event.target);
      if (!target) throw new Error('Mage mitigation unknown stratum target');
      const effective = event.dodged ? 0 : Math.min(Math.max(0, target.life), event.amount);
      units.set(target.id, { ...target, life: Math.max(0, target.life - effective) });
      if (!mageIds.includes(event.source)) continue;
      const species = target.id.includes('undead-flayer') ? 'flayer' : target.id.includes('horror-mage') ? 'horror-mage' : null;
      const row = rows.find(value => value.mageId === event.source && value.type === event.damageType && value.species === species);
      if (!row) throw new Error('Mage mitigation unclassified stratum');
      row.attempts++; row.dodgeDenominator++;
      if (event.dodged) row.dodges++;
      else {
        row.landed++; row.critDenominator++; if (event.crit) row.crits++;
        row.loggedDamage += event.amount; row.effectiveHpRemoved += effective;
        const values = event.crit ? row.critValues : row.noncritValues;
        values[String(event.amount)] = (values[String(event.amount)] ?? 0) + 1;
      }
    } else if (event.kind === 'dot') {
      const target = units.get(event.target);
      if (!target) throw new Error('Mage mitigation unknown periodic target');
      units.set(target.id, { ...target, life: Math.max(0, target.life - event.amount) });
    } else if (event.kind === 'heal' || event.kind === 'orb' || event.kind === 'death') {
      const target = units.get(event.target);
      if (!target) throw new Error('Mage mitigation unknown HP target');
      units.set(target.id, event.kind === 'orb' ? applyOrbs(target, [event.orb]) : { ...target,
        life: event.kind === 'death' ? 0 : Math.min(target.stats.lifeMax, target.life + event.amount) });
    }
  }
  return rows;
}

function decorate(fixture: MageMitigationFixture, mode: MageMasteryMode, run: ReturnType<typeof recordMageMasterySeed>) {
  if (mode !== 'physical' && mode !== 'elemental') throw new Error('Mage mitigation mode');
  const observed = strata(fixture, run.recorded, mode);
  for (const field of ['attempts', 'crits', 'critDenominator', 'dodges', 'dodgeDenominator', 'loggedDamage', 'effectiveHpRemoved'] as const) {
    if (observed.reduce((sum, row) => sum + row[field], 0) !== run.summary.metrics.mages[field]) throw new Error('Mage mitigation stratum reconciliation');
  }
  return { ...run, mode, caseId: fixture.recipe.caseId, fixtureHash: fixture.hash, source: fixture.source, overrides: fixture.overrides,
    summary: { ...run.summary, strata: observed } };
}

/** Validate the full outer fixture before the accepted inner inspector sees it. */
export function inspectMageMitigationBattle(fixture: MageMitigationFixture, expectedCase: MageMitigationCase,
  recorded: RecordedBattleResult, mode: MageMasteryMode, seed: number) {
  return decorate(fixture, mode, inspectMageMasteryBattle(legacyInput(fixture, expectedCase), recorded, mode, seed));
}

/** Record one seed through the importing immutable engine domain, retaining outer identity. */
export function recordMageMitigationSeed(fixture: MageMitigationFixture, expectedCase: MageMitigationCase, mode: MageMasteryMode, seed: number) {
  return decorate(fixture, mode, recordMageMasterySeed(legacyInput(fixture, expectedCase), mode, seed));
}

/** Reuse bounded plain/recorded, A/A and A/B/A checks without resetting module registries. */
export function verifyMageMitigationDeterminism(fixture: MageMitigationFixture, expectedCase: MageMitigationCase, mode: MageMasteryMode) {
  return verifyMageMasteryDeterminism(legacyInput(fixture, expectedCase), mode);
}

/** Expected outer identity prevents a pair with mutually agreeing wrong metadata. */
export function compareMageMitigationRuns(before: ReturnType<typeof recordMageMitigationSeed>, after: ReturnType<typeof recordMageMitigationSeed>,
  fixture: MageMitigationFixture, expectedCase: MageMitigationCase) {
  assertMageMitigationFixture(fixture, expectedCase);
  for (const [run, mode] of [[before, 'physical'], [after, 'elemental']] as const) {
    const actual = { caseId: run.caseId, fixtureHash: run.fixtureHash, source: run.source, overrides: run.overrides, mode: run.mode,
      inputHash: run.inputHash, masteryRank: run.masteryRank };
    const expected = { caseId: expectedCase, fixtureHash: fixture.hash, source: fixture.source, overrides: fixture.overrides, mode,
      inputHash: mageJsonHash({ ...fixture.snapshot, seed: run.seed }), masteryRank: 0 };
    if (!Number.isInteger(run.seed) || run.seed < 0 || run.seed >= 1000 || mageJsonHash(actual) !== mageJsonHash(expected)) {
      throw new Error('Mage mitigation expected pair identity');
    }
  }
  compareMageMasteryRuns(before, after);
  return { caseId: expectedCase, fixtureHash: fixture.hash, source: fixture.source, overrides: fixture.overrides,
    seed: before.seed, before: before.summary, after: after.summary };
}

/** Preserve successful-only nearest-rank TTK and observed death/control/nonactor denominators. */
export const summarizeMageMitigationRuns = summarizeMageMasteryRuns;
