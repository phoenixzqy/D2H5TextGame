import { beforeEach, expect, it } from 'vitest';
import { actionPeriodMs, hasBattleCommandCarry, MAX_SIM_MS, runBattle, runBattleRecorded,
  type BattleCommandCarry, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import { captureBattleCommandPassiveProfile } from '../skills/battle-command';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { createManaRecoveryIntegral, exportManaRecoveryCarry, integrateManaRecoveryBetween } from './mana-recovery';
import { composeStatAura } from '../skills/stat-auras';

const COMMAND = 'barbarian.battle_command', FINISH = 'fixture.carry-finish', PROBE = 'fixture.carry-probe';
function unit(id: string, side: 'player' | 'enemy'): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 100, mana: 11, skillOrder: [], skillLevels: {}, cooldowns: {}, activeBuffIds: [], statuses: [],
    enraged: false, summonedAdds: false, manaRegenPerSecond: .1, manaRegenBaselinePerSecond: .1,
    stats: { life: 100, lifeMax: 100, mana: 11, manaMax: 100, attack: 0, defense: 0, magicResist: 0,
      attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function hero(): CombatUnit {
  const base = unit('hero', 'player');
  return { ...base, battleCommandRank: 1, skillOrder: [COMMAND, FINISH],
    battleCommandPassives: { baseline: captureBattleCommandPassiveProfile(base),
      boosted: captureBattleCommandPassiveProfile({ ...base, manaRegenPerSecond: .5,
        stats: { ...base.stats, lifeMax: 150, defense: 20, attackSpeed: 125 } }) } };
}
function enemy(): CombatUnit {
  const base = unit('enemy', 'enemy');
  return { ...base, life: 1000000000, stats: { ...base.stats, lifeMax: 1000000000 },
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
}
function paid(statuses: CombatUnit['statuses'] = []) {
  const ally = { ...unit('ally', 'player'), kind: 'merc' as const,
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
  const input = { seed: 7, playerTeam: [{ ...hero(), statuses }, ally], enemyTeam: [enemy()] };
  const before = structuredClone(input), out = runBattleRecorded(input), carry = out.battleCommandCarry;
  expect(input).toEqual(before); expect(out.result.winner).toBe('player');
  expect(carry).toBeDefined(); if (!carry) throw new Error('Missing actual paid carry');
  const cast = out.events.find(e => e.kind === 'action' && e.skillId === COMMAND), end = out.events.at(-1);
  if (!cast || end?.kind !== 'end') throw new Error('Missing actual paid clocks');
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  return { out, carry, remaining: cast.simClockMs + 8000 - end.simClockMs };
}
function nextSnapshot(): CombatSnapshot {
  return { seed: 19, playerTeam: [{ ...hero(), battleCommandRank: 0, mana: 0,
    skillOrder: [PROBE], skillLevels: { [PROBE]: 1 } }], enemyTeam: [enemy()] };
}
beforeEach(() => {
  resetRegistry(); loadDefaultSkills();
  registerSkill({ id: FINISH, archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 60, manaCost: 0, effects: [{ kind: 'damage', damageType: 'physical', base: [2000000000, 2000000000] }] });
  registerSkill({ id: PROBE, archetype: 'fixture', target: 'single-enemy', minLevel: 1,
    cooldown: 0, manaCost: 0, effects: [{ kind: 'damage', damageType: 'fire', base: [10, 10], perRank: [10, 10] }] });
});

it('carries paid potency with exact expiry, fresh initial cadence and fractional action phase', () => {
  const { carry, remaining } = paid(), input = nextSnapshot(), before = structuredClone(input);
  const out = runBattleRecorded(input, carry);
  expect(input).toEqual(before); expect(runBattleRecorded(input, carry)).toEqual(out);
  expect(runBattle(input, carry)).toEqual(out.result);
  expect(out.events[0]).toMatchObject({ kind: 'status-state', initial: true, simClockMs: 0,
    statuses: [expect.objectContaining({ id: 'battle-command', expiresAtMs: remaining })] });
  expect(out.events.find(e => e.kind === 'stats-state')).toMatchObject({ simClockMs: 0,
    state: { life: 100, mana: 0, stats: { lifeMax: 150, defense: 20, attackSpeed: 125 } } });
  const actions = out.events.filter(e => e.kind === 'action' && e.actor === 'hero');
  const boosted = actionPeriodMs(125), baseline = actionPeriodMs(100);
  expect(actions[0]?.simClockMs).toBe(boosted);
  const prior = actions.filter(e => e.simClockMs < remaining).at(-1), next = actions.find(e => e.simClockMs >= remaining);
  if (!prior || !next) throw new Error('Missing actions at carried expiry');
  expect(next.simClockMs).toBeCloseTo(remaining + (prior.simClockMs + boosted - remaining) * baseline / boosted, 10);
  const hits = out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && !e.dodged);
  expect(hits.some(e => e.simClockMs < remaining)).toBe(true);
  expect(hits.filter(e => e.simClockMs < remaining).every(e => e.kind === 'damage' && e.amount === 20)).toBe(true);
  expect(hits.filter(e => e.simClockMs >= remaining).every(e => e.kind === 'damage' && e.amount === 10)).toBe(true);
  expect(out.events.find(e => e.kind === 'stats-state' && e.simClockMs === remaining))
    .toMatchObject({ state: { stats: { lifeMax: 100, defense: 0, attackSpeed: 100 } } });
  expect(out.events.some(e => e.kind === 'action' && e.skillId === COMMAND)).toBe(false);
  expect(out.battleCommandCarry).toBeUndefined();
});

it('settles boosted recovery through exact expiry and preserves existing fractional MP carry', () => {
  const { out: first, carry, remaining } = paid(), final = first.result.playerTeam[0];
  if (!final) throw new Error('Missing actual paid hero');
  const input = nextSnapshot(), base = input.playerTeam[0]; if (!base) throw new Error('Missing hero');
  const carried = { ...base, mana: final.mana, manaRegenCarry: final.manaRegenCarry ?? 0,
    manaRegenCompensation: final.manaRegenCompensation ?? 0, manaRegenExactCarry: final.manaRegenExactCarry ?? '0' };
  const previous = createManaRecoveryIntegral(carried.manaRegenCarry, carried.manaRegenCompensation, carried.manaRegenExactCarry);
  const during = integrateManaRecoveryBetween(.5, 0, remaining, previous);
  const after = integrateManaRecoveryBetween(.1, remaining, MAX_SIM_MS, during);
  const out = runBattleRecorded({ ...input, playerTeam: [carried] }, carry);
  expect(out.result.playerTeam[0]?.mana).toBe(final.mana + after.wholeGranted - previous.wholeGranted);
  expect(out.result.playerTeam[0]?.manaRegenExactCarry).toBe(exportManaRecoveryCarry(after).manaRegenExactCarry);
});

it.each(['json', 'structured', 'forged', 'embedded'] as const)('rejects %s copied/imported proof and bare markers', method => {
  const { carry } = paid(), input = nextSnapshot(), base = input.playerTeam[0];
  if (!base) throw new Error('Missing hero');
  const copied: BattleCommandCarry = method === 'json' ? JSON.parse(JSON.stringify(carry)) as BattleCommandCarry
    : method === 'structured' ? structuredClone(carry) : Object.freeze({}) as BattleCommandCarry;
  const marked = { ...base, activeBuffIds: ['battle-command'],
    statuses: [{ id: 'battle-command', sourceId: 'hero', stacks: 1, remaining: -1 }] };
  const snapshot = { ...input, playerTeam: [marked], ...(method === 'embedded' ? { battleCommandCarry: carry } : {}) };
  const out = runBattleRecorded(snapshot, method === 'embedded' ? undefined : copied);
  expect(hasBattleCommandCarry(copied, marked)).toBe(false);
  expect(out.events[0]).toMatchObject({ kind: 'status-state', initial: true, statuses: [] });
  expect(out.events.some(e => e.kind === 'stats-state')).toBe(false);
  expect(out.result.playerTeam[0]?.stats).toEqual(base.stats);
  expect(out.battleCommandCarry).toBeUndefined();
});

it.each(['id', 'kind', 'owner', 'dead', 'hostile', 'duplicate'] as const)('rejects mismatched/dead %s recipient', mismatch => {
  const { carry } = paid(), input = nextSnapshot(), base = input.playerTeam[0];
  if (!base) throw new Error('Missing hero');
  const changed = { ...base, ...(mismatch === 'id' ? { id: 'other' } : {}),
    ...(mismatch === 'kind' ? { kind: 'merc' as const } : {}),
    ...(mismatch === 'owner' ? { ownerId: 'other' } : {}),
    ...(mismatch === 'dead' ? { life: 0 } : {}),
    ...(mismatch === 'hostile' ? { side: 'enemy' as const } : {}) };
  const out = runBattleRecorded({ ...input, playerTeam: mismatch === 'duplicate' ? [changed, changed] : [changed] }, carry);
  expect(out.events.some(e => e.kind === 'stats-state')).toBe(false);
  expect(out.battleCommandCarry).toBeUndefined();
});

it('paid recipients survive an absent source and later arrivals receive no retroactive grant', () => {
  const { carry, remaining } = paid(), ally = { ...unit('ally', 'player'), kind: 'merc' as const,
    skillOrder: [PROBE], skillLevels: { [PROBE]: 1 } };
  const late = { ...ally, id: 'late' };
  const out = runBattleRecorded({ seed: 7, playerTeam: [ally, late], enemyTeam: [enemy()] }, carry);
  expect(out.events[0]).toMatchObject({ kind: 'status-state', target: 'ally',
    statuses: [expect.objectContaining({ id: 'battle-command', sourceId: 'hero' })] });
  expect(out.events[1]).toMatchObject({ kind: 'status-state', target: 'late', statuses: [] });
  for (const [source, amount] of [['ally', 20], ['late', 10]] as const) {
    const hits = out.events.filter(e => e.kind === 'damage' && e.source === source && !e.dodged && e.simClockMs < remaining);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every(e => e.kind === 'damage' && e.amount === amount)).toBe(true);
  }
});

it('rebases fractional terminal clocks exactly, without rounding the remaining paid interval', () => {
  const { carry, remaining } = paid([{ id: 'chill', sourceId: 'fixture', stacks: 1,
    remaining: 1, appliedAtMs: 2000.25, expiresAtMs: 2001.5 }]);
  expect(Number.isInteger(remaining)).toBe(false);
  const out = runBattleRecorded(nextSnapshot(), carry);
  expect(out.events[0]).toMatchObject({ statuses: [expect.objectContaining({ expiresAtMs: remaining })] });
  expect(out.events.find(e => e.kind === 'stats-state' && e.simClockMs > 0)?.simClockMs).toBe(remaining);
});

it('removes paid potency before an action exactly at expiry', () => {
  const { carry, remaining } = paid(), input = nextSnapshot(), fresh = hero();
  const profile = fresh.battleCommandPassives;
  if (!profile) throw new Error('Missing profiles');
  const accelerated = { ...input.playerTeam[0], ...fresh, battleCommandRank: 0, mana: 0,
    skillOrder: [PROBE], skillLevels: { [PROBE]: 1 },
    battleCommandPassives: { ...profile, boosted: { ...profile.boosted,
      stats: { ...profile.boosted.stats, attackSpeed: 150 } } } };
  expect(remaining).toBe(5 * actionPeriodMs(150));
  const out = runBattleRecorded({ ...input, playerTeam: [accelerated] }, carry);
  const action = out.events.findIndex(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs === remaining);
  const expired = out.events.findIndex(e => e.kind === 'stats-state' && e.simClockMs === remaining);
  expect(expired).toBeGreaterThan(-1); expect(action).toBeGreaterThan(expired);
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.simClockMs === remaining))
    .toEqual([expect.objectContaining({ amount: 10, dodged: false })]);
});

it('can pass the remaining payment through multiple waves without repaying or consuming a replay permit', () => {
  const { carry, remaining } = paid(), fresh = hero(), input = nextSnapshot();
  const short = { ...input, playerTeam: [{ ...fresh, mana: 0, skillOrder: [FINISH] }] };
  const before = structuredClone(short), middle = runBattleRecorded(short, carry), end = middle.events.at(-1);
  expect(short).toEqual(before); expect(middle.result.winner).toBe('player');
  if (end?.kind !== 'end' || !middle.battleCommandCarry) throw new Error('Missing next paid interval');
  expect(end.simClockMs).toBe(actionPeriodMs(125));
  expect(middle.events.some(e => e.kind === 'action' && e.skillId === COMMAND)).toBe(false);
  const last = runBattleRecorded(input, middle.battleCommandCarry);
  expect(last.events[0]).toMatchObject({ statuses: [expect.objectContaining({ expiresAtMs: remaining - end.simClockMs })] });
  expect(runBattleRecorded(short, carry)).toEqual(middle);
});

it('expires a nearly exhausted carry before the first action and retains the fractional pending phase', () => {
  const { carry, remaining } = paid(), input = nextSnapshot(), fresh = hero();
  const held = { ...fresh, mana: 0, skillOrder: [],
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
  const dying = { ...enemy(), life: remaining - 1, statuses: [...enemy().statuses,
    { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: 7, dotPerStack: 1000,
      appliedAtMs: 0, expiresAtMs: 7000 }] };
  const middle = runBattleRecorded({ ...input, playerTeam: [held], enemyTeam: [dying] }, carry);
  expect(middle.result.winner).toBe('player');
  expect(middle.events.at(-1)?.simClockMs).toBe(remaining - 1);
  if (!middle.battleCommandCarry) throw new Error('Missing final1ms carry');
  const out = runBattleRecorded(input, middle.battleCommandCarry);
  expect(out.events[0]).toMatchObject({ statuses: [expect.objectContaining({ expiresAtMs: 1 })] });
  expect(out.events.find(e => e.kind === 'stats-state' && e.simClockMs > 0)?.simClockMs).toBe(1);
  const first = out.events.find(e => e.kind === 'action' && e.actor === 'hero');
  expect(first?.simClockMs).toBeCloseTo(1 + (1500 - 1) * 1700 / 1500, 10);
  const hits = out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && !e.dodged);
  expect(hits.length).toBeGreaterThan(0);
  expect(hits.every(e => e.kind === 'damage' && e.amount === 10)).toBe(true);
});

it('clamps carried high HP once after fresh paid and ambient capacity, then clamps again on expiry without healing', () => {
  const { carry, remaining } = paid(), input = nextSnapshot(), fresh = hero();
  const statAura = composeStatAura({ id: 'hero', class: 'paladin', level: 30,
    selectedAuraId: 'paladin.vigor', skillLevels: { 'paladin.vigor': 20 } });
  if (!statAura) throw new Error('Missing synthetic Vigor');
  const out = runBattleRecorded({ ...input, statAura, playerTeam: [{ ...fresh,
    life: 1000, mana: 0, battleCommandRank: 0, skillOrder: [] }] }, carry);
  const first = 150 + Math.floor(150 * (statAura.bonuses.lifePct ?? 0));
  const expired = 100 + Math.floor(100 * (statAura.bonuses.lifePct ?? 0));
  expect(out.events.find(e => e.kind === 'stats-state')).toMatchObject({ simClockMs: 0,
    state: { life: first, stats: { lifeMax: first }, vigorLife: { baseLifeMax: 150, appliedLifeMax: first } } });
  expect(out.events.find(e => e.kind === 'stats-state' && e.simClockMs === remaining))
    .toMatchObject({ state: { life: expired, stats: { lifeMax: expired } } });
  expect(out.events.some(e => e.kind === 'heal' || e.kind === 'damage' && e.target === 'hero')).toBe(false);
});
