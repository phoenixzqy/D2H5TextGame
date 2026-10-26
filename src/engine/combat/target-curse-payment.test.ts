import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '../../features/character/createMockPlayer';
import { playerToCombatUnit } from '../../stores/combatHelpers';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from '../skills/dataCatalog';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
function fixture(id: 'confuse' | 'attract', rank: number): CombatSnapshot {
  const skillId = 'skills-necromancer-' + id;
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic target curse', 'necromancer'),
    level: 30, skillLevels: { 'skills-necromancer-dim-vision': 1, 'skills-necromancer-confuse': 1, [skillId]: rank },
    comboOrder: [skillId] });
  const hero: CombatUnit = { ...native, id: 'hero', life: 100000, mana: id === 'attract' ? 17 : rank === 20 ? 8 : 13,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    statuses: [{ id: 'stun', sourceId: 'hold', stacks: 1, remaining: -1, appliedAtMs: 401 }],
    stats: { ...native.stats, life: 100000, lifeMax: 100000, mana: 100, manaMax: 100,
      attack: 0, attackSpeed: 263, defense: 0, magicResist: 0, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const enemy = (id: string): CombatUnit => ({ ...hero, id, side: 'enemy', kind: 'monster', tier: 'trash', mana: 0,
    skillOrder: [], skillLevels: {}, activeBuffIds: [],
    statuses: [{ id: 'stun', sourceId: 'hold', stacks: 1, remaining: -1 }],
    stats: { ...hero.stats, attackSpeed: 250, attack: 100 } });
  return { seed: 1, playerTeam: [hero], enemyTeam: [enemy('monster-a'), enemy('monster-b')] };
}
for (const id of ['confuse', 'attract'] as const) {
  it(id + ' grants a finite adapter capability only from the complete canonical JSON definition', () => {
    const typed = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(row => row.id === 'skills-necromancer-' + id);
    if (!typed) throw new Error('Missing authored target curse');
    expect(registeredSkillFromJson(typed).effects)
      .toEqual([{ kind: 'debuff', statusId: id, targetCurse: id, durationMs: 3000 }]);
    for (const statusEffect of [{}, { durationMs: 0 }, { durationMs: Infinity }, { durationMs: NaN },
      { durationMs: 3000, chance: .5 }])
      expect(registeredSkillFromJson({ ...typed, statusEffect }).effects)
        .toEqual([{ kind: 'debuff', statusId: id }]);
    expect(registeredSkillFromJson({ ...typed, appliesStatus: ['blind'] }).effects)
      .toEqual([{ kind: 'debuff', statusId: 'blind' }]);
  });
  it.each([1, 20])(id + ' rank%i captures paid own-identity status at the actual native cast', rank => {
    const input = fixture(id, rank), before = structuredClone(input), out = runBattleRecorded(input);
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero')).toEqual([
      expect.objectContaining({ skillId: 'necromancer.' + id, simClockMs: 400 })]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 400 })]);
    const packets = out.events.flatMap(e => e.kind === 'status-state' && e.simClockMs === 400
      ? e.statuses.filter(s => s.id === id) : []);
    expect(packets).toHaveLength(id === 'confuse' ? 2 : 1);
    for (const packet of packets) expect(packet).toEqual({ id, targetCurse: id, sourceId: 'hero',
      stacks: 1, remaining: 3, appliedAtMs: 400, expiresAtMs: 3400 });
    expect(input).toEqual(before); expect(runBattle(input)).toEqual(out.result);
    expect(runBattleRecorded(input)).toEqual(out);
  });
  it(id + ' cannot capture a paid packet with no mana or no learned ownership', () => {
    const input = fixture(id, 1);
    for (const unavailable of [fixture(id, 0), { ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero, mana: 0 })) }]) {
      const out = runBattleRecorded(unavailable);
      expect(out.events.some(e => e.kind === 'action' && e.skillId === 'necromancer.' + id)).toBe(false);
      expect(out.events.some(e => e.kind === 'status' && e.statusId === id)).toBe(false);
      expect(out.events.some(e => e.kind === 'status-state' && e.statuses.some(s => s.targetCurse !== undefined))).toBe(false);
    }
  });
}
