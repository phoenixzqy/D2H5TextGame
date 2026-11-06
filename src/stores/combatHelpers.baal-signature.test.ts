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
import { applyEventToTeams } from './combatPlayback';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

// Durable, stunned diagnostic subjects; no campaign or balance credit.
function target(id: string, kind: 'hero' | 'merc' | 'summon'): CombatUnit {
  return {
    id, name: id, kind, side: 'player', level: 75, tier: 'trash', life: 100_000, mana: 1000,
    ...(kind === 'summon' ? { summonOwnerId: 'hero' } : {}),
    stats: { life: 100_000, lifeMax: 100_000, mana: 1000, manaMax: 1000,
      attack: 0, defense: 0, magicResist: 0, attackSpeed: 100,
      critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false
  };
}

it.each(['manual', 'idle'] as const)('native %s Baal executes cold/fire/arcane and its fourth action with unchanged chapter stats', async mode => {
  const data = await loadGameData();
  const area = subAreas.find(row => row.id === 'areas/act5-throne-of-destruction');
  if (!area) throw new Error('Missing native Throne');
  expect(data.subAreas.get(area.id)).toEqual(area);
  const plan = resolveChallengeWavePlan({ subArea: area, mode, seed: 13,
    challengeOrdinal: 450, fallbackArchetypeId: 'monsters/act5.baal', fallbackLevel: area.areaLevel });
  const wave = plan.waves.find(row => row.source?.kind === 'chapterBoss');
  if (!wave) throw new Error('Missing native Baal chapter wave');
  const waveBefore = structuredClone(wave);
  expect(wave.source).toEqual({ kind: 'chapterBoss', archetypeId: 'monsters/act5.baal' });
  expect(wave.spawns).toHaveLength(1);
  expect(wave.spawns[0]?.chapterBoss).toMatchObject({ hp: 7200, atk: 520, def: 560, dropTable: 'loot/act5-boss' });
  const enemies = buildEnemiesForWave(wave, 13), boss = enemies[0];
  if (!boss) throw new Error('Missing native Baal');
  expect(boss).toMatchObject({ monsterArchetypeId: 'monsters/act5.baal', tier: 'chapter-boss',
    stats: { lifeMax: 57600, attack: 520, defense: 560, attackSpeed: 150 } });
  const input: CombatSnapshot = { seed: 13, act: 5, enemyTeam: enemies,
    playerTeam: [target('hero', 'hero'), target('merc', 'merc'), target('summon', 'summon')] };
  const before = structuredClone(input), out = runBattleRecorded(input);
  const actions = out.events.flatMap(event => event.kind === 'action' && event.actor === boss.id
    ? [[event.simClockMs, event.skillId] as const] : []);
  expect(actions.slice(0, 8)).toEqual([
    [1300, 'monster.baal_frost_nova'], [2600, 'monster.baal_inferno'],
    [3900, 'monster.baal_mana_rift'], [5200, 'monster.tentacles'],
    [6500, 'monster.baal_frost_nova'], [7800, 'monster.baal_inferno'],
    [9100, 'monster.baal_mana_rift'], [10400, null]
  ]);
  const tentacles = out.events.filter(event => event.kind === 'summon');
  expect(tentacles).toHaveLength(5);
  let teams = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam };
  for (const event of tentacles) {
    expect(event).toMatchObject({ owner: boss.id, summonId: 'baal_tentacle', simClockMs: 5200,
      unit: { tier: 'trash', kind: 'summon', level: boss.level, summonOwnerId: boss.id } });
    teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event);
    expect(out.events.some(hit => hit.kind === 'damage' && hit.source === event.unit.id && !hit.dodged && hit.amount > 0)).toBe(true);
  }
  expect(teams.enemyTeam).toHaveLength(6);
  expect(out.events.some(event => event.kind === 'damage' && event.source === boss.id && event.simClockMs === 5200)).toBe(false);
  for (const unit of input.playerTeam) {
    for (const [type, status, at] of [['cold', 'freeze', 1300], ['fire', 'ignite', 2600], ['arcane', 'mana-burn', 3900]] as const) {
      expect(out.events).toContainEqual(expect.objectContaining({ kind: 'damage', source: boss.id,
        target: unit.id, damageType: type, simClockMs: at }));
      const hit = out.events.find(event => event.kind === 'damage' && event.source === boss.id &&
        event.target === unit.id && event.damageType === type && !event.dodged && event.amount > 0);
      if (hit?.kind !== 'damage') throw new Error('Missing landed native elemental hit');
      expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status', target: unit.id,
        statusId: status, simClockMs: hit.simClockMs }));
      if (type === 'fire') {
        const melted = out.events.find(event => event.kind === 'status-state' && event.target === unit.id &&
          event.simClockMs === hit.simClockMs && event.statuses.some(status => status.id === 'armor-melt'));
        if (melted?.kind !== 'status-state') throw new Error('Missing native Armor Melt');
        expect(melted.statuses).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: 'ignite', stacks: 5, sourceId: boss.id,
              dotPerStack: Math.max(1, Math.floor(hit.amount * .1)), expiresAtMs: hit.simClockMs + 3000 }),
            expect.objectContaining({ id: 'armor-melt', sourceId: boss.id, expiresAtMs: hit.simClockMs + 3000 })
          ]));
      }
    }
    expect(out.events.some(event => event.kind === 'mana' && event.target === unit.id &&
      event.reason === 'mana-burn')).toBe(true);
  }
  const previousLanguage = i18n.language;
  try {
    for (const [locale, names] of [['en', ['Frost Nova', 'Inferno', 'Mana Rift']], ['zh-CN', ['冰霜新星', '炼狱', '法力裂隙']]] as const) {
      await i18n.changeLanguage(locale);
      for (const [index, id] of ['monster.baal_frost_nova', 'monster.baal_inferno', 'monster.baal_mana_rift'].entries()) {
        const event = out.events.find(event => event.kind === 'action' && event.skillId === id);
        if (!event) throw new Error('Missing spell action');
        expect(eventToLocalizedLogEntry(event)?.message).toContain(names[index]);
        expect(eventToLocalizedLogEntry(event)?.message).not.toContain(id);
      }
      const tentacle = tentacles[0];
      if (!tentacle) throw new Error('Missing native summon log');
      const message = eventToLocalizedLogEntry(tentacle)?.message;
      expect(message).toContain(locale === 'en' ? 'Festering Tentacle' : '腐化触须');
      expect(message).not.toContain('baal_tentacle');
    }
  } finally { await i18n.changeLanguage(previousLanguage); }
  expect(wave).toEqual(waveBefore);
  expect(input).toEqual(before);
  expect(buildEnemiesForWave(wave, 13)).toEqual(enemies);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
});
