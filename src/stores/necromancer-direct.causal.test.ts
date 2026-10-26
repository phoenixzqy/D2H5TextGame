import { beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/necromancer.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { createRng } from '@/engine/rng';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';

const spells = [
  { slug: 'teeth', min: 20, max: 35, growth: 4, cost: 7, targets: 2 },
  { slug: 'bone-spear', min: 60, max: 90, growth: 7, cost: 20, targets: 1 },
  { slug: 'bone-spirit', min: 110, max: 160, growth: 12, cost: 30, targets: 1 },
  { slug: 'poison-nova', min: 20, max: 30, growth: 4, cost: 25, targets: 12 }
] as const;
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
function fixture(slug: string, rank = 1, seed = 7): CombatSnapshot {
  const levels: Record<string, number> = {};
  function add(id: string) {
    const row = rows.find(value => value.id === id);
    if (!row) throw new Error('Missing Necromancer prerequisite');
    for (const ancestor of row.prerequisites ?? []) add(ancestor);
    levels[id] = 1;
  }
  const id = 'skills-necromancer-' + slug; add(id); levels[id] = rank;
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic direct bone/poison', 'necromancer'),
    id: 'hero', level: 30, skillLevels: levels, comboOrder: [id] });
  const hero: CombatUnit = { ...native, life: 2000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    statuses: [{ id: 'stun', sourceId: 'synthetic-hold', stacks: 1, remaining: -1, appliedAtMs: 1701 }],
    stats: { ...native.stats, lifeMax: 2000, manaMax: 100, attack: 100, attackSpeed: 100,
      defense: 0, magicResist: 0, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  return { seed, playerTeam: [hero], enemyTeam: Array.from({ length: 12 }, (_, i): CombatUnit => ({
    ...hero, id: 'target-' + String(i), side: 'enemy', kind: 'monster', tier: 'trash',
    mana: 0, skillOrder: [], skillLevels: {}, activeBuffIds: [],
    statuses: [{ id: 'stun', sourceId: 'synthetic-hold', stacks: 1, remaining: -1 }],
    gridPosition: { row: Math.floor(i / 3), col: i % 3 }
  })) };
}
function damage(event: RecordedBattleEvent): event is Extract<RecordedBattleEvent, { kind: 'damage' }> {
  return event.kind === 'damage' && event.source === 'hero';
}
for (const spell of spells) for (const rank of [1, 2, 20]) {
  it.each([7, 19, 41, 97])(`${spell.slug} rank${String(rank)} has exact paid native recipients/potency, seed%i`, seed => {
    const input = fixture(spell.slug, rank, seed), before = structuredClone(input), rng = createRng(seed);
    const expected = Array.from({ length: spell.targets }, (_, i) => {
      const hit = rng.chance(.85);
      const amount = hit ? rng.nextInt(spell.min + spell.growth * (rank - 1), spell.max + spell.growth * (rank - 1)) : 0;
      if (hit) { rng.chance(0); if (spell.slug === 'poison-nova') rng.chance(1); }
      return { target: 'target-' + String(i), amount, dodged: !hit };
    });
    const out = runBattleRecorded(input);
    expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
    expect(runBattle(input)).toEqual(out.result);
    expect(out.events.filter(damage).map(event => ({ target: event.target, amount: event.amount, dodged: event.dodged }))).toEqual(expected);
    expect(out.events.filter(event => event.kind === 'action' && event.actor === 'hero')).toHaveLength(1);
    expect(out.events.filter(event => event.kind === 'mana' && event.reason === 'cast')).toHaveLength(1);
    expect(out.result.playerTeam[0]?.mana).toBe(100 - spell.cost);
    for (const target of input.enemyTeam) {
      const hit = expected.find(event => event.target === target.id);
      const dps = spell.slug === 'poison-nova' && hit && !hit.dodged ? Math.max(1, Math.floor(hit.amount * .05)) : 0;
      expect(out.result.enemyTeam.find(unit => unit.id === target.id)?.life).toBe(2000 - (hit?.amount ?? 0) - 10 * dps);
      if (dps > 0) {
        const observed = out.events.find(event => event.kind === 'status-state' && event.target === target.id &&
          event.statuses.some(status => status.id === 'poison'));
        expect(observed?.kind === 'status-state' ? observed.statuses.find(status => status.id === 'poison') : undefined)
          .toMatchObject({ stacks: 2, dotPerStack: dps, appliedAtMs: 1700, expiresAtMs: 6700 });
      }
    }
  });
}
for (const spell of spells) {
  it(`${spell.slug} respects native class/rank/unlock and transitive prerequisites`, () => {
    const levels = { ...fixture(spell.slug).playerTeam[0]?.skillLevels };
    const id = 'skills-necromancer-' + spell.slug, canonical = 'necromancer.' + spell.slug.replaceAll('-', '_');
    const source = rows.find(row => row.id === id);
    if (!source) throw new Error('Missing Necromancer authority source');
    const owner = { ...createMockPlayer('Native authority', 'necromancer'), level: 30, skillLevels: levels, comboOrder: [id] };
    for (const patch of [{ class: 'barbarian' as const }, { level: source.requiredLevel - 1 }, { skillLevels: {} },
      ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ skillLevels: { ...levels, [id]: rank, [canonical]: rank } }))])
      expect(playerToCombatUnit({ ...owner, ...patch }).skillOrder).toEqual([]);
    const sourceIds = Object.keys(levels).filter(key => key.startsWith('skills-necromancer-') && key !== id);
    for (const ancestor of sourceIds) {
      const missing = { ...levels }; Reflect.deleteProperty(missing, ancestor);
      Reflect.deleteProperty(missing, 'necromancer.' + ancestor.slice('skills-necromancer-'.length).replaceAll('-', '_'));
      expect(playerToCombatUnit({ ...owner, skillLevels: missing }).skillOrder).toEqual([]);
    }
    expect(playerToCombatUnit(owner).skillOrder).toHaveLength(1);
  });
  it(`${spell.slug} refuses insufficient MP and active cooldown without paying`, () => {
    const canonical = 'necromancer.' + spell.slug.replaceAll('-', '_');
    for (const patch of [{ mana: spell.cost - 1 }, { cooldowns: { [canonical]: 100000 } }]) {
      const initial = fixture(spell.slug);
      const input = { ...initial, playerTeam: initial.playerTeam.map(unit => ({ ...unit, ...patch })) };
      const out = runBattleRecorded(input);
      expect(out.events.filter(event => event.kind === 'mana' && event.reason === 'cast')).toEqual([]);
      expect(out.events.some(event => event.kind === 'action' && event.skillId === canonical)).toBe(false);
    }
  });
  it(`${spell.slug} uses its typed mitigation rather than the other flat defense`, () => {
    const input = fixture(spell.slug), baseline = runBattleRecorded(input).events.filter(damage);
    const unrelated = { ...input, enemyTeam: input.enemyTeam.map(unit => ({ ...unit, stats: { ...unit.stats,
      defense: spell.slug === 'poison-nova' ? 0 : 99999,
      magicResist: spell.slug === 'poison-nova' ? 99999 : 0 } })) };
    expect(runBattleRecorded(unrelated).events.filter(damage)).toEqual(baseline);
    const defended = { ...input, enemyTeam: input.enemyTeam.map(unit => ({ ...unit, stats: { ...unit.stats,
      defense: spell.slug === 'poison-nova' ? 7 : 99999,
      magicResist: spell.slug === 'poison-nova' ? 99999 : 7,
      resistances: { ...unit.stats.resistances, arcane: 50, poison: 50 } } })) };
    const mitigated = runBattleRecorded(defended).events.filter(damage);
    expect(mitigated.map(event => event.amount)).toEqual(baseline.map(event => event.dodged ? 0 : Math.max(1, Math.floor(event.amount * .5 - 7))));
  });
}
