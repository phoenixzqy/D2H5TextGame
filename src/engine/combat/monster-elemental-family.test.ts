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
import { statusActiveAt } from './status';
import type { CombatUnit, MonsterTier } from './types';

// Literal provisional role/cadence oracles. Passive tanks are not earned builds.
const cases = [
  {"id": "monsters/act1.afflicted", "act": 1, "base": 32, "growth": 5, "period": 1740, "skills": ["monster-poison-spit"], "sequence": ["monster.poison_spit", null, "monster.poison_spit", null, "monster.poison_spit", null], "attacks": [32, 87, 146, 168, 168, 477, 179, 123], "delivery": "melee", "ordinary": true},
  {"id": "monsters/act1.dark-ranger", "act": 1, "base": 35.2, "growth": 5.5, "period": 1620, "skills": ["monster-fire-arrow"], "sequence": ["monster.fire_arrow", "monster.fire_arrow", "monster.fire_arrow", "monster.fire_arrow", "monster.fire_arrow", "monster.fire_arrow"], "attacks": [35, 96, 160, 185, 185, 525, 197, 136], "delivery": "ranged", "ordinary": false},
  {"id": "monsters/act2.rock-worm", "act": 2, "base": 27.2, "growth": 4.25, "period": 1780, "skills": ["monster-poison-spit"], "sequence": ["monster.poison_spit", null, "monster.poison_spit", null, "monster.poison_spit", null], "attacks": [27, 74, 124, 143, 143, 405, 152, 105], "delivery": "melee", "ordinary": true},
  {"id": "monsters/act2.devourer", "act": 2, "base": 32, "growth": 5, "period": 1740, "skills": ["monster-poison-spit"], "sequence": ["monster.poison_spit", null, "monster.poison_spit", null, "monster.poison_spit", null], "attacks": [32, 87, 146, 168, 168, 477, 179, 123], "delivery": "melee", "ordinary": true},
  {"id": "monsters/act2.claw-viper", "act": 2, "base": 35.2, "growth": 5.5, "period": 1620, "skills": ["monster-poison-spit"], "sequence": ["monster.poison_spit", null, "monster.poison_spit", null, "monster.poison_spit", null], "attacks": [35, 96, 160, 185, 185, 525, 197, 136], "delivery": "melee", "ordinary": true},
  {"id": "monsters/act2.salamander", "act": 2, "base": 35.2, "growth": 5.5, "period": 1620, "skills": ["monster-fire-bolt"], "sequence": ["monster.fire_bolt", null, "monster.fire_bolt", null, "monster.fire_bolt", null], "attacks": [35, 96, 160, 185, 185, 525, 197, 136], "delivery": "melee", "ordinary": true},
  {"id": "monsters/act2.pit-viper", "act": 2, "base": 35.2, "growth": 5.5, "period": 1540, "skills": ["monster-poison-spit", "monster-charge"], "sequence": ["monster.poison_spit", "monster.charge", "monster.poison_spit", null, "monster.poison_spit", "monster.charge"], "attacks": [35, 96, 160, 185, 185, 525, 197, 136], "delivery": "melee", "ordinary": true},
  {"id": "monsters/act2.burning-dead-archer", "act": 2, "base": 35.2, "growth": 5.5, "period": 1620, "skills": ["monster-fire-arrow"], "sequence": ["monster.fire_arrow", "monster.fire_arrow", "monster.fire_arrow", "monster.fire_arrow", "monster.fire_arrow", "monster.fire_arrow"], "attacks": [35, 96, 160, 185, 185, 525, 197, 136], "delivery": "ranged", "ordinary": false},
  {"id": "monsters/act2.steel-scarab", "act": 2, "base": 27.2, "growth": 4.25, "period": 1820, "skills": ["monster-lightning-bolt"], "sequence": ["monster.lightning_bolt", null, "monster.lightning_bolt", null, "monster.lightning_bolt", null], "attacks": [27, 74, 124, 143, 143, 405, 152, 105], "delivery": "melee", "ordinary": true},
  {"id": "monsters/act2.plague-bug", "act": 2, "base": 27.2, "growth": 4.25, "period": 1780, "skills": ["monster-poison-spit"], "sequence": ["monster.poison_spit", null, "monster.poison_spit", null, "monster.poison_spit", null], "attacks": [27, 74, 124, 143, 143, 405, 152, 105], "delivery": "melee", "ordinary": true},
  {"id": "monsters/act2.death-beetle", "act": 2, "base": 35.2, "growth": 5.5, "period": 1780, "skills": ["monster-lightning-bolt"], "sequence": ["monster.lightning_bolt", null, "monster.lightning_bolt", null, "monster.lightning_bolt", null], "attacks": [35, 96, 160, 185, 185, 525, 197, 136], "delivery": "melee", "ordinary": true},
  {"id": "monsters/act3.fetish", "act": 3, "base": 35.2, "growth": 5.5, "period": 1580, "skills": ["monster-poison-dagger"], "sequence": ["monster.poison_dagger", "monster.poison_dagger", "monster.poison_dagger", "monster.poison_dagger", "monster.poison_dagger", "monster.poison_dagger"], "attacks": [35, 96, 160, 185, 185, 525, 197, 136], "delivery": "melee", "ordinary": false},
  {"id": "monsters/act3.spider", "act": 3, "base": 27.2, "growth": 4.25, "period": 1700, "skills": ["monster-poison-spit"], "sequence": ["monster.poison_spit", null, "monster.poison_spit", null, "monster.poison_spit", null], "attacks": [27, 74, 124, 143, 143, 405, 152, 105], "delivery": "melee", "ordinary": true},
  {"id": "monsters/act3.swamp-dweller", "act": 3, "base": 32, "growth": 5, "period": 1780, "skills": ["monster-poison-cloud"], "sequence": ["monster.poison_cloud", null, "monster.poison_cloud", null, "monster.poison_cloud", null], "attacks": [32, 87, 146, 168, 168, 477, 179, 123], "delivery": "melee", "ordinary": true},
  {"id": "monsters/act3.infector", "act": 3, "base": 32, "growth": 5, "period": 1740, "skills": ["monster-plague-spit"], "sequence": ["monster.plague_spit", null, "monster.plague_spit", null, "monster.plague_spit", null], "attacks": [32, 87, 146, 168, 168, 477, 179, 123], "delivery": "melee", "ordinary": true},
  {"id": "monsters/act4.venom-lord", "act": 4, "base": 40, "growth": 6.25, "period": 1660, "skills": ["monster-poison-spit", "monster-inferno"], "sequence": ["monster.poison_spit", "monster.inferno", "monster.poison_spit", "monster.inferno", "monster.poison_spit", "monster.inferno"], "attacks": [40, 109, 182, 210, 210, 596, 224, 154], "delivery": "melee", "ordinary": false},
  {"id": "monsters/act4.pit-lord", "act": 4, "base": 40, "growth": 6.25, "period": 1660, "skills": ["monster-fire-breath", "monster-charge"], "sequence": ["monster.fire_breath", "monster.charge", "monster.fire_breath", null, "monster.fire_breath", "monster.charge"], "attacks": [40, 109, 182, 210, 210, 596, 224, 154], "delivery": "melee", "ordinary": true},
  {"id": "monsters/act4.mega-demon", "act": 4, "base": 40, "growth": 6.25, "period": 1620, "skills": ["monster-inferno"], "sequence": ["monster.inferno", null, "monster.inferno", null, "monster.inferno", null], "attacks": [40, 109, 182, 210, 210, 596, 224, 154], "delivery": "melee", "ordinary": true},
  {"id": "monsters/act5.blood-lord", "act": 5, "base": 40, "growth": 6.25, "period": 1620, "skills": ["monster-fire-breath"], "sequence": ["monster.fire_breath", null, "monster.fire_breath", null, "monster.fire_breath", null], "attacks": [40, 109, 182, 210, 210, 596, 224, 154], "delivery": "melee", "ordinary": true},
  {"id": "monsters/act5.baal-minion", "act": 5, "base": 40, "growth": 6.25, "period": 1580, "skills": ["monster-fire-breath", "monster-poison-cloud"], "sequence": ["monster.fire_breath", "monster.poison_cloud", "monster.fire_breath", "monster.poison_cloud", "monster.fire_breath", "monster.poison_cloud"], "attacks": [40, 109, 182, 210, 210, 596, 224, 154], "delivery": "melee", "ordinary": false}
] as const;
function definition(id: string) {
  const value = monsters.find(row => row.id === id);
  if (!value) throw new Error('Missing bundled row: ' + id);
  return value;
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
describe.each(cases)('elemental signature family $id', spec => {
  it('uses the exact signature order and ordinary gaps at native cadence with immutable replay', () => {
    const enemy = build(spec.id), snapshot = input(enemy, spec.act), before = structuredClone(snapshot);
    expect(enemy.skillOrder).toEqual(spec.skills);
    expect(enemy.basicAttackDelivery).toBe(spec.delivery);
    const output = runBattleRecorded(snapshot);
    expect(runBattleRecorded(snapshot)).toEqual(output);
    expect(runBattle(snapshot)).toEqual(output.result);
    expect(snapshot).toEqual(before);
    const actions = output.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'enemy');
    expect(actions.slice(0, 6)).toEqual(spec.sequence.map((skillId, index): unknown =>
      expect.objectContaining({ skillId, simClockMs: spec.period * (index + 1) })));
    expect(actions.some(e => e.skillId?.includes('melee') === true || e.skillId === 'monster.weak_ranged')).toBe(false);
    const ordinary = actions.filter(e => e.skillId === null);
    expect(ordinary.length > 0).toBe(spec.ordinary);
    const times = new Set(ordinary.map(e => e.simClockMs));
    const hits = output.events.filter(e => e.kind === 'damage' && e.source === 'enemy' &&
      times.has(e.simClockMs) && !e.dodged && !e.crit);
    if (spec.ordinary) expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      const prior = output.events.slice(0, output.events.indexOf(hit)).reverse().find(e =>
        e.kind === 'status-state' && e.target === 'hero');
      const burning = prior?.kind === 'status-state' && prior.statuses.some(s =>
        (s.id === 'ignite' || s.id === 'burn') && statusActiveAt(s, hit.simClockMs));
      // Existing Ignite enables Physical x1.25, including zero-rate markers.
      expect(hit).toMatchObject({ damageType: 'physical', amount: Math.floor(spec.attacks[1] * (burning ? 1.25 : 1)) });
    }
  });
  it('pins exact level/tier curves and preserves native nonattack stats and factory RNG', () => {
    const probes: [number, MonsterTier][] = [[1, 'trash'], [12, 'trash'], [17, 'elite'],
      [17, 'champion'], [17, 'rare-elite'], [90, 'trash'], [17, 'boss'], [17, 'rare-minion']];
    const def = definition(spec.id);
    expect(def).toMatchObject({ attack: [spec.base, spec.base], attackGrowth: [spec.growth, spec.growth],
      canBeElite: true, canBeBoss: false });
    expect(probes.map(([level, tier]) => build(spec.id, level, tier).stats.attack)).toEqual(spec.attacks);
    expect(probes.map(([level, tier]) => build(spec.id, level, tier).attackRange)).toEqual(spec.attacks.map(value => [value, value]));
    const legacy = { ...def }; Reflect.deleteProperty(legacy, 'attack'); Reflect.deleteProperty(legacy, 'attackGrowth');
    const a = createRng(7), b = createRng(7);
    const authored = buildMonsterUnit({ def, level: 12, tier: 'trash', rng: a });
    const old = buildMonsterUnit({ def: legacy, level: 12, tier: 'trash', rng: b });
    // Mutating a bundled definition also removes its authenticated delivery metadata.
    // Delivery is pinned separately above; compare every other unchanged field here.
    const authoredOther = { ...authored, stats: { ...authored.stats, attack: old.stats.attack } };
    const oldOther = { ...old };
    for (const unit of [authoredOther, oldOther]) {
      Reflect.deleteProperty(unit, 'attackRange');
      Reflect.deleteProperty(unit, 'basicAttackDelivery');
    }
    expect(authoredOther).toEqual(oldOther);
    expect(a.next()).toBe(b.next());
  });
});

it('retains appended elite skills before ordinary fallback', () => {
  const enemy = buildMonsterUnit({ def: definition('monsters/act2.rock-worm'), level: 12,
    tier: 'elite', id: 'enemy', rng: createRng(7), extraSkillIds: ['monster-charge'] });
  expect(enemy.skillOrder).toEqual(['monster-poison-spit', 'monster-charge']);
  const out = runBattleRecorded(input(enemy, 2));
  expect(out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'enemy').slice(0, 4).map(e => e.skillId))
    .toEqual(['monster.poison_spit', 'monster.charge', 'monster.poison_spit', null]);
});

it.each(cases.filter(spec => !spec.ordinary))('allows existing Mana Burn to expose $id ordinary fallback', spec => {
  const enemy = build(spec.id), burned = { ...enemy,
    statuses: [{ id: 'mana-burn', sourceId: 'fixture', remaining: -1, stacks: 1 }] };
  const snapshot = input(burned, spec.act), before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  const actions = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'enemy');
  expect(actions.length).toBeGreaterThan(0);
  expect(actions.every(e => e.skillId === null)).toBe(true);
  expect(out.events.some(e => e.kind === 'damage' && e.source === 'enemy' && !e.dodged && e.amount > 0)).toBe(true);
  expect(runBattle(snapshot)).toEqual(out.result); expect(snapshot).toEqual(before);
});

it('keeps actual Ashen L90 Blood Lords and excludes them from Glacial rosters', () => {
  for (const modifierId of ['ashen', 'glacial']) {
    const { progress } = prepareEndgameAttempt({ heroId: 'hero', modifierId,
      state: emptyEndgameState(), campaign: campaignEvidence() });
    const selected = progress.plan.waves.flatMap(wave => wave.spawns).filter(spawn => spawn.archetypeId === 'monsters/act5.blood-lord');
    expect(selected).toHaveLength(modifierId === 'ashen' ? 6 : 0);
    for (const spawn of selected) {
      expect([spawn.level, spawn.tier]).toEqual([90, 'trash']);
      const enemy = build(spawn.archetypeId, spawn.level, spawn.tier);
      expect(enemy.stats.attack).toBe(596);
      const out = runBattleRecorded(input(enemy, 5));
      expect(out.events.some(e => e.kind === 'action' && e.actor === 'enemy' && e.skillId === 'monster.fire_breath')).toBe(true);
      expect(out.events.some(e => e.kind === 'action' && e.actor === 'enemy' && e.skillId === null)).toBe(true);
    }
  }
});


it.each([
  ['areas/act3-flayer-jungle', 3, 36, [['monsters/act3.fetish', 1], ['monsters/act3.flayer', 5]], 364],
  ['areas/act3-travincal', 3, 43, [['monsters/act3.infector', 3]], 387],
  ['areas/act4-river-of-flame', 4, 56, [['monsters/act4.mega-demon', 1], ['monsters/act4.pit-lord', 3]], 614],
  ['areas/act5-arreat-plateau', 5, 67, [['monsters/act5.death-mauler', 1], ['monsters/act5.blood-lord', 4]], 724]
] as const)('preserves actual %s encounter roster, inherited boss tiers and native level', (id, act, level, groups, attack) => {
  const area = subAreas.find(row => row.id === id); if (!area) throw new Error('Missing native encounter area');
  const plan = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: 'monsters/act1.fallen',
    fallbackLevel: 1, seed: 7, challengeOrdinal: 0 });
  const wave = plan.waves.find(row => row.source?.kind === 'bossEncounter');
  if (!wave) throw new Error('Missing native boss encounter');
  expect(wave.spawns.map(row => [row.archetypeId, row.tier, row.level])).toEqual(
    groups.flatMap(([id, count]) => Array.from({ length: count }, () => [id, 'boss', level])));
  const enemies = wave.spawns.map((spawn, index) => buildMonsterUnit({ def: definition(spawn.archetypeId),
    level: spawn.level, tier: spawn.tier, rng: createRng(index), id: `native-${String(index)}` }));
  expect(enemies.map(e => e.stats.attack)).toEqual(enemies.map(() => attack));
  const hero = input(enemies[0] ?? build('monsters/act1.afflicted'), act).playerTeam;
  const snapshot: CombatSnapshot = { seed: 13, act, playerTeam: hero, enemyTeam: enemies }, before = structuredClone(snapshot);
  const out = runBattleRecorded(snapshot);
  for (const enemy of enemies) {
    const spec = cases.find(row => row.id === enemy.monsterArchetypeId);
    if (!spec) continue;
    const actions = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === enemy.id);
    expect(actions.slice(0, 6).map(e => e.skillId)).toEqual(spec.sequence);
    expect(actions.some(e => e.skillId === null)).toBe(spec.ordinary);
  }
  expect(runBattle(snapshot)).toEqual(out.result); expect(snapshot).toEqual(before);
});

it('pins all seven actual Throne quest sources and their elite Baal Minions', () => {
  const area = subAreas.find(row => row.id === 'areas/act5-throne-of-destruction');
  if (!area) throw new Error('Missing native Throne area');
  const plan = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: 'monsters/act5.baal-minion',
    fallbackLevel: 1, seed: 7, challengeOrdinal: 0, questSourceProjection: 'act5-throne' });
  expect(plan.questSourceProjection).toBe('act5-throne');
  const waves = plan.waves.slice(0, 7), counts = [4, 4, 3, 4, 5, 3, 4], levels = [75, 75, 76, 76, 76, 76, 77];
  expect(waves.map(w => w.id)).toEqual(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7']);
  for (const [index, wave] of waves.entries()) {
    const spawns = wave.spawns.filter(s => s.archetypeId === 'monsters/act5.baal-minion');
    expect(spawns).toHaveLength(counts[index] ?? -1);
    expect(spawns.every(s => s.tier === 'elite' && s.level === levels[index] &&
      s.encounterId === `act5-tod-w${String(index + 1)}-e1`)).toBe(true);
    const enemies = spawns.map((s, i) => buildMonsterUnit({ def: definition(s.archetypeId),
      level: s.level, tier: s.tier, rng: createRng(i), id: `throne-${String(i)}` }));
    const expectedAttack = index < 2 ? 653 : index < 6 ? 661 : 670;
    expect(enemies.every(e => e.stats.attack === expectedAttack)).toBe(true);
    const snapshot: CombatSnapshot = { seed: 13, act: 5,
      playerTeam: input(enemies[0] ?? build('monsters/act5.baal-minion'), 5).playerTeam, enemyTeam: enemies };
    const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
    for (const enemy of enemies) {
      const actions = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === enemy.id);
      expect(actions.slice(0, 4).map(e => e.skillId)).toEqual(['monster.fire_breath', 'monster.poison_cloud', 'monster.fire_breath', 'monster.poison_cloud']);
      expect(actions.some(e => e.skillId === null)).toBe(false);
    }
    expect(runBattle(snapshot)).toEqual(out.result); expect(snapshot).toEqual(before);
  }
});
