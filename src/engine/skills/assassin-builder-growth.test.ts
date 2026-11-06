import { beforeEach, expect, it } from 'vitest';
import { runBattleRecorded, type CombatSnapshot } from '../combat/combat';
import type { CombatUnit } from '../combat/types';
import { AssassinCharges, composeAssassinMartialRanks, cobraChargeRecovery } from './assassin-charges';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel } from './displayStats';
import { loadDefaultSkills } from './registry';
import { createSkillValidator } from './skill-validator';

beforeEach(loadDefaultSkills);
const validate = createSkillValidator();
const cases = [
  { id: 'assassin.cobra_strike' as const, slug: 'cobra-strike', rank: 6, cost: 9,
    damageType: 'physical', base: [55, 80], growth: 360, landed: [564, 577] },
  { id: 'assassin.fists_of_fire' as const, slug: 'fists-of-fire', rank: 8, cost: 5,
    damageType: 'fire', base: [45, 70], growth: 120, landed: [522, 547] }
];

function firstPaidHit(entry: typeof cases[number], rank: number, defense = 363): number {
  const skillLevels = { 'assassin.tiger_strike': 1, [entry.id]: rank };
  const hero: CombatUnit = {
    id: 'hero', name: 'Invested martial regression', side: 'player', kind: 'hero', tier: 'trash',
    level: 49, life: 5000, mana: 5000, cooldowns: {}, activeBuffIds: [], enraged: false,
    skillOrder: [entry.id], skillLevels,
    assassinMartialRanks: composeAssassinMartialRanks({ class: 'assassin', level: 49,
      comboOrder: [entry.id], skillLevels }),
    // At speed 100 the first action is at 1700ms; allow it, then stop further casts.
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1, appliedAtMs: 1701 }],
    stats: { life: 5000, lifeMax: 5000, mana: 5000, manaMax: 5000, attack: 274.7, defense: 0,
      magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2.19, physDodge: 0,
      magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } }
  };
  const enemy: CombatUnit = { ...hero, id: 'enemy', kind: 'monster', side: 'enemy',
    life: 100000, mana: 0, skillOrder: [], skillLevels: {}, assassinMartialRanks: {},
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1, appliedAtMs: 0 }],
    stats: { ...hero.stats, life: 100000, lifeMax: 100000, mana: 0, manaMax: 0,
      defense, magicResist: 144, resistances: { ...hero.stats.resistances, physical: 50 } } };
  const input: CombatSnapshot = { seed: 7, maxRounds: 1, playerTeam: [hero], enemyTeam: [enemy] };
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(out.events.filter(e => e.kind === 'action').map(({ kind, actor, skillId }) =>
    ({ kind, actor, skillId }))).toEqual([
    { kind: 'action', actor: 'hero', skillId: entry.id }
  ]);
  expect(out.result.playerTeam[0]?.mana).toBe(5000 - entry.cost);
  const hit = out.events.find(e => e.kind === 'damage' && e.source === 'hero');
  if (!hit || hit.kind !== 'damage') throw new Error('Missing paid native builder hit');
  expect(hit).toMatchObject({ damageType: entry.damageType, dodged: false, crit: false });
  return hit.amount;
}

for (const entry of cases) {
  it(`${entry.id} rewards investment against Act IV mitigation without changing rank one or bypassing Defense`, () => {
    expect(firstPaidHit(entry, 1)).toBe(1);
    const invested = firstPaidHit(entry, entry.rank);
    expect(invested).toBeGreaterThanOrEqual(entry.landed[0] ?? 0);
    expect(invested).toBeLessThanOrEqual(entry.landed[1] ?? 0);
    expect(firstPaidHit(entry, entry.rank, 100000)).toBe(1);
  });

  it(`${entry.id} exposes invested damage at current/next/MAX without changing its source`, () => {
    const source = PLAYABLE_CLASS_SKILL_DATA.assassin.find(row => row.id === `skills-assassin-${entry.slug}`);
    if (!source) throw new Error('Missing actual martial source');
    const before = structuredClone(source);
    expect(validate(source), JSON.stringify(validate.errors)).toBe(true);
    for (const rank of [0, 1, entry.rank, 19, 20]) {
      const model = computeSkillDisplayModel(source, rank);
      for (const stats of [model.current, model.next]) {
        if (!stats) continue;
        expect(stats.damage).toEqual([{ type: entry.damageType,
          min: (entry.base[0] ?? 0) + entry.growth * (stats.rank - 1),
          max: (entry.base[1] ?? 0) + entry.growth * (stats.rank - 1) }]);
        expect(stats.manaCost).toBe(entry.cost);
      }
      if (rank === 20) expect(model.next).toBeUndefined();
    }
    expect(source).toEqual(before);
  });
}

it('uses each paid Fists rank once at release while keeping Cobra recovery and one-time consumption', () => {
  const charges = new AssassinCharges();
  expect(charges.gain('hero', 'assassin.cobra_strike', 6, 0)).toBe(true);
  for (const [clock, rank] of [1, 8, 20].entries())
    expect(charges.gain('hero', 'assassin.fists_of_fire', rank, clock)).toBe(true);
  const released = charges.consume('hero', 3);
  expect(released).toHaveLength(2);
  expect(released.find(row => row.builder === 'assassin.cobra_strike')?.effect).toBeUndefined();
  // floor(((45 + 0) + (45 + 840) + (45 + 2280)) / 2), and the corresponding maximum.
  expect(released.find(row => row.builder === 'assassin.fists_of_fire')?.effect).toMatchObject({
    kind: 'damage', damageType: 'fire', base: [1627, 1665],
    applyStatus: { id: 'burn', dotPctOfDamage: 0.1 }
  });
  expect(charges.consume('hero', 3)).toEqual([]);
  expect(cobraChargeRecovery(564, 1, 100, 100)).toEqual({ life: 56, mana: 56 });
});
