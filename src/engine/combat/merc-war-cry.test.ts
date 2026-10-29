import { afterEach, beforeEach, expect, it } from 'vitest';
import { loadDefaultSkills } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const hold = (at = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1,
  remaining: -1, appliedAtMs: at });
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'merc' : 'monster', level: 30, tier: 'trash',
    life: 1000000, mana: 0,
    stats: { life: 1000000, lifeMax: 1000000, mana: 0, manaMax: 0, attack: 100,
      defense: 0, magicResist: 0, attackSpeed: side === 'player' ? 100 : 0, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    basicAttack: { damageType: 'physical', damage: side === 'player' ? [100, 100] : [1, 1] },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function scenario(actor: Partial<CombatUnit> = {}, target: Partial<CombatUnit> = {}): CombatSnapshot {
  return { seed: 5, playerTeam: [{ ...unit('merc', 'player'), skillOrder: ['mskill-war-cry'],
    statuses: [hold(1701)], ...actor }], enemyTeam: [{ ...unit('target', 'enemy'), ...target }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  return out;
}
beforeEach(() => { loadDefaultSkills(); });
afterEach(() => { loadDefaultSkills(); });

it.each([1, 20])('keeps rank%i control independent of Attack, both dodge pools and mitigation', rank => {
  for (const attack of [0, 200]) {
    const out = record(scenario({ skillLevels: { 'mskill-war-cry': rank },
      stats: { ...unit('merc', 'player').stats, attack, critChance: 1 } },
    { stats: { ...unit('target', 'enemy').stats, physDodge: 1, magicDodge: 1,
      defense: 1000000, magicResist: 1000000,
      resistances: { physical: 100, fire: 100, cold: 100, lightning: 100, arcane: 100, poison: 100 } } }));
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'target', simClockMs: 1700,
      statuses: [expect.objectContaining({ id: 'stun', sourceId: 'merc', stacks: 1, appliedAtMs: 1700, expiresAtMs: 7700 })] }));
    expect(out.events.filter(event => event.kind === 'damage' && event.source === 'merc')).toEqual([]);
    expect(out.result.playerTeam[0]?.mana).toBe(0);
  }
});

it.each([
  { tier: 'trash' as const, expiry: 7700, resumes: 8000 },
  { tier: 'boss' as const, expiry: 4700, resumes: 6000 },
  { tier: 'chapter-boss' as const, expiry: 4700, resumes: 6000 }
])('expires $tier control exactly and resumes its existing action cadence', row => {
  const out = record(scenario({}, { tier: row.tier }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'target',
    simClockMs: row.expiry, statuses: [] }));
  expect(out.events.find(event => event.kind === 'action' && event.actor === 'target'))
    .toMatchObject({ simClockMs: row.resumes });
  expect(out.events.some(event => event.kind === 'action' && event.actor === 'target' && event.simClockMs < row.expiry)).toBe(false);
});

it.each([1700, 1701])('honors carried exact cooldown at %ims and preserves basic fallback', expiry => {
  const out = record(scenario({ cooldowns: { 'mskill-war-cry': expiry } }));
  expect(out.events.find(event => event.kind === 'action' && event.actor === 'merc'))
    .toMatchObject({ simClockMs: 1700, skillId: expiry === 1700 ? 'mskill-war-cry' : null });
});

it('pays one twelve-second cooldown, subtracts elapsed time and spends zero MP', () => {
  const out = record(scenario({}, { life: 2,
    statuses: [{ id: 'ignite', sourceId: 'fixture', stacks: 1, remaining: -1, dotPerStack: 1 }] }));
  expect(out.events.filter(event => event.kind === 'action' && event.actor === 'merc')).toHaveLength(1);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'target', simClockMs: 2000 }));
  expect(out.result.playerTeam[0]).toMatchObject({ mana: 0, cooldowns: { 'mskill-war-cry': 11700 } });
});

it.each([5000, 9000])('retains the active source and later non-stacking expiry from %ims', expiry => {
  const out = record(scenario({}, { statuses: [{ id: 'stun', sourceId: 'original', stacks: 1,
    remaining: 9, appliedAtMs: 0, expiresAtMs: expiry }] }));
  if (expiry < 7700) {
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'target', simClockMs: 1700,
      statuses: [expect.objectContaining({ id: 'stun', sourceId: 'original', stacks: 1, appliedAtMs: 0, expiresAtMs: 7700 })] }));
  }
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'target',
    simClockMs: Math.max(7700, expiry), statuses: [] }));
  expect(out.events.filter(event => event.kind === 'status-state').filter(event => event.target === 'target')
    .flatMap(event => event.statuses).every(status => status.stacks === 1 && status.sourceId === 'original')).toBe(true);
});

it('treats a record expiring exactly at application as a new control source', () => {
  const out = record(scenario({}, { statuses: [{ id: 'stun', sourceId: 'expired', stacks: 1,
    remaining: 1.7, appliedAtMs: 0, expiresAtMs: 1700 }] }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'target', simClockMs: 1700,
    statuses: [expect.objectContaining({ id: 'stun', sourceId: 'merc', stacks: 1, appliedAtMs: 1700, expiresAtMs: 7700 })] }));
});

it('keeps already applied control to finite expiry after the caster dies with an ally alive', () => {
  const input = scenario({ life: 2, statuses: [hold(1701),
    { id: 'ignite', sourceId: 'target', stacks: 1, remaining: -1, dotPerStack: 1 }] });
  const out = record({ ...input, playerTeam: [...input.playerTeam,
    { ...unit('ally', 'player'), kind: 'hero', statuses: [hold()] }] });
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'merc', simClockMs: 2000 }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'target', simClockMs: 7700, statuses: [] }));
  expect(out.events.find(event => event.kind === 'action' && event.actor === 'target')).toMatchObject({ simClockMs: 8000 });
});

it.each([{ life: 0 }, { statuses: [hold()] }])('never pays when the caster cannot act: %j', patch => {
  const input = scenario(patch), out = record({ ...input, playerTeam: [...input.playerTeam,
    { ...unit('ally', 'player'), kind: 'hero', statuses: [hold()] }] });
  expect(out.events.some(event => event.kind === 'action' && event.actor === 'merc')).toBe(false);
  expect(out.result.playerTeam[0]).toMatchObject({ mana: 0, cooldowns: {} });
  expect(out.events.some(event => event.kind === 'status' && event.statusId === 'stun')).toBe(false);
});

it.each([1, 3])('consumes no hit, critical or proc RNG across %i control recipients', count => {
  const input = scenario();
  const follower = { ...unit('follower', 'player'), statuses: [hold(2001)],
    stats: { ...unit('follower', 'player').stats, attackSpeed: 0 },
    basicAttack: { damageType: 'physical' as const, damage: [18, 30] as const } };
  const out = record({ ...input, playerTeam: [...input.playerTeam, follower],
    enemyTeam: Array.from({ length: count }, (_, i) => unit(`target${String(i)}`, 'enemy')) });
  // Seed5's first ordinary hit/base/crit remains the untouched literal28/non-critical draw.
  expect(out.events.filter(event => event.kind === 'damage').filter(event => event.source === 'follower'))
    .toEqual([expect.objectContaining({ amount: 28, crit: false, dodged: false, simClockMs: 2000 })]);
});

it('recasts on the first ready action after the full cooldown, with ordinary basics between', () => {
  const out = record(scenario({ statuses: [hold(15301)] }));
  expect(out.events.filter(event => event.kind === 'action' && event.actor === 'merc' && event.skillId === 'mskill-war-cry')
    .map(event => event.simClockMs)).toEqual([1700, 15300]);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'merc', skillId: null, simClockMs: 13600 }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'target', simClockMs: 15300,
    statuses: [expect.objectContaining({ id: 'stun', sourceId: 'merc', appliedAtMs: 15300, expiresAtMs: 21300 })] }));
});

it('uses hostile side membership when an enemy casts the native control', () => {
  const player = { ...unit('hero', 'player'), kind: 'hero' as const,
    stats: { ...unit('hero', 'player').stats, attackSpeed: 0 } };
  const enemy = { ...unit('caster', 'enemy'), skillOrder: ['mskill-war-cry'], statuses: [hold(1701)],
    stats: { ...unit('caster', 'enemy').stats, attackSpeed: 100 } };
  const out = record({ seed: 5, playerTeam: [player], enemyTeam: [enemy] });
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'hero', simClockMs: 1700,
    statuses: [expect.objectContaining({ id: 'stun', sourceId: 'caster', appliedAtMs: 1700, expiresAtMs: 7700 })] }));
  expect(out.events.some(event => event.kind === 'status' && event.target === 'caster')).toBe(false);
});
