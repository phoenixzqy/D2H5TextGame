import { afterEach, beforeEach, expect, it } from 'vitest';
import { MERC_JAB_SKILL } from '../skills/merc-jab';
import { getSkill, loadDefaultSkills, registerSkill } from '../skills/registry';
import type { DamageEffect } from '../skills/effects';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const hold = (at = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1,
  remaining: -1, appliedAtMs: at });
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'merc' : 'monster', level: 30, tier: 'trash',
    life: 1000000, mana: 0,
    stats: { life: 1000000, lifeMax: 1000000, mana: 0, manaMax: 0, attack: 100,
      defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    basicAttack: { damageType: 'physical', damage: [100, 100] },
    statuses: [hold()], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function scenario(actor: Partial<CombatUnit> = {}, target: Partial<CombatUnit> = {}): CombatSnapshot {
  return { seed: 7, playerTeam: [{ ...unit('merc', 'player'), skillOrder: ['mskill-jab'],
    statuses: [hold(1701)], ...actor }], enemyTeam: [{ ...unit('target', 'enemy'), ...target }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), recording = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(recording);
  for (const original of [...input.playerTeam, ...input.enemyTeam]) {
    expect([...recording.result.playerTeam, ...recording.result.enemyTeam]
      .find(u => u.id === original.id)?.stats).toEqual(original.stats);
  }
  return recording;
}
const hits = (r: ReturnType<typeof runBattleRecorded>) => r.events.filter(e =>
  e.kind === 'damage' && e.source === 'merc');
function arithmetic() {
  const effect = MERC_JAB_SKILL.effects[0];
  if (effect?.kind !== 'damage') throw new Error('Missing native Jab');
  // Narrow pipeline fixture fixes base and hit decisions; native RNG is tested separately.
  registerSkill({ ...MERC_JAB_SKILL, effects: [{ ...effect, base: [20, 20], alwaysHits: true }] });
}
beforeEach(() => { loadDefaultSkills(); });
afterEach(() => { loadDefaultSkills(); });

it.each([1, 20])('uses three ordinary rolls at rank %i without mana or invented rank scaling', rank => {
  const out = record(scenario({ skillLevels: { 'mskill-jab': rank } }));
  expect(hits(out)).toEqual([177, 184, 180].map((amount): unknown => expect.objectContaining({
    amount, crit: false, dodged: false, target: 'target', simClockMs: 1700 })));
  expect(out.result.enemyTeam[0]?.life).toBe(999459);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
  expect(out.events.filter(e => e.kind === 'action')).toHaveLength(1);
});

it.each([
  { attack: 100, increase: 0, amount: 180 },
  { attack: 100, increase: .3, amount: 216 },
  { attack: 0, increase: 0, amount: 30 }
])('uses independent flat20 arithmetic with $attack Attack and $increase increase', row => {
  arithmetic();
  const out = record(scenario({ stats: { ...unit('merc', 'player').stats, attack: row.attack },
    increasedDamagePct: { physical: row.increase } }));
  expect(hits(out)).toEqual([row.amount, row.amount, row.amount]
    .map((amount): unknown => expect.objectContaining({ amount, crit: false, dodged: false })));
});

it('adds native Might to Jab before criticals, resistance and flat Defense', () => {
  arithmetic();
  const out = record(scenario({ mercMightAura: true, stats: { ...unit('merc', 'player').stats, critChance: 1 } },
    { stats: { ...unit('target', 'enemy').stats, defense: 7,
      resistances: { ...unit('target', 'enemy').stats.resistances, physical: 50 } } }));
  // (20 + 100) * (1 + .5 + .3) * 2 * .5 - 7 = 209.
  expect(hits(out)).toEqual([209, 209, 209].map((amount): unknown => expect.objectContaining({ amount, crit: true })));
});

it('preserves ordinary minimum one damage after mitigation for every attempt', () => {
  arithmetic();
  expect(hits(record(scenario({}, { stats: { ...unit('target', 'enemy').stats, defense: 1000 } }))))
    .toEqual([1, 1, 1].map((amount): unknown => expect.objectContaining({ amount })));
});

it('rolls misses independently, so a missed first attempt does not cancel later ones', () => {
  const out = record({ ...scenario(), seed: 41 });
  expect(hits(out)).toEqual([
    expect.objectContaining({ amount: 0, dodged: true, crit: false }),
    expect.objectContaining({ amount: 186, dodged: false, crit: false }),
    expect.objectContaining({ amount: 0, dodged: true, crit: false })
  ]);
});

it('rolls criticals independently within one native sequence', () => {
  expect(hits(record(scenario({ stats: { ...unit('merc', 'player').stats, critChance: .5 } }))))
    .toEqual([[177, false], [369, true], [180, false]].map(([amount, crit]): unknown =>
      expect.objectContaining({ amount, crit, dodged: false })));
});

it('stops at original target death without acquiring a living replacement', () => {
  const input = scenario({}, { life: 1 });
  const out = record({ ...input, enemyTeam: [...input.enemyTeam, unit('replacement', 'enemy')] });
  expect(hits(out)).toEqual([expect.objectContaining({ target: 'target', amount: 177 })]);
  expect(out.result.enemyTeam.map(u => u.life)).toEqual([0, 1000000]);
});

it('stops when reflection kills the mercenary between attempts', () => {
  const out = record(scenario({ life: 50 }, { physicalReflectionPct: 1 }));
  expect(hits(out)).toEqual([expect.objectContaining({ amount: 177 })]);
  expect(out.result.playerTeam[0]?.life).toBe(0);
  expect(out.result.enemyTeam[0]?.life).toBe(999823);
  expect(out.result.winner).toBe('enemy');
});

it.each([{ expiry: 1701, skill: null }, { expiry: 1700, skill: 'mskill-jab' }])(
  'honors the actual cooldown opportunity at 1700ms with carried expiry $expiry', ({ expiry, skill }) => {
    const out = record(scenario({ cooldowns: { 'mskill-jab': expiry } }));
    expect(out.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ simClockMs: 1700, skillId: skill })
    ]);
    expect(hits(out)).toHaveLength(skill === null ? 1 : 3);
  }
);

it('pays one full cooldown for a terminal three-hit sequence and keeps zero MP', () => {
  arithmetic();
  const out = record(scenario({}, { life: 500 }));
  expect(hits(out)).toHaveLength(3);
  expect(out.events.filter(e => e.kind === 'action')).toHaveLength(1);
  expect(out.result.playerTeam[0]).toMatchObject({ mana: 0, cooldowns: { 'mskill-jab': 1000 } });
});

it('does not leak Jab increase into the intervening basic attack under the same Attack/Might source', () => {
  const out = record(scenario({ mercMightAura: true, statuses: [hold(2701)],
    stats: { ...unit('merc', 'player').stats, attackSpeed: 200 } }));
  expect(out.events.filter(e => e.kind === 'action').map(e => e.skillId)).toEqual(['mskill-jab', null, 'mskill-jab']);
  expect(hits(out).filter(e => e.simClockMs === 1800)).toEqual([expect.objectContaining({ amount: 130 })]);
});

it.each(['mskill-basic-arrow', 'mskill-pierce-arrow', 'amazon.jab'])('preserves absent/zero effect controls for %s', id => {
  const native = getSkill(id);
  if (!native) throw new Error('Missing actual sibling ' + id);
  const effects = native.effects.map(effect => {
    if (effect.kind !== 'damage') throw new Error('Expected actual sibling damage');
    expect(effect).not.toHaveProperty('increasedDamagePct');
    return { ...effect, increasedDamagePct: 0 } satisfies DamageEffect;
  });
  const input = scenario({ skillOrder: [id], mana: 100, mercMightAura: true,
    stats: { ...unit('merc', 'player').stats, manaMax: 100 } });
  const absent = record(input);
  expect(absent.events.filter(e => e.kind === 'action')).toEqual([
    expect.objectContaining({ skillId: id })
  ]);
  registerSkill({ ...native, effects });
  expect(record(input)).toEqual(absent);
});
