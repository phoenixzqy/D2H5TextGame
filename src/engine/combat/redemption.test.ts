import { beforeEach, describe, expect, it } from 'vitest';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';

const stun = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function unit(id: string, side: CombatUnit['side'], kind: CombatUnit['kind'] = side === 'player' ? 'hero' : 'monster'): CombatUnit {
  return { id, name: id, side, kind, level: 30, tier: 'trash', life: 50000, mana: 10,
    stats: { life: 100000, lifeMax: 100000, mana: 100, manaMax: 100, attack: 1, defense: 0,
      magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [stun], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false };
}
function body(id = 'body', deathAtMs = 1000): CombatUnit {
  return { ...unit(id, 'enemy'), life: deathAtMs / 1000, statuses: [stun,
    { id: 'ignite', sourceId: 'hero', stacks: 1, remaining: -1, expiresAtMs: deathAtMs, dotPerStack: 1 }] };
}
function aura(rank = 1) {
  return { selectedAuraId: 'paladin.redemption' as const, sourceHeroId: 'hero', fieldedMercCombatId: 'merc', rank, maxRank: 20,
    bonuses: { lifeRegenPct: .02 * rank, manaRegenPct: .02 * rank }, redemption: { intervalMs: 5000, life: 20, mana: 10 } };
}
type Input = Omit<CombatSnapshot, 'statAura'> & { readonly statAura?: unknown };
function input(rank = 1): Input {
  // Seed42's first primary death drops no orbs; separate seed7 coverage retains real orb behavior.
  return { seed: 42, playerTeam: [unit('hero', 'player'), unit('merc', 'player', 'merc')],
    enemyTeam: [body(), unit('target', 'enemy')], statAura: aura(rank) };
}
function record(snapshot: Input) {
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot as CombatSnapshot);
  expect(snapshot).toEqual(before); expect(runBattleRecorded(snapshot as CombatSnapshot)).toEqual(out);
  return out;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('selected Redemption authoritative corpse recovery', () => {
  it.each([[1, 20, 10], [2, 20, 10], [20, 28, 14]])('consumes one actual body once and restores rank%i HP/MP to eligible recipients', (rank, hp, mp) => {
    const out = record(input(rank));
    expect(out.events.filter(e => e.kind === 'heal').map(e => [e.target, e.amount, e.simClockMs]))
      .toEqual([['hero', hp, 5000], ['merc', hp, 5000]]);
    expect(out.result.playerTeam.map(u => [u.life, u.mana])).toEqual([[50000 + hp, 10 + mp], [50000 + hp, 10 + mp]]);
    expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedRedemption'))
      .toEqual([expect.objectContaining({ params: { count: 0, corpseId: 'body' }, simClockMs: 5000 })]);
    expect(out.events.filter(e => e.kind === 'mana').map(e => [e.target, e.mana, e.reason, e.simClockMs]))
      .toEqual([['hero', 10 + mp, 'redemption', 5000], ['merc', 10 + mp, 'redemption', 5000]]);
    expect(out.events.filter(e => e.kind === 'death').map(e => e.target)).toEqual(['body']);
    expect(out.events.some(e => e.kind === 'action')).toBe(false);
  });
  it('caps resources independently and excludes bench and summoned recipients', () => {
    const hero = { ...unit('hero', 'player'), life: 99997, mana: 99 };
    const merc = { ...unit('merc', 'player', 'merc'), life: 100000, mana: 98 };
    const out = record({ ...input(), playerTeam: [hero, merc, unit('bench', 'player', 'merc'),
      { ...unit('summon', 'player', 'summon'), summon: true, summonOwnerId: 'hero' }] });
    expect(out.events.filter(e => e.kind === 'heal')).toEqual([expect.objectContaining({ target: 'hero', amount: 3 })]);
    expect(out.result.playerTeam.map(u => [u.life, u.mana])).toEqual([[100000, 100], [100000, 100], [50000, 10], [50000, 10]]);
  });
  it('an empty pool supplies no passive HP/MP or extra RNG rolls', () => {
    const snapshot = { ...input(), enemyTeam: [{ ...unit('target', 'enemy'), statuses: [] }] };
    const { statAura: _aura, ...control } = snapshot;
    const out = record(snapshot), without = record(control);
    // An extra pulse boundary may emit a legacy turn marker sooner; actions/resources must stay exact.
    const combatEvents = (r: ReturnType<typeof record>) => r.events.filter(e => e.kind !== 'turn-start')
      .map(({ uiDelayMs: _delay, ...event }) => event);
    expect(combatEvents(out)).toEqual(combatEvents(without));
    expect(out.result.playerTeam).toEqual(without.result.playerTeam);
    expect(out.result.enemyTeam).toEqual(without.result.enemyTeam);
    expect(out.result.winner).toBe(without.result.winner);
  });
  it('preserves actual orb RNG across deaths before and after a recovery pulse', () => {
    const snapshot = { ...input(), seed: 7, enemyTeam: [body(), body('later', 6000), unit('target', 'enemy')] };
    const { statAura: _aura, ...control } = snapshot;
    const out = record(snapshot), without = record(control);
    expect(out.events.filter(e => e.kind === 'orb')).toEqual(without.events.filter(e => e.kind === 'orb'));
    expect(out.events.filter(e => e.kind === 'orb').length).toBeGreaterThan(0);
    expect(out.events.filter(e => e.kind === 'heal').map(e => e.simClockMs)).toEqual([5000, 5000, 10000, 10000]);
  });
  it('does not consume initial dead inputs or fabricate post-battle recovery', () => {
    for (const enemyTeam of [[{ ...body(), life: 0 }, unit('target', 'enemy')], [body()]]) {
      const out = record({ ...input(), enemyTeam });
      expect(out.events.some(e => e.kind === 'heal' || e.kind === 'mana')).toBe(false);
      expect(out.events.some(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedRedemption')).toBe(false);
    }
  });
  it('preserves a corpse at full resources, then spends it after actual later damage', () => {
    const hero = { ...unit('hero', 'player'), life: 100000, mana: 100, statuses: [stun,
      { id: 'bleed', sourceId: 'target', stacks: 1, remaining: -1, appliedAtMs: 6000, expiresAtMs: 7000, dotPerStack: 1 }] };
    const out = record({ ...input(), playerTeam: [hero, { ...unit('merc', 'player', 'merc'), life: 100000, mana: 100 }] });
    expect(out.events.filter(e => e.kind === 'heal')).toEqual([expect.objectContaining({ target: 'hero', amount: 1, simClockMs: 10000 })]);
    expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedRedemption'))
      .toEqual([expect.objectContaining({ params: { count: 0, corpseId: 'body' }, simClockMs: 10000 })]);
    expect(out.events.some(e => e.kind === 'mana')).toBe(false);
  });
  it('uses one FIFO corpse at each interval, including supply from an exact tied periodic death', () => {
    const out = record({ ...input(), enemyTeam: [body('first'), body('second', 5000), unit('target', 'enemy')] });
    expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedRedemption')
      .map(e => e.kind === 'message' ? [e.params?.corpseId, e.params?.count, e.simClockMs] : undefined))
      .toEqual([['first', 1, 5000], ['second', 0, 10000]]);
    const single = record({ ...input(), enemyTeam: [body('tied', 5000), unit('target', 'enemy')] });
    const death = single.events.findIndex(e => e.kind === 'death' && e.target === 'tied');
    const heal = single.events.findIndex(e => e.kind === 'heal');
    expect(single.events[death]).toMatchObject({ simClockMs: 5000 }); expect(heal).toBeGreaterThan(death);
  });
  it('includes an exact deadline corpse and resets the pool and first interval on a new wave', () => {
    const out = record({ ...input(), enemyTeam: [body('deadline', 60000), unit('target', 'enemy')] });
    expect(out.events.filter(e => e.kind === 'heal').map(e => e.simClockMs)).toEqual([60000, 60000]);
    const next = record({ ...input(), playerTeam: out.result.playerTeam, enemyTeam: [unit('target', 'enemy')] });
    expect(next.events.some(e => e.kind === 'heal' || e.kind === 'mana')).toBe(false);
    expect(next.events.some(e => e.kind === 'message' && e.messageKey.startsWith('combat:corpses.'))).toBe(false);
  });
  it('settles source death first and never resurrects or recovers a dead recipient', () => {
    const hero = { ...unit('hero', 'player'), life: 5, statuses: [stun,
      { id: 'bleed', sourceId: 'target', stacks: 1, remaining: -1, dotPerStack: 1 }] };
    const out = record({ ...input(), playerTeam: [hero, unit('merc', 'player', 'merc')] });
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'hero', simClockMs: 5000 }));
    expect(out.events.some(e => e.kind === 'heal' || e.kind === 'mana')).toBe(false);
    const merc = { ...unit('merc', 'player', 'merc'), life: 5, statuses: hero.statuses };
    const living = record({ ...input(), playerTeam: [unit('hero', 'player'), merc] });
    expect(living.events.filter(e => e.kind === 'heal').map(e => e.target)).toEqual(['hero']);
    expect(living.events.filter(e => e.kind === 'mana').map(e => e.target)).toEqual(['hero']);
    expect(living.result.playerTeam[1]?.life).toBe(0);
  });
  it.each([{ kind: 'summon' as const }, { kind: 'merc' as const }, { ownerId: '' }, { summonOwnerId: 'target' }, { summon: true }])(
    'never credits excluded primary victim %j', fields => {
      const out = record({ ...input(), enemyTeam: [{ ...body(), ...fields }, unit('target', 'enemy')] });
      expect(out.events.some(e => e.kind === 'heal' || e.kind === 'mana')).toBe(false);
      expect(out.events.some(e => e.kind === 'message' && e.messageKey.startsWith('combat:corpses.'))).toBe(false);
    });
  it('closes orphan deaths without duplicating corpse supply', () => {
    const out = record({ ...input(), enemyTeam: [body(), { ...unit('child', 'enemy'), summonOwnerId: 'body' }, unit('target', 'enemy')] });
    expect(out.events.filter(e => e.kind === 'death').map(e => e.target)).toEqual(['body', 'child']);
    expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.available')).toHaveLength(1);
    expect(out.events.filter(e => e.kind === 'heal')).toHaveLength(2);
  });
  it.each(['necromancer.corpse_explosion', 'necromancer.poison_explosion'])('competes for the same body with %s, with due pulses preceding tied actions', skillId => {
    const consumer = { ...unit('consumer', 'player'), mana: 100, statuses: [], skillOrder: [skillId] };
    const projection = skillId.includes('poison') ? { poisonExplosion: [{ sourceHeroId: 'consumer', rank: 1 }] }
      : { corpseExplosion: [{ sourceHeroId: 'consumer', rank: 1 }] };
    const earlier = record({ ...input(), ...projection, playerTeam: [unit('hero', 'player'), consumer] });
    expect(earlier.events.filter(e => e.kind === 'action' && e.skillId === skillId))
      .toEqual([expect.objectContaining({ actor: 'consumer', simClockMs: 1700 })]);
    expect(earlier.events.filter(e => e.kind === 'heal')).toEqual([]);
    const tied = record({ ...input(), ...projection,
      statAura: { ...aura(), redemption: { intervalMs: 2000, life: 20, mana: 10 } },
      playerTeam: [unit('hero', 'player'), { ...consumer, stats: { ...consumer.stats, attackSpeed: 0 } }] });
    expect(tied.events.filter(e => e.kind === 'action' && e.skillId === skillId)).toEqual([]);
    const heal = tied.events.findIndex(e => e.kind === 'heal');
    const action = tied.events.findIndex(e => e.kind === 'action' && e.actor === 'consumer');
    expect(tied.events[heal]).toMatchObject({ target: 'hero', amount: 20, simClockMs: 2000 });
    expect(action).toBeGreaterThan(heal);
  });
  it('rejects forged source/recipient authority and invalid maxima without spending on unusable resources', () => {
    for (const patch of [{ ownerId: 'other' }, { summonOwnerId: 'other' }, { summon: true }, { kind: 'merc' as const }]) {
      const out = record({ ...input(), playerTeam: [{ ...unit('hero', 'player'), ...patch }, unit('merc', 'player', 'merc')] });
      expect(out.events.some(e => e.kind === 'heal' || e.kind === 'mana')).toBe(false);
    }
    for (const patch of [{ ownerId: 'hero' }, { summonOwnerId: 'hero' }, { summon: true }, { kind: 'hero' as const }]) {
      const out = record({ ...input(), playerTeam: [unit('hero', 'player'), { ...unit('merc', 'player', 'merc'), ...patch }] });
      expect(out.events.filter(e => e.kind === 'heal').map(e => e.target)).toEqual(['hero']);
      expect(out.events.filter(e => e.kind === 'mana').map(e => e.target)).toEqual(['hero']);
    }
    const hero = unit('hero', 'player');
    const unusable = record({ ...input(), playerTeam: [{ ...hero, mana: NaN,
      stats: { ...hero.stats, lifeMax: Infinity, manaMax: Infinity } }] });
    expect(unusable.events.some(e => e.kind === 'heal' || e.kind === 'mana')).toBe(false);
    expect(unusable.events.some(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedRedemption')).toBe(false);
  });
  it('floors alternate recovery once and never debits a body for zero-rounded recovery', () => {
    const out = record({ ...input(), statAura: { ...aura(), redemption: { intervalMs: 1500, life: 37.5, mana: 12.5 } } });
    expect(out.events.filter(e => e.kind === 'heal').map(e => [e.amount, e.simClockMs])).toEqual([[38, 1500], [38, 1500]]);
    expect(out.events.filter(e => e.kind === 'mana').map(e => [e.mana, e.simClockMs])).toEqual([[22, 1500], [22, 1500]]);
    const zero = record({ ...input(), statAura: { ...aura(), redemption: { intervalMs: 5000, life: .01, mana: .01 } } });
    expect(zero.events.some(e => e.kind === 'heal' || e.kind === 'mana')).toBe(false);
    expect(zero.events.some(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedRedemption')).toBe(false);
  });
  it('clears fractional mana carry on a real recovery cap without restoring it on a later wave', () => {
    const hero = { ...unit('hero', 'player'), mana: 99, manaRegenCarry: .5,
      manaRegenCompensation: .01, manaRegenExactCarry: '0.5' };
    const out = record({ ...input(), playerTeam: [hero] });
    expect(out.result.playerTeam[0]).toMatchObject({ mana: 100, manaRegenCarry: 0,
      manaRegenCompensation: 0, manaRegenExactCarry: '0' });
    expect(out.events.filter(e => e.kind === 'mana')).toEqual([expect.objectContaining({ target: 'hero', mana: 100, reason: 'redemption', simClockMs: 5000 })]);
    const next = record({ ...input(), playerTeam: out.result.playerTeam, enemyTeam: [unit('target', 'enemy')] });
    expect(next.result.playerTeam[0]).toMatchObject({ mana: 100, manaRegenCarry: 0, manaRegenExactCarry: '0' });
  });
  it('stops on the real action cap while unused corpses remain, without future recovery', () => {
    const fast = (u: CombatUnit): CombatUnit => ({ ...u, statuses: [], stats: { ...u.stats, attackSpeed: 263 } });
    const out = record({ ...input(), playerTeam: [unit('hero', 'player'), ...Array.from({ length: 30 }, (_, i) =>
      fast(unit(i === 0 ? 'merc' : 'bench-' + String(i), 'player', 'merc')))],
      enemyTeam: [...Array.from({ length: 8 }, (_, i) => body('body-' + String(i))), fast(unit('target', 'enemy'))] });
    const end = out.events.at(-1)?.simClockMs;
    expect(end).toBeDefined(); expect(end).toBeLessThan(40000);
    expect(out.events.filter(e => e.kind === 'heal' && e.target === 'hero').map(e => e.simClockMs))
      .toEqual(Array.from({ length: Math.floor((end ?? 0) / 5000) }, (_, i) => (i + 1) * 5000));
    const consumed = out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumedRedemption');
    expect(consumed.length).toBeLessThan(8);
    expect(consumed.every(e => e.simClockMs <= (end ?? 0))).toBe(true);
  });
});
