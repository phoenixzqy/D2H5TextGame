import { afterEach, beforeEach, expect, it } from 'vitest';
import { subAreas } from '../data';
import { loadGameData, validateGameData } from '../data/loader';
import monsterSchema from '../data/schema/monster.schema.json';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '../engine/combat/combat';
import { resolveChallengeWavePlan } from '../engine/combat/sub-area-run';
import type { CombatUnit } from '../engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '../engine/skills/registry';
import { buildEnemiesForWave } from './combatHelpers';
import i18n from '../i18n';
import { eventToLocalizedLogEntry } from './eventToLogI18n';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

function target(id: string, kind: 'hero' | 'merc' | 'summon'): CombatUnit {
  return {
    id, name: id, kind, side: 'player', level: 40, tier: 'trash',
    life: 100_000, mana: 0,
    ...(kind === 'summon' ? { summonOwnerId: 'hero' } : {}),
    stats: {
      life: 100_000, lifeMax: 100_000, mana: 0, manaMax: 0,
      attack: 0, defense: 0, magicResist: 0, attackSpeed: 100,
      critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 }
    },
    statuses: [], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false
  };
}

it.each(['manual', 'idle'] as const)(
  'native %s Mephisto actually casts all three elements without changing chapter stats',
  async mode => {
    const data = await loadGameData();
    const area = subAreas.find(row => row.id === 'areas/act3-durance-of-hate');
    if (!area) throw new Error('Missing native Durance');
    expect(data.subAreas.get(area.id)).toEqual(area);
    const plan = resolveChallengeWavePlan({ subArea: area, mode, seed: 13,
      challengeOrdinal: 450, fallbackArchetypeId: 'monsters/act3.mephisto',
      fallbackLevel: area.areaLevel });
    const wave = plan.waves.find(row => row.source?.kind === 'chapterBoss');
    if (!wave) throw new Error('Missing native chapter boss');
    const waveBefore = structuredClone(wave);
    expect(wave.source).toEqual({ kind: 'chapterBoss', archetypeId: 'monsters/act3.mephisto' });
    expect(wave.spawns).toHaveLength(1);
    expect(wave.spawns[0]?.chapterBoss).toMatchObject({
      hp: 4200, atk: 300, def: 360, dropTable: 'loot/act3-boss'
    });
    const enemies = buildEnemiesForWave(wave, 13);
    const boss = enemies[0];
    if (!boss) throw new Error('Missing native Mephisto');
    expect(boss.monsterArchetypeId).toBe('monsters/act3.mephisto');
    expect(boss.stats).toMatchObject({ lifeMax: 33_600, attack: 300, defense: 360, attackSpeed: 120 });
    expect(boss.skillOrder).toEqual(['monster-frost-nova', 'monster-lightning', 'monster-mephisto-poison-cloud']);
    const snapshot: CombatSnapshot = { seed: 13, act: 3,
      playerTeam: [target('hero', 'hero'), target('merc', 'merc'), target('summon', 'summon')],
      enemyTeam: enemies };
    const before = structuredClone(snapshot);
    const recorded = runBattleRecorded(snapshot);
    const actions = recorded.events.flatMap(event => event.kind === 'action' && event.actor === boss.id
      ? [[event.simClockMs, event.skillId] as const] : []);
    expect(actions.slice(0, 6)).toEqual([
      [1540, 'monster.frost_nova'], [3080, 'monster.lightning'], [4620, 'monster.mephisto_poison_cloud'],
      [6160, 'monster.frost_nova'], [7700, 'monster.lightning'], [9240, 'monster.mephisto_poison_cloud']
    ]);
    for (const unit of snapshot.playerTeam) {
      for (const [damageType, statusId, simClockMs] of [
        ['cold', 'chill', 1540], ['poison', 'poison', 4620]
      ] as const) {
        // Native spells retain their ordinary miss roll, even with zero dodge.
        // Prove initial AoE targeting and an actual successful hit/status separately.
        expect(recorded.events).toContainEqual(expect.objectContaining({
          kind: 'damage', source: boss.id, target: unit.id, damageType, simClockMs
        }));
        const hit = recorded.events.find(event => event.kind === 'damage' &&
          event.source === boss.id && event.target === unit.id &&
          event.damageType === damageType && !event.dodged && event.amount > 0);
        expect(hit).toMatchObject({ kind: 'damage', dodged: false });
        if (hit?.kind !== 'damage') throw new Error('Missing elemental hit');
        expect(hit.amount).toBeGreaterThan(0);
        if (statusId === 'poison') {
          const observed = recorded.events.find(event => event.kind === 'status-state' &&
            event.target === unit.id && event.simClockMs === hit.simClockMs &&
            event.statuses.some(status => status.id === 'poison'));
          if (observed?.kind !== 'status-state') throw new Error('Missing native poison state');
          expect(observed.statuses.find(status => status.id === 'poison')).toMatchObject({
            stacks: 3, sourceId: boss.id, dotPerStack: Math.max(1, Math.floor(hit.amount * .05)),
            appliedAtMs: hit.simClockMs, expiresAtMs: hit.simClockMs + 5000
          });
        }
        expect(recorded.events).toContainEqual(expect.objectContaining({
          kind: 'status', target: unit.id, statusId, simClockMs: hit.simClockMs
        }));
      }
    }
    const cloud = recorded.events.find(event => event.kind === 'action' &&
      event.skillId === 'monster.mephisto_poison_cloud');
    if (!cloud) throw new Error('Missing native cloud action');
    const previousLanguage = i18n.language;
    try {
      for (const [locale, name] of [['en', 'Poison Cloud'], ['zh-CN', '毒云']] as const) {
        await i18n.changeLanguage(locale);
        expect(eventToLocalizedLogEntry(cloud)?.message).toContain(name);
        expect(eventToLocalizedLogEntry(cloud)?.message).not.toContain('monster.mephisto_poison_cloud');
      }
    } finally { await i18n.changeLanguage(previousLanguage); }
    const lightning = recorded.events.filter(event => event.kind === 'damage' &&
      event.source === boss.id && event.damageType === 'lightning' && event.simClockMs === 3080);
    expect(lightning).toHaveLength(1);
    expect(recorded.events.some(event => event.kind === 'status' && event.statusId === 'paralyze')).toBe(true);
    expect(snapshot).toEqual(before);
    expect(wave).toEqual(waveBefore);
    expect(buildEnemiesForWave(wave, 13)).toEqual(enemies);
    expect(runBattle(snapshot)).toEqual(recorded.result);
    expect(runBattleRecorded(snapshot)).toEqual(recorded);
  }
);

it('validates monster-specific cooldown metadata at the real data boundary', async () => {
  const data = await loadGameData();
  const def = data.monsters.get('monsters/act3.mephisto');
  if (!def) throw new Error('Missing native Mephisto');
  expect(def.skillCooldownOverrides).toEqual({ 'monster.frost_nova': 4 });
  expect(() => validateGameData(monsterSchema.$id, def)).not.toThrow();
  for (const invalid of [null, {}, [], 4, { 'monster.frost_nova': 0 },
    { 'monster.frost_nova': -1 }, { 'monster.frost_nova': .5 },
    { 'monster.frost_nova': '4' }, { 'monster.frost_nova': Infinity },
    { 'monster-frost-nova': 4 }, { 'sorceress.frost_nova': 4 }]) {
    expect(() => validateGameData(monsterSchema.$id,
      { ...def, skillCooldownOverrides: invalid })).toThrow();
  }
});
