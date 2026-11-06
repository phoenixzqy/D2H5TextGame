import { afterEach, expect, it } from 'vitest';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattleRecorded } from './combat';
import type { CombatUnit } from './types';

afterEach(resetRegistry);
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster',
    level: 25, tier: 'trash', life: 10000, mana: 0,
    stats: { life: 10000, lifeMax: 10000, mana: 50, manaMax: 50, attack: 1,
      defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
it('lets seven earned Meteor ranks damage every ordinary armored Act II target without criticals', () => {
  loadDefaultSkills();
  const hero = { ...unit('hero', 'player'), mana: 50,
    skillOrder: ['sorceress.meteor'], skillLevels: { 'sorceress.meteor': 7 } };
  const targets: CombatUnit[] = [0, 1, 2].map(index => {
    const base = unit(`target-${String(index)}`, 'enemy');
    return { ...base,
      stats: { ...base.stats, defense: 126, resistances: { ...base.stats.resistances, fire: 50 } },
      statuses: [{ id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture', appliedAtMs: 0 }] };
  });
  const battle = runBattleRecorded({ seed: 7, act: 2, playerTeam: [hero], enemyTeam: targets });
  const hits = battle.events.filter(e => e.kind === 'damage' && e.source === hero.id && e.damageType === 'fire');
  expect(hits).toHaveLength(3);
  expect(new Set(hits.flatMap(hit => hit.kind === 'damage' ? [hit.target] : []))).toEqual(new Set(targets.map(target => target.id)));
  for (const hit of hits) {
    expect(hit).toMatchObject({ damageType: 'fire', crit: false, dodged: false });
    expect(hit.kind === 'damage' ? hit.amount : 0).toBeGreaterThan(100);
  }
  expect(battle.result.playerTeam[0]?.mana).toBe(0);
  expect(battle.events.filter(e => e.kind === 'action' && e.skillId === 'sorceress.meteor')).toHaveLength(1);
});
