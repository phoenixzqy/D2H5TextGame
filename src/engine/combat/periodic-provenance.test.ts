import { describe, expect, it } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import { payHolyShield } from '../skills/holy-shield';
import type { ActiveStatus, CombatUnit } from './types';

const hold: ActiveStatus = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function unit(id: string, side: CombatUnit['side'], statuses: readonly ActiveStatus[] = []): CombatUnit {
  return {
    id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 1000, mana: 100, statuses: [hold, ...statuses], skillOrder: [], cooldowns: {},
    activeBuffIds: [], enraged: false,
    stats: { life: 1000, lifeMax: 1000, mana: 100, manaMax: 100, attack: 10, defense: 0,
      magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0,
      magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } }
  };
}
function status(id: string, patch: Partial<ActiveStatus>): ActiveStatus {
  return { id, sourceId: 'hero', stacks: 1, remaining: -1, ...patch };
}
function record(enemy: CombatUnit, hero = unit('hero', 'player')) {
  const input: CombatSnapshot = { seed: 7, playerTeam: [hero], enemyTeam: [enemy] };
  const before = structuredClone(input), recorded = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(recorded);
  expect(runBattle(input)).toEqual(recorded.result);
  return recorded;
}

describe('periodic damage provenance', () => {
  it('retains the expired half-DPS source through an empty gap without assigning integer shares', () => {
    const r = record(unit('enemy', 'enemy', [
      status('poison', { sourceId: 'poisoner', damageType: 'poison', dotPerStack: 0.5, expiresAtMs: 1000 }),
      status('ignite', { sourceId: 'burner', damageType: 'fire', dotPerStack: 0.5,
        appliedAtMs: 2000, expiresAtMs: 3000 })
    ]));
    const events = r.events.filter(e => e.kind === 'dot');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ target: 'enemy', amount: 1, simClockMs: 3000,
      provenance: { fromMs: 0, toMs: 3000, rawAmount: 1, carryInHpMs: 0, carryOutHpMs: 0,
        contributions: [
          { source: 'poisoner', statusId: 'poison', damageType: 'poison', hpMs: 500 },
          { source: 'burner', statusId: 'ignite', damageType: 'fire', hpMs: 500 }
        ] } });
    expect(r.result.enemyTeam[0]?.life).toBe(999);
  });

  it('separates carried fractional damage from subsequent typed contributions', () => {
    const r = record(unit('enemy', 'enemy', [
      status('poison', { damageType: 'poison', dotPerStack: 1.5, expiresAtMs: 1000 }),
      status('burn', { sourceId: 'other', damageType: 'fire', dotPerStack: 0.5,
        appliedAtMs: 2000, expiresAtMs: 3000 })
    ]));
    expect(r.events.filter(e => e.kind === 'dot')).toMatchObject([
      { amount: 1, simClockMs: 1000, provenance: { fromMs: 0, toMs: 1000, rawAmount: 1,
        carryInHpMs: 0, carryOutHpMs: 500,
        contributions: [{ source: 'hero', statusId: 'poison', damageType: 'poison', hpMs: 1500 }] } },
      { amount: 1, simClockMs: 3000, provenance: { fromMs: 1000, toMs: 3000, rawAmount: 1,
        carryInHpMs: 500, carryOutHpMs: 0,
        contributions: [{ source: 'other', statusId: 'burn', damageType: 'fire', hpMs: 500 }] } }
    ]);
    expect(r.result.enemyTeam[0]?.life).toBe(998);
  });

  it('keeps literal source/status/type integrals through splits, stacks and lethal predictions', () => {
    const r = record({ ...unit('enemy', 'enemy', [
      status('bleed', { sourceId: 'bleeder', dotPerStack: 0.5, stacks: 2, expiresAtMs: 1000 }),
      status('poison', { damageType: 'poison', dotPerStack: 1, appliedAtMs: 500, expiresAtMs: 1000 }),
      ...[100, 200, 300, 400].map(at => status(`boundary-${String(at)}`, { expiresAtMs: at }))
    ]), life: 1 });
    const events = r.events.filter(e => e.kind === 'dot');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ amount: 1, simClockMs: 750,
      provenance: { fromMs: 0, toMs: 750, rawAmount: 1, carryInHpMs: 0, carryOutHpMs: 0,
        contributions: [
          { source: 'bleeder', statusId: 'bleed', hpMs: 750 },
          { source: 'hero', statusId: 'poison', damageType: 'poison', hpMs: 250 }
        ] } });
    expect(events[0]?.provenance?.contributions[0]).not.toHaveProperty('damageType');
    expect(r.events.at(-1)).toMatchObject({ kind: 'end', winner: 'player', simClockMs: 750 });
  });

  it('records pre-shield integrals and preserves separately observed absorbed and lost damage', () => {
    const hero = payHolyShield({ ...unit('hero', 'player', [
      status('poison', { sourceId: 'enemy', damageType: 'poison', dotPerStack: 10, expiresAtMs: 1000 })
    ]), holyShieldRank: 20 });
    const r = record(unit('enemy', 'enemy'), hero);
    expect(r.events.filter(e => e.kind === 'dot')).toMatchObject([
      { target: 'hero', amount: 6, holyShieldAbsorbed: 4, simClockMs: 1000,
        provenance: { rawAmount: 10, carryInHpMs: 0, carryOutHpMs: 0,
          contributions: [{ source: 'enemy', statusId: 'poison', damageType: 'poison', hpMs: 10000 }] } }
    ]);
    expect(r.result.playerTeam[0]?.life).toBe(994);
  });

  it('keeps matching status IDs separate by source and by supplied damage type', () => {
    const r = record(unit('enemy', 'enemy', [
      status('poison', { damageType: 'poison', dotPerStack: 1, expiresAtMs: 1000 }),
      status('poison', { sourceId: 'merc', damageType: 'poison', dotPerStack: 2, expiresAtMs: 1000 }),
      status('poison', { damageType: 'fire', dotPerStack: 3, expiresAtMs: 1000 })
    ]));
    expect(r.events.filter(e => e.kind === 'dot')).toMatchObject([
      { amount: 6, provenance: { rawAmount: 6, contributions: [
        { source: 'hero', statusId: 'poison', damageType: 'poison', hpMs: 1000 },
        { source: 'merc', statusId: 'poison', damageType: 'poison', hpMs: 2000 },
        { source: 'hero', statusId: 'poison', damageType: 'fire', hpMs: 3000 }
      ] } }
    ]);
    expect(r.result.enemyTeam[0]?.life).toBe(994);
  });

  it('detaches earlier event contributions and conserves interval damage at successive emissions', () => {
    const r = record(unit('enemy', 'enemy', [
      status('poison', { damageType: 'poison', dotPerStack: 1.25, expiresAtMs: 4000 })
    ]));
    const events = r.events.filter(e => e.kind === 'dot');
    expect(events.map(e => [e.simClockMs, e.amount])).toEqual([[1700, 2], [3400, 2], [4000, 1]]);
    expect(events.map(e => e.provenance?.contributions)).toEqual([
      [{ source: 'hero', statusId: 'poison', damageType: 'poison', hpMs: 2125 }],
      [{ source: 'hero', statusId: 'poison', damageType: 'poison', hpMs: 2125 }],
      [{ source: 'hero', statusId: 'poison', damageType: 'poison', hpMs: 750 }]
    ]);
    for (const event of events) {
      const p = event.provenance;
      expect(p).toBeDefined();
      if (!p) throw new Error('Missing periodic provenance');
      expect(p.carryInHpMs + p.contributions.reduce((sum, c) => sum + c.hpMs, 0))
        .toBeCloseTo(p.rawAmount * 1000 + p.carryOutHpMs, 9);
    }
    expect(r.result.enemyTeam[0]?.life).toBe(995);
  });
});
