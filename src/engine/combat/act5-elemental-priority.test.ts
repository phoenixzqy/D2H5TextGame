import { describe, expect, it } from 'vitest';
import { monsters } from '@/data/index';
import { createRng } from '../rng';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { CombatUnit } from './types';

describe('BUG142 canonical Act V elemental monster priority', () => {
  it.each([
    { archetype: 'monsters/act5.blood-lord', skill: 'monster.fire_breath', filler: null, type: 'fire', status: 'ignite' },
    { archetype: 'monsters/act5.frozen-terror', skill: 'monster.frost_aura', filler: null, type: 'cold', status: 'chill' }
  ])('$archetype uses its elemental action and melee during cooldown', ({ archetype, skill, filler, type, status }) => {
    const def = monsters.find(row => row.id === archetype);
    if (!def) throw new Error('Missing canonical Act V monster');
    const enemy = buildMonsterUnit({ def, level: 90, tier: 'trash', rng: createRng(142), id: 'enemy' });
    // A constructed passive tank keeps the real monster alive and acting. This
    // isolates priority/status behavior, and establishes no build viability.
    const hero: CombatUnit = { ...enemy, id: 'hero', kind: 'hero', side: 'player', life: 100_000,
      attackRange: [0, 0], basicAttack: { damage: [0, 0], damageType: 'physical' }, skillOrder: [],
      stats: { ...enemy.stats, life: 100_000, lifeMax: 100_000, attack: 0, defense: 0,
        magicResist: 0, physDodge: 0, magicDodge: 0,
        resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
    const input: CombatSnapshot = { seed: 142, act: 5, maxRounds: 8, playerTeam: [hero], enemyTeam: [enemy] };
    const before = structuredClone(input);
    const recorded = runBattleRecorded(input);
    const actions = recorded.events.filter(event => event.kind === 'action' && event.actor === enemy.id);
    expect(actions.slice(0, 3)).toEqual([
      expect.objectContaining({ skillId: skill, simClockMs: 1620 }),
      expect.objectContaining({ skillId: filler, simClockMs: 3240 }),
      expect.objectContaining({ skillId: skill, simClockMs: 4860 })
    ]);
    expect(recorded.events).toContainEqual(expect.objectContaining({ kind: 'damage', source: enemy.id,
      target: hero.id, damageType: type, dodged: false, simClockMs: 1620 }));
    expect(recorded.events).toContainEqual(expect.objectContaining({ kind: 'status', target: hero.id,
      statusId: status, simClockMs: 1620 }));
    expect(recorded.events.some(event => event.kind === 'damage' && event.source === enemy.id &&
      event.damageType === type && event.amount > 0)).toBe(true);
    expect(recorded.events.some(event => event.kind === 'damage' && event.source === enemy.id &&
      event.damageType === 'physical' && event.amount > 0 && event.simClockMs === 3240)).toBe(true);
    expect(runBattleRecorded(input)).toEqual(recorded);
    expect(input).toEqual(before);
  });
});
