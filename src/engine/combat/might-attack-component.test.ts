import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import type { DamageType } from '../types/attributes';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';

function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 10000, mana: 100,
    stats: { life: 10000, lifeMax: 10000, mana: 100, manaMax: 100, attack: 1000,
      defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}

function snapshot(auraRank = 20, skillRank = 1): CombatSnapshot {
  return { seed: 7, playerTeam: [{ ...unit('hero', 'player'), skillOrder: ['fixture.might-attack'],
    skillLevels: { 'fixture.might-attack': skillRank } }],
    enemyTeam: [{ ...unit('target', 'enemy'), life: 1,
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] }],
    ...(auraRank > 0 ? { mightAura: { selectedAuraId: 'paladin.might' as const,
      sourceHeroId: 'hero', rank: auraRank, maxRank: 20,
      attackPct: auraRank * .01, physicalDamagePct: auraRank * .03 } } : {}) };
}

function firstHit(input: CombatSnapshot, source = 'hero') {
  const before = structuredClone(input), recording = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(recording);
  expect(runBattle(input)).toEqual(recording.result);
  for (const result of [...recording.result.playerTeam, ...recording.result.enemyTeam])
    expect(result.stats).toEqual([...input.playerTeam, ...input.enemyTeam].find(u => u.id === result.id)?.stats);
  const hit = recording.events.find(e => e.kind === 'damage' && e.source === source && !e.dodged);
  if (!hit || hit.kind !== 'damage') throw new Error('Missing landed Attack-component hit');
  return hit;
}

function fixture(type: DamageType = 'physical', ranked = false) {
  registerSkill({ id: 'fixture.might-attack', archetype: 'fixture', target: 'single-enemy',
    minLevel: 1, manaCost: 0, cooldown: 100,
    effects: [{ kind: 'damage', damageType: type, base: [100, 100], alwaysHits: true,
      ...(ranked ? { attackDamagePctPerRank: 20 } : { attackDamagePct: 50 }) }] });
}

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('Might Attack bonus on explicit skill Attack components', () => {
  it.each([{ rank: 0, amount: 600 }, { rank: 1, amount: 623 }, { rank: 20, amount: 1120 }])(
    'applies both distinct bonuses at aura rank$rank, amount$amount', ({ rank, amount }) => {
      fixture();
      // (100 flat + 1000 Attack * (1 + aura Attack%) * 50%) * (1 + physical%).
      expect(firstHit(snapshot(rank))).toMatchObject({ amount, crit: false });
    });

  it.each([{ rank: 1, amount: 160 }, { rank: 2, amount: 544 }, { rank: 20, amount: 7456 }])(
    'scales only the explicitly ranked Attack component at skill rank$rank', ({ rank, amount }) => {
      fixture('physical', true);
      expect(firstHit(snapshot(20, rank)).amount).toBe(amount);
    });

  it('keeps fractional Attack until final mitigation, without boosting the flat base', () => {
    fixture();
    const input = snapshot(1);
    // floor((100 + 5.8 * 1.01 * .5) * 1.03) = 106; early Attack floor gives105.
    expect(firstHit({ ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
      stats: { ...hero.stats, attack: 5.8 } })) }).amount).toBe(106);
  });

  it('preserves increases, combo, critical, resistance and flat Defense order', () => {
    fixture();
    const input = snapshot();
    // floor((100 + 1000 * 1.2 * .5) * (1 + .25 + .60) * 1.1 * 2 * .75 - 7) = 2129.
    expect(firstHit({ ...input,
      playerTeam: input.playerTeam.map(hero => ({ ...hero, increasedDamagePct: { physical: .25 },
        stats: { ...hero.stats, critChance: 1 } })),
      enemyTeam: input.enemyTeam.map(target => ({ ...target,
        stats: { ...target.stats, defense: 7, resistances: { ...target.stats.resistances, physical: 25 } },
        statuses: [...target.statuses, { id: 'bleed', sourceId: 'fixture', stacks: 1, remaining: -1 }] }))
    })).toMatchObject({ amount: 2129, crit: true });
  });

  it.each(['fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns'] as const)(
    'applies only the Attack bonus to an explicit %s Attack component', type => {
      fixture(type);
      expect(firstHit(snapshot()).amount).toBe(700);
    });

  it.each([
    { kind: 'merc' as const, listed: true, summon: false, amount: 1120 },
    { kind: 'merc' as const, listed: false, summon: false, amount: 600 },
    { kind: 'summon' as const, listed: true, summon: true, amount: 600 },
    { kind: 'merc' as const, listed: true, summon: true, amount: 600 }
  ])('retains the original fielded-recipient eligibility: %j', candidate => {
    fixture();
    const input = snapshot();
    const source = input.playerTeam[0];
    if (!source || !input.mightAura) throw new Error('Missing source fixture');
    const recipient = { ...unit('recipient', 'player'), kind: candidate.kind, summon: candidate.summon,
      skillOrder: ['fixture.might-attack'] };
    expect(firstHit({ ...input,
      mightAura: { ...input.mightAura, fieldedMercCombatId: candidate.listed ? 'recipient' : 'other' },
      playerTeam: [{ ...source, statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] }, recipient]
    }, 'recipient').amount).toBe(candidate.amount);
  });

  it.each(['stun', 'freeze'])('keeps Attack empowerment while the living source has %s', id => {
    fixture();
    const input = snapshot(), source = input.playerTeam[0];
    if (!source || !input.mightAura) throw new Error('Missing source fixture');
    expect(firstHit({ ...input, mightAura: { ...input.mightAura, fieldedMercCombatId: 'recipient' },
      playerTeam: [{ ...source, statuses: [{ id, sourceId: 'fixture', stacks: 1, remaining: -1 }] },
        { ...unit('recipient', 'player'), kind: 'merc', skillOrder: ['fixture.might-attack'] }]
    }, 'recipient').amount).toBe(1120);
  });

  it('suppresses both bonuses for a missing source and preserves the complete no-aura recording', () => {
    fixture();
    const input = snapshot();
    if (!input.mightAura) throw new Error('Missing source fixture');
    const { mightAura: _aura, ...none } = input;
    const missing = { ...input, mightAura: { ...input.mightAura, sourceHeroId: 'absent' } };
    expect(firstHit(missing).amount).toBe(600);
    expect(runBattleRecorded(missing)).toEqual(runBattleRecorded(none));
  });

  it.each([{ rank: 1, delta: 0 }, { rank: 2, delta: 384 }, { rank: 20, delta: 7296 }])(
    'uses native Zeal rank$rank with the authored Might Attack bonus', ({ rank, delta }) => {
      const input = snapshot();
      const zeal = { ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
        skillOrder: ['paladin.zeal'], skillLevels: { 'paladin.zeal': rank } })) };
      const stronger = { ...zeal, playerTeam: zeal.playerTeam.map(hero => ({ ...hero,
        stats: { ...hero.stats, attack: 2000 } })) };
      expect(firstHit(stronger).amount - firstHit(zeal).amount).toBe(delta);
    });

  it.each(['mskill-basic-arrow', 'mskill-pierce-arrow'])(
    'uses the native fielded %s Attack coefficient', id => {
      const input = snapshot(), source = input.playerTeam[0];
      if (!source || !input.mightAura) throw new Error('Missing source fixture');
      const merc = { ...unit('merc', 'player'), kind: 'merc' as const, skillOrder: [id] };
      const heldSource = { ...source, skillOrder: [],
        statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
      const arrows = { ...input, mightAura: { ...input.mightAura, fieldedMercCombatId: 'merc' },
        playerTeam: [heldSource, merc] };
      const stronger = { ...arrows, playerTeam: [heldSource,
        { ...merc, stats: { ...merc.stats, attack: 2000 } }] };
      expect(firstHit(stronger, 'merc').amount - firstHit(arrows, 'merc').amount).toBe(1920);
    });
});
