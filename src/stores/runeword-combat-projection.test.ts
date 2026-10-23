import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { socketRunewords } from '@/data/loaders/socket-effects';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';
import type { Mercenary } from '@/engine/types/entities';
import { playerToCombatUnit } from './combatHelpers';
import { mercToCombatUnit } from './mercToCombatUnit';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';
import { useMapStore } from './mapStore';
import { runBattleRecorded } from '@/engine/combat/combat';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import type { DamageType } from '@/engine/types/attributes';

function word(id: string, base: string): Item {
  const row = socketRunewords.find(w => w.id === `runewords/${id}`);
  if (!row) throw new Error(`Missing word ${id}`);
  return { id, baseId: `items/base/${base}`, rarity: 'runeword', level: 70,
    identified: true, equipped: false, runewordId: row.id, socketCapacity: row.sockets,
    socketContents: row.runes.map(id => ({ kind: 'rune', id })) };
}
const stores = [useInventoryStore, usePlayerStore, useMapStore] as const;
beforeEach(() => { for (const store of stores) store.getState().reset(); });
afterEach(() => { for (const store of stores) store.getState().reset(); resetRegistry(); loadDefaultSkills(); });

describe('runeword bearer runtime projection', () => {
  it.each([
    { id: 'leaf', base: 'weapon-staff', slot: 'weapon', damage: { fire: .12 } },
    { id: 'infinity', base: 'wp2h-giant-thresher', slot: 'weapon',
      damage: { fire: .1, cold: .1, lightning: .1, poison: .1, arcane: .05 } },
    { id: 'dream', base: 'helm-war-hat', slot: 'head', damage: { lightning: .15 } }
  ])('projects $id for either bearer, adds to learned modifiers and clears on removal', row => {
    const hero = { ...createMockPlayer('Grant probe', 'sorceress'), level: 70,
      skillLevels: { 'skills-sorceress-warmth': 1, 'skills-sorceress-fire-mastery': 1,
        'skills-sorceress-lightning-mastery': 1 } };
    const merc: Mercenary = { ...hero, id: 'probe-merc', type: 'mercenary',
      archetype: 'front', rarity: 'R', classId: 'rogue' };
    const equipped = { [row.slot]: word(row.id, row.base) };
    const bare = playerToCombatUnit(hero);
    useInventoryStore.setState({ equipped });
    const own = playerToCombatUnit(hero), ally = mercToCombatUnit(merc, undefined, equipped);
    const expected = { ...bare.increasedDamagePct };
    for (const [type, value] of Object.entries(row.damage)) expected[type as keyof typeof row.damage] =
      (bare.increasedDamagePct?.[type as keyof typeof row.damage] ?? 0) + value;
    expect(own.increasedDamagePct).toEqual(expected);
    expect(ally.increasedDamagePct).toMatchObject(row.damage);
    expect(own.skillLevels).toEqual(bare.skillLevels);
    expect(Object.isFrozen(own.increasedDamagePct)).toBe(true);
    useInventoryStore.setState({ equipped: {} });
    expect(playerToCombatUnit(hero).increasedDamagePct).toEqual(bare.increasedDamagePct);
    expect(mercToCombatUnit(merc).increasedDamagePct ?? {}).toEqual({});
  });
  it('deduplicates real Dream helm/shield and adds different damage adaptations', () => {
    const hero = { ...createMockPlayer('Stack probe', 'sorceress'), level: 70 };
    useInventoryStore.setState({ equipped: { head: word('dream', 'helm-war-hat'),
      offhand: word('dream', 'sh-monarch') } });
    expect(playerToCombatUnit(hero).increasedDamagePct).toMatchObject({ lightning: .15 });
    useInventoryStore.setState({ equipped: { head: word('dream', 'helm-war-hat'),
      weapon: word('infinity', 'wp2h-giant-thresher') } });
    expect(playerToCombatUnit(hero).increasedDamagePct).toMatchObject({ lightning: .25, fire: .1 });
  });
  it('keeps Phoenix recovery personal, multiplies an existing baseline once and leaves zero merc baseline zero', () => {
    const hero = { ...createMockPlayer('Recovery probe', 'paladin'), level: 70,
      coreStats: { strength: 30, dexterity: 30, vitality: 30, energy: 20 } };
    const merc: Mercenary = { ...hero, id: 'probe-merc', type: 'mercenary',
      archetype: 'front', rarity: 'R', classId: 'rogue' };
    const equipment = { offhand: word('phoenix', 'sh-monarch') };
    useInventoryStore.setState({ equipped: equipment });
    const projected = playerToCombatUnit(hero);
    expect(projected.manaRegenPerSecond).toBeCloseTo(4 * 1.1, 12);
    expect(projected).toHaveProperty('manaRegenBaselinePerSecond', 4);
    expect(mercToCombatUnit(merc, undefined, equipment).manaRegenPerSecond ?? 0).toBe(0);
    expect(playerToCombatUnit(hero).manaRegenPerSecond).toBe(projected.manaRegenPerSecond);
  });
  it('captures Bramble reflection for only the equipped bearer', () => {
    const hero = { ...createMockPlayer('Reflection probe', 'sorceress'), level: 70 };
    const merc: Mercenary = { ...hero, id: 'probe-merc', type: 'mercenary',
      archetype: 'front', rarity: 'R', classId: 'rogue' };
    const equipment = { chest: word('bramble', 'armor-archon-plate') };
    useInventoryStore.setState({ equipped: equipment });
    expect(playerToCombatUnit(hero)).toHaveProperty('physicalReflectionPct', .2);
    expect(mercToCombatUnit(merc, undefined, equipment)).toHaveProperty('physicalReflectionPct', .2);
    expect(mercToCombatUnit(merc)).not.toHaveProperty('physicalReflectionPct', .2);
  });
  it.each([
    { id: 'leaf', base: 'weapon-staff', slot: 'weapon',
      expected: [100, 112, 100, 100, 100, 100, 100] },
    { id: 'infinity', base: 'wp2h-giant-thresher', slot: 'weapon',
      expected: [100, 110, 110, 110, 110, 105, 100] },
    { id: 'dream', base: 'helm-war-hat', slot: 'head',
      // Preserve the ordinary pipeline's native floor(100 * 1.15) = 114.
      expected: [100, 100, 100, 114, 100, 100, 100] }
  ])('consumes real $id factory modifiers in hero/merc damage and derived DoT exactly once', row => {
    const hero = { ...createMockPlayer('Damage probe', 'sorceress'), level: 70 };
    const merc: Mercenary = { ...hero, id: 'damage-merc', type: 'mercenary',
      archetype: 'front', rarity: 'R', classId: 'rogue' };
    const equipment = { [row.slot]: word(row.id, row.base) };
    useInventoryStore.setState({ equipped: equipment });
    const types: DamageType[] = ['physical', 'fire', 'cold', 'lightning', 'poison', 'arcane', 'thorns'];
    for (const projected of [playerToCombatUnit(hero), mercToCombatUnit(merc, undefined, equipment)]) {
      for (const [index, type] of types.entries()) {
        const expectedDamage = row.expected[index];
        if (expectedDamage === undefined) throw new Error('Missing damage expectation');
        const context = `${row.id}/${projected.kind ?? 'unit'}/${type}`;
        registerSkill({ id: 'fixture.runeword-damage', archetype: 'fixture', minLevel: 1,
          target: 'single-enemy', manaCost: 0, cooldown: 1, effects: [{ kind: 'damage',
            damageType: type, base: [100, 100],
            applyStatus: { id: 'burn', chance: 1, dotPctOfDamage: .1, durationMs: 10000 } }] });
        const actor = { ...projected, stats: { ...projected.stats, critChance: 0 },
          skillOrder: ['fixture.runeword-damage'] };
        const enemy = { ...actor, id: 'target', side: 'enemy' as const, kind: 'monster' as const,
          life: 100000, stats: { ...actor.stats, defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
            resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
          statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }], skillOrder: [] };
        const result = runBattleRecorded({ seed: 7, playerTeam: [actor], enemyTeam: [enemy] });
        const hit = result.events.find(e => e.kind === 'damage' && e.source === actor.id && !e.dodged);
        expect(hit, context).toMatchObject({ amount: expectedDamage, damageType: type });
        const status = result.events.find(e => e.kind === 'status-state' && e.target === enemy.id && !e.initial);
        const rate = Math.floor(expectedDamage * .1);
        if (status?.kind !== 'status-state') throw new Error('Missing real status snapshot');
        expect(status.statuses.find(s => s.id === 'ignite')).toMatchObject({ stacks: 1, dotPerStack: rate });
        const dot = result.events.find(e => e.kind === 'dot' && e.target === enemy.id);
        if (!dot || !hit) throw new Error('Missing real hit/continuous DoT events');
        expect(dot, `${context} DoT`).toMatchObject({
          amount: Math.floor(rate * (dot.simClockMs - hit.simClockMs) / 1000)
        });
      }
    }
  });
});
