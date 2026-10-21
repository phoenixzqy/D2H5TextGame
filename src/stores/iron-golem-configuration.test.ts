import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Player } from '@/engine/types/entities';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { buildSummon } from '@/engine/skills/summons';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { createSimpleEnemy, playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useFormationStore } from './formationStore';

const IRON = 'necromancer.iron_golem';
const ALIAS = 'skills-necromancer-iron-golem';
const BLOOD = 'necromancer.blood_golem';
const BLOOD_ALIAS = 'skills-necromancer-blood-golem';
const SYNTHETIC = 'fixture.iron-configuration-refund';
function player(): Player {
  return { ...createMockPlayer('IronConfiguration', 'necromancer'), level: 24,
    comboOrder: [IRON, SYNTHETIC], skillLevels: { [IRON]: 6, [BLOOD]: 1 } };
}
const INVALID: readonly { name: string; fields: Partial<Player> }[] = [
  { name: 'foreign class', fields: { class: 'sorceress' } },
  { name: 'below unlock', fields: { level: 23 } },
  { name: 'fractional level', fields: { level: 24.5 } },
  { name: 'nonfinite level', fields: { level: Infinity } },
  { name: 'unlearned', fields: { skillLevels: { [BLOOD]: 1 } } },
  ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ name: `Iron rank ${String(rank)}`,
    fields: { skillLevels: { [IRON]: rank, [BLOOD]: 1 } } })),
  { name: 'missing Blood', fields: { skillLevels: { [IRON]: 6 } } },
  ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ name: `Blood rank ${String(rank)}`,
    fields: { skillLevels: { [IRON]: 6, [BLOOD_ALIAS]: rank } } }))
];
function hero(input: Player, mana = 10): CombatUnit {
  return { ...playerToCombatUnit(input), mana, manaRegenPerSecond: 0,
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
}
function enemy(): CombatUnit {
  const unit = createSimpleEnemy(1);
  return { ...unit, life: 1_000_000, stats: { ...unit.stats, life: 1_000_000, lifeMax: 1_000_000 },
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
}
beforeEach(() => {
  useInventoryStore.getState().reset(); useFormationStore.getState().reset();
  resetRegistry(); loadDefaultSkills();
  registerSkill({ id: SYNTHETIC, archetype: 'fixture', target: 'summon', minLevel: 1,
    cooldown: 1, manaCost: 7, effects: [{ kind: 'summon', summonId: 'skeleton', maxCount: 1 }] });
});
afterEach(() => {
  useInventoryStore.getState().reset(); useFormationStore.getState().reset();
  resetRegistry(); loadDefaultSkills();
});
describe('D06 authoritative Player Iron Golem configuration', () => {
  it.each([1, 6, 20])('normalizes both aliases to explicit rank%s without mutating caller data', rank => {
    const input = { ...player(), comboOrder: [ALIAS, SYNTHETIC, IRON],
      skillLevels: { [ALIAS]: rank, [IRON]: 0, [BLOOD_ALIAS]: 1, [SYNTHETIC]: 7 } };
    const before = structuredClone(input), output = playerToCombatUnit(input);
    expect(output.skillOrder).toEqual([ALIAS, SYNTHETIC, IRON]);
    expect(output.skillLevels).toEqual({ [IRON]: rank, [BLOOD_ALIAS]: 1, [SYNTHETIC]: 7 });
    expect(output.skillOrder).not.toBe(input.comboOrder);
    expect(output.skillLevels).not.toBe(input.skillLevels);
    expect(input).toEqual(before);
  });
  it.each([IRON, ALIAS].flatMap(slot => INVALID.map(row => ({ ...row, slot }))))(
    'strips $slot for $name while preserving unrelated evidence', ({ fields, slot }) => {
      const input = { ...player(), ...fields, comboOrder: [slot, SYNTHETIC] };
      const before = structuredClone(input), output = playerToCombatUnit(input);
      expect(output.skillOrder).toEqual([SYNTHETIC]);
      expect(output.skillLevels).toEqual(input.skillLevels);
      expect(input).toEqual(before);
    });
  it('keeps an unselected learned allocation without adding a slot', () => {
    const output = playerToCombatUnit({ ...player(), comboOrder: [SYNTHETIC] });
    expect(output.skillOrder).toEqual([SYNTHETIC]);
    expect(output.skillLevels).toEqual({ [IRON]: 6, [BLOOD]: 1 });
  });
  it.each([IRON, ALIAS])('allows actual attested creation through valid %s configuration', slot => {
    const owner = hero({ ...player(), comboOrder: [slot, SYNTHETIC],
      skillLevels: { [ALIAS]: 6, [BLOOD_ALIAS]: 1 } }, 35);
    const output = runBattleRecorded({ seed: 7, playerTeam: [owner], enemyTeam: [enemy()],
      ironGolem: { sourceHeroId: owner.id, sourceItemId: 'selected-short-sword', life: 0, attack: 8, defense: 0 } });
    const created = output.events.filter(event => event.kind === 'summon');
    expect(created).toHaveLength(1);
    expect(created[0]?.unit.stats).toMatchObject({ life: 340, lifeMax: 340, attack: 54, defense: 63 });
    expect(output.result.ironGolemPreparation).toEqual({ sourceHeroId: owner.id,
      sourceItemId: 'selected-short-sword', skillId: IRON, spawnedUnitId: created[0]?.unit.id, paidMp: 35 });
    expect(output.events.filter(event => event.kind === 'mana' && event.reason === 'cast'))
      .toEqual([expect.objectContaining({ target: owner.id, mana: 0, simClockMs: 0 })]);
  });
  it.each([IRON, ALIAS])('rejects foreign-class %s even with complete item input and mana', slot => {
    const owner = hero({ ...player(), class: 'sorceress', comboOrder: [slot, SYNTHETIC] }, 35);
    const output = runBattleRecorded({ seed: 7, playerTeam: [owner], enemyTeam: [enemy()],
      ironGolem: { sourceHeroId: owner.id, sourceItemId: 'selected-short-sword', life: 0, attack: 8, defense: 0 } });
    expect(output.events.filter(event => event.kind === 'summon' || event.kind === 'action' || event.kind === 'mana'))
      .toEqual([]);
    expect(output.result.ironGolemPreparation).toBeUndefined();
    expect(output.result.playerTeam.find(unit => unit.id === owner.id)?.mana).toBe(35);
  });
  it.each([
    { name: 'valid', fields: {}, authorized: true },
    { name: 'foreign class', fields: { class: 'sorceress' as const }, authorized: false },
    { name: 'below unlock', fields: { level: 23 }, authorized: false },
    { name: 'unlearned', fields: { skillLevels: { [BLOOD]: 1 } }, authorized: false },
    { name: 'missing Blood', fields: { skillLevels: { [IRON]: 6 } }, authorized: false },
    { name: 'unslotted', fields: { comboOrder: [SYNTHETIC] }, authorized: false }
  ])('$name configuration controls full-preload death authority with no selected item', ({ fields, authorized }) => {
    const owner = hero({ ...player(), ...fields });
    const preload = buildSummon(owner, 'iron_golem');
    if (!preload) throw new Error('Missing Iron configuration preload fixture');
    const dying = { ...preload, id: 'preloaded-iron', life: 1,
      statuses: [{ id: 'poison', sourceId: 'fixture', stacks: 1, remaining: 1, expiresAtMs: 1000, dotPerStack: 1000 }] };
    const output = runBattleRecorded({ seed: 7, playerTeam: [owner, dying], enemyTeam: [enemy()] });
    expect(owner.skillOrder).toContain(SYNTHETIC);
    expect(output.events.some(event => event.kind === 'death' && event.target === 'preloaded-iron')).toBe(true);
    expect(output.events.filter(event => event.kind === 'summon' || event.kind === 'action')).toEqual([]);
    const refunds = output.events.filter(event => event.kind === 'mana' && event.reason === 'summon-refund');
    expect(refunds).toEqual(authorized ? [] : [expect.objectContaining({ target: owner.id, mana: 17 })]);
    expect(output.result.ironGolemPreparation).toBeUndefined();
  });
});
