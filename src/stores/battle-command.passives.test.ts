import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { actionPeriodMs, MAX_SIM_MS, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { exportManaRecoveryCarry, integrateManaRecoveryBetween } from '@/engine/combat/mana-recovery';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import type { Player } from '@/engine/types/entities';
import { composeStatAura } from '@/engine/skills/stat-auras';
import { playerToCombatUnit } from './combatHelpers';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from './combatPlayback';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
import { stageRecordedBattle } from './recordedBattlePublication';

const command = 'barbarian.battle_command';
const passives = ['shout', 'battle_orders', 'increased_stamina', 'increased_speed',
  'natural_resistance', 'iron_skin', 'sword_mastery'] as const;

function player(rank = 1): Player {
  const fresh = createMockPlayer('Synthetic Command passives', 'barbarian');
  return { ...fresh, id: 'hero', level: 30,
    coreStats: { ...fresh.coreStats, energy: 0.1 },
    derivedStats: { ...fresh.derivedStats, life: 31, mana: 11 },
    skillLevels: { 'barbarian.howl': 1, [command]: 1,
      ...Object.fromEntries(passives.map(id => ['barbarian.' + id, rank])) },
    comboOrder: [command] };
}
function fixture(owner = player()): CombatSnapshot {
  const hero = { ...playerToCombatUnit(owner), basicAttack: { damage: [0, 0] as const, damageType: 'physical' as const } };
  const enemy: CombatUnit = { ...hero, id: 'dummy', side: 'enemy', kind: 'monster',
    life: 1000000, skillOrder: [], skillLevels: {},
    stats: { ...hero.stats, lifeMax: 1000000 },
    statuses: [{ id: 'stun', sourceId: 'synthetic-hold', stacks: 1, remaining: -1 }] };
  return { seed: 7, playerTeam: [hero], enemyTeam: [enemy] };
}
function replay(input: CombatSnapshot, out: ReturnType<typeof runBattleRecorded>, clock: number): CombatUnit {
  const statusPlayback = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(statusPlayback ? { statusPlayback } : {}) };
  for (const event of out.events) {
    if (event.simClockMs > clock) break;
    teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event, teams.statusPlayback);
  }
  const hero = teams.playerTeam.find(unit => unit.id === 'hero');
  if (!hero) throw new Error('Missing replay hero');
  return hero;
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  const cast = out.events.find(event => event.kind === 'action' && event.skillId === command);
  if (!cast) throw new Error('Missing actual paid Command');
  const expiry = cast.simClockMs + 8000;
  return { out, at: cast.simClockMs, expiry };
}
function reset() {
  useInventoryStore.getState().reset(); useMapStore.getState().reset(); useFormationStore.getState().reset();
}
beforeEach(() => {
  reset(); resetRegistry(); loadDefaultSkills();
  useInventoryStore.setState({ equipped: { weapon: { id: 'synthetic-command-sword',
    baseId: 'items/base/wp1h-short-sword', rarity: 'normal', level: 1,
    identified: true, equipped: true, affixes: [] } } });
});
afterEach(reset);

it('recomposes every learned native passive at actual payment and exact expiry without healing', () => {
  const owner = player(), input = fixture(owner), { out, at, expiry } = record(input);
  const baseline = playerToCombatUnit(owner), boosted = playerToCombatUnit({ ...owner,
    skillLevels: { ...owner.skillLevels, ...Object.fromEntries(passives.map(id => ['barbarian.' + id, 2])) } });
  const active = replay(input, out, at), expired = replay(input, out, expiry);
  expect(active.stats).toEqual(boosted.stats);
  expect(active.increasedDamagePct).toEqual(boosted.increasedDamagePct);
  expect(active.manaRegenPerSecond).toBe(boosted.manaRegenPerSecond);
  expect(active.manaRegenBaselinePerSecond).toBe(boosted.manaRegenBaselinePerSecond);
  expect(active.life).toBe(31);
  expect(active.mana).toBe(0);
  expect(expired.stats).toEqual(baseline.stats);
  expect(expired.increasedDamagePct).toEqual(baseline.increasedDamagePct);
  expect(expired.manaRegenPerSecond).toBe(baseline.manaRegenPerSecond);
  expect(replay(input, out, 0).stats).toEqual(baseline.stats);
  expect(expired.life).toBe(31);
  expect(out.result.playerTeam[0]?.skillLevels).toEqual(input.playerTeam[0]?.skillLevels);
  const final = replay(input, out, Infinity), result = out.result.playerTeam[0];
  expect({ stats: final.stats, life: final.life, mana: final.mana,
    damage: final.increasedDamagePct, recovery: final.manaRegenPerSecond })
    .toEqual({ stats: result?.stats, life: result?.life, mana: result?.mana,
      damage: result?.increasedDamagePct, recovery: result?.manaRegenPerSecond });
});

it('preserves allocated20 while native passive potency reaches21', () => {
  const owner = player(20), baseline = playerToCombatUnit(owner), input = fixture(owner);
  const { out, at } = record(input), active = replay(input, out, at);
  const plain = playerToCombatUnit({ ...owner, skillLevels: {} });
  expect(active.stats.lifeMax).toBeCloseTo(plain.stats.lifeMax * (1 + 21 * .03 + 21 * .04), 12);
  expect(active.stats.defense).toBeCloseTo(plain.stats.defense * (1 + 21 * .04 + 21 * .03), 12);
  expect(active.stats.attackSpeed).toBeCloseTo(plain.stats.attackSpeed * 1.21, 12);
  expect(active.stats.critChance).toBeCloseTo(plain.stats.critChance + 21 * .005, 12);
  expect(active.increasedDamagePct?.physical).toBeCloseTo(.63, 12);
  expect(active.stats.lifeMax).toBeGreaterThan(baseline.stats.lifeMax);
  expect(active.skillLevels).toEqual(baseline.skillLevels);
});

it('settles the old recovery interval before switching rates and preserves the exact fractional carry', () => {
  const owner = player(), input = fixture(owner), { out, at, expiry } = record(input);
  const baseline = playerToCombatUnit(owner), boosted = playerToCombatUnit({ ...owner,
    skillLevels: { ...owner.skillLevels, 'barbarian.battle_orders': 2 } });
  const first = integrateManaRecoveryBetween(baseline.manaRegenPerSecond ?? 0, 0, at);
  const during = integrateManaRecoveryBetween(boosted.manaRegenPerSecond ?? 0, at, expiry, first);
  const after = integrateManaRecoveryBetween(baseline.manaRegenPerSecond ?? 0, expiry, MAX_SIM_MS, during);
  expect(out.events.filter(event => event.kind === 'action' && event.skillId === command)).toHaveLength(1);
  expect(out.result.playerTeam[0]?.mana).toBe(after.wholeGranted);
  expect(out.result.playerTeam[0]?.manaRegenExactCarry).toBe(exportManaRecoveryCarry(after).manaRegenExactCarry);
});

it('uses the boosted period after payment and preserves the remaining action phase at expiry', () => {
  const owner = player(), input = fixture(owner), { out, at, expiry } = record(input);
  const baseline = playerToCombatUnit(owner), boosted = playerToCombatUnit({ ...owner,
    skillLevels: { ...owner.skillLevels, 'barbarian.increased_speed': 2 } });
  const period = actionPeriodMs(boosted.stats.attackSpeed), ordinary = actionPeriodMs(baseline.stats.attackSpeed);
  const actions = out.events.filter(event => event.kind === 'action' && event.actor === 'hero');
  expect(actions[1]?.simClockMs).toBe(at + period);
  const prior = actions.filter(event => event.simClockMs < expiry).at(-1);
  const next = actions.find(event => event.simClockMs >= expiry);
  if (!prior || !next) throw new Error('Missing actions around expiry');
  expect(next.simClockMs).toBeCloseTo(expiry + (prior.simClockMs + period - expiry) * ordinary / period, 10);
});

it.each([false, true])('clamps healed HP only after restoring every capacity layer (ambient Vigor: %s)', vigor => {
  registerSkill({ id: 'fixture.full-heal', archetype: 'fixture', target: 'self', minLevel: 1,
    cooldown: 60, manaCost: 0, effects: [{ kind: 'heal', target: 'self', amount: 1000000 }] });
  const input = fixture(), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const statAura = vigor ? composeStatAura({ ...player(), class: 'paladin',
    selectedAuraId: 'paladin.vigor', skillLevels: { 'paladin.vigor': 20 } }) : undefined;
  if (vigor && !statAura) throw new Error('Missing synthetic Vigor authority');
  const healing = { ...input, playerTeam: [{ ...hero, skillOrder: [command, 'fixture.full-heal'] }],
    ...(statAura ? { statAura } : {}) };
  const { out, at, expiry } = record(healing);
  const active = replay(healing, out, at + 4000), expired = replay(healing, out, expiry);
  const owner = player(), boosted = playerToCombatUnit({ ...owner,
    skillLevels: { ...owner.skillLevels, ...Object.fromEntries(passives.map(id => ['barbarian.' + id, 2])) } });
  expect(active.stats.lifeMax).toBe(boosted.stats.lifeMax +
    Math.floor(boosted.stats.lifeMax * (statAura?.bonuses.lifePct ?? 0)));
  expect(active.life).toBe(active.stats.lifeMax);
  expect(active.life).toBeGreaterThan(hero.stats.lifeMax);
  const ordinaryCap = hero.stats.lifeMax + Math.floor(hero.stats.lifeMax * (statAura?.bonuses.lifePct ?? 0));
  expect(expired.life).toBe(ordinaryCap);
  expect(expired.stats.lifeMax).toBe(ordinaryCap);
  expect(expired.vigorLife?.baseLifeMax).toBe(vigor ? hero.stats.lifeMax : undefined);
  expect(out.events.some(event => event.kind === 'damage' && event.target === 'hero')).toBe(false);
});

it.each([
  ['sword', 'items/base/wp1h-short-sword'], ['axe', 'items/base/weapon-axe'],
  ['mace', 'items/base/weapon-mace'], ['pole_arm', 'items/base/wp2h-war-pike'],
  ['spear', 'items/base/weapon-spear'], ['throwing', 'items/base/weapon-throwing-knife'],
])('boosts only the matching learned %s mastery through native equipment composition', (slug, baseId) => {
  useInventoryStore.setState({ equipped: { weapon: { id: 'synthetic-mastery-weapon', baseId,
    rarity: 'normal', level: 1, identified: true, equipped: true, affixes: [] } } });
  const owner = player();
  const levels = { 'barbarian.howl': 1, 'barbarian.shout': 1, 'barbarian.battle_orders': 1,
    [command]: 1, ...Object.fromEntries(['sword', 'axe', 'mace', 'pole_arm', 'spear', 'throwing']
      .map(id => ['barbarian.' + id + '_mastery', 1])) };
  const input = fixture({ ...owner, skillLevels: levels }), { out, at, expiry } = record(input);
  const expected = playerToCombatUnit({ ...owner, skillLevels: { ...levels,
    'barbarian.shout': 2, 'barbarian.battle_orders': 2, ['barbarian.' + slug + '_mastery']: 2 } });
  expect(replay(input, out, at).stats).toEqual(expected.stats);
  expect(replay(input, out, at).increasedDamagePct).toEqual(expected.increasedDamagePct);
  expect(replay(input, out, expiry).stats).toEqual(input.playerTeam[0]?.stats);
});

it('does not invent unlearned or weapon-ineligible passive potency', () => {
  const owner = player(), skillLevels = { [command]: 1, 'barbarian.howl': 1,
    'barbarian.shout': 1, 'barbarian.battle_orders': 1, 'barbarian.throwing_mastery': 20 };
  const input = fixture({ ...owner, skillLevels }), { out, at } = record(input);
  const expected = playerToCombatUnit({ ...owner, skillLevels: { ...skillLevels,
    'barbarian.shout': 2, 'barbarian.battle_orders': 2 } });
  expect(replay(input, out, at).stats).toEqual(expected.stats);
  expect(replay(input, out, at).increasedDamagePct).toEqual(expected.increasedDamagePct);
});

it('imported Command markers confer no passive stat changes without actual payment', () => {
  const input = fixture(), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const forged = { ...input, playerTeam: [{ ...hero, mana: 0,
    activeBuffIds: ['battle-command'], statuses: [
      { id: 'battle-command', sourceId: 'forged', stacks: 1, remaining: -1 } ] }] };
  const out = runBattleRecorded(forged);
  expect(out.events.some(event => event.kind === 'action' && event.skillId === command)).toBe(false);
  expect(out.result.playerTeam[0]?.stats).toEqual(hero.stats);
  expect(replay(forged, out, Infinity).stats).toEqual(hero.stats);
});

it('repeated paid intervals restore and reapply the same native profile without stacking or healing', () => {
  const owner = player(), input = fixture({ ...owner, coreStats: { ...owner.coreStats, energy: 10 } });
  const { out } = record(input);
  const native = input.playerTeam[0];
  if (!native?.battleCommandPassives) throw new Error('Missing native passive profiles');
  const casts = out.events.filter(event => event.kind === 'action' && event.skillId === command);
  expect(casts.length).toBeGreaterThan(2);
  for (const cast of casts) {
    const frame = replay(input, out, cast.simClockMs);
    expect(frame.stats).toEqual({ ...native.stats, ...native.battleCommandPassives.boosted.stats });
    expect(frame.increasedDamagePct).toEqual(native.battleCommandPassives.boosted.increasedDamagePct);
    expect(frame.life).toBe(31);
  }
});

it('copies and freezes native passive stat maps without freezing or mutating the persisted player', () => {
  const owner = player(), before = structuredClone(owner), native = playerToCombatUnit(owner);
  const profiles = native.battleCommandPassives;
  if (!profiles) throw new Error('Missing native profiles');
  expect(Object.isFrozen(profiles)).toBe(true);
  for (const profile of [profiles.baseline, profiles.boosted]) {
    expect(Object.isFrozen(profile)).toBe(true);
    expect(Object.isFrozen(profile.stats)).toBe(true);
    expect(Object.isFrozen(profile.stats.resistances)).toBe(true);
    expect(Object.isFrozen(profile.increasedDamagePct)).toBe(true);
    expect(profile.stats).not.toBe(native.stats);
    expect(profile.stats.resistances).not.toBe(native.stats.resistances);
  }
  expect(Object.isFrozen(owner)).toBe(false);
  expect(owner).toEqual(before);
});

it('keeps resource mirrors outside passive potency and preserves their current combat values', () => {
  const owner = player(), native = playerToCombatUnit(owner);
  const changedMirrors = playerToCombatUnit({ ...owner,
    derivedStats: { ...owner.derivedStats, life: 17, mana: 7 } });
  expect(changedMirrors.battleCommandPassives).toEqual(native.battleCommandPassives);
  const base = fixture(owner), input = { ...base, playerTeam: base.playerTeam.map(unit => ({ ...unit,
    stats: { ...unit.stats, life: 17, mana: 7 } })) };
  const { out, at, expiry } = record(input);
  for (const time of [at, expiry]) {
    const hero = replay(input, out, time);
    expect([hero.stats.life, hero.stats.mana]).toEqual([17, 7]);
    expect(hero.life).toBe(31);
  }
});

it('stages an absolute time-zero stat observation and reapplies it without healing', () => {
  const input = fixture(), native = input.playerTeam[0];
  if (!native?.battleCommandPassives) throw new Error('Missing native profiles');
  const event = { kind: 'stats-state' as const, target: native.id, simClockMs: 0, uiDelayMs: 200,
    state: { ...native.battleCommandPassives.boosted,
      stats: { ...native.stats, ...native.battleCommandPassives.boosted.stats }, life: 31, mana: 0 } };
  const staged = stageRecordedBattle({ initialPlayerTeam: input.playerTeam, initialEnemyTeam: input.enemyTeam,
    events: [event], unitNameMap: new Map(),
    outcome: { winner: null, finalPlayerTeam: input.playerTeam, finalEnemyTeam: input.enemyTeam } },
  { currentWave: 1, totalWaves: 1, subAreaRunId: null,
    runRewards: { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} } });
  const hero = staged.playerTeam[0];
  expect(hero?.stats).toEqual({ ...native.stats, ...native.battleCommandPassives.boosted.stats });
  expect([hero?.life, hero?.mana]).toEqual([31, 0]);
  expect(applyEventToTeams(staged.playerTeam, staged.enemyTeam, event).playerTeam).toEqual(staged.playerTeam);
});
