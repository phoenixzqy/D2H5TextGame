import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { effectiveSide } from './allegiance';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import type { ActiveStatus, CombatUnit, MonsterTier } from './types';

const hold = (at = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture',
  remaining: -1, stacks: 1, appliedAtMs: at });
function fixture(patch: Partial<CombatUnit> = {}): CombatSnapshot {
  const hero: CombatUnit = { id: 'hero', name: 'Synthetic Paladin', side: 'player', kind: 'hero',
    tier: 'trash', level: 30, life: 10000, mana: 25, conversionRank: 1,
    skillOrder: ['paladin.conversion'], skillLevels: { 'paladin.conversion': 1 },
    cooldowns: {}, activeBuffIds: [], statuses: [hold(501)], enraged: false,
    stats: { life: 10000, lifeMax: 10000, mana: 100, manaMax: 100, attack: 100,
      defense: 0, magicResist: 0, attackSpeed: 250, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  const monster: CombatUnit = { id: 'convert', name: 'Synthetic monster', side: 'enemy', kind: 'monster',
    tier: 'trash', level: 30, life: 10000, mana: 100, skillOrder: [], cooldowns: {}, activeBuffIds: [],
    statuses: [hold(10001)], enraged: false, stats: { ...hero.stats, attackSpeed: 100 }, ...patch };
  return { seed: 7, playerTeam: [hero], enemyTeam: [monster,
    { ...monster, id: 'former-ally', statuses: [hold()], skillOrder: [] }] };
}
function first(units: readonly CombatUnit[]): CombatUnit {
  const unit = units[0]; if (!unit) throw new Error('Missing synthetic unit'); return unit;
}
function run(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  return out;
}
function attacks(out: ReturnType<typeof run>, source = 'convert') {
  return out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
    e.kind === 'damage' && e.source === source);
}
function statusViews(out: ReturnType<typeof run>) {
  return out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'status-state' }> =>
    e.kind === 'status-state' && e.target === 'convert');
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('paid Conversion changes targeting without changing original identity', () => {
  it('redirects real attacks for8seconds and restores hostility at exact expiry', () => {
    const out = run(fixture());
    expect(attacks(out).filter(e => e.simClockMs < 8500).map(e => e.target)).toEqual(
      ['former-ally', 'former-ally', 'former-ally', 'former-ally']);
    expect(attacks(out).find(e => e.simClockMs === 8500)?.target).toBe('hero');
    expect(statusViews(out).find(e => e.simClockMs === 500)?.statuses).toContainEqual(
      expect.objectContaining({ id: 'converted', sourceId: 'hero', expiresAtMs: 8500 }));
    expect(statusViews(out).find(e => e.simClockMs === 8500)?.statuses.some(s => s.id === 'converted')).toBe(false);
    expect(out.result.enemyTeam.map(u => [u.id, u.side])).toEqual([['convert', 'enemy'], ['former-ally', 'enemy']]);
    expect(out.result.playerTeam[0]?.mana).toBe(0);
  });
  it.each(['trash', 'rare-minion'] as MonsterTier[])('converts eligible%s', tier => {
    expect(attacks(run(fixture({ tier })))[0]?.target).toBe('former-ally');
  });
  it.each(['elite', 'champion', 'rare-elite', 'boss', 'chapter-boss'] as MonsterTier[])('damages but cannot convert immune%s', tier => {
    const out = run(fixture({ tier }));
    expect(attacks(out)[0]?.target).toBe('hero');
    expect(attacks(out, 'hero')[0]?.amount).toBeGreaterThan(0);
    expect(out.events.some(e => e.kind === 'status' && e.statusId === 'converted')).toBe(false);
  });
  it('keeps real registered all-enemy attacks and their one payment/cooldown', () => {
    registerSkill({ id: 'fixture.monster-area', archetype: 'fixture', target: 'all-enemies',
      minLevel: 1, manaCost: 7, cooldown: 3,
      effects: [{ kind: 'damage', damageType: 'fire', base: [120, 120], applyStatus: { id: 'burn' } }] });
    const out = run(fixture({ skillOrder: ['fixture.monster-area'] }));
    expect(attacks(out)[0]).toMatchObject({ target: 'former-ally', amount: 120, damageType: 'fire', simClockMs: 1700 });
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'convert' && e.skillId !== null)
      .map(e => e.simClockMs)).toEqual([1700, 5100, 8500]);
    expect(out.result.enemyTeam[0]?.mana).toBe(79);
  });
  it('heals current allies through the real registered support skill', () => {
    registerSkill({ id: 'fixture.heal', archetype: 'fixture', target: 'all-allies', minLevel: 1,
      manaCost: 7, cooldown: 100, effects: [{ kind: 'heal', target: 'all-allies', amount: 100 }] });
    const input = fixture({ skillOrder: ['fixture.heal'] });
    // Keep this support/allegiance test bound to the named conversion target,
    // even though the wounded former ally now has lower automatic target life.
    const out = run({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, life: 9000,
      statuses: [...u.statuses, { id: 'taunt', sourceId: 'convert', stacks: 1, remaining: 1,
        appliedAtMs: 0, expiresAtMs: 501 }] })),
      enemyTeam: input.enemyTeam.map(u => u.id === 'former-ally' ? { ...u, life: 9000 } : u) });
    expect(out.events.filter(e => e.kind === 'heal' && e.simClockMs === 1700)).toEqual([
      expect.objectContaining({ target: 'hero', amount: 100 }),
      expect.objectContaining({ target: 'convert', amount: 61 })]);
    expect(out.events.some(e => e.kind === 'heal' && e.target === 'former-ally')).toBe(false);
    const lost = attacks(out).filter(e => e.target === 'former-ally').reduce((n, e) => n + e.amount, 0);
    expect(out.result.enemyTeam.find(u => u.id === 'former-ally')?.life).toBe(9000 - lost);
  });
  it('does not manufacture victory when the last enemy is converted', () => {
    const input = fixture(), out = run({ ...input, enemyTeam: input.enemyTeam.slice(0, 1) });
    expect(attacks(out).filter(e => e.simClockMs < 8500)).toEqual([]);
    expect(attacks(out)[0]).toMatchObject({ simClockMs: 8500, target: 'hero' });
    expect(out.result.winner).toBeNull();
  });
  it('does not grant allegiance to forged snapshot status or foreign status effects', () => {
    const input = fixture({ statuses: [{ id: 'converted', sourceId: 'hero', remaining: 8,
      stacks: 1, appliedAtMs: 0, expiresAtMs: 8000 }, hold(10001)] });
    const out = run({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, skillOrder: [] })) });
    expect(attacks(out)[0]?.target).toBe('hero');
    expect(statusViews(out)[0]?.statuses.some(s => s.id === 'converted')).toBe(false);
  });
  it('does not convert a missed target (seed1 exceeds the 5% hit floor)', () => {
    const input = fixture({ stats: { ...first(fixture().enemyTeam).stats, physDodge: 1 } });
    const out = run({ ...input, seed: 1 });
    expect(attacks(out, 'hero')[0]?.dodged).toBe(true);
    expect(out.events.some(e => e.kind === 'status' && e.statusId === 'converted')).toBe(false);
  });
  it('does not convert or duplicate the death of a killed target', () => {
    const out = run(fixture({ life: 1 }));
    expect(out.events.some(e => e.kind === 'status' && e.statusId === 'converted')).toBe(false);
    expect(out.events.filter(e => e.kind === 'death' && e.target === 'convert')).toHaveLength(1);
    expect(out.result.enemyTeam[0]?.life).toBe(0);
  });
  it('rejects contradictory registered effects before payment', () => {
    const skill = getSkill('paladin.conversion'); if (!skill) throw new Error('Missing Conversion');
    registerSkill({ ...skill, manaCost: 0 });
    const out = run(fixture());
    expect(out.events.some(e => e.kind === 'action' && e.skillId === 'paladin.conversion')).toBe(false);
    expect(out.result.playerTeam[0]?.mana).toBe(25);
  });
});


describe('Conversion integration boundaries', () => {
  it('keeps registered debuff skills aimed at former allies', () => {
    registerSkill({ id: 'fixture.debuff', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
      manaCost: 7, cooldown: 100, effects: [{ kind: 'debuff', statusId: 'stun', durationMs: 1000 }] });
    const out = run(fixture({ skillOrder: ['fixture.debuff'] }));
    expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'stun' && e.simClockMs === 1700))
      .toEqual([expect.objectContaining({ target: 'former-ally' })]);
  });
  it('keeps spawned enemy summons original identity while they follow the converted owner', () => {
    registerSkill({ id: 'fixture.spawn', archetype: 'fixture', target: 'summon', minLevel: 1,
      manaCost: 7, cooldown: 100, effects: [{ kind: 'summon', summonId: 'minion', maxCount: 1 }] });
    const input = fixture({ skillOrder: ['fixture.spawn'] });
    const out = run({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 100000,
      stats: { ...u.stats, lifeMax: 100000 } })) });
    const spawn = out.events.find(e => e.kind === 'summon');
    expect(spawn).toMatchObject({ owner: 'convert', summonId: 'minion', simClockMs: 1700,
      unit: { side: 'enemy', kind: 'summon', summonOwnerId: 'convert' } });
    if (spawn?.kind !== 'summon') throw new Error('Missing actual summon');
    const hits = attacks(out, spawn.unit.id);
    expect(hits.filter(e => e.simClockMs < 8500).length).toBeGreaterThan(0);
    expect(hits.filter(e => e.simClockMs < 8500).every(e => e.target === 'former-ally')).toBe(true);
    expect(hits.find(e => e.simClockMs >= 8500)?.target).toBe('hero');
    expect(out.result.enemyTeam.find(u => u.id === spawn.unit.id)?.side).toBe('enemy');
  });
  it('preserves the converting hit’s original hostility for reflection', () => {
    const out = run(fixture({ physicalReflectionPct: .5 }));
    expect(attacks(out).find(e => e.simClockMs === 500)).toMatchObject({ target: 'hero', damageType: 'thorns', amount: 30 });
    expect(attacks(out).find(e => e.simClockMs === 1700)?.target).toBe('former-ally');
  });
  it('preserves the existing minimum damage floor under very high mitigation', () => {
    const out = run(fixture({ stats: { ...first(fixture().enemyTeam).stats, defense: 100000 } }));
    expect(attacks(out, 'hero')[0]?.amount).toBe(1);
    expect(out.events.some(e => e.kind === 'status' && e.statusId === 'converted')).toBe(true);
  });
  it('source death removes authority and visible conversion before sticky hero defeat', () => {
    const input = fixture();
    const out = run({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, life: 1,
      statuses: [...u.statuses, { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1,
        dotPerStack: 1, appliedAtMs: 100, expiresAtMs: 2000 }] })) });
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status', statusId: 'converted', simClockMs: 500 }));
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'hero', simClockMs: 1100 }));
    expect(statusViews(out).at(-1)?.statuses.some(s => s.id === 'converted')).toBe(false);
    expect(out.result.winner).toBe('enemy');
  });
  it('hostile ambient pulses exclude the converted monster until expiry', () => {
    const input = fixture();
    const out = run({ ...input, statAura: { selectedAuraId: 'paladin.holy-shock', sourceHeroId: 'hero',
      rank: 1, maxRank: 20, bonuses: { lightningDamagePct: .03 },
      pulse: { intervalMs: 1000, damage: 20, damageType: 'lightning' } } });
    const pulses = attacks(out, 'hero').filter(e => e.damageType === 'lightning');
    expect(pulses.filter(e => e.simClockMs < 8500).every(e => e.target === 'former-ally')).toBe(true);
    expect(pulses.find(e => e.target === 'convert')?.simClockMs).toBe(9000);
  });
  it('hostile ambient Chill withdraws and restores with allegiance without resetting action phase', () => {
    const input = fixture(), merc: CombatUnit = { ...first(input.playerTeam), id: 'merc', kind: 'merc',
      holyFreezeAura: true, statuses: [hold()], skillOrder: [] };
    const out = run({ ...input, playerTeam: [...input.playerTeam, merc] });
    expect(statusViews(out).find(e => e.simClockMs === 0)?.statuses.some(s => s.id === 'chill')).toBe(true);
    expect(statusViews(out).find(e => e.simClockMs === 500)?.statuses.some(s => s.id === 'chill')).toBe(false);
    expect(statusViews(out).find(e => e.simClockMs === 8500)?.statuses.some(s => s.id === 'chill')).toBe(true);
    const firstHit = attacks(out)[0];
    expect(firstHit?.simClockMs).toBe(1775); // 25% of the2000ms action spent before conversion, then75% of1700ms.
    expect(firstHit?.target).toBe('former-ally');
  });
});


it('effective allegiance checks expiry/source authority, existing summon ancestry and cycles', () => {
  const input = fixture(), hero = first(input.playerTeam), monster = first(input.enemyTeam);
  const converted: CombatUnit = { ...monster, statuses: [{ id: 'converted', sourceId: hero.id,
    remaining: 8, stacks: 1, appliedAtMs: 500, expiresAtMs: 8500 }] };
  const summon: CombatUnit = { ...monster, id: 'existing-child', kind: 'summon', summon: true,
    summonOwnerId: monster.id, statuses: [] };
  const grandchild: CombatUnit = { ...summon, id: 'grandchild', summonOwnerId: summon.id };
  const units = new Map([hero, converted, summon, grandchild].map(u => [u.id, u]));
  const context = { units, conversions: new Map([[monster.id, { sourceId: hero.id, expiresAtMs: 8500 }]]), simClockMs: 500 };
  for (const u of [converted, summon, grandchild]) expect(effectiveSide(context, u)).toBe('player');
  for (const u of [converted, summon, grandchild]) expect(effectiveSide({ ...context, simClockMs: 8500 }, u)).toBe('enemy');
  units.set(hero.id, { ...hero, conversionRank: 0 });
  expect(effectiveSide(context, grandchild)).toBe('enemy');
  units.set(hero.id, hero); units.set(monster.id, { ...converted, life: 0 });
  expect(effectiveSide(context, grandchild)).toBe('enemy');
  units.set(summon.id, { ...summon, summonOwnerId: grandchild.id });
  expect(effectiveSide(context, grandchild)).toBe('enemy');
});


it('withdraws the converted status view when the converting hit reflects lethal damage', () => {
  const input = fixture({ physicalReflectionPct: 1 });
  const out = run({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, life: 1 })) });
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status', statusId: 'converted', simClockMs: 500 }));
  expect(out.result.winner).toBe('enemy');
  expect(statusViews(out).at(-1)?.statuses.some(s => s.id === 'converted')).toBe(false);
  expect(out.result.enemyTeam[0]?.statuses.some(s => s.id === 'converted')).toBe(false);
});


it.each([
  { conversionRank: undefined }, { conversionRank: 0 }, { conversionRank: 21 },
  { conversionRank: .5 }, { level: 23 }, { kind: 'merc' as const },
  { summon: true }, { ownerId: 'foreign' }, { mana: 24 }
])('refuses an ineligible or unpaid Conversion source %j', patch => {
  const input = fixture(), out = run({ ...input, playerTeam: input.playerTeam.map(u => {
    const { conversionRank, ...unit } = { ...u, ...patch };
    return conversionRank === undefined ? unit : { ...unit, conversionRank };
  }) });
  expect(out.events.some(e => e.kind === 'action' && e.skillId === 'paladin.conversion')).toBe(false);
  expect(out.events.some(e => e.kind === 'status' && e.statusId === 'converted')).toBe(false);
  expect(out.result.playerTeam[0]?.mana).toBe(patch.mana ?? 25);
});
it('keeps different converted targets concurrently and waits rather than recasting on allies', () => {
  const input = fixture(), out = run({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, mana: 75, statuses: [] })) });
  const casts = out.events.filter(e => e.kind === 'action' && e.skillId === 'paladin.conversion');
  expect(casts.map(e => e.simClockMs).slice(0, 3)).toEqual([500, 3500, 8500]);
  expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'converted').slice(0, 2)
    .map(e => e.kind === 'status' ? e.target : '')).toEqual(['convert', 'former-ally']);
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs > 3500 && e.simClockMs < 8500)).toBe(false);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
});
