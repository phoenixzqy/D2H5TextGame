import { afterEach, expect, it } from 'vitest';
import rows from '@/data/skills/amazon.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from './combatHelpers';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useFormationStore } from './formationStore';
import { useMapStore } from './mapStore';
import { composeDecoyRank, decoyRank, buildDecoy, matchesDecoy } from '@/engine/skills/decoy';
import { getSkill } from '@/engine/skills/registry';
import type { RegisteredSkill } from '@/engine/skills/effects';
function fixture(rank = 1) {
  const levels: Record<string, number> = {};
  function add(id: string) {
    const row = rows.find((row) => row.id === id);
    if (!row) throw new Error('Missing Decoy prerequisite');
    for (const prerequisite of row.prerequisites ?? []) add(prerequisite);
    levels[id] = 1;
  }
  add('skills-amazon-decoy');
  levels['skills-amazon-decoy'] = rank;
  return {
    ...createMockPlayer('Synthetic Decoy ownership', 'amazon'),
    level: 24,
    skillLevels: levels,
    comboOrder: ['skills-amazon-decoy']
  };
}
afterEach(() => {
  for (const store of [usePlayerStore, useInventoryStore, useFormationStore, useMapStore])
    store.getState().reset();
});
it.each([1, 20])(
  'projects actual native rank%i and builds an independent unprivileged candidate',
  (rank) => {
    const player = fixture(rank),
      unit = playerToCombatUnit(player),
      before = structuredClone(unit);
    expect(composeDecoyRank(player)).toBe(rank);
    expect(unit.decoyRank).toBe(rank);
    expect(decoyRank(unit)).toBe(rank);
    const body = buildDecoy(unit, rank);
    expect(body).toMatchObject({
      kind: 'summon',
      summon: true,
      summonTemplateId: 'decoy',
      summonOwnerId: unit.id,
      summonRefundOnDeath: false,
      skillOrder: [],
      activeBuffIds: [],
      life: rank === 1 ? 200 : 580,
      stats: { attack: 0, attackSpeed: 0, defense: 20 }
    });
    expect(unit).toEqual(before);
    expect(body.stats.resistances).not.toBe(unit.stats.resistances);
    expect(decoyRank(body)).toBe(0);
  }
);
it('requires native class,unlock,learned rank and every prerequisite', () => {
  const player = fixture();
  for (const value of [
    { ...player, class: 'sorceress' as const },
    { ...player, level: 23 },
    { ...player, skillLevels: {} },
    { ...player, skillLevels: { ...player.skillLevels, 'skills-amazon-inner-sight': 0 } },
    { ...player, skillLevels: { ...player.skillLevels, 'skills-amazon-slow-missiles': 0 } }
  ]) {
    expect(composeDecoyRank(value)).toBe(0);
    expect(decoyRank(playerToCombatUnit(value))).toBe(0);
  }
  for (const rank of [0, -1, 1.5, 21, NaN, Infinity])
    expect(composeDecoyRank(fixture(rank))).toBe(0);
});
it('rejects forged,dead,nonhero or mismatching native owners', () => {
  const unit = playerToCombatUnit(fixture());
  const missing = { ...unit };
  Reflect.deleteProperty(missing, 'decoyRank');
  expect(decoyRank(missing)).toBe(0);
  for (const patch of [
    { decoyRank: 20 },
    { decoyRank: NaN },
    { life: 0 },
    { life: Infinity },
    { side: 'enemy' as const },
    { kind: 'merc' as const },
    { summon: true },
    { summonOwnerId: 'other' },
    { ownerId: 'other' },
    { level: 23 },
    { skillLevels: {} }
  ])
    expect(decoyRank({ ...unit, ...patch })).toBe(0);
});
it('matches only the exact singleton paid effect and rejects contradictory registered sources', () => {
  const source = getSkill('amazon.decoy');
  if (!source) throw new Error('Missing Decoy');
  const exact: RegisteredSkill = { ...source, effects: [{ kind: 'decoy' }] };
  expect(matchesDecoy(exact)).toBe(true);
  for (const patch of [
    { archetype: 'sorceress' },
    { target: 'all-enemies' as const },
    { trigger: 'passive' as const },
    { manaCost: 0 },
    { cooldown: 0 },
    { minLevel: 1 },
    { isBuff: true },
    { summonOnStart: true },
    { manaCostPerRank: 0 },
    { effects: [] },
    { effects: [{ kind: 'decoy' as const }, { kind: 'decoy' as const }] },
    { effects: [{ kind: 'buff' as const, id: 'decoy', duration: -1 }] }
  ])
    expect(matchesDecoy({ ...exact, ...patch })).toBe(false);
});
