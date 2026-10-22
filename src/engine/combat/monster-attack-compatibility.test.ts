import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import schema from '../../data/schema/monster.schema.json';
import monsters from '../../data/monsters/act1.json';
import { createRng } from '../rng';
import type { MonsterDef } from '../types/monsters';
import { buildMonsterUnit } from './monster-factory';
import { runBattleRecorded, type CombatSnapshot } from './combat';

const validate = new Ajv2020({ strict: true }).compile<MonsterDef>(schema);
const row: unknown = monsters.find(m => m.id === 'monsters/act1.fallen-shaman');
if (!validate(row)) throw new Error('Invalid production Shaman');
const def = row;

describe('authored ordinary attack compatibility', () => {
  it.each(['attack', 'attackGrowth'])('standalone strict schema requires the paired %s field', field => {
    const incomplete = { ...def }; Reflect.deleteProperty(incomplete, field);
    expect(validate(incomplete)).toBe(false);
  });
  it('rejects resolved numeric overflow before consuming spawn RNG', () => {
    const rng = createRng(9), control = createRng(9);
    expect(() => buildMonsterUnit({ def: { ...def, attackGrowth: [Number.MAX_VALUE, Number.MAX_VALUE] },
      level: 17, tier: 'trash', rng })).toThrow(/attack/i);
    expect(rng.next()).toBe(control.next());
  });
  it('applies Might once to each resolved endpoint while preserving the scalar and input range', () => {
    const source = buildMonsterUnit({ def, level: 17, tier: 'trash', rng: createRng(7), id: 'hero' });
    const hero = { ...source, kind: 'hero' as const, side: 'player' as const, skillOrder: [], statuses: [],
      attackRange: [99, 99] as const, stats: { ...source.stats, attack: 9999, critChance: 0 } };
    const target = { ...source, id: 'target', life: 1, skillOrder: [],
      stats: { ...source.stats, defense: 0, physDodge: 0, resistances: { ...source.stats.resistances, physical: 0 } },
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
    const input: CombatSnapshot = { seed: 7, act: 1, playerTeam: [hero], enemyTeam: [target],
      mightAura: { selectedAuraId: 'paladin.might', sourceHeroId: 'hero', rank: 1, maxRank: 20,
        physicalDamagePct: 0.03, attackPct: 0.01 } };
    const before = structuredClone(input), output = runBattleRecorded(input);
    // floor(99 * 1.01) = 99; floor(99 * 1.03) = 101.
    expect(output.events.find(e => e.kind === 'damage')).toMatchObject({ source: 'hero', amount: 101, dodged: false });
    expect(input).toEqual(before);
    expect(output.result.playerTeam[0]?.stats.attack).toBe(9999);
  });
});
