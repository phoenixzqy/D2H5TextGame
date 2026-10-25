import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit, ActiveStatus } from '@/engine/combat/types';
import { playerToCombatUnit } from './combatHelpers';
import { applyEventToTeams, type PlaybackStepResult } from './combatPlayback';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
const hold = (at = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'synthetic-hold',
  stacks: 1,
  remaining: -1,
  appliedAtMs: at
});
function reset() {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useFormationStore.getState().reset();
}
beforeEach(reset);
afterEach(reset);
function fixture(slug: string, rank: number, mr = 0) {
  const id = 'paladin.' + slug.replaceAll('-', '_');
  const native = playerToCombatUnit({
    ...createMockPlayer('Synthetic native Paladin attack', 'paladin'),
    id: 'hero',
    level: 30,
    comboOrder: ['skills-paladin-' + slug],
    skillLevels: { 'paladin.holy_bolt': 1, 'paladin.sacrifice': 1, 'paladin.zeal': 1, [id]: rank }
  });
  const hero: CombatUnit = {
    ...native,
    life: 5000,
    mana: 0,
    manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0,
    manaRegenCarry: 0,
    manaRegenCompensation: 0,
    manaRegenExactCarry: '0',
    statuses: [hold(1701)],
    stats: {
      ...native.stats,
      life: 10000,
      lifeMax: 10000,
      mana: 100,
      manaMax: 100,
      attack: 1,
      attackSpeed: 100,
      critChance: 0
    }
  };
  const enemy: CombatUnit = {
    ...hero,
    id: 'target',
    side: 'enemy',
    kind: 'monster',
    life: 100000,
    statuses: [hold()],
    skillOrder: [],
    skillLevels: {},
    increasedDamagePct: {},
    stats: {
      ...hero.stats,
      life: 100000,
      lifeMax: 100000,
      defense: 0,
      magicResist: mr,
      physDodge: 0,
      magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 }
    }
  };
  return { id, native, hero, enemy, input: { seed: 7, playerTeam: [hero], enemyTeam: [enemy] } };
}
describe('BUG197 native Sacrifice and life playback', () => {
  it.each([1, 2, 20])('rank%i publishes actual life loss with matching playback', (rank) => {
    const f = fixture('sacrifice', rank),
      before = structuredClone(f.input),
      out = runBattleRecorded(f.input),
      cost = rank === 20 ? 9 : 3;
    expect(f.native.skillOrder).toEqual(['skills-paladin-sacrifice']);
    expect(out.events.filter((e) => e.kind === 'action')).toHaveLength(1);
    expect(out.result.playerTeam[0]).toMatchObject({ life: 5000 - cost, mana: 0 });
    expect(out.events.filter((e) => e.kind === 'damage' && e.target === 'hero')).toEqual([
      expect.objectContaining({ source: 'hero', amount: cost })
    ]);
    let teams: PlaybackStepResult = {
      playerTeam: f.input.playerTeam,
      enemyTeam: f.input.enemyTeam
    };
    for (const event of out.events)
      teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event);
    expect(teams.playerTeam.map((u) => [u.life, u.mana])).toEqual(
      out.result.playerTeam.map((u) => [u.life, u.mana])
    );
    expect(teams.enemyTeam.map((u) => [u.life, u.mana])).toEqual(
      out.result.enemyTeam.map((u) => [u.life, u.mana])
    );
    expect(runBattleRecorded(f.input)).toEqual(out);
    expect(f.input).toEqual(before);
  });
  it.each(['class', 'selection', 'unlearned', 'rank-over-cap'])(
    'rejects invalid %s authority',
    (invalid) => {
      const base = {
        ...createMockPlayer('Synthetic invalid Sacrifice', 'paladin'),
        level: 30,
        comboOrder: ['skills-paladin-sacrifice'],
        skillLevels: { 'paladin.sacrifice': 1 }
      };
      const player =
        invalid === 'class'
          ? { ...base, class: 'druid' as const }
          : invalid === 'selection'
            ? { ...base, comboOrder: [] }
            : { ...base, skillLevels: { 'paladin.sacrifice': invalid === 'unlearned' ? 0 : 21 } };
      const unit = playerToCombatUnit(player);
      expect(unit.skillOrder).not.toContain('skills-paladin-sacrifice');
      const f = fixture('sacrifice', 1),
        out = runBattleRecorded({
          ...f.input,
          playerTeam: [
            { ...f.hero, skillOrder: unit.skillOrder, skillLevels: unit.skillLevels ?? {} }
          ]
        });
      expect(out.events.some((e) => e.kind === 'damage' && e.source === e.target)).toBe(false);
      expect(out.result.playerTeam[0]?.life).toBe(5000);
    }
  );
  it.each(['skills-paladin-sacrifice', 'paladin.sacrifice'])(
    'preserves valid selected alias %s',
    (alias) => {
      const u = playerToCombatUnit({
        ...createMockPlayer('Synthetic alias', 'paladin'),
        comboOrder: [alias],
        skillLevels: { 'paladin.sacrifice': 1 }
      });
      expect(u.skillOrder).toEqual([alias]);
    }
  );
});
