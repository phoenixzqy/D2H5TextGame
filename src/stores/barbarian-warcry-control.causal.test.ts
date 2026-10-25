import { beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { statusActiveAt } from '@/engine/combat/status';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from './combatPlayback';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

type Cry = 'howl' | 'taunt' | 'battle-cry';
const hold = (at = 0): ActiveStatus => ({ id: 'stun', sourceId: 'synthetic-hold',
  stacks: 1, remaining: -1, appliedAtMs: at });
/** Legal native skill configuration; pools/stats/hold are explicitly synthetic. */
function fixture(slug: Cry, rank = 1, seed = 7): CombatSnapshot {
  const levels: Record<string, number> = { 'skills-barbarian-howl': 1 };
  if (slug === 'battle-cry') levels['skills-barbarian-taunt'] = 1;
  levels['skills-barbarian-' + slug] = rank;
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic warcry', 'barbarian'),
    id: 'hero', level: 30, skillLevels: levels, comboOrder: ['skills-barbarian-' + slug] });
  const hero: CombatUnit = { ...native, life: 1000000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, statuses: [hold(2701)],
    stats: { ...native.stats, lifeMax: 1000000, manaMax: 100, attack: 200, attackSpeed: 100,
      defense: 100, magicResist: 0, critChance: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const ally: CombatUnit = { ...hero, id: 'ally', kind: 'merc', skillOrder: [], skillLevels: {},
    statuses: slug === 'battle-cry' ? [] : [hold()], stats: { ...hero.stats, attackSpeed: 50 } };
  const enemy: CombatUnit = { ...ally, id: 'enemy', side: 'enemy', kind: 'monster', statuses: [] };
  return { seed, playerTeam: [hero, ally], enemyTeam: [enemy] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  const authority = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(authority ? { statusPlayback: authority } : {}) };
  for (const event of out.events) teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event, teams.statusPlayback);
  const clock = out.events.at(-1)?.simClockMs ?? 0;
  const view = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana,
    statuses: u.life > 0 ? u.statuses.filter(s => statusActiveAt(s, clock)) : [] }));
  expect(view(teams.playerTeam)).toEqual(view(out.result.playerTeam));
  expect(view(teams.enemyTeam)).toEqual(view(out.result.enemyTeam));
  return out;
}
beforeEach(() => { useInventoryStore.getState().reset(); useMapStore.getState().reset();
  useFormationStore.getState().reset(); resetRegistry(); loadDefaultSkills(); });
for (const slug of ['howl', 'taunt', 'battle-cry'] as const) {
  it.each([1, 2, 20])(`${slug} rank%i has actual paid hostile consequences`, rank => {
    for (const seed of [7, 19, 41, 97]) {
      const out = record(fixture(slug, rank, seed));
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
      const cost = Math.round((slug === 'howl' ? 4 : slug === 'taunt' ? 3 : 6) -
        (slug === 'battle-cry' ? .1 : .05) * (rank - 1));
      expect(out.result.playerTeam[0]?.mana).toBe(100 - cost);
      const incoming = out.events.filter(e => e.kind === 'damage' && e.source === 'enemy' && e.simClockMs === 2000);
      if (slug === 'howl') {
        expect(incoming).toHaveLength(0);
        expect(out.events).toContainEqual(expect.objectContaining({ kind: 'stunned', target: 'enemy', simClockMs: 2000 }));
      } else if (slug === 'taunt') {
        expect(incoming).toHaveLength(1); expect(incoming[0]).toMatchObject({ target: 'hero' });
      } else {
        for (const hit of incoming) if (hit.kind === 'damage' && !hit.dodged)
          expect(hit.amount).toBe(Math.floor(200 * (1 - (25 + rank - 1) / 100) - 100));
        const outgoing = out.events.filter(e => e.kind === 'damage' && e.source === 'ally' && e.simClockMs === 2000);
        for (const hit of outgoing) if (hit.kind === 'damage' && !hit.dodged)
          expect(hit.amount).toBe(Math.floor(200 - 100 * (1 - (50 + 2 * (rank - 1)) / 100)));
        expect(incoming.some(e => e.kind === 'damage' && !e.dodged)).toBe(true);
      }
    }
  });
  it(`${slug} refuses insufficient MP or a carried active cooldown without payment`, () => {
    const base = fixture(slug), canonical = 'barbarian.' + slug.replaceAll('-', '_');
    for (const patch of [{ mana: 0 }, { cooldowns: { [canonical]: 100000 } }]) {
      const out = record({ ...base, playerTeam: base.playerTeam.map(u => u.id === 'hero' ? { ...u, ...patch } : u) });
      expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
      expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
    }
  });
  it(`${slug} excludes dead bodies and every friendly from its hostile debuff pool`, () => {
    const base = fixture(slug), enemy = base.enemyTeam[0];
    if (!enemy) throw new Error('Missing synthetic enemy');
    const out = record({ ...base, enemyTeam: [enemy, { ...enemy, id: 'dead', life: 0 }, { ...enemy, id: 'second' }] });
    const targets = out.events.flatMap(e => e.kind === 'status' && e.statusId === slug ? [e.target] : []);
    expect(targets).toEqual(slug === 'taunt' ? ['enemy'] : ['enemy', 'second']);
  });
  it(`${slug} is governed by native class, unlock, prerequisites and rank cap`, () => {
    const id = 'skills-barbarian-' + slug, levels: Record<string, number> = { 'skills-barbarian-howl': 1, 'skills-barbarian-taunt': 1, [id]: 1 };
    const owner = { ...createMockPlayer('Synthetic authority', 'barbarian'), level: 30, skillLevels: levels, comboOrder: [id] };
    for (const patch of [{ class: 'sorceress' as const }, { level: 0 }, { skillLevels: {} },
      { skillLevels: { ...levels, [id]: 21 } }, ...(slug === 'howl' ? [] : [{ skillLevels: { [id]: 1 } }])]) {
      const native = playerToCombatUnit({ ...owner, ...patch }); expect(native.skillOrder).toEqual([]);
    }
    const canonical = 'barbarian.' + slug.replaceAll('-', '_');
    const native = playerToCombatUnit({ ...owner, skillLevels: { ...levels, [id]: 0, [canonical]: 20 }, comboOrder: [canonical] });
    expect(native.skillOrder).toEqual([canonical]); expect(native.skillLevels?.[canonical]).toBe(20);
  });
}

it.each(['trash', 'boss', 'chapter-boss'] as const)('Howl really interrupts %s and resumes after its exact finite expiry', tier => {
  const base = fixture('howl'), expiry = tier === 'trash' ? 2700 : 2200;
  const out = record({ ...base, enemyTeam: base.enemyTeam.map(u => ({ ...u, tier, stats: { ...u.stats, attackSpeed: 250 } })) });
  const applied = out.events.find(e => e.kind === 'status-state' && e.target === 'enemy' && e.simClockMs === 1700);
  expect(applied?.kind === 'status-state' ? applied.statuses.find(s => s.id === 'howl') : undefined)
    .toMatchObject({ appliedAtMs: 1700, expiresAtMs: expiry });
  expect(out.events.some(e => e.kind === 'stunned' && e.target === 'enemy' && e.simClockMs === 2000)).toBe(true);
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'enemy' && e.simClockMs > 1700 && e.simClockMs < expiry)).toBe(false);
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'enemy' && e.simClockMs >= expiry)).toBe(true);
  const expired = out.events.find(e => e.kind === 'status-state' && e.target === 'enemy' && e.simClockMs === expiry);
  expect(expired?.kind === 'status-state' ? expired.statuses.some(s => s.id === 'howl') : true).toBe(false);
});
for (const target of ['single-enemy', 'all-enemies', 'area-enemies'] as const) {
  it(`Taunt respects the ${target} skill boundary`, () => {
    registerSkill({ id: 'fixture.enemy-attack', archetype: 'monster', target, cooldown: 100, manaCost: 0,
      minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [200, 200] }] });
    const base = fixture('taunt', 1, 41), out = record({ ...base,
      enemyTeam: base.enemyTeam.map(u => ({ ...u, skillOrder: ['fixture.enemy-attack'] })) });
    const targets = out.events.flatMap(e => e.kind === 'damage' && e.source === 'enemy' && e.simClockMs === 2000 ? [e.target] : []);
    expect(targets).toEqual(target === 'single-enemy' ? ['hero'] : ['hero', 'ally']);
  });
}
it.each(['absent', 'dead', 'same-side', 'future', 'expired', 'indefinite'] as const)(
  'Taunt falls back to ordinary eligible targeting for an %s source/interval', condition => {
    for (const seed of [7, 19, 41, 97]) {
      const base = fixture('taunt', 1, seed), hero = base.playerTeam[0];
      if (!hero) throw new Error('Missing taunt hero');
      const playerTeam = base.playerTeam.map(u => ({ ...u, skillOrder: [], statuses: [hold()] }))
        .filter(u => condition !== 'absent' && condition !== 'same-side' || u.id !== 'hero')
        .map(u => condition === 'dead' && u.id === 'hero' ? { ...u, life: 0 } : u);
      // An absent/dead source must not end the battle as a dead protagonist.
      const livingTeam = playerTeam.map(u => ({ ...u, kind: 'merc' as const }));
      const enemies = base.enemyTeam.map(u => ({ ...u, statuses: condition === 'indefinite'
        ? [{ id: 'taunt', sourceId: 'hero', stacks: 1, remaining: -1 }]
        : [{ id: 'taunt', sourceId: 'hero', stacks: 1, remaining: 1,
          appliedAtMs: condition === 'future' ? 2001 : 1700, expiresAtMs: condition === 'expired' ? 2000 : 2700 }] }));
      const enemyTeam = condition === 'same-side' ? [...enemies, { ...hero, side: 'enemy' as const, kind: 'monster' as const,
        skillOrder: [], statuses: [hold()] }] : enemies;
      const input = { ...base, playerTeam: livingTeam, enemyTeam }, plain = record({ ...input,
        enemyTeam: input.enemyTeam.map(u => u.id === 'enemy' ? { ...u, statuses: [] } : u) });
      const out = record(input);
      const recipients = (value: typeof out) => value.events.flatMap(e => e.kind === 'damage' && e.source === 'enemy' && e.simClockMs === 2000 ? [e.target] : []);
      expect(recipients(out)).toEqual(recipients(plain)); expect(recipients(out)).toHaveLength(1);
    }
  });
it('Battle Cry reduces direct magic damage while leaving Magic Resist and post-expiry attacks intact', () => {
  registerSkill({ id: 'fixture.magic', archetype: 'monster', target: 'single-enemy', cooldown: 100, manaCost: 0,
    minLevel: 1, effects: [{ kind: 'damage', damageType: 'arcane', base: [300, 300] }] });
  const base = fixture('battle-cry'), out = record({ ...base, enemyTeam: base.enemyTeam.map(u => ({ ...u, skillOrder: ['fixture.magic'] })) });
  const during = out.events.find(e => e.kind === 'damage' && e.source === 'enemy' && e.simClockMs === 2000);
  expect(during).toMatchObject({ amount: 225, damageType: 'arcane', dodged: false });
  expect(out.events.some(e => e.kind === 'damage' && e.source === 'enemy' && e.simClockMs > 2700 && e.amount === 100)).toBe(true);
  expect(out.result.enemyTeam[0]?.stats).toEqual(base.enemyTeam[0]?.stats);
});
it('Battle Cry leaves reflection on its ordinary mitigation path', () => {
  const base = fixture('battle-cry'), out = record({ ...base,
    enemyTeam: base.enemyTeam.map(u => ({ ...u, physicalReflectionPct: 1 })) });
  const direct = out.events.find(e => e.kind === 'damage' && e.source === 'ally' && e.simClockMs === 2000);
  expect(direct).toMatchObject({ amount: 150, dodged: false });
  // 150 actual HP lost reflected at 100%, minus the ally's 100 Defense; no extra 25% outgoing reduction.
  expect(out.events.find(e => e.kind === 'damage' && e.damageType === 'thorns' && e.source === 'enemy' && e.simClockMs === 2000))
    .toMatchObject({ target: 'ally', amount: 50, crit: false, dodged: false });
});
it('Battle Cry does not reduce an already-running periodic damage rate', () => {
  const base = fixture('battle-cry'), out = record({ ...base, playerTeam: base.playerTeam.map(u =>
    u.id === 'hero' ? { ...u, statuses: [...u.statuses, { id: 'poison', sourceId: 'enemy', stacks: 1,
      remaining: 1, dotPerStack: 100, damageType: 'poison', appliedAtMs: 1700, expiresAtMs: 2700 }] } : u) });
  expect(out.events.reduce((sum, e) => sum + (e.kind === 'dot' && e.target === 'hero' ? e.amount : 0), 0)).toBe(100);
});
