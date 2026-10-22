import { runBattle, runBattleRecorded, type RecordedBattleEvent, type RecordedBattleResult } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { applyOrbs } from '@/engine/combat/orbs';
import { mageJsonHash } from './mage-balance-fixture';
import { measureMageBattle } from './mage-balance-runner';
import { assertMageMixedFixture, type MageMixedFixture } from './mage-mixed-fixture';

export type MageMixedMode = 'physical' | 'elemental';
const fields = ['attempts', 'crits', 'critDenominator', 'dodges', 'dodgeDenominator', 'loggedDamage', 'effectiveHpRemoved'] as const;
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Mage mixed missing unit');
  return value;
}
function same(left: unknown, right: unknown, label: string): void {
  if (mageJsonHash(left) !== mageJsonHash(right)) throw new Error(`Mage mixed ${label}`);
}
function assertMode(mode: unknown): asserts mode is MageMixedMode {
  if (mode !== 'physical' && mode !== 'elemental') throw new Error('Mage mixed mode');
}
function checkedInput(fixture: MageMixedFixture, mode: MageMixedMode, seed: number) {
  assertMode(mode);
  if (!Number.isInteger(seed) || seed < 0 || seed >= 1000) throw new Error('Mage mixed seed');
  assertMageMixedFixture(fixture);
  return structuredClone({ ...fixture.snapshot, seed });
}
function counter() {
  return { attempts: 0, landed: 0, crits: 0, critDenominator: 0, dodges: 0, dodgeDenominator: 0,
    loggedDamage: 0, effectiveHpRemoved: 0 };
}
type Counter = ReturnType<typeof counter>;
function count(row: Counter, event: Extract<RecordedBattleEvent, { kind: 'damage' }>, effective: number) {
  row.attempts++; row.dodgeDenominator++;
  if (event.dodged) row.dodges++;
  else {
    row.landed++; row.critDenominator++; if (event.crit) row.crits++;
    row.loggedDamage += event.amount; row.effectiveHpRemoved += effective;
  }
}

/** Independent complete registration literals, rather than calling the summon factory under test. */
function expectedSummons(fixture: MageMixedFixture): CombatUnit[] {
  const hero = required(fixture.snapshot.playerTeam[0]);
  const positions = [{ row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 2 },
    { row: 2, col: 1 }, { row: 0, col: 0 }, { row: 0, col: 2 }];
  return positions.map((gridPosition, index) => {
    const skeleton = index < 2, template = skeleton ? 'skeleton' : 'skeletal_mage';
    const life = (skeleton ? 162 : 123) * (1 + .04);
    return { id: `${hero.id}-summon-${template}-${String(index + 1)}`, name: skeleton ? 'Skeleton Warrior' : 'Skeletal Mage',
      side: 'player', level: 26, tier: 'trash', kind: 'summon', summon: true, summonOwnerId: hero.id,
      summonTemplateId: template, life, mana: 0, statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [],
      enraged: false, summonedAdds: false, gridPosition,
      stats: { life, lifeMax: life, mana: 0, manaMax: 0, attack: (skeleton ? 35 : 45) * (1 + .02),
        defense: (skeleton ? 19 : 10) * (1 + .01), magicResist: 0, attackSpeed: 70, critChance: .05,
        critDamage: 1.5, physDodge: .05, magicDodge: skeleton ? .05 : .09, magicFind: 0, goldFind: 0,
        resistances: { physical: 0, fire: skeleton ? 0 : 10, cold: skeleton ? 0 : 10,
          lightning: skeleton ? 0 : 10, poison: skeleton ? 0 : 10, arcane: 0 } } };
  });
}

function preparation(fixture: MageMixedFixture, events: readonly RecordedBattleEvent[]) {
  const hero = required(fixture.snapshot.playerTeam[0]), expected = expectedSummons(fixture);
  const registrations = events.filter(event => event.kind === 'summon');
  const payments = events.filter(event => event.kind === 'mana' && (event.reason === 'cast' || event.reason === 'summon-refund'));
  same(registrations.map(event => [event.owner, event.summonId, event.unit, event.simClockMs]),
    expected.map(unit => [hero.id, unit.summonTemplateId, unit, 0]), 'registrations');
  same(payments.map(event => event.kind === 'mana' ? [event.target, event.reason, event.mana, event.simClockMs] : null),
    [[hero.id, 'cast', 172, 0], [hero.id, 'cast', 150, 0]], 'payments');
  const transactions = events.filter(event => event.kind === 'summon' || (event.kind === 'mana' && event.reason === 'cast'));
  same(transactions.map(event => event.kind === 'mana' ? event.mana : event.kind === 'summon' ? event.unit.id : null),
    [172, ...expected.slice(0, 2).map(unit => unit.id), 150, ...expected.slice(2).map(unit => unit.id)], 'batch order');
  return { paymentMana: [172, 150], summons: expected, events: events.filter(event => event.simClockMs === 0) };
}

/** Replay all sources on shared HP; retain zero rows and un-attributed native controls. */
export function inspectMageMixedBattle(fixture: MageMixedFixture, recorded: RecordedBattleResult, mode: MageMixedMode, seed: number) {
  const input = checkedInput(fixture, mode, seed), hero = required(input.playerTeam[0]);
  const plainEvents = (events: RecordedBattleResult['result']['events']) => events.map(event => {
    const { simClockMs: _clock, uiDelayMs: _delay, ...plain } = event as RecordedBattleEvent;
    return plain;
  });
  same(plainEvents(recorded.events), plainEvents(recorded.result.events), 'event copies');
  const prepared = preparation(fixture, recorded.events);
  const metrics = measureMageBattle(input, recorded);
  const units = prepared.summons.map((unit, index) => ({ id: unit.id, family: index < 2 ? 'skeleton' : 'mage',
    type: index < 2 || mode === 'physical' ? 'physical' : required(['fire', 'cold', 'lightning', 'poison'][index - 2]),
    damage: counter(), firstActionMs: null as number | null, attacks: 0, deathEvents: 0,
    finalLife: recorded.result.playerTeam.find(final => final.id === unit.id)?.life ?? null }));
  const strata = units.flatMap(unit => (['flayer', 'horror-mage'] as const).map(species => ({
    id: unit.id, family: unit.family, type: unit.type, species, ...counter(),
    noncritValues: {} as Record<string, number>, critValues: {} as Record<string, number> })));
  const state = new Map([...input.playerTeam, ...input.enemyTeam].map(unit => [unit.id, unit]));
  const species = new Map(input.enemyTeam.map(unit => [unit.id, unit.id.includes('undead-flayer') ? 'flayer' : 'horror-mage']));
  const controls: { kind: 'status' | 'stunned'; target: string; statusId: string | null; atMs: number }[] = [];
  for (const event of recorded.events) {
    if (event.kind === 'summon') state.set(event.unit.id, event.unit);
    else if (event.kind === 'action') {
      required(state.get(event.actor));
      const unit = units.find(row => row.id === event.actor);
      if (unit && unit.firstActionMs === null) {
        if (event.simClockMs < 1940) throw new Error('Mage mixed early action');
        unit.firstActionMs = event.simClockMs;
      }
    } else if (event.kind === 'damage') {
      const source = required(state.get(event.source)), target = required(state.get(event.target));
      if (source.side === target.side || (event.dodged && (event.amount !== 0 || event.crit))) throw new Error('Mage mixed damage shape');
      const effective = event.dodged ? 0 : Math.min(Math.max(0, target.life), event.amount);
      state.set(target.id, { ...target, life: Math.max(0, target.life - effective) });
      const unit = units.find(row => row.id === source.id);
      if (!unit) continue;
      if (event.damageType !== unit.type) throw new Error('Mage mixed bolt type');
      const row = required(strata.find(row => row.id === source.id && row.species === species.get(target.id)));
      count(row, event, effective); count(unit.damage, event, effective); unit.attacks++;
      if (!event.dodged) {
        const values = event.crit ? row.critValues : row.noncritValues;
        values[String(event.amount)] = (values[String(event.amount)] ?? 0) + 1;
      }
    } else if (event.kind === 'heal' || event.kind === 'orb' || event.kind === 'death') {
      const target = required(state.get(event.target));
      if (event.kind === 'heal' && (!Number.isFinite(event.amount) || event.amount < 0)) throw new Error('Mage mixed heal');
      if (event.kind === 'orb' && (!Number.isFinite(event.orb.restorePct) || event.orb.restorePct < 0)) throw new Error('Mage mixed orb');
      state.set(target.id, event.kind === 'orb' ? applyOrbs(target, [event.orb]) : { ...target,
        life: event.kind === 'death' ? 0 : Math.min(target.stats.lifeMax, target.life + event.amount) });
      const unit = units.find(row => row.id === target.id);
      if (event.kind === 'death' && unit) unit.deathEvents++;
    } else if (event.kind === 'status' || event.kind === 'stunned') {
      const target = required(state.get(event.target));
      if (target.side === 'enemy') throw new Error('Mage mixed unsupported enemy condition');
      controls.push({ kind: event.kind, target: event.target, statusId: event.kind === 'status' ? event.statusId : null, atMs: event.simClockMs });
    } else if (event.kind === 'mana') {
      const target = required(state.get(event.target));
      if (!Number.isFinite(event.mana) || event.mana < 0 || event.mana > target.stats.manaMax) throw new Error('Mage mixed MP');
      state.set(target.id, { ...target, mana: event.mana });
    }
  }
  const finalUnits = [...recorded.result.playerTeam, ...recorded.result.enemyTeam];
  if (new Set(finalUnits.map(unit => unit.id)).size !== finalUnits.length) throw new Error('Mage mixed duplicate final unit');
  for (const unit of finalUnits) {
    const replayed = required(state.get(unit.id));
    if (unit.life !== replayed.life || unit.mana !== replayed.mana) throw new Error('Mage mixed final HP/MP');
  }
  for (const unit of [...input.playerTeam, ...input.enemyTeam]) {
    if (!finalUnits.some(final => final.id === unit.id)) throw new Error('Mage mixed missing initial unit');
  }
  const skeletons = counter();
  for (const unit of units.filter(row => row.family === 'skeleton')) {
    for (const field of [...fields, 'landed'] as const) skeletons[field] += unit.damage[field];
  }
  for (const field of fields) {
    if (metrics.player[field] !== metrics.hero[field] + skeletons[field] + metrics.mages[field]) throw new Error('Mage mixed player reconciliation');
    if (units.filter(row => row.family === 'mage').reduce((sum, row) => sum + row.damage[field], 0) !== metrics.mages[field]) throw new Error('Mage mixed family reconciliation');
    if (strata.reduce((sum, row) => sum + row[field], 0) !== skeletons[field] + metrics.mages[field]) throw new Error('Mage mixed strata reconciliation');
  }
  for (const unit of units) if (unit.finalLife === null && unit.deathEvents === 0) throw new Error('Mage mixed unexplained absence');
  const duration = metrics.durationMs;
  return { seed, mode, fixtureHash: fixture.hash, source: fixture.source, overrides: fixture.overrides,
    inputHash: mageJsonHash(input), recorded, preparation: prepared,
    summary: { metrics: { ...metrics, skeletons: { ...skeletons,
      loggedDps: duration > 0 ? skeletons.loggedDamage * 1000 / duration : null,
      effectiveDps: duration > 0 ? skeletons.effectiveHpRemoved * 1000 / duration : null } }, units, strata,
    nonActingSummons: units.filter(unit => unit.firstActionMs === null).length,
    summonDeathEvents: units.reduce((sum, unit) => sum + unit.deathEvents, 0),
    absentWithoutDeath: units.filter(unit => unit.finalLife === null && unit.deathEvents === 0).length, controls,
    heroId: hero.id } };
}

/** Execute once in the importing immutable engine domain; callers stream before the next seed. */
export function recordMageMixedSeed(fixture: MageMixedFixture, mode: MageMixedMode, seed: number) {
  const input = checkedInput(fixture, mode, seed), bytes = JSON.stringify(input);
  const recorded = runBattleRecorded(input);
  if (JSON.stringify(input) !== bytes) throw new Error('Mage mixed input mutation');
  return inspectMageMixedBattle(fixture, recorded, mode, seed);
}

/** Bounded independent determinism/parity checks, without mutable registry resets. */
export function verifyMageMixedDeterminism(fixture: MageMixedFixture, mode: MageMixedMode) {
  const bytes = JSON.stringify(fixture), a = recordMageMixedSeed(fixture, mode, 0);
  same(a, recordMageMixedSeed(fixture, mode, 0), 'A/A');
  recordMageMixedSeed(fixture, mode, 1);
  same(a, recordMageMixedSeed(fixture, mode, 0), 'A/B/A');
  for (const seed of [0, 999]) {
    const input = checkedInput(fixture, mode, seed), before = JSON.stringify(input), plain = runBattle(input);
    same(plain, recordMageMixedSeed(fixture, mode, seed).recorded.result, 'plain/recorded');
    if (JSON.stringify(input) !== before) throw new Error('Mage mixed plain mutation');
  }
  if (JSON.stringify(fixture) !== bytes) throw new Error('Mage mixed fixture mutation');
  return { repeatAA: true, returnABA: true, plainRecorded: true, inputPreserved: true };
}

/** Both pair sides must independently match the expected fixture, seed and literal preparation. */
export function compareMageMixedRuns(before: ReturnType<typeof recordMageMixedSeed>, after: ReturnType<typeof recordMageMixedSeed>, fixture: MageMixedFixture) {
  for (const [run, mode] of [[before, 'physical'], [after, 'elemental']] as const) {
    const input = checkedInput(fixture, mode, run.seed);
    same({ mode: run.mode, fixtureHash: run.fixtureHash, source: run.source, overrides: run.overrides, inputHash: run.inputHash },
      { mode, fixtureHash: fixture.hash, source: fixture.source, overrides: fixture.overrides, inputHash: mageJsonHash(input) }, 'pair identity');
    const expected = preparation(fixture, run.preparation.events);
    same(run.preparation, expected, 'pair preparation');
  }
  same(before.seed, after.seed, 'pair seed'); same(before.preparation, after.preparation, 'pair preparation equality');
  return { fixtureHash: fixture.hash, source: fixture.source, overrides: fixture.overrides,
    seed: before.seed, before: before.summary, after: after.summary };
}

/** Successful-only nearest-rank TTK; losses and draws never become clear-speed observations. */
export function summarizeMageMixedRuns(rows: readonly ReturnType<typeof inspectMageMixedBattle>['summary'][]) {
  const times = rows.flatMap(row => row.metrics.outcome === 'victory' && row.metrics.successfulTtkMs !== null ? [row.metrics.successfulTtkMs] : []).sort((a, b) => a - b);
  const percentile = (fraction: number) => times.length === 0 ? null : times[Math.ceil(times.length * fraction) - 1] ?? null;
  return { count: rows.length,
    outcomes: { victory: rows.filter(row => row.metrics.outcome === 'victory').length,
      defeat: rows.filter(row => row.metrics.outcome === 'defeat').length, draw: rows.filter(row => row.metrics.outcome === 'draw').length },
    heroDeaths: rows.filter(row => row.metrics.heroDied).length,
    successfulTtkMs: { count: times.length, p50: percentile(.5), p95: percentile(.95) },
    registeredSummons: rows.reduce((sum, row) => sum + row.units.length, 0),
    nonActingSummons: rows.reduce((sum, row) => sum + row.nonActingSummons, 0),
    summonDeathEvents: rows.reduce((sum, row) => sum + row.summonDeathEvents, 0),
    absentWithoutDeath: rows.reduce((sum, row) => sum + row.absentWithoutDeath, 0),
    statusEvents: rows.reduce((sum, row) => sum + row.controls.filter(event => event.kind === 'status').length, 0),
    stunnedEvents: rows.reduce((sum, row) => sum + row.controls.filter(event => event.kind === 'stunned').length, 0) };
}
