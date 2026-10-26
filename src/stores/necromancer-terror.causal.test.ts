import { beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/necromancer.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit, MonsterTier } from '@/engine/combat/types';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';

const id = 'skills-necromancer-terror', canonical = 'necromancer.terror';
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
function owner(rank = 1) {
  const skillLevels: Record<string, number> = {};
  function learn(key: string) {
    const row = rows.find(r => r.id === key);
    if (!row) throw new Error('Missing native Terror prerequisite');
    for (const prerequisite of row.prerequisites ?? []) learn(prerequisite);
    skillLevels[key] = 1;
  }
  learn(id); skillLevels[id] = rank;
  return { ...createMockPlayer('Synthetic native Terror', 'necromancer'), level: 30,
    skillLevels, comboOrder: [id] };
}
/** Explicit unearned pools/attack timing; native eligibility, payment and resolver remain real. */
function fixture(rank: number, tier: MonsterTier = 'trash'): CombatSnapshot {
  const native = playerToCombatUnit(owner(rank));
  const hero: CombatUnit = { ...native, id: 'hero', life: 100000, mana: 7,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, life: 100000, lifeMax: 100000, mana: 100, manaMax: 100,
      attack: 0, attackSpeed: 263, defense: 0, magicResist: 0, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'synthetic-hold', stacks: 1, remaining: -1, appliedAtMs: 401 }] };
  const target: CombatUnit = { ...hero, id: 'target', side: 'enemy', kind: 'monster', tier,
    mana: 0, skillOrder: [], skillLevels: {}, activeBuffIds: [],
    stats: { ...hero.stats, attack: 100, attackSpeed: 250 },
    statuses: [{ id: 'stun', sourceId: 'synthetic-hold', stacks: 1, remaining: -1, appliedAtMs: 4501 }] };
  return { seed: 1, playerTeam: [hero], enemyTeam: [target] };
}
function matchedInert(input: CombatSnapshot) {
  const original = getSkill(canonical);
  if (!original) throw new Error('Missing native Terror');
  registerSkill({ ...original, effects: [{ kind: 'debuff', statusId: 'fixture.inert-terror' }] });
  try { return runBattleRecorded(input); }
  finally { registerSkill(original); }
}
for (const rank of [1, 20]) {
  for (const tier of ['trash', 'boss', 'chapter-boss'] as const) {
    it(`native paid Terror rank${String(rank)} interrupts actual ${tier} actions then resumes the original schedule`, () => {
      const input = fixture(rank, tier), before = structuredClone(input);
      const out = runBattleRecorded(input), control = matchedInert(input);
      const castEvents = (events: typeof out.events) => events.filter(e =>
        (e.kind === 'action' && e.actor === 'hero') || (e.kind === 'mana' && e.target === 'hero'));
      expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero'))
        .toEqual([expect.objectContaining({ skillId: canonical, simClockMs: 400 })]);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
        .toEqual([expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 400 })]);
      expect(castEvents(out.events)).toEqual(castEvents(control.events));
      const times = (events: typeof out.events) => events.flatMap(e =>
        e.kind === 'action' && e.actor === 'target' ? [e.simClockMs] : []);
      expect(times(control.events)).toEqual([500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500]);
      expect(control.result.playerTeam[0]?.life).toBe(99300);
      expect.soft(times(out.events)).toEqual(tier === 'trash'
        ? [1500, 2000, 2500, 3000, 3500, 4000, 4500]
        : [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500]);
      expect.soft(out.result.playerTeam[0]?.life).toBe(tier === 'trash' ? 99500 : 99400);
      expect.soft(out.events.filter(e => e.kind === 'stunned' && e.target === 'target' && e.simClockMs < 4501)
        .map(e => e.simClockMs)).toEqual(tier === 'trash' ? [500, 1000] : [500]);
      expect(out.result.enemyTeam[0]?.stats).toEqual(input.enemyTeam[0]?.stats);
      expect(input).toEqual(before);
      expect(runBattle(input)).toEqual(out.result); expect(runBattleRecorded(input)).toEqual(out);
    });
  }
  it(`native rank${String(rank)} Terror refuses insufficient MP and active cooldown without payment`, () => {
    const input = fixture(rank);
    for (const patch of [{ mana: 6 }, { cooldowns: { [canonical]: 100000 } }]) {
      const out = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, ...patch })) });
      expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
      expect(out.events.some(e => e.kind === 'status' && e.statusId === 'terror')).toBe(false);
    }
  });
}
it('native Terror obeys owner, level, transitive prerequisite and integral rank authority', () => {
  const original = owner();
  for (const patch of [{ class: 'barbarian' as const }, { level: 11 }, { skillLevels: {} },
    { skillLevels: { [id]: 1 } },
    ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ skillLevels: { ...original.skillLevels, [id]: rank } }))])
    expect(playerToCombatUnit({ ...original, ...patch }).skillOrder).toEqual([]);
  expect(playerToCombatUnit(original).skillOrder).toEqual([id]);
});
it('Terror consumes no MP or cooldown without a living hostile', () => {
  const input = fixture(1), out = runBattleRecorded({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 0 })) });
  expect(out.events.filter(e => e.kind === 'action' || e.kind === 'mana' || e.kind === 'status')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(7);
  expect(out.result.playerTeam[0]?.cooldowns).toEqual(input.playerTeam[0]?.cooldowns);
});
