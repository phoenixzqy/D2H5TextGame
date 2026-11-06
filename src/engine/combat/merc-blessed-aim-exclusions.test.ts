import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from '@/stores/mercFactory';
import { mercToCombatUnit } from '@/stores/mercToCombatUnit';
import * as rngModule from '../rng';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const realCreateRng = rngModule.createRng;
const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'aim-exclusions',
  stacks: 1, remaining: -1, appliedAtMs });
function merc(id = 'mercs/act2-blessed-aim'): CombatUnit {
  const def = loadMercPool().pool.find(row => row.id === id);
  if (!def) throw new Error('Missing native merc: ' + id);
  return { ...mercToCombatUnit(createMercFromDef(def, 'aim-exclusions')), statuses: [hold()] };
}
function body(id: string, patch: Partial<CombatUnit> = {}): CombatUnit {
  const native = merc();
  return { ...native, id, kind: 'hero', level: 99, skillOrder: [],
    life: 1000000, mana: 1000000, attackRange: [10, 10], statuses: [hold()],
    stats: { ...native.stats, life: 1000000, lifeMax: 1000000, mana: 1000000, manaMax: 1000000,
      attack: 10, attackSpeed: 263, critChance: 0, critDamage: 2, defense: 0,
      magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } }, ...patch };
}
function enemy(patch: Partial<CombatUnit> = {}) {
  return body('target', { kind: 'monster', side: 'enemy', ...patch });
}
function observe(input: CombatSnapshot) {
  const chances: number[] = [];
  const spy = vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
    const rng = realCreateRng(seed);
    return { ...rng, chance: probability => { chances.push(probability); return rng.chance(probability); } };
  });
  try {
    const before = structuredClone(input), out = runBattleRecorded(input);
    expect(input).toEqual(before);
    return { out, chances, thresholds: chances.filter(p => p > 0 && p < 1) };
  } finally { spy.mockRestore(); }
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

it('aims the native Power Strike carrier without aiming its two auxiliary bolts', () => {
  const { out, thresholds } = observe({ seed: 7, playerTeam: [merc(),
    body('weapon', { skillOrder: ['amazon.power_strike'], statuses: [hold(401)] })], enemyTeam: [enemy()] });
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'weapon',
    skillId: 'amazon.power_strike', simClockMs: 400 }));
  expect(thresholds).toEqual([.895, .85, .85]);
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'weapon')).toHaveLength(4);
});

it('withdraws direct weapon accuracy at source death between scheduled attempts', () => {
  const aura = merc();
  const { out, thresholds } = observe({ seed: 7, playerTeam: [{ ...aura, life: 9,
    statuses: [hold(), { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1,
      dotPerStack: 10, damageType: 'poison' }] },
    body('weapon', { statuses: [hold(1201)] })], enemyTeam: [enemy()] });
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: aura.id, simClockMs: 900 }));
  expect(out.events.flatMap(e => e.kind === 'damage' && e.source === 'weapon' ? [e.simClockMs] : []))
    .toEqual([400, 800, 1200]);
  expect(thresholds).toEqual([.895, .895, .85]);
});

it('leaves actual paid Hydra head attempts ordinary while an allied weapon proves Aim is active', () => {
  const { out, thresholds } = observe({ seed: 7, playerTeam: [merc(),
    body('owner', { skillOrder: ['sorceress.hydra'], skillLevels: { 'sorceress.hydra': 1 }, hydraRank: 1 }),
    body('weapon', { statuses: [hold(401)] })], enemyTeam: [enemy()] });
  const spawn = out.events.find(e => e.kind === 'summon');
  if (spawn?.kind !== 'summon') throw new Error('Missing actual paid Hydra');
  expect(spawn.unit).toMatchObject({ summonTemplateId: 'hydra', basicAttackDelivery: 'spell' });
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'owner',
    skillId: 'sorceress.hydra', simClockMs: 0 }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'mana', target: 'owner', reason: 'cast', simClockMs: 0 }));
  const bolts = out.events.filter(e => e.kind === 'damage' && e.source === spawn.unit.id);
  expect(bolts.length).toBeGreaterThan(0);
  expect(thresholds.filter(p => p === .85)).toHaveLength(bolts.length);
  expect(thresholds.filter(p => p === .895)).toHaveLength(1);
  expect(thresholds.every(p => p === .85 || p === .895 || p === spawn.unit.stats.critChance)).toBe(true);
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'weapon')).toHaveLength(1);
});

it.each(['monster.weak_ranged', 'monster.weak_melee'])(
  'keeps native %s Armor contact distinct from active allied Aim', skillId => {
    const native = merc('mercs/act3-iron-wolf-frozen-armor');
    const wearer = { ...native, life: 10000, mana: 1000000, statuses: [hold(401)],
      stats: { ...body('stats').stats, attack: 1, attackSpeed: 263 } };
    const attacker = enemy({ id: 'hostile', life: 1500, skillOrder: [skillId],
      stats: { ...enemy().stats, attackSpeed: 100 }, statuses: [hold(1701),
        // Imported target control isolates native Armor; no earned-play claim.
        { id: 'taunt', sourceId: wearer.id, stacks: 1, remaining: 2, appliedAtMs: 0, expiresAtMs: 2000 },
        { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1, dotPerStack: 500, damageType: 'poison' }] });
    const { out, thresholds } = observe({ seed: 19, playerTeam: [merc(), wearer,
      body('weapon', { statuses: [hold(401)] })], enemyTeam: [attacker] });
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: wearer.id,
      skillId: 'mskill-frozen-armor', simClockMs: 400 }));
    expect(out.result.playerTeam.find(u => u.id === wearer.id)).toHaveProperty('mercFrozenArmor', { defense: 120 });
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: attacker.id, skillId }));
    const incoming = out.events.find(e => e.kind === 'damage' && e.source === attacker.id);
    expect(incoming).toMatchObject({ target: wearer.id, dodged: false,
      simClockMs: skillId === 'monster.weak_ranged' ? 2200 : 1700 });
    if (incoming?.kind !== 'damage') throw new Error('Missing actual native strike');
    expect(incoming.amount).toBeGreaterThan(0);
    // The enemy death also draws the ordinary HP/MP orb chances.
    expect(thresholds).toEqual([.895, .85, .25, .25]);
    const chills = out.events.filter(e => e.kind === 'status' && e.target === attacker.id && e.statusId === 'chill');
    expect(chills).toHaveLength(skillId === 'monster.weak_melee' ? 1 : 0);
  });
