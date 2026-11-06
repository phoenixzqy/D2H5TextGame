import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import sorceressSkills from '../../data/skills/sorceress.json';
import { getSkill, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { composeColdMastery } from '../skills/cold-mastery';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';

const authoredId = 'skills-sorceress-blizzard';
const canonicalId = 'sorceress.blizzard';

function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 73, tier: 'trash',
    life: 20000, mana: 35,
    stats: { life: 20000, lifeMax: 20000, mana: 35, manaMax: 35, attack: 1,
      defense: 0, magicResist: 0, attackSpeed: 125, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}

/** Constructed mitigation fixture: one paid cast, no campaign/acquisition credit. */
function snapshot(rank: number, mastery: boolean, seed = 1): CombatSnapshot {
  const hero = unit('hero', 'player'), target = unit('target', 'enemy');
  const masteryLevels = mastery ? { 'skills-sorceress-cold-mastery': 20 } : {};
  return { seed, act: 5,
    playerTeam: [{ ...hero, skillOrder: [authoredId], skillLevels: { [authoredId]: rank, ...masteryLevels },
      coldResistanceReductionPct: composeColdMastery({ class: 'sorceress', level: hero.level,
        skillLevels: masteryLevels }),
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 1501 }] }],
    enemyTeam: [{ ...target, stats: { ...target.stats, magicResist: 146,
      resistances: { ...target.stats.resistances, cold: 75 } },
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 0 }] }]
  };
}

function record(input: CombatSnapshot) {
  const before = structuredClone({ input, data: sorceressSkills, skill: getSkill(canonicalId) });
  const result = runBattleRecorded(input);
  expect({ input, data: sorceressSkills, skill: getSkill(canonicalId) }).toEqual(before);
  return result;
}

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('invested Blizzard through native paid combat', () => {
  it.each([
    { rank: 1, mastery: false, hit: 1 }, { rank: 1, mastery: true, hit: 1 },
    { rank: 2, mastery: false, hit: 1 }, { rank: 2, mastery: true, hit: 45 },
    { rank: 20, mastery: false, hit: 255 }, { rank: 20, mastery: true, hit: 1715 }
  ])('rank$rank mastery=$mastery lands $hit with one MP35 cast and Chill', ({ rank, mastery, hit }) => {
    const recorded = record(snapshot(rank, mastery));
    // Seed1 hit .62707, range .002735, crit .52745: the inclusive raw minimum.
    expect(recorded.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: canonicalId, simClockMs: 1500 })
    ]);
    expect(recorded.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'hero', target: 'target', damageType: 'cold', amount: hit,
        crit: false, dodged: false, simClockMs: 1500 })
    ]);
    expect(recorded.events.filter(e => e.kind === 'mana')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 0, reason: 'cast', simClockMs: 1500 })
    ]);
    expect(recorded.events.filter(e => e.kind === 'status').map(e => [e.target, e.statusId]))
      .toEqual([['target', 'chill']]);
    expect(recorded.result.enemyTeam[0]?.life).toBe(20000 - hit);
    expect(recorded.result.playerTeam[0]?.mana).toBe(0);
    expect(getSkill(canonicalId)).toMatchObject({ manaCost: 35, cooldown: 4, target: 'all-enemies' });
  });

  it('retains the ordinary mitigation floor against very high Magic Resist', () => {
    const base = snapshot(20, true);
    const input = { ...base, enemyTeam: base.enemyTeam.map(t => ({ ...t,
      stats: { ...t.stats, magicResist: 10000 } })) };
    const recorded = record(input);
    expect(recorded.events.filter(e => e.kind === 'damage').map(e => [e.amount, e.dodged])).toEqual([[1, false]]);
    expect(recorded.result.enemyTeam[0]?.life).toBe(19999);
    expect(recorded.result.playerTeam[0]?.mana).toBe(0);
  });

  it('keeps scalar damage independent of Attack and replays deterministically without mutation', () => {
    const input = snapshot(20, true), recorded = record(input);
    const stronger = { ...input, playerTeam: input.playerTeam.map(h => ({ ...h,
      stats: { ...h.stats, attack: 99999 } })) };
    const higherAttack = record(stronger);
    expect(higherAttack.events).toEqual(recorded.events);
    expect(higherAttack.result.enemyTeam).toEqual(recorded.result.enemyTeam);
    expect(runBattle(input)).toEqual(recorded.result);
    expect(record(input)).toEqual(recorded);
  });

  it('pays MP35 on a natural miss without damage or Chill', () => {
    const recorded = record(snapshot(20, true, 4)); // First seeded hit roll .923636 misses.
    expect(recorded.events.filter(e => e.kind === 'damage').map(e => [e.amount, e.dodged])).toEqual([[0, true]]);
    expect(recorded.events.filter(e => e.kind === 'status')).toEqual([]);
    expect(recorded.result.playerTeam[0]?.mana).toBe(0);
    expect(recorded.result.enemyTeam[0]?.life).toBe(20000);
  });

  it('rejects MP34 without spending mana or applying Cold damage/status', () => {
    const base = snapshot(20, true);
    const recorded = record({ ...base, playerTeam: base.playerTeam.map(h => ({ ...h, mana: 34 })) });
    expect(recorded.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: null, simClockMs: 1500 })
    ]);
    expect(recorded.events.filter(e => e.kind === 'status' || e.kind === 'mana')).toEqual([]);
    expect(recorded.events.filter(e => e.kind === 'damage').map(e => e.damageType)).toEqual(['physical']);
    expect(recorded.result.playerTeam[0]?.mana).toBe(34);
  });
});
