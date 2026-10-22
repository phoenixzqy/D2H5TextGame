import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleResult } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { applyOrbs } from '@/engine/combat/orbs';
import { mageJsonHash, type MageBalanceFixture } from './mage-balance-fixture';

export interface MageScreenProvenance {
  readonly revision: string;
  readonly sourceHash: string;
  readonly dataHash: string;
  readonly driverHash: string;
  readonly toolHash: string;
  readonly fixtureBytesHash: string;
}

function damageCounter() {
  return { loggedDamage: 0, effectiveHpRemoved: 0, attempts: 0, crits: 0,
    critDenominator: 0, dodges: 0, dodgeDenominator: 0 };
}

/** Direct event damage only: logged amounts include overkill, effective amounts clamp it. */
export function measureMageBattle(snapshot: CombatSnapshot, recorded: RecordedBattleResult) {
  const units = new Map([...snapshot.playerTeam, ...snapshot.enemyTeam].map(unit => [unit.id, unit]));
  const mages = new Set<string>();
  const counters = { player: damageCounter(), hero: damageCounter(), mages: damageCounter(), enemy: damageCounter() };
  const hero = snapshot.playerTeam.find(unit => unit.kind === 'hero');
  if (!hero) throw new Error('Missing Mage screen hero');
  const mana = { entry: hero.mana, minimum: hero.mana, final: hero.mana };
  let previousTime = 0;
  const unitAt = (id: string): CombatUnit => {
    const unit = units.get(id);
    if (!unit) throw new Error(`Unknown Mage screen event unit: ${id}`);
    return unit;
  };
  for (const event of recorded.events) {
    if (!Number.isFinite(event.simClockMs) || event.simClockMs < previousTime) throw new Error('Invalid Mage screen clock');
    previousTime = event.simClockMs;
    if (event.kind === 'summon') {
      if (units.has(event.unit.id)) throw new Error('Duplicate Mage screen summon');
      units.set(event.unit.id, event.unit);
      if (event.unit.side === 'player' && event.unit.summonTemplateId === 'skeletal_mage' && event.owner === hero.id) mages.add(event.unit.id);
    } else if (event.kind === 'damage') {
      const source = unitAt(event.source);
      const target = unitAt(event.target);
      if (!Number.isFinite(event.amount) || event.amount < 0) throw new Error('Invalid Mage screen damage');
      const effective = event.dodged ? 0 : Math.min(Math.max(0, target.life), event.amount);
      units.set(target.id, { ...target, life: Math.max(0, target.life - effective) });
      const groups = source.side === 'enemy' ? [counters.enemy] : [counters.player,
        ...(source.id === hero.id ? [counters.hero] : []), ...(mages.has(source.id) ? [counters.mages] : [])];
      for (const counter of groups) {
        counter.loggedDamage += event.dodged ? 0 : event.amount;
        counter.effectiveHpRemoved += effective;
        counter.attempts++;
        counter.dodgeDenominator++;
        if (event.dodged) counter.dodges++;
        else {
          counter.critDenominator++;
          if (event.crit) counter.crits++;
        }
      }
    } else if (event.kind === 'heal') {
      const target = unitAt(event.target);
      units.set(target.id, { ...target, life: Math.min(target.stats.lifeMax, target.life + event.amount) });
    } else if (event.kind === 'orb') {
      units.set(event.target, applyOrbs(unitAt(event.target), [event.orb]));
    } else if (event.kind === 'death') {
      units.set(event.target, { ...unitAt(event.target), life: 0 });
    } else if (event.kind === 'dot') {
      throw new Error('Source-less DoT is outside the direct-only Mage screen');
    } else if (event.kind === 'mana' && event.target === hero.id) {
      mana.minimum = Math.min(mana.minimum, event.mana);
      mana.final = event.mana;
    }
  }
  const end = recorded.events[recorded.events.length - 1];
  if (end?.kind !== 'end' || end.winner !== recorded.result.winner) throw new Error('Missing Mage screen end');
  const durationMs = end.simClockMs;
  const rates = (counter: ReturnType<typeof damageCounter>) => ({ ...counter,
    loggedDps: durationMs > 0 ? counter.loggedDamage * 1000 / durationMs : null,
    effectiveDps: durationMs > 0 ? counter.effectiveHpRemoved * 1000 / durationMs : null });
  const finalHero = recorded.result.playerTeam.find(unit => unit.id === hero.id);
  if (!finalHero || finalHero.mana !== mana.final) throw new Error('Mage screen final MP does not reconcile');
  for (const finalUnit of [...recorded.result.playerTeam, ...recorded.result.enemyTeam]) {
    if (unitAt(finalUnit.id).life !== finalUnit.life) throw new Error('Mage screen HP does not reconcile');
  }
  return { outcome: end.winner === 'player' ? 'victory' : end.winner === 'enemy' ? 'defeat' : 'draw',
    heroDied: finalHero.life <= 0, durationMs, successfulTtkMs: end.winner === 'player' ? durationMs : null,
    player: rates(counters.player), hero: rates(counters.hero), mages: rates(counters.mages), enemy: rates(counters.enemy), mana };
}

/** Execute the closed recipe in the importing engine's own module domain. */
export function runMageScreen(fixture: MageBalanceFixture, mode: 'physical' | 'elemental', provenance: MageScreenProvenance) {
  const before = JSON.stringify(fixture);
  const equal = (left: unknown, right: unknown, label: string) => {
    if (mageJsonHash(left) !== mageJsonHash(right)) throw new Error(`Mage screen ${label}`);
  };
  equal(fixture.hash, mageJsonHash({ recipe: fixture.recipe, snapshot: fixture.snapshot, allocation: fixture.allocation }), 'fixture hash');
  const execute = (seed: number, plain = false) => {
    const input = structuredClone({ ...fixture.snapshot, seed });
    const bytes = JSON.stringify(input);
    const result = plain ? runBattle(input) : runBattleRecorded(input);
    if (JSON.stringify(input) !== bytes) throw new Error('Mage screen input mutated');
    return result;
  };
  const recorded = (seed: number) => execute(seed) as RecordedBattleResult;
  const [seedA, seedB] = fixture.recipe.combatSeeds;
  const a = recorded(seedA);
  equal(a, recorded(seedA), 'A/A mismatch');
  const b = recorded(seedB);
  equal(a, recorded(seedA), 'A/B/A mismatch');
  equal(b, recorded(seedB), 'B/B mismatch');
  const runs = [a, b].map((battle, index) => {
    const seed = fixture.recipe.combatSeeds[index];
    if (seed === undefined) throw new Error('Missing Mage screen seed');
    equal(battle.result, execute(seed, true), 'plain/recorded mismatch');
    const input = { ...fixture.snapshot, seed };
    const hero = input.playerTeam[0];
    if (!hero || hero.kind !== 'hero') throw new Error('Missing Mage screen entry hero');
    const summons = battle.events.filter(event => event.kind === 'summon' && event.owner === hero.id &&
      event.unit.summonTemplateId === 'skeletal_mage');
    const payments = battle.events.filter(event => event.kind === 'mana' && event.target === hero.id &&
      event.reason === 'cast' && event.simClockMs === 0);
    const payment = payments[0];
    if (summons.length !== 4 || payments.length !== 1 || payment?.kind !== 'mana' || hero.mana - payment.mana !== 22) {
      throw new Error('Mage screen startup preparation mismatch');
    }
    const mageDamageTypes = summons.map((summon, mageIndex) => {
      if (summon.kind !== 'summon' || summon.simClockMs !== 0) throw new Error('Mage screen fresh registration mismatch');
      const types = [...new Set(battle.events.filter(event => event.kind === 'damage' && event.source === summon.unit.id)
        .map(event => event.kind === 'damage' ? event.damageType : ''))].sort();
      const expected = mode === 'physical' ? 'physical' : ['fire', 'cold', 'lightning', 'poison'][mageIndex];
      if (types.length !== 1 || types[0] !== expected) throw new Error(`Mage damage type mismatch: ${summon.unit.id}`);
      return types;
    });
    const firstActions = summons.map(summon => {
      if (summon.kind !== 'summon') throw new Error('Mage screen summon narrowing');
      const action = battle.events.find(event => event.kind === 'action' && event.actor === summon.unit.id);
      return { id: summon.unit.id, atMs: action?.simClockMs ?? null };
    });
    return { seed, inputHash: mageJsonHash(input), recorded: battle, metrics: measureMageBattle(input, battle),
      mageDamageTypes, firstActions, preparation: { startupPayment: hero.mana - payment.mana,
        mages: summons.map(event => event.kind === 'summon' ? event.unit : null),
        events: battle.events.filter(event => event.simClockMs === 0) } };
  });
  if (JSON.stringify(fixture) !== before) throw new Error('Mage screen fixture mutated');
  return { mode, provenance, fixtureHash: fixture.hash, runs,
    checks: { plainRecorded: true, repeatAA: true, returnABA: true, inputPreserved: true } };
}

/** Compare only paired runs sharing fixture, driver, data and tool identities. */
export function compareMageScreens(baseline: ReturnType<typeof runMageScreen>, candidate: ReturnType<typeof runMageScreen>) {
  const same = (left: unknown, right: unknown) => {
    if (mageJsonHash(left) !== mageJsonHash(right)) throw new Error('Mismatched Mage screen pair');
  };
  if (baseline.mode !== 'physical' || candidate.mode !== 'elemental') throw new Error('Mismatched Mage screen modes');
  same(baseline.fixtureHash, candidate.fixtureHash);
  for (const key of ['dataHash', 'driverHash', 'toolHash', 'fixtureBytesHash'] as const) same(baseline.provenance[key], candidate.provenance[key]);
  same(baseline.runs.length, 2); same(candidate.runs.length, 2);
  return baseline.runs.map((before, index) => {
    const after = candidate.runs[index];
    if (!after) throw new Error('Mismatched Mage screen run');
    same(before.seed, after.seed); same(before.inputHash, after.inputHash); same(before.preparation, after.preparation);
    // First actions are compared only where both units lived long enough to act.
    before.firstActions.forEach((action, mageIndex) => {
      const other = after.firstActions[mageIndex];
      if (!other) throw new Error('Mismatched Mage screen first action');
      same(action.id, other.id);
      if (action.atMs !== null && other.atMs !== null) same(action.atMs, other.atMs);
    });
    return { seed: before.seed, before: before.metrics, after: after.metrics };
  });
}
