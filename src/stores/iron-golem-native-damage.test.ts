/** Unearned native composition and real item projection; controlled pure-engine opponents. */
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { Item } from '@/engine/types/items';
import { projectIronGolemItem } from '@/engine/items/iron-golem';
import { composeGolemMastery } from '@/engine/skills/golem-mastery';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const IRON = 'necromancer.iron_golem';
const ALIAS = 'skills-necromancer-iron-golem';
type Mode = 'valid' | 'no-item' | 'poor' | 'unslotted' | 'foreign-class';

function reset() {
  for (const store of [useInventoryStore, useMapStore, useFormationStore]) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
beforeEach(reset);
afterEach(reset);

function fixture(rank: number, baseId = 'items/base/wp1h-short-sword', mode: Mode = 'valid'): CombatSnapshot {
  const player = { ...createMockPlayer('Unearned native Iron', mode === 'foreign-class' ? 'sorceress' : 'necromancer'),
    id: 'native-iron', level: 30, comboOrder: mode === 'unslotted' ? [] : [ALIAS],
    skillLevels: { 'necromancer.clay_golem': 1, 'necromancer.golem_mastery': 1,
      'necromancer.blood_golem': 1, [IRON]: rank } };
  const native = playerToCombatUnit(player);
  const mana = mode === 'poor' ? 34 : 35;
  const owner: CombatUnit = { ...native, mana, manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    manaRegenCarry: 0, manaRegenCompensation: 0, manaRegenExactCarry: '0',
    statuses: [{ id: 'stun', sourceId: 'synthetic-isolation', stacks: 1, remaining: -1 }] };
  const target: CombatUnit = { ...owner, id: 'target', name: 'Held synthetic target', side: 'enemy', kind: 'monster',
    life: 1000000, mana: 0, skillOrder: [], skillLevels: {},
    stats: { ...owner.stats, life: 1000000, lifeMax: 1000000, attack: 0, defense: 0,
      magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const item: Item = { id: 'selected-native-item', baseId, rarity: 'normal', level: 1,
    identified: true, equipped: false, socketCapacity: 0, socketContents: [] };
  const before = structuredClone(item), projected = projectIronGolemItem(item);
  expect(item).toEqual(before);
  if (!projected.eligible) throw new Error('Expected real eligible metal item');
  expect(projected.bonuses).toEqual(baseId === 'items/base/wp1h-short-sword'
    ? { life: 0, attack: 8, defense: 0 } : { life: 0, attack: 0, defense: 53 });
  const mastery = composeGolemMastery(player);
  return { seed: 19, playerTeam: [owner], enemyTeam: [target],
    ...(mastery ? { golemMastery: mastery } : {}),
    ...(mode === 'no-item' ? {} : { ironGolem: { sourceHeroId: owner.id, sourceItemId: item.id,
      ...projected.bonuses } }) };
}

it.each([
  [1, 'items/base/wp1h-short-sword', 275.6, 44, 48],
  [6, 'items/base/wp1h-short-sword', 360.40000000000003, 54, 63],
  [20, 'items/base/wp1h-short-sword', 597.84, 82, 105],
  [6, 'items/base/armor-chain-mail', 360.40000000000003, 46, 116]
] as const)('native Iron rank%i with %s causes actual HP loss from its projected item', (rank, baseId, life, attack, defense) => {
  const input = fixture(rank, baseId), before = structuredClone(input), out = runBattleRecorded(input);
  expect(input.playerTeam[0]?.skillOrder).toContain(ALIAS);
  expect(input.playerTeam[0]?.skillLevels?.[IRON]).toBe(rank);
  expect(input.golemMastery).toMatchObject({ sourceHeroId: 'native-iron', rank: 1 });
  const fresh = out.events.filter(e => e.kind === 'summon');
  expect(fresh).toHaveLength(1);
  const body = fresh[0]?.unit;
  expect(body).toMatchObject({ life, summonOwnerId: 'native-iron', summonTemplateId: 'iron_golem',
    stats: { lifeMax: life, attack, defense, attackSpeed: 61 } });
  const hits = out.events.filter(e => e.kind === 'damage' && e.source === body?.id && e.target === 'target');
  expect(hits.length).toBeGreaterThan(0);
  expect(hits.every(e => e.kind === 'damage' && e.damageType === 'physical')).toBe(true);
  expect(hits.some(e => e.kind === 'damage' && !e.dodged && !e.crit && e.amount === attack)).toBe(true);
  const damage = hits.reduce((sum, e) => sum + (e.kind === 'damage' ? e.amount : 0), 0);
  expect(damage).toBeGreaterThan(0);
  expect(out.result.enemyTeam[0]?.life).toBe(1000000 - damage);
  expect(out.result.ironGolemPreparation).toEqual({ sourceHeroId: 'native-iron', sourceItemId: 'selected-native-item',
    skillId: IRON, spawnedUnitId: body?.id, paidMp: 35 });
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
    .toEqual([expect.objectContaining({ target: 'native-iron', mana: 0, simClockMs: 0 })]);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
});

it.each(['no-item', 'poor', 'unslotted', 'foreign-class'] as const)(
  'native %s control has no Iron payment, attestation or target HP loss', mode => {
    const input = fixture(20, 'items/base/wp1h-short-sword', mode), out = runBattleRecorded(input);
    expect(out.events.filter(e => e.kind === 'summon' || e.kind === 'damage' || e.kind === 'mana')).toEqual([]);
    expect(out.result.ironGolemPreparation).toBeUndefined();
    expect(out.result.enemyTeam[0]?.life).toBe(1000000);
    expect(out.result.playerTeam[0]?.mana).toBe(mode === 'poor' ? 34 : 35);
  });
