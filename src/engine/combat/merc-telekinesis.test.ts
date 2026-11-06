import { afterEach, beforeEach, expect, it } from 'vitest';
import { loadDefaultSkills } from '../skills/registry';
import { composeStatAura } from '../skills/stat-auras';
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
function scenario(actor: Partial<CombatUnit> = {}, target: Partial<CombatUnit> = {}): CombatSnapshot {
  return { seed: 3, playerTeam: [{ ...unit('merc', 'player'), skillOrder: ['mskill-telekinesis'],
    statuses: [hold(1701)], ...actor }], enemyTeam: [{ ...unit('target', 'enemy'), ...target }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  return out;
}
const hits = (out: ReturnType<typeof runBattleRecorded>) => out.events
  .filter(event => event.kind === 'damage').filter(event => event.source === 'merc');
beforeEach(() => { loadDefaultSkills(); });
afterEach(() => { loadDefaultSkills(); });

it.each([1, 20])('keeps rank%i flat, zero-cost and independent of Attack', rank => {
  for (const attack of [0, 200]) {
    const out = record(scenario({ skillLevels: { 'mskill-telekinesis': rank },
      stats: { ...unit('merc', 'player').stats, attack } }));
    expect(hits(out)).toEqual([expect.objectContaining({ amount: 20, crit: false, dodged: false,
      damageType: 'arcane', target: 'target', simClockMs: 1700 })]);
    expect(out.result.playerTeam[0]?.mana).toBe(0);
  }
});

it.each([{ crit: 1, amount: 19 }, { crit: 1.2, amount: 20 }])('retains increases, resistance, MR and crit overflow=$crit', row => {
  const out = record(scenario({ increasedDamagePct: { arcane: .3 },
    stats: { ...unit('merc', 'player').stats, critChance: row.crit } },
  { stats: { ...unit('target', 'enemy').stats, defense: 9999, magicResist: 7,
    resistances: { ...unit('target', 'enemy').stats.resistances, arcane: 50 } } }));
  // Seed3 base20; floor(20 * 1.3 * (2 or 2.1) * .5 - 7).
  expect(hits(out)[0]).toMatchObject({ amount: row.amount, crit: true });
  expect(out.result.playerTeam[0]?.stats.critChance).toBe(row.crit);
});

it('adds personal and real party Arcane increases through the ordinary pipeline', () => {
  const input = scenario({ increasedDamagePct: { arcane: .3 },
    stats: { ...unit('merc', 'player').stats, critChance: 1.2 } },
  { stats: { ...unit('target', 'enemy').stats, magicResist: 7,
    resistances: { ...unit('target', 'enemy').stats.resistances, arcane: 50 } } });
  const statAura = composeStatAura({ id: 'hero', class: 'paladin', level: 30,
    skillLevels: { 'paladin.conviction': 1 }, selectedAuraId: 'paladin.conviction' }, 'merc');
  if (!statAura) throw new Error('Missing real selected Conviction');
  const out = record({ ...input, statAura, playerTeam: [...input.playerTeam,
    { ...unit('hero', 'player'), kind: 'hero', statuses: [hold()] }] });
  // floor(20 * (1 + .3 + .01) * 2.1 * .75 - 7) =34; Conviction lowers resistance25.
  expect(hits(out)[0]).toMatchObject({ amount: 34, crit: true });
});

it('uses magical dodge and minimum mitigated damage without inheriting physical dodge', () => {
  const out = record(scenario({}, { stats: { ...unit('target', 'enemy').stats,
    physDodge: 1, magicResist: 1000 } }));
  expect(hits(out)[0]).toMatchObject({ amount: 1, dodged: false });
  const missed = record(scenario({}, { stats: { ...unit('target', 'enemy').stats, magicDodge: 1 } }));
  expect(hits(missed)[0]).toMatchObject({ amount: 0, dodged: true, crit: false });
  expect(missed.events.filter(event => event.kind === 'status')).toEqual([]);
});

it.each([{ seed: 9, amount: 31, dodged: false }, { seed: 41, amount: 0, dodged: true }])(
  'does not control a non-proc or missed native attempt with seed$seed', row => {
    const out = record({ ...scenario(), seed: row.seed });
    expect(hits(out)[0]).toMatchObject({ amount: row.amount, dodged: row.dodged, crit: false });
    expect(out.events.filter(event => event.kind === 'status')).toEqual([]);
  });

it.each([{ tier: 'trash' as const, expiry: 2700 }, { tier: 'boss' as const, expiry: 2200 },
  { tier: 'chapter-boss' as const, expiry: 2200 }])('expires $tier control exactly and resumes normal cadence', row => {
  const out = record(scenario({}, { tier: row.tier }));
  const application = out.events.filter(event => event.kind === 'status-state').find(event =>
    event.target === 'target' && event.simClockMs === 1700);
  expect(application?.statuses).toEqual([expect.objectContaining({ id: 'stun', sourceId: 'merc', stacks: 1,
    appliedAtMs: 1700, expiresAtMs: row.expiry })]);
  const status = application?.statuses[0];
  if (!status) throw new Error('Missing landed native Stun');
  expect([1699, 1700, row.expiry - 1, row.expiry].map(clock => statusActiveAt(status, clock)))
    .toEqual([false, true, true, false]);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'stunned', target: 'target', simClockMs: 2000 }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'target',
    simClockMs: row.expiry, statuses: [] }));
  expect(out.events.find(event => event.kind === 'action' && event.actor === 'target'))
    .toMatchObject({ simClockMs: 4000 });
});

it.each([1800, 5000])('retains an active source and later non-stacking expiry from %ims', expiry => {
  const out = record(scenario({}, { statuses: [{ id: 'stun', sourceId: 'original', stacks: 1,
    remaining: 5, appliedAtMs: 0, expiresAtMs: expiry }] }));
  const changes = out.events.filter(event => event.kind === 'status-state').filter(event => event.target === 'target');
  expect(changes.flatMap(event => event.statuses).every(status =>
    status.stacks === 1 && status.sourceId === 'original' && status.appliedAtMs === 0)).toBe(true);
  if (expiry < 2700) expect(changes).toContainEqual(expect.objectContaining({ simClockMs: 1700,
    statuses: [expect.objectContaining({ expiresAtMs: 2700, sourceId: 'original' })] }));
  expect(changes).toContainEqual(expect.objectContaining({ simClockMs: Math.max(2700, expiry), statuses: [] }));
});

it('uses a new source when the previous record expires exactly at the landed application', () => {
  const out = record(scenario({}, { statuses: [{ id: 'stun', sourceId: 'expired', stacks: 1,
    remaining: 1.7, appliedAtMs: 0, expiresAtMs: 1700 }] }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'target', simClockMs: 1700,
    statuses: [expect.objectContaining({ sourceId: 'merc', appliedAtMs: 1700, expiresAtMs: 2700 })] }));
});

it('selects the first living hostile without hitting friendly, dead or later summon bodies', () => {
  const input = scenario(), out = record({ ...input,
    playerTeam: [...input.playerTeam, { ...unit('ally', 'player'), statuses: [hold()] }],
    enemyTeam: [{ ...unit('dead', 'enemy'), life: 0 }, unit('bystander', 'enemy'),
      { ...unit('summon', 'enemy'), kind: 'summon' }] });
  expect(hits(out).map(event => [event.target, event.amount])).toEqual([['bystander', 20]]);
  expect(out.events.filter(event => event.kind === 'status').filter(event => event.statusId === 'stun')
    .map(event => event.target)).toEqual(['bystander']);
  expect(out.result.enemyTeam.find(target => target.id === 'summon')?.life).toBe(1000000);
});

it('uses hostile side membership when an enemy casts the native attack', () => {
  const hero = { ...unit('hero', 'player'), kind: 'hero' as const,
    stats: { ...unit('hero', 'player').stats, attackSpeed: 0 } };
  const caster = { ...unit('caster', 'enemy'), skillOrder: ['mskill-telekinesis'], statuses: [hold(1701)],
    stats: { ...unit('caster', 'enemy').stats, attackSpeed: 100 } };
  const out = record({ seed: 3, playerTeam: [hero], enemyTeam: [caster] });
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'damage', source: 'caster', target: 'hero',
    amount: 20, simClockMs: 1700 }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'hero', simClockMs: 1700,
    statuses: [expect.objectContaining({ sourceId: 'caster', expiresAtMs: 2700 })] }));
});

it.each([1700, 1701])('honors carried exact cooldown at %ims and preserves basic fallback', expiry => {
  const out = record(scenario({ cooldowns: { 'mskill-telekinesis': expiry } }));
  expect(out.events.find(event => event.kind === 'action' && event.actor === 'merc'))
    .toMatchObject({ simClockMs: 1700, skillId: expiry === 1700 ? 'mskill-telekinesis' : null });
});

it('pays one cooldown and zero MP, subtracts elapsed time and recasts on the first ready action', () => {
  const terminal = record(scenario({}, { life: 22,
    statuses: [{ id: 'ignite', sourceId: 'fixture', stacks: 1, remaining: -1, dotPerStack: 1 }] }));
  expect(terminal.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'target', simClockMs: 2000 }));
  expect(terminal.result.playerTeam[0]).toMatchObject({ mana: 0, cooldowns: { 'mskill-telekinesis': 1700 } });
  const out = record(scenario({ statuses: [hold(5101)] }, { statuses: [hold()] }));
  expect(out.events.filter(event => event.kind === 'action').filter(event => event.actor === 'merc')
    .map(event => [event.simClockMs, event.skillId])).toEqual([
    [1700, 'mskill-telekinesis'], [3400, null], [5100, 'mskill-telekinesis']
  ]);
});

it.each([{ life: 0 }, { statuses: [hold()] }])('never pays when the caster cannot act: %j', patch => {
  const input = scenario(patch), out = record({ ...input, playerTeam: [...input.playerTeam,
    { ...unit('ally', 'player'), kind: 'hero', statuses: [hold()] }] });
  expect(hits(out)).toEqual([]);
  expect(out.events.some(event => event.kind === 'action' && event.actor === 'merc')).toBe(false);
  expect(out.result.playerTeam[0]).toMatchObject({ mana: 0, cooldowns: {} });
});

it('preserves finite control after source death while a surviving ally keeps combat alive', () => {
  const input = scenario({ life: 2, statuses: [hold(1701),
    { id: 'ignite', sourceId: 'target', stacks: 1, remaining: -1, dotPerStack: 1 }] });
  const out = record({ ...input, playerTeam: [...input.playerTeam,
    { ...unit('ally', 'player'), kind: 'hero', statuses: [hold()] }] });
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'merc', simClockMs: 2000 }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'target',
    simClockMs: 2700, statuses: [] }));
  expect(out.events.find(event => event.kind === 'action' && event.actor === 'target')).toMatchObject({ simClockMs: 4000 });
});

it('settles target death once without reviving or allowing another paid action', () => {
  const out = record(scenario({}, { life: 1 }));
  expect(hits(out)).toHaveLength(1);
  expect(out.result.enemyTeam[0]?.life).toBe(0);
  expect(out.events.filter(event => event.kind === 'death' && event.target === 'target')).toHaveLength(1);
  expect(out.events.filter(event => event.kind === 'action' && event.actor === 'merc')).toHaveLength(1);
  expect(out.result.playerTeam[0]?.cooldowns).toEqual({ 'mskill-telekinesis': 2000 });
  expect(out.result.winner).toBe('player');
});

it('retains ordinary retaliation settlement when Chilling Armor kills the caster', () => {
  const hero = { ...unit('hero', 'player'), kind: 'hero' as const, statuses: [hold()],
    skillLevels: { 'skills-sorceress-chilling-armor': 1 }, activeBuffIds: ['chilling-armor'],
    coldArmors: { 'chilling-armor': { sourceId: 'hero', rank: 1 } } };
  const caster = { ...unit('caster', 'enemy'), life: 1, skillOrder: ['mskill-telekinesis'],
    stats: { ...unit('caster', 'enemy').stats, attackSpeed: 100 }, statuses: [hold(1701)] };
  const out = record({ seed: 3, playerTeam: [hero], enemyTeam: [caster] });
  const damage = out.events.filter(event => event.kind === 'damage');
  expect(damage.filter(event => event.source === 'caster')).toEqual([
    expect.objectContaining({ target: 'hero', amount: 20, damageType: 'arcane', simClockMs: 1700 })
  ]);
  expect(damage.filter(event => event.source === 'hero')).toEqual([
    expect.objectContaining({ target: 'caster', damageType: 'cold', simClockMs: 1700 })
  ]);
  expect(out.result.enemyTeam[0]?.life).toBe(0);
  expect(out.result.winner).toBe('player');
});
