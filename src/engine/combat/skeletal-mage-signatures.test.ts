import { afterEach, beforeEach, expect, it } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import { getSummon, registerSummon, type SummonFactory } from '../skills/summons';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';

const MAGE = 'necromancer.raise_skeletal_mage';
const ELEMENTS = ['fire', 'cold', 'lightning', 'poison'] as const;
let original: SummonFactory;
let selected = 0;
let created = 0;
let repeated = false;

function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30,
    tier: 'trash', life: 1000, mana: 22, skillOrder: [], cooldowns: {},
    activeBuffIds: [], enraged: false,
    statuses: [{ id: 'stun', sourceId: 'isolation', stacks: 1, remaining: -1 }],
    stats: { life: 1000, lifeMax: 1000, mana: 22, manaMax: 22,
      attack: 0, defense: 0, magicResist: 0, attackSpeed: 0, critChance: 0,
      critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}

function fixture(): CombatSnapshot {
  return { seed: 7, playerTeam: [{ ...unit('hero', 'player'),
    skillOrder: [MAGE], skillLevels: { [MAGE]: 6 } }], enemyTeam: [unit('target', 'enemy')] };
}

function record(input: CombatSnapshot) {
  created = 0;
  return runBattleRecorded(input);
}

beforeEach(() => {
  resetRegistry(); loadDefaultSkills();
  const factory = getSummon('skeletal_mage');
  if (!factory) throw new Error('Missing actual Mage factory');
  original = factory;
  selected = 0; created = 0; repeated = false;
  // Isolate one ordinary hit from one of the four genuinely paid rank6 bodies.
  // Native templates/rank growth remain covered by the elemental/composition suites.
  registerSummon('skeletal_mage', owner => {
    const body = original(owner), active = created++ % 4 === selected;
    return { ...body, stats: { ...body.stats, attack: 85, attackSpeed: 0, critChance: 0 },
      statuses: active && repeated ? [] : [{ id: 'stun', sourceId: 'isolation', stacks: 1, remaining: -1,
        ...(active ? { appliedAtMs: 2001 } : {}) }] };
  });
});

it.each([[0, 'fire', 15], [3, 'poison', 10]] as const)(
  '%s uses resolved %s damage before capturing its DoT rate', (index, element, periodic) => {
    selected = index;
    const input = fixture(), target = input.enemyTeam[0];
    if (!target) throw new Error('Missing target');
    const out = record({ ...input, enemyTeam: [{ ...target,
      stats: { ...target.stats, resistances: { ...target.stats.resistances, [element]: 50 } } }] });
    expect(out.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ damageType: element, amount: 50, dodged: false })
    ]);
    expect(out.events.filter(e => e.kind === 'dot').reduce((sum, e) => sum + e.amount, 0)).toBe(periodic);
    expect(out.result.enemyTeam[0]?.life).toBe(950 - periodic);
  });

it.each([0, 1, 2, 3])('a missed element%s bolt applies no status or periodic damage', index => {
  selected = index;
  const input = fixture(), target = input.enemyTeam[0];
  if (!target) throw new Error('Missing target');
  const out = record({ ...input, seed: 123456789,
    enemyTeam: [{ ...target, stats: { ...target.stats, magicDodge: 1 } }] });
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ amount: 0, dodged: true })
  ]);
  expect(out.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
  expect(out.result.enemyTeam[0]?.life).toBe(1000);
});

it.each([{ mana: 21 }, { skillLevels: {} }, { kind: 'merc' as const }])(
  'refuses signature authority for unpaid or unqualified input %j', patch => {
    const input = fixture(), owner = input.playerTeam[0];
    if (!owner) throw new Error('Missing owner');
    const out = record({ ...input, playerTeam: [{ ...owner, ...patch }] });
    expect(out.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
    const hits = out.events.filter(e => e.kind === 'damage');
    if ('mana' in patch) {
      expect(hits).toEqual([]);
      expect(out.events.filter(e => e.kind === 'summon' || e.kind === 'mana')).toEqual([]);
    } else {
      expect(hits).toHaveLength(1);
      expect(hits[0]).toMatchObject({ damageType: 'physical' });
    }
  });

it('rejects a forged enemy Bone Armor marker before settling actual HP loss', () => {
  const input = fixture(), target = input.enemyTeam[0];
  if (!target) throw new Error('Missing target');
  const out = record({ ...input, enemyTeam: [{ ...target, statuses: [...target.statuses,
    { id: 'bone-armor', sourceId: 'target', stacks: 1, remaining: -1,
      boneArmor: { rank: 1, remaining: 100 } }] }] });
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ damageType: 'fire', amount: 100, dodged: false })
  ]);
  expect(out.events.find(e => e.kind === 'damage')).not.toHaveProperty('absorbed');
  expect(out.events.filter(e => e.kind === 'dot').reduce((sum, e) => sum + e.amount, 0)).toBe(30);
  expect(out.result.enemyTeam[0]?.life).toBe(870);
});
afterEach(() => { registerSummon('skeletal_mage', original); resetRegistry(); loadDefaultSkills(); });

it.each([[1, 100, 3400], [2, 156, 2504]] as const)(
  'element%s changes actual hostile actions, beyond merely displaying a status', (index, speed, baseline) => {
    selected = index;
    const input = fixture(), target = input.enemyTeam[0], owner = input.playerTeam[0];
    if (!target || !owner) throw new Error('Missing control fixture');
    const combat = { ...input, enemyTeam: [{ ...target, stats: { ...target.stats, attackSpeed: speed },
      statuses: [{ id: 'stun', sourceId: 'isolation', stacks: 1, remaining: 2,
        appliedAtMs: 0, expiresAtMs: 2000 }] }] };
    const out = record(combat);
    const control = record({ ...combat, playerTeam: [{ ...owner, kind: 'merc' }] });
    const first = out.events.find(e => e.kind === 'action' && e.actor === 'target');
    expect(control.events.find(e => e.kind === 'action' && e.actor === 'target'))
      .toMatchObject({ simClockMs: baseline });
    expect(first?.simClockMs).toBeGreaterThan(baseline);
    if (index === 1) expect(first?.simClockMs).toBeCloseTo(3647.0588235294117, 9);
    else {
      expect(first?.simClockMs).toBe(3756);
      expect(out.events.filter(e => e.kind === 'action' && e.actor === 'target' &&
        e.simClockMs >= 2000 && e.simClockMs < 3000)).toEqual([]);
    }
  });

it('stacks genuine repeated poison bolts to ten while retaining the first captured rate', () => {
  selected = 3; repeated = true;
  const input = fixture(), target = input.enemyTeam[0];
  if (!target) throw new Error('Missing target');
  const out = record({ ...input, enemyTeam: [{ ...target, life: 1000000,
    stats: { ...target.stats, lifeMax: 1000000 } }] });
  const statuses = out.events.flatMap(e => e.kind === 'status-state' && e.target === 'target'
    ? e.statuses.filter(s => s.id === 'poison') : []);
  expect(Math.max(...statuses.map(s => s.stacks))).toBe(10);
  expect(statuses.every(s => s.stacks <= 10 && s.dotPerStack === 5)).toBe(true);
  expect(out.events.filter(e => e.kind === 'damage').some(e => e.amount === 250)).toBe(true);
  expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'plague')).toEqual([]);
  const total = out.events.reduce((sum, e) => sum +
    ((e.kind === 'damage' || e.kind === 'dot') && e.target === 'target' ? e.amount : 0), 0);
  expect(out.result.enemyTeam[0]?.life).toBe(1000000 - total);
});

it.each([
  [0, 'burn', 'ignite', 3000, 10, 30],
  [1, 'chill', 'chill', 2000, undefined, 0],
  [2, 'paralyze', 'paralyze', 1000, undefined, 0],
  [3, 'poison', 'poison', 5000, 5, 25]
] as const)('paid %s Mage produces real %s state and periodic HP loss',
  (index, emitted, stored, duration, rate, periodicLoss) => {
    selected = index;
    const input = fixture(), before = structuredClone(input), out = record(input);
    const source = out.events.find(e => e.kind === 'damage' && e.target === 'target');
    expect(source).toMatchObject({ kind: 'damage', amount: 100,
      damageType: ELEMENTS[index], dodged: false, simClockMs: 2000 });
    if (source?.kind !== 'damage') throw new Error('Missing actual Mage hit');
    expect(out.events.filter(e => e.kind === 'summon')).toHaveLength(4);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
      .toEqual([expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 0 })]);
    expect(out.events.filter(e => e.kind === 'status' && e.target === 'target'))
      .toEqual([expect.objectContaining({ statusId: emitted, simClockMs: 2000 })]);
    const observation = out.events.find(e => e.kind === 'status-state' && e.target === 'target' &&
      e.simClockMs === 2000 && e.statuses.some(s => s.id === stored));
    expect(observation).toBeDefined();
    if (observation?.kind !== 'status-state') throw new Error('Missing status state');
    expect(observation.statuses.find(s => s.id === stored)).toMatchObject({
      sourceId: source.source, stacks: 1, appliedAtMs: 2000, expiresAtMs: 2000 + duration,
      ...(rate === undefined ? {} : { dotPerStack: rate }) });
    const periodic = out.events.filter(e => e.kind === 'dot' && e.target === 'target');
    expect(periodic.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(periodicLoss);
    expect(out.result.enemyTeam[0]?.life).toBe(900 - periodicLoss);
    expect(out.result.enemyTeam[0]?.statuses.map(s => s.id)).toEqual(['stun']);
    expect(input).toEqual(before);
    expect(record(input)).toEqual(out);
    created = 0; expect(runBattle(input)).toEqual(out.result);
    record({ ...input, seed: 91 }); expect(record(input)).toEqual(out);
  });
