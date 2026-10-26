import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import skillSchema from '../../data/schema/skill.schema.json';
import sorceressSkills from '../../data/skills/sorceress.json';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import type { RegisteredSkill } from '../skills/effects';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleResult } from './combat';
import type { ActiveStatus, CombatUnit, MonsterTier } from './types';

const authoredId = 'skills-sorceress-frost-nova';
const canonicalId = 'sorceress.frost_nova';
const validateSkill = new Ajv2020({ strict: true, allErrors: true }).compile(skillSchema);

function hold(appliedAtMs = 0, expiresAtMs?: number): ActiveStatus {
  return { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs,
    ...(expiresAtMs !== undefined ? { expiresAtMs } : {}) };
}

function unit(id: string, side: CombatUnit['side'], speed = 100): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 6, tier: 'trash',
    life: 500, mana: 20,
    stats: { life: 500, lifeMax: 500, mana: 100, manaMax: 100, attack: 10, defense: 0, magicResist: 0,
      attackSpeed: speed, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}

/** Labeled engine fixture, not ordinary acquisition: allow one cast and one enemy action. */
function snapshot(seed = 5, rank = 1, tier: MonsterTier = 'trash', heroSpeed = 150, targetSpeed = 100): CombatSnapshot {
  const heroAt = Math.max(400, Math.min(2000, 2500 - heroSpeed * 8));
  const targetAt = Math.max(400, Math.min(2000, 2500 - targetSpeed * 8));
  return { seed,
    playerTeam: [{ ...unit('hero', 'player', heroSpeed), skillOrder: [authoredId],
      skillLevels: { [authoredId]: rank }, statuses: [hold(heroAt + 1)] }],
    enemyTeam: [{ ...unit('target', 'enemy', targetSpeed), tier, statuses: [hold(Math.max(targetAt + 1, 1801))] }]
  };
}

function withHero(input: CombatSnapshot, overrides: Partial<CombatUnit>): CombatSnapshot {
  return { ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero, ...overrides })) };
}

function quietTargets(input: CombatSnapshot, ids: readonly string[]): CombatSnapshot {
  return { ...input, enemyTeam: ids.map(id => ({ ...unit(id, 'enemy'), statuses: [hold()] })) };
}

function record(input: CombatSnapshot): RecordedBattleResult {
  const before = structuredClone({ input, data: sorceressSkills, skill: getSkill(canonicalId) });
  const recorded = runBattleRecorded(input);
  expect({ input, data: sorceressSkills, skill: getSkill(canonicalId) }).toEqual(before);
  return recorded;
}

function assertReplay(input: CombatSnapshot, recorded: RecordedBattleResult): void {
  const before = structuredClone(input);
  const row = structuredClone(sorceressSkills);
  const skill = structuredClone(getSkill(canonicalId));
  expect(runBattle(input)).toEqual(recorded.result);
  expect(runBattleRecorded(input)).toEqual(recorded);
  expect(input).toEqual(before);
  expect(sorceressSkills).toEqual(row);
  expect(getSkill(canonicalId)).toEqual(skill);
}

beforeEach(() => {
  const row = sorceressSkills.find(skill => skill.id === authoredId);
  expect(validateSkill(row), JSON.stringify(validateSkill.errors)).toBe(true);
  resetRegistry();
  loadDefaultSkills();
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('P08a04b actual authored Frost Nova through recorded combat', () => {
  for (const tier of ['trash', 'boss', 'chapter-boss'] as const) {
    it.each([1, 20])(`rank %s keeps one hit, cost and Chill, then freezes a ${tier}'s real action`, rank => {
      const input = snapshot(5, rank, tier);
      const before = structuredClone(input);
      const recorded = record(input);
      // Mulberry32 seed5: hit .68977, range .77274 -> 33 (+57 at rank20), crit .21976,
      // existing Chill chance1 .62317, secondary Freeze chance.1 .08513720124028623.
      expect(recorded.events.filter(e => e.kind === 'action' && e.actor === 'hero')).toEqual([
        expect.objectContaining({ actor: 'hero', skillId: canonicalId, simClockMs: 1300 })
      ]);
      expect(recorded.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toEqual([
        expect.objectContaining({ source: 'hero', target: 'target', damageType: 'cold',
          amount: rank === 1 ? 33 : 90, dodged: false, crit: false, simClockMs: 1300 })
      ]);
      expect(recorded.events.filter(e => e.kind === 'mana')).toEqual([
        expect.objectContaining({ target: 'hero', mana: 0, reason: 'cast', simClockMs: 1300 })
      ]);
      expect(recorded.events.filter(e => e.kind === 'status').map(e => [e.simClockMs, e.target, e.statusId]))
        .toEqual([[1300, 'target', 'chill'], [1300, 'target', 'freeze']]);
      expect(recorded.events.filter(e => e.kind === 'action')).toHaveLength(1);
      const firstSuppression = recorded.events.find(e => e.kind === 'stunned' && e.target === 'target');
      expect(firstSuppression).toMatchObject({ kind: 'stunned', target: 'target' });
      expect(firstSuppression?.simClockMs).toBeCloseTo(30100 / 17, 8);
      expect(recorded.result.playerTeam[0]?.life).toBe(500);
      expect(recorded.result.enemyTeam[0]?.life).toBe(rank === 1 ? 467 : 410);
      expect(recorded.events.filter(e => e.kind === 'dot')).toEqual([]);
      expect(input).toEqual(before);
      assertReplay(input, recorded);
    });
  }

  it('keeps a hit and Chill but permits the actual enemy action when the 10 percent roll fails', () => {
    const input = snapshot(1);
    const recorded = record(input);
    // Seed1 range .002735 ->25; Freeze .968377 fails. The next enemy hit .281103 succeeds.
    expect(recorded.events.filter(e => e.kind === 'damage').map(e => [e.source, e.amount, e.dodged]))
      .toEqual([['hero', 25, false], ['target', 10, false]]);
    expect(recorded.events.filter(e => e.kind === 'status').map(e => e.statusId)).toEqual(['chill']);
    const targetAction = recorded.events.find(e => e.kind === 'action' && e.actor === 'target');
    expect(targetAction).toMatchObject({ kind: 'action', actor: 'target', skillId: null });
    expect(targetAction?.simClockMs).toBeCloseTo(30100 / 17, 8);
    expect(recorded.result.playerTeam[0]?.life).toBe(490);
    expect(recorded.result.playerTeam[0]?.mana).toBe(0);
    assertReplay(input, recorded);
  });

  it('spends 20 mana on a natural seeded miss and skips both status draws before the next target', () => {
    const input = quietTargets(snapshot(4), ['missed', 'hit']);
    const recorded = record(input);
    // .923636 misses; second target starts immediately at .333045 hit / .221667 range ->27.
    expect(recorded.events.filter(e => e.kind === 'damage').map(e => [e.target, e.amount, e.dodged]))
      .toEqual([['missed', 0, true], ['hit', 27, false]]);
    expect(recorded.events.filter(e => e.kind === 'status').map(e => [e.target, e.statusId]))
      .toEqual([['hit', 'chill']]);
    expect(recorded.result.playerTeam[0]?.mana).toBe(0);
    expect(recorded.result.enemyTeam.map(target => target.life)).toEqual([500, 473]);
    assertReplay(input, recorded);
  });

  for (const boundary of [
    { tier: 'trash', heroSpeed: 250, targetSpeed: 62, castAt: 1000, actionAt: 2000 },
    { tier: 'boss', heroSpeed: 125, targetSpeed: 62, castAt: 1500, actionAt: 2000 },
    { tier: 'chapter-boss', heroSpeed: 125, targetSpeed: 62, castAt: 1500, actionAt: 2000 }
  ] as const) {
    it.each([1, 20])(`rank %s ${boundary.tier} acts at the exclusive ${String(boundary.actionAt - boundary.castAt)}ms Freeze expiry`, rank => {
      const base = snapshot(5, rank, boundary.tier, boundary.heroSpeed, boundary.targetSpeed);
      const input = boundary.castAt === 1000
        ? withHero(base, { statuses: [hold(0, 1000), hold(1001)] }) : base;
      const recorded = record(input);
      expect(recorded.events).toContainEqual(expect.objectContaining({ kind: 'status', statusId: 'freeze',
        target: 'target', simClockMs: boundary.castAt }));
      expect(recorded.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'target',
        skillId: null, simClockMs: boundary.actionAt }));
      expect(recorded.events.some(e => e.kind === 'stunned' && e.target === 'target' && e.simClockMs === boundary.actionAt))
        .toBe(false);
      expect(recorded.result.playerTeam[0]?.life).toBe(490);
      expect(recorded.result.playerTeam[0]?.mana).toBe(0);
      assertReplay(input, recorded);
    });
  }

  it('finishes each target in summon-first then insertion order with independent Freeze rolls', () => {
    const base = quietTargets(snapshot(), ['first-monster', 'taunting-summon', 'last-monster']);
    const input = { ...base, enemyTeam: base.enemyTeam.map(target => target.id === 'taunting-summon'
      ? { ...target, kind: 'summon' as const } : target) };
    const recorded = record(input);
    expect(recorded.events.filter(e => e.kind === 'damage' || e.kind === 'status').map(e =>
      e.kind === 'damage' ? ['hit', e.target, e.amount] : ['status', e.target, e.statusId]))
      .toEqual([
        ['hit', 'taunting-summon', 33], ['status', 'taunting-summon', 'chill'], ['status', 'taunting-summon', 'freeze'],
        ['hit', 'first-monster', 32], ['status', 'first-monster', 'chill'],
        ['hit', 'last-monster', 33], ['status', 'last-monster', 'chill']
      ]);
    expect(recorded.result.enemyTeam.map(target => [target.id, target.life]))
      .toEqual([['first-monster', 468], ['taunting-summon', 467], ['last-monster', 467]]);
    assertReplay(input, recorded);
  });

  it('suppresses only the target whose independent AoE Freeze succeeds', () => {
    const base = snapshot();
    const input = { ...base, enemyTeam: ['frozen', 'unfrozen'].map(id => ({
      ...unit(id, 'enemy'), statuses: [hold(1801)]
    })) };
    const recorded = record(input);
    expect(recorded.events.filter(e => e.kind === 'status').map(e => [e.target, e.statusId]))
      .toEqual([['frozen', 'chill'], ['frozen', 'freeze'], ['unfrozen', 'chill']]);
    const actions = recorded.events.filter(e => e.kind === 'action');
    expect(actions.map(e => [e.actor, e.skillId])).toEqual([['hero', canonicalId], ['unfrozen', null]]);
    expect(actions[0]?.simClockMs).toBe(1300);
    expect(actions[1]?.simClockMs).toBeCloseTo(30100 / 17, 8);
    const frozenAttempt = recorded.events.find(e => e.kind === 'stunned' && e.target === 'frozen');
    expect(frozenAttempt).toMatchObject({ kind: 'stunned', target: 'frozen' });
    expect(frozenAttempt?.simClockMs).toBeCloseTo(30100 / 17, 8);
    expect(recorded.result.playerTeam[0]?.life).toBe(490);
    assertReplay(input, recorded);
  });

  it('applies ordered hit statuses before lethal death finalization and ignores already dead targets', () => {
    const input = { ...snapshot(), enemyTeam: [
      { ...unit('already-dead', 'enemy'), life: 0 },
      { ...unit('lethal', 'enemy'), life: 1 }
    ] };
    const recorded = record(input);
    expect(recorded.events.filter(e => e.kind === 'damage' || e.kind === 'status' || e.kind === 'death').map(e =>
      e.kind === 'damage' ? ['hit', e.target, e.amount] : e.kind === 'status'
        ? ['status', e.target, e.statusId] : ['death', e.target]))
      .toEqual([['hit', 'lethal', 33], ['status', 'lethal', 'chill'], ['status', 'lethal', 'freeze'], ['death', 'lethal']]);
    expect(recorded.result.winner).toBe('player');
    assertReplay(input, recorded);
  });

  it.each([{ label: 'mana19', mana: 19, level: 6 }, { label: 'level5', mana: 20, level: 5 }])(
    'keeps $label ineligible without status or resource spending', ({ mana, level }) => {
      const input = quietTargets(withHero(snapshot(), { mana, level }), ['target']);
      const recorded = record(input);
      expect(recorded.events.filter(e => e.kind === 'action')).toEqual([
        expect.objectContaining({ actor: 'hero', skillId: null, simClockMs: 1300 })
      ]);
      expect(recorded.events.filter(e => e.kind === 'status' || e.kind === 'mana')).toEqual([]);
      expect(recorded.result.playerTeam[0]?.mana).toBe(mana);
      assertReplay(input, recorded);
    }
  );

  it('uses a basic action inside the three-second cooldown even with another cast affordable', () => {
    const input = quietTargets(withHero(snapshot(5, 1, 'trash', 250), {
      mana: 40, statuses: [hold(1001)]
    }), ['target']);
    const recorded = record(input);
    expect(recorded.events.filter(e => e.kind === 'action').map(e => [e.simClockMs, e.skillId]))
      .toEqual([[500, canonicalId], [1000, null]]);
    expect(recorded.events.filter(e => e.kind === 'mana').map(e => [e.simClockMs, e.mana]))
      .toEqual([[500, 20]]);
    assertReplay(input, recorded);
  });

  it.each([1, 20])('rank %s recasts at exact three-second cooldown expiry', rank => {
    const input = quietTargets(withHero(snapshot(5, rank, 'trash', 250), {
      mana: 40, statuses: [hold(501, 3500), hold(3501)]
    }), ['target']);
    const recorded = record(input);
    expect(recorded.events.filter(e => e.kind === 'action').map(e => [e.simClockMs, e.skillId]))
      .toEqual([[500, canonicalId], [3500, canonicalId]]);
    expect(recorded.events.filter(e => e.kind === 'mana').map(e => [e.simClockMs, e.mana]))
      .toEqual([[500, 20], [3500, 0]]);
    expect(recorded.result.playerTeam[0]?.mana).toBe(0);
    assertReplay(input, recorded);
  });

  it('keeps repeated and A/B/A seeded recordings and actual source inputs immutable', () => {
    const a = snapshot(5);
    const b = snapshot(1);
    const before = structuredClone({ a, b, data: sorceressSkills, skill: getSkill(canonicalId) });
    const firstA = record(a);
    const other = record(b);
    expect(firstA.events.filter(e => e.kind === 'status').map(e => e.statusId)).toEqual(['chill', 'freeze']);
    expect(other.events.filter(e => e.kind === 'status').map(e => e.statusId)).toEqual(['chill']);
    expect(runBattleRecorded(a)).toEqual(firstA);
    expect(runBattle(a)).toEqual(firstA.result);
    expect(runBattle(b)).toEqual(other.result);
    expect({ a, b, data: sorceressSkills, skill: getSkill(canonicalId) }).toEqual(before);
  });
});

describe('shared damage status list compatibility (explicit synthetic probes)', () => {
  it('draws for chances zero and one, keeps ordered per-target rolls and forwards stacks/DoT', () => {
    const id = 'fixture.ordered_statuses';
    registerSkill({ id, archetype: 'fixture', target: 'all-enemies', minLevel: 1, manaCost: 0, cooldown: 99,
      effects: [{ kind: 'damage', damageType: 'cold', base: [25, 35], applyStatuses: [
        { id: 'chill', chance: 0 }, { id: 'poison', chance: 1, stacksOnApply: 3, dotPctOfDamage: 0.1 }
      ] }] });
    const input = quietTargets(withHero(snapshot(), { skillOrder: [id] }), ['first', 'second']);
    const recorded = record(input);
    expect(recorded.events.filter(e => e.kind === 'damage').map(e => [e.target, e.amount])).toEqual([['first', 33], ['second', 32]]);
    expect(recorded.events.filter(e => e.kind === 'status').map(e => [e.target, e.statusId]))
      .toEqual([['first', 'poison'], ['second', 'poison']]);
    // Three stacks * floor(hit*.1)=3 per stack * five seconds, one damage resolution per target.
    expect(recorded.result.enemyTeam.map(target => target.life)).toEqual([422, 423]);
    expect(recorded.result.playerTeam[0]?.mana).toBe(20);
    assertReplay(input, recorded);
  });

  it('keeps scalar and a one-entry full list byte-equivalent, including downstream RNG and DoT', () => {
    const id = 'fixture.scalar_parity';
    const skill: RegisteredSkill = { id, archetype: 'fixture', target: 'all-enemies', minLevel: 1,
      manaCost: 8, cooldown: 99, effects: [{ kind: 'damage', damageType: 'fire', base: [30, 45],
        applyStatus: { id: 'burn', dotPctOfDamage: 0.1 } }] };
    registerSkill(skill);
    const input = quietTargets(withHero(snapshot(), { skillOrder: [id] }), ['first', 'second']);
    const scalar = record(input);
    registerSkill({ ...skill, effects: [{ kind: 'damage', damageType: 'fire', base: [30, 45],
      applyStatuses: [{ id: 'burn', dotPctOfDamage: 0.1 }] }] });
    expect(runBattleRecorded(input)).toEqual(scalar);
    assertReplay(input, scalar);
  });

  it.each([
    { id: 'skills-sorceress-fire-bolt', mana: 8, hit: 42, hp: 446, statuses: ['burn'] },
    { id: 'skills-amazon-plague-javelin', mana: 25, hit: 46, hp: 424, statuses: ['poison', 'plague'] }
  ])('preserves actual $id ordered payloads and exact direct/periodic HP', ({ id, mana, hit, hp, statuses }) => {
    const input = quietTargets(withHero(snapshot(), { level: 40, mana, skillOrder: [id], skillLevels: { [id]: 1 } }), ['target']);
    const recorded = record(input);
    expect(recorded.events.filter(e => e.kind === 'damage').map(e => e.amount)).toEqual([hit]);
    expect(recorded.events.filter(e => e.kind === 'status').map(e => e.statusId)).toEqual(statuses);
    expect(recorded.result.enemyTeam[0]?.life).toBe(hp);
    expect(recorded.result.playerTeam[0]?.mana).toBe(0);
    assertReplay(input, recorded);
  });

  it('preserves the real Amplify Damage debuff path', () => {
    const id = 'skills-necromancer-amplify-damage';
    const input = quietTargets(withHero(snapshot(), { level: 40, mana: 15, skillOrder: [id], skillLevels: { [id]: 1 } }), ['target']);
    const recorded = record(input);
    expect(recorded.events.filter(e => e.kind === 'damage')).toEqual([]);
    expect(recorded.events.filter(e => e.kind === 'status').map(e => [e.simClockMs, e.statusId]))
      .toEqual([[1300, 'amplify-damage']]);
    expect(recorded.result.enemyTeam[0]?.life).toBe(500);
    expect(recorded.result.playerTeam[0]?.mana).toBe(0);
    assertReplay(input, recorded);
  });
});
