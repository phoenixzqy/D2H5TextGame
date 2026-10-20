import { afterEach, describe, expect, it } from 'vitest';
import { deriveStats } from '../progression/stats';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import type { DamageType } from '../types/attributes';
import { runBattle, runBattleRecorded } from './combat';
import type { CombatUnit } from './types';
import type { CombatSnapshot } from './combat';

const base = deriveStats({ strength: 10, dexterity: 0, vitality: 10, energy: 10 }, 1);
const resistances = { physical: 25, fire: 25, cold: 25, lightning: 25, arcane: 25, poison: 25 };
function snapshot(type: DamageType, armor: number, magicResist: number, incoming = false): CombatSnapshot {
  const skillId = `mitigation-${type}`;
  registerSkill({ id: skillId, archetype: 'sorceress', target: 'single-enemy',
    cooldown: 1, manaCost: 0, minLevel: 1,
    effects: [{ kind: 'damage', damageType: type, base: [100, 100] }] });
  const attacker: CombatUnit = {
    id: 'attacker', name: 'Attacker', side: incoming ? 'enemy' : 'player', kind: incoming ? 'monster' : 'hero',
    level: 1, tier: 'trash', stats: { ...base, attackSpeed: 263, critChance: 0 },
    life: base.lifeMax, mana: base.manaMax, statuses: [
      { id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture', appliedAtMs: 401 }
    ], cooldowns: {}, skillOrder: [skillId], activeBuffIds: [], enraged: false, summonedAdds: false
  };
  // This explicit stat is the feature under test; armor must never stand in for it.
  const defenderStats = { ...base, life: 1000, lifeMax: 1000, defense: armor, magicResist,
    physDodge: 0, magicDodge: 0, resistances };
  const defender: CombatUnit = {
    ...attacker, id: 'defender', name: 'Defender', side: incoming ? 'player' : 'enemy',
    kind: incoming ? 'hero' : 'monster', stats: defenderStats,
    life: 1000, skillOrder: [], statuses: [
      { id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture' }
    ]
  };
  return { seed: 7, playerTeam: [incoming ? defender : attacker], enemyTeam: [incoming ? attacker : defender] };
}

afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('D04 independent flat magic mitigation through real battle casts', () => {
  it.each([
    ['physical', 50], ['fire', 50], ['poison', 50], ['thorns', 50],
    ['cold', 70], ['lightning', 70], ['arcane', 70]
  ] as const)('routes %s after 25%% resistance to its own mitigation pool', (type, amount) => {
    const input = snapshot(type, 25, 5);
    const original = structuredClone(input);
    const recording = runBattleRecorded(input);
    expect(recording.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'attacker', target: 'defender', amount, simClockMs: 400 })
    ]);
    expect(recording.result.enemyTeam[0]?.life).toBe(1000 - amount);
    expect(runBattle(input)).toEqual(recording.result);
    expect(runBattleRecorded(input)).toEqual(recording);
    expect(input).toEqual(original);
  });

  it.each(['cold', 'lightning', 'arcane'] as const)('%s ignores changes in armor and respects changes in MR on either side', type => {
    for (const incoming of [false, true]) {
      for (const [armor, mr, amount] of [[0, 5, 70], [500, 5, 70], [25, 40, 35], [25, 100, 1]] as const) {
        const recording = runBattleRecorded(snapshot(type, armor, mr, incoming));
        expect(recording.events.filter(e => e.kind === 'damage')).toEqual([
          expect.objectContaining({ target: 'defender', amount })
        ]);
      }
    }
  });

  it.each(['physical', 'fire', 'poison', 'thorns'] as const)('%s ignores MR changes and still uses armor', type => {
    for (const mr of [0, 500]) {
      const recording = runBattleRecorded(snapshot(type, 25, mr));
      expect(recording.events.filter(e => e.kind === 'damage')).toEqual([
        expect.objectContaining({ target: 'defender', amount: 50 })
      ]);
    }
  });
});
