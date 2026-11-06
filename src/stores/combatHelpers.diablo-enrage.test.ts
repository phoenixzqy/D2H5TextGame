import { afterEach, beforeEach, expect, it } from 'vitest';
import { subAreas } from '../data';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '../engine/combat/combat';
import { resolveChallengeWavePlan } from '../engine/combat/sub-area-run';
import type { CombatUnit } from '../engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '../engine/skills/registry';
import { buildEnemiesForWave } from './combatHelpers';
import i18n from '../i18n';
import { eventToLocalizedLogEntry } from './eventToLogI18n';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

// Diagnostic controls, not earned campaign characters or balance evidence.
function fixture(mode: 'manual' | 'idle', fraction: number): CombatSnapshot {
  const area = subAreas.find(row => row.id === 'areas/act4-chaos-sanctuary');
  if (!area) throw new Error('Missing native Chaos Sanctuary');
  const plan = resolveChallengeWavePlan({ subArea: area, mode, seed: 13,
    challengeOrdinal: 450, fallbackArchetypeId: 'monsters/act4.diablo', fallbackLevel: area.areaLevel });
  const wave = plan.waves.find(row => row.source?.kind === 'chapterBoss');
  if (!wave) throw new Error('Missing native chapter boss');
  expect(wave.source).toEqual({ kind: 'chapterBoss', archetypeId: 'monsters/act4.diablo' });
  const boss = buildEnemiesForWave(wave, 13)[0];
  if (!boss) throw new Error('Missing native Diablo');
  const hero: CombatUnit = {
    id: 'hero', name: 'hero', kind: 'hero', side: 'player', level: 40, tier: 'trash',
    life: 1_000_000, mana: 0, gridPosition: { row: 0, col: 2 },
    stats: { life: 1_000_000, lifeMax: 1_000_000, mana: 0, manaMax: 0,
      attack: 0, defense: 0, magicResist: 0, attackSpeed: 100,
      critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false
  };
  return { seed: 13, act: 4, enemyTeam: [{ ...boss, life: boss.stats.lifeMax * fraction }], playerTeam: [hero] };
}

it.each(['manual', 'idle'] as const)('native %s Diablo enrages exactly at 15%% with faster, stronger hits and localized feedback', async mode => {
  const input = fixture(mode, .15), before = structuredClone(input), boss = input.enemyTeam[0];
  if (!boss) throw new Error('Missing boss');
  const out = runBattleRecorded(input);
  const enrage = out.events.filter(event => event.kind === 'enrage');
  expect(enrage).toHaveLength(1);
  expect(enrage[0]).toMatchObject({ target: boss.id, simClockMs: 0 });
  expect(boss.enrage).toEqual({ lifeFraction: .15, attackSpeedMultiplier: 2, damagePct: 50 });
  expect(Object.isFrozen(boss.enrage)).toBe(true);
  expect(boss).toMatchObject({ tier: 'chapter-boss', monsterArchetypeId: 'monsters/act4.diablo',
    stats: { lifeMax: 44800, attack: 420, defense: 460, attackSpeed: 140 } });
  const times = out.events.flatMap(event => event.kind === 'action' && event.actor === boss.id ? [event.simClockMs] : []);
  // AS280 reaches the existing 400ms global action-period floor.
  expect(times.slice(0, 4)).toEqual([400, 800, 1200, 1600]);
  // Charge now lands during Fire Breath's 3s Burn: the existing physical combo is x1.25.
  const burn = out.events.find(event => event.kind === 'status-state' && event.target === 'hero' &&
    event.simClockMs === 400 && event.statuses.some(status => status.id === 'ignite'));
  if (burn?.kind !== 'status-state') throw new Error('Missing native Burn before Charge');
  expect(burn.statuses.find(status => status.id === 'ignite')).toMatchObject({ stacks: 3, expiresAtMs: 3400 });
  for (const [type, min, max, combo] of [['fire', 40, 60, 1], ['physical', 480, 510, 1.25]] as const) {
    const hit = out.events.find(event => event.kind === 'damage' && event.source === boss.id && event.damageType === type);
    if (hit?.kind !== 'damage') throw new Error('Missing native enraged hit');
    expect(hit.dodged).toBe(false);
    const crit = hit.crit ? boss.stats.critDamage : 1;
    expect(hit.amount).toBeGreaterThanOrEqual(Math.floor(min * 1.5 * combo * crit));
    expect(hit.amount).toBeLessThanOrEqual(Math.floor(max * 1.5 * combo * crit));
  }
  const previous = i18n.language;
  try {
    for (const [locale, message] of [['en', 'Diablo becomes enraged!'], ['zh-CN', '迪亚波罗陷入狂怒！']] as const) {
      await i18n.changeLanguage(locale);
      const event = enrage[0];
      if (!event) throw new Error('Missing enrage feedback');
      expect(eventToLocalizedLogEntry(event, new Map([[boss.id, locale === 'en' ? 'Diablo' : '迪亚波罗']])))
        .toMatchObject({ type: 'buff', actorId: boss.id, message });
    }
  } finally { await i18n.changeLanguage(previous); }
  expect(out.result.enemyTeam[0]).toMatchObject({ enraged: true, stats: boss.stats });
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
});

it('keeps native Diablo at ordinary cadence and damage immediately above 15%', () => {
  const input = fixture('manual', .1501), boss = input.enemyTeam[0];
  if (!boss) throw new Error('Missing boss');
  const out = runBattleRecorded(input);
  expect(out.events.some(event => event.kind === 'enrage')).toBe(false);
  const times = out.events.flatMap(event => event.kind === 'action' && event.actor === boss.id ? [event.simClockMs] : []);
  expect(times.slice(0, 4)).toEqual([1380, 2760, 4140, 5520]);
  const hit = out.events.find(event => event.kind === 'damage' && event.source === boss.id && event.damageType === 'fire');
  if (hit?.kind !== 'damage') throw new Error('Missing ordinary Fire Breath');
  const crit = hit.crit ? boss.stats.critDamage : 1;
  expect(hit.amount).toBeGreaterThanOrEqual(Math.floor(40 * crit));
  expect(hit.amount).toBeLessThanOrEqual(Math.floor(60 * crit));
  expect(out.result.enemyTeam[0]?.enraged).toBe(false);
});
