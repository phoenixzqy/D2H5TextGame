import { loadClassStartingStats } from '@/data/loaders/classes';
import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { planRespec, readRespecsRemaining } from './respec';

const hero = () => ({ ...createMockPlayer('Reset', 'sorceress'), level: 24,
  skillPoints: 2, skillLevels: { 'sorceress.fire_bolt': 4, 'sorceress.ice_blast': 20 },
  coreStats: { strength: 10, dexterity: 25, vitality: 97, energy: 63 } });

describe('authored town reset policy', () => {
  it('refunds owned ranks and clears learned priority without spending other allowances', () => {
    const p = hero(); const result = planRespec(p, 'skill', 0);
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') throw new Error('reset refused');
    expect(result.cost).toBe(0);
    expect(result.player).toMatchObject({ skillPoints: 26, skillLevels: {}, comboOrder: [],
      respecsRemaining: { stat: 3, skill: 2 }, coreStats: p.coreStats, derivedStats: p.derivedStats });
    expect(p.skillLevels['sorceress.ice_blast']).toBe(20);
  });
  it('returns all actual core investment while retaining existing quest points', () => {
    const p = { ...hero(), statPoints: 5 }; const result = planRespec(p, 'stat', 0);
    if (result.kind !== 'ok') throw new Error('reset refused');
    expect(result.refund).toBe(115); expect(result.player.statPoints).toBe(120);
    expect(result.player.coreStats).toEqual({ strength: 10, dexterity: 25, vitality: 10, energy: 35 });
    expect(result.player.skillLevels).toEqual(p.skillLevels);
    expect(result.player.respecsRemaining).toEqual({ stat: 2, skill: 3 });
  });
  it('charges exactly five real wishstones only after its own free uses expire', () => {
    const p = { ...hero(), respecsRemaining: { stat: 3, skill: 0 } };
    expect(planRespec(p, 'skill', 4).kind).toBe('insufficient-wishstones');
    const result = planRespec(p, 'skill', 5);
    if (result.kind !== 'ok') throw new Error('reset refused');
    expect(result.cost).toBe(5); expect(result.player.respecsRemaining).toEqual({ stat: 3, skill: 0 });
  });
  it('refuses empty reset and never refunds aliases twice', () => {
    expect(planRespec({ ...hero(), skillLevels: {} }, 'skill', 100).kind).toBe('no-allocations');
    const result = planRespec({ ...hero(), skillLevels: {
      'sorceress.ice_blast': 20, 'skills-sorceress-ice-blast': 19 } }, 'skill', 0);
    if (result.kind !== 'ok') throw new Error('reset refused');
    expect(result.refund).toBe(20);
  });
  it.each([undefined, null, {}, { stat: 4, skill: 3 }, { stat: 1.5, skill: 0 },
    { stat: 1, skill: -1 }, { stat: 1, skill: 0, extra: true }])('refuses malformed present counters %j', value => {
    expect(() => readRespecsRemaining({ respecsRemaining: value })).toThrow();
  });
  it('refuses invalid/foreign allocations and negative core investment', () => {
    expect(planRespec({ ...hero(), skillLevels: { 'paladin.might': 2 } }, 'skill', 5).kind).toBe('invalid-player');
    expect(planRespec({ ...hero(), coreStats: { ...hero().coreStats, strength: 0 } }, 'stat', 5).kind).toBe('invalid-player');
  });
});

it.each(['amazon', 'assassin', 'barbarian', 'druid', 'necromancer', 'paladin', 'sorceress'])(
  'refunds %s to its own authored class baseline', cls => {
    const core = loadClassStartingStats(cls), p = { ...hero(), class: cls,
      coreStats: { ...core, vitality: core.vitality + 17 }, statPoints: 4 };
    const result = planRespec(p, 'stat', 0); if (result.kind !== 'ok') throw new Error(result.kind);
    expect(result.player.coreStats).toEqual(core); expect(result.player.statPoints).toBe(21);
  });

it('offers each reset at an actual authored NPC in its act', async () => {
  const { RESPEC_POLICY } = await import('@/data/loaders/respec');
  const { loadTownNpcs } = await import('@/data/loaders/towns');
  for (const [act, npc] of Object.entries(RESPEC_POLICY.townNpcs)) {
    expect(loadTownNpcs(Number(act)).map(row => row.id), `Act ${act}`).toContain(npc);
  }
});
