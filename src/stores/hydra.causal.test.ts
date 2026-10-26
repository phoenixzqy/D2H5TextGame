import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from './combatHelpers';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { createRng } from '@/engine/rng';
import { useCombatStore } from './combatStore';
import { statusActiveAt } from '@/engine/combat/status';

function fixture(rank = 1): CombatSnapshot {
  const hero = playerToCombatUnit({ ...createMockPlayer('Synthetic Hydra', 'sorceress'),
    id: 'hero', level: 30, comboOrder: ['skills-sorceress-hydra'],
    skillLevels: { 'skills-sorceress-inferno': 1, 'skills-sorceress-blaze': 1,
      'skills-sorceress-fire-wall': 1, 'skills-sorceress-hydra': rank } });
  expect(hero.skillOrder.some(id => id === 'skills-sorceress-hydra' || id === 'sorceress.hydra')).toBe(true);
  const stats = { ...hero.stats, life: 5000, lifeMax: 5000, mana: 100, manaMax: 100,
    defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0, attackSpeed: 200,
    critChance: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } };
  const enemy: CombatUnit = { ...hero, id: 'target', name: 'target', kind: 'monster', side: 'enemy',
    stats: { ...stats, lifeMax: 100000 }, life: 100000, mana: 100, skillOrder: [], skillLevels: {},
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }], activeBuffIds: [], cooldowns: {} };
  return { seed: 19, playerTeam: [{ ...hero, stats, life: 5000, mana: 100, manaRegenPerSecond: 0,
    statuses: [{ id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1,
      dotPerStack: 400, damageType: 'poison' }] }], enemyTeam: [enemy] };
}

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { useCombatStore.getState().reset(); resetRegistry(); loadDefaultSkills(); });

function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  useCombatStore.getState().setRecordedBattle({ initialPlayerTeam: input.playerTeam, initialEnemyTeam: input.enemyTeam,
    unitNameMap: new Map([...input.playerTeam, ...input.enemyTeam].map(u => [u.id, u.name])),
    events: out.events, outcome: { winner: out.result.winner, finalPlayerTeam: out.result.playerTeam,
      finalEnemyTeam: out.result.enemyTeam } });
  for (const _event of out.events) useCombatStore.getState().advanceEvent();
  const end = out.events.at(-1)?.simClockMs ?? 0;
  const view = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana,
    statuses: u.life > 0 ? u.statuses.filter(s => statusActiveAt(s, end)) : [] }));
  expect(useCombatStore.getState().playbackComplete).toBe(true);
  expect(view(useCombatStore.getState().playerTeam)).toEqual(view(out.result.playerTeam));
  expect(view(useCombatStore.getState().enemyTeam)).toEqual(view(out.result.enemyTeam));
  return out;
}

it('native Hydra pays40MP at preparation and a separate multi-headed body attacks repeatedly', () => {
  const input = fixture(), before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  const summons = out.events.filter(e => e.kind === 'summon' && e.owner === 'hero' && e.summonId === 'hydra');
  expect(summons).toHaveLength(1);
  const spawned = summons[0];
  if (spawned?.kind !== 'summon') throw new Error('Missing paid Hydra body');
  expect(spawned.simClockMs).toBe(0);
  expect(spawned.unit.summonOwnerId).toBe('hero');
  const fire = out.events.filter(e => e.kind === 'damage' && e.source === spawned.unit.id && e.damageType === 'fire');
  expect(fire.length).toBeGreaterThan(3);
  expect(new Set(fire.map(e => e.simClockMs)).size).toBeGreaterThan(1);
  expect(Math.min(...fire.map(e => e.simClockMs))).toBeGreaterThan(0);
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'fire')).toEqual([]);
  expect(out.result.playerTeam.find(u => u.id === 'hero')?.mana).toBe(60);
});

it('native Hydra has a finite body lifetime with no same-wave replacement or refund', () => {
  const out = runBattleRecorded(fixture());
  const spawned = out.events.find(e => e.kind === 'summon' && e.summonId === 'hydra');
  expect(spawned).toBeDefined();
  if (spawned?.kind !== 'summon') throw new Error('Missing paid Hydra body');
  expect(out.events.filter(e => e.kind === 'death' && e.target === spawned.unit.id)).toEqual([
    expect.objectContaining({ simClockMs: 10000 })]);
  expect(out.events.filter(e => e.kind === 'damage' && e.source === spawned.unit.id && e.simClockMs >= 10000)).toEqual([]);
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'sorceress.hydra')).toHaveLength(1);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'summon-refund')).toEqual([]);
});

for (const rank of [1, 2, 20]) it.each([7, 19, 41])(
  `rank${String(rank)} Hydra uses three independent ordinary seeded Fire/crit/Burn decisions per body action, seed%i`, seed => {
    const input = fixture(rank), rng = createRng(seed), expected = [1700, 3400, 5100, 6800, 8500]
      .flatMap(simClockMs => Array.from({ length: 3 }, () => {
        const hit = rng.chance(.85), raw = hit ? rng.nextInt(95 + 9 * (rank - 1), 140 + 9 * (rank - 1)) : 0;
        const crit = hit && rng.chance(.05); if (hit) rng.chance(1);
        return { amount: Math.floor(raw * (crit ? 1.5 : 1)), crit, dodged: !hit, simClockMs };
      }));
    const out = record({ ...input, seed, playerTeam: input.playerTeam.map(u => ({ ...u,
      statuses: [...u.statuses, { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] })) });
    const spawned = out.events.find(e => e.kind === 'summon' && e.summonId === 'hydra');
    if (spawned?.kind !== 'summon') throw new Error('Missing paid body');
    expect(out.events.flatMap(e => e.kind === 'damage' && e.source === spawned.unit.id
      ? [{ amount: e.amount, crit: e.crit, dodged: e.dodged, simClockMs: e.simClockMs }] : [])).toEqual(expected);
    expect(out.events.filter(e => e.kind === 'action' && e.actor === spawned.unit.id).map(e => e.simClockMs))
      .toEqual([1700, 3400, 5100, 6800, 8500]);
    expect(out.events.filter(e => e.kind === 'status' && e.target === 'target' && e.statusId === 'burn'))
      .toHaveLength(expected.filter(e => !e.dodged).length);
    expect(out.result.playerTeam.find(u => u.id === 'hero')?.mana).toBe(60);
  });

it('expires before a body action tied at10000ms under real startup Chill', () => {
  registerSkill({ id: 'fixture.hydra-chill', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    manaCost: 0, cooldown: 100, summonOnStart: true,
    effects: [{ kind: 'debuff', statusId: 'chill', durationMs: 20000 }] });
  const input = fixture(), out = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u,
    skillOrder: ['fixture.hydra-chill'] })) });
  const spawned = out.events.find(e => e.kind === 'summon' && e.summonId === 'hydra');
  if (spawned?.kind !== 'summon') throw new Error('Missing paid body');
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status', target: spawned.unit.id,
    statusId: 'chill', simClockMs: 0 }));
  expect(out.events.filter(e => e.kind === 'action' && e.actor === spawned.unit.id).map(e => e.simClockMs))
    .toEqual([2000, 4000, 6000, 8000]);
  expect(out.events.filter(e => e.kind === 'death' && e.target === spawned.unit.id)).toEqual([
    expect.objectContaining({ simClockMs: 10000 })]);
});

it('uses captured owner Fire bonus, body critical stats and ordinary Fire resistance/Defense with Burn', () => {
  const input = fixture(2), rng = createRng(19), expected = [1700, 3400, 5100, 6800, 8500]
    .flatMap(simClockMs => Array.from({ length: 3 }, () => {
      const hit = rng.chance(.85), raw = hit ? rng.nextInt(104, 149) : 0;
      const crit = hit && rng.chance(.05); if (hit) rng.chance(1);
      return { amount: hit ? Math.max(1, Math.floor(raw * 1.8 * (crit ? 1.5 : 1) * .5 - 30)) : 0,
        crit, dodged: !hit, simClockMs };
    }));
  const out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    increasedDamagePct: { fire: .8 }, stats: { ...u.stats, attack: 99999, critChance: 1, critDamage: 99 },
    statuses: [...u.statuses, { id: 'freeze', sourceId: 'fixture', stacks: 1, remaining: -1 }] })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats, defense: 30, magicResist: 99999,
      resistances: { ...u.stats.resistances, fire: 50 } } })) });
  const spawn = out.events.find(e => e.kind === 'summon' && e.summonId === 'hydra');
  if (spawn?.kind !== 'summon') throw new Error('Missing paid Hydra');
  expect(spawn.unit.stats).toMatchObject({ attack: 0, critChance: .05, critDamage: 1.5 });
  expect(out.events.flatMap(e => e.kind === 'damage' && e.source === spawn.unit.id
    ? [{ amount: e.amount, crit: e.crit, dodged: e.dodged, simClockMs: e.simClockMs }] : [])).toEqual(expected);
  expect(out.events.some(e => e.kind === 'dot' && e.target === 'target' && e.amount > 0)).toBe(true);
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs > 0)).toEqual([]);
});

it('publishes its paid cooldown when the first head ends the wave and skips later heads', () => {
  const input = fixture(), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u,
      statuses: [...u.statuses, { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 1 })) });
  const spawn = out.events.find(e => e.kind === 'summon' && e.summonId === 'hydra');
  if (spawn?.kind !== 'summon') throw new Error('Missing paid Hydra');
  expect(out.result.winner).toBe('player');
  expect(out.events.filter(e => e.kind === 'damage' && e.source === spawn.unit.id)).toHaveLength(1);
  expect(out.events.at(-1)?.simClockMs).toBe(1700);
  expect(out.result.playerTeam.find(u => u.id === 'hero')?.cooldowns['sorceress.hydra']).toBe(2300);
  expect(out.result.playerTeam.find(u => u.id === 'hero')?.mana).toBe(60);
});

it('reselects a new living target between heads after a lethal bolt', () => {
  const input = fixture(), target = input.enemyTeam[0]; if (!target) throw new Error('Missing target');
  const out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    statuses: [...u.statuses, { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] })),
    enemyTeam: [{ ...target, life: 1 }, { ...target, id: 'target2' }] });
  const spawned = out.events.find(e => e.kind === 'summon' && e.summonId === 'hydra');
  if (spawned?.kind !== 'summon') throw new Error('Missing body');
  expect(out.events.filter(e => e.kind === 'damage' && e.source === spawned.unit.id && e.simClockMs === 1700)
    .map(e => e.kind === 'damage' ? e.target : '')).toEqual(['target', 'target2', 'target2']);
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'target')).toHaveLength(1);
});

it.each(['freeze', 'none', 'kill'] as const)('handles a real incoming %s on its body without refund or replacement', control => {
  registerSkill({ id: 'fixture.hydra-control', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    manaCost: 0, cooldown: 100, effects: [{ kind: 'damage', damageType: 'cold',
      base: control === 'kill' ? [1000, 1000] : [1, 1],
      ...(control === 'freeze' ? { applyStatus: { id: 'freeze', durationMs: 1500 } } : {}) }] });
  const input = fixture(), out = record({ ...input, seed: 19, enemyTeam: input.enemyTeam.map(u => ({ ...u,
    statuses: [], skillOrder: ['fixture.hydra-control'], stats: { ...u.stats, attack: 0, attackSpeed: 150 } })) });
  const spawned = out.events.find(e => e.kind === 'summon' && e.summonId === 'hydra');
  if (spawned?.kind !== 'summon') throw new Error('Missing body');
  const hit = out.events.find(e => e.kind === 'damage' && e.source === 'target' && e.target === spawned.unit.id);
  expect(hit).toMatchObject({ simClockMs: 1300, dodged: false });
  if (control === 'freeze') expect(out.events).toContainEqual(expect.objectContaining({
    kind: 'status', target: spawned.unit.id, statusId: 'freeze', simClockMs: 1300 }));
  const actions = out.events.filter(e => e.kind === 'action' && e.actor === spawned.unit.id);
  expect(actions[0]?.simClockMs).toBe(control === 'kill' ? undefined : control === 'freeze' ? 3400 : 1700);
  if (control === 'kill') expect(out.events.filter(e => e.kind === 'death' && e.target === spawned.unit.id))
    .toEqual([expect.objectContaining({ simClockMs: 1300 })]);
  expect(out.events.filter(e => e.kind === 'summon' && e.summonId === 'hydra')).toHaveLength(1);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'summon-refund')).toEqual([]);
});

it('cascades owner death once before the body can attack', () => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, life: 400 })) });
  const spawned = out.events.find(e => e.kind === 'summon' && e.summonId === 'hydra');
  if (spawned?.kind !== 'summon') throw new Error('Missing paid body');
  expect(out.events.filter(e => e.kind === 'death').map(e => [e.simClockMs, e.target]))
    .toEqual([[1000, 'hero'], [1000, spawned.unit.id]]);
  expect(out.events.filter(e => e.kind === 'damage' && e.source === spawned.unit.id)).toEqual([]);
});

it('deduplicates authored/canonical startup aliases and overwrites only its own carried cooldown', () => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    skillOrder: ['skills-sorceress-hydra', 'sorceress.hydra'],
    cooldowns: { 'sorceress.hydra': 99999, 'fixture.unrelated': 99999 } })) });
  expect(out.events.filter(e => e.kind === 'summon' && e.summonId === 'hydra')).toHaveLength(1);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  expect(out.result.playerTeam.find(u => u.id === 'hero')?.cooldowns['fixture.unrelated']).toBeGreaterThan(0);
});

it('never retries an initially unaffordable Hydra after actual mana regeneration', () => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    mana: 39, manaRegenPerSecond: 100 })) });
  expect(out.events.filter(e => e.kind === 'summon' && e.summonId === 'hydra')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'sorceress.hydra')).toEqual([]);
  expect(out.events.some(e => e.kind === 'mana' && e.reason === 'regeneration')).toBe(true);
});

it.each(['zero-rank', 'absent-rank', 'fractional-rank', 'over-cap', 'below-unlock', 'merc', 'summon', 'unlearned'] as const)(
  'refuses malformed native %s authority before payment', invalid => {
    const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => {
      const changed = { ...u,
        ...(invalid === 'zero-rank' ? { hydraRank: 0 } : {}),
        ...(invalid === 'fractional-rank' ? { hydraRank: 1.5 } : {}),
        ...(invalid === 'over-cap' ? { hydraRank: 21 } : {}),
        ...(invalid === 'below-unlock' ? { level: 29 } : {}),
        ...(invalid === 'merc' ? { kind: 'merc' as const } : {}),
        ...(invalid === 'summon' ? { kind: 'summon' as const, summon: true, summonOwnerId: 'foreign' } : {}),
        ...(invalid === 'unlearned' ? { skillLevels: {} } : {}) };
      if (invalid === 'absent-rank') delete changed.hydraRank;
      return changed;
    }) });
    expect(out.events.filter(e => e.kind === 'summon' && e.summonId === 'hydra')).toEqual([]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  });

it.each(['free', 'wrong-target', 'ordinary-cast', 'instant-damage', 'extra-effect'] as const)(
  'rejects contradictory %s registry overrides before debit', invalid => {
    const skill = getSkill('sorceress.hydra'); if (!skill) throw new Error('Missing Hydra');
    registerSkill({ ...skill,
      ...(invalid === 'free' ? { manaCost: 0 } : {}),
      ...(invalid === 'wrong-target' ? { target: 'all-enemies' as const } : {}),
      ...(invalid === 'ordinary-cast' ? { summonOnStart: false } : {}),
      ...(invalid === 'instant-damage' ? { effects: [{ kind: 'damage' as const, damageType: 'fire' as const, base: [95, 140] as const }] } : {}),
      ...(invalid === 'extra-effect' ? { effects: [...skill.effects, { kind: 'buff' as const, id: 'foreign', duration: -1 }] } : {}) });
    const out = record(fixture());
    expect(out.events.filter(e => e.kind === 'summon' && e.summonId === 'hydra')).toEqual([]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  });

it('ignores a preloaded template marker and reserves its runtime ID without granting Fire authority', () => {
  const input = fixture(), hero = input.playerTeam[0]; if (!hero) throw new Error('Missing hero');
  const fake: CombatUnit = { ...hero, id: 'hero-summon-hydra-1', name: 'hydra', kind: 'summon', summon: true,
    summonOwnerId: 'hero', summonTemplateId: 'hydra', skillOrder: [], statuses: [],
    stats: { ...hero.stats, attack: 0 } };
  const out = record({ ...input, playerTeam: [...input.playerTeam, fake] });
  const spawned = out.events.find(e => e.kind === 'summon' && e.summonId === 'hydra');
  if (spawned?.kind !== 'summon') throw new Error('Missing paid body');
  expect(spawned.unit.id).toBe('hero-summon-hydra-2');
  expect(out.events.filter(e => e.kind === 'damage' && e.source === fake.id && e.damageType === 'fire')).toEqual([]);
  expect(out.events.some(e => e.kind === 'damage' && e.source === spawned.unit.id && e.damageType === 'fire')).toBe(true);
});
