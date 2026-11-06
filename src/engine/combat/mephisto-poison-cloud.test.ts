import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { monsters } from '../../data';
import { createRng } from '../rng';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { actionPeriodMs, runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { CombatUnit } from './types';

const cases = [
  { id: 'monsters/act3.mephisto', skill: 'monster-mephisto-poison-cloud', stacks: 3 },
  { id: 'monsters/act3.swamp-dweller', skill: 'monster-poison-cloud', stacks: 1 }
] as const;

// Diagnostic single-skill tanks isolate the actual authored payload, not earned balance.
function fixture(spec: typeof cases[number], casts = 1): CombatSnapshot {
  const def = monsters.find(row => row.id === spec.id);
  if (!def) throw new Error('Missing native cloud source');
  const native = buildMonsterUnit({ def, level: 40, tier: 'boss', id: 'enemy', rng: createRng(13) });
  expect(native.skillOrder).toContain(spec.skill);
  const period = actionPeriodMs(native.stats.attackSpeed);
  const enemy: CombatUnit = { ...native, skillOrder: [spec.skill],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1,
      appliedAtMs: (2 * casts - 1) * period + 1 }] };
  const hero: CombatUnit = { ...native, id: 'hero', kind: 'hero', side: 'player',
    life: 100_000, mana: 0, skillOrder: [], statusImmunities: [],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    stats: { ...native.stats, attack: 0, life: 100_000, lifeMax: 100_000,
      defense: 0, magicResist: 2, physDodge: 0, magicDodge: 0,
      resistances: { physical: 25, fire: 25, cold: 25, lightning: 25, poison: 25, arcane: 25 } } };
  return { seed: 13, act: 3, enemyTeam: [enemy], playerTeam: [hero,
    { ...hero, id: 'merc', kind: 'merc' },
    { ...hero, id: 'summon', kind: 'summon', summonOwnerId: 'hero' }] };
}

function record(input: CombatSnapshot) {
  const before = structuredClone(input), output = runBattleRecorded(input);
  expect(runBattle(input)).toEqual(output.result);
  expect(runBattleRecorded(input)).toEqual(output);
  expect(input).toEqual(before);
  return output;
}

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe.each(cases)('native $skill', spec => {
  it('resolves aliases and spell delivery with the specified authored stack count', () => {
    const skill = getSkill(spec.skill);
    expect(getSkill('monster.' + spec.skill.slice(8).replaceAll('-', '_'))).toBe(skill);
    if (!skill) throw new Error('Missing installed cloud');
    expect(getSkillDamageDelivery(skill)).toBe('spell');
    expect(skill).toMatchObject({ target: 'all-enemies', cooldown: 3, manaCost: 0,
      effects: [{ kind: 'damage', damageType: 'poison', base: [15, 25],
        applyStatus: { id: 'poison', chance: 1, stacksOnApply: spec.stacks,
          dotPctOfDamage: .05, durationMs: 5000 } }] });
  });

  it('pays every stack through finite periodic integration and expiry on the whole party', () => {
    const input = fixture(spec), output = record(input);
    const hits = output.events.filter(event => event.kind === 'damage' && event.source === 'enemy');
    expect(hits).toHaveLength(3);
    expect(hits.some(event => event.kind === 'damage' && !event.dodged && event.amount > 0)).toBe(true);
    for (const hit of hits) {
      if (hit.kind !== 'damage') throw new Error('Missing cloud hit');
      const dots = output.events.filter(event => event.kind === 'dot' && event.target === hit.target);
      if (hit.dodged) { expect(dots).toEqual([]); continue; }
      const rate = Math.max(1, Math.floor(hit.amount * .05));
      const observed = output.events.find(event => event.kind === 'status-state' &&
        event.target === hit.target && event.statuses.some(status => status.id === 'poison'));
      if (observed?.kind !== 'status-state') throw new Error('Missing accepted poison');
      expect(observed.statuses.find(status => status.id === 'poison')).toMatchObject({
        stacks: spec.stacks, sourceId: 'enemy', dotPerStack: rate,
        appliedAtMs: hit.simClockMs, expiresAtMs: hit.simClockMs + 5000
      });
      expect(dots.reduce((sum, event) => sum + (event.kind === 'dot' ? event.amount : 0), 0))
        .toBe(spec.stacks * rate * 5);
      expect(dots.every(event => event.simClockMs > hit.simClockMs &&
        event.simClockMs <= hit.simClockMs + 5000)).toBe(true);
    }
    expect(output.result.playerTeam.every(unit => unit.statuses.every(status => status.id !== 'poison'))).toBe(true);
  });

  it('applies no poison or periodic damage on magical misses or status immunity', () => {
    for (const defense of ['dodge', 'immunity'] as const) {
      const input = fixture(spec);
      const output = record({ ...input, playerTeam: input.playerTeam.map(unit => ({ ...unit,
        ...(defense === 'immunity' ? { statusImmunities: ['poison'] as const } : {}),
        stats: { ...unit.stats, magicDodge: defense === 'dodge' ? 1 : 0 }
      })) });
      const hits = output.events.filter(event => event.kind === 'damage');
      expect(hits).toHaveLength(3);
      if (defense === 'dodge') expect(hits.every(event => event.dodged)).toBe(true);
      else expect(hits.some(event => !event.dodged && event.amount > 0)).toBe(true);
      expect(output.events.filter(event => event.kind === 'dot' ||
        event.kind === 'status' && event.statusId === 'poison')).toEqual([]);
      expect(output.events.some(event => event.kind === 'status-state' &&
        event.statuses.some(status => status.id === 'poison'))).toBe(false);
    }
  });
});

it('refreshes three-stack applications up to the existing ten-stack cap without replacing first potency', () => {
  const input = fixture(cases[0], 5), output = record(input);
  let capped = 0;
  for (const unit of input.playerTeam) {
    let stacks = 0, expires = 0, firstAt = 0, firstRate = 0;
    const hits = output.events.filter(event => event.kind === 'damage' && event.damageType === 'poison' && event.target === unit.id && !event.dodged);
    for (const hit of hits) {
      if (hit.kind !== 'damage') throw new Error('Missing cloud hit');
      if (hit.simClockMs >= expires) { stacks = 0; firstAt = hit.simClockMs; firstRate = Math.max(1, Math.floor(hit.amount * .05)); }
      stacks = Math.min(10, stacks + 3); expires = hit.simClockMs + 5000;
      const observed = output.events.find(event => event.kind === 'status-state' &&
        event.target === unit.id && event.simClockMs === hit.simClockMs &&
        event.statuses.some(status => status.id === 'poison'));
      if (observed?.kind !== 'status-state') throw new Error('Missing refreshed poison');
      expect(observed.statuses.find(status => status.id === 'poison')).toMatchObject({
        stacks, dotPerStack: firstRate, appliedAtMs: firstAt, expiresAtMs: expires
      });
      if (stacks === 10) capped++;
    }
  }
  expect(capped).toBeGreaterThan(0);
});
