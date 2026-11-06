import { afterEach, beforeEach, expect, it } from 'vitest';
import { subAreas } from '../data';
import { loadGameData } from '../data/loader';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '../engine/combat/combat';
import { resolveChallengeWavePlan } from '../engine/combat/sub-area-run';
import type { CombatUnit } from '../engine/combat/types';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../engine/skills/registry';
import { buildEnemiesForWave } from './combatHelpers';
import { applyEventToTeams } from './combatPlayback';

beforeEach(() => {
  resetRegistry(); loadDefaultSkills();
  registerSkill({ id: 'fixture.diablo-stun', archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, manaCost: 0, cooldown: 100,
    effects: [{ kind: 'debuff', statusId: 'stun', durationMs: 4000 }] });
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each(['manual', 'idle'] as const)('native %s Diablo uses quarter-duration Stun and playback expires it at the same instant', async mode => {
  const data = await loadGameData();
  const area = subAreas.find(row => row.id === 'areas/act4-chaos-sanctuary');
  if (!area) throw new Error('Missing native Chaos Sanctuary');
  expect(data.subAreas.get(area.id)).toEqual(area);
  const plan = resolveChallengeWavePlan({ subArea: area, mode, seed: 13,
    challengeOrdinal: 450, fallbackArchetypeId: 'monsters/act4.diablo', fallbackLevel: area.areaLevel });
  const wave = plan.waves.find(row => row.source?.kind === 'chapterBoss');
  if (!wave) throw new Error('Missing native Diablo wave');
  const waveBefore = structuredClone(wave), enemies = buildEnemiesForWave(wave, 13), boss = enemies[0];
  if (!boss) throw new Error('Missing native Diablo');
  expect(boss).toMatchObject({ stunDurationMultiplier: .25, tier: 'chapter-boss',
    stats: { lifeMax: 44800, attack: 420, defense: 460, attackSpeed: 140 } });
  // Synthetic durable caster; native boss stats/source/projection are unmodified.
  const hero: CombatUnit = { id: 'hero', name: 'hero', kind: 'hero', side: 'player',
    level: 75, tier: 'trash', life: 100_000, mana: 1000,
    stats: { life: 100_000, lifeMax: 100_000, mana: 1000, manaMax: 1000,
      attack: 0, defense: 0, magicResist: 0, attackSpeed: 200, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], skillOrder: ['fixture.diablo-stun'], activeBuffIds: [], cooldowns: {}, enraged: false };
  const input: CombatSnapshot = { seed: 13, act: 4, maxRounds: 6, playerTeam: [hero], enemyTeam: enemies };
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: boss.id,
    simClockMs: 900, statuses: [expect.objectContaining({ id: 'stun', appliedAtMs: 900, expiresAtMs: 1900 })] }));
  expect(out.events.some(e => e.kind === 'action' && e.actor === boss.id && e.simClockMs >= 900 && e.simClockMs < 1900)).toBe(false);
  expect(out.events.some(e => e.kind === 'action' && e.actor === boss.id && e.simClockMs >= 1900)).toBe(true);
  let teams = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam };
  let sawExpiry = false;
  for (const event of out.events) {
    teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event);
    if (event.kind === 'status-state' && event.target === boss.id && event.simClockMs === 1900) {
      expect(teams.enemyTeam.find(unit => unit.id === boss.id)?.statuses).toEqual([]);
      sawExpiry = true;
    }
  }
  expect(sawExpiry).toBe(true);
  expect(input).toEqual(before);
  expect(wave).toEqual(waveBefore);
  expect(runBattle(input)).toEqual(out.result);
});
