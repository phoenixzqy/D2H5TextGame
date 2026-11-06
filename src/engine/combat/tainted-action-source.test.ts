import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { monsters } from '@/data/index';
import * as rngModule from '../rng';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { CombatUnit, MonsterTier } from './types';

const taintedId = 'monsters/act1.tainted';
function definition(id: string) {
  const def = monsters.find(row => row.id === id);
  if (!def) throw new Error('Missing canonical monster: ' + id);
  return def;
}
function skill(id: string) {
  const found = getSkill(id);
  if (!found) throw new Error('Missing default skill: ' + id);
  return found;
}
function tainted(level = 3, tier: MonsterTier = 'trash'): CombatUnit {
  return buildMonsterUnit({ def: definition(taintedId), level, tier,
    rng: rngModule.createRng(7), id: 'tainted' });
}
function snapshot(enemy: CombatUnit): CombatSnapshot {
  // Constructed passive tank: no attacks or reactions can alter the caster.
  // This proves the native action source, not player viability or balance.
  const hero: CombatUnit = { ...enemy, id: 'hero', kind: 'hero', side: 'player',
    life: 100_000, mana: 0, skillOrder: [],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    stats: { ...enemy.stats, attack: 0, life: 100_000, lifeMax: 100_000,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  return { seed: 13, act: 1, playerTeam: [hero], enemyTeam: [enemy] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), output = runBattleRecorded(input);
  expect(runBattleRecorded(input)).toEqual(output);
  expect(input).toEqual(before);
  return output;
}
function controlDamage(endpoint: 'min' | 'max'): void {
  const create = rngModule.createRng;
  vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
    // Each replay gets a fresh RNG. Only landed noncrit and base endpoints
    // are controlled; native skills, priority, cooldowns and delivery remain.
    const random = create(seed);
    vi.spyOn(random, 'nextInt').mockImplementation((min, max) => endpoint === 'min' ? min : max);
    vi.spyOn(random, 'chance').mockImplementation(probability => probability > 0.05);
    return random;
  });
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('Tainted native poison active and ordinary melee', () => {
  it('selects Spit and ordinary melee in the actual factory order, with delayed impacts', () => {
    const enemy = tainted(), def = definition(taintedId), spit = skill('monster-poison-spit');
    const sources = structuredClone({ def, spit });
    const output = record(snapshot(enemy));
    const actions = output.events.filter(event => event.kind === 'action' && event.actor === enemy.id);
    expect(actions.slice(0, 5)).toEqual([
      expect.objectContaining({ skillId: 'monster.poison_spit', simClockMs: 1780 }),
      expect.objectContaining({ skillId: null, simClockMs: 3560 }),
      expect.objectContaining({ skillId: 'monster.poison_spit', simClockMs: 5340 }),
      expect.objectContaining({ skillId: null, simClockMs: 7120 }),
      expect.objectContaining({ skillId: 'monster.poison_spit', simClockMs: 8900 })
    ]);
    // Damage events exist even on misses; hit outcomes do not govern cadence.
    expect(output.events.filter(event => event.kind === 'damage' && event.source === enemy.id &&
      event.damageType === 'poison').slice(0, 3).map(event => event.simClockMs))
      .toEqual([2280, 5840, 9400]);
    expect(enemy.skillOrder).toEqual(['monster-poison-spit']);
    expect(enemy.cooldowns).toEqual({});
    expect(enemy.mana).toBe(0);
    expect(enemy.basicAttackDelivery).toBe('melee');
    expect({ def, spit }).toEqual(sources);
  });

  it.each(['min', 'max'] as const)(
    'lands the %s initial Spit endpoint and resolved ordinary damage without changing priority', endpoint => {
      const base = tainted(3), later = tainted(17);
      const override = buildMonsterUnit({ def: definition(taintedId), level: 3, tier: 'trash',
        rng: rngModule.createRng(7), id: 'tainted', statOverrides: { attack: 112 } });
      // The exact override changes only scalar Attack and its ordinary range.
      expect({ ...override, stats: { ...override.stats, attack: base.stats.attack },
        attackRange: base.attackRange }).toEqual(base);
      const cases = [[base, 42], [later, 112], [override, 112]] as const;
      const inputs = cases.map(([enemy, expected]) => ({ expected,
        input: snapshot({ ...enemy, stats: { ...enemy.stats, critChance: 0 } }) }));
      controlDamage(endpoint);
      for (const { input, expected } of inputs) {
        const output = record(input);
        const hits = output.events.filter(event => event.kind === 'damage' && event.source === 'tainted');
        expect(hits.filter(event => event.simClockMs < 2280)).toEqual([]);
        expect(hits).toContainEqual(expect.objectContaining({ target: 'hero', damageType: 'poison',
          amount: endpoint === 'min' ? 20 : 30, crit: false, dodged: false, simClockMs: 2280 }));
        expect(output.events).toContainEqual(expect.objectContaining({ kind: 'status', target: 'hero',
          statusId: 'poison', simClockMs: 2280 }));
        expect(output.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'tainted',
          skillId: null, simClockMs: 3560 }));
        expect(hits).toContainEqual(expect.objectContaining({ target: 'hero', damageType: 'physical',
          amount: expected, crit: false, dodged: false, simClockMs: 3560 }));
      }
    }
  );

  it.each<[MonsterTier, number[]]>([
    ['trash', [32, 42, 87, 112]], ['elite', [42, 55, 113, 146]],
    // BUG432: rare Attack multipliers are 1.1 (minion) and 1.5 (leader).
    ['rare-minion', [35, 46, 96, 123]], ['champion', [48, 63, 131, 168]],
    ['rare-elite', [48, 63, 131, 168]]
  ])('retains the authored %s point ranges at L1/L3/L12/L17', (tier, expected) => {
    const units = [1, 3, 12, 17].map(level => tainted(level, tier));
    expect(units.map(unit => unit.stats.attack)).toEqual(expected);
    expect(units.map(unit => unit.attackRange)).toEqual(expected.map(attack => [attack, attack]));
    expect(units.every(unit => Object.isFrozen(unit.attackRange))).toBe(true);
    expect(units.every(unit => unit.stats.critChance === 0.05 && unit.stats.critDamage === 1.5)).toBe(true);
    expect(definition(taintedId)).toMatchObject({ canBeElite: true, canBeBoss: false });
  });

  it('uses the unchanged default skills and bundled provenance, rejecting the old same-ID clone', () => {
    const spit = skill('monster-poison-spit'), weak = skill('monster-weak-melee');
    expect(spit).toBe(skill('monster.poison_spit'));
    expect(spit).toMatchObject({ id: 'monster.poison_spit', target: 'single-enemy', cooldown: 2,
      manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'poison', base: [20, 30],
        projectileFlightMs: 500, applyStatus: { id: 'poison', stacksOnApply: 2, dotPctOfDamage: 0.05 } }] });
    const effect = spit.effects[0];
    if (effect?.kind !== 'damage') throw new Error('Missing default Spit damage');
    expect(effect.perRank).toBeUndefined();
    expect(effect.attackDamagePct).toBeUndefined();
    expect(effect.applyStatus?.chance).toBeUndefined();
    expect(spit.manaCostPerRank).toBeUndefined();
    expect(spit.cooldownPerRank).toBeUndefined();
    expect(getSkillDamageDelivery(spit)).toBe('spell');
    expect(weak).toMatchObject({ id: 'monster.weak_melee', cooldown: 1, manaCost: 0,
      effects: [{ kind: 'damage', damageType: 'physical', base: [10, 15] }] });
    expect(getSkillDamageDelivery(weak)).toBe('melee');
    expect(tainted().basicAttackDelivery).toBe('melee');
    const oldOrder = { ...definition(taintedId), skills: ['monster-weak-melee', 'monster-poison-spit'] };
    expect(buildMonsterUnit({ def: oldOrder, level: 3, tier: 'trash', rng: rngModule.createRng(7) })
      .basicAttackDelivery).toBeUndefined();
  });

  it('uses the adopted Afflicted signature and ordinary cadence alongside Tainted', () => {
    const enemy = buildMonsterUnit({ def: definition('monsters/act1.afflicted'), level: 3,
      tier: 'trash', rng: rngModule.createRng(7), id: 'afflicted' });
    const output = record(snapshot(enemy));
    expect(output.events.filter(event => event.kind === 'action' && event.actor === enemy.id).slice(0, 3))
      .toEqual([
        expect.objectContaining({ skillId: 'monster.poison_spit', simClockMs: 1740 }),
        expect.objectContaining({ skillId: null, simClockMs: 3480 }),
        expect.objectContaining({ skillId: 'monster.poison_spit', simClockMs: 5220 })
      ]);
    expect(enemy.skillOrder).toEqual(['monster-poison-spit']);
  });

  it('allows Spit every action at the exact cooldown boundary under stable Chill', () => {
    const enemy = { ...tainted(), statuses: [{ id: 'chill', sourceId: 'fixture', remaining: -1, stacks: 1 }] };
    const output = record(snapshot(enemy));
    const actions = output.events.filter(event => event.kind === 'action' && event.actor === enemy.id);
    expect(actions.slice(0, 3)).toEqual([2000, 4000, 6000].map((simClockMs): unknown => expect.objectContaining({
      skillId: 'monster.poison_spit', simClockMs })));
    expect(actions.every(event => event.kind === 'action' && event.skillId === 'monster.poison_spit')).toBe(true);
  });
});
