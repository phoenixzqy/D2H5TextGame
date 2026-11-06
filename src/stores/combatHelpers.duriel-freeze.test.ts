import { afterEach, beforeEach, expect, it } from 'vitest';
import { subAreas } from '../data';
import { loadGameData, validateGameData } from '../data/loader';
import monsterSchema from '../data/schema/monster.schema.json';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '../engine/combat/combat';
import { resolveChallengeWavePlan } from '../engine/combat/sub-area-run';
import type { CombatUnit } from '../engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '../engine/skills/registry';
import { buildEnemiesForWave } from './combatHelpers';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

// Diagnostic caster, not an earned campaign character. Native Ice Blast carries
// both guaranteed Freeze and Chill, so the positive hit proves selective refusal.
function caster(): CombatUnit {
  return {
    id: 'hero', name: 'hero', side: 'player', kind: 'hero', tier: 'trash', level: 32,
    life: 100_000, mana: 12,
    stats: { life: 100_000, lifeMax: 100_000, mana: 12, manaMax: 12,
      attack: 0, defense: 0, magicResist: 0, attackSpeed: 100,
      critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, cold: 0, fire: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [], cooldowns: {}, activeBuffIds: [], enraged: false,
    skillOrder: ['skills-sorceress-ice-blast'],
    skillLevels: { 'skills-sorceress-ice-blast': 1 }
  };
}

it.each(['manual', 'idle'] as const)('native %s Tomb Duriel takes cold damage and Chill but rejects Freeze', async mode => {
  const data = await loadGameData();
  const area = subAreas.find(row => row.id === 'areas/act2-tomb-of-tal-rasha');
  if (!area) throw new Error('Missing native Tomb');
  const wave = resolveChallengeWavePlan({ subArea: area, mode, seed: 13,
    challengeOrdinal: 450, fallbackArchetypeId: 'monsters/act2.duriel', fallbackLevel: area.areaLevel
  }).waves.find(row => row.spawns.some(spawn => spawn.tier === 'chapter-boss'));
  if (!wave) throw new Error('Missing native Duriel wave');
  const beforeWave = structuredClone(wave);
  const enemies = buildEnemiesForWave(wave, 13);
  const duriel = enemies[0];
  if (!duriel) throw new Error('Missing native Duriel');
  const snapshot: CombatSnapshot = { seed: 13, act: 2, maxRounds: 3,
    playerTeam: [caster()], enemyTeam: enemies };
  const before = structuredClone(snapshot);
  const recorded = runBattleRecorded(snapshot);
  const hits = recorded.events.filter(event => event.kind === 'damage' &&
    event.source === 'hero' && event.target === duriel.id && event.damageType === 'cold');
  expect(hits).toHaveLength(1);
  expect(hits[0]).toMatchObject({ dodged: false });
  if (hits[0]?.kind !== 'damage') throw new Error('Missing Ice Blast hit');
  expect(hits[0].amount).toBeGreaterThan(0);
  const statuses = recorded.events.filter(event => event.kind === 'status' && event.target === duriel.id);
  expect(statuses.map(event => event.kind === 'status' ? event.statusId : '')).toEqual(['chill']);
  expect(recorded.events.flatMap(event => event.kind === 'status-state' && event.target === duriel.id
    ? event.statuses.map(status => status.id) : [])).not.toContain('freeze');
  expect(duriel).toMatchObject({ monsterArchetypeId: 'monsters/act2.duriel', statusImmunities: ['freeze'] });
  expect(data.monsters.get('monsters/act2.duriel')).toMatchObject({ statusImmunities: ['freeze'] });
  expect(duriel.stats).toMatchObject({ lifeMax: 25_600, attack: 350, defense: 280 });
  expect(snapshot).toEqual(before);
  expect(wave).toEqual(beforeWave);
  expect(runBattle(snapshot)).toEqual(recorded.result);
});

it('validates authored Freeze immunity and rejects malformed immunity metadata', async () => {
  const data = await loadGameData();
  const duriel = data.monsters.get('monsters/act2.duriel');
  if (!duriel) throw new Error('Missing native Duriel');
  expect(() => validateGameData(monsterSchema.$id, { ...duriel, statusImmunities: ['freeze'] })).not.toThrow();
  for (const invalid of ['freeze', ['Freeze'], ['freeze', 'freeze'], [100], ['unknown']]) {
    expect(() => validateGameData(monsterSchema.$id, { ...duriel, statusImmunities: invalid })).toThrow();
  }
});
