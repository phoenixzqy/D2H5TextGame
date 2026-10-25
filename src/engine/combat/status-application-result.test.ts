import { afterEach, beforeEach, expect, it } from 'vitest';
import type { CombatUnit } from './types';
import { createRng } from '../rng';
import { applyStatusWithResult } from './status';
import { runBattleRecorded } from './combat';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

function target(): CombatUnit {
  return { id: 'target', name: 'target', side: 'enemy', level: 1, tier: 'trash',
    stats: { life: 100, lifeMax: 100, mana: 0, manaMax: 0, attack: 1,
      defense: 0, magicResist: 0, attackSpeed: 1, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    life: 100, mana: 0, statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
it('reports fresh Paralyze acceptance and exact status/marker clocks without consuming a DR roll', () => {
  const input = target(), before = structuredClone(input), rng = createRng(4);
  const out = applyStatusWithResult(input, { id: 'paralyze', sourceId: 'hero', simClockMs: 1700 }, rng);
  expect(out.applied).toBe(true);
  expect(out.unit.statuses).toEqual([
    { id: 'paralyze', sourceId: 'hero', stacks: 1, remaining: 1, appliedAtMs: 1700, expiresAtMs: 2700 },
    { id: 'paralyze-cd', sourceId: 'hero', stacks: 1, remaining: 5, appliedAtMs: 1700, expiresAtMs: 6700 }
  ]);
  expect(input).toEqual(before);
  expect(rng.nextInt(0, 100000)).toBe(createRng(4).nextInt(0, 100000));
});
it.each([4, 7, 19, 41, 97])('reports the actual seeded residual-window outcome without changing input, seed%i', seed => {
  const input: CombatUnit = { ...target(), statuses: [{ id: 'paralyze-cd', sourceId: 'earlier',
    stacks: 1, remaining: 5, appliedAtMs: 0, expiresAtMs: 5000 }] };
  const before = structuredClone(input), rng = createRng(seed), reference = createRng(seed);
  const accepted = reference.chance(.5);
  const out = applyStatusWithResult(input, { id: 'paralyze', sourceId: 'hero', simClockMs: 1700 }, rng);
  expect(out.applied).toBe(accepted);
  if (accepted) {
    expect(out.unit.statuses).toContainEqual(expect.objectContaining({ id: 'paralyze', expiresAtMs: 2700 }));
    expect(out.unit.statuses).toContainEqual(expect.objectContaining({ id: 'paralyze-cd', sourceId: 'hero', expiresAtMs: 6700 }));
  } else {
    expect(out.unit).toBe(input);
    expect(out.unit.statuses).toEqual(before.statuses);
  }
  expect(rng.nextInt(0, 100000)).toBe(reference.nextInt(0, 100000));
  expect(input).toEqual(before);
});
it('accepts at exact residual expiry without drawing the rejected-window roll', () => {
  const input: CombatUnit = { ...target(), statuses: [{ id: 'paralyze-cd', sourceId: 'earlier',
    stacks: 1, remaining: 5, appliedAtMs: 0, expiresAtMs: 5000 }] };
  const rng = createRng(4);
  const out = applyStatusWithResult(input, { id: 'paralyze', sourceId: 'hero', simClockMs: 5000 }, rng);
  expect(out.applied).toBe(true);
  expect(out.unit.statuses).toContainEqual(expect.objectContaining({ id: 'paralyze', expiresAtMs: 6000 }));
  expect(rng.nextInt(0, 100000)).toBe(createRng(4).nextInt(0, 100000));
});

it.each([4, 7, 19, 41, 97])('the debuff emitter reports actual residual-window acceptance, seed%i', seed => {
  const id = 'fixture.paralyze-debuff';
  registerSkill({ id, archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    manaCost: 10, cooldown: 100, effects: [{ kind: 'debuff', statusId: 'paralyze' }] });
  const hero: CombatUnit = { ...target(), id: 'hero', side: 'player', mana: 20,
    stats: { ...target().stats, manaMax: 20, attackSpeed: 263 }, skillOrder: [id],
    statuses: [{ id: 'stun', sourceId: 'hold', stacks: 1, remaining: -1, appliedAtMs: 401 }] };
  const enemy: CombatUnit = { ...target(), statuses: [
    { id: 'stun', sourceId: 'hold', stacks: 1, remaining: -1, appliedAtMs: 0 },
    { id: 'paralyze-cd', sourceId: 'earlier', stacks: 1, remaining: 5, appliedAtMs: 0, expiresAtMs: 5000 }
  ] };
  const input = { seed, playerTeam: [hero], enemyTeam: [enemy] }, before = structuredClone(input);
  const accepted = createRng(seed).chance(.5), out = runBattleRecorded(input);
  expect(out.events.filter(event => event.kind === 'action' && event.skillId === id)).toHaveLength(1);
  expect(out.events.filter(event => event.kind === 'status' && event.statusId === 'paralyze')).toHaveLength(accepted ? 1 : 0);
  const applications = out.events.flatMap(event => event.kind === 'status-state' && event.target === 'target' && event.simClockMs === 400
    ? event.statuses.filter(status => status.id === 'paralyze') : []);
  expect(applications).toEqual(accepted ? [expect.objectContaining({ sourceId: 'hero', appliedAtMs: 400, expiresAtMs: 1400 })] : []);
  expect(out.result.playerTeam[0]?.mana).toBe(10);
  expect(out.result.enemyTeam[0]?.life).toBe(100);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(input).toEqual(before);
});
