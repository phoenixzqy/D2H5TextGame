import { afterEach, beforeEach, expect, it } from 'vitest';
import { subAreas } from '../data';
import { loadGameData } from '../data/loader';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '../engine/combat/combat';
import { resolveChallengeWavePlan } from '../engine/combat/sub-area-run';
import type { CombatUnit } from '../engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '../engine/skills/registry';
import { buildEnemiesForWave } from './combatHelpers';
import i18n from '../i18n';
import { eventToLocalizedLogEntry } from './eventToLogI18n';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

// Durable diagnostic controls; these are not earned campaign characters.
function target(id: string, kind: 'hero' | 'merc' | 'summon', row: number, col: number): CombatUnit {
  return {
    id, name: id, kind, side: 'player', level: 40, tier: 'trash', life: 100_000, mana: 0,
    gridPosition: { row, col }, ...(kind === 'summon' ? { summonOwnerId: 'hero' } : {}),
    stats: { life: 100_000, lifeMax: 100_000, mana: 0, manaMax: 0,
      attack: 0, defense: 0, magicResist: 0, attackSpeed: 100,
      critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false
  };
}

it.each(['manual', 'idle'] as const)('native %s Diablo executes all four moves with unchanged chapter stats', async mode => {
  const data = await loadGameData();
  const area = subAreas.find(row => row.id === 'areas/act4-chaos-sanctuary');
  if (!area) throw new Error('Missing native Chaos Sanctuary');
  expect(data.subAreas.get(area.id)).toEqual(area);
  const plan = resolveChallengeWavePlan({ subArea: area, mode, seed: 13,
    challengeOrdinal: 450, fallbackArchetypeId: 'monsters/act4.diablo', fallbackLevel: area.areaLevel });
  const wave = plan.waves.find(row => row.source?.kind === 'chapterBoss');
  if (!wave) throw new Error('Missing native chapter boss');
  const waveBefore = structuredClone(wave);
  expect(wave.source).toEqual({ kind: 'chapterBoss', archetypeId: 'monsters/act4.diablo' });
  expect(wave.spawns).toHaveLength(1);
  expect(wave.spawns[0]?.chapterBoss).toMatchObject({ hp: 5600, atk: 420, def: 460, dropTable: 'loot/act4-boss' });
  const enemies = buildEnemiesForWave(wave, 13), boss = enemies[0];
  if (!boss) throw new Error('Missing native Diablo');
  expect(boss).toMatchObject({ monsterArchetypeId: 'monsters/act4.diablo', tier: 'chapter-boss',
    stats: { lifeMax: 44800, attack: 420, defense: 460, attackSpeed: 140 } });
  const snapshot: CombatSnapshot = { seed: 13, act: 4, enemyTeam: enemies,
    playerTeam: [target('hero', 'hero', 0, 2), target('merc', 'merc', 1, 1), target('summon', 'summon', 1, 2)] };
  const before = structuredClone(snapshot), recorded = runBattleRecorded(snapshot);
  const actions = recorded.events.flatMap(event => event.kind === 'action' && event.actor === boss.id
    ? [[event.simClockMs, event.skillId] as const] : []);
  expect(actions.slice(0, 8)).toEqual([
    [1380, 'monster.diablo_fire_breath'], [2760, 'monster.diablo_lightning'],
    [4140, 'monster.bone_prison'], [5520, 'monster.charge'],
    [6900, 'monster.diablo_fire_breath'], [8280, 'monster.diablo_lightning'],
    [9660, 'monster.bone_prison'], [11040, 'monster.charge']
  ]);
  expect(boss.skillOrder).toEqual(['monster-diablo-fire-breath', 'monster-diablo-lightning', 'monster-bone-prison', 'monster-charge']);
  for (const [damageType, statusId, at] of [['fire', 'ignite', 1380], ['lightning', 'paralyze', 2760]] as const) {
    for (const unit of snapshot.playerTeam) {
      expect(recorded.events).toContainEqual(expect.objectContaining({ kind: 'damage', source: boss.id,
        target: unit.id, damageType, simClockMs: at }));
    }
    expect(recorded.events.some(event => event.kind === 'status' && event.statusId === statusId)).toBe(true);
  }
  expect(recorded.events.some(event => event.kind === 'status' && event.statusId === 'monster-bone-prison')).toBe(true);
  const charge = recorded.events.find(event => event.kind === 'damage' && event.source === boss.id &&
    event.damageType === 'physical' && event.simClockMs === 5520);
  if (charge?.kind !== 'damage') throw new Error('Missing native Charge impact');
  expect(charge.dodged).toBe(false);
  const crit = charge.crit ? boss.stats.critDamage : 1;
  expect(charge.amount).toBeGreaterThanOrEqual(Math.floor(480 * crit));
  expect(charge.amount).toBeLessThanOrEqual(Math.floor(510 * crit));
  const prison = recorded.events.find(event => event.kind === 'status-state' &&
    event.statuses.some(status => status.id === 'monster-bone-prison'));
  if (prison?.kind !== 'status-state') throw new Error('Missing paid prison state');
  expect(prison.statuses.find(status => status.id === 'monster-bone-prison')).toMatchObject({
    sourceId: boss.id, stacks: 1, appliedAtMs: prison.simClockMs, expiresAtMs: prison.simClockMs + 2000
  });
  expect(recorded.events.some(event => event.kind === 'action' && event.actor === prison.target &&
    event.simClockMs >= prison.simClockMs && event.simClockMs < prison.simClockMs + 2000)).toBe(false);
  expect(recorded.events.some(event => event.kind === 'action' && event.actor === prison.target &&
    event.simClockMs >= prison.simClockMs + 2000)).toBe(true);
  const previousLanguage = i18n.language;
  try {
    for (const [locale, names] of [['en', ['Fire Breath', 'Lightning']], ['zh-CN', ['火焰吐息', '闪电']]] as const) {
      await i18n.changeLanguage(locale);
      for (const [index, id] of ['monster.diablo_fire_breath', 'monster.diablo_lightning'].entries()) {
        const event = recorded.events.find(event => event.kind === 'action' && event.skillId === id);
        if (!event) throw new Error('Missing native spell action');
        expect(eventToLocalizedLogEntry(event)?.message).toContain(names[index]);
        expect(eventToLocalizedLogEntry(event)?.message).not.toContain(id);
      }
    }
  } finally { await i18n.changeLanguage(previousLanguage); }
  expect(wave).toEqual(waveBefore);
  expect(snapshot).toEqual(before);
  expect(buildEnemiesForWave(wave, 13)).toEqual(enemies);
  expect(runBattle(snapshot)).toEqual(recorded.result);
  expect(runBattleRecorded(snapshot)).toEqual(recorded);
});
