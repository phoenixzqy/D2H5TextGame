import { runBattle, runBattleRecorded, type RecordedBattleResult } from '@/engine/combat/combat';
import { mageJsonHash } from './mage-balance-fixture';
import { measureMageBattle } from './mage-balance-runner';
import { assertMageMasteryFixture, type MageMasteryFixture } from './mage-mastery-fixture';

export type MageMasteryMode = 'physical' | 'elemental';
export interface MageMasterySummary {
  readonly metrics: ReturnType<typeof measureMageBattle>;
  readonly mages: readonly { readonly id: string; readonly firstActionMs: number | null; readonly attacks: number;
    readonly deathEvents: number; readonly finalLife: number | null }[];
  readonly nonActingMages: number;
  /** Includes owner-orphan transactions; the event has no direct-kill cause. */
  readonly mageDeathEvents: number;
  readonly absentWithoutDeath: number;
  /** Raw status/stunned events expose target/time, not source attribution. */
  readonly controls: readonly { readonly kind: 'status' | 'stunned'; readonly target: string;
    readonly statusId: string | null; readonly atMs: number }[];
}

function checkedInput(fixture: MageMasteryFixture, seed: number) {
  if (!Number.isInteger(seed) || seed < 0 || seed >= 1000) throw new Error('Invalid Mage Mastery seed');
  assertMageMasteryFixture(fixture);
  return structuredClone({ ...fixture.snapshot, seed });
}

/** Inspect all fresh stats/types and actual controls without requiring identical controlled cadence. */
export function inspectMageMasteryBattle(fixture: MageMasteryFixture, recorded: RecordedBattleResult, mode: MageMasteryMode, seed: number) {
  const input = checkedInput(fixture, seed), hero = input.playerTeam[0]!;
  const registrations = recorded.events.filter(event => event.kind === 'summon');
  const mages = registrations.flatMap(event => event.kind === 'summon' ? [event.unit] : []);
  const payments = recorded.events.filter(event => event.kind === 'mana' && event.target === hero.id && event.reason === 'cast');
  const payment = payments[0], rank = fixture.recipe.masteryRank;
  if (mages.length !== 4 || new Set(mages.map(unit => unit.id)).size !== 4 || payments.length !== 1 ||
    payment?.kind !== 'mana' || payment.simClockMs !== 0 || hero.mana - payment.mana !== 22 ||
    registrations.some(event => event.kind !== 'summon' || event.simClockMs !== 0 || event.owner !== hero.id ||
      event.unit.summonTemplateId !== 'skeletal_mage' || event.unit.summonOwnerId !== hero.id || event.unit.side !== 'player')) {
    throw new Error('Mage Mastery preparation');
  }
  const observations = mages.map((mage, index) => {
    if (mage.life !== 123 * (1 + rank * 0.04) || mage.stats.lifeMax !== mage.life ||
      mage.stats.attack !== 45 * (1 + rank * 0.02) || mage.stats.defense !== 10 * (1 + rank * 0.01) ||
      mage.stats.attackSpeed !== 70 || mage.stats.magicDodge !== 0.09) throw new Error('Mage Mastery registration stats');
    const attacks = recorded.events.filter(event => event.kind === 'damage' && event.source === mage.id);
    const expected = mode === 'physical' ? 'physical' : ['fire', 'cold', 'lightning', 'poison'][index];
    if (attacks.some(event => event.kind !== 'damage' || event.damageType !== expected)) throw new Error('Mage Mastery bolt type');
    const action = recorded.events.find(event => event.kind === 'action' && event.actor === mage.id);
    if (action && action.simClockMs < 1940) throw new Error('Mage Mastery early action');
    return { id: mage.id, firstActionMs: action?.simClockMs ?? null, attacks: attacks.length,
      deathEvents: recorded.events.filter(event => event.kind === 'death' && event.target === mage.id).length,
      finalLife: recorded.result.playerTeam.find(unit => unit.id === mage.id)?.life ?? null };
  });
  const controls = recorded.events.flatMap(event => event.kind === 'status' || event.kind === 'stunned' ?
    [{ kind: event.kind, target: event.target, statusId: event.kind === 'status' ? event.statusId : null, atMs: event.simClockMs }] : []);
  return { seed, masteryRank: rank, inputHash: mageJsonHash(input), recorded,
    preparation: { startupPayment: hero.mana - payment.mana, mages, events: recorded.events.filter(event => event.simClockMs === 0) },
    summary: { metrics: measureMageBattle(input, recorded), mages: observations,
      nonActingMages: observations.filter(mage => mage.firstActionMs === null).length,
      mageDeathEvents: observations.reduce((total, mage) => total + mage.deathEvents, 0),
      absentWithoutDeath: observations.filter(mage => mage.finalLife === null && mage.deathEvents === 0).length,
      controls } satisfies MageMasterySummary };
}

/** One measured recording at a time; external callers stream it before requesting the next seed. */
export function recordMageMasterySeed(fixture: MageMasteryFixture, mode: MageMasteryMode, seed: number) {
  const input = checkedInput(fixture, seed), before = JSON.stringify(input);
  const recorded = runBattleRecorded(input);
  if (JSON.stringify(input) !== before) throw new Error('Mage Mastery input mutated');
  return inspectMageMasteryBattle(fixture, recorded, mode, seed);
}

/** Bounded A/A, A/B/A and plain/recorded parity with no mutable-registry reset. */
export function verifyMageMasteryDeterminism(fixture: MageMasteryFixture, mode: MageMasteryMode) {
  const before = JSON.stringify(fixture), first = recordMageMasterySeed(fixture, mode, 0);
  const same = (left: unknown, right: unknown) => {
    if (mageJsonHash(left) !== mageJsonHash(right)) throw new Error('Mage Mastery determinism mismatch');
  };
  same(first, recordMageMasterySeed(fixture, mode, 0));
  recordMageMasterySeed(fixture, mode, 1);
  same(first, recordMageMasterySeed(fixture, mode, 0));
  for (const seed of [0, 999]) {
    const recorded = seed === 0 ? first : recordMageMasterySeed(fixture, mode, seed);
    const input = checkedInput(fixture, seed), bytes = JSON.stringify(input);
    same(recorded.recorded.result, runBattle(input));
    if (JSON.stringify(input) !== bytes) throw new Error('Mage Mastery plain input mutated');
  }
  if (JSON.stringify(fixture) !== before) throw new Error('Mage Mastery fixture mutated');
  return { repeatAA: true, returnABA: true, plainRecorded: true, inputPreserved: true };
}

/** Inputs and preparation must pair; control-dependent action times may diverge after combat starts. */
export function compareMageMasteryRuns(before: ReturnType<typeof recordMageMasterySeed>, after: ReturnType<typeof recordMageMasterySeed>) {
  const same = (left: unknown, right: unknown) => {
    if (mageJsonHash(left) !== mageJsonHash(right)) throw new Error('Mismatched Mage Mastery pair');
  };
  same(before.seed, after.seed); same(before.masteryRank, after.masteryRank);
  same(before.inputHash, after.inputHash); same(before.preparation, after.preparation);
  same(before.summary.mages.map(mage => mage.id), after.summary.mages.map(mage => mage.id));
  return { seed: before.seed, before: before.summary, after: after.summary };
}

/** Nearest-rank successful TTK censors defeats/draws; event counts do not infer direct kill causes. */
export function summarizeMageMasteryRuns(rows: readonly MageMasterySummary[]) {
  const times = rows.flatMap(row => row.metrics.successfulTtkMs === null ? [] : [row.metrics.successfulTtkMs]).sort((a, b) => a - b);
  const quantile = (fraction: number) => times.length === 0 ? null : times[Math.ceil(times.length * fraction) - 1] ?? null;
  const outcomes = { victory: 0, defeat: 0, draw: 0 };
  rows.forEach(row => { if (row.metrics.outcome === 'victory') outcomes.victory++; else if (row.metrics.outcome === 'defeat') outcomes.defeat++; else outcomes.draw++; });
  return { count: rows.length, outcomes, heroDeaths: rows.filter(row => row.metrics.heroDied).length,
    successfulTtkMs: { count: times.length, p50: quantile(0.5), p95: quantile(0.95) },
    nonActingMages: rows.reduce((total, row) => total + row.nonActingMages, 0),
    registeredMages: rows.reduce((total, row) => total + row.mages.length, 0),
    mageDeathEvents: rows.reduce((total, row) => total + row.mageDeathEvents, 0),
    absentWithoutDeath: rows.reduce((total, row) => total + row.absentWithoutDeath, 0),
    statusEvents: rows.reduce((total, row) => total + row.controls.filter(event => event.kind === 'status').length, 0),
    stunnedEvents: rows.reduce((total, row) => total + row.controls.filter(event => event.kind === 'stunned').length, 0) };
}
