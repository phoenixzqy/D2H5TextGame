import { describe, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import { actionPeriodMs, runBattle, runBattleRecorded } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { getSkill } from '@/engine/skills/registry';

const hold = (appliedAtMs = 0): ActiveStatus => ({
  id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture', appliedAtMs
});

describe('P08a03b actual Acolyte factory default-rank recovery (not acquisition evidence)', () => {
  it('preserves real factory stats/loadout and heals once at the actual 1588ms first action', () => {
    const definition = loadMercPool().pool.find(def => def.id === 'mercs/tavern-acolyte-priestess');
    if (!definition) throw new Error('Actual Acolyte Priestess definition is missing');
    const sourceBefore = structuredClone(definition);
    const merc = createMercFromDef(definition);
    const factoryBefore = structuredClone(merc);
    const priest = mercToCombatUnit(merc);
    expect(priest.stats).toBe(merc.derivedStats);
    expect(priest.stats).toMatchObject({ lifeMax: 164, manaMax: 102, attackSpeed: 114 });
    expect(priest.level).toBe(5);
    expect(priest.skillOrder).toEqual(['mskill-minor-heal']);
    expect(priest.skillLevels).toBeUndefined(); // The real factory uses default rank 1.
    expect(actionPeriodMs(priest.stats.attackSpeed)).toBe(1588);
    expect(getSkill(priest.skillOrder[0] ?? '')?.effects).toEqual([
      { kind: 'heal', amountRange: [30, 50], target: 'ally' }
    ]);
    const hero: CombatUnit = { ...priest, id: 'hero', kind: 'hero', life: 100,
      stats: { ...priest.stats, life: 200, lifeMax: 200 }, skillOrder: [], statuses: [hold()] };
    const enemy: CombatUnit = { ...priest, id: 'enemy', kind: 'monster', side: 'enemy', life: 500,
      skillOrder: [], statuses: [hold()] };
    // Only injuries and action holds are synthetic; all priest combat stats stay authored.
    const snapshot = { seed: 1, playerTeam: [hero, { ...priest, life: 150, statuses: [hold(1589)] }],
      enemyTeam: [enemy] };
    const before = structuredClone(snapshot);
    const result = runBattleRecorded(snapshot);
    expect(result.result.playerTeam.map(u => u.life)).toEqual([143, 150]);
    expect(result.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'hero', amount: 43, simClockMs: 1588 })
    ]);
    expect(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: priest.id, skillId: 'mskill-minor-heal', simClockMs: 1588 })
    ]);
    expect(result.events.filter(e => ['damage', 'dot', 'buff'].includes(e.kind))).toEqual([]);
    expect(result.result.playerTeam[1]?.stats).toEqual(priest.stats);
    expect(result.result.playerTeam[1]?.mana).toBe(102);
    expect(runBattle(snapshot)).toEqual(result.result);
    expect(runBattleRecorded(snapshot)).toEqual(result);
    expect(snapshot).toEqual(before);
    expect(merc).toEqual(factoryBefore);
    expect(definition).toEqual(sourceBefore);
  });
});
