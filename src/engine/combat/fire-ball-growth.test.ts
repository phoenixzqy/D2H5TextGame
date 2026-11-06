import { afterEach, expect, it } from 'vitest';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattleRecorded } from './combat';
import type { CombatUnit } from './types';

afterEach(resetRegistry);
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster',
    level: 14, tier: 'trash', life: 10000, mana: 0,
    stats: { life: 10000, lifeMax: 10000, mana: 20, manaMax: 20, attack: 1,
      defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
it('lets eight earned Fire Ball ranks penetrate ordinary Act II boss armor without criticals', () => {
  loadDefaultSkills();
  const hero = { ...unit('hero', 'player'), mana: 20,
    skillOrder: ['sorceress.fire_ball'], skillLevels: { 'sorceress.fire_ball': 8 } };
  const base = unit('target', 'enemy');
  const target: CombatUnit = { ...base,
    stats: { ...base.stats, defense: 242, resistances: { ...base.stats.resistances, fire: 50 } },
    statuses: [{ id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture', appliedAtMs: 0 }] };
  const battle = runBattleRecorded({ seed: 7, act: 2, playerTeam: [hero], enemyTeam: [target] });
  const hits = battle.events.filter(e => e.kind === 'damage' && e.source === hero.id && e.damageType === 'fire');
  expect(hits).toHaveLength(1);
  expect(hits[0]).toMatchObject({ damageType: 'fire', crit: false, dodged: false });
  expect(hits[0]?.kind === 'damage' ? hits[0].amount : 0).toBeGreaterThan(200);
  expect(battle.result.playerTeam[0]?.mana).toBe(0);
  expect(battle.events.filter(e => e.kind === 'action' && e.skillId === 'sorceress.fire_ball')).toHaveLength(1);
});
