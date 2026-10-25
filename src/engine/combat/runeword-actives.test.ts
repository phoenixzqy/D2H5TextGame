import { afterEach, describe, expect, it, vi } from 'vitest';
import { runBattleRecorded } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import type { DerivedStats } from '../types/attributes';
import type { RunewordGrant } from '../types/items';
import { projectGovernedActives } from '../skills/runeword-actives';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import * as rngModule from '../rng';

const stats: DerivedStats = {
  life: 100000, lifeMax: 100000, mana: 100000, manaMax: 100000, attack: 1,
  defense: 0, magicResist: 0, attackSpeed: 263, critChance: 0, critDamage: 1.5,
  physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};
const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1,
  remaining: -1, appliedAtMs });
const fire: RunewordGrant = { id: 'skill-fire-bolt', skillId: 'sorceress.fire_bolt', rank: 3,
  increasedDamagePct: { fire: .12 } };
const blaze: RunewordGrant = { id: 'skill-blaze', skillId: 'sorceress.blaze', rank: 5 };
const chain: RunewordGrant = { id: 'skill-chain-lightning', skillId: 'sorceress.chain_lightning', rank: 5 };
const redemption: RunewordGrant = { id: 'aura-redemption', skillId: 'item.redemption', rank: 1, manaRegenPct: .1 };
function unit(id: string, overrides: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side: 'player', kind: 'hero', level: 70, tier: 'trash', stats,
    life: stats.lifeMax, mana: stats.manaMax, statuses: [], cooldowns: {}, skillOrder: [],
    activeBuffIds: [], enraged: false, equippedWeapon: {}, ...overrides };
}
function actor(grants: readonly RunewordGrant[], kind: 'hero' | 'merc', patch: Partial<CombatUnit> = {}): CombatUnit {
  const projection = projectGovernedActives({ owner: kind === 'hero'
    ? { kind, classId: 'paladin', level: 70, learnedRanks: {} } : { kind, level: 70 },
    grants, storedOrder: [] });
  return unit('actor', { kind, skillOrder: projection.combatOrder, governedActiveRanks: projection.ranks, ...patch });
}
function enemies(): CombatUnit[] {
  return Array.from({ length: 4 }, (_, index) => unit(`enemy-${String(index)}`, {
    side: 'enemy', kind: 'monster', statuses: [hold()],
    gridPosition: index < 3 ? { row: 1, col: index } : { row: 0, col: 1 }
  }));
}
function battle(actor: CombatUnit) { return runBattleRecorded({ seed: 7, playerTeam: [actor], enemyTeam: enemies() }); }
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe.each(['hero', 'merc'] as const)('actual equipped active casts for %s', kind => {
  it.each([
    { grant: fire, mp: 8, cd: 1200, targets: 1, type: 'fire', min: 38, max: 53, status: 'burn' },
    { grant: blaze, mp: 22, cd: 3200, targets: 4, type: 'fire', min: 80, max: 105, status: 'burn' },
    { grant: chain, mp: 25, cd: 2000, targets: 4, type: 'lightning', min: 70, max: 90, status: 'paralyze' }
  ])('uses the real $grant.skillId rank, MP, CD, targeting and status', row => {
    const caster = actor([row.grant], kind);
    const before = structuredClone(caster), result = battle(caster);
    const actions = result.events.filter(event => event.kind === 'action' && event.actor === 'actor' &&
      event.skillId === row.grant.skillId);
    expect(actions.length).toBeGreaterThan(2);
    expect(actions[0]?.simClockMs).toBe(400);
    for (let i = 1; i < actions.length; i++) {
      const current = actions[i], previous = actions[i - 1];
      if (!current || !previous) throw new Error('Missing consecutive cast actions');
      expect(current.simClockMs - previous.simClockMs).toBe(row.cd);
    }
    expect(result.result.playerTeam[0]?.mana).toBe(stats.manaMax - actions.length * row.mp);
    const hits = result.events.filter(event => event.kind === 'damage' && event.source === 'actor' &&
      event.simClockMs === 400 && event.damageType === row.type);
    expect(hits).toHaveLength(row.targets);
    for (const event of hits) {
      if (event.kind !== 'damage') throw new Error('Expected damage');
      expect(event.amount).toBeGreaterThanOrEqual(row.min);
      expect(event.amount).toBeLessThanOrEqual(row.max);
    }
    const statuses = result.events.filter(event => event.kind === 'status' &&
      event.simClockMs === 400 && event.statusId === row.status);
    expect(statuses).toHaveLength(row.targets);
    const definition = getSkill(row.grant.skillId);
    expect(definition?.effects.find(effect => effect.kind === 'damage')).toMatchObject({
      tags: row.type === 'fire' ? ['fire', 'burn'] : ['lightning', 'shock']
    });
    const { governedActiveRanks: _ranks, ...legacy } = caster;
    const ordinary = battle({ ...legacy, skillLevels: { [row.grant.skillId]: row.grant.rank } });
    expect(result.events).toEqual(ordinary.events);
    expect(battle(caster)).toEqual(result);
    expect(caster).toEqual(before);
    expect(caster.skillLevels).toBeUndefined();
  });
  it.each([fire, blaze, chain])('falls back when $skillId has insufficient MP, insufficient level or zero availability', grant => {
    const caster = actor([grant], kind);
    const unavailable = projectGovernedActives({ owner: { kind: 'merc', level: 70 }, grants: [], storedOrder: [] });
    for (const patch of [{ mana: 0 }, { governedActiveRanks: unavailable.ranks },
      ...(grant === fire ? [] : [{ level: 1 }])]) {
      const result = battle({ ...caster, ...patch });
      expect(result.events.some(event => event.kind === 'action' && event.skillId === grant.skillId)).toBe(false);
      expect(result.events.some(event => event.kind === 'action' && event.actor === 'actor' && event.skillId === null)).toBe(true);
    }
  });
  it('heals only itself with floor/clamp and no mana or corpse requirement', () => {
    const caster = actor([redemption], kind, { life: 50, mana: 0,
      stats: { ...stats, lifeMax: 203 }, statuses: [hold(401)] });
    const ally = unit('ally', { kind: 'merc', life: 1, statuses: [hold()] });
    const result = runBattleRecorded({ seed: 7, playerTeam: [caster, ally], enemyTeam: enemies() });
    expect(result.events.filter(event => event.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'actor', amount: 20, simClockMs: 400 })
    ]);
    expect(result.result.playerTeam.map(unit => unit.life)).toEqual([70, 1]);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
    const capped = battle({ ...caster, life: 200 });
    expect(capped.events.filter(event => event.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'actor', amount: 3 })
    ]);
    expect(capped.result.playerTeam[0]?.life).toBe(203);
  });
});

describe('Redemption availability and scheduling', () => {
  it('spends one ordinary action per heal and respects the four-second cooldown', () => {
    const result = battle(actor([redemption], 'hero', { life: 1, mana: 0, stats: { ...stats, lifeMax: 203 } }));
    const heals = result.events.filter(event => event.kind === 'heal');
    expect(heals).toHaveLength(11);
    expect(heals.slice(0, 3).map(event => event.simClockMs)).toEqual([400, 4400, 8400]);
    expect(heals.at(-1)).toMatchObject({ target: 'actor', amount: 2 });
    expect(result.result.playerTeam[0]?.life).toBe(203);
    expect(result.events.filter(event => event.kind === 'action' && event.actor === 'actor' &&
      event.simClockMs === 400)).toEqual([expect.objectContaining({ skillId: 'item.redemption' })]);
    expect(result.events.some(event => event.kind === 'action' && event.actor === 'actor' &&
      event.simClockMs === 800 && event.skillId === null)).toBe(true);
  });
  it('does not heal full, dead, zero-potential or unavailable bearers, including forged learned ownership', () => {
    const caster = actor([redemption], 'hero', { mana: 0 });
    const zero = projectGovernedActives({ owner: { kind: 'merc', level: 70 }, grants: [], storedOrder: [] }).ranks;
    const { governedActiveRanks: _ranks, ...withoutMap } = caster;
    for (const candidate of [caster, { ...caster, life: 0 },
      { ...caster, life: 1, stats: { ...stats, lifeMax: 9 } },
      { ...caster, life: 1, governedActiveRanks: zero },
      { ...withoutMap, life: 1, skillLevels: { 'item.redemption': 1 } }]) {
      const result = battle(candidate);
      expect(result.events.some(event => event.kind === 'heal')).toBe(false);
      expect(result.events.some(event => event.kind === 'action' && event.skillId === 'item.redemption')).toBe(false);
    }
  });
  it('introduces no battle RNG compared with an otherwise identical deterministic buff action', () => {
    registerSkill({ id: 'fixture.noop', archetype: 'fixture', target: 'self', minLevel: 1,
      manaCost: 0, cooldown: 4, effects: [{ kind: 'buff', id: 'fixture-noop', duration: 1 }] });
    const caster = actor([redemption], 'hero', { life: 1, mana: 0, statuses: [hold(401)] });
    const tails: number[] = [], calls: unknown[][] = [];
    for (const candidate of [caster, { ...caster, skillOrder: ['fixture.noop'] }]) {
      const random = rngModule.createRng(7), range = vi.spyOn(random, 'nextInt');
      vi.spyOn(rngModule, 'createRng').mockReturnValueOnce(random);
      battle(candidate); calls.push(range.mock.calls); tails.push(random.next());
      vi.restoreAllMocks();
    }
    expect(calls[0]).toEqual(calls[1]); expect(tails[0]).toBe(tails[1]);
  });
});
