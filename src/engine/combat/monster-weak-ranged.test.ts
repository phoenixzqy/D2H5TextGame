import { afterEach, beforeEach, expect, it } from 'vitest';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture',
  stacks: 1, remaining: -1, appliedAtMs });

// Constructed native-skill consumer: no current authored monster loadout uses Weak Ranged.
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 10000, mana: 100, stats: { life: 10000, lifeMax: 10000, mana: 100, manaMax: 100,
      attack: 1, defense: 0, magicResist: 0, attackSpeed: 263, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [hold()], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each(['monster-weak-ranged', 'monster.weak_ranged'])(
  'constructed %s fires one physical projectile for authored damage after 500ms', id => {
    const snapshot: CombatSnapshot = { seed: 13, playerTeam: [unit('hero', 'player'), unit('ally', 'player')],
      enemyTeam: [{ ...unit('archer', 'enemy'), statuses: [hold(401)], skillOrder: [id] }] };
    const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
    expect(runBattle(snapshot)).toEqual(out.result);
    expect(runBattleRecorded(snapshot)).toEqual(out);
    expect(snapshot).toEqual(before);
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'archer')).toEqual([
      expect.objectContaining({ skillId: 'monster.weak_ranged', simClockMs: 400 })
    ]);
    const damage = out.events.filter(e => e.kind === 'damage');
    expect(damage).toHaveLength(1);
    const hit = damage[0];
    if (!hit) throw new Error('Missing native ranged impact');
    expect(hit).toMatchObject({ source: 'archer', damageType: 'physical', simClockMs: 900 });
    expect(hit.amount).toBeGreaterThanOrEqual(12); expect(hit.amount).toBeLessThanOrEqual(18);
    expect(['hero', 'ally']).toContain(hit.target);
    expect(out.result.playerTeam.filter(u => u.life < 10000)).toHaveLength(1);
    expect(out.result.playerTeam.find(u => u.id === hit.target)?.life).toBe(10000 - hit.amount);
    expect(out.events.filter(e => e.kind === 'mana')).toEqual([]);
    expect(out.result.enemyTeam[0]?.mana).toBe(100);
  });
