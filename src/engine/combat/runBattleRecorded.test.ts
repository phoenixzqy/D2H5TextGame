import { describe, it, expect } from 'vitest';
import { runBattle, runBattleRecorded } from './combat';
import type { CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import type { DerivedStats } from '../types/attributes';
import { buildSummon } from '../skills/summons';

const baseStats: DerivedStats = {
  life: 100,
  lifeMax: 100,
  mana: 50,
  manaMax: 50,
  attack: 10,
  defense: 0,
  attackSpeed: 10,
  critChance: 0,
  critDamage: 1.5,
  physDodge: 0,
  magicDodge: 0,
  magicFind: 0,
  goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};

function mkUnit(overrides: Partial<CombatUnit> & Pick<CombatUnit, 'id' | 'side'>): CombatUnit {
  return {
    name: overrides.id,
    level: 10,
    tier: 'trash',
    stats: baseStats,
    life: 100,
    mana: 50,
    statuses: [],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false,
    ...overrides
  };
}

function snapshot(): CombatSnapshot {
  const player = mkUnit({
    id: 'p1',
    side: 'player',
    kind: 'hero',
    stats: { ...baseStats, attack: 50, attackSpeed: 20 }
  });
  const enemy = mkUnit({
    id: 'e1',
    side: 'enemy',
    life: 30,
    stats: { ...baseStats, life: 30, lifeMax: 30, attackSpeed: 5 }
  });
  return { seed: 7, playerTeam: [player], enemyTeam: [enemy] };
}

describe('runBattleRecorded', () => {
  it('produces same events and outcome as runBattle (deterministic)', () => {
    const snap = snapshot();
    const a = runBattle(snap);
    const b = runBattleRecorded(snap);
    expect(b.events.length).toBe(a.events.length);
    expect(b.result.winner).toBe(a.winner);
    // Each recorded event matches the underlying event structure 1:1
    // when stripping the timing annotations.
    for (let i = 0; i < a.events.length; i++) {
      const ev = a.events[i];
      const rec = b.events[i];
      expect(rec).toBeDefined();
      const { uiDelayMs: _u, simClockMs: _s, ...rest } = rec ?? { uiDelayMs: 0, simClockMs: 0 };
      expect(rest).toEqual(ev);
      expect(typeof _u).toBe('number');
      expect(typeof _s).toBe('number');
    }
  });

  it('attaches simClockMs and uiDelayMs annotations within bounds', () => {
    const snap = snapshot();
    const { events } = runBattleRecorded(snap);
    expect(events.length).toBeGreaterThan(0);
    for (const ev of events) {
      expect(ev.simClockMs).toBeGreaterThanOrEqual(0);
      expect(ev.uiDelayMs).toBeGreaterThanOrEqual(50);
      expect(ev.uiDelayMs).toBeLessThanOrEqual(3000);
    }
    expect(events[0]?.uiDelayMs).toBe(200);
  });

  it('repeats complete summon state and event timestamps without global resets', () => {
    const snap = summoningSnapshot();
    const original = structuredClone(snap);
    const first = runBattleRecorded(snap);
    expect(first.events.some((event) => event.kind === 'summon')).toBe(true);
    expect(runBattleRecorded(snap)).toEqual(first);
    expect(snap).toEqual(original);
  });

  it('replays A/B/A identically after other battles and standalone template builds', () => {
    const snap = summoningSnapshot();
    const first = runBattleRecorded(snap);
    runBattleRecorded({ ...snap, seed: 17 });
    const owner = snap.playerTeam[0];
    if (!owner) throw new Error('Missing summoner fixture');
    buildSummon(owner, 'skeleton');
    expect(runBattleRecorded(snap)).toEqual(first);
    expect(runBattle(snap)).toEqual(first.result);
  });

  it('preserves preloaded identities and gives every owner and template unique IDs', () => {
    const snap = summoningSnapshot();
    const firstOwner = snap.playerTeam[0];
    if (!firstOwner) throw new Error('Missing summoner fixture');
    const preloaded = mkUnit({
      id: 'p1-summon-skeleton-1',
      side: 'enemy',
      life: 10000,
      stats: { ...baseStats, life: 10000, lifeMax: 10000, attack: 0 }
    });
    const deadPreloaded = mkUnit({ id: 'p1-summon-skeleton-2', side: 'enemy', life: 0 });
    const otherOwner = { ...firstOwner, id: 'p2' };
    const result = runBattle({
      ...snap,
      playerTeam: [firstOwner, otherOwner],
      enemyTeam: [preloaded, deadPreloaded]
    });
    const summoned = result.events.filter((event) => event.kind === 'summon');
    expect(summoned.length).toBeGreaterThanOrEqual(4);
    const units = [...result.playerTeam, ...result.enemyTeam];
    expect(new Set(units.map((unit) => unit.id)).size).toBe(units.length);
    expect(result.enemyTeam.find((unit) => unit.id === preloaded.id)?.side).toBe('enemy');
    expect(summoned.map((event) => event.unit.id)).not.toContain(preloaded.id);
    expect(summoned.map((event) => event.unit.id)).not.toContain(deadPreloaded.id);
    expect(result.enemyTeam.find((unit) => unit.id === deadPreloaded.id)?.life).toBe(0);
    for (const owner of [firstOwner, otherOwner]) {
      expect(
        result.playerTeam
          .filter((unit) => unit.summonOwnerId === owner.id)
          .map((unit) => unit.summonTemplateId)
          .sort()
      ).toEqual(['clay_golem', 'skeleton']);
    }
  });

  it('does not copy a damaged placeholder unit while positioning a new summon', () => {
    const snap = summoningSnapshot();
    const existing = mkUnit({
      id: 'p1-summon-skeleton',
      side: 'player',
      kind: 'summon',
      summonOwnerId: 'other-owner',
      summonTemplateId: 'skeleton',
      life: 17,
      gridPosition: { row: 2, col: 2 }
    });
    const result = runBattle({
      ...snap,
      playerTeam: [...snap.playerTeam, existing],
      enemyTeam: [mkUnit({ id: 'e1', side: 'enemy', life: 1 })]
    });
    const created = result.events.find(
      (event) => event.kind === 'summon' && event.summonId === 'skeleton'
    );
    if (!created || created.kind !== 'summon') throw new Error('Missing new skeleton');
    expect(created.unit.id).not.toBe(existing.id);
    expect(created.unit.life).toBe(created.unit.stats.lifeMax);
    expect(created.unit.gridPosition).not.toEqual(existing.gridPosition);
    expect(result.playerTeam.find((unit) => unit.id === existing.id)).toEqual(existing);
  });
});

function summoningSnapshot(): CombatSnapshot {
  return {
    seed: 7,
    maxRounds: 1,
    playerTeam: [
      mkUnit({
        id: 'p1',
        side: 'player',
        kind: 'hero',
        skillOrder: ['necromancer.raise_skeleton', 'necromancer.clay_golem'],
        stats: { ...baseStats, attack: 0 },
        mana: 50
      })
    ],
    enemyTeam: [
      mkUnit({
        id: 'e1',
        side: 'enemy',
        life: 10000,
        stats: { ...baseStats, life: 10000, lifeMax: 10000, attack: 0 }
      })
    ]
  };
}
