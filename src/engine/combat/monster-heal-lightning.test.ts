import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { monsters } from '@/data/index';
import * as rngModule from '../rng';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { ActiveStatus, CombatUnit } from './types';

const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1, appliedAtMs });
function native(id = 'monsters/act2.cantor'): CombatUnit {
  const def = monsters.find(row => row.id === id);
  if (!def) throw new Error('Missing native monster');
  return buildMonsterUnit({ def, level: 20, tier: 'trash', id: 'enemy', rng: rngModule.createRng(7) });
}
function snapshot(skill: string, periodSpeed = 100): CombatSnapshot {
  const enemy = native();
  const hero: CombatUnit = { ...enemy, id: 'hero', kind: 'hero', side: 'player',
    life: 100_000, mana: 0, attackRange: [0, 0], skillOrder: [], statuses: [hold()],
    stats: { ...enemy.stats, attack: 0, attackSpeed: 100, life: 100_000, lifeMax: 100_000,
      critChance: 0, defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  return { seed: 13, act: 2, playerTeam: [hero], enemyTeam: [{ ...enemy, life: 50, mana: 0,
    statuses: [], skillOrder: [skill], stats: { ...enemy.stats, life: 50, lifeMax: 1000,
      mana: 0, manaMax: 0, attackSpeed: periodSpeed, critChance: 0 } }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), output = runBattleRecorded(input);
  expect(runBattleRecorded(input)).toEqual(output);
  expect(runBattle(input)).toEqual(output.result);
  expect(input).toEqual(before);
  return output;
}
function heals(output: ReturnType<typeof runBattleRecorded>) { return output.events.filter(e => e.kind === 'heal'); }
beforeEach(() => {
  resetRegistry(); loadDefaultSkills();
  const create = rngModule.createRng;
  vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
    const rng = create(seed);
    vi.spyOn(rng, 'nextInt').mockImplementation(min => min);
    vi.spyOn(rng, 'chance').mockImplementation(p => p > .5);
    return rng;
  });
});
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('real monster Heal', () => {
  it('resolves both aliases to actual copied self recovery', () => {
    const skill = getSkill('monster-heal');
    expect(getSkill('monster.heal')).toBe(skill);
    expect(skill).toMatchObject({ archetype: 'monster', target: 'self', cooldown: 4, manaCost: 0,
      effects: [{ kind: 'heal', pctOfMaxLife: .3, target: 'self' }] });
  });
  it('restores max-life percentages at native cooldown, clamps actual HP and skips full life', () => {
    const output = record(snapshot('monster-heal'));
    expect(heals(output).map(e => [e.target, e.amount, e.simClockMs])).toEqual([
      ['enemy', 300, 1700], ['enemy', 300, 6800], ['enemy', 300, 11900], ['enemy', 50, 17000]
    ]);
    expect(output.result.enemyTeam[0]?.life).toBe(1000);
    expect(output.result.enemyTeam[0]?.mana).toBe(0);
    expect(output.result.enemyTeam[0]?.activeBuffIds).not.toContain('heal_self');
    expect(output.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'enemy').slice(0, 4).map(e => e.skillId))
      .toEqual(['monster.heal', null, null, 'monster.heal']);
  });
  it('floors the max-life amount without rolling or healing another unit', () => {
    const input = snapshot('monster-heal');
    const output = record({ ...input, enemyTeam: input.enemyTeam.map(e => ({ ...e, stats: { ...e.stats, lifeMax: 1001 }, statuses: [hold(1701)] })) });
    expect(heals(output)).toEqual([expect.objectContaining({ target: 'enemy', amount: 300, simClockMs: 1700 })]);
    expect(output.result.playerTeam[0]?.life).toBe(100_000);
    const rng = rngModule.createRng(99), range = vi.spyOn(rng, 'nextInt'), chance = vi.spyOn(rng, 'chance');
    vi.mocked(rngModule.createRng).mockReturnValue(rng);
    runBattleRecorded({ ...input, enemyTeam: input.enemyTeam.map(e => ({ ...e, statuses: [hold(1701)] })) });
    expect(range).not.toHaveBeenCalled(); expect(chance).not.toHaveBeenCalled();
  });
  it.each([0, 1000])('does not heal dead/full life %s or grant a heal cooldown', life => {
    const input = snapshot('monster-heal');
    const output = record({ ...input, enemyTeam: input.enemyTeam.map(e => ({ ...e, life })) });
    expect(heals(output)).toEqual([]);
    expect(output.result.enemyTeam[0]?.cooldowns['monster.heal']).toBeUndefined();
  });
  it('respects ManaBurn skill lock without granting HP or a marker', () => {
    const input = snapshot('monster-heal');
    const output = record({ ...input, enemyTeam: input.enemyTeam.map(e => ({ ...e,
      statuses: [{ id: 'mana-burn', sourceId: 'fixture', remaining: -1, stacks: 1 }] })) });
    expect(heals(output)).toEqual([]);
    expect(output.result.enemyTeam[0]?.life).toBe(50);
  });
  it.each(['monsters/act2.cantor', 'monsters/act2.dark-elder'])('preserves %s natural priority, including starved Heal', id => {
    const input = snapshot('monster-heal'), enemy = native(id);
    const output = record({ ...input, enemyTeam: [{ ...enemy, life: 1 }] });
    expect(enemy.skillOrder).toEqual(monsters.find(row => row.id === id)?.skills);
    expect(output.events.some(e => e.kind === 'action' && e.skillId === 'monster.heal')).toBe(false);
    expect(heals(output)).toEqual([]);
  });
});

const lightning = [
  { key: 'lightning-bolt', base: [50, 70], cd: 2, target: 'single-enemy', flight: 500, id: 'monsters/act2.horror-mage' },
  { key: 'thunder-storm', base: [30, 50], cd: 3, target: 'all-enemies', flight: 0, id: 'monsters/act2.beetleburst' },
  { key: 'lightning', base: [40, 60], cd: 2, target: 'single-enemy', flight: 0, id: 'monsters/act3.mephisto' }
] as const;
describe.each(lightning)('monster $key Paralyze', spec => {
  it('preserves native direct range, target, projectile, spell delivery and aliases', () => {
    const skill = getSkill('monster-' + spec.key);
    expect(getSkill('monster.' + spec.key.replaceAll('-', '_'))).toBe(skill);
    expect(skill).toMatchObject({ archetype: 'monster', target: spec.target, cooldown: spec.cd, manaCost: 0,
      effects: [{ kind: 'damage', damageType: 'lightning', base: spec.base,
        applyStatus: { id: 'paralyze', chance: 1, stacksOnApply: 1, durationMs: 1000 } }] });
    if (!skill || skill.effects[0]?.kind !== 'damage') throw new Error('Missing native damage');
    expect(getSkillDamageDelivery(skill)).toBe('spell');
    expect(skill.effects[0].projectileFlightMs ?? 0).toBe(spec.flight);
    expect(skill.effects[0].tags).toBeUndefined();
  });
  it('applies finite Paralyze on impact and blocks the next scheduled hero action', () => {
    const input = snapshot('monster-' + spec.key, 187), impact = 1004 + spec.flight;
    const output = record({ ...input,
      playerTeam: input.playerTeam.map(h => ({ ...h, statuses: [] })),
      enemyTeam: input.enemyTeam.map(e => ({ ...e, statuses: [hold(1005)] })) });
    expect(output.events.filter(e => e.kind === 'damage' && e.source === 'enemy'))
      .toEqual([expect.objectContaining({ amount: spec.base[0], simClockMs: impact, dodged: false })]);
    expect(output.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'hero', simClockMs: impact,
      statuses: expect.arrayContaining([expect.objectContaining({ id: 'paralyze', appliedAtMs: impact,
        expiresAtMs: impact + 1000, stacks: 1 }), expect.objectContaining({ id: 'paralyze-cd', expiresAtMs: impact + 5000 })]) as unknown }));
    expect(output.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs === 1700)).toBe(false);
    expect(output.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs >= impact + 1000)).toBe(true);
    expect(output.result.playerTeam[0]?.statuses.some(s => s.id === 'paralyze' || s.id === 'paralyze-cd')).toBe(false);
  });
  it('does not apply Paralyze when magical dodge rejects the hit', () => {
    const input = snapshot('monster-' + spec.key, 187);
    const output = record({ ...input, playerTeam: input.playerTeam.map(h => ({ ...h, stats: { ...h.stats, magicDodge: 1 } })),
      enemyTeam: input.enemyTeam.map(e => ({ ...e, statuses: [hold(1005)] })) });
    expect(output.events.filter(e => e.kind === 'damage' && e.source === 'enemy'))
      .toEqual([expect.objectContaining({ amount: 0, dodged: true })]);
    expect(output.events.some(e => e.kind === 'status' && e.statusId === 'paralyze')).toBe(false);
  });
  it('retains the native single/all target scope for both hit and disruption', () => {
    const input = snapshot('monster-' + spec.key, 187), hero = input.playerTeam[0];
    if (!hero) throw new Error('Missing fixture hero');
    const output = record({ ...input, playerTeam: [hero, { ...hero, id: 'ally', kind: 'merc' }],
      enemyTeam: input.enemyTeam.map(e => ({ ...e, statuses: [hold(1005)] })) });
    const count = spec.target === 'all-enemies' ? 2 : 1;
    expect(output.events.filter(e => e.kind === 'damage' && e.source === 'enemy')).toHaveLength(count);
    expect(output.events.filter(e => e.kind === 'status' && e.statusId === 'paralyze')).toHaveLength(count);
  });
  it('preserves its real bundled monster bar and applies Paralyze naturally', () => {
    const input = snapshot('monster-' + spec.key), enemy = native(spec.id), output = record({ ...input, enemyTeam: [enemy] });
    expect(enemy.skillOrder).toEqual(monsters.find(row => row.id === spec.id)?.skills);
    expect(output.events.some(e => e.kind === 'status' && e.statusId === 'paralyze')).toBe(true);
  });
});

it.each([false, true])('uses shared residual repeat rejection (accepted=%s)', accepted => {
  const create = vi.mocked(rngModule.createRng).getMockImplementation();
  if (!create) throw new Error('Missing RNG fixture');
  vi.mocked(rngModule.createRng).mockImplementation(seed => {
    const rng = create(seed); vi.spyOn(rng, 'chance').mockImplementation(p => p === .5 ? accepted : p > .5); return rng;
  });
  const input = snapshot('monster-lightning-bolt', 187), output = record({ ...input,
    enemyTeam: input.enemyTeam.map(e => ({ ...e, statuses: [hold(3013)] })) });
  const states = output.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'status' }> => e.kind === 'status' && e.statusId === 'paralyze');
  expect(states.map(e => e.simClockMs)).toEqual(accepted ? [1504, 3512] : [1504]);
  expect(output.events.filter(e => e.kind === 'action' && e.actor === 'enemy').map(e => e.simClockMs)).toEqual([1004, 2008, 3012]);
});


it('allows a hero action at the exact half-open Paralyze expiry', () => {
  const input = snapshot('monster-lightning-bolt', 187), output = record({ ...input,
    playerTeam: input.playerTeam.map(h => ({ ...h, statuses: [], stats: { ...h.stats, attackSpeed: 156 } })),
    enemyTeam: input.enemyTeam.map(e => ({ ...e, statuses: [hold(1005)] })) });
  // Hero1252ms cadence: Bolt1504→Paralyze[1504,2504), second action exactly2504.
  expect(output.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'hero', simClockMs: 2504 }));
  expect(output.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'hero', simClockMs: 2504,
    statuses: expect.not.arrayContaining([expect.objectContaining({ id: 'paralyze' })]) as unknown }));
});

it('exercises both repeat outcomes with real seeded lightning and stable replay', () => {
  vi.restoreAllMocks();
  let eligible = 0, accepted = 0, rejected = 0;
  for (let seed = 0; seed < 16; seed++) {
    const input = snapshot('monster-lightning-bolt', 187), output = record({ ...input, seed,
      enemyTeam: input.enemyTeam.map(e => ({ ...e, statuses: [hold(3013)] })) });
    const hits = output.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> => e.kind === 'damage' && e.source === 'enemy');
    const [first, second] = hits;
    expect(hits).toHaveLength(3); // Bolt, ordinary gap, second Bolt.
    const last = hits[2];
    if (!first || !second || !last || first.dodged || last.dodged) continue;
    eligible++;
    const applications = output.events.filter(e => e.kind === 'status' && e.statusId === 'paralyze');
    expect(applications[0]?.simClockMs).toBe(1504);
    if (applications.length === 2) { accepted++; expect(applications[1]?.simClockMs).toBe(3512); }
    else { rejected++; expect(applications).toHaveLength(1); }
  }
  expect(eligible).toBe(accepted + rejected); expect(accepted).toBeGreaterThan(0); expect(rejected).toBeGreaterThan(0);
});
