import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { composeStatAura } from '../skills/stat-auras';
import { deriveEquippedPlayerStats } from '../progression/equipped-stats';
import { deriveStats } from '../progression/stats';
import * as rngModule from '../rng';
import type { DamageType } from '../types/attributes';
import type { Item } from '../types/items';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const hold = (start = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1,
  remaining: -1, appliedAtMs: start });
function unit(id: string, side: CombatUnit['side'] = 'player', patch: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 100000, mana: 100,
    stats: { life: 100000, lifeMax: 100000, mana: 100, manaMax: 100, attack: 100, defense: 100,
      magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [hold()], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false, ...patch };
}
function source(patch: Partial<CombatUnit> = {}): CombatUnit {
  return unit('source', 'player', { kind: 'merc', mercDefianceAura: true, ...patch });
}
function hit(type: DamageType = 'physical', base = 200, ignoresDefense?: true) {
  registerSkill({ id: 'fixture.defiance-hit', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    manaCost: 0, cooldown: 1,
    effects: [{ kind: 'damage', damageType: type, base: [base, base], alwaysHits: true,
      ...(ignoresDefense === true ? { ignoresDefense } : {}) }] });
}
function scenario(recipient: Partial<CombatUnit> = {}, merc = source(), type: DamageType = 'physical'): CombatSnapshot {
  hit(type);
  return { seed: 7, maxRounds: 3, playerTeam: [unit('hero', 'player', recipient), merc],
    enemyTeam: [unit('attacker', 'enemy', { statuses: [hold(1701)], skillOrder: ['fixture.defiance-hit'] })] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  for (const original of [...input.playerTeam, ...input.enemyTeam]) {
    const result = [...out.result.playerTeam, ...out.result.enemyTeam].find(row => row.id === original.id);
    expect(result?.stats).toEqual(original.stats);
  }
  return out;
}
function incoming(input: CombatSnapshot, id = 'hero') {
  return record(input).events.find(e => e.kind === 'damage' && e.target === id);
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('native mercenary Defiance presence', () => {
  it.each(['hero', 'merc', 'summon'] as const)('protects a living allied %s and its own source', kind => {
    const input = scenario({ kind, ...(kind === 'summon' ? { summon: true, ownerId: 'hero-owner' } : {}) });
    const out = record(input);
    for (const id of ['hero', 'source']) expect(out.events.find(e => e.kind === 'damage' && e.target === id))
      .toMatchObject({ amount: 70, simClockMs: 1700, crit: false, dodged: false });
    expect(out.events.some(e => e.kind === 'mana')).toBe(false);
    expect(out.result.playerTeam.every(u => u.activeBuffIds.length === 0)).toBe(true);
  });
  it('is active without casting the aura and never pays for a passive', () => {
    const out = record(scenario({}, source({ statuses: [], skillOrder: ['aura-defiance'] })));
    expect(out.events.find(e => e.kind === 'damage' && e.target === 'source')).toMatchObject({ amount: 70 });
    expect(out.events.some(e => e.kind === 'action' && e.skillId === 'aura-defiance')).toBe(false);
    expect(out.events.some(e => e.kind === 'mana')).toBe(false);
  });
  it('adds selected Paladin and paid Frozen Armor bonuses while duplicate native sources count once', () => {
    const input = scenario({ frozenArmor: { rank: 5, defensePct: .15 } });
    const statAura = composeStatAura({ id: 'hero', class: 'paladin', level: 30,
      selectedAuraId: 'paladin.defiance', skillLevels: { 'paladin.defiance': 5 } }, 'source');
    if (!statAura) throw new Error('Missing selected Defiance');
    // 200 - 100 * (1 + .30 native + .20 selected + .15 paid armor) = 35.
    expect(incoming({ ...input, statAura, playerTeam: [...input.playerTeam, source({ id: 'duplicate' })] }))
      .toMatchObject({ amount: 35 });
  });
  it('withdraws at actual source death and rebuilds without the absent source in the next wave', () => {
    const input = scenario({}, source({ life: 3, stats: { ...unit('source').stats, defense: 999 },
      statuses: [hold(), { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1, dotPerStack: 1 }] }));
    const attacker = input.enemyTeam[0];
    if (!attacker) throw new Error('Missing attacker');
    const out = record({ ...input, enemyTeam: [{ ...attacker, statuses: [hold(3401)] }] });
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'source', simClockMs: 2000 }));
    expect(out.events.filter(e => e.kind === 'damage' && e.target === 'hero')).toEqual([
      expect.objectContaining({ amount: 70, simClockMs: 1700 }),
      expect.objectContaining({ amount: 100, simClockMs: 3400 })
    ]);
    const carried = out.result.playerTeam.find(u => u.id === 'hero');
    if (!carried) throw new Error('Missing carried hero');
    expect(incoming({ ...scenario(), playerTeam: [carried] })).toMatchObject({ amount: 100 });
  });
  it.each(['stun', 'freeze'])('keeps presence while the living source is %s', id => {
    expect(incoming(scenario({}, source({ statuses: [{ ...hold(), id }] })))).toMatchObject({ amount: 70 });
  });
  it.each([
    { kind: 'hero' as const }, { kind: 'monster' as const }, { kind: 'summon' as const },
    { summon: true }, { ownerId: 'owner' }, { summonOwnerId: 'owner' }, { summonTemplateId: 'minion' },
    { side: 'enemy' as const }, { life: 0 }, { life: NaN }, { life: Infinity },
    { level: 0 }, { level: NaN }, { level: Infinity }, { level: 1.5 }
  ])('refuses an ineligible marked source %j', patch => {
    expect(incoming(scenario({}, source(patch)))).toMatchObject({ amount: 100 });
  });
  it('does not infer native authority from a skill order or buff ID', () => {
    const { mercDefianceAura: _marker, ...merc } = source();
    expect(incoming(scenario({}, { ...merc, skillOrder: ['aura-defiance'], activeBuffIds: ['defiance', 'aura-defiance'] })))
      .toMatchObject({ amount: 100 });
  });
  it.each(['physical', 'fire', 'poison', 'thorns', 'cold', 'lightning', 'arcane'] as const)('preserves existing %s mitigation mapping', type => {
      const expected = ['cold', 'lightning', 'arcane'].includes(type) ? 180 : 70;
      expect(incoming(scenario({ stats: { ...unit('hero').stats, magicResist: 20 } }, source(), type)))
        .toMatchObject({ amount: expected, damageType: type });
    });
  it('preserves minimum-one damage and the explicit Defense bypass', () => {
    expect(incoming(scenario({ stats: { ...unit('hero').stats, defense: 1000 } })))
      .toMatchObject({ amount: 1 });
    const input = scenario(); hit('physical', 200, true);
    expect(incoming(input)).toMatchObject({ amount: 200 });
  });
  it('applies existing Melt and Inner Sight reductions after additive Defense bonuses', () => {
    // Melt also gives physical hits a 1.25 combo. Rogue Inner Sight reduces Defense by 25%.
    // floor(200 * 1.25 - 100 * 1.30 * .70 * .75) = 181.
    const recipient = { statuses: [hold(), { ...hold(), id: 'armor-melt' },
      { ...hold(), id: 'merc-inner-sight' }] };
    expect(incoming(scenario(recipient))).toMatchObject({ amount: 181 });
    const { mercDefianceAura: _marker, ...merc } = source();
    expect(incoming(scenario(recipient, merc))).toMatchObject({ amount: 197 });
  });
  it('never grants party Defense to enemies or schedules hits on dead recipients', () => {
    const input = scenario();
    const out = record({ ...input, playerTeam: [unit('hero', 'player', { statuses: [hold(1701)],
      skillOrder: ['fixture.defiance-hit'] }), source()], enemyTeam: [unit('attacker', 'enemy')] });
    expect(out.events.find(e => e.kind === 'damage' && e.target === 'attacker')).toMatchObject({ amount: 100 });
    const dead = unit('dead', 'player', { kind: 'merc', life: 0 });
    const withDead = record({ ...input, playerTeam: [...input.playerTeam, dead] });
    expect(withDead.events.some(e => e.kind === 'damage' && e.target === dead.id)).toBe(false);
  });
  it('retains the independent Exile self-only Defense and adds no native source authority', () => {
    const coreStats = { strength: 20, dexterity: 20, vitality: 20, energy: 20 };
    const exile: Item = { id: 'exile-control', baseId: 'items/base/sh-monarch', rarity: 'runeword',
      runewordId: 'runewords/exile', level: 60, socketCapacity: 4,
      socketContents: ['vex', 'ohm', 'ist', 'dol'].map(id => ({ kind: 'rune', id: `runes/${id}` })),
      baseRolls: { defense: 64 }, identified: true, equipped: false };
    const stats = deriveEquippedPlayerStats({ coreStats, derivedStats: deriveStats(coreStats, 60) }, 60, { offhand: exile });
    expect(stats.defense).toBeCloseTo(577.2, 12);
    const input = scenario({ stats: { ...unit('hero').stats, defense: stats.defense } });
    hit('physical', 1000);
    expect(incoming(input)).toMatchObject({ amount: 249 });
    const { mercDefianceAura: _marker, ...merc } = source();
    expect(incoming({ ...input, playerTeam: [input.playerTeam[0] ?? unit('hero'), merc] }))
      .toMatchObject({ amount: 422 });
    expect(incoming({ ...input, playerTeam: [input.playerTeam[0] ?? unit('hero'), merc] }, 'source'))
      .toMatchObject({ amount: 900 });
  });
  it('leaves already-authored periodic damage settlement unchanged', () => {
    const input = scenario({ statuses: [hold(), { id: 'poison', sourceId: 'attacker', stacks: 1,
      remaining: -1, dotPerStack: 10, damageType: 'physical' }] });
    const { mercDefianceAura: _marker, ...merc } = source();
    const enabled = record(input), disabled = record({ ...input, playerTeam: [input.playerTeam[0] ?? unit('hero'), merc] });
    const dots = (out: typeof enabled) => out.events.filter(e => e.kind === 'dot' && e.target === 'hero');
    expect(dots(enabled).length).toBeGreaterThan(0);
    expect(dots(enabled)).toEqual(dots(disabled));
  });
  it('protects an actual late summon without adding actions or RNG draws in the same topology', () => {
    const input = scenario(); hit('physical', 20);
    registerSkill({ id: 'fixture.defiance-minion', archetype: 'fixture', target: 'self', minLevel: 1,
      manaCost: 0, cooldown: 100, effects: [{ kind: 'summon', summonId: 'minion', maxCount: 1 }] });
    const hero = unit('hero', 'player', { statuses: [hold(901)], skillOrder: ['fixture.defiance-minion'],
      stats: { ...unit('hero').stats, attackSpeed: 200 } });
    const { mercDefianceAura: _marker, ...merc } = source();
    const enabled = { ...input, playerTeam: [hero, source()] }, disabled = { ...input, playerTeam: [hero, merc] };
    const tails: number[] = [], calls: unknown[][] = [], results: ReturnType<typeof runBattleRecorded>[] = [];
    for (const snapshot of [enabled, disabled]) {
      const random = rngModule.createRng(7), chance = vi.spyOn(random, 'chance');
      vi.spyOn(rngModule, 'createRng').mockReturnValueOnce(random);
      results.push(runBattleRecorded(snapshot)); calls.push(chance.mock.calls); tails.push(random.next());
      vi.restoreAllMocks();
    }
    const [out, control] = results;
    if (!out || !control) throw new Error('Missing paired output');
    const spawn = out.events.find(e => e.kind === 'summon');
    if (spawn?.kind !== 'summon') throw new Error('Missing actual late summon');
    expect(spawn.simClockMs).toBe(900);
    expect(spawn.unit.stats.defense).toBe(10);
    expect(out.events.find(e => e.kind === 'damage' && e.target === spawn.unit.id))
      .toMatchObject({ amount: 7, simClockMs: 1700 });
    expect(control.events.find(e => e.kind === 'damage' && e.target === spawn.unit.id))
      .toMatchObject({ amount: 10, simClockMs: 1700 });
    expect(out.events.filter(e => e.kind === 'action')).toEqual(control.events.filter(e => e.kind === 'action'));
    expect(calls[0]).toEqual(calls[1]); expect(tails[0]).toBe(tails[1]);
    expect(record(enabled)).toEqual(out);
  });
});
