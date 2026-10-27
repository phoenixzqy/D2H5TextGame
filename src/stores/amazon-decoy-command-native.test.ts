/** Constructed native party/carry probe; never earned single-protagonist progression. */
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useFormationStore } from '@/stores/formationStore';
const DECOY = 'amazon.decoy',
  COMMAND = 'barbarian.battle_command';
const FINISH = 'fixture.decoy-command-finish';
const HOLD = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function reset() {
  for (const store of [useInventoryStore, useMapStore, useFormationStore]) store.getState().reset();
  resetRegistry();
  loadDefaultSkills();
}
beforeEach(() => {
  reset();
  registerSkill({
    id: FINISH,
    archetype: 'fixture',
    target: 'all-enemies',
    minLevel: 1,
    cooldown: 60,
    manaCost: 0,
    effects: [
      { kind: 'damage', damageType: 'physical', alwaysHits: true, base: [2000000000, 2000000000] }
    ]
  });
});
afterEach(reset);
it.each([1, 20])(
  'captures actual paid Command rank+1 through Decoy expiry (learned rank%i)',
  (rank) => {
    const player = {
      ...createMockPlayer('Synthetic native Decoy carry', 'amazon'),
      id: 'native-decoy',
      level: 30,
      comboOrder: [DECOY],
      skillLevels: { 'amazon.inner_sight': 1, 'amazon.slow_missiles': 1, [DECOY]: rank }
    };
    const hero = playerToCombatUnit(player);
    expect(hero.decoyRank).toBe(rank);
    const commander = playerToCombatUnit({
      ...createMockPlayer('Synthetic paid Commander', 'barbarian'),
      id: 'native-commander',
      level: 30,
      comboOrder: [COMMAND],
      skillLevels: {
        'barbarian.howl': 1,
        'barbarian.shout': 1,
        'barbarian.battle_orders': 1,
        [COMMAND]: 1
      }
    });
    const target: CombatUnit = {
      ...hero,
      id: 'target',
      side: 'enemy',
      kind: 'monster',
      life: 1000000,
      mana: 0,
      stats: { ...hero.stats, lifeMax: 1000000, attack: 0 },
      statuses: [HOLD],
      skillOrder: [],
      skillLevels: {}
    };
    const first = runBattleRecorded({
      seed: 7,
      playerTeam: [
        {
          ...commander,
          mana: 11,
          manaRegenPerSecond: 0,
          manaRegenBaselinePerSecond: 0,
          stats: { ...commander.stats, attackSpeed: 100 },
          skillOrder: [COMMAND, FINISH]
        },
        { ...hero, skillOrder: [], statuses: [HOLD] }
      ],
      enemyTeam: [target]
    });
    expect(first.result.winner).toBe('player');
    expect(first.events.filter((e) => e.kind === 'action' && e.skillId === COMMAND)).toHaveLength(
      1
    );
    expect(
      first.events.filter(
        (e) => e.kind === 'mana' && e.reason === 'cast' && e.target === commander.id
      )
    ).toEqual([expect.objectContaining({ mana: 0, simClockMs: 1700 })]);
    const carry = first.battleCommandCarry;
    if (!carry) throw new Error('Missing native paid carry');
    const snapshot = {
      seed: 19,
      playerTeam: [
        {
          ...hero,
          mana: 100,
          manaRegenPerSecond: 0,
          manaRegenBaselinePerSecond: 0,
          statuses: [HOLD]
        }
      ],
      enemyTeam: [target]
    };
    const before = structuredClone(snapshot),
      out = runBattleRecorded(snapshot, carry);
    expect(snapshot).toEqual(before);
    expect(runBattleRecorded(snapshot, carry)).toEqual(out);
    const spawns = out.events.filter((e) => e.kind === 'summon' && e.summonId === 'decoy');
    expect(spawns).toHaveLength(1);
    const spawn = spawns[0];
    if (spawn?.kind !== 'summon') throw new Error('Missing boosted paid Decoy');
    expect(spawn.simClockMs).toBe(0);
    expect(spawn.unit.stats).toMatchObject({ lifeMax: 200 + 20 * rank, attack: 0, defense: 20 });
    expect(out.events.filter((e) => e.kind === 'death' && e.target === spawn.unit.id)).toEqual([
      expect.objectContaining({ simClockMs: 8000 + 500 * rank })
    ]);
    expect(out.events.filter((e) => e.kind === 'action' && e.actor === spawn.unit.id)).toEqual([]);
    expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({
        target: hero.id,
        mana: 100 - Math.round(15 - 0.1 * rank),
        simClockMs: 0
      })
    ]);
    for (const permit of [undefined, structuredClone(carry)]) {
      const control = runBattleRecorded(snapshot, permit);
      const spawns = control.events.filter((e) => e.kind === 'summon' && e.summonId === 'decoy');
      expect(spawns).toHaveLength(1);
      const spawn = spawns[0];
      if (spawn?.kind !== 'summon') throw new Error('Missing unboosted control');
      expect(spawn.unit.stats.lifeMax).toBe(200 + 20 * (rank - 1));
    }
    const unlearned = playerToCombatUnit({
      ...player,
      skillLevels: { 'amazon.inner_sight': 1, 'amazon.slow_missiles': 1 }
    });
    expect(
      runBattleRecorded(
        { ...snapshot, playerTeam: [{ ...unlearned, mana: 100, statuses: [HOLD] }] },
        carry
      ).events.filter((e) => e.kind === 'summon' && e.summonId === 'decoy')
    ).toEqual([]);
  }
);
