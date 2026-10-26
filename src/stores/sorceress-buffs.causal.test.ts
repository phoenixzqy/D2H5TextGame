import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

type Buff = 'teleport' | 'enchant';
const dataId = (id: Buff) => 'skills-sorceress-' + id;
// Finite expiry adds a presentation boundary. Compare the real simulation
// clock/payment/rolls independently of delays between adjacent UI events.
function simulationEvent<T extends RecordedBattleEvent>(event: T) {
  const { uiDelayMs: presentationDelay, ...simulation } = event;
  void presentationDelay;
  return simulation;
}
/** Same authored payment, target and seed; a diagnostic ID keeps the inert control
 * available after production starts rejecting malformed canonical buff bodies. */
function inertControl(input: CombatSnapshot, id: Buff, rank: number) {
  const original = getSkill(dataId(id)); if (!original) throw new Error('Missing native buff');
  const controlId = 'diagnostic.' + id;
  registerSkill({ ...original, id: controlId,
    effects: [{ kind: 'buff', id: 'control-' + id, duration: -1 }] });
  return runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    skillOrder: [controlId], skillLevels: { ...u.skillLevels, [controlId]: rank } })) });
}
/** Native learned ownership, diagnostic pools/Attack and an explicit observation window. */
function fixture(id: Buff, rank: number, seed = 7): CombatSnapshot {
  const learned = id === 'teleport' ? { 'skills-sorceress-telekinesis': 1 }
    : { 'skills-sorceress-fire-bolt': 1, 'skills-sorceress-fire-ball': 1 };
  const unit = playerToCombatUnit({ ...createMockPlayer('Paid Sorceress buffs', 'sorceress'),
    level: 30, id: 'hero', skillLevels: { ...learned, [dataId(id)]: rank }, comboOrder: [dataId(id)] });
  const cost = Math.round(id === 'teleport' ? 20 - .2 * (rank - 1) : 22 - .15 * (rank - 1));
  const hero: CombatUnit = { ...unit, life: 100000, mana: cost, increasedDamagePct: {},
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    statuses: id === 'teleport' ? [{ id: 'stun', sourceId: 'one-cast-window', stacks: 1, remaining: -1, appliedAtMs: 1701 }] : [],
    stats: { ...unit.stats, lifeMax: 100000, manaMax: 100, attack: 100, attackSpeed: 100,
      defense: 0, magicResist: 0, critChance: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    basicAttack: { damage: [100, 100], damageType: 'physical' } };
  return { seed, playerTeam: [hero], enemyTeam: [{ ...hero, id: 'target', side: 'enemy',
    kind: 'monster', skillOrder: [], skillLevels: {}, mana: 0,
    statuses: id === 'enchant' ? [{ id: 'stun', sourceId: 'observation', stacks: 1, remaining: -1 }] : [],
    stats: { ...hero.stats, attackSpeed: 0 }, basicAttack: { damage: [1, 1], damageType: 'fire' } }] };
}
beforeEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset(); useFormationStore.getState().reset();
  resetRegistry(); loadDefaultSkills();
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each([1, 20])('rank%i Enchant adds Fire to later weapon hits with identical cast/payment and physical rolls', rank => {
  const original = getSkill(dataId('enchant')); if (!original) throw new Error('Missing Enchant');
  const input = fixture('enchant', rank), before = structuredClone(input), actual = runBattleRecorded(input);
  expect(runBattleRecorded(input)).toEqual(actual); expect(input).toEqual(before);
  const control = inertControl(input, 'enchant', rank);
  const actions = (out: typeof actual) => out.events.filter(e => e.kind === 'action' && e.actor === 'hero')
    .map(e => e.kind === 'action' ? { ...simulationEvent(e), skillId: e.skillId === 'sorceress.enchant' || e.skillId === 'diagnostic.enchant' ? 'paired-buff' : e.skillId } : simulationEvent(e));
  const payment = (out: typeof actual) => out.events.filter(e => e.kind === 'mana' && e.reason === 'cast').map(simulationEvent);
  const physical = (out: typeof actual) => out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'physical').map(simulationEvent);
  expect(actions(actual)).toEqual(actions(control)); expect(payment(actual)).toEqual(payment(control));
  expect(payment(actual)).toHaveLength(1); expect(physical(actual)).toEqual(physical(control));
  expect(actual.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'fire' && e.amount > 0).length).toBeGreaterThan(0);
  expect(control.events.some(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'fire')).toBe(false);
});
it('paid rank20 Teleport actually dodges incoming magical attacks during its finite window', () => {
  const original = getSkill(dataId('teleport')); if (!original) throw new Error('Missing Teleport');
  let actualDodges = 0, controlDodges = 0;
  for (let seed = 1; seed <= 64; seed++) {
    const input = fixture('teleport', 20, seed);
    registerSkill(original); const actual = runBattleRecorded(input);
    const control = inertControl(input, 'teleport', 20);
    const first = (out: typeof actual) => out.events.find(e => e.kind === 'damage' && e.source === 'target' && e.simClockMs === 2000);
    const a = first(actual), c = first(control);
    expect(a?.kind).toBe('damage'); expect(c?.kind).toBe('damage');
    actualDodges += Number(a?.kind === 'damage' && a.dodged); controlDodges += Number(c?.kind === 'damage' && c.dodged);
    expect(actual.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual(control.events.filter(e => e.kind === 'mana' && e.reason === 'cast'));
  }
  expect(actualDodges).toBeGreaterThan(controlDodges);
});
it.each(['teleport', 'enchant'] as const)('%s emits a finite paid status rather than a permanent inert marker', id => {
  const out = runBattleRecorded(fixture(id, 20));
  const paid = out.events.flatMap(e => e.kind === 'status-state' && e.target === 'hero' ? e.statuses.filter(s => s.id === id) : []);
  expect(paid.length).toBeGreaterThan(0);
  expect(paid.every(s => Number.isFinite(s.expiresAtMs) && (s.expiresAtMs ?? 0) > (s.appliedAtMs ?? 0))).toBe(true);
  expect(out.result.playerTeam[0]?.activeBuffIds).not.toContain(id);
});
