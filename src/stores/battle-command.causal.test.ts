import { beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
import { statusActiveAt } from '@/engine/combat/status';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from './combatPlayback';

const command = 'barbarian.battle_command';
const probe = 'fixture.learned-rank';
const levels = (rank: number) => ({ 'skills-barbarian-howl': 1, 'skills-barbarian-shout': 1,
  'skills-barbarian-battle-orders': 1, 'skills-barbarian-battle-command': rank });

/** Native legal Command; diagnostic spell, large pools and fixed stats are synthetic. */
function fixture(rank = 1, seed = 7): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic Command', 'barbarian'),
    id: 'hero', level: 30, skillLevels: levels(rank), comboOrder: ['skills-barbarian-battle-command'] });
  const hero: CombatUnit = { ...native, life: 1000000,
    mana: Math.round(11 - .1 * (rank - 1)), manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0, skillOrder: [command, probe],
    skillLevels: { ...native.skillLevels, [probe]: 1 },
    stats: { ...native.stats, lifeMax: 1000000, manaMax: 100, attack: 0, attackSpeed: 100,
      defense: 0, magicResist: 0, critChance: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  // Fixed diagnostic stats deliberately replace native passive composition.
  Reflect.deleteProperty(hero, 'battleCommandPassives');
  const ally: CombatUnit = { ...hero, id: 'ally', kind: 'merc', skillOrder: [probe],
    skillLevels: { [probe]: 1 }, stats: { ...hero.stats, attackSpeed: 50 } };
  const enemy: CombatUnit = { ...ally, id: 'enemy', side: 'enemy', kind: 'monster',
    skillOrder: [], statuses: [{ id: 'stun', sourceId: 'synthetic-hold', stacks: 1, remaining: -1 }] };
  return { seed, playerTeam: [hero, ally], enemyTeam: [enemy] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  const authority = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(authority ? { statusPlayback: authority } : {}) };
  for (const event of out.events)
    teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event, teams.statusPlayback);
  const clock = out.events.at(-1)?.simClockMs ?? 0;
  const view = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana,
    statuses: u.life > 0 ? u.statuses.filter(s => statusActiveAt(s, clock)) : [] }));
  expect(view(teams.playerTeam)).toEqual(view(out.result.playerTeam));
  expect(view(teams.enemyTeam)).toEqual(view(out.result.enemyTeam));
  return out;
}
beforeEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset();
  useFormationStore.getState().reset(); resetRegistry(); loadDefaultSkills();
  registerSkill({ id: probe, archetype: 'fixture', target: 'single-enemy', minLevel: 1,
    cooldown: 0, manaCost: 0, effects: [{ kind: 'damage', damageType: 'fire',
      base: [10, 10], perRank: [10, 10] }] });
});

it.each([1, 2, 20])('paid Command rank%i raises caster/allied potency only during its finite interval', rank => {
  for (const seed of [7, 19, 41, 97]) {
    const input = fixture(rank, seed), out = record(input), expiry = 1700 + 8000 + 500 * (rank - 1);
    registerSkill({ id: 'fixture.inert-command', archetype: 'fixture', target: 'self', minLevel: 1,
      cooldown: 4, manaCost: Math.round(11 - .1 * (rank - 1)), isBuff: true,
      effects: [{ kind: 'buff', id: 'fixture.inert-command', duration: 60 }] });
    const control = record({ ...input, playerTeam: input.playerTeam.map(u => u.id === 'hero'
      ? { ...u, skillOrder: ['fixture.inert-command', probe] } : u) });
    expect(control.events.filter(e => e.kind === 'action' && e.skillId === 'fixture.inert-command')).toEqual([
      expect.objectContaining({ simClockMs: 1700 })]);
    expect(control.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
      .toEqual(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast'));
    const actions = (events: typeof out.events) => events.flatMap(e => e.kind === 'action'
      ? [{ actor: e.actor, skillId: e.skillId === 'fixture.inert-command' ? command : e.skillId,
        at: e.simClockMs }] : []);
    expect(actions(control.events)).toEqual(actions(out.events));
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === command)).toHaveLength(1);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
    expect(out.result.playerTeam[0]?.mana).toBe(0);
    for (const source of ['hero', 'ally']) {
      const hits = out.events.filter(e => e.kind === 'damage' && e.source === source && !e.dodged);
      const during = hits.filter(e => e.simClockMs >= 1700 && e.simClockMs < expiry);
      const after = hits.filter(e => e.simClockMs >= expiry);
      expect(during.length).toBeGreaterThan(0); expect(after.length).toBeGreaterThan(0);
      expect(during.every(e => e.kind === 'damage' && e.amount === 20)).toBe(true);
      expect(after.every(e => e.kind === 'damage' && e.amount === 10)).toBe(true);
      const plain = control.events.filter(e => e.kind === 'damage' && e.source === source && !e.dodged);
      expect(plain.every(e => e.kind === 'damage' && e.amount === 10)).toBe(true);
      const applied = out.events.find(e => e.kind === 'status-state' && e.target === source && e.simClockMs === 1700);
      expect(applied?.kind === 'status-state' ? applied.statuses.find(s => s.id === 'battle-command') : undefined)
        .toMatchObject({ sourceId: 'hero', appliedAtMs: 1700, expiresAtMs: expiry });
    }
    expect(out.events.some(e => e.kind === 'status' && e.target === 'enemy' && e.statusId === 'battle-command')).toBe(false);
    expect(out.result.playerTeam[0]?.skillLevels).toEqual(input.playerTeam[0]?.skillLevels);
  }
});

it('does not re-pay or refresh while the actual Command remains active', () => {
  const input = fixture(), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => u.id === 'hero' ? { ...u, mana: 100 } : u) });
  const casts = out.events.filter(e => e.kind === 'action' && e.skillId === command);
  expect(casts[0]?.simClockMs).toBe(1700);
  expect(casts[1]?.simClockMs).toBeGreaterThanOrEqual(9700);
  expect(out.events.some(e => e.kind === 'action' && e.skillId === command &&
    e.simClockMs > 1700 && e.simClockMs < 9700)).toBe(false);
});

it('a bare imported marker cannot raise learned ranks or suppress the real paid cast', () => {
  const input = fixture(), marker = { id: 'battle-command', sourceId: 'forged', stacks: 1, remaining: -1 };
  const out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    activeBuffIds: ['battle-command', command], statuses: [marker] })) });
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', skillId: command, simClockMs: 1700 }));
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'ally' && e.simClockMs === 2000))
    .toContainEqual(expect.objectContaining({ amount: 20, dodged: false }));
});

it('native Command refuses missing transitive prerequisites, foreign class and underlevel owners', () => {
  const owner = { ...createMockPlayer('Synthetic authority', 'barbarian'), level: 30,
    skillLevels: levels(1), comboOrder: ['skills-barbarian-battle-command'] };
  for (const patch of [{ class: 'sorceress' as const }, { level: 29 },
    { skillLevels: { ...levels(1), 'skills-barbarian-howl': 0 } },
    { skillLevels: { ...levels(1), 'skills-barbarian-shout': 0 } },
    { skillLevels: { ...levels(1), 'skills-barbarian-battle-orders': 0 } },
    { skillLevels: { ...levels(1), 'skills-barbarian-battle-command': 21 } }]) {
    expect(playerToCombatUnit({ ...owner, ...patch }).skillOrder).toEqual([]);
  }
});

it.each(['leap', 'concentrate', 'battle-cry'] as const)(
  'Command supports a paid effective rank21 %s without changing allocated20', slug => {
    const input = fixture(), id = 'skills-barbarian-' + slug;
    const native = playerToCombatUnit({ ...createMockPlayer('Synthetic paid21', 'barbarian'),
      id: 'hero', level: 30, skillLevels: { ...levels(1), 'skills-barbarian-bash': 1,
        'skills-barbarian-stun': 1, 'skills-barbarian-taunt': 1, [id]: 20 },
      comboOrder: ['skills-barbarian-battle-command', id] });
    const out = record({ ...input, playerTeam: input.playerTeam.map(u => u.id === 'hero'
      ? { ...u, mana: 25, skillOrder: [...native.skillOrder, probe],
          skillLevels: { ...native.skillLevels, [probe]: 1 },
          leapRank: native.leapRank ?? 0, concentrateRank: native.concentrateRank ?? 0 } : u) });
    const observation = out.events.find(e => e.kind === 'status-state' &&
      e.target === (slug === 'battle-cry' ? 'enemy' : 'hero') && e.simClockMs === 3400);
    const status = observation?.kind === 'status-state' ? observation.statuses.find(s => s.id === slug) : undefined;
    const payload = slug === 'leap' ? status?.leap : slug === 'concentrate' ? status?.concentrate : status?.battleCry;
    expect(payload).toMatchObject({ rank: 21, rankBonus: 1 });
    expect(out.result.playerTeam[0]?.skillLevels?.[id]).toBeUndefined();
    expect(out.result.playerTeam[0]?.skillLevels?.['barbarian.' + slug.replaceAll('-', '_')]).toBe(20);
  });

it('boosts learned20 to21 while leaving a missing hero allocation at its legacy fallback', () => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    skillLevels: u.id === 'hero' ? { 'barbarian.battle_command': 1 } : { [probe]: 20 } })) });
  const ally = out.events.filter(e => e.kind === 'damage' && e.source === 'ally' && e.simClockMs === 2000 && !e.dodged);
  expect(ally).toContainEqual(expect.objectContaining({ amount: 210 }));
  const hero = out.events.filter(e => e.kind === 'damage' && e.source === 'hero' &&
    e.simClockMs >= 1700 && e.simClockMs < 9700 && !e.dodged);
  expect(hero.length).toBeGreaterThan(0);
  expect(hero.every(e => e.kind === 'damage' && e.amount === 10)).toBe(true);
});

it('does not pay with insufficient MP, alias cooldown, or missing live native authority', () => {
  const input = fixture();
  for (const patch of [{ mana: 10 }, { mana: 0 }, { mana: NaN }, { mana: Infinity },
    { cooldowns: { [command]: 60000 } }, { cooldowns: { 'skills-barbarian-battle-command': 60000 } },
    { battleCommandRank: 0 }, { level: 29 }, { kind: 'merc' as const }, { summon: true },
    { ownerId: 'other' }, { summonOwnerId: 'other' }]) {
    const out = record({ ...input, playerTeam: input.playerTeam.map(u => u.id === 'hero' ? { ...u, ...patch } : u) });
    expect(out.events.some(e => e.kind === 'action' && e.skillId === command)).toBe(false);
    expect(out.events.some(e => e.kind === 'buff' && e.buffId === 'battle-command')).toBe(false);
  }
});

it('excludes dead allies and units summoned after payment', () => {
  registerSkill({ id: 'fixture.late-summon', archetype: 'fixture', target: 'summon', minLevel: 1,
    cooldown: 1, manaCost: 1, effects: [{ kind: 'summon', summonId: 'minion', maxCount: 1 }] });
  const input = fixture(), ally = input.playerTeam[1];
  if (!ally) throw new Error('Missing synthetic ally');
  const out = record({ ...input, playerTeam: [...input.playerTeam.map(u => u.id === 'ally'
    ? { ...u, mana: 1, skillOrder: ['fixture.late-summon', probe] } : u), { ...ally, id: 'dead-ally', life: 0 }] });
  const spawn = out.events.find(e => e.kind === 'summon');
  expect(spawn?.simClockMs).toBe(2000);
  const recipients = out.events.flatMap(e => e.kind === 'buff' && e.buffId === 'battle-command' ? [e.target] : []);
  expect(recipients).toEqual(['hero', 'ally']);
});
