import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { composeStatAura } from '../skills/stat-auras';
import * as rngModule from '../rng';
import type { DamageType } from '../types/attributes';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const hold = (start = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1,
  remaining: -1, appliedAtMs: start });
function unit(id: string, side: CombatUnit['side'] = 'player', patch: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 100000, mana: 100,
    stats: { life: 100000, lifeMax: 100000, mana: 100, manaMax: 100, attack: 100, defense: 0,
      magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [hold()], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false, ...patch };
}
function source(patch: Partial<CombatUnit> = {}): CombatUnit {
  return unit('source', 'player', { kind: 'merc', mercThornsAura: true, ...patch });
}
function scenario(recipient: Partial<CombatUnit> = {}, merc = source(), type: DamageType = 'physical'): CombatSnapshot {
  registerSkill({ id: 'fixture.thorns-hit', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    manaCost: 0, cooldown: 1, effects: [{ kind: 'damage', damageType: type, base: [100, 100], alwaysHits: true }] });
  return { seed: 7, maxRounds: 3, playerTeam: [unit('hero', 'player', recipient), merc],
    enemyTeam: [unit('attacker', 'enemy', { statuses: [hold(1701)], skillOrder: ['fixture.thorns-hit'] })] };
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
function reflected(out: ReturnType<typeof record>, id = 'hero') {
  return out.events.filter(e => e.kind === 'damage' && e.source === id && e.damageType === 'thorns');
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('native mercenary Thorns presence', () => {
  it.each(['hero', 'merc', 'summon'] as const)('protects a living allied %s, including its own source', kind => {
    const out = record(scenario({ kind, ...(kind === 'summon' ? { summon: true, ownerId: 'hero-owner' } : {}) }));
    for (const id of ['hero', 'source']) expect(reflected(out, id)).toEqual([
      expect.objectContaining({ amount: 100, target: 'attacker', crit: false, dodged: false, simClockMs: 1700 })
    ]);
    expect(out.events.some(e => e.kind === 'action' && e.skillId === 'aura-thorns')).toBe(false);
    expect(out.events.some(e => e.kind === 'mana')).toBe(false);
    expect(out.result.playerTeam.every(u => u.activeBuffIds.length === 0)).toBe(true);
  });
  it('uses physical HP lost after mitigation and partial personal absorption', () => {
    const hero = unit('hero');
    const out = record(scenario({ stats: { ...hero.stats, defense: 7,
      resistances: { ...hero.stats.resistances, physical: 25 } }, statuses: [hold(), {
      id: 'bone-armor', sourceId: 'hero', stacks: 1, remaining: -1, boneArmor: { rank: 1, remaining: 12 }
    }] }));
    expect(out.events.find(e => e.kind === 'damage' && e.target === 'hero'))
      .toMatchObject({ amount: 56, absorbed: 12 });
    expect(reflected(out)).toEqual([expect.objectContaining({ amount: 56 })]);
  });
  it('adds item, selected Paladin and real Spirit of Barbs reflection once despite duplicate sources', () => {
    const input = scenario({ physicalReflectionPct: .2 });
    // Keep the real 80-HP spirit alive through the sweep so Barbs is still present.
    registerSkill({ id: 'fixture.thorns-hit', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
      manaCost: 0, cooldown: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [20, 20], alwaysHits: true }] });
    const statAura = composeStatAura({ id: 'hero', class: 'paladin', level: 30,
      selectedAuraId: 'paladin.thorns', skillLevels: { 'paladin.thorns': 20 } }, 'source');
    if (!statAura) throw new Error('Missing selected Thorns');
    const out = record({ ...input, statAura, spiritOfBarbs: { sourceHeroId: 'hero', rank: 20 },
      playerTeam: [...input.playerTeam, source({ id: 'duplicate' })] });
    expect(out.events.filter(e => e.kind === 'summon' && e.summonId === 'spirit_of_barbs')).toHaveLength(1);
    // 20 * (1 native + .2 item + .8 Paladin + .8 authenticated Barbs).
    expect(reflected(out)).toEqual([expect.objectContaining({ amount: 56 })]);
  });
  it('uses attacker mitigation/minimum one without crit, dodge, boosts or recursion', () => {
    const input = scenario({ increasedDamagePct: { thorns: 99 }, stats: { ...unit('hero').stats, critChance: 1 } });
    const attacker = unit('attacker', 'enemy', { ...input.enemyTeam[0], physicalReflectionPct: 1,
      stats: { ...unit('attacker').stats, defense: 2, physDodge: 1,
        resistances: { ...unit('attacker').stats.resistances, physical: 25 } },
      statuses: [hold(1701)] });
    const out = record({ ...input, enemyTeam: [attacker] });
    expect(reflected(out)).toEqual([expect.objectContaining({ amount: 73, crit: false, dodged: false })]);
    expect(reflected(out, 'attacker')).toEqual([]);
    expect(reflected(record({ ...input, enemyTeam: [{ ...attacker, statuses: [hold(1701)],
      stats: { ...attacker.stats, defense: 999 } }] }))).toEqual([expect.objectContaining({ amount: 1 })]);
  });
  it('withdraws on actual source death and does not retain presence in a fresh wave', () => {
    const input = scenario({}, source({ life: 3, stats: { ...unit('source').stats, defense: 999 }, statuses: [hold(), { id: 'poison', sourceId: 'fixture',
      stacks: 1, remaining: -1, dotPerStack: 1 }] }));
    const attacker = input.enemyTeam[0];
    if (!attacker) throw new Error('Missing attacker');
    const out = record({ ...input, enemyTeam: [{ ...attacker, statuses: [hold(3401)] }] });
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'source', simClockMs: 2000 }));
    expect(out.events.filter(e => e.kind === 'damage' && e.target === 'hero')).toEqual([
      expect.objectContaining({ amount: 100, simClockMs: 1700 }), expect.objectContaining({ amount: 100, simClockMs: 3400 })
    ]);
    expect(reflected(out)).toEqual([expect.objectContaining({ amount: 100, simClockMs: 1700 })]);
    const carried = out.result.playerTeam.find(u => u.id === 'hero');
    if (!carried) throw new Error('Missing carried hero');
    expect(reflected(record({ ...scenario(), playerTeam: [carried] }))).toEqual([]);
  });
  it.each(['stun', 'freeze'])('keeps presence while the living source is %s', id => {
    expect(reflected(record(scenario({}, source({ statuses: [{ ...hold(), id }] })))))
      .toEqual([expect.objectContaining({ amount: 100 })]);
  });
  it.each([
    { kind: 'hero' as const }, { kind: 'monster' as const }, { kind: 'summon' as const },
    { summon: true }, { ownerId: 'owner' }, { summonOwnerId: 'owner' }, { summonTemplateId: 'minion' },
    { side: 'enemy' as const }, { life: 0 }, { life: NaN }, { life: Infinity },
    { level: 0 }, { level: NaN }, { level: Infinity }, { level: 1.5 }
  ])('refuses an ineligible marked source %j', patch => {
    expect(reflected(record(scenario({}, source(patch))))).toEqual([]);
  });
  it('does not infer native authority from a skill order or buff ID', () => {
    const { mercThornsAura: _marker, ...merc } = source();
    expect(reflected(record(scenario({}, { ...merc, skillOrder: ['aura-thorns'], activeBuffIds: ['thorns', 'aura-thorns'] }))))
      .toEqual([]);
  });
  it.each(['fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns'] as const)('does not reflect direct %s', type => {
    expect(reflected(record(scenario({}, source(), type)))).toEqual([]);
  });
  it.each([0, 50, 100])('requires a recipient starting at %s HP to survive the actual hit', life => {
    expect(reflected(record(scenario({ life })))).toEqual([]);
  });
  it('does not reflect full absorption, an actual miss or periodic physical damage', () => {
    expect(reflected(record(scenario({ statuses: [hold(), { id: 'bone-armor', sourceId: 'hero', stacks: 1,
      remaining: -1, boneArmor: { rank: 20, remaining: 240 } }] })))).toEqual([]);
    const miss = scenario({ stats: { ...unit('hero').stats, physDodge: 1 } });
    registerSkill({ id: 'fixture.thorns-hit', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
      manaCost: 0, cooldown: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [100, 100] }] });
    const missed = record({ ...miss, seed: 8 });
    expect(missed.events.find(e => e.kind === 'damage' && e.target === 'hero')).toMatchObject({ dodged: true, amount: 0 });
    expect(reflected(missed)).toEqual([]);
    const periodic = record({ ...scenario({ statuses: [hold(), { id: 'poison', sourceId: 'attacker', stacks: 1,
      remaining: -1, dotPerStack: 1, damageType: 'physical' }] }), enemyTeam: [unit('attacker', 'enemy')] });
    expect(periodic.events.some(e => e.kind === 'dot' && e.target === 'hero' && e.amount > 0)).toBe(true);
    expect(reflected(periodic)).toEqual([]);
  });
  it('does not grant reflection to enemies', () => {
    const input = scenario();
    const out = record({ ...input, playerTeam: [unit('hero', 'player', { statuses: [hold(1701)],
      skillOrder: ['fixture.thorns-hit'] }), source()], enemyTeam: [unit('attacker', 'enemy')] });
    expect(out.events.find(e => e.kind === 'damage' && e.source === 'hero')).toMatchObject({ amount: 100 });
    expect(reflected(out, 'attacker')).toEqual([]);
  });
  it('protects an actual late summon and adds no RNG draws or actions when topology is unchanged', () => {
    const input = scenario();
    registerSkill({ id: 'fixture.thorns-minion', archetype: 'fixture', target: 'self', minLevel: 1,
      manaCost: 0, cooldown: 100, effects: [{ kind: 'summon', summonId: 'minion', maxCount: 1 }] });
    registerSkill({ id: 'fixture.thorns-hit', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
      manaCost: 0, cooldown: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [20, 20], alwaysHits: true }] });
    const hero = unit('hero', 'player', { statuses: [hold(901)], skillOrder: ['fixture.thorns-minion'],
      stats: { ...unit('hero').stats, attackSpeed: 200 } });
    const enabled = { ...input, playerTeam: [hero, source()] };
    const { mercThornsAura: _marker, ...merc } = source();
    const disabled = { ...input, playerTeam: [hero, merc] };
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
    expect(out.events.find(e => e.kind === 'damage' && e.target === spawn.unit.id))
      .toMatchObject({ amount: 10, damageType: 'physical', simClockMs: 1700 });
    expect(reflected(out, spawn.unit.id)).toEqual([expect.objectContaining({ amount: 10 })]);
    expect(reflected(control, spawn.unit.id)).toEqual([]);
    expect(out.events.filter(e => e.kind === 'action')).toEqual(control.events.filter(e => e.kind === 'action'));
    expect(calls[0]).toEqual(calls[1]); expect(tails[0]).toBe(tails[1]);
    expect(record(enabled)).toEqual(out);
  });
  it('settles a reflected kill once and stops the remaining AoE targets and effects', () => {
    const input = scenario();
    registerSkill({ id: 'fixture.thorns-hit', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
      manaCost: 0, cooldown: 1, effects: [
        { kind: 'damage', damageType: 'physical', base: [100, 100], alwaysHits: true },
        { kind: 'buff', id: 'must-not-apply', duration: -1 }, { kind: 'damage', damageType: 'fire', base: [100, 100] }
      ] });
    const attacker = input.enemyTeam[0];
    if (!attacker) throw new Error('Missing attacker');
    const out = record({ ...input, enemyTeam: [{ ...attacker, life: 10 }] });
    expect(out.events.filter(e => e.kind === 'death')).toEqual([expect.objectContaining({ target: 'attacker' })]);
    expect(out.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'attacker', target: 'hero', amount: 100 }),
      expect.objectContaining({ source: 'hero', target: 'attacker', amount: 100, damageType: 'thorns' })
    ]);
    expect(out.result.playerTeam.find(u => u.id === 'source')?.life).toBe(100000);
    expect(out.result.enemyTeam[0]?.activeBuffIds).toEqual([]);
    expect(out.result.winner).toBe('player');
  });
});
