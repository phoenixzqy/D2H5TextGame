import { afterEach, beforeEach, expect, it } from 'vitest';
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
  ['monsters/act2.infidel', 2, 40, 6.25, 1620, ['monster-charge', 'monster-enrage'],
    ['monster.charge', 'monster.enrage', null, 'monster.charge', null, 'monster.enrage']],
  ['monsters/act2.saber-cat', 2, 35.2, 5.5, 1460, ['monster-leap-attack'],
    ['monster.leap_attack', null, null, 'monster.leap_attack', null, null]],
  ['monsters/act3.thorned-hulk', 3, 40, 6.25, 1820, ['monster-thorns-aura'],
    ['monster.thorns_aura', null, null, null, null, null]],
  ['monsters/act5.frozen-terror', 5, 40, 6.25, 1620, ['monster-frost-aura'],
    ['monster.frost_aura', null, 'monster.frost_aura', null, 'monster.frost_aura', null]]
] as const;
function definition(id: string) {
  const def = monsters.find(row => row.id === id);
  if (!def) throw new Error('Missing native hybrid: ' + id);
  return def;
}
function build(id: string, level = 12, tier: MonsterTier = 'trash') {
  return buildMonsterUnit({ def: definition(id), level, tier, rng: createRng(7), id: 'enemy' });
}
function input(enemy: CombatUnit, act: 1 | 2 | 3 | 4 | 5): CombatSnapshot {
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

it.each(cases)('%s has literal role curves, melee delivery and unchanged nonattack stats/RNG', (id, _act, base, growth, _period, skills) => {
  expect(definition(id)).toMatchObject({ attack: [base, base], attackGrowth: [growth, growth], skills, canBeBoss: false });
  const probes: [number, MonsterTier][] = [[1, 'trash'], [12, 'trash'], [17, 'elite'],
    [17, 'champion'], [17, 'rare-elite'], [90, 'trash'], [17, 'boss'], [17, 'rare-minion']];
  const expected = id === 'monsters/act2.saber-cat' ? [35, 96, 160, 185, 185, 525, 197, 136]
    : [40, 109, 182, 210, 210, 596, 224, 154];
  expect(probes.map(([level, tier]) => build(id, level, tier).stats.attack)).toEqual(expected);
  expect(probes.map(([level, tier]) => build(id, level, tier).attackRange)).toEqual(expected.map(n => [n, n]));
  expect(build(id).basicAttackDelivery).toBe('melee');
  const def = definition(id), legacy = { ...def };
  Reflect.deleteProperty(legacy, 'attack'); Reflect.deleteProperty(legacy, 'attackGrowth');
  const a = createRng(7), b = createRng(7);
  const current = buildMonsterUnit({ def, level: 12, tier: 'trash', rng: a });
  const old = buildMonsterUnit({ def: legacy, level: 12, tier: 'trash', rng: b });
  const unchanged = { ...current, stats: { ...current.stats, attack: old.stats.attack } }, oldUnchanged = { ...old };
  for (const unit of [unchanged, oldUnchanged]) {
    Reflect.deleteProperty(unit, 'attackRange'); Reflect.deleteProperty(unit, 'basicAttackDelivery');
  }
  expect(unchanged).toEqual(oldUnchanged); expect(a.next()).toBe(b.next());
});

it.each(cases)('%s naturally exposes signatures and real ordinary damage with immutable replay', (id, act, _base, _growth, period, skills, first) => {
  const enemy = build(id), snapshot = input(enemy, act), before = structuredClone(snapshot);
  expect(enemy.skillOrder).toEqual(skills);
  const out = runBattleRecorded(snapshot);
  const actions = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'enemy');
  expect(actions.slice(0, first.length)).toEqual(first.map((skillId, i): unknown =>
    expect.objectContaining({ skillId, simClockMs: period * (i + 1) })));
  expect(actions.some(e => e.skillId === null)).toBe(true);
  const allowed = new Set<string | null>(first);
  expect(actions.every(e => allowed.has(e.skillId))).toBe(true);
  const ordinaryClocks = new Set(actions.filter(e => e.skillId === null).map(e => e.simClockMs));
  const hits = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> => e.kind === 'damage' &&
    e.source === 'enemy' && ordinaryClocks.has(e.simClockMs) && !e.dodged && !e.crit);
  expect(hits.length).toBeGreaterThan(0);
  // FrostAura enables Chill x1.1; Infidel's paid Enrage enables direct x1.5.
  const amounts = id === 'monsters/act2.infidel' ? [109, 163]
    : id === 'monsters/act5.frozen-terror' ? [109, 119]
    : [id === 'monsters/act2.saber-cat' ? 96 : 109];
  expect([...new Set(hits.map(e => e.amount))].every(amount => amounts.includes(amount))).toBe(true);
  expect(hits.every(e => e.damageType === 'physical')).toBe(true);
  if (id === 'monsters/act5.frozen-terror') expect(hits.some(e => e.amount === 119)).toBe(true);
  if (id === 'monsters/act2.infidel') expect(hits.some(e => e.amount === 163)).toBe(true);
  expect(runBattle(snapshot)).toEqual(out.result); expect(runBattleRecorded(snapshot)).toEqual(out); expect(snapshot).toEqual(before);
});

it.each(cases)('%s uses ordinary physical damage under actual ManaBurn', (id, act) => {
  const snapshot = input({ ...build(id), statuses: [{ id: 'mana-burn', sourceId: 'fixture', remaining: -1, stacks: 1 }] }, act);
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  const actions = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'enemy');
  expect(actions.length).toBeGreaterThan(0); expect(actions.every(e => e.skillId === null)).toBe(true);
  const hits = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> => e.kind === 'damage' && e.source === 'enemy' && !e.dodged && !e.crit);
  expect(hits.length).toBeGreaterThan(0);
  expect(hits.every(e => e.amount === (id === 'monsters/act2.saber-cat' ? 96 : 109) && e.damageType === 'physical')).toBe(true);
  expect(runBattle(snapshot)).toEqual(out.result); expect(snapshot).toEqual(before);
});

it('allows appended elite FrostNova after the one-time Hulk marker', () => {
  const enemy = buildMonsterUnit({ def: definition('monsters/act3.thorned-hulk'), level: 12,
    tier: 'elite', id: 'enemy', rng: createRng(7), extraSkillIds: ['monster-frost-nova'] });
  expect(enemy.skillOrder).toEqual(['monster-thorns-aura', 'monster-frost-nova']);
  const out = runBattleRecorded(input(enemy, 3));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'enemy',
    skillId: 'monster.frost_nova', simClockMs: 3640 }));
});

it('retains the active all-target FrostAura cold/Chill behavior and cold resistance', () => {
  const enemy = build('monsters/act5.frozen-terror'); expect(enemy.stats.resistances.cold).toBe(75);
  const snapshot = input(enemy, 5), hero = snapshot.playerTeam[0]; if (!hero) throw new Error('Missing tank');
  const active = { ...snapshot, playerTeam: [hero, { ...hero, id: 'ally', kind: 'merc' as const }] };
  const before = structuredClone(active), out = runBattleRecorded(active);
  for (const id of ['hero', 'ally']) {
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'damage', source: 'enemy', target: id,
      damageType: 'cold', dodged: false, simClockMs: 1620 }));
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status', target: id, statusId: 'chill', simClockMs: 1620 }));
  }
  expect(runBattle(active)).toEqual(out.result); expect(active).toEqual(before);
});

it.each([
  ['areas/act3-spider-forest', 'w4', 'act3-sf-w4-e1', 30, 'champion', 'HFFFHFFFHFF', 'monsters/act3.fetish', 332],
  ['areas/act3-great-marsh', 'w2', 'act3-gm-w2-e1', 30, 'trash', 'HSSSHSSSH', 'monsters/act3.spider', 221],
  ['areas/act3-flayer-jungle', 'w2', 'act3-fj-w2-e1', 32, 'trash', 'HHSSHHSSH', 'monsters/act3.spider', 234],
  ['areas/act3-kurast-bazaar', 'w3', 'act3-kb-w3-e1', 38, 'elite', 'HHMMHHMMHH', 'monsters/act3.serpent-magus', 353],
  ['areas/act3-travincal', 'w3', 'act3-tv-w3-e1', 41, 'elite', 'HHIIHHIIHH', 'monsters/act3.infector', 377],
  ['areas/act3-durance-of-hate', 'w2', 'act3-dh-w2-e1', 43, 'trash', 'HHDDHHDDH', 'monsters/act3.doom-ape', 303],
  ['areas/act3-durance-of-hate', 'w4', 'act3-dh-w4-e1', 45, 'champion', 'HHIIHHIIHHI', 'monsters/act3.infector', 473]
] as const)('pins %s/%s actual Hulk challenge roster, inherited tier and ordinary source', (areaId, id, encounterId, level, tier, pattern, other, attack) => {
  const area = subAreas.find(row => row.id === areaId); if (!area) throw new Error('Missing Hulk area');
  const plan = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: 'monsters/act3.thorned-hulk',
    fallbackLevel: 1, seed: 7, challengeOrdinal: 0 });
  const wave = plan.waves.find(w => w.source?.kind === 'wave' && w.source.waveId === id);
  if (!wave) throw new Error('Missing Hulk wave');
  expect(wave.source).toEqual({ kind: 'wave', waveId: id, encounterIds: [encounterId] });
  // BUG447 retains each four-body authored elite core; fitted copies are trash.
  const coreSize = tier === 'champion' ? 3 : 4;
  expect(wave.spawns.map(s => [s.archetypeId, s.level, s.tier, s.encounterId])).toEqual(
    [...pattern].map((letter, index) => [letter === 'H' ? 'monsters/act3.thorned-hulk' : other, level,
      (tier === 'champion' || tier === 'elite') && index >= coreSize ? 'trash' : tier, encounterId]));
  const enemies = wave.spawns.map((s, i) => buildMonsterUnit({ def: definition(s.archetypeId), level: s.level,
    tier: s.tier, rng: createRng(i), id: `native-${String(i)}` }));
  expect(enemies[0]?.stats.attack).toBe(attack);
  const snapshot: CombatSnapshot = { seed: 13, act: 3,
    playerTeam: input(build('monsters/act3.thorned-hulk'), 3).playerTeam, enemyTeam: enemies };
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'native-0', skillId: 'monster.thorns_aura', simClockMs: 1820 }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'native-0', skillId: null, simClockMs: 3640 }));
  expect(runBattle(snapshot)).toEqual(out.result); expect(snapshot).toEqual(before);
});

it.each([
  ['areas/act5-frigid-highlands', 63, 'act5-fh-eldritch', 'monsters/act5.overseer', 3, 684],
  ['areas/act5-crystalline-passage', 71, 'act5-cp-nihlathak', 'monsters/act5.warped-shaman', 4, 764]
] as const)('preserves %s actual boss roster/source and inherited Frozen curve', (id, level, source, owner, count, attack) => {
  const area = subAreas.find(row => row.id === id); if (!area) throw new Error('Missing native area');
  const plan = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: owner, fallbackLevel: 1, seed: 7, challengeOrdinal: 0 });
  const wave = plan.waves.find(w => w.source?.kind === 'bossEncounter'); if (!wave) throw new Error('Missing boss encounter');
  expect(wave.source).toEqual({ kind: 'bossEncounter', encounterId: source });
  expect(wave.spawns.map(s => [s.archetypeId, s.tier, s.level, s.encounterId])).toEqual(
    [owner, ...Array.from({ length: count }, () => 'monsters/act5.frozen-terror')].map(id => [id, 'boss', level, source]));
  const enemies = wave.spawns.map((s, i) => buildMonsterUnit({ def: definition(s.archetypeId), level: s.level,
    tier: s.tier, rng: createRng(i), id: `native-${String(i)}` }));
  expect(enemies.slice(1).map(e => e.stats.attack)).toEqual(Array.from({ length: count }, () => attack));
  const snapshot: CombatSnapshot = { seed: 13, act: 5, playerTeam: input(build('monsters/act5.frozen-terror'), 5).playerTeam, enemyTeam: enemies };
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'native-1', skillId: null, simClockMs: 3240 }));
  expect(runBattle(snapshot)).toEqual(out.result); expect(snapshot).toEqual(before);
});

it('preserves exact Throne W2 roster, original quest provenance and Frozen elite curves', () => {
  const area = subAreas.find(row => row.id === 'areas/act5-throne-of-destruction'); if (!area) throw new Error('Missing Throne');
  const plan = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: 'monsters/act5.baal-minion',
    fallbackLevel: 1, seed: 7, challengeOrdinal: 0, questSourceProjection: 'act5-throne' });
  expect(plan.questSourceProjection).toBe('act5-throne');
  const wave = plan.waves.find(w => w.id === 'w2'); if (!wave) throw new Error('Missing exact W2');
  expect(wave.source).toEqual({ kind: 'wave', waveId: 'w2', encounterIds: ['act5-tod-w2-e1'] });
  expect(wave.spawns.map(s => [s.archetypeId, s.level, s.tier, s.encounterId])).toEqual(
    [...Array.from({ length: 4 }, () => 'monsters/act5.baal-minion'), ...Array.from({ length: 2 }, () => 'monsters/act5.frozen-terror')]
      .map(id => [id, 75, 'elite', 'act5-tod-w2-e1']));
  expect(wave.spawns.slice(4).map(s => build(s.archetypeId, s.level, s.tier).stats.attack)).toEqual([653, 653]);
});

it.each(['glacial', 'ashen'])('preserves %s modifier distribution and L90 Frozen action/curve', modifierId => {
  const { progress } = prepareEndgameAttempt({ heroId: 'hero', modifierId, state: emptyEndgameState(), campaign: campaignEvidence() });
  const all = progress.plan.waves.flatMap(w => w.spawns.filter(s => s.archetypeId === 'monsters/act5.frozen-terror').map(s => [w.id, s] as const));
  if (modifierId === 'ashen') { expect(all).toHaveLength(0); return; }
  expect(all.map(([id, s]) => [id, s.level, s.tier])).toEqual([2, 2, 3, 3, 4, 4].map(n => [`worldstone-remnant/w${String(n)}`, 90, 'trash']));
  const enemy = build('monsters/act5.frozen-terror', 90); expect(enemy.stats.attack).toBe(596);
  const snapshot = input(enemy, 5), before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'enemy', skillId: null, simClockMs: 3240 }));
  expect(runBattle(snapshot)).toEqual(out.result); expect(snapshot).toEqual(before);
});
