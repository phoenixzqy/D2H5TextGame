import { afterEach, beforeEach, expect, it } from 'vitest';
import { runBattle, runBattleRecorded } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from '@/engine/skills/dataCatalog';
const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs });
function unit(id: string, side: 'player' | 'enemy'): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash', life: 1000, mana: 100,
    stats: { life: 1000, lifeMax: 1000, mana: 100, manaMax: 100, attack: 1, defense: 0, magicResist: 0,
      attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [hold()], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function fight(alwaysHits: boolean, patch: { blind?: boolean; dodge?: number; defense?: number; resistance?: number; crit?: number; shield?: number } = {}) {
  registerSkill({ id: 'fixture.guaranteed', archetype: 'fixture', minLevel: 1, target: 'single-enemy',
    manaCost: 20, cooldown: 2, effects: [{ kind: 'damage', damageType: 'physical', base: [100, 100],
      ...(alwaysHits ? { alwaysHits: true as const } : {}) }] });
  const base = unit('hero', 'player'), enemy = unit('enemy', 'enemy');
  const input = { seed: 41, playerTeam: [{ ...base, stats: { ...base.stats, critChance: patch.crit ?? 0 },
    skillOrder: ['fixture.guaranteed'], statuses: [hold(1701), ...(patch.blind
      ? [{ id: 'blind', sourceId: 'raven', stacks: 1, remaining: 20, appliedAtMs: 0, expiresAtMs: 20000 }] : [])] }],
    enemyTeam: [{ ...enemy, stats: { ...enemy.stats, physDodge: patch.dodge ?? 0, defense: patch.defense ?? 0,
      resistances: { ...enemy.stats.resistances, physical: patch.resistance ?? 0 } },
      statuses: [...enemy.statuses, ...(patch.shield ? [{ id: 'bone-armor', sourceId: 'enemy', stacks: 1,
        remaining: -1, boneArmor: { rank: 20, remaining: patch.shield } }] : [])] }] };
  // Bone Armor is a player-hero pool: reverse the hostile sides for its witness.
  const snapshot = patch.shield ? { ...input,
    playerTeam: input.enemyTeam.map(u => ({ ...u, side: 'player' as const, kind: 'hero' as const })),
    enemyTeam: input.playerTeam.map(u => ({ ...u, side: 'enemy' as const, kind: 'monster' as const })) } : input;
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before); expect(runBattleRecorded(snapshot)).toEqual(out); expect(runBattle(snapshot)).toEqual(out.result);
  return out;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
it('preserves ordinary natural misses and paid mana', () => {
  const out = fight(false); expect(out.result.enemyTeam[0]?.life).toBe(1000);
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: 0, dodged: true })]);
  expect(out.result.playerTeam[0]?.mana).toBe(80);
});
it.each([{ dodge: 0 }, { dodge: 1 }, { blind: true, dodge: 1 }])('explicit always-hit bypasses only hit/dodge under %j', patch => {
  const out = fight(true, patch); expect(out.result.enemyTeam[0]?.life).toBe(900);
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: 100, dodged: false, crit: false })]);
  expect(out.result.playerTeam[0]?.mana).toBe(80);
});
it('always-hit retains Physical resistance and ordinary Defense', () => {
  const out = fight(true, { dodge: 1, defense: 7, resistance: 50 });
  expect(out.result.enemyTeam[0]?.life).toBe(957);
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: 43, dodged: false })]);
  expect(out.result.enemyTeam[0]?.stats).toMatchObject({ defense: 7, physDodge: 1, resistances: { physical: 50 } });
});
it('always-hit retains the ordinary critical decision and multiplier', () => {
  const out = fight(true, { dodge: 1, defense: 7, resistance: 50, crit: 1 });
  expect(out.result.enemyTeam[0]?.life).toBe(907);
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: 93, crit: true })]);
});
it('always-hit still spends personal absorption after mitigation', () => {
  const out = fight(true, { dodge: 1, defense: 7, resistance: 50, shield: 40 });
  expect(out.result.playerTeam[0]?.life).toBe(997);
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: 3, absorbed: 40, dodged: false })]);
});
it('projects the explicit flag without mutating JSON or inferring it for ordinary skills', () => {
  const row = PLAYABLE_CLASS_SKILL_DATA.amazon.find(s => s.id === 'skills-amazon-guided-arrow');
  if (!row) throw new Error('Missing Guided Arrow');
  const source = { ...row, alwaysHits: true as const }, before = structuredClone(source);
  expect(registeredSkillFromJson(source).effects).toEqual([expect.objectContaining({ kind: 'damage', alwaysHits: true })]);
  expect(source).toEqual(before);
  expect(getSkill('amazon.magic_arrow')?.effects[0]).not.toHaveProperty('alwaysHits');
});
