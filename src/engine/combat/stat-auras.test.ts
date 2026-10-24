import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';

type AuraId = 'paladin.thorns' | 'paladin.blessed-aim' | 'paladin.fanaticism' | 'paladin.defiance'
  | 'paladin.resist-fire' | 'paladin.resist-cold' | 'paladin.resist-lightning' | 'paladin.salvation';
interface StatSnapshot extends CombatSnapshot {
  readonly statAura?: { readonly selectedAuraId: AuraId; readonly sourceHeroId: string;
    readonly fieldedMercCombatId?: string; readonly rank: number; readonly maxRank: number;
    readonly bonuses: Readonly<Partial<Record<'attackPct' | 'attackSpeedPct' | 'physicalDamagePct' |
      'defensePct' | 'thornsPct' | 'resistAllPct' | 'fireDamagePct' | 'coldDamagePct' |
      'lightningDamagePct' | 'elementalDamagePct', number>>> };
}
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 10000, mana: 50,
    stats: { life: 10000, lifeMax: 10000, mana: 100, manaMax: 100, attack: 100, defense: 0, magicResist: 0,
      attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function snapshot(selectedAuraId: AuraId, bonuses: NonNullable<StatSnapshot['statAura']>['bonuses']): StatSnapshot {
  const enemy = unit('target', 'enemy');
  return { seed: 7, maxRounds: 1, playerTeam: [unit('hero', 'player')],
    enemyTeam: [{ ...enemy, stats: { ...enemy.stats, attackSpeed: 1 } }],
    statAura: { selectedAuraId, sourceHeroId: 'hero', fieldedMercCombatId: 'merc', rank: 20, maxRank: 20, bonuses } };
}
function hero(input: StatSnapshot): CombatUnit {
  const value = input.playerTeam[0];
  if (!value) throw new Error('Missing fixture hero');
  return value;
}
function record(input: StatSnapshot) {
  const before = structuredClone(input), output = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(output);
  for (const out of [...output.result.playerTeam, ...output.result.enemyTeam]) {
    const original = [...input.playerTeam, ...input.enemyTeam].find(u => u.id === out.id);
    expect(out.stats).toEqual(original?.stats);
    expect(out).not.toHaveProperty('statAura');
  }
  return output;
}
function firstHit(input: StatSnapshot, source = 'hero') {
  return record(input).events.find(event => event.kind === 'damage' && event.source === source && !event.dodged && event.damageType !== 'thorns');
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('selected Paladin stat auras in actual combat', () => {
  it('Blessed Aim improves basic Attack and Attack-scaled skill components', () => {
    const input = snapshot('paladin.blessed-aim', { attackPct: 0.6 });
    expect(firstHit(input)).toMatchObject({ amount: 160 });
    registerSkill({ id: 'fixture.attack', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
      manaCost: 0, cooldown: 100, effects: [{ kind: 'damage', damageType: 'physical', base: [50, 50], attackDamagePct: 50 }] });
    expect(firstHit({ ...input, playerTeam: [{ ...hero(input), skillOrder: ['fixture.attack'] }] }))
      .toMatchObject({ amount: 130 });
  });
  it('Fanaticism changes physical damage and actual action cadence without altering raw stats', () => {
    expect(firstHit(snapshot('paladin.fanaticism', { physicalDamagePct: 0.6, attackSpeedPct: 0.2 })))
      .toMatchObject({ amount: 160, simClockMs: 1540 });
  });
  it('Defiance increases actual physical mitigation', () => {
    const input = snapshot('paladin.defiance', { defensePct: 0.8 });
    expect(firstHit({ ...input, playerTeam: [{ ...hero(input),
      stats: { ...hero(input).stats, defense: 10 } }] }, 'target')).toMatchObject({ amount: 82 });
  });
  it('Thorns reflects actual physical HP loss through the existing nonrecursive damage path', () => {
    expect(firstHit(snapshot('paladin.thorns', { thornsPct: 0.8 })))
      .toMatchObject({ damageType: 'physical', amount: 100 });
    const reflected = record(snapshot('paladin.thorns', { thornsPct: 0.8 })).events
      .filter(event => event.kind === 'damage' && event.damageType === 'thorns');
    expect(reflected.length).toBeGreaterThan(0);
    expect(reflected[0]).toMatchObject({ source: 'hero', target: 'target', amount: 80 });
  });
  it.each([
    { id: 'paladin.resist-fire' as const, type: 'fire' as const, bonuses: { resistAllPct: 0.2, fireDamagePct: 0.2 } },
    { id: 'paladin.resist-cold' as const, type: 'cold' as const, bonuses: { resistAllPct: 0.2, coldDamagePct: 0.2 } },
    { id: 'paladin.resist-lightning' as const, type: 'lightning' as const, bonuses: { resistAllPct: 0.2, lightningDamagePct: 0.2 } },
    { id: 'paladin.salvation' as const, type: 'fire' as const, bonuses: { resistAllPct: 0.4, elementalDamagePct: 0.2 } }
  ])('$id supplies authored offense and all-resistance mitigation', ({ id, type, bonuses }) => {
    const input = snapshot(id, bonuses);
    const attack = { ...input, playerTeam: [{ ...hero(input), basicAttack: { damageType: type, damage: [100, 100] as const } }] };
    expect(firstHit(attack)).toMatchObject({ damageType: type, amount: 120 });
    expect(firstHit(attack, 'target')).toMatchObject({ amount: id === 'paladin.salvation' ? 60 : 80 });
  });
  it.each([true, false])('limits the recipient to the originally fielded merc, listed=%s', listed => {
    const input = snapshot('paladin.blessed-aim', { attackPct: 0.6 });
    const merc = { ...unit(listed ? 'merc' : 'bench', 'player'), kind: 'merc' as const,
      stats: { ...unit('merc', 'player').stats, attackSpeed: 200 } };
    expect(firstHit({ ...input, playerTeam: [...input.playerTeam, merc] }, merc.id))
      .toMatchObject({ amount: listed ? 160 : 100 });
  });
  it('rejects simultaneous player projections instead of stacking their effects', () => {
    expect(() => record({ ...snapshot('paladin.blessed-aim', { attackPct: 0.6 }),
      mightAura: { selectedAuraId: 'paladin.might', sourceHeroId: 'hero', rank: 1, maxRank: 20,
        physicalDamagePct: 0.03, attackPct: 0.01 } })).toThrow('Only one player aura projection');
  });
});
