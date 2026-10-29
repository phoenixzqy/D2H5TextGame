import { afterEach, beforeEach, expect, it } from 'vitest';
import { MERC_BASH_SKILL } from '../skills/merc-bash';
import { loadDefaultSkills, registerSkill } from '../skills/registry';
import { statusActiveAt } from './status';
import { runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
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
  return { seed: 7, playerTeam: [{ ...unit('merc', 'player'), skillOrder: ['mskill-bash'],
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
const hits = (r: ReturnType<typeof runBattleRecorded>) => r.events
  .filter(e => e.kind === 'damage').filter(e => e.source === 'merc');
function arithmetic() {
  const effect = MERC_BASH_SKILL.effects[0];
  if (effect?.kind !== 'damage') throw new Error('Missing native Bash');
  // Narrow numeric fixture fixes base/hit decisions; native RNG has separate literal cases.
  registerSkill({ ...MERC_BASH_SKILL, effects: [{ ...effect, base: [25, 25], alwaysHits: true }] });
}
beforeEach(() => { loadDefaultSkills(); });
afterEach(() => { loadDefaultSkills(); });

it.each([1, 20])('uses two flat ordinary attempts at rank %i without mana or rank growth', rank => {
  const out = record(scenario({ skillLevels: { 'mskill-bash': rank } }));
  expect(hits(out)).toEqual([25, 31].map((amount): unknown => expect.objectContaining({
    amount, crit: false, dodged: false, target: 'target', simClockMs: 1700 })));
  expect(out.result.enemyTeam[0]?.life).toBe(999944);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'merc')).toHaveLength(1);
});

it.each([
  { attack: 0, increase: 0, amount: 25 }, { attack: 200, increase: 0, amount: 25 },
  { attack: 100, increase: .3, amount: 32 }
])('keeps literal flat25 damage independent of Attack $attack with increase $increase', row => {
  arithmetic();
  expect(hits(record(scenario({ stats: { ...unit('merc', 'player').stats, attack: row.attack },
    increasedDamagePct: { physical: row.increase } })))).toEqual([row.amount, row.amount]
    .map((amount): unknown => expect.objectContaining({ amount, crit: false, dodged: false })));
});

it('preserves ordinary critical, party increase, resistance and flat Defense settlement', () => {
  arithmetic();
  const out = record(scenario({ increasedDamagePct: { physical: .3 },
    stats: { ...unit('merc', 'player').stats, critChance: 1 } },
  { stats: { ...unit('target', 'enemy').stats, defense: 7,
    resistances: { ...unit('target', 'enemy').stats.resistances, physical: 50 } } }));
  // floor(25 * 1.3 * 2 * .5 - 7) = 25; no Jab Attack or +50% bonus.
  expect(hits(out)).toEqual([25, 25].map((amount): unknown => expect.objectContaining({ amount, crit: true })));
});

it('keeps minimum one damage after ordinary mitigation', () => {
  arithmetic();
  expect(hits(record(scenario({}, { stats: { ...unit('target', 'enemy').stats, defense: 1000 } }))))
    .toEqual([1, 1].map((amount): unknown => expect.objectContaining({ amount })));
});

it.each([
  { seed: 6, amounts: [25, 52], criticals: [false, true], misses: [false, false], procs: 1 },
  { seed: 7, amounts: [25, 62], criticals: [false, true], misses: [false, false], procs: 1 },
  { seed: 3, amounts: [50, 64], criticals: [true, true], misses: [false, false], procs: 2 },
  { seed: 5, amounts: [74, 34], criticals: [true, false], misses: [false, false], procs: 0 },
  { seed: 41, amounts: [0, 35], criticals: [false, false], misses: [true, false], procs: 0 },
  { seed: 1, amounts: [25, 0], criticals: [false, false], misses: [false, true], procs: 0 }
])('independently rolls hit/base/crit/stun in native order for seed $seed', row => {
  const out = record({ ...scenario({ stats: { ...unit('merc', 'player').stats, critChance: .5 } }), seed: row.seed });
  expect(hits(out).map(e => e.amount)).toEqual(row.amounts);
  expect(hits(out).map(e => e.crit)).toEqual(row.criticals);
  expect(hits(out).map(e => e.dodged)).toEqual(row.misses);
  expect(out.events.filter(e => e.kind === 'status' && e.target === 'target' && e.statusId === 'stun'))
    .toHaveLength(row.procs);
  // Seed6 procs after the first damage; seed7 after the second. Misses consume no proc roll.
  const first = out.events.findIndex(e => e.kind === 'damage' && e.source === 'merc');
  const second = out.events.findIndex((e, index) => index > first && e.kind === 'damage' && e.source === 'merc');
  const proc = out.events.findIndex(e => e.kind === 'status' && e.target === 'target' && e.statusId === 'stun');
  if (row.seed === 6) expect(proc).toBeGreaterThan(first);
  if (row.seed === 6) expect(proc).toBeLessThan(second);
  if (row.seed === 7) expect(proc).toBeGreaterThan(second);
});

it.each([{ tier: 'trash' as const, expiry: 2700 }, { tier: 'boss' as const, expiry: 2200 },
  { tier: 'chapter-boss' as const, expiry: 2200 }])('uses canonical finite stun and refresh for $tier', row => {
  const out = record({ ...scenario({}, { tier: row.tier }), seed: 3 });
  const states = out.events.filter(e => e.kind === 'status-state').filter(e => e.target === 'target');
  const applied = states.find(e => e.simClockMs === 1700);
  expect(applied?.statuses).toEqual([expect.objectContaining({ id: 'stun', stacks: 1,
    sourceId: 'merc', appliedAtMs: 1700, expiresAtMs: row.expiry })]);
  const stun = applied?.statuses[0];
  if (!stun) throw new Error('Missing actual Bash stun state');
  expect([1699, 1700, row.expiry - 1, row.expiry].map(clock => statusActiveAt(stun, clock)))
    .toEqual([false, true, true, false]);
  expect(states.find(e => e.simClockMs === row.expiry)?.statuses).toEqual([]);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'stunned', target: 'target', simClockMs: 2000 }));
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'target')[0])
    .toMatchObject({ simClockMs: 4000 });
});

it.each([{ expiry: 1701, skill: null }, { expiry: 1700, skill: 'mskill-bash' }])(
  'honors the actual cooldown opportunity at 1700ms with carried expiry $expiry', ({ expiry, skill }) => {
    const out = record(scenario({ cooldowns: { 'mskill-bash': expiry } }));
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'merc')).toEqual([
      expect.objectContaining({ simClockMs: 1700, skillId: skill })
    ]);
    expect(hits(out)).toHaveLength(skill === null ? 1 : 2);
  }
);

it('pays one full two-second cooldown and zero MP for a terminal two-hit action', () => {
  arithmetic();
  const out = record(scenario({}, { life: 40 }));
  expect(hits(out)).toHaveLength(2);
  expect(out.events.filter(e => e.kind === 'action')).toHaveLength(1);
  expect(out.result.playerTeam[0]).toMatchObject({ mana: 0, cooldowns: { 'mskill-bash': 2000 } });
});

it('does not retarget a replacement after the original enemy dies', () => {
  arithmetic();
  const input = scenario({}, { life: 1 });
  const out = record({ ...input, enemyTeam: [...input.enemyTeam, unit('replacement', 'enemy')] });
  expect(hits(out)).toEqual([expect.objectContaining({ target: 'target', amount: 25 })]);
  expect(out.result.enemyTeam.map(u => u.life)).toEqual([0, 1000000]);
});

it('stops after reflection kills the caster between attempts', () => {
  arithmetic();
  const out = record(scenario({ life: 1 }, { physicalReflectionPct: 1 }));
  expect(hits(out)).toEqual([expect.objectContaining({ amount: 25 })]);
  expect(out.result.playerTeam[0]?.life).toBe(0);
  expect(out.result.enemyTeam[0]?.life).toBe(999975);
  expect(out.result.winner).toBe('enemy');
});

it('keeps intervening basics outside the Bash sequence and its stun proc', () => {
  arithmetic();
  const out = record(scenario({ statuses: [hold(3601)], increasedDamagePct: { physical: .3 },
    stats: { ...unit('merc', 'player').stats, attackSpeed: 200 } }));
  expect(out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> =>
    e.kind === 'action' && e.actor === 'merc').map(e => e.skillId))
    .toEqual(['mskill-bash', null, null, 'mskill-bash']);
  expect(hits(out).filter(e => e.simClockMs === 1800)).toEqual([expect.objectContaining({ amount: 130 })]);
  expect(out.events.filter(e => e.kind === 'status' && e.simClockMs === 1800)).toEqual([]);
});
