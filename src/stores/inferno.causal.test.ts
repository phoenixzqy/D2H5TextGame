import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from './combatHelpers';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { createRng } from '@/engine/rng';
import { payPeriodicSpell } from '@/engine/skills/periodic-spells';
import { rebaseStatusClock, statusActiveAt } from '@/engine/combat/status';
import { useCombatStore } from './combatStore';
import { composeStatAura } from '@/engine/skills/stat-auras';

function fixture(rank = 1): CombatSnapshot {
  const hero = playerToCombatUnit({ ...createMockPlayer('Synthetic Inferno', 'sorceress'),
    id: 'hero', level: 30, comboOrder: ['skills-sorceress-inferno'],
    skillLevels: { 'skills-sorceress-inferno': rank } });
  const stats = { ...hero.stats, life: 1400, lifeMax: 1400, mana: 100, manaMax: 100,
    defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0, attackSpeed: 200,
    critChance: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } };
  const enemy: CombatUnit = { ...hero, id: 'target', name: 'target', kind: 'monster', side: 'enemy',
    stats: { ...stats, lifeMax: 10000 }, life: 10000, mana: 100, skillOrder: [], skillLevels: {},
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }], activeBuffIds: [], cooldowns: {} };
  return { seed: 19, playerTeam: [{ ...hero, stats, life: 1400, mana: 100, manaRegenPerSecond: 0,
    statuses: [{ id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1,
      dotPerStack: 400, damageType: 'poison' }] }], enemyTeam: [enemy] };
}

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { useCombatStore.getState().reset(); resetRegistry(); loadDefaultSkills(); });

it('native Inferno pays once and streams Fire between occupied caster action opportunities', () => {
  const input = fixture(), before = structuredClone(input), r = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(r.result);
  expect(runBattleRecorded(input)).toEqual(r);
  expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'fire')
    .map(e => e.simClockMs)).toEqual([900, 1900, 2900]);
  expect(r.events.filter(e => e.kind === 'action' && e.actor === 'hero')).toEqual([
    expect.objectContaining({ skillId: 'sorceress.inferno', simClockMs: 900 })
  ]);
  expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero').map(e => e.simClockMs))
    .toEqual([900, 1900, 2900]);
  expect(r.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  expect(r.result.playerTeam[0]?.mana).toBe(90);
});

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

for (const rank of [1, 2, 20]) it.each([7, 19, 41, 97])(
  `rank${String(rank)} Inferno uses independent ordinary seeded hit/base/crit/Burn rolls, seed%i`, seed => {
    const rng = createRng(seed), expected = [900, 1900, 2900].map(simClockMs => {
      const hit = rng.chance(.85);
      const amount = hit ? rng.nextInt(35 + 4 * (rank - 1), 55 + 4 * (rank - 1)) : 0;
      if (hit) { rng.chance(0); rng.chance(1); }
      return { amount, dodged: !hit, crit: false, simClockMs };
    });
    const r = record({ ...fixture(rank), seed });
    expect(r.events.flatMap(e => e.kind === 'damage' && e.source === 'hero'
      ? [{ amount: e.amount, dodged: e.dodged, crit: e.crit, simClockMs: e.simClockMs }] : [])).toEqual(expected);
    expect(r.result.playerTeam[0]?.mana).toBe(90);
    expect(r.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
    expect(r.events.filter(e => e.kind === 'status' && e.target === 'target' && e.statusId === 'burn'))
      .toHaveLength(expected.filter(e => !e.dodged).length);
  });

it.each(['freeze', 'stun', 'paralyze', 'howl'])('cancels on a short real %s between pulses', id => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, life: 1000,
    statuses: [...u.statuses, { id, sourceId: 'fixture', stacks: 1, remaining: .1,
      appliedAtMs: 1400, expiresAtMs: 1500 }] })) });
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'fire')
    .map(e => e.simClockMs)).toEqual([900]);
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero' && e.skillId === null)
    .map(e => e.simClockMs)).toEqual([1800]);
});

it.each(['chill', 'blind', 'armor-melt'])('keeps streaming through nonblocking %s', id => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    statuses: [...u.statuses, { id, sourceId: 'fixture', stacks: 1, remaining: .1,
      appliedAtMs: 1400, expiresAtMs: 1500 }] })) });
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero').map(e => e.simClockMs))
    .toEqual([900, 1900, 2900]);
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero')).toHaveLength(1);
});

it.each([1900, 2900])('new blocking control cancels before a pulse tied at %ims', at => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    statuses: [...u.statuses, { id: 'freeze', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: at }] })) });
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero').map(e => e.simClockMs))
    .toEqual(at === 1900 ? [900] : [900, 1900]);
});

it('uses the densest one-plus-three-cell cone, then reselects after the anchor dies', () => {
  const input = fixture(), enemy = input.enemyTeam[0];
  if (!enemy) throw new Error('Missing cone target');
  const cells = [[0, 1], [1, 0], [1, 1], [1, 2], [4, 1]] as const;
  const out = record({ ...input, enemyTeam: cells.map(([row, col], i) => ({ ...enemy,
    id: 'target' + String(i), life: i === 0 ? 1 : 10000, gridPosition: { row, col } })) });
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.simClockMs === 900)
    .map(e => e.kind === 'damage' ? e.target : '')).toEqual(['target0', 'target1', 'target2', 'target3']);
  for (const at of [1900, 2900]) expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.simClockMs === at)
    .map(e => e.kind === 'damage' ? e.target : '')).toEqual(['target1']);
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'target0')).toHaveLength(1);
});

it.each([1000, 1900])('stops when source death settles at %ims', at => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, life: at * .4 })) });
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero').map(e => e.simClockMs)).toEqual([900]);
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'hero')).toEqual([
    expect.objectContaining({ simClockMs: at })]);
  expect(out.result.winner).toBe('enemy');
});

it('carries frozen paid rank/phase without wave-zero replay and occupies turns until exact expiry', () => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u =>
    rebaseStatusClock(payPeriodicSpell({ ...u, skillOrder: [], life: 1400 }, 'inferno', 20, 0), 1000)) });
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'fire')
    .map(e => e.simClockMs)).toEqual([1000]);
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero').map(e => e.simClockMs)).toEqual([2700]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  const rng = createRng(19); expect(rng.chance(.85)).toBe(true);
  expect(out.events.find(e => e.kind === 'damage' && e.damageType === 'fire')).toMatchObject({ amount: rng.nextInt(111, 131) });
});

it.each(['no-mana', 'unlearned', 'below-unlock', 'wrong-class', 'merc', 'summon', 'absent-projected-rank'] as const)(
  'refuses %s native cast authority', invalid => {
    const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
      ...(invalid === 'no-mana' ? { mana: 0 } : {}),
      ...(invalid === 'unlearned' ? { periodicSpellRanks: { inferno: 0, 'fire-wall': 0, 'thunder-storm': 0 } } : {}),
      ...(invalid === 'below-unlock' ? { level: 5 } : {}),
      ...(invalid === 'wrong-class' ? playerToCombatUnit({ ...createMockPlayer('Wrong owner', 'amazon'), id: 'hero',
        level: 30, skillLevels: { 'skills-sorceress-inferno': 20 }, comboOrder: ['skills-sorceress-inferno'] }) : {}),
      ...(invalid === 'merc' ? { kind: 'merc' as const } : {}),
      ...(invalid === 'summon' ? { kind: 'summon' as const, summon: true, ownerId: 'hero' } : {}),
      ...(invalid === 'absent-projected-rank' ? { periodicSpellRanks: { 'fire-wall': 0, 'thunder-storm': 0 } } : {})
    })) });
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'sorceress.inferno')).toEqual([]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'fire')).toEqual([]);
  });

it.each(['wrong-source', 'rank-zero', 'over-cap', 'wrong-duration', 'bare-marker'] as const)(
  'rejects malformed %s paid carry without occupying actions', invalid => {
    const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => {
      const paid = payPeriodicSpell({ ...u, skillOrder: [] }, 'inferno', 1, 0);
      return { ...paid, statuses: paid.statuses.map(s => {
        if (s.id !== 'inferno') return s;
        const changed = { ...s,
        ...(invalid === 'wrong-source' ? { sourceId: 'foreign' } : {}),
        ...(invalid === 'rank-zero' ? { periodicSpell: { rank: 0 } } : {}),
        ...(invalid === 'over-cap' ? { periodicSpell: { rank: 21 } } : {}),
        ...(invalid === 'wrong-duration' ? { expiresAtMs: 4000 } : {}) };
        if (invalid === 'bare-marker') delete changed.periodicSpell;
        return changed;
      }) };
    }) });
    expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'fire')).toEqual([]);
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero').map(e => e.simClockMs)).toEqual([900, 1800, 2700]);
  });

it.each(['free', 'all-targets', 'no-cone', 'instant-effect', 'extra-effect'] as const)(
  'rejects a contradictory %s registry body before payment', invalid => {
    const skill = getSkill('sorceress.inferno'); if (!skill) throw new Error('Missing Inferno');
    const withoutCone = { ...skill }; delete withoutCone.aoeShape;
    registerSkill({ ...(invalid === 'no-cone' ? withoutCone : skill),
      ...(invalid === 'free' ? { manaCost: 0 } : {}),
      ...(invalid === 'all-targets' ? { target: 'all-enemies' as const } : {}),
      ...(invalid === 'instant-effect' ? { effects: [{ kind: 'damage' as const, damageType: 'fire' as const, base: [35, 55] as const }] } : {}),
      ...(invalid === 'extra-effect' ? { effects: [...skill.effects, { kind: 'buff' as const, id: 'foreign', duration: -1 }] } : {}) });
    const out = record(fixture());
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'sorceress.inferno')).toEqual([]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  });

it('starts a fresh paid channel only on a normal opportunity after exact expiry', () => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, life: 2200 })) });
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero').map(e => e.simClockMs)).toEqual([900, 4500]);
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero').map(e => e.simClockMs))
    .toEqual([900, 1900, 2900, 4500]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(2);
  expect(out.result.playerTeam[0]?.mana).toBe(80);
});

it('expires before a caster action exactly at the channel endpoint', () => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u =>
    payPeriodicSpell({ ...u, skillOrder: [] }, 'inferno', 1, -300)) });
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'fire')
    .map(e => e.simClockMs)).toEqual([700, 1700]);
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero').map(e => e.simClockMs)).toEqual([2700]);
});

it('publishes the paid cooldown when the immediate stream pulse ends a wave', () => {
  const input = fixture(), out = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 1 })) });
  expect(out.result.winner).toBe('player');
  expect(out.result.playerTeam[0]?.cooldowns['sorceress.inferno']).toBe(1000);
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'target')).toHaveLength(1);
});

it.each(['stun', 'freeze'] as const)('shares Concentration protection for %s with ordinary action rules', id => {
  const input = fixture(), statAura = composeStatAura({ id: 'hero', class: 'paladin', level: 30,
    selectedAuraId: 'paladin.concentration', skillLevels: { 'paladin.concentration': 1 } });
  if (!statAura) throw new Error('Missing synthetic Concentration projection');
  const out = record({ ...input, statAura, playerTeam: input.playerTeam.map(u => ({ ...u,
    statuses: [...u.statuses, { id, sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 1400 }] })) });
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero').map(e => e.simClockMs))
    .toEqual(id === 'stun' ? [900, 1900, 2900] : [900]);
});

it.each(['freeze', 'none'] as const)('handles an actual enemy hit with %s control between pulses', control => {
  registerSkill({ id: 'fixture.short-control', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
    manaCost: 0, cooldown: 100, effects: [{ kind: 'damage', damageType: 'fire', base: [1, 1],
      ...(control === 'freeze' ? { applyStatus: { id: 'freeze', durationMs: 100 } } : {}) }] });
  const input = fixture(), out = record({ ...input, seed: 7, playerTeam: input.playerTeam.map(u => ({ ...u, life: 1000 })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, statuses: [], skillOrder: ['fixture.short-control'],
      stats: { ...u.stats, attackSpeed: 150 } })) });
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'target')).toMatchObject({ simClockMs: 1300, dodged: false });
  if (control === 'freeze') expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status',
    target: 'hero', statusId: 'freeze', simClockMs: 1300 }));
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'fire')
    .map(e => e.simClockMs)).toEqual(control === 'freeze' ? [900] : [900, 1900]);
});

it('a resisted actual Paralyze does not cancel the stream', () => {
  registerSkill({ id: 'fixture.resisted-control', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
    manaCost: 0, cooldown: 100, effects: [{ kind: 'damage', damageType: 'fire', base: [1, 1],
      applyStatus: { id: 'paralyze', durationMs: 100 } }] });
  let observed = 0;
  for (let seed = 1; seed <= 16; seed++) {
    const input = fixture(), out = record({ ...input, seed,
      playerTeam: input.playerTeam.map(u => ({ ...u, life: 1000, statuses: [...u.statuses,
        { id: 'paralyze-cd', sourceId: 'fixture', stacks: 1, remaining: 5 }] })),
      enemyTeam: input.enemyTeam.map(u => ({ ...u, statuses: [], skillOrder: ['fixture.resisted-control'],
        stats: { ...u.stats, attackSpeed: 150 } })) });
    const hit = out.events.find(e => e.kind === 'damage' && e.source === 'target');
    const applied = out.events.some(e => e.kind === 'status' && e.target === 'hero' && e.statusId === 'paralyze');
    if (hit?.kind === 'damage' && !hit.dodged && !applied) {
      observed++;
      expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'fire')
        .map(e => e.simClockMs)).toEqual([900, 1900]);
    }
  }
  expect(observed).toBeGreaterThan(0);
});

it('composes Fire mastery, critical damage, Fire resistance and ordinary Defense per pulse', () => {
  const input = fixture(), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, increasedDamagePct: { fire: .5 },
      stats: { ...u.stats, critChance: 1, critDamage: 2 } })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats, defense: 7, magicResist: 9999,
      resistances: { ...u.stats.resistances, fire: 50 } } })) });
  const rng = createRng(19); expect(rng.chance(.85)).toBe(true);
  const raw = rng.nextInt(35, 55);
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'hero')).toMatchObject({
    amount: Math.floor(raw * 1.5 * 2 * .5 - 7), crit: true, dodged: false });
});

it('cancels only the channel while an existing paid Fire Wall continues through the same Freeze', () => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u =>
    payPeriodicSpell({ ...u, periodicSpellRanks: { inferno: 1, 'fire-wall': 1, 'thunder-storm': 0 },
      statuses: [...u.statuses, { id: 'freeze', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 1400 }] },
    'fire-wall', 1, 0)) });
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero').map(e => e.simClockMs))
    .toEqual([900, 1000, 2000]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
});

it('native Inferno stops immediately after a short Freeze between pulse times', () => {
  const input = fixture(), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing native Inferno caster');
  const r = runBattleRecorded({ ...input, playerTeam: [{ ...hero, life: 1000,
    statuses: [...hero.statuses, { id: 'freeze', sourceId: 'fixture', stacks: 1, remaining: .1,
      appliedAtMs: 1400, expiresAtMs: 1500 }] }] });
  const started = r.events.flatMap(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 900
    ? e.statuses.filter(s => s.id === 'inferno') : []);
  expect(started).toContainEqual(expect.objectContaining({ periodicSpell: { rank: 1 } }));
  expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'fire')
    .map(e => e.simClockMs)).toEqual([900]);
  expect(r.events.filter(e => e.kind === 'action' && e.actor === 'hero')).toEqual([
    expect.objectContaining({ skillId: 'sorceress.inferno', simClockMs: 900 }),
    expect.objectContaining({ skillId: null, simClockMs: 1800 })
  ]);
  const cancelled = r.events.flatMap(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 1400
    ? [e.statuses] : []).at(-1);
  expect(cancelled).toBeDefined();
  expect(cancelled?.some(s => s.id === 'inferno')).toBe(false);
});
