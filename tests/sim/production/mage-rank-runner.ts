import { runBattle, runBattleRecorded, type RecordedBattleResult } from '@/engine/combat/combat';
import { mageJsonHash } from './mage-balance-fixture';
import { measureMageBattle } from './mage-balance-runner';
import { parseMageRankRecipe, type MageRankFixture } from './mage-rank-fixture';

export type MageRankMode = 'physical' | 'elemental';
export interface MageRankSummary {
  readonly metrics: ReturnType<typeof measureMageBattle>;
  readonly mages: readonly { readonly id: string; readonly firstActionMs: number | null; readonly attacks: number }[];
  readonly nonActingMages: number;
}

function checkedInput(fixture: MageRankFixture, seed: number) {
  parseMageRankRecipe(fixture.recipe);
  if (!Number.isInteger(seed) || seed < 0 || seed >= fixture.recipe.seedCount) throw new Error('Invalid Mage rank seed');
  if (fixture.hash !== mageJsonHash({ recipe: fixture.recipe, snapshot: fixture.snapshot, allocation: fixture.allocation })) {
    throw new Error('Mage rank fixture hash');
  }
  return structuredClone({ ...fixture.snapshot, seed });
}

/** Check fresh registrations and every observed direct bolt, allowing combat to end before a Mage acts. */
export function inspectMageRankBattle(fixture: MageRankFixture, recorded: RecordedBattleResult, mode: MageRankMode, seed: number) {
  const input = checkedInput(fixture, seed), hero = input.playerTeam[0];
  if (!hero || hero.kind !== 'hero') throw new Error('Missing Mage rank hero');
  const registrations = recorded.events.filter(event => event.kind === 'summon');
  const mages = registrations.flatMap(event => event.kind === 'summon' ? [event.unit] : []);
  const payments = recorded.events.filter(event => event.kind === 'mana' && event.target === hero.id && event.reason === 'cast');
  const payment = payments[0];
  const rank = fixture.recipe.mageRank, cap = rank <= 3 ? rank : 3 + Math.floor((rank - 3) / 3);
  if (mages.length !== cap || new Set(mages.map(unit => unit.id)).size !== cap || payments.length !== 1 ||
    payment?.kind !== 'mana' || payment.simClockMs !== 0 || hero.mana - payment.mana !== 22 ||
    registrations.some(event => event.kind !== 'summon' || event.simClockMs !== 0 || event.owner !== hero.id ||
      event.unit.summonTemplateId !== 'skeletal_mage' || event.unit.summonOwnerId !== hero.id || event.unit.side !== 'player')) {
    throw new Error('Mage rank preparation');
  }
  const observations = mages.map((mage, index) => {
    const attacks = recorded.events.filter(event => event.kind === 'damage' && event.source === mage.id);
    const expected = mode === 'physical' ? 'physical' : ['fire', 'cold', 'lightning', 'poison'][index % 4];
    if (attacks.some(event => event.kind !== 'damage' || event.damageType !== expected)) throw new Error('Mage rank bolt type');
    const action = recorded.events.find(event => event.kind === 'action' && event.actor === mage.id);
    return { id: mage.id, firstActionMs: action?.simClockMs ?? null, attacks: attacks.length };
  });
  return { seed, inputHash: mageJsonHash(input), recorded,
    preparation: { startupPayment: hero.mana - payment.mana, mages,
      events: recorded.events.filter(event => event.simClockMs === 0) },
    summary: { metrics: measureMageBattle(input, recorded), mages: observations,
      nonActingMages: observations.filter(mage => mage.firstActionMs === null).length } satisfies MageRankSummary };
}

/** One measured recording at a time; callers must stream retained evidence before requesting another. */
export function recordMageRankSeed(fixture: MageRankFixture, mode: MageRankMode, seed: number) {
  const input = checkedInput(fixture, seed), before = JSON.stringify(input);
  const recorded = runBattleRecorded(input);
  if (JSON.stringify(input) !== before) throw new Error('Mage rank input mutated');
  return inspectMageRankBattle(fixture, recorded, mode, seed);
}

/** Bounded A/A/A-B-A per cell and optional plain/recorded parity, without resetting module registries. */
export function verifyMageRankDeterminism(fixture: MageRankFixture, mode: MageRankMode, parity: boolean) {
  const before = JSON.stringify(fixture);
  const first = recordMageRankSeed(fixture, mode, 0);
  const same = (left: unknown, right: unknown) => {
    if (mageJsonHash(left) !== mageJsonHash(right)) throw new Error('Mage rank determinism mismatch');
  };
  same(first, recordMageRankSeed(fixture, mode, 0));
  recordMageRankSeed(fixture, mode, 1);
  same(first, recordMageRankSeed(fixture, mode, 0));
  if (parity) for (const seed of [0, 999]) {
    const recorded = seed === 0 ? first : recordMageRankSeed(fixture, mode, seed);
    const input = checkedInput(fixture, seed), bytes = JSON.stringify(input);
    same(recorded.recorded.result, runBattle(input));
    if (JSON.stringify(input) !== bytes) throw new Error('Mage rank plain input mutated');
  }
  if (JSON.stringify(fixture) !== before) throw new Error('Mage rank fixture mutated');
  return { repeatAA: true, returnABA: true, plainRecorded: parity, inputPreserved: true };
}

/** Pair only identical inputs/preparation and surviving initial cadence; mode/provenance is checked by the file driver. */
export function compareMageRankRuns(before: ReturnType<typeof recordMageRankSeed>, after: ReturnType<typeof recordMageRankSeed>) {
  const same = (left: unknown, right: unknown) => {
    if (mageJsonHash(left) !== mageJsonHash(right)) throw new Error('Mismatched Mage rank pair');
  };
  same(before.seed, after.seed); same(before.inputHash, after.inputHash); same(before.preparation, after.preparation);
  same(before.summary.mages.length, after.summary.mages.length);
  before.summary.mages.forEach((mage, index) => {
    const other = after.summary.mages[index];
    if (!other) throw new Error('Mismatched Mage rank pair');
    same(mage.id, other.id);
    if (mage.firstActionMs !== null && other.firstActionMs !== null) same(mage.firstActionMs, other.firstActionMs);
  });
  return { seed: before.seed, before: before.summary, after: after.summary };
}

/** Nearest-rank successful-TTK quantiles retain their denominator; draws/defeats are censored. */
export function summarizeMageRankRuns(rows: readonly MageRankSummary[]) {
  const times = rows.flatMap(row => row.metrics.successfulTtkMs === null ? [] : [row.metrics.successfulTtkMs]).sort((a, b) => a - b);
  const quantile = (fraction: number) => times.length === 0 ? null : times[Math.ceil(times.length * fraction) - 1] ?? null;
  const outcomes = { victory: 0, defeat: 0, draw: 0 };
  rows.forEach(row => { if (row.metrics.outcome === 'victory') outcomes.victory++; else if (row.metrics.outcome === 'defeat') outcomes.defeat++; else outcomes.draw++; });
  return { count: rows.length, outcomes, heroDeaths: rows.filter(row => row.metrics.heroDied).length,
    successfulTtkMs: { count: times.length, p50: quantile(0.5), p95: quantile(0.95) },
    nonActingMages: rows.reduce((total, row) => total + row.nonActingMages, 0),
    registeredMages: rows.reduce((total, row) => total + row.mages.length, 0) };
}
