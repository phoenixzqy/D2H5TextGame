import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { monsters } from '../../data';
import { createRng } from '../rng';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { actionPeriodMs, runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { CombatUnit } from './types';

const spells = [
  { authored: 'monster-baal-frost-nova', canonical: 'monster.baal_frost_nova', type: 'cold', status: 'freeze', cooldown: 5 },
  { authored: 'monster-baal-inferno', canonical: 'monster.baal_inferno', type: 'fire', status: 'ignite', cooldown: 3 },
  { authored: 'monster-baal-mana-rift', canonical: 'monster.baal_mana_rift', type: 'arcane', status: 'mana-burn', cooldown: 3 }
] as const;

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

function fixture(spec: typeof spells[number]): CombatSnapshot {
  const def = monsters.find(row => row.id === 'monsters/act5.baal');
  if (!def) throw new Error('Missing native Baal');
  const native = buildMonsterUnit({ def, level: 82, tier: 'boss', id: 'enemy', rng: createRng(13) });
  const at = actionPeriodMs(native.stats.attackSpeed);
  const enemy: CombatUnit = { ...native, skillOrder: [spec.authored],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1, appliedAtMs: at + 1 }] };
  const playerTeam: CombatUnit[] = [[0, 2], [1, 1], [1, 2], [1, 3], [2, 0], [2, 1], [6, 6]].map((pos, index) => ({
    ...native, id: 'target' + String(index), kind: index === 0 ? 'hero' : index === 1 ? 'merc' : 'summon',
    ...(index > 1 ? { summonOwnerId: 'target0' } : {}), side: 'player', tier: 'trash',
    gridPosition: { row: pos[0] ?? 0, col: pos[1] ?? 0 }, life: 100_000, mana: 1000,
    skillOrder: [], statusImmunities: [],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    stats: { ...native.stats, attack: 0, life: 100_000, lifeMax: 100_000,
      mana: 1000, manaMax: 1000, defense: 40, magicResist: 2, physDodge: 0, magicDodge: 0,
      resistances: { physical: 25, fire: 25, cold: 25, lightning: 25, arcane: 25, poison: 25 } }
  }));
  return { seed: 13, act: 5, enemyTeam: [enemy], playerTeam };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  return out;
}

describe.each(spells)('native $authored', spec => {
  it('installs an immutable zero-mana spell with the required status', () => {
    const skill = getSkill(spec.authored);
    expect(getSkill(spec.canonical)).toBe(skill);
    if (!skill) throw new Error('Missing native Baal spell');
    expect(getSkillDamageDelivery(skill)).toBe('spell');
    expect(skill).toMatchObject({ archetype: 'monster', cooldown: spec.cooldown, manaCost: 0 });
    const effect = skill.effects[0];
    if (effect?.kind !== 'damage') throw new Error('Missing native damage');
    expect(effect.damageType).toBe(spec.type);
    expect(effect.applyStatuses?.[0]?.id ?? effect.applyStatus?.id).toBe(spec.status);
    for (const value of [skill, skill.effects, effect, effect.base]) expect(Object.isFrozen(value)).toBe(true);
    if (spec.type === 'cold') expect(effect.perMonsterLevel).toEqual([1, 2]);
    if (spec.type === 'fire') expect(skill).toMatchObject({ target: 'area-enemies', aoeShape: 'cone-3', maxTargets: 5 });
    else expect(skill.target).toBe('all-enemies');
  });

  it('pays only landed statuses, finite Freeze/Burn/Melt expiry and actual Mana Burn debits', () => {
    const input = fixture(spec), out = record(input);
    const hits = out.events.filter((event): event is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
      event.kind === 'damage' && event.source === 'enemy');
    expect(hits.map(hit => hit.target)).toEqual(spec.type === 'fire'
      ? ['target0', 'target1', 'target2', 'target3', 'target4']
      // Native all-enemy resolution prioritizes player summons, then hero/merc.
      : ['target2', 'target3', 'target4', 'target5', 'target6', 'target0', 'target1']);
    expect(hits.some(hit => !hit.dodged && hit.amount > 0)).toBe(true);
    expect(out.events.filter(event => event.kind === 'action' && event.actor === 'enemy')).toHaveLength(1);
    for (const hit of hits) {
      const state = out.events.find(event => event.kind === 'status-state' && event.target === hit.target &&
        event.simClockMs === hit.simClockMs && event.statuses.some(status => status.id === spec.status));
      if (hit.dodged) { expect(state).toBeUndefined(); continue; }
      if (state?.kind !== 'status-state') throw new Error('Missing landed status');
      expect(state.statuses.find(status => status.id === spec.status)).toMatchObject({ sourceId: 'enemy',
        stacks: spec.type === 'fire' ? 5 : 1, appliedAtMs: hit.simClockMs });
      if (spec.type === 'arcane') {
        expect(out.events).toContainEqual(expect.objectContaining({ kind: 'mana', target: hit.target,
          simClockMs: hit.simClockMs, reason: 'mana-burn', mana: 1000 - Math.floor(hit.amount * .2) }));
      } else {
        const duration = spec.type === 'cold' ? 1000 : 3000;
        expect(state.statuses.find(status => status.id === spec.status)?.expiresAtMs).toBe(hit.simClockMs + duration);
        const expiry = out.events.find(event => event.kind === 'status-state' && event.target === hit.target &&
          event.simClockMs === hit.simClockMs + duration);
        if (expiry?.kind !== 'status-state') throw new Error('Missing exact finite expiry');
        expect(expiry.statuses.some(status => status.id === spec.status || status.id === 'armor-melt')).toBe(false);
        if (spec.type === 'fire') {
          const melted = out.events.find(event => event.kind === 'status-state' && event.target === hit.target &&
            event.simClockMs === hit.simClockMs && event.statuses.some(status => status.id === 'armor-melt'));
          if (melted?.kind !== 'status-state') throw new Error('Missing landed Armor Melt');
          expect(melted.statuses).toContainEqual(expect.objectContaining({
            id: 'armor-melt', sourceId: 'enemy', expiresAtMs: hit.simClockMs + 3000 }));
          const dots = out.events.filter(event => event.kind === 'dot' && event.target === hit.target);
          expect(dots.reduce((sum, event) => sum + (event.kind === 'dot' ? event.amount : 0), 0))
            .toBe(5 * Math.max(1, Math.floor(hit.amount * .1)) * 3);
        }
      }
    }
  });

  it('does not apply status or drain Mana on missed impacts', () => {
    const base = fixture(spec);
    const out = record({ ...base, playerTeam: base.playerTeam.map(unit => ({ ...unit,
      stats: { ...unit.stats, magicDodge: 1 } })) });
    const misses = out.events.filter((event): event is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
      event.kind === 'damage' && event.dodged);
    expect(misses.length).toBeGreaterThan(0);
    for (const miss of misses) {
      expect(out.events.some(event => (event.kind === 'status' || event.kind === 'dot' ||
        event.kind === 'mana' && event.reason === 'mana-burn') && event.target === miss.target)).toBe(false);
    }
  });
});

it('preserves shared Frost Nova and Inferno while Tentacles uses its authored summon payload', () => {
  expect(getSkill('monster-frost-nova')).toMatchObject({ cooldown: 3, effects: [{ applyStatus: { id: 'chill' } }] });
  expect(getSkill('monster-inferno')).toMatchObject({ target: 'all-enemies', effects: [{ applyStatus: { id: 'ignite', stacksOnApply: 1 } }] });
  expect(getSkill('monster-tentacles')).toMatchObject({ target: 'summon', effects: [{ kind: 'summon', count: 5, maxCount: 5 }] });
});
