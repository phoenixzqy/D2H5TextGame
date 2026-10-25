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
  { slug: 'firestorm', unlock: 1, mana: 20 },
  { slug: 'molten-boulder', unlock: 6, mana: 12 },
  { slug: 'fissure', unlock: 12, mana: 20 },
  { slug: 'volcano', unlock: 24, mana: 27 },
  { slug: 'armageddon', unlock: 30, mana: 35 }
] as const;
const canonical = (slug: string) => 'druid.' + slug.replaceAll('-', '_');
const hold = (at = 0): ActiveStatus => ({ id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture', appliedAtMs: at });
function player(index: number, rank = 1, patch: Partial<Player> = {}): Player {
  const spell = spells[index];
  if (!spell) throw new Error('Missing Druid fire spell fixture');
  const slug = spell.slug;
  return { ...createMockPlayer('Synthetic native Druid fire', 'druid'), id: 'fixture-druid-fire-hero', level: 30,
    comboOrder: ['skills-druid-' + slug], skillLevels: Object.fromEntries(spells.slice(0, index + 1)
      .map((s, i) => [canonical(s.slug), i === index ? rank : 1])), ...patch };
}
function fight(p: Player, mana: number) {
  const native = playerToCombatUnit(p);
  // Only resources/cadence/holds/crit are synthetic. Class/rank/prerequisite authority is native.
  const hero: CombatUnit = { ...native, life: 10000, mana, statuses: [hold(1701)],
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 10000, manaMax: 1000, attackSpeed: 100, critChance: 0 } };
  const target: CombatUnit = { ...hero, id: 'target', side: 'enemy', kind: 'monster', life: 10000,
    statuses: [hold()], skillOrder: [], skillLevels: {},
    increasedDamagePct: {}, stats: { ...hero.stats, defense: 0, magicResist: 0,
      physDodge: 0, magicDodge: 0, resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } } };
  const input = { seed: 7, playerTeam: [hero], enemyTeam: [target] };
  const r = runBattleRecorded(input);
  expect(runBattleRecorded(input)).toEqual(r);
  return { native, r };
}
function reset() {
  useInventoryStore.getState().reset(); useMapStore.getState().reset(); useFormationStore.getState().reset();
}
beforeEach(reset); afterEach(reset);

describe.each(spells)('native Druid $slug authority', (spell) => {
  const index = spells.indexOf(spell), id = canonical(spell.slug);
  it.each([1, 20])('casts the real rank %i spell and changes actual HP through Burn', rank => {
    const p = player(index, rank), before = structuredClone(p), { native, r } = fight(p, spell.mana);
    expect(native.skillOrder).toEqual(['skills-druid-' + spell.slug]); expect(native.skillLevels?.[id]).toBe(rank);
    expect(r.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: native.id, skillId: id })]);
    const direct = r.events.reduce((sum, e) => sum + (e.kind === 'damage' ? e.amount : 0), 0);
    const dot = r.events.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0);
    expect(dot).toBe(Math.floor(direct * 0.1) * 3);
    expect(dot).toBeGreaterThan(0);
    expect(r.result.enemyTeam[0]?.life).toBe(10000 - direct - dot);
    expect(r.result.playerTeam[0]?.mana).toBe(0); expect(p).toEqual(before);
  });
  it('refuses imported foreign-class, unlearned and below-unlock priorities', () => {
    for (const patch of [{ class: 'sorceress' as const }, { skillLevels: {} }, { level: spell.unlock - 1 }]) {
      const { native, r } = fight(player(index, 20, patch), spell.mana);
      expect(native.skillOrder).toEqual([]);
      expect(r.events.filter(e => e.kind === 'dot' || e.kind === 'status')).toEqual([]);
      expect(r.result.playerTeam[0]?.mana).toBe(spell.mana);
    }
  });
  it('normalizes valid aliases by maximum once without mutating persistent allocation', () => {
    const p = player(index, 1);
    const aliases = { ...p.skillLevels, ['skills-druid-' + spell.slug]: 20 };
    const { native, r } = fight({ ...p, skillLevels: aliases }, spell.mana);
    expect(native.skillLevels?.[id]).toBe(20);
    expect(r.events).toEqual(fight(player(index, 20), spell.mana).r.events);
    expect(aliases[id]).toBe(1);
  });
  if (index > 0) it('requires every transitive prerequisite before enabling a configured cast', () => {
    for (const prerequisite of spells.slice(0, index)) {
      const p = player(index, 20), levels = Object.fromEntries(Object.entries(p.skillLevels ?? {})
        .filter(([key]) => key !== canonical(prerequisite.slug)));
      expect(fight({ ...p, skillLevels: levels }, spell.mana).native.skillOrder).toEqual([]);
    }
  });
});
