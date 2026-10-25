import { beforeEach, describe, expect, it } from 'vitest';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import type { StatAuraProjection } from '../skills/stat-auras';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';

const hold: ActiveStatus = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
const timed = (id: string): ActiveStatus => ({ id, sourceId: 'fixture', stacks: 1,
  remaining: 4, appliedAtMs: 0, expiresAtMs: 4000 });
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 18, tier: 'trash',
    life: 1000000, mana: 100, stats: { life: 1000000, lifeMax: 1000000, mana: 100, manaMax: 100,
      attack: 100, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false };
}
function input(rank = 1): CombatSnapshot {
  return { seed: 42, playerTeam: [{ ...unit('hero', 'player'), statuses: [timed('stun')] }],
    enemyTeam: [{ ...unit('enemy', 'enemy'), statuses: [hold] }], statAura: {
      selectedAuraId: 'paladin.concentration', sourceHeroId: 'hero', fieldedMercCombatId: 'merc',
      rank, maxRank: 20, bonuses: { physicalDamagePct: .035 * rank },
      preventStunInterruption: true } as unknown as StatAuraProjection };
}
function record(snapshot: CombatSnapshot) {
  const original = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(original); expect(runBattleRecorded(snapshot)).toEqual(out);
  for (const result of [...out.result.playerTeam, ...out.result.enemyTeam]) {
    expect(result.stats).toEqual([...snapshot.playerTeam, ...snapshot.enemyTeam].find(u => u.id === result.id)?.stats);
    expect(result).not.toHaveProperty('preventStunInterruption');
  }
  return out;
}
const hits = (out: ReturnType<typeof record>, source = 'hero') => out.events.filter(e => e.kind === 'damage' && e.source === source);
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('selected Concentration physical scaling and actual Stun interruption prevention', () => {
  it.each([1, 20])('performs rank%i basic actions during Stun without extra actions or permanent stats', rank => {
    const out = record(input(rank)), damage = hits(out), amount = rank === 1 ? 103 : 170;
    expect(damage.map(e => e.simClockMs)).toEqual(Array.from({ length: 35 }, (_, i) => (i + 1) * 1700));
    for (const event of damage) {
      if (event.kind !== 'damage') throw new Error('Expected damage event');
      expect(event).toMatchObject({ amount: event.dodged ? 0 : amount, damageType: 'physical' });
    }
    const landed = damage.filter(event => event.kind === 'damage' && !event.dodged);
    expect(landed.length).toBeGreaterThan(0);
    expect(out.result.enemyTeam[0]?.life).toBe(1000000 - amount * landed.length);
    expect(out.events.some(e => e.kind === 'stunned' && e.target === 'hero' || e.kind === 'mana')).toBe(false);
  });
  it('keeps real Stun and its exact expiry when a protected action ends battle before expiry', () => {
    const out = record({ ...input(), enemyTeam: [{ ...unit('enemy', 'enemy'), life: 1, statuses: [hold] }] });
    expect(out.result.playerTeam[0]?.statuses).toContainEqual(timed('stun'));
    expect(out.events.at(-1)).toMatchObject({ winner: 'player', simClockMs: 1700 });
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'hero', simClockMs: 0,
      statuses: [expect.objectContaining({ id: 'stun', expiresAtMs: 4000 })] }));
  });
  it.each([{ controls: ['freeze'] }, { controls: ['paralyze'] }, { controls: ['stun', 'freeze'] }, { controls: ['stun', 'paralyze'] }])('still loses actions to blocking controls $controls', ({ controls }) => {
    const out = record({ ...input(), playerTeam: [{ ...unit('hero', 'player'), statuses: controls.map(timed) }] });
    expect(hits(out)[0]).toHaveProperty('simClockMs', 5100);
    expect(out.events.filter(e => e.kind === 'stunned' && e.target === 'hero').map(e => e.simClockMs)).toEqual([1700, 3400]);
  });
  it('None preserves normal Stun action loss and exact recovery', () => {
    const { statAura: _aura, ...none } = input(); const out = record(none);
    expect(hits(out)[0]).toMatchObject({ amount: 100, simClockMs: 5100 });
    expect(out.events.filter(e => e.kind === 'stunned' && e.target === 'hero').map(e => e.simClockMs)).toEqual([1700, 3400]);
  });
  it('protects ready paid active skills but preserves mana and cooldown eligibility for ordinary fallback', () => {
    registerSkill({ id: 'fixture.concentration-hit', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
      cooldown: 1, manaCost: 20, effects: [{ kind: 'damage', damageType: 'physical', base: [100, 100] }] });
    for (const [mana, cooldown, paid] of [[20, 0, true], [19, 0, false], [20, 30000, false]] as const) {
      const hero = { ...unit('hero', 'player'), mana, statuses: [timed('stun')], skillOrder: ['fixture.concentration-hit'],
        cooldowns: { 'fixture.concentration-hit': cooldown } };
      const out = record({ ...input(), playerTeam: [hero], enemyTeam: [{ ...unit('enemy', 'enemy'), life: 1, statuses: [hold] }] });
      expect(hits(out)[0]).toMatchObject({ amount: 103, simClockMs: 1700 });
      expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'hero', skillId: paid ? 'fixture.concentration-hit' : null }));
      expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(paid);
      expect(out.result.playerTeam[0]?.mana).toBe(paid ? 0 : mana);
    }
  });
  it('protects only the original living merc while a frozen source remains alive; bench and summons remain interrupted', () => {
    const hero = { ...unit('hero', 'player'), statuses: [hold, { ...hold, id: 'freeze' }] };
    const merc = { ...unit('merc', 'player'), kind: 'merc' as const, statuses: [hold] };
    const bench = { ...merc, id: 'bench' };
    const summon = { ...merc, id: 'summon', kind: 'summon' as const, summon: true, ownerId: 'hero' };
    const out = record({ ...input(), playerTeam: [hero, merc, bench, summon] });
    expect(hits(out, 'merc')[0]).toMatchObject({ amount: 103, simClockMs: 1700 });
    for (const id of ['hero', 'bench', 'summon']) expect(hits(out, id)).toEqual([]);
    expect(out.result.playerTeam.find(u => u.id === 'merc')?.statuses).toContainEqual(hold);
  });
  it('does not admit forged sources or absent, false and foreign protection metadata', () => {
    const snapshot = input(), originalAura = snapshot.statAura;
    if (!originalAura) throw new Error('Missing Concentration fixture');
    for (const patch of [{ kind: 'merc' as const }, { summon: true }, { ownerId: 'other' }, { summonOwnerId: 'other' }]) {
      const hero = { ...unit('hero', 'player'), statuses: [hold], ...patch };
      expect(hits(record({ ...snapshot, playerTeam: [hero] }))).toEqual([]);
    }
    for (const preventStunInterruption of [undefined, false, 1, 'true']) {
      const statAura = { ...originalAura, preventStunInterruption } as unknown as StatAuraProjection;
      expect(hits(record({ ...snapshot, playerTeam: [{ ...unit('hero', 'player'), statuses: [hold] }], statAura }))).toEqual([]);
    }
    const foreign = { ...originalAura, selectedAuraId: 'paladin.thorns', bonuses: { thornsPct: .03 } } as unknown as StatAuraProjection;
    expect(hits(record({ ...snapshot, playerTeam: [{ ...unit('hero', 'player'), statuses: [hold] }], statAura: foreign }))).toEqual([]);
  });
  it('keeps damage RNG and scheduling identical to the same selected aura without Stun', () => {
    const snapshot = input(); const hero = { ...unit('hero', 'player'), stats: { ...unit('hero', 'player').stats, critChance: .4 }, statuses: [timed('stun')] };
    const enemy = { ...unit('enemy', 'enemy'), stats: { ...unit('enemy', 'enemy').stats, physDodge: .25 }, statuses: [hold] };
    const controlled = record({ ...snapshot, playerTeam: [hero], enemyTeam: [enemy] });
    const ordinary = record({ ...snapshot, playerTeam: [{ ...hero, statuses: [] }], enemyTeam: [enemy] });
    expect(hits(controlled)).toEqual(hits(ordinary));
  });
});
