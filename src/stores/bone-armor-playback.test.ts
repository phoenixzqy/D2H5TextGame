import { expect, it } from 'vitest';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { playerToCombatUnit } from './combatHelpers';
import { applyEventToTeams, stageStatusPlayback } from './combatPlayback';
import { eventToLocalizedLogEntry } from './eventToLogI18n';

it('plays actual absorbed HP damage and authoritative pool depletion before terminal playback', () => {
  const p = { ...createMockPlayer('Shield playback fixture', 'necromancer'),
    comboOrder: [], skillLevels: { 'necromancer.bone_armor': 1 } };
  const input = playerToCombatUnit(p);
  const hero = { ...input, life: 1000, stats: { ...input.stats, lifeMax: 1000, defense: 0,
    physDodge: 0, magicDodge: 0 },
    statuses: [...input.statuses, { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
  const enemy = { ...hero, id: 'enemy', name: 'enemy', side: 'enemy' as const, kind: 'monster' as const,
    statuses: [], stats: { ...hero.stats, attack: 20, critChance: 0 } };
  const r = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [enemy] });
  let players: readonly CombatUnit[] = [hero], enemies: readonly CombatUnit[] = [enemy];
  let statusPlayback = stageStatusPlayback(players, enemies, r.events);
  let sawAbsorption = false;
  for (const event of r.events) {
    const next = applyEventToTeams(players, enemies, event, statusPlayback);
    players = next.playerTeam; enemies = next.enemyTeam;
    statusPlayback = next.statusPlayback ?? statusPlayback;
    if (event.kind === 'damage' && (event.absorbed ?? 0) > 0) {
      sawAbsorption = true;
      expect(players[0]?.life).toBe(992);
    }
    if (sawAbsorption && event.kind === 'status-state' && event.target === hero.id)
      expect(players[0]?.statuses.some(s => s.id === 'bone-armor')).toBe(false);
  }
  expect(sawAbsorption).toBe(true);
  expect(players[0]?.life).toBe(r.result.playerTeam[0]?.life);
  expect(players[0]?.statuses).toEqual(r.result.playerTeam[0]?.statuses);
  expect(players[0]?.statuses.some(s => s.id === 'bone-armor')).toBe(false);
});

for (const locale of ['en', 'zh-CN'] as const) it('explains actual direct and periodic absorption in ' + locale, async () => {
  await i18n.changeLanguage(locale);
  for (const event of [
    { kind: 'damage' as const, source: 'enemy', target: 'hero', damageType: 'fire', amount: 0, absorbed: 12, crit: false, dodged: false },
    { kind: 'dot' as const, target: 'hero', amount: 3, absorbed: 7 }
  ]) {
    const log = eventToLocalizedLogEntry(event, new Map([['hero', 'Hero']]));
    expect(log?.message).toContain(locale === 'en' ? 'Bone Armor absorbs ' + String(event.absorbed) : '骨甲吸收了' + String(event.absorbed));
    expect(log?.value).toBe(event.amount);
    expect(log?.message).not.toMatch(/\{\{|combat:/);
  }
});
