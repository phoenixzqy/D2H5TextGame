import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import type { Player } from '@/engine/types/entities';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const spells = [
  { slug: 'werewolf-maul', unlock: 12, mana: 15, hit: 82, growth: 8, fraction: 0.1, duration: 3 },
  { slug: 'rabies', unlock: 18, mana: 12, hit: 51, growth: 5, fraction: 0.05, duration: 5 },
  { slug: 'fire-claws', unlock: 18, mana: 9, hit: 71, growth: 6, fraction: 0.1, duration: 3 }
] as const;
const canonical = (slug: string) => 'druid.' + slug.replaceAll('-', '_');
const hold = (at = 0): ActiveStatus => ({
  id: 'stun',
  stacks: 1,
  remaining: -1,
  sourceId: 'fixture',
  appliedAtMs: at
});
function player(index: number, rank = 1, patch: Partial<Player> = {}): Player {
  const spell = spells[index];
  if (!spell) throw new Error('Missing Druid attack DoT spell fixture');
  const slug = spell.slug;
  return {
    ...createMockPlayer('Synthetic native Druid attack DoT', 'druid'),
    id: 'fixture-druid-attack-hero',
    level: 30,
    comboOrder: ['skills-druid-' + slug],
    skillLevels: {
      'druid.werewolf': 1,
      'druid.lycanthropy': 1,
      'druid.werebear': 1,
      'druid.feral_rage': 1,
      'druid.werewolf_maul': 1,
      [canonical(slug)]: rank
    },
    ...patch
  };
}
function fight(p: Player, mana: number) {
  const native = playerToCombatUnit(p);
  // Only resources/cadence/holds/crit are synthetic. Class/rank/prerequisite authority is native.
  const hero: CombatUnit = {
    ...native,
    life: 10000,
    mana,
    statuses: [hold(1701)],
    manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0,
    stats: {
      ...native.stats,
      lifeMax: 10000,
      manaMax: 1000,
      attackSpeed: 100,
      attack: 1,
      critChance: 0
    }
  };
  const target: CombatUnit = {
    ...hero,
    id: 'target',
    side: 'enemy',
    kind: 'monster',
    life: 10000,
    statuses: [hold()],
    skillOrder: [],
    skillLevels: {},
    increasedDamagePct: {},
    stats: {
      ...hero.stats,
      defense: 0,
      magicResist: 0,
      physDodge: 0,
      magicDodge: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    }
  };
  const input = { seed: 7, playerTeam: [hero], enemyTeam: [target] };
  const r = runBattleRecorded(input);
  expect(runBattleRecorded(input)).toEqual(r);
  return { native, r };
}
function reset() {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useFormationStore.getState().reset();
}
beforeEach(reset);
afterEach(reset);

describe.each(spells)('BUG192 native Druid $slug', (spell) => {
  const index = spells.indexOf(spell),
    id = canonical(spell.slug);
  it.each([1, 2, 20])(
    'pays the actual rank%i attack and loses additional HP over its full authored status',
    (rank) => {
      const p = player(index, rank),
        before = structuredClone(p),
        { native, r } = fight(p, spell.mana);
      expect(native.skillOrder).toEqual(['skills-druid-' + spell.slug]);
      expect(r.events.filter((e) => e.kind === 'action')).toEqual([
        expect.objectContaining({ actor: native.id, skillId: id, simClockMs: 1700 })
      ]);
      const direct = spell.hit + spell.growth * (rank - 1);
      expect(r.events.filter((e) => e.kind === 'damage')).toEqual([
        expect.objectContaining({ amount: direct, dodged: false, crit: false })
      ]);
      const dot = r.events.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0);
      expect(dot).toBe(Math.floor(direct * spell.fraction) * spell.duration);
      expect(r.result.enemyTeam[0]?.life).toBe(10000 - direct - dot);
      expect(r.result.playerTeam[0]?.mana).toBe(0);
      expect(p).toEqual(before);
    }
  );
  it('rejects foreign class, unlearned, fractional and below-unlock imported priorities', () => {
    for (const patch of [
      { class: 'sorceress' as const },
      { skillLevels: {} },
      { level: spell.unlock - 1 },
      { level: spell.unlock - 0.5 }
    ]) {
      const { native, r } = fight(player(index, 20, patch), spell.mana);
      expect(native.skillOrder).toEqual([]);
      expect(r.events.filter((e) => e.kind === 'dot' || e.kind === 'status')).toEqual([]);
      expect(r.result.playerTeam[0]?.mana).toBe(spell.mana);
    }
  });
  it('takes the maximum valid exact alias once and preserves saved allocation', () => {
    const p = player(index, 1),
      levels = { ...p.skillLevels, ['skills-druid-' + spell.slug]: 20 };
    const before = structuredClone(levels),
      { native, r } = fight({ ...p, skillLevels: levels }, spell.mana);
    expect(native.skillLevels?.[id]).toBe(20);
    expect(r.events).toEqual(fight(player(index, 20), spell.mana).r.events);
    expect(levels).toEqual(before);
  });
  it('requires every prerequisite in its complete authored chain', () => {
    const required =
      spell.slug === 'rabies'
        ? ['werewolf', 'feral-rage']
        : spell.slug === 'werewolf-maul'
          ? ['lycanthropy', 'werebear']
          : ['werewolf', 'lycanthropy', 'werebear', 'feral-rage', 'werewolf-maul'];
    for (const prerequisite of required) {
      const p = player(index, 20),
        levels = Object.fromEntries(
          Object.entries(p.skillLevels ?? {}).filter(([key]) => key !== canonical(prerequisite))
        );
      expect(fight({ ...p, skillLevels: levels }, spell.mana).native.skillOrder).toEqual([]);
    }
  });

  it('keeps an existing projected wave and replay immutable when the saved rank changes', () => {
    const p = player(index, 1),
      old = playerToCombatUnit(p),
      before = structuredClone(old);
    const initialEvents = fight(p, spell.mana).r.events;
    const changed = { ...p, skillLevels: { ...p.skillLevels, [id]: 20 } };
    expect(playerToCombatUnit(changed).skillLevels?.[id]).toBe(20);
    expect(old).toEqual(before);
    expect(old.skillLevels?.[id]).toBe(1);
    expect(fight(p, spell.mana).r.events).toEqual(initialEvents);
    expect(fight(changed, spell.mana).r.events).not.toEqual(initialEvents);
  });
});
