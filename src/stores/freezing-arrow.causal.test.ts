import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit, MonsterTier } from '@/engine/combat/types';
import { getSkill, loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const ID = 'skills-amazon-freezing-arrow', CANONICAL = 'amazon.freezing_arrow';
const hold = (appliedAtMs = 0, expiresAtMs?: number): ActiveStatus => ({ id: 'stun',
  sourceId: 'synthetic-hold', stacks: 1, remaining: -1, appliedAtMs,
  ...(expiresAtMs === undefined ? {} : { expiresAtMs }) });
const levels = { 'amazon.cold_arrow': 1, 'amazon.ice_arrow': 1, [CANONICAL]: 1 };
function fixture(rank = 1, seed = 5, tier: MonsterTier = 'trash', heroSpeed = 150, targetSpeed = 100): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic Freezing Arrow', 'amazon'),
    id: 'hero', level: 30, comboOrder: [ID], skillLevels: { ...levels, [CANONICAL]: rank } });
  const at = Math.max(400, Math.min(2000, 2500 - heroSpeed * 8));
  const hero: CombatUnit = { ...native, life: 2000, mana: 20,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 2000, manaMax: 100, attackSpeed: heroSpeed,
      attack: 100, defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0, critChance: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [hold(at + 1)] };
  const target: CombatUnit = { id: 'target', name: 'Synthetic target', side: 'enemy', kind: 'monster',
    tier, level: 30, life: 2000, mana: 0, stats: { ...hero.stats, attackSpeed: targetSpeed },
    cooldowns: {}, activeBuffIds: [], skillOrder: [], statuses: [hold(1801)], enraged: false };
  return { seed, playerTeam: [hero], enemyTeam: [target] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), output = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(output);
  expect(runBattle(input)).toEqual(output.result); return output;
}
beforeEach(() => { useInventoryStore.getState().reset(); useMapStore.getState().reset();
  useFormationStore.getState().reset(); resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

for (const tier of ['trash', 'boss', 'chapter-boss'] as const) {
  it.each([1, 20])(`BUG201 native rank%i Freeze suppresses actual ${tier} attack/HP loss`, rank => {
    const out = record(fixture(rank, 5, tier));
    expect(out.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: CANONICAL, simClockMs: 1300 })]);
    expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toEqual([
      expect.objectContaining({ target: 'target', amount: rank === 1 ? 66 : 161, simClockMs: 1300 })]);
    expect(out.events.filter(e => e.kind === 'status').map(e => e.statusId)).toEqual(['chill', 'freeze']);
    expect(out.events.find(e => e.kind === 'stunned' && e.target === 'target')?.simClockMs).toBeCloseTo(30100 / 17, 8);
    expect(out.result.playerTeam[0]?.life).toBe(2000); expect(out.result.playerTeam[0]?.mana).toBe(0);
  });
}
it.each([1, 20])('native rank%i failed proc preserves Chill and real target damage', rank => {
  const out = record(fixture(rank, 1));
  expect(out.events.filter(e => e.kind === 'status').map(e => e.statusId)).toEqual(['chill']);
  expect(out.events.filter(e => e.kind === 'damage').map(e => [e.source, e.amount])).toEqual([
    ['hero', rank === 1 ? 50 : 145], ['target', 100]]);
  expect(out.result.playerTeam[0]?.life).toBe(1900); expect(out.result.playerTeam[0]?.mana).toBe(0);
});
it.each([1, 20])('native rank%i miss pays once without either status', rank => {
  const input = fixture(rank, 4), out = record({ ...input,
    enemyTeam: input.enemyTeam.map(u => ({ ...u, statuses: [hold()] })) });
  expect(out.events.filter(e => e.kind === 'status')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ source: 'hero', amount: 0, dodged: true })]);
  expect(out.result.playerTeam[0]?.mana).toBe(0); expect(out.result.enemyTeam[0]?.life).toBe(2000);
});
for (const tier of ['trash', 'boss', 'chapter-boss'] as const) {
  it.each([1, 20])(`native rank%i ${tier} acts at exact exclusive Freeze expiry`, rank => {
    const ordinary = tier === 'trash', castAt = ordinary ? 1000 : 1500;
    const input = fixture(rank, 5, tier, ordinary ? 250 : 125, 62);
    const out = record({ ...input,
      playerTeam: input.playerTeam.map(u => ({ ...u, statuses: ordinary ? [hold(0, 1000), hold(1001)] : [hold(1501)] })),
      enemyTeam: input.enemyTeam.map(u => ({ ...u, statuses: [hold(2001)] })) });
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status', statusId: 'freeze', simClockMs: castAt }));
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'target', simClockMs: 2000 }));
    expect(out.events.some(e => e.kind === 'stunned' && e.target === 'target' && e.simClockMs === 2000)).toBe(false);
    const views = out.events.filter(e => e.kind === 'status-state' && e.target === 'target');
    const expiryView = views.find(e => e.simClockMs === 2000);
    if (!expiryView || expiryView.kind !== 'status-state') throw new Error('Missing exact expiry observation');
    expect(expiryView.statuses).toContainEqual(expect.objectContaining({
      id: 'chill', expiresAtMs: castAt + 2000 }));
    expect(out.result.playerTeam[0]?.life).toBe(1900);
  });
}
it('hits the actual3x3 box once per target, pays once and rolls Freeze independently', () => {
  const input = fixture(), target = input.enemyTeam[0]; if (!target) throw new Error('Missing fixture');
  const team = Array.from({ length: 10 }, (_, i): CombatUnit => ({ ...target, id: `target-${String(i)}`,
    gridPosition: i < 9 ? { row: Math.floor(i / 3), col: i % 3 } : { row: 5, col: 1 }, statuses: [hold()] }));
  const out = record({ ...input, enemyTeam: team });
  const hits = out.events.filter(e => e.kind === 'damage' && e.source === 'hero');
  expect(hits.map(e => e.kind === 'damage' ? e.target : '')).toEqual(team.slice(0, 9).map(u => u.id));
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  const frozen = out.events.filter(e => e.kind === 'status' && e.statusId === 'freeze');
  expect(frozen).toContainEqual(expect.objectContaining({ target: 'target-0' }));
  expect(frozen.length).toBeLessThan(9);
  expect(out.result.enemyTeam.find(u => u.id === 'target-9')?.life).toBe(2000);
});
it('preserves ordered statuses before one lethal death and excludes a dead target', () => {
  const input = fixture(), target = input.enemyTeam[0]; if (!target) throw new Error('Missing fixture');
  const out = record({ ...input, enemyTeam: [{ ...target, id: 'dead', life: 0 }, { ...target, life: 1 }] });
  expect(out.events.filter(e => e.kind === 'damage' || e.kind === 'status' || e.kind === 'death').map(e =>
    e.kind === 'status' ? [e.kind, e.target, e.statusId] : [e.kind, e.target])).toEqual([
    ['damage', 'target'], ['status', 'target', 'chill'], ['status', 'target', 'freeze'], ['death', 'target']]);
  expect(out.result.winner).toBe('player');
});
it.each([1, 20])('rank%i pays again only at exact2second cooldown expiry', rank => {
  const input = fixture(rank, 5, 'trash', 250), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, mana: 40, statuses: [hold(501, 2500), hold(2501)] })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, statuses: [hold()] })) });
  expect(out.events.filter(e => e.kind === 'action').map(e => [e.simClockMs, e.skillId]))
    .toEqual([[500, CANONICAL], [2500, CANONICAL]]);
  expect(out.events.filter(e => e.kind === 'mana').map(e => [e.simClockMs, e.mana])).toEqual([[500, 20], [2500, 0]]);
});
it.each(['class', 'unlock', 'rank', 'prerequisite'] as const)('native %s refusal cannot buy Freeze', failure => {
  const p = { ...createMockPlayer('Synthetic refusal', failure === 'class' ? 'sorceress' : 'amazon'),
    level: failure === 'unlock' ? 29 : 30, comboOrder: [ID],
    skillLevels: { ...levels, [CANONICAL]: failure === 'rank' ? 0 : 1 } };
  if (failure === 'prerequisite') Reflect.deleteProperty(p.skillLevels, 'amazon.cold_arrow');
  const native = playerToCombatUnit(p); expect(native.skillOrder).not.toContain(ID);
  const input = fixture(), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, skillOrder: native.skillOrder })) });
  expect(out.events.some(e => e.kind === 'status' && e.statusId === 'freeze')).toBe(false);
  expect(out.result.playerTeam[0]?.mana).toBe(20);
});
it.each(['mana', 'cooldown'] as const)('native %s refusal leaves no paid statuses', failure => {
  const input = fixture(), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, mana: failure === 'mana' ? 19 : 20,
      cooldowns: failure === 'cooldown' ? { [CANONICAL]: 10000 } : {} })) });
  expect(out.events.some(e => e.kind === 'action' && e.skillId === CANONICAL)).toBe(false);
  expect(out.events.filter(e => e.kind === 'status')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(failure === 'mana' ? 19 : 20);
});
it('keeps native exact aliases by MAX without two paid casts', () => {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic aliases', 'amazon'), level: 30,
    skillLevels: { ...levels, [CANONICAL]: 1, [ID]: 20 }, comboOrder: [ID] });
  const nativeLevels = native.skillLevels;
  if (!nativeLevels) throw new Error('Missing native skill levels');
  const input = fixture(20), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, skillLevels: nativeLevels })) });
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero'))
    .toEqual([expect.objectContaining({ amount: 161 })]);
  expect(out.events.filter(e => e.kind === 'mana')).toHaveLength(1);
  expect(getSkill(CANONICAL)?.effects).toEqual([expect.objectContaining({
    applyStatuses: [{ id: 'chill' }, { id: 'freeze', chance: .15 }] })]);
});
