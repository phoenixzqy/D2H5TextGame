import { afterEach, beforeEach, expect, it } from 'vitest';
import { MERC_DIRECT_SKILLS } from '../skills/merc-direct';
import { loadDefaultSkills, registerSkill } from '../skills/registry';
import { statusActiveAt } from './status';
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
function scenario(suffix: string, actor: Partial<CombatUnit> = {}, target: Partial<CombatUnit> = {}): CombatSnapshot {
  return { seed: 5, playerTeam: [{ ...unit('merc', 'player'), skillOrder: [`mskill-${suffix}`],
    statuses: [hold(1701)], ...actor }], enemyTeam: [{ ...unit('a', 'enemy'), ...target }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  return out;
}
const hits = (out: ReturnType<typeof runBattleRecorded>) => out.events
  .filter(event => event.kind === 'damage').filter(event => event.source === 'merc');
const native = (suffix: string) => {
  const skill = MERC_DIRECT_SKILLS.find(candidate => candidate.id === `mskill-${suffix}`);
  if (!skill) throw new Error('Missing native merc skill');
  return skill;
};
function arithmetic(suffix: string) {
  const skill = native(suffix), effect = skill.effects[0];
  if (effect?.kind !== 'damage') throw new Error('Missing native damage');
  // Isolate arithmetic from hit/base variance; native RNG has separate literal cases.
  registerSkill({ ...skill, effects: [{ ...effect, base: [100, 100], alwaysHits: true }] });
}
beforeEach(() => { loadDefaultSkills(); });
afterEach(() => { loadDefaultSkills(); });

const cases = [
  { suffix: 'fire-ball', type: 'fire', amounts: [73] },
  { suffix: 'glacial-spike', type: 'cold', amounts: [56] },
  { suffix: 'charged-bolt', type: 'lightning', amounts: [12, 12, 12, 12, 12] },
  { suffix: 'smite', type: 'physical', amounts: [32] },
  { suffix: 'chop', type: 'physical', amounts: [48] },
  { suffix: 'pierce-thrust', type: 'physical', amounts: [30] },
  { suffix: 'basic-swing', type: 'physical', amounts: [28] }
];
for (const row of cases) {
  it.each([1, 20])(`keeps ${row.suffix} flat and zero-cost at rank %i`, rank => {
    for (const attack of [0, 200]) {
      const out = record(scenario(row.suffix, { skillLevels: { [`mskill-${row.suffix}`]: rank },
        stats: { ...unit('merc', 'player').stats, attack } }));
      expect(hits(out).map(event => event.amount)).toEqual(row.amounts);
      expect(out.events.filter(event => event.kind === 'action' && event.actor === 'merc')).toHaveLength(1);
      expect(out.result.playerTeam[0]?.mana).toBe(0);
    }
  });

  it(`retains ordinary increases, criticals, resistance and flat mitigation for ${row.suffix}`, () => {
    arithmetic(row.suffix);
    const out = record(scenario(row.suffix, { increasedDamagePct: { [row.type]: .3 },
      stats: { ...unit('merc', 'player').stats, critChance: 1 } },
    { stats: { ...unit('a', 'enemy').stats, defense: 7, magicResist: 7,
      resistances: { ...unit('a', 'enemy').stats.resistances, [row.type]: 50 } } }));
    // floor(100 * 1.3 * 2 * .5 - 7) = 123. Chop overflow raises multiplier to2.125.
    expect(hits(out)[0]).toMatchObject({ amount: row.suffix === 'chop' ? 131 : 123, crit: true });
    expect(out.result.playerTeam[0]?.stats.critChance).toBe(1);
    const minimum = record(scenario(row.suffix, {}, { stats: { ...unit('a', 'enemy').stats,
      defense: 1000, magicResist: 1000 } }));
    expect(hits(minimum)[0]?.amount).toBe(1);
  });

  it(`honors carried exact cooldown expiry and pays one cooldown for ${row.suffix}`, () => {
    const id = `mskill-${row.suffix}`;
    for (const expiry of [1700, 1701]) {
      const out = record(scenario(row.suffix, { cooldowns: { [id]: expiry } }));
      expect(out.events.find(event => event.kind === 'action' && event.actor === 'merc'))
        .toMatchObject({ simClockMs: 1700, skillId: expiry === 1700 ? id : null });
    }
    const terminal = record(scenario(row.suffix, {}, { life: 1 }));
    expect(terminal.result.playerTeam[0]).toMatchObject({ mana: 0, cooldowns: { [id]: native(row.suffix).cooldown * 1000 } });
    expect(hits(terminal)).toHaveLength(1);
  });
}

it.each(['fire-ball', 'glacial-spike', 'smite'])('never applies %s status on a missed attempt', suffix => {
  const out = record({ ...scenario(suffix), seed: 41 });
  expect(hits(out)).toEqual([expect.objectContaining({ amount: 0, dodged: true, crit: false })]);
  expect(out.events.filter(event => event.kind === 'status')).toEqual([]);
  expect(out.result.enemyTeam[0]?.life).toBe(1000000);
});

it.each(['fire-ball', 'pierce-thrust'])('uses first-two priority for %s without hitting a third or dead enemy', suffix => {
  const input = scenario(suffix);
  const out = record({ ...input, enemyTeam: [unit('dead', 'enemy'), unit('a', 'enemy'),
    { ...unit('summon', 'enemy'), kind: 'summon' as const }, unit('b', 'enemy')].map(target =>
    target.id === 'dead' ? { ...target, life: 0 } : target) });
  expect(hits(out).map(event => event.target)).toEqual(['summon', 'a']);
  expect(out.result.enemyTeam.find(target => target.id === 'b')?.life).toBe(1000000);
});

it('derives Burn from mitigated Fire Ball damage and expires it after three seconds', () => {
  const out = record(scenario('fire-ball', {}, { stats: { ...unit('a', 'enemy').stats,
    resistances: { ...unit('a', 'enemy').stats.resistances, fire: 50 } } }));
  expect(hits(out)[0]?.amount).toBe(36);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'a', simClockMs: 1700,
    statuses: [expect.objectContaining({ id: 'ignite', stacks: 1, sourceId: 'merc', dotPerStack: 3,
      damageType: 'fire', appliedAtMs: 1700, expiresAtMs: 4700 })] }));
  expect(out.events.filter(event => event.kind === 'dot' && event.target === 'a')
    .reduce((sum, event) => sum + (event.kind === 'dot' ? event.amount : 0), 0)).toBe(9);
  expect(out.result.enemyTeam[0]?.life).toBe(999955);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'a', statuses: [], simClockMs: 4700 }));
});

it('adds Burn only to the canonical five-stack cap while preserving an active aggregate rate', () => {
  const out = record(scenario('fire-ball', {}, { statuses: [{ id: 'ignite', stacks: 5, sourceId: 'old',
    remaining: 2, appliedAtMs: 0, expiresAtMs: 2000, dotPerStack: 2, damageType: 'fire' }] }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'a', simClockMs: 1700,
    statuses: [expect.objectContaining({ id: 'ignite', stacks: 5, sourceId: 'old', dotPerStack: 2, expiresAtMs: 4700 })] }));
});

it('applies finite 30%-proc Chill and delays actual enemy cadence without changing stored AttackSpeed', () => {
  const target = { stats: { ...unit('a', 'enemy').stats, attackSpeed: 90 } };
  const out = record({ ...scenario('glacial-spike', {}, target), seed: 3 });
  const state = out.events.filter(event => event.kind === 'status-state').find(event =>
    event.target === 'a' && event.simClockMs === 1700);
  expect(state?.statuses).toEqual([expect.objectContaining({ id: 'chill', stacks: 1,
    appliedAtMs: 1700, expiresAtMs: 3700 })]);
  const chill = state?.statuses[0];
  if (!chill) throw new Error('Missing native Chill');
  expect([1699, 1700, 3699, 3700].map(clock => statusActiveAt(chill, clock))).toEqual([false, true, true, false]);
  expect(out.events.find(event => event.kind === 'action' && event.actor === 'a')?.simClockMs).toBeGreaterThan(1780);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'a', statuses: [], simClockMs: 3700 }));
  expect(out.result.enemyTeam[0]?.stats.attackSpeed).toBe(90);
});

it.each([{ tier: 'trash' as const, expiry: 2700 }, { tier: 'boss' as const, expiry: 2200 },
  { tier: 'chapter-boss' as const, expiry: 2200 }])('uses canonical Smite stun for $tier', ({ tier, expiry }) => {
  const out = record({ ...scenario('smite', {}, { tier }), seed: 3 });
  expect(hits(out)[0]?.amount).toBe(22);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'a', simClockMs: 1700,
    statuses: [expect.objectContaining({ id: 'stun', stacks: 1, sourceId: 'merc', appliedAtMs: 1700, expiresAtMs: expiry })] }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'stunned', target: 'a', simClockMs: 2000 }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'a', statuses: [], simClockMs: expiry }));
});

it('rotates five independent native bolts and applies Paralyze with canonical diminishing returns', () => {
  const input = scenario('charged-bolt');
  const out = record({ ...input, enemyTeam: ['a', 'b', 'c'].map(id => unit(id, 'enemy')) });
  expect(hits(out).map(event => [event.target, event.amount])).toEqual([['a', 12], ['b', 12], ['c', 12], ['a', 12], ['b', 12]]);
  expect(out.events.filter(event => event.kind === 'status' && event.statusId === 'paralyze')).toHaveLength(3);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'a', simClockMs: 1700,
    statuses: [expect.objectContaining({ id: 'paralyze', stacks: 1, appliedAtMs: 1700, expiresAtMs: 2700 }),
      expect.objectContaining({ id: 'paralyze-cd', expiresAtMs: 6700 })] }));
  expect(out.events.filter(event => event.kind === 'stunned' && event.simClockMs === 2000)).toHaveLength(3);
  const single = record(input);
  expect(hits(single).map(event => event.amount)).toEqual([12, 12, 12, 12, 12]);
  expect(single.events.filter(event => event.kind === 'status' && event.statusId === 'paralyze')).toHaveLength(2);
});

it('rolls each bolt critical independently in native hit/crit/status/DR order', () => {
  const input = scenario('charged-bolt', { stats: { ...unit('merc', 'player').stats, critChance: .5 } });
  const out = record({ ...input, enemyTeam: ['a', 'b', 'c'].map(id => unit(id, 'enemy')) });
  expect(hits(out).map(event => event.amount)).toEqual([12, 24, 24, 12, 24]);
  expect(hits(out).map(event => event.crit)).toEqual([false, true, true, false, true]);
  expect(hits(out).map(event => event.target)).toEqual(['a', 'b', 'c', 'a', 'b']);
});

it('stops native bolts when an ordinary paid Chilling Armor reaction kills the caster', () => {
  // Explicit already-paid original-hero fixture, using native reaction/death settlement.
  const hero = { ...unit('hero', 'player'), kind: 'hero' as const, statuses: [hold()],
    skillLevels: { 'skills-sorceress-chilling-armor': 1 }, activeBuffIds: ['chilling-armor'],
    coldArmors: { 'chilling-armor': { sourceId: 'hero', rank: 1 } } };
  const caster = { ...unit('caster', 'enemy'), life: 1, skillOrder: ['mskill-charged-bolt'],
    stats: { ...unit('caster', 'enemy').stats, attackSpeed: 100 }, statuses: [hold(1701)] };
  const out = record({ seed: 5, playerTeam: [hero], enemyTeam: [caster] });
  const damage = out.events.filter(event => event.kind === 'damage');
  expect(damage.filter(event => event.source === 'caster')).toEqual([
    expect.objectContaining({ target: 'hero', amount: 12, damageType: 'lightning', simClockMs: 1700 })
  ]);
  expect(damage.filter(event => event.source === 'hero')).toEqual([
    expect.objectContaining({ target: 'caster', damageType: 'cold', simClockMs: 1700 })
  ]);
  expect(out.result.enemyTeam[0]?.life).toBe(0);
  expect(out.result.winner).toBe('player');
});

it('skips dead originals and stops the bolt sequence when no living original remains', () => {
  const input = scenario('charged-bolt');
  const some = record({ ...input, enemyTeam: [{ ...unit('a', 'enemy'), life: 1 }, unit('b', 'enemy')] });
  expect(hits(some).map(event => event.target)).toEqual(['a', 'b', 'b', 'b', 'b']);
  const all = record({ ...input, enemyTeam: ['a', 'b', 'c'].map(id => ({ ...unit(id, 'enemy'), life: 1 })) });
  expect(hits(all).map(event => event.target)).toEqual(['a', 'b', 'c']);
  expect(all.result.winner).toBe('player');
});

it('rolls bolt misses independently and does not inherit physical reflection on lightning hits', () => {
  const out = record({ ...scenario('charged-bolt', { life: 1 }, { physicalReflectionPct: 1 }), seed: 41 });
  expect(hits(out)).toHaveLength(5);
  expect(hits(out)[0]).toMatchObject({ amount: 0, dodged: true });
  expect(hits(out).some(event => event.amount === 12 && !event.dodged)).toBe(true);
  expect(out.events.some(event => event.kind === 'damage' && event.source === 'a' && event.simClockMs === 1700)).toBe(false);
});

it('keeps Chop critical bonus off intervening ordinary attacks and stored stats', () => {
  const out = record(scenario('chop', { statuses: [hold(1801)],
    stats: { ...unit('merc', 'player').stats, attackSpeed: 200 } }, { statuses: [hold()] }));
  expect(out.events.filter(event => event.kind === 'action').map(event => event.skillId))
    .toEqual(['mskill-chop', null]);
  expect(hits(out)[0]).toMatchObject({ amount: 48, crit: true, simClockMs: 900 });
  expect(hits(out)[1]).toMatchObject({ amount: 100, crit: false, simClockMs: 1800 });
  expect(out.result.playerTeam[0]?.stats.critChance).toBe(0);
});
