import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
const hold = (at = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'synthetic-hold',
  remaining: -1,
  stacks: 1,
  appliedAtMs: at
});
function fixture(slug = 'zeal', rank = 1, count = 9): CombatSnapshot {
  const id = 'paladin.' + slug.replaceAll('-', '_');
  const hero: CombatUnit = {
    id: 'hero',
    name: 'Synthetic Paladin targeting',
    side: 'player',
    kind: 'hero',
    level: 30,
    tier: 'trash',
    life: 5000,
    mana: 5000,
    statuses: [hold(1701)],
    cooldowns: {},
    skillOrder: [id],
    skillLevels: { [id]: rank },
    activeBuffIds: [],
    enraged: false,
    stats: {
      life: 10000,
      lifeMax: 10000,
      mana: 10000,
      manaMax: 10000,
      attack: 1,
      defense: 0,
      magicResist: 0,
      attackSpeed: 100,
      critChance: 0,
      critDamage: 1.5,
      physDodge: 0,
      magicDodge: 0,
      magicFind: 0,
      goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 }
    }
  };
  const enemyTeam: CombatUnit[] = Array.from({ length: count }, (_, index) => ({
    ...hero,
    id: 'target-' + String(index),
    side: 'enemy',
    kind: 'monster',
    life: 100000,
    statuses: [hold()],
    skillOrder: [],
    skillLevels: {},
    mana: 0,
    stats: { ...hero.stats, life: 100000, lifeMax: 100000 },
    gridPosition: { row: Math.floor(index / 3), col: index % 3 }
  }));
  return { seed: 7, playerTeam: [hero], enemyTeam };
}
function run(input: CombatSnapshot) {
  const before = structuredClone(input),
    out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  return out;
}
function hits(out: ReturnType<typeof run>) {
  return out.events.filter(
    (e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
      e.kind === 'damage' && e.source === 'hero' && e.target !== 'hero'
  );
}
function modifyHero(input: CombatSnapshot, patch: Partial<CombatUnit>): CombatSnapshot {
  return { ...input, playerTeam: input.playerTeam.map((u) => ({ ...u, ...patch })) };
}
function withoutControl(slug: string) {
  const skill = getSkill('paladin.' + slug.replaceAll('-', '_'));
  if (!skill) throw new Error('Missing control skill');
  registerSkill({
    ...skill,
    effects: skill.effects.map((e) => {
      if (e.kind !== 'damage') return e;
      const { applyStatus, applyStatuses, ...damage } = e;
      void applyStatus;
      void applyStatuses;
      return damage;
    })
  });
}
beforeEach(loadDefaultSkills);
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});
describe('Zeal caps the actual resolved cross', () => {
  it.each([1, 2, 20])('rank%i hits exactly three row-major cells with one cost/action', (rank) => {
    const out = run(fixture('zeal', rank));
    expect(hits(out).map((e) => e.target)).toEqual(['target-1', 'target-3', 'target-4']);
    expect(
      hits(out).every((e) => e.amount >= 40 + 4 * (rank - 1) && e.amount <= 60 + 4 * (rank - 1))
    ).toBe(true);
    expect(out.events.filter((e) => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: 'paladin.zeal', simClockMs: 1700 })
    ]);
    expect(out.result.playerTeam[0]?.mana).toBe(4990);
    for (const enemy of out.result.enemyTeam)
      expect(enemy.life).toBe(
        100000 -
          hits(out)
            .filter((e) => e.target === enemy.id)
            .reduce((n, e) => n + e.amount, 0)
      );
  });
  it.each([1, 2])('does not invent replacement targets with only %i enemies', (count) => {
    const out = run(fixture('zeal', 1, count));
    expect(hits(out)).toHaveLength(count);
    expect(new Set(hits(out).map((e) => e.target)).size).toBe(count);
  });
  it('preserves full cross geometry for an uncapped real skill', () => {
    const input = fixture('zeal');
    const out = run(
      modifyHero(input, {
        skillOrder: ['druid.arctic_blast'],
        skillLevels: { 'druid.arctic_blast': 1 }
      })
    );
    expect(hits(out).map((e) => e.target)).toEqual([
      'target-1',
      'target-3',
      'target-4',
      'target-5',
      'target-7'
    ]);
  });
  it('does not replace a missed capped target', () => {
    const input = fixture();
    const out = run({
      ...input,
      seed: 1,
      enemyTeam: input.enemyTeam.map((u) => ({ ...u, stats: { ...u.stats, physDodge: 1 } }))
    });
    expect(hits(out).map((e) => e.target)).toEqual(['target-1', 'target-3', 'target-4']);
    expect(hits(out).some((e) => e.dodged)).toBe(true);
    expect(out.result.playerTeam[0]?.mana).toBe(4990);
  });
  it('does not replace a killed target outside the initial capped list', () => {
    const input = fixture();
    const out = run({ ...input, enemyTeam: input.enemyTeam.map((u) => ({ ...u, life: 1 })) });
    expect(hits(out).map((e) => e.target)).toEqual(['target-1', 'target-3', 'target-4']);
    expect(out.result.enemyTeam.filter((u) => u.life === 0)).toHaveLength(3);
    expect(out.events.filter((e) => e.kind === 'death')).toHaveLength(3);
  });
  it('keeps the lowest-cell tie and row order even when insertion order is reversed', () => {
    const base = fixture();
    const enemies = base.enemyTeam.filter((u) =>
      ['target-0', 'target-1', 'target-3', 'target-4'].includes(u.id)
    );
    for (const enemyTeam of [enemies, [...enemies].reverse()]) {
      expect(hits(run({ ...base, enemyTeam })).map((e) => e.target)).toEqual([
        'target-0',
        'target-1',
        'target-3'
      ]);
    }
  });
  it('excludes an already dead cell before resolving and applying the cap', () => {
    const base = fixture();
    const out = run({
      ...base,
      enemyTeam: base.enemyTeam.map((u) => (u.id === 'target-1' ? { ...u, life: 0 } : u))
    });
    expect(hits(out).map((e) => e.target)).toEqual(['target-0', 'target-3', 'target-4']);
  });
  it('falls back to one ordinary attack without paying a missing resource or ready cooldown', () => {
    for (const patch of [{ mana: 9 }, { cooldowns: { 'paladin.zeal': 1701 } }]) {
      const input = modifyHero(fixture(), patch),
        out = run(input);
      expect(hits(out)).toHaveLength(1);
      expect(out.events.filter((e) => e.kind === 'action')).toEqual([
        expect.objectContaining({ skillId: null })
      ]);
      expect(out.result.playerTeam[0]?.mana).toBe(input.playerTeam[0]?.mana);
    }
  });
});
describe.each(['smite', 'charge', 'fist-of-heavens'])('%s actual control consequences', (slug) => {
  it.each(['trash', 'boss'] as const)(
    'blocks a scheduled %s action only until actual status expiry',
    (tier) => {
      const base = fixture(slug, 1, 1);
      const input = {
        ...base,
        enemyTeam: base.enemyTeam.map((u) => ({
          ...u,
          tier,
          statuses: [],
          stats: { ...u.stats, attackSpeed: 0 }
        }))
      };
      const actual = run(input);
      withoutControl(slug);
      const control = run(input);
      const actions = (out: ReturnType<typeof run>) =>
        out.events
          .filter((e) => e.kind === 'action' && e.actor === 'target-0')
          .map((e) => e.simClockMs);
      expect(actions(control)[0]).toBe(2000);
      const duration = slug === 'fist-of-heavens' || tier === 'trash' ? 1000 : 500;
      // Control skips the scheduled action; expiry does not create an extra action.
      expect(actions(actual)[0]).toBe(4000);
      expect(actual.events).toContainEqual(
        expect.objectContaining({ kind: 'stunned', target: 'target-0', simClockMs: 2000 })
      );
      expect(actions(actual)[0]).toBeGreaterThan(actions(control)[0] ?? 0);
      expect(
        actual.events.some(
          (e) =>
            e.kind === 'status-state' &&
            e.target === 'target-0' &&
            e.simClockMs === 1700 + duration &&
            !e.statuses.some((s) => s.id === (slug === 'fist-of-heavens' ? 'paralyze' : 'stun'))
        )
      ).toBe(true);
    }
  );
  if (slug !== 'fist-of-heavens')
    it('allows a boss action after half-duration while ordinary Stun still interrupts it', () => {
      const base = fixture(slug, 1, 1),
        hero = base.playerTeam[0];
      if (!hero) throw new Error('Missing timed caster');
      const first = (tier: 'trash' | 'boss') => {
        const out = run({
          ...modifyHero(base, { stats: { ...hero.stats, attackSpeed: 150 } }),
          enemyTeam: base.enemyTeam.map((u) => ({
            ...u,
            tier,
            statuses: [],
            stats: { ...u.stats, attackSpeed: 0 }
          }))
        });
        return out.events.find((e) => e.kind === 'action' && e.actor === 'target-0')?.simClockMs;
      };
      expect(first('trash')).toBe(4000);
      expect(first('boss')).toBe(2000);
    });
  it('does not apply control after a real miss', () => {
    const input = fixture(slug, 1, 1);
    const out = run({
      ...input,
      seed: 1,
      enemyTeam: input.enemyTeam.map((u) => ({
        ...u,
        stats: { ...u.stats, physDodge: 1, magicDodge: 1 }
      }))
    });
    expect(hits(out)).toHaveLength(1);
    expect(hits(out)[0]).toMatchObject({ dodged: true, amount: 0 });
    expect(out.events.filter((e) => e.kind === 'status')).toEqual([]);
  });
});

describe('Fist actual repeat-Paralyze eligibility', () => {
  it('can accept or reject a repeated landed Paralyze inside its residual window', () => {
    const base = fixture('fist-of-heavens', 1, 1),
      hero = base.playerTeam[0];
    if (!hero) throw new Error('Missing repeated Fist caster');
    let accepted = 0,
      rejected = 0;
    for (let seed = 1; seed <= 16; seed++) {
      const out = run({
        ...modifyHero(base, { stats: { ...hero.stats, attackSpeed: 200 }, statuses: [hold(5401)] }),
        seed
      });
      const lightning = hits(out).filter((e) => e.damageType === 'lightning');
      expect(
        out.events
          .filter((e) => e.kind === 'action' && e.skillId === 'paladin.fist_of_heavens')
          .map((e) => e.simClockMs)
      ).toEqual([900, 5400]);
      expect(out.result.playerTeam[0]?.mana).toBe(4900);
      if (lightning.some((e) => e.dodged)) continue;
      const states = out.events.filter(
        (e): e is Extract<RecordedBattleEvent, { kind: 'status-state' }> =>
          e.kind === 'status-state' && e.target === 'target-0'
      );
      expect(
        states.some(
          (e) =>
            e.simClockMs === 900 &&
            e.statuses.some((s) => s.id === 'paralyze' && s.expiresAtMs === 1900)
        )
      ).toBe(true);
      const reapplied = states.some(
        (e) =>
          e.simClockMs === 5400 &&
          e.statuses.some(
            (s) => s.id === 'paralyze' && s.appliedAtMs === 5400 && s.expiresAtMs === 6400
          )
      );
      if (reapplied) accepted++;
      else rejected++;
    }
    expect(accepted).toBeGreaterThan(0);
    expect(rejected).toBeGreaterThan(0);
  });
});
