import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { monsters } from '../../data';
import { createRng } from '../rng';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { actionPeriodMs, runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { CombatUnit } from './types';

const spells = [
  { authored: 'monster-diablo-fire-breath', canonical: 'monster.diablo_fire_breath', type: 'fire',
    status: 'ignite', stacks: 3, duration: 3000, cooldown: 5 },
  { authored: 'monster-diablo-lightning', canonical: 'monster.diablo_lightning', type: 'lightning',
    status: 'paralyze', stacks: 1, duration: 1000, cooldown: 4 }
] as const;

// One real native cast then a future fixture stun isolates payload and finite expiry.
// Seven explicit grid controls prove the cone/cap; none is an earned character.
function fixture(spec: typeof spells[number]): CombatSnapshot {
  const def = monsters.find(row => row.id === 'monsters/act4.diablo');
  if (!def) throw new Error('Missing native Diablo');
  const native = buildMonsterUnit({ def, level: 40, tier: 'boss', id: 'enemy', rng: createRng(13) });
  expect(native.skillOrder).toContain(spec.authored);
  const at = actionPeriodMs(native.stats.attackSpeed);
  const enemy: CombatUnit = { ...native, skillOrder: [spec.authored],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1, appliedAtMs: at + 1 }] };
  const playerTeam: CombatUnit[] = [[0, 2], [1, 1], [1, 2], [1, 3], [2, 0], [2, 1], [6, 6]].map((pos, index) => ({
    ...native, id: 'target' + String(index), kind: index === 0 ? 'hero' : index === 1 ? 'merc' : 'summon',
    ...(index > 1 ? { summonOwnerId: 'target0' } : {}), side: 'player',
    gridPosition: { row: pos[0] ?? 0, col: pos[1] ?? 0 }, life: 100_000, mana: 0,
    skillOrder: [], statusImmunities: [],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    stats: { ...native.stats, attack: 0, life: 100_000, lifeMax: 100_000,
      defense: 0, magicResist: 2, physDodge: 0, magicDodge: 0,
      resistances: { physical: 25, fire: 25, cold: 25, lightning: 25, arcane: 25, poison: 25 } }
  }));
  return { seed: 13, act: 4, enemyTeam: [enemy], playerTeam };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(input).toEqual(before);
  return out;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe.each(spells)('native $authored', spec => {
  it('installs both aliases as a zero-mana spell with the authored geometry and payload', () => {
    const skill = getSkill(spec.authored);
    expect(getSkill(spec.canonical)).toBe(skill);
    if (!skill) throw new Error('Missing installed cone');
    expect(getSkillDamageDelivery(skill)).toBe('spell');
    expect(skill).toMatchObject({ target: 'area-enemies', aoeShape: 'cone-3', maxTargets: 5,
      cooldown: spec.cooldown, manaCost: 0, minLevel: 1,
      effects: [{ kind: 'damage', damageType: spec.type, base: [40, 60],
        applyStatus: { id: spec.status, chance: 1, stacksOnApply: spec.stacks, durationMs: spec.duration,
          ...(spec.type === 'fire' ? { dotPctOfDamage: .1 } : {}) } }] });
  });

  it('hits only five targets inside the cone and pays landed status potency through exact expiry', () => {
    const input = fixture(spec), out = record(input);
    const hits = out.events.filter((event): event is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
      event.kind === 'damage' && event.source === 'enemy');
    expect(hits.map(hit => hit.target)).toEqual(['target0', 'target1', 'target2', 'target3', 'target4']);
    expect(hits.some(hit => !hit.dodged && hit.amount > 0)).toBe(true);
    expect(out.events.filter(event => event.kind === 'action' && event.actor === 'enemy')).toHaveLength(1);
    for (const hit of hits) {
      expect(hit.simClockMs).toBe(1380);
      const dots = out.events.filter(event => event.kind === 'dot' && event.target === hit.target);
      if (hit.dodged) { expect(dots).toEqual([]); continue; }
      const rate = Math.max(1, Math.floor(hit.amount * .1));
      const state = out.events.find(event => event.kind === 'status-state' && event.target === hit.target &&
        event.simClockMs === hit.simClockMs && event.statuses.some(status => status.id === spec.status));
      if (state?.kind !== 'status-state') throw new Error('Missing accepted status');
      expect(state.statuses.find(status => status.id === spec.status)).toMatchObject({
        stacks: spec.stacks, sourceId: 'enemy', appliedAtMs: hit.simClockMs,
        expiresAtMs: hit.simClockMs + spec.duration, ...(spec.type === 'fire' ? { dotPerStack: rate } : {})
      });
      const expired = out.events.find(event => event.kind === 'status-state' && event.target === hit.target &&
        event.simClockMs === hit.simClockMs + spec.duration);
      if (expired?.kind !== 'status-state') throw new Error('Missing exact status expiry');
      expect(expired.statuses.some(status => status.id === spec.status)).toBe(false);
      if (spec.type === 'fire') {
        expect(dots.reduce((sum, event) => sum + (event.kind === 'dot' ? event.amount : 0), 0)).toBe(3 * rate * 3);
        expect(dots.every(event => event.simClockMs > hit.simClockMs && event.simClockMs <= hit.simClockMs + 3000)).toBe(true);
      } else expect(dots).toEqual([]);
    }
    expect(out.result.playerTeam.every(unit => unit.statuses.every(status => status.id !== spec.status))).toBe(true);
  });

  it('applies no status or DoT to missed targets while retaining the ordinary hit floor', () => {
    const base = fixture(spec);
    const out = record({ ...base, playerTeam: base.playerTeam.map(unit => ({ ...unit,
      stats: { ...unit.stats, magicDodge: 1 } })) });
    const hits = out.events.filter(event => event.kind === 'damage');
    expect(hits).toHaveLength(5);
    const misses = hits.filter(hit => hit.dodged);
    expect(misses.length).toBeGreaterThan(0);
    // High dodge still permits the engine's 5% minimum hit chance.
    for (const miss of misses) {
      expect(miss.amount).toBe(0);
      expect(out.events.some(event => (event.kind === 'dot' || event.kind === 'status' &&
        event.statusId === spec.status) && event.target === miss.target)).toBe(false);
      expect(out.events.some(event => event.kind === 'status-state' && event.target === miss.target &&
        event.statuses.some(status => status.id === spec.status))).toBe(false);
    }
  });

  it('keeps Fire/Lightning effects under unrelated supported Freeze/Poison/Plague immunities', () => {
    const base = fixture(spec);
    const out = record({ ...base, playerTeam: base.playerTeam.map(unit => ({ ...unit,
      statusImmunities: ['freeze', 'poison', 'plague'] as const })) });
    const hits = out.events.filter(event => event.kind === 'damage');
    expect(hits).toHaveLength(5);
    expect(hits.some(hit => !hit.dodged && hit.amount > 0)).toBe(true);
    expect(out.events.some(event => event.kind === 'status-state' &&
      event.statuses.some(status => status.id === spec.status))).toBe(true);
    const control = record(base);
    expect(out.events).toEqual(control.events);
    expect(out.result).toEqual({ ...control.result, playerTeam: control.result.playerTeam.map(unit => ({
      ...unit, statusImmunities: ['freeze', 'poison', 'plague']
    })) });
  });
});

it('leaves generic Fire Breath/Lightning and native Bone Prison/Charge contracts unchanged', () => {
  expect(getSkill('monster-fire-breath')).toMatchObject({ cooldown: 3, target: 'area-enemies',
    effects: [{ kind: 'damage', damageType: 'fire', base: [40, 60], applyStatus: { id: 'ignite', dotPctOfDamage: .1 } }] });
  expect(getSkill('monster-lightning')).toMatchObject({ cooldown: 2, target: 'single-enemy',
    effects: [{ kind: 'damage', damageType: 'lightning', base: [40, 60],
      applyStatus: { id: 'paralyze', stacksOnApply: 1, durationMs: 1000 } }] });
  expect(getSkill('monster-bone-prison')).toMatchObject({ cooldown: 4, target: 'single-enemy',
    effects: [{ kind: 'damage', damageType: 'arcane', base: [10, 20] }] });
  expect(getSkill('monster-charge')).toMatchObject({ cooldown: 4, target: 'single-enemy',
    effects: [{ kind: 'damage', damageType: 'physical', base: [60, 90], attackDamagePct: 100 }] });
});
