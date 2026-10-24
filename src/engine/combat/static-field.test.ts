import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';

const id = 'sorceress.static_field';
const hold = (appliedAtMs = 0) => ({ id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture', appliedAtMs });
function unit(name: string, side: CombatUnit['side']): CombatUnit {
  return { id: name, name, side, kind: side === 'player' ? 'hero' : 'monster', level: 24, tier: 'trash',
    life: 1000, mana: 100, stats: { life: 1000, lifeMax: 1000, mana: 100, manaMax: 100,
      attack: 10, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function oneCast(rank = 1): CombatSnapshot {
  return { seed: 1, playerTeam: [{ ...unit('hero', 'player'), skillOrder: [id],
    skillLevels: { [id]: rank }, statuses: [hold(1701)] }],
  enemyTeam: [{ ...unit('target', 'enemy'), statuses: [hold()] }] };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('actual authored Static Field', () => {
  it.each([1, 20])('rank%s changes current health through an ordinary recorded cast', rank => {
    const input = oneCast(rank), before = structuredClone(input);
    const recorded = runBattleRecorded(input);
    expect(recorded.result.enemyTeam[0]?.life).toBe(750);
    expect(recorded.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'hero', target: 'target', damageType: 'lightning', amount: 250,
        crit: false, dodged: false, simClockMs: 1700 })
    ]);
    expect(recorded.result.playerTeam[0]?.mana).toBe(rank === 1 ? 90 : 92);
    expect(recorded.events.filter(e => e.kind === 'status' || e.kind === 'death' || e.kind === 'orb')).toEqual([]);
    expect(runBattle(input)).toEqual(recorded.result);
    expect(runBattleRecorded(input)).toEqual(recorded);
    expect(input).toEqual(before);
  });

  it.each([
    { life: 1000, resistance: 50, mr: 10, penalty: 0, amount: 115 },
    { life: 400, resistance: 0, mr: 0, penalty: 0, amount: 100 },
    { life: 1000, resistance: -50, mr: 0, penalty: 0, amount: 375 },
    { life: 1000, resistance: 150, mr: 0, penalty: 0, amount: 62 },
    { life: 1000, resistance: -150, mr: 0, penalty: 0, amount: 500 },
    { life: 1000, resistance: 50, mr: 10, penalty: 20, amount: 165 },
    { life: 1000, resistance: 75, mr: 1000, penalty: 0, amount: 1 },
    { life: 2, resistance: 0, mr: 0, penalty: 0, amount: 1 }
  ])('uses current health, resistance/clamp/penalty and independent MR: %#', row => {
    const input = oneCast(), hero = input.playerTeam[0], target = input.enemyTeam[0];
    if (!hero || !target) throw new Error('Missing fixture');
    const result = runBattleRecorded({ ...input,
      playerTeam: [{ ...hero, increasedDamagePct: { lightning: 500 },
        stats: { ...hero.stats, attack: 100000, critChance: 1, critDamage: 100 } }],
      enemyTeam: [{ ...target, life: row.life, resistPenalty: row.penalty,
        stats: { ...target.stats, magicResist: row.mr, magicDodge: 1,
          resistances: { ...target.stats.resistances, lightning: row.resistance } } }] });
    expect(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: row.amount, damageType: 'lightning', crit: false, dodged: false })]);
    expect(result.result.enemyTeam[0]?.life).toBe(row.life - row.amount);
  });

  it('damages every living enemy independently and clips Nightmare to ceil(maxHealth × .33)', () => {
    const input = oneCast(), target = input.enemyTeam[0];
    if (!target) throw new Error('Missing fixture');
    const result = runBattleRecorded({ ...input, difficulty: 'nightmare', enemyTeam: [
      { ...target, id: 'full' }, { ...target, id: 'clipped', life: 340 },
      { ...target, id: 'rounded', life: 332, stats: { ...target.stats, lifeMax: 1001 } },
      { ...target, id: 'floor', life: 330 }, { ...target, id: 'dead', life: 0 }
    ] });
    expect(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ target: 'full', amount: 250 }),
      expect.objectContaining({ target: 'clipped', amount: 10 }),
      expect.objectContaining({ target: 'rounded', amount: 1 })
    ]);
    expect(result.events.filter(e => e.kind === 'death' || e.kind === 'orb')).toEqual([]);
    expect(result.result.enemyTeam.map(t => t.life)).toEqual([750, 330, 331, 330, 0]);
  });

  it.each([['normal', 1], ['nightmare', 330]] as const)(
    'at the %s floor yields to Ice Bolt without paying or cooling Static Field', (difficulty, life) => {
      const input = oneCast(), hero = input.playerTeam[0], target = input.enemyTeam[0];
      if (!hero || !target) throw new Error('Missing fixture');
      const result = runBattleRecorded({ ...input, difficulty,
        playerTeam: [{ ...hero, skillOrder: [id, 'sorceress.ice_bolt'],
          skillLevels: { [id]: 1, 'sorceress.ice_bolt': 1 } }], enemyTeam: [{ ...target, life }] });
      expect(result.events.filter(e => e.kind === 'action')).toEqual([
        expect.objectContaining({ skillId: 'sorceress.ice_bolt' })]);
      expect(result.result.playerTeam[0]?.mana).toBe(90);
      expect(result.result.playerTeam[0]?.cooldowns[id]).toBeUndefined();
    });

  it.each([undefined, 0, -1, 1.5, NaN, Infinity])('does not manufacture learned rank from %s', rank => {
    const input = oneCast(), hero = input.playerTeam[0]; if (!hero) throw new Error('Missing fixture');
    const { skillLevels, ...unlearned } = hero; void skillLevels;
    const result = runBattleRecorded({ ...input, playerTeam: [{ ...unlearned,
      ...(rank === undefined ? {} : { skillLevels: { [id]: rank } }) }] });
    expect(result.events.some(e => e.kind === 'action' && e.skillId === id)).toBe(false);
    expect([...result.result.playerTeam, ...result.result.enemyTeam].find(u => u.id === hero.id)?.mana).toBe(100);
  });

  it.each([
    { level: 5 }, { kind: 'merc' as const }, { kind: 'summon' as const },
    { side: 'enemy' as const }, { staticFieldRank: 0 }, { staticFieldRank: NaN },
    { staticFieldRank: 1.5 }, { staticFieldRank: 21 }, { ownerId: 'someone' }
  ])('refuses ineligible combat authority %#', patch => {
    const input = oneCast(), hero = input.playerTeam[0]; if (!hero) throw new Error('Missing fixture');
    const result = runBattleRecorded({ ...input, playerTeam: [{ ...hero, ...patch }] });
    expect(result.events.some(e => e.kind === 'action' && e.skillId === id)).toBe(false);
    expect([...result.result.playerTeam, ...result.result.enemyTeam].find(u => u.id === hero.id)?.mana).toBe(100);
  });

  it.each([1, 20])('rank%s obeys authored cooldown and diminishing current-health damage', rank => {
    const input = oneCast(rank), hero = input.playerTeam[0]; if (!hero) throw new Error('Missing fixture');
    const result = runBattleRecorded({ ...input, playerTeam: [{ ...hero, statuses: [hold(5101)] }] });
    expect(result.events.filter(e => e.kind === 'damage').map(e => [e.simClockMs, e.amount]))
      .toEqual(rank === 1 ? [[1700, 250], [3400, 10], [5100, 185]] : [[1700, 250], [3400, 187], [5100, 140]]);
    expect(result.result.playerTeam[0]?.mana).toBe(rank === 1 ? 80 : 76);
  });

  it('aliases use maximum learned rank once, clamped to cap', () => {
    const input = oneCast(), hero = input.playerTeam[0]; if (!hero) throw new Error('Missing fixture');
    const result = runBattleRecorded({ ...input, playerTeam: [{ ...hero,
      skillOrder: ['skills-sorceress-static-field', id],
      skillLevels: { [id]: 99, 'skills-sorceress-static-field': 1 } }] });
    expect(result.events.filter(e => e.kind === 'damage')).toHaveLength(1);
    expect(result.result.playerTeam[0]?.mana).toBe(92);
  });

  it('refuses unpaid and substituted effects', () => {
    const input = oneCast(), hero = input.playerTeam[0], source = getSkill(id);
    if (!hero || !source) throw new Error('Missing fixture');
    const noMana = runBattleRecorded({ ...input, playerTeam: [{ ...hero, mana: 9 }] });
    expect(noMana.events.some(e => e.kind === 'action' && e.skillId === id)).toBe(false);
    registerSkill({ ...source, effects: [{ kind: 'debuff', statusId: 'static-field' }] });
    const forged = runBattleRecorded(input);
    expect(forged.events.some(e => e.kind === 'action' && e.skillId === id)).toBe(false);
  });

  it.each([1, 7, 29, 77])('does not consume the seeded downstream attack stream (seed%s)', seed => {
    const input = oneCast(), hero = input.playerTeam[0]; if (!hero) throw new Error('Missing fixture');
    const merc = { ...unit('merc-probe', 'player'), kind: 'merc' as const,
      attackRange: [19, 40] as const, stats: { ...hero.stats, attackSpeed: 50, critChance: 0.4 },
      statuses: [hold(2001)] };
    const on = runBattleRecorded({ ...input, seed, playerTeam: [hero, merc] });
    const off = runBattleRecorded({ ...input, seed, playerTeam: [{ ...hero, statuses: [hold()] }, merc] });
    const probe = (result: typeof on) => result.events.filter(e => e.kind === 'damage' && e.source === merc.id);
    expect(probe(on)).toHaveLength(1);
    expect(probe(on)).toEqual(probe(off));
  });

  it('rejects unknown difficulty rather than silently selecting a floor', () => {
    const input = { ...oneCast(), difficulty: 'hell' } as unknown as CombatSnapshot;
    expect(() => runBattleRecorded(input)).toThrow('Invalid combat difficulty');
  });
});
