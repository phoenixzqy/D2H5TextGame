import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import * as rngModule from '@/engine/rng';
import { runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { getSkill, loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import { useInventoryStore } from './inventoryStore';

const realCreateRng = rngModule.createRng;
const originalInventory = useInventoryStore.getState();
const hold = { id: 'stun', stacks: 1, sourceId: 'constructed-aim-hold', remaining: -1 };
const AIM = 'aura-blessed-aim';

function fixture(rank: number, dodge: number): CombatSnapshot {
  const def = loadMercPool().pool.find(row => row.id === 'mercs/act2-blessed-aim');
  if (!def) throw new Error('Missing actual Blessed Aim mercenary');
  const owned = createMercFromDef(def, 'aim-primary');
  const native = mercToCombatUnit(owned);
  const merc: CombatUnit = { ...native, life: 1000000, mana: 0, statuses: [hold],
    skillLevels: { ...native.skillLevels, [AIM]: rank },
    stats: { ...native.stats, life: 1000000, lifeMax: 1000000, attack: 1,
      mana: 0, manaMax: 0, critChance: 0, attackSpeed: 100 } };
  // Verified empty original equipment classifies a real factory basic as melee.
  const projected = playerToCombatUnit(createMockPlayer('Constructed Aim', 'sorceress'));
  const hero: CombatUnit = { ...projected, life: 1000000, skillOrder: [], skillLevels: {},
    stats: { ...projected.stats, life: 1000000, lifeMax: 1000000, attack: 1,
      attackSpeed: 263, critChance: 0 } };
  const enemy: CombatUnit = { ...hero, id: 'aim-primary-target', name: 'fixture',
    side: 'enemy', kind: 'monster', life: 1000000, statuses: [hold],
    stats: { ...hero.stats, life: 1000000, lifeMax: 1000000, defense: 0,
      magicResist: 0, physDodge: dodge, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  return { seed: 7, playerTeam: [hero, merc], enemyTeam: [enemy] };
}

function observe(input: CombatSnapshot) {
  const probabilities: number[] = [];
  // Observe and delegate the real seeded draws; do not mock hit outcomes or combat.
  const spy = vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
    const inner = realCreateRng(seed);
    return { ...inner, chance: probability => {
      probabilities.push(probability);
      return inner.chance(probability);
    } };
  });
  try {
    const out = runBattleRecorded(input);
    // Only the hero acts. Its crit chance is0 and there are no deaths/status attacks.
    return { out, hitProbabilities: probabilities.filter(probability => probability !== 0) };
  } finally { spy.mockRestore(); }
}

beforeEach(() => {
  resetRegistry(); loadDefaultSkills();
  useInventoryStore.setState({ equipped: {} });
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills();
  useInventoryStore.setState(originalInventory, true);
});

it.each([
  [1, 0, 0.85, 0.895], [20, 0, 0.85, 0.895],
  [1, 0.2, 0.65, 0.755], [20, 0.2, 0.65, 0.755]
])('actual pool/factory aura rank%i reduces the native weapon miss chance at dodge%s',
  (rank, dodge, ordinary, aimed) => {
    const input = fixture(rank, dodge), before = structuredClone(input);
    const hero = input.playerTeam[0], merc = input.playerTeam[1];
    if (!hero || !merc) throw new Error('Missing native primary team');
    expect(hero.basicAttackDelivery).toBe('melee');
    const control = observe({ ...input, playerTeam: [hero] });
    const active = observe(input);
    expect(control.hitProbabilities.length).toBeGreaterThan(0);
    for (const probability of control.hitProbabilities) expect(probability).toBeCloseTo(ordinary, 15);
    expect(active.hitProbabilities).toHaveLength(control.hitProbabilities.length);
    // These are literal independent thresholds, not a call to the production formula.
    for (const probability of active.hitProbabilities) expect(probability).toBeCloseTo(aimed, 15);
    const times = (out: typeof active.out) => out.events.filter(event =>
      event.kind === 'action' && event.actor === hero.id).map(event => event.simClockMs);
    expect(times(active.out)).toEqual(times(control.out));
    expect(active.out.events.some(event => event.kind === 'action' && event.actor === merc.id)).toBe(false);
    expect(merc).toHaveProperty('mercBlessedAimAura', true);
    expect(getSkill(AIM)).toMatchObject({ trigger: 'passive', target: 'all-allies',
      manaCost: 0, cooldown: 0, effects: [] });
    expect(input).toEqual(before);
    expect(observe(input).out).toEqual(active.out);
  });
