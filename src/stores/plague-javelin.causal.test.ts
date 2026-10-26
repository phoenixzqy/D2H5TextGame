import { beforeEach, afterEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useFormationStore } from './formationStore';
import { useMapStore } from './mapStore';

const id = 'skills-amazon-plague-javelin', runtime = 'amazon.plague_javelin';
const nativePlayer = (rank = 1) => ({ ...createMockPlayer('Synthetic native Plague', 'amazon'),
  level: 30, comboOrder: [id], skillLevels: {
    'skills-amazon-jab': 1, 'skills-amazon-poison-javelin': 1, [id]: rank
  } });
const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'hold', stacks: 1,
  remaining: -1, appliedAtMs });
beforeEach(() => {
  useInventoryStore.getState().reset(); useFormationStore.getState().reset(); useMapStore.getState().reset();
  resetRegistry(); loadDefaultSkills();
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
/** Native learned authority with unearned HP/cadence isolation; no balance or earned-state claim. */
function fixture(rank = 1): CombatSnapshot {
  const native = playerToCombatUnit(nativePlayer(rank));
  const hero: CombatUnit = { ...native, id: 'hero', life: 500, mana: 25,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, statuses: [hold(401)],
    stats: { ...native.stats, life: 500, lifeMax: 500, mana: 100, manaMax: 100,
      attack: 1, attackSpeed: 263, defense: 0, magicResist: 0,
      critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  const target: CombatUnit = { ...hero, id: 'target', side: 'enemy', kind: 'monster', tier: 'trash',
    mana: 0, skillOrder: [], skillLevels: {}, statuses: [hold()], gridPosition: { row: 1, col: 1 } };
  return { seed: 1, playerTeam: [hero], enemyTeam: [target,
    { ...target, id: 'recipient', gridPosition: { row: 2, col: 1 } }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  return out;
}
it.each([[1, 30, 15, 455], [20, 87, 60, 353]])(
  'native rank%s pays once for real Poison/Plague with literal %s direct/%s periodic/%s HP',
  (rank, direct, periodic, life) => {
    const out = record(fixture(rank));
    expect(out.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: runtime, simClockMs: 400 })]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 400 })]);
    expect(out.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ target: 'target', amount: direct, damageType: 'poison', dodged: false })]);
    expect(out.events.filter(e => e.kind === 'status').map(e => e.statusId)).toEqual(['poison', 'plague']);
    expect(out.events.filter(e => e.kind === 'dot').reduce((n, e) => n + e.amount, 0)).toBe(periodic);
    expect(out.result.enemyTeam.map(u => u.life)).toEqual([life, 500]);
    expect(out.events.some(e => e.kind === 'status-state' && e.target === 'target' &&
      e.statuses.some(s => s.id === 'poison' && s.stacks === 3 && s.dotPerStack === Math.floor(direct * .05) &&
        s.appliedAtMs === 400 && s.expiresAtMs === 5400))).toBe(true);
    expect(out.events.some(e => e.kind === 'status-state' && e.target === 'target' &&
      e.statuses.some(s => s.id === 'plague' && s.dotPerStack === undefined))).toBe(true);
  });
it.each([[9, 300, 0], [10, 100, 1]])('native pre-cast Poison%s leaves recipient%sHP and triggers%s Epidemic', (stacks, life, count) => {
  const input = fixture(), poison: ActiveStatus = { id: 'poison', sourceId: 'prior', stacks,
    remaining: 5, dotPerStack: 8, damageType: 'poison', appliedAtMs: 400, expiresAtMs: 5400 };
  const out = record({ ...input, enemyTeam: input.enemyTeam.map(u => u.id === 'target'
    ? { ...u, life: 1, statuses: [...u.statuses, poison] } : u) });
  expect(out.result.enemyTeam.find(u => u.id === 'recipient')?.life).toBe(life);
  expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:epidemic.triggered')).toHaveLength(count);
});
it('native class, level and allocation gate actual Plague authority', () => {
  const player = nativePlayer();
  expect(playerToCombatUnit(player).skillOrder).toEqual([id]);
  for (const patch of [{ class: 'barbarian' as const }, { level: 17 }, { skillLevels: {} },
    ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ skillLevels: { [id]: rank } }))])
    expect(playerToCombatUnit({ ...player, ...patch }).skillOrder).toEqual([]);
});
it.each(['mana', 'cooldown'] as const)('native %s refusal buys no Plague or Poison', failure => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    mana: failure === 'mana' ? 24 : 25, cooldowns: failure === 'cooldown' ? { [runtime]: 10000 } : {} })) });
  expect(out.events.some(e => e.kind === 'action' && e.skillId === runtime)).toBe(false);
  expect(out.events.filter(e => e.kind === 'status' || e.kind === 'dot' ||
    e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
});
it('a missed native cast pays25MP without either status or periodic HP loss', () => {
  const out = record({ ...fixture(20), seed: 4 });
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ target: 'target', amount: 0, dodged: true })]);
  expect(out.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
  expect(out.result.enemyTeam.map(u => u.life)).toEqual([500, 500]);
});
