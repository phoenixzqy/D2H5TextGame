import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
import { applyEventToTeams } from './combatPlayback';
import skills from '@/data/skills/assassin.json';
import { getSkill, registerSkill } from '@/engine/skills/registry';

const hold = (at = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'synthetic-hold',
  stacks: 1,
  remaining: -1,
  appliedAtMs: at
});
function fixture(rank = 1, seed = 7) {
  const levels: Record<string, number> = {};
  const add = (id: string) => {
    const row = skills.find(skill => skill.id === id);
    if (!row) throw new Error('Missing actual Mind Blast prerequisite');
    levels[id] = id === 'skills-assassin-mind-blast' ? rank : 1;
    for (const prerequisite of row.prerequisites ?? []) add(prerequisite);
  };
  add('skills-assassin-mind-blast');
  const native = playerToCombatUnit({
    ...createMockPlayer('Synthetic Mind Blast', 'assassin'),
    id: 'hero',
    level: 30,
    skillLevels: levels,
    comboOrder: ['skills-assassin-mind-blast']
  });
  const hero: CombatUnit = {
    ...native,
    life: 2000,
    mana: 100,
    manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0,
    statuses: [hold(1701)],
    stats: {
      ...native.stats,
      lifeMax: 2000,
      manaMax: 100,
      attack: 100,
      attackSpeed: 100,
      defense: 0,
      magicResist: 0,
      physDodge: 0,
      magicDodge: 0,
      critChance: 0,
      critDamage: 2,
      resistances: { fire: 0, cold: 0, lightning: 0, physical: 0, arcane: 0, poison: 0 }
    }
  };
  return {
    seed,
    playerTeam: [hero],
    enemyTeam: Array.from(
      { length: 9 },
      (_, i): CombatUnit => ({
        ...hero,
        id: 'target-' + String(i),
        side: 'enemy',
        kind: 'monster',
        tier: 'trash',
        gridPosition: { row: Math.floor(i / 3), col: i % 3 },
        mana: 100,
        skillOrder: [],
        skillLevels: {},
        activeBuffIds: [],
        statuses: [hold()]
      })
    )
  } satisfies CombatSnapshot;
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input),
    out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  return out;
}
const expectedTargets = Array.from({ length: 9 }, (_, i) => 'target-' + String(i));
beforeEach(() => {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useFormationStore.getState().reset();
  resetRegistry();
  loadDefaultSkills();
});
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});

for (const rank of [1, 2, 20]) {
  it.each([7, 19, 41, 97])(
    `BUG210 rank${String(rank)} seed%i hits all enemies and conserves every target's HP`,
    (seed) => {
      const input = fixture(rank, seed),
        out = record(input);
      const hits = out.events.filter((e) => e.kind === 'damage').filter((e) => e.source === 'hero');
      expect(hits.map((e) => e.target)).toEqual(expectedTargets);
      expect(out.events.filter((e) => e.kind === 'action')).toEqual([
        expect.objectContaining({ actor: 'hero', skillId: 'assassin.mind_blast', simClockMs: 1700 })
      ]);
      expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([
        expect.objectContaining({ target: 'hero', mana: 70 })
      ]);
      for (const target of out.result.enemyTeam) {
        const direct = hits.filter((e) => e.target === target.id).reduce((n, e) => n + e.amount, 0);
        const periodic = out.events.reduce(
          (n, e) => n + (e.kind === 'dot' && e.target === target.id ? e.amount : 0),
          0
        );
        expect(periodic).toBe(0);
        expect(target.life).toBe(2000 - direct - periodic);
        if (!expectedTargets.includes(target.id)) expect(target.life).toBe(2000);
      }
      const landed = hits.filter(e => !e.dodged);
      expect(out.events.filter(e => e.kind === 'status').map(e => e.statusId))
        .toEqual(landed.flatMap(() => ['mana-burn', 'stun']));
      for (const target of out.result.enemyTeam) {
        const direct = hits.find(e => e.target === target.id)?.amount ?? 0;
        expect(target.mana).toBe(Math.max(0, 100 - Math.floor(direct * .2)));
        expect(target.statuses.some(status => status.id === 'mana-burn')).toBe(direct > 0);
      }
      let playback: { playerTeam: readonly CombatUnit[]; enemyTeam: readonly CombatUnit[] } = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam };
      for (const event of out.events) playback = applyEventToTeams(playback.playerTeam, playback.enemyTeam, event);
      const resources = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana }));
      expect(resources(playback.playerTeam)).toEqual(resources(out.result.playerTeam));
      expect(resources(playback.enemyTeam)).toEqual(resources(out.result.enemyTeam));
    }
  );
}


it.each(['trash', 'boss'] as const)('Stun really interrupts a %s action and expires at its canonical boundary', tier => {
  const input = fixture();
  input.enemyTeam = input.enemyTeam.slice(0, 1).map(u => ({ ...u, tier, statuses: [],
    stats: { ...u.stats, attackSpeed: 0 } }));
  const actual = record(input), skill = getSkill('assassin.mind_blast');
  if (!skill) throw new Error('Missing registered Mind Blast');
  registerSkill({ ...skill, effects: skill.effects.map(e => {
    if (e.kind !== 'damage') return e;
    const { applyStatus, applyStatuses, ...damage } = e;
    const statuses = (applyStatuses ?? (applyStatus ? [applyStatus] : [])).filter(s => s.id !== 'stun');
    return { ...damage, applyStatuses: [statuses[0] ?? { id: 'mana-burn' }] };
  }) });
  const control = record(input);
  const firstAction = (out: ReturnType<typeof record>) => out.events
    .find(e => e.kind === 'action' && e.actor === 'target-0')?.simClockMs;
  expect(firstAction(control)).toBe(2000);
  expect(firstAction(actual)).toBe(4000);
  const expiry = 1700 + (tier === 'boss' ? 500 : 1000);
  expect(actual.events.some(e => e.kind === 'status-state' && e.target === 'target-0' &&
    e.simClockMs === expiry && !e.statuses.some(s => s.id === 'stun'))).toBe(true);
});
it('keeps the ordinary paid cast on misses without applying Stun or draining mana', () => {
  const input = fixture(1, 2);
  input.enemyTeam = input.enemyTeam.slice(0, 1).map(u => ({ ...u, stats: { ...u.stats, magicDodge: 1 } }));
  const out = record(input);
  expect(out.events.filter(e => e.kind === 'status')).toEqual([]);
  expect(out.result.enemyTeam[0]?.mana).toBe(100);
  expect(out.result.playerTeam[0]?.mana).toBe(70);
});
it.each([23, 30])('preserves native learning eligibility at level%i', level => {
  const unit = playerToCombatUnit({ ...createMockPlayer('Invalid Mind Blast', 'assassin'), level,
    skillLevels: { 'skills-assassin-mind-blast': 1 }, comboOrder: ['skills-assassin-mind-blast'] });
  expect(unit.skillOrder).not.toContain('assassin.mind_blast');
});

it.each(['skills-assassin-mind-blast', 'assassin.mind_blast'])(
  'supports native authorized alias %s with one paid action', alias => {
    const input = fixture();
    input.playerTeam = input.playerTeam.map(u => ({ ...u, skillOrder: [alias] }));
    const out = record(input);
    expect(out.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: 'assassin.mind_blast' })]);
    expect(out.result.playerTeam[0]?.mana).toBe(70);
  });
it('refuses Mind Blast without enough mana while preserving basic attacks', () => {
  const input = fixture();
  input.playerTeam = input.playerTeam.map(u => ({ ...u, mana: 29 }));
  const out = record(input);
  expect(out.events.filter(e => e.kind === 'action')).toEqual([
    expect.objectContaining({ actor: 'hero', skillId: null })]);
  expect(out.events.filter(e => e.kind === 'status' || e.kind === 'mana')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(29);
});
it('rejects another class carrying Assassin learning and priority IDs', () => {
  const unit = playerToCombatUnit({ ...createMockPlayer('Wrong class', 'sorceress'), level: 30,
    skillLevels: { 'assassin.psychic_hammer': 1, 'assassin.cloak_of_shadows': 1, 'assassin.mind_blast': 1 },
    comboOrder: ['assassin.mind_blast'] });
  expect(unit.skillOrder).not.toContain('assassin.mind_blast');
});
it('actual native Solar Creeper recovery clears the owner marker after paid preparation', () => {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic recovery', 'druid'), id: 'hero', level: 30,
    skillLevels: { 'druid.poison_creeper': 1, 'druid.carrion_vine': 1, 'druid.solar_creeper': 1 },
    comboOrder: ['skills-druid-solar-creeper'] });
  const input = fixture();
  const source = input.playerTeam[0];
  if (!source) throw new Error('Missing synthetic hero');
  const hero: CombatUnit = { ...source, ...native, life: 2000, mana: 100,
    stats: { ...source.stats, manaMax: 1000 }, manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0, statuses: [hold(),
      { id: 'mana-burn', sourceId: 'target', stacks: 1, remaining: -1 }] };
  input.playerTeam = [hero];
  input.seed = 42;
  input.enemyTeam = input.enemyTeam.slice(0, 2).map((u, i) => ({ ...u, life: i === 0 ? 1 : 2000,
    statuses: i === 0 ? [hold(), { id: 'burn', sourceId: 'hero', stacks: 1, remaining: 1,
      expiresAtMs: 1000, dotPerStack: 1 }] : [hold()] }));
  const out = record(input), recovery = out.events.find(e => e.kind === 'mana' && e.reason === 'solar-creeper');
  expect(recovery).toMatchObject({ target: 'hero', mana: 132 });
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' &&
    e.simClockMs === recovery?.simClockMs && !e.statuses.some(s => s.id === 'mana-burn'))).toBe(true);
});
