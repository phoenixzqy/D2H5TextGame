import { beforeEach, describe, expect, it } from 'vitest';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { applyEventToTeams } from './combatPlayback';
import { eventToLocalizedLogEntry } from './eventToLogI18n';

function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', tier: 'trash', level: 30,
    stats: { life: 100, lifeMax: 100, mana: 100, manaMax: 100, attack: 0, defense: 0,
      magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    life: 75, mana: 100, statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
describe('authoritative Vigor capacity playback', () => {
  it('replays actual increased-cap healing and source-death removal exactly without inventing resource logs', () => {
    registerSkill({ id: 'fixture.vigor-heal', archetype: 'fixture', target: 'self', minLevel: 1,
      cooldown: 60, manaCost: 0, effects: [{ kind: 'heal', target: 'self', amount: 1000 }] });
    const hold = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
    const hero = { ...unit('hero', 'player'), life: 1, skillOrder: ['fixture.vigor-heal'], statuses: [
      { id: 'ignite', sourceId: 'target', stacks: 1, remaining: -1, appliedAtMs: 2000, expiresAtMs: 4000, dotPerStack: 100 }] };
    const merc = { ...unit('merc', 'player'), kind: 'merc' as const, life: 130, statuses: [hold] };
    const enemy = { ...unit('target', 'enemy'), statuses: [hold] };
    const input = { seed: 42, playerTeam: [hero, merc], enemyTeam: [enemy], statAura: {
      selectedAuraId: 'paladin.vigor' as const, sourceHeroId: 'hero', fieldedMercCombatId: 'merc',
      rank: 20, maxRank: 20, bonuses: { lifePct: .4, attackSpeedPct: .1 } } };
    const out = runBattleRecorded(input);
    let teams: { player: readonly CombatUnit[]; enemy: readonly CombatUnit[] } = { player: input.playerTeam, enemy: input.enemyTeam };
    for (const event of out.events) {
      const next = applyEventToTeams(teams.player, teams.enemy, event);
      teams = { player: next.playerTeam, enemy: next.enemyTeam };
      if (event.kind === 'life-capacity') expect(eventToLocalizedLogEntry(event)).toBeNull();
      if (event.kind === 'heal') expect(teams.player[0]).toMatchObject({ life: 140, stats: { lifeMax: 140 } });
    }
    expect(out.events.some(e => e.kind === 'heal')).toBe(true);
    expect(teams.player.map(u => [u.life, u.stats.lifeMax, u.vigorLife]))
      .toEqual(out.result.playerTeam.map(u => [u.life, u.stats.lifeMax, u.vigorLife]));
    expect(teams.player.map(u => [u.life, u.stats.lifeMax])).toEqual([[0, 100], [100, 100]]);
  });
});
