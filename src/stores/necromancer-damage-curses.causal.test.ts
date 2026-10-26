import { beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/necromancer.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';

const cases = [
  { slug: 'iron-maiden', unlock: 12, costs: [11, 6] },
  { slug: 'life-tap', unlock: 18, costs: [9, 5] },
  { slug: 'lower-resist', unlock: 30, costs: [22, 16] }
] as const;
type Curse = typeof cases[number]['slug'];
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
function owner(slug: Curse, rank: number) {
  const skillLevels: Record<string, number> = {};
  function learn(id: string) {
    const row = rows.find(r => r.id === id);
    if (!row) throw new Error('Missing native curse prerequisite');
    for (const prerequisite of row.prerequisites ?? []) learn(prerequisite);
    skillLevels[id] = 1;
  }
  const id = 'skills-necromancer-' + slug;
  learn(id); skillLevels[id] = rank;
  return { ...createMockPlayer('Synthetic native damage curse', 'necromancer'), level: 30,
    skillLevels, comboOrder: [id] };
}
/** Synthetic pools/ordinary hits; native authoring, eligibility, payment and combat remain real. */
function fixture(slug: Curse, rank: number, type: 'physical' | 'fire' | 'cold' | 'lightning' | 'arcane' | 'poison' | 'thorns' = 'physical'): CombatSnapshot {
  const row = cases.find(r => r.slug === slug);
  if (!row) throw new Error('Missing literal cost');
  const native = playerToCombatUnit(owner(slug, rank));
  const hero: CombatUnit = { ...native, id: 'hero', life: 100000, mana: row.costs[rank === 20 ? 1 : 0],
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, life: 100000, lifeMax: 100000, mana: 100, manaMax: 100,
      attack: 0, attackSpeed: 263, defense: 0, magicResist: 0, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 401 }] };
  const target: CombatUnit = { ...hero, id: 'target', side: 'enemy', kind: 'monster', tier: 'trash', mana: 0,
    skillOrder: [], skillLevels: {}, activeBuffIds: [],
    stats: { ...hero.stats, attack: 100, attackSpeed: 250,
      ...(slug === 'lower-resist' ? { defense: 10, magicResist: 10,
        resistances: { physical: 50, fire: 50, cold: 50, lightning: 50, arcane: 50, poison: 50 } } : {}) },
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1,
      ...(slug === 'iron-maiden' ? { appliedAtMs: 501 } : {}) }] };
  const ally: CombatUnit = { ...hero, id: 'ally', kind: 'merc', mana: 0,
    life: slug === 'life-tap' ? 90000 : 100000,
    skillOrder: ['fixture.curse-strike'], skillLevels: {}, activeBuffIds: [],
    stats: { ...hero.stats, attack: 100, attackSpeed: 250 },
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 501 }] };
  registerSkill({ id: 'fixture.curse-strike', archetype: 'fixture', minLevel: 1, target: 'single-enemy',
    cooldown: 100, manaCost: 0, effects: [{ kind: 'damage', damageType: type, base: [100, 100] }] });
  return { seed: 1, playerTeam: slug === 'iron-maiden' ? [hero] : [hero, ally], enemyTeam: [target] };
}
function matchedControl(input: CombatSnapshot, slug: Curse) {
  const original = getSkill('necromancer.' + slug.replaceAll('-', '_'));
  if (!original) throw new Error('Missing real native curse');
  registerSkill({ ...original, effects: [{ kind: 'debuff', statusId: 'fixture.inert-curse' }] });
  try { return runBattleRecorded(input); }
  finally { registerSkill(original); }
}
function assertPaid(input: CombatSnapshot, slug: Curse, out: ReturnType<typeof runBattleRecorded>) {
  const canonical = 'necromancer.' + slug.replaceAll('-', '_');
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero'))
    .toEqual([expect.objectContaining({ skillId: canonical, simClockMs: 400 })]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast' && e.target === 'hero'))
    .toEqual([expect.objectContaining({ mana: 0, simClockMs: 400 })]);
  const control = matchedControl(input, slug);
  expect(out.events.filter(e => e.kind === 'action' || e.kind === 'mana'))
    .toEqual(control.events.filter(e => e.kind === 'action' || e.kind === 'mana'));
  const rolls = (events: readonly RecordedBattleEvent[]) => events.flatMap(e =>
    e.kind === 'damage' && (e.source === 'ally' || e.source === 'target')
      ? [[e.source, e.target, e.simClockMs, e.damageType, e.dodged, e.crit]] : []);
  expect(rolls(out.events)).toEqual(rolls(control.events));
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  return control;
}
function damage(e: RecordedBattleEvent): e is Extract<RecordedBattleEvent, { kind: 'damage' }> { return e.kind === 'damage'; }
for (const rank of [1, 20]) {
  it(`native paid Iron Maiden rank${String(rank)} reflects real Physical HP removed`, () => {
    const input = fixture('iron-maiden', rank), before = structuredClone(input), out = runBattleRecorded(input);
    const control = assertPaid(input, 'iron-maiden', out);
    expect(out.events.filter(damage).filter(e => e.source === 'target')).toEqual([
      expect.objectContaining({ damageType: 'physical', amount: 100, simClockMs: 500 })]);
    expect.soft(out.events.filter(damage).filter(e => e.damageType === 'thorns')).toEqual([
      expect.objectContaining({ source: 'hero', target: 'target', amount: 100, simClockMs: 500, crit: false, dodged: false })]);
    expect.soft(out.result.enemyTeam[0]?.life).toBe(99900);
    expect(control.result.enemyTeam[0]?.life).toBe(100000);
    expect(input).toEqual(before);
  });
  it(`native paid Life Tap rank${String(rank)} heals the living attacking merc from actual HP removed`, () => {
    const input = fixture('life-tap', rank), before = structuredClone(input), out = runBattleRecorded(input);
    const control = assertPaid(input, 'life-tap', out);
    expect(out.events.filter(damage).filter(e => e.source === 'ally')).toEqual([
      expect.objectContaining({ damageType: 'physical', amount: 100, simClockMs: 500, dodged: false })]);
    expect.soft(out.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'ally', amount: 25, simClockMs: 500 })]);
    expect.soft(out.result.playerTeam.find(u => u.id === 'ally')?.life).toBe(90025);
    expect(control.result.playerTeam.find(u => u.id === 'ally')?.life).toBe(90000);
    expect(input).toEqual(before);
  });
  it.each(['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns'] as const)(
    `native paid Lower Resist rank${String(rank)} changes actual %s damage before flat mitigation`, type => {
      const input = fixture('lower-resist', rank, type), before = structuredClone(input), out = runBattleRecorded(input);
      const control = assertPaid(input, 'lower-resist', out);
      expect.soft(out.events.filter(damage).filter(e => e.source === 'ally')).toEqual([
        expect.objectContaining({ damageType: type, amount: 70, simClockMs: 500, dodged: false })]);
      expect.soft(out.result.enemyTeam[0]?.life).toBe(99930);
      expect(control.events.filter(damage).filter(e => e.source === 'ally')).toEqual([
        expect.objectContaining({ damageType: type, amount: 40, simClockMs: 500, dodged: false })]);
      expect(out.result.enemyTeam[0]?.stats).toEqual(input.enemyTeam[0]?.stats);
      expect(input).toEqual(before);
    });
}
for (const { slug, unlock, costs } of cases) {
  it.each(['trash', 'boss', 'chapter-boss'] as const)(`${slug} affects every living %s hostile, excluding allies and dead bodies`, tier => {
    const input = fixture(slug, 1), target = input.enemyTeam[0];
    if (!target) throw new Error('Missing native recipients');
    const out = runBattleRecorded({ ...input, enemyTeam: [{ ...target, tier }, { ...target, id: 'second', tier },
      { ...target, id: 'dead', tier, life: 0 }] });
    expect(out.events.flatMap(e => e.kind === 'status' && e.statusId === slug ? [e.target] : [])).toEqual(['target', 'second']);
    for (const targetId of ['target', 'second']) {
      const applied = out.events.find(e => e.kind === 'status-state' && e.target === targetId && e.statuses.some(s => s.id === slug));
      expect(applied?.kind === 'status-state' ? applied.statuses.find(s => s.id === slug) : undefined)
        .toMatchObject({ sourceId: 'hero', stacks: 1, appliedAtMs: 400, expiresAtMs: 3400,
          damageCurse: { id: slug, percent: slug === 'iron-maiden' ? 100 : slug === 'life-tap' ? 25 : 30 } });
    }
    expect(out.events.filter(e => e.kind === 'mana' && e.target === 'hero' && e.reason === 'cast')).toHaveLength(1);
  });
  it(`${slug} obeys native ownership/level/transitive prerequisite/rank guards`, () => {
    const original = owner(slug, 1), id = 'skills-necromancer-' + slug;
    for (const patch of [{ class: 'barbarian' as const }, { level: unlock - 1 }, { skillLevels: {} },
      { skillLevels: { [id]: 1 } }, ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ skillLevels: { ...original.skillLevels, [id]: rank } }))])
      expect(playerToCombatUnit({ ...original, ...patch }).skillOrder).toEqual([]);
    expect(playerToCombatUnit(original).skillOrder).toEqual([id]);
  });
  for (const rank of [1, 20]) it(`${slug} rank${String(rank)} refuses insufficient MP and active cooldown without a payment`, () => {
    const input = fixture(slug, rank), canonical = 'necromancer.' + slug.replaceAll('-', '_');
    for (const patch of [{ mana: costs[rank === 20 ? 1 : 0] - 1 }, { cooldowns: { [canonical]: 100000 } }]) {
      const out = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(u => u.id === 'hero' ? { ...u, ...patch } : u) });
      expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
      expect(out.events.filter(e => e.kind === 'mana' && e.target === 'hero' && e.reason === 'cast')).toEqual([]);
      expect(out.events.some(e => e.kind === 'status' && e.statusId === slug)).toBe(false);
    }
  });
  it(`${slug} consumes no MP or cooldown without a living hostile`, () => {
    const input = fixture(slug, 1), out = runBattleRecorded({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 0 })) });
    expect(out.events.filter(e => e.kind === 'action' || e.kind === 'mana' || e.kind === 'status')).toEqual([]);
    expect(out.result.playerTeam[0]?.mana).toBe(costs[0]);
    expect(out.result.playerTeam[0]?.cooldowns).toEqual(input.playerTeam[0]?.cooldowns);
  });
}
