import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { monsters, subAreas } from '@/data/index';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { prepareEndgameAttempt } from '../endgame/runtime';
import { emptyEndgameState } from '../endgame/state';
import { createRng } from '../rng';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import { buildMonsterUnit } from './monster-factory';
import { resolveChallengeWavePlan } from './sub-area-run';
import type { CombatUnit, MonsterTier } from './types';

const cases = [
  ['monsters/act1.burning-dead-mage', 1], ['monsters/act2.horror-mage', 2],
  ['monsters/act2.cantor', 2], ['monsters/act3.serpent-magus', 3],
  ['monsters/act4.doom-caster', 4], ['monsters/act5.warped-shaman', 5],
  ['monsters/act5.succubus', 5]
] as const;
function definition(id: string) {
  const def = monsters.find(row => row.id === id);
  if (!def) throw new Error('Missing native caster: ' + id);
  return def;
}
function build(id: string, level = 12, tier: MonsterTier = 'trash') {
  return buildMonsterUnit({ def: definition(id), level, tier, rng: createRng(7), id: 'enemy' });
}
function input(enemy: CombatUnit, act: 1 | 2 | 3 | 4 | 5): CombatSnapshot {
  // Passive unmitigated tank isolates native actions; this is not an earned build.
  const hero: CombatUnit = { ...enemy, id: 'hero', kind: 'hero', side: 'player',
    life: 10_000_000, mana: 0, skillOrder: [], attackRange: [0, 0],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    stats: { ...enemy.stats, attack: 0, life: 10_000_000, lifeMax: 10_000_000,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  return { seed: 13, act, playerTeam: [hero], enemyTeam: [enemy] };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
describe.each(cases)('caster numeric family %s', (id, act) => {
  it('uses the literal low-melee curve across levels and native tiers', () => {
    expect(definition(id)).toMatchObject({ attack: [13, 13], attackGrowth: [2, 2], canBeElite: true, canBeBoss: false });
    const probes: [number, MonsterTier][] = [[1, 'trash'], [12, 'trash'], [17, 'elite'],
      [17, 'champion'], [17, 'rare-elite'], [90, 'trash'], [17, 'boss'], [17, 'rare-minion']];
    const expected = [13, 35, 59, 68, 68, 191, 72, 50];
    expect(probes.map(([level, tier]) => build(id, level, tier).stats.attack)).toEqual(expected);
    expect(probes.map(([level, tier]) => build(id, level, tier).attackRange)).toEqual(expected.map(n => [n, n]));
    expect(build(id).basicAttackDelivery).toBe('melee');
    const def = definition(id), legacy = { ...def };
    Reflect.deleteProperty(legacy, 'attack'); Reflect.deleteProperty(legacy, 'attackGrowth');
    const a = createRng(7), b = createRng(7);
    const authored = buildMonsterUnit({ def, level: 12, tier: 'trash', rng: a });
    const old = buildMonsterUnit({ def: legacy, level: 12, tier: 'trash', rng: b });
    const unchanged = { ...authored, stats: { ...authored.stats, attack: old.stats.attack } };
    const oldUnchanged = { ...old };
    // The modified clone loses authenticated delivery; the real row is pinned above.
    for (const unit of [unchanged, oldUnchanged]) {
      Reflect.deleteProperty(unit, 'attackRange'); Reflect.deleteProperty(unit, 'basicAttackDelivery');
    }
    expect(unchanged).toEqual(oldUnchanged);
    expect(a.next()).toBe(b.next());
  });
  it('deals the adopted ordinary damage under native Mana Burn without mutating input', () => {
    const enemy = { ...build(id), statuses: [{ id: 'mana-burn', sourceId: 'fixture', remaining: -1, stacks: 1 }] };
    const snapshot = input(enemy, act), before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
    const actions = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'enemy');
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.every(e => e.skillId === null)).toBe(true);
    const hits = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> => e.kind === 'damage' && e.source === 'enemy' && !e.dodged && !e.crit);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every(e => e.damageType === 'physical' && e.amount === 35)).toBe(true);
    expect(runBattle(snapshot)).toEqual(out.result);
    expect(runBattleRecorded(snapshot)).toEqual(out);
    expect(snapshot).toEqual(before);
  });
});

it.each([
  ['monsters/act1.burning-dead-mage', 1, 1780, ['monster-fire-bolt', 'monster-bone-spirit'], ['monster.fire_bolt', 'monster.bone_spirit']],
  ['monsters/act2.horror-mage', 2, 1700, ['monster-lightning-bolt', 'monster-frost-bolt'], ['monster.lightning_bolt', 'monster.frost_bolt']],
  ['monsters/act2.cantor', 2, 1660, ['monster-fire-bolt', 'monster-frost-bolt', 'monster-lightning-bolt', 'monster-heal'], ['monster.fire_bolt', 'monster.frost_bolt']],
  ['monsters/act3.serpent-magus', 3, 1700, ['monster-fire-ball', 'monster-lightning-bolt'], ['monster.fire_ball', 'monster.lightning_bolt']],
  ['monsters/act4.doom-caster', 4, 1660, ['monster-fire-ball', 'monster-frost-nova'], ['monster.fire_ball', 'monster.frost_nova']],
  ['monsters/act5.succubus', 5, 1580, ['monster-arcane-bolt', 'monster-curse'], ['monster.arcane_bolt', 'monster.curse', 'monster.arcane_bolt', null]],
  ['monsters/act5.warped-shaman', 5, 1740, ['monster-frost-nova', 'monster-summon-adds'], ['monster.frost_nova', null, 'monster.frost_nova', 'monster.summon_adds', 'monster.frost_nova', null]]
] as const)('preserves %s exact native base cadence, spell coverage and immutable replay', (id, act, period, skills, first) => {
  const enemy = build(id), snapshot = input(enemy, act), before = structuredClone(snapshot);
  expect(enemy.skillOrder).toEqual(skills);
  const out = runBattleRecorded(snapshot);
  const actions = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'enemy' && e.simClockMs > 0);
  expect(actions.slice(0, first.length)).toEqual(first.map((skillId, i): unknown =>
    expect.objectContaining({ skillId, simClockMs: period * (i + 1) })));
  if (id === 'monsters/act5.warped-shaman') {
    const summons = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'summon' }> => e.kind === 'summon' && e.owner === 'enemy');
    expect(summons).toHaveLength(2);
    expect(summons.map(e => e.simClockMs)).toEqual([0, 6960]);
    expect(summons.every(e => e.summonId === 'minion' && e.unit.stats.attack === 10 && e.unit.life === 40)).toBe(true);
    expect(actions.some(e => e.skillId === null)).toBe(true);
  } else {
    expect(actions.every((e, i) => e.skillId === first[i % first.length])).toBe(true);
    expect(actions.some(e => e.skillId === null)).toBe(first.some(skill => skill === null));
  }
  expect(runBattle(snapshot)).toEqual(out.result);
  expect(runBattleRecorded(snapshot)).toEqual(out);
  expect(snapshot).toEqual(before);
});

it('keeps appended elite Charge available behind Warped Shaman spells', () => {
  const enemy = buildMonsterUnit({ def: definition('monsters/act5.warped-shaman'), level: 12,
    tier: 'elite', id: 'enemy', rng: createRng(7), extraSkillIds: ['monster-charge'] });
  expect(enemy.skillOrder).toEqual(['monster-frost-nova', 'monster-summon-adds', 'monster-charge']);
  const out = runBattleRecorded(input(enemy, 5));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'enemy',
    skillId: 'monster.charge', simClockMs: 3480 }));
});

it.each([
  ['areas/act3-kurast-bazaar', 3, 40, 'act3-bazaar-sarina', 'monsters/act3.serpent-magus', 'monsters/act3.flayer', 146, 'trash'],
  ['areas/act5-crystalline-passage', 5, 71, 'act5-cp-nihlathak', 'monsters/act5.warped-shaman', 'monsters/act5.frozen-terror', 245, 'boss']
] as const)('pins %s native challenge source, roster and inherited boss curve', (id, act, level, source, owner, add, attack, addTier) => {
  const area = subAreas.find(row => row.id === id); if (!area) throw new Error('Missing native area');
  const plan = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: owner, fallbackLevel: 1, seed: 7, challengeOrdinal: 0 });
  const wave = plan.waves.find(w => w.source?.kind === 'bossEncounter');
  if (!wave) throw new Error('Missing actual boss encounter');
  expect(wave.source).toEqual({ kind: 'bossEncounter', encounterId: source });
  expect(wave.spawns.map(s => [s.archetypeId, s.tier, s.level, s.encounterId])).toEqual(
    [owner, add, add, add, add].map((id, index) => [id, index === 0 ? 'boss' : addTier, level, source]));
  const enemies = wave.spawns.map((s, i) => buildMonsterUnit({ def: definition(s.archetypeId),
    level: s.level, tier: s.tier, rng: createRng(i), id: `native-${String(i)}` }));
  expect(enemies[0]?.stats.attack).toBe(attack);
  const tank = input(build(owner), act).playerTeam;
  const snapshot: CombatSnapshot = { seed: 13, act, playerTeam: tank, enemyTeam: enemies }, before = structuredClone(snapshot);
  const out = runBattleRecorded(snapshot);
  const actions = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'native-0');
  expect(actions.some(e => e.skillId === null)).toBe(act === 5);
  expect(runBattle(snapshot)).toEqual(out.result); expect(snapshot).toEqual(before);
});

it('preserves exact Throne W3 quest sources, member counts and Warped Shaman elite curves', () => {
  const area = subAreas.find(row => row.id === 'areas/act5-throne-of-destruction');
  if (!area) throw new Error('Missing native Throne area');
  const plan = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: 'monsters/act5.baal-minion',
    fallbackLevel: 1, seed: 7, challengeOrdinal: 0, questSourceProjection: 'act5-throne' });
  expect(plan.questSourceProjection).toBe('act5-throne');
  const wave = plan.waves.find(w => w.id === 'w3'); if (!wave) throw new Error('Missing exact W3');
  expect(wave.source).toEqual({ kind: 'wave', waveId: 'w3', encounterIds: ['act5-tod-w3-e1'] });
  expect(wave.spawns.map(s => [s.archetypeId, s.tier, s.level, s.encounterId])).toEqual(
    ['monsters/act5.baal-minion', 'monsters/act5.baal-minion', 'monsters/act5.baal-minion',
      'monsters/act5.warped-shaman', 'monsters/act5.warped-shaman'].map(id => [id, 'elite', 76, 'act5-tod-w3-e1']));
  const enemies = wave.spawns.map((s, i) => buildMonsterUnit({ def: definition(s.archetypeId),
    level: s.level, tier: s.tier, rng: createRng(i), id: `throne-${String(i)}` }));
  expect(enemies.slice(3).map(e => e.stats.attack)).toEqual([212, 212]);
  const snapshot: CombatSnapshot = { seed: 13, act: 5, playerTeam: input(build('monsters/act5.warped-shaman'), 5).playerTeam, enemyTeam: enemies };
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  for (const owner of ['throne-3', 'throne-4']) {
    expect(out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'summon' }> => e.kind === 'summon' && e.owner === owner)).toHaveLength(2);
    expect(out.events.some(e => e.kind === 'action' && e.actor === owner && e.skillId === null)).toBe(true);
  }
  expect(runBattle(snapshot)).toEqual(out.result); expect(snapshot).toEqual(before);
});

it.each(['ashen', 'glacial'])('retains the two L90 trash Succubi in %s W3', modifierId => {
  const { progress } = prepareEndgameAttempt({ heroId: 'hero', modifierId, state: emptyEndgameState(), campaign: campaignEvidence() });
  const all = progress.plan.waves.flatMap(w => w.spawns.filter(s => s.archetypeId === 'monsters/act5.succubus').map(s => [w.id, s] as const));
  expect(all).toHaveLength(2);
  for (const [wave, spawn] of all) {
    expect(wave).toBe('worldstone-remnant/w3'); expect([spawn.level, spawn.tier]).toEqual([90, 'trash']);
    const enemy = build(spawn.archetypeId, spawn.level, spawn.tier); expect(enemy.stats.attack).toBe(191);
    const snapshot = input(enemy, 5), before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
    const actions = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'enemy');
    expect(actions.length).toBeGreaterThan(2);
    const cycle = ['monster.arcane_bolt', 'monster.curse', 'monster.arcane_bolt', null];
    expect(actions.map(e => e.skillId)).toEqual(actions.map((_e, i) => cycle[i % cycle.length]));
    expect(runBattle(snapshot)).toEqual(out.result); expect(snapshot).toEqual(before);
  }
});

it('replaces killed native minions without exceeding two living bodies or inheriting owner Attack', () => {
  const base = build('monsters/act5.warped-shaman'), snapshot = input({ ...base,
    life: 1_000_000, stats: { ...base.stats, life: 1_000_000, lifeMax: 1_000_000 } }, 5);
  const hero = snapshot.playerTeam[0]; if (!hero) throw new Error('Missing passive fixture');
  const active: CombatSnapshot = { ...snapshot, playerTeam: [{ ...hero, statuses: [], skillOrder: ['monster-frost-nova'] }] };
  const before = structuredClone(active), out = runBattleRecorded(active), alive = new Set<string>();
  let births = 0, deaths = 0;
  for (const event of out.events) {
    if (event.kind === 'summon' && event.owner === 'enemy') {
      births++; alive.add(event.unit.id);
      expect([event.unit.life, event.unit.stats.attack]).toEqual([40, 10]);
      expect(alive.size).toBeLessThanOrEqual(2);
    } else if (event.kind === 'death' && alive.delete(event.target)) deaths++;
  }
  expect(births).toBeGreaterThan(2); expect(deaths).toBeGreaterThan(0);
  const summonCasts = out.events.filter((event): event is Extract<RecordedBattleEvent, { kind: 'action' }> =>
    event.kind === 'action' && event.actor === 'enemy' && event.skillId === 'monster.summon_adds');
  expect(summonCasts.length).toBeGreaterThan(2);
  for (let index = 1; index < summonCasts.length; index++) {
    const previous = summonCasts[index - 1], current = summonCasts[index];
    if (!previous || !current) throw new Error('Missing native summon cast');
    expect(current.simClockMs - previous.simClockMs).toBeGreaterThanOrEqual(5000);
  }
  expect(out.events.filter(event => event.kind === 'mana' && event.target === 'enemy' && event.reason === 'summon-refund'))
    .toEqual([]);
  expect(runBattle(active)).toEqual(out.result); expect(active).toEqual(before);
});
