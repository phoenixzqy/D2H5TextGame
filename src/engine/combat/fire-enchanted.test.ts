import { afterEach, beforeEach, expect, it } from 'vitest';
import { monsters } from '../../data';
import { chooseSkill } from '../ai/policy';
import { createRng } from '../rng';
import { FIRE_ENCHANTED_EXPLOSION_SKILL } from '../skills/monster-death-explosion';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { CombatUnit } from './types';

const ID = 'monster.fire_enchanted_explosion', ALIAS = 'monster-fire-enchanted-explosion';
const STUN = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 } as const;
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

function body(id = 'fire', archetype = 'monsters/act1.fallen'): CombatUnit {
  const def = monsters.find(row => row.id === archetype);
  if (!def) throw new Error('Missing native monster');
  const unit = buildMonsterUnit({ def, id, level: 7, tier: 'champion', rng: createRng(7), extraSkillIds: [ALIAS] });
  return { ...unit, life: 1, stats: { ...unit.stats, critChance: 0 }, statuses: [STUN,
    { id: 'ignite', sourceId: 'hero', stacks: 1, remaining: 0.5, expiresAtMs: 500, dotPerStack: 2 }] };
}
function tank(): CombatUnit {
  const base = body();
  return { id: 'hero', name: 'hero', kind: 'hero', side: 'player', tier: 'trash', level: 30,
    life: 100_000, mana: 100, skillOrder: [], statuses: [STUN], cooldowns: {}, activeBuffIds: [], enraged: false,
    stats: { ...base.stats, life: 100_000, lifeMax: 100_000, mana: 100, manaMax: 100,
      attack: 1, attackSpeed: 100, critChance: 0, defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function snapshot(enemies: readonly CombatUnit[] = [body()], players: readonly CombatUnit[] = [tank()]): CombatSnapshot {
  return { seed: 7, playerTeam: players, enemyTeam: enemies };
}
function bursts(out: ReturnType<typeof runBattleRecorded>, source = 'fire') {
  return out.events.filter(e => e.kind === 'damage' && e.source === source);
}

it.each([ID, ALIAS])('binds native %s once despite duplicate aliases and never actively casts it', id => {
  expect(getSkill(id)).toBe(FIRE_ENCHANTED_EXPLOSION_SKILL);
  const dying = { ...body(), skillOrder: [id, ID, ALIAS] }, input = snapshot([dying]);
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(bursts(out)).toMatchObject([{ damageType: 'fire', amount: 50, simClockMs: 500 }]);
  expect(bursts(out)).toHaveLength(1);
  expect(out.events.some(e => e.kind === 'action')).toBe(false);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(input).toEqual(before);
  const living = { ...dying, life: 100_000, statuses: [] };
  expect(chooseSkill(living, true)).toBeUndefined();
  const liveOut = runBattleRecorded(snapshot([living]));
  expect(liveOut.events.filter(e => e.kind === 'action' && e.actor === 'fire').slice(0, 2))
    .toMatchObject([{ skillId: null }, { skillId: null }]);
});

it.each([ID, ALIAS])('rejects replaced %s as death or active authority', id => {
  registerSkill({ ...FIRE_ENCHANTED_EXPLOSION_SKILL, id, trigger: 'active',
    effects: [{ kind: 'damage', damageType: 'fire', base: [999, 999] }] });
  const source = { ...body(), skillOrder: [id] };
  expect(chooseSkill(source, true)).toBeUndefined();
  expect(bursts(runBattleRecorded(snapshot([source])))).toEqual([]);
  const out = runBattleRecorded(snapshot([{ ...source, life: 100_000, statuses: [] }]));
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === id)).toEqual([]);
});

it.each([{ life: 0 }, { life: NaN }, { summon: true }, { kind: 'summon' as const },
  { side: 'player' as const }, { ownerId: 'owner' }, { summonOwnerId: 'owner' },
  { summonTemplateId: 'template' }, { skillOrder: [] }])('does not grant death authority to %j', fields => {
  expect(bursts(runBattleRecorded(snapshot([{ ...body(), ...fields }])))).toEqual([]);
});

it('uses the final effective starting ID and excludes orphan-only deaths', () => {
  expect(bursts(runBattleRecorded(snapshot([body(), { ...body(), skillOrder: [] }])))).toEqual([]);
  const owner = { ...body('owner'), skillOrder: [] };
  const child = { ...body(), life: 1000, statuses: [STUN], summonOwnerId: 'owner' };
  expect(bursts(runBattleRecorded(snapshot([owner, child])))).toEqual([]);
});

it('closes all simultaneous deaths before their one-time bursts and ordinary recovery', () => {
  const out = runBattleRecorded(snapshot([body('first'), body('second')]));
  const deaths = out.events.filter(e => e.kind === 'death');
  expect(deaths.map(e => e.target)).toEqual(['first', 'second']);
  expect(bursts(out, 'first')).toHaveLength(1);
  expect(bursts(out, 'second')).toHaveLength(1);
  const firstBurst = out.events.findIndex(e => e.kind === 'damage' && e.source === 'first');
  const secondDeath = deaths[1];
  if (!secondDeath) throw new Error('Missing second death');
  expect(out.events.indexOf(secondDeath)).toBeLessThan(firstBurst);
  const lastBurst = out.events.findIndex(e => e.kind === 'damage' && e.source === 'second');
  const orbs = out.events.filter(e => e.kind === 'orb');
  expect(orbs.length).toBeGreaterThan(0);
  expect(orbs.every(e => out.events.indexOf(e) > lastBurst)).toBe(true);
});

it('can defeat the hero after the last enemy dies, retaining both dead bodies', () => {
  const out = runBattleRecorded(snapshot(undefined, [{ ...tank(), life: 1 }]));
  expect(out.result.winner).toBe('enemy');
  expect(out.events.filter(e => e.kind === 'death').map(e => e.target)).toEqual(['fire', 'hero']);
  expect(out.result.enemyTeam[0]?.life).toBe(0);
  expect(out.result.playerTeam[0]?.life).toBe(0);
});

it('retains the independent Doll explosion when Fire Enchanted is appended', () => {
  const out = runBattleRecorded(snapshot([body('fire', 'monsters/act4.stygian-doll')]));
  expect(bursts(out)).toMatchObject([{ damageType: 'physical' }, { damageType: 'fire' }, { damageType: 'fire' }]);
  expect(bursts(out)).toHaveLength(3);
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'fire')).toHaveLength(1);
});

it('does not scale the base budget with Attack or charge mana or consume a corpse', () => {
  const source = body(), plain = runBattleRecorded(snapshot([source]));
  const high = runBattleRecorded(snapshot([{ ...source, mana: 0, attackRange: [1_000_000, 1_000_000],
    stats: { ...source.stats, attack: 1_000_000 } }]));
  expect(bursts(high)).toEqual(bursts(plain));
  expect(high.events.filter(e => e.kind === 'mana' && e.target === 'fire')).toEqual([]);
  expect(high.events.some(e => e.kind === 'message' && e.messageKey === 'combat:corpses.consumed')).toBe(false);
  expect(high.events.some(e => e.kind === 'status' && e.statusId === 'ignite')).toBe(false);
});

it('uses ordinary spell crit and damage absorption', () => {
  const source = body(), hero = tank();
  const critical = runBattleRecorded(snapshot([{ ...source, stats: { ...source.stats, critChance: 1, critDamage: 2 } }]));
  expect(bursts(critical)).toMatchObject([{ amount: 100, crit: true }]);
  const shielded = runBattleRecorded(snapshot([source], [{ ...hero, statuses: [STUN,
    { id: 'bone-armor', sourceId: 'hero', stacks: 1, remaining: -1, boneArmor: { rank: 1, remaining: 12 } }] }]));
  expect(bursts(shielded)).toMatchObject([{ amount: 38, absorbed: 12 }]);
});

it.each(['direct', 'reflection'] as const)('settles a %s lethal hit through the same death trigger', mode => {
  const source = body(), hero = tank();
  const enemy = { ...source, skillOrder: [ALIAS], statuses: mode === 'direct' ? [STUN] : [] };
  const player = mode === 'direct'
    ? { ...hero, statuses: [], attackRange: [1000, 1000] as const, stats: { ...hero.stats, attack: 1000, attackSpeed: 250 } }
    : { ...hero, physicalReflectionPct: 1 };
  const out = runBattleRecorded(snapshot([enemy], [player]));
  const death = out.events.findIndex(e => e.kind === 'death' && e.target === 'fire');
  expect(death).toBeGreaterThanOrEqual(0);
  expect(out.events.slice(death).filter(e => e.kind === 'damage' && e.source === 'fire')).toHaveLength(1);
});

it.each([1000, 16000])('uses authentic Conversion allegiance on periodic death at %sms', at => {
  const hero = tank(), source = body();
  const converter = { ...hero, mana: 25, conversionRank: 1, skillOrder: ['paladin.conversion'],
    skillLevels: { 'paladin.conversion': 1 }, stats: { ...hero.stats, attackSpeed: 250 },
    statuses: [{ ...STUN, appliedAtMs: 501 }] };
  const victim = { ...source, tier: 'rare-minion' as const, life: 2, gridPosition: { row: 0 as const, col: 0 as const },
    stats: { ...hero.stats, defense: 1_000_000_000 }, statuses: [STUN,
      { id: 'ignite', sourceId: 'fixture', stacks: 1, remaining: at / 1000, expiresAtMs: at, dotPerStack: 1000 / at }] };
  const spare = { ...body('spare'), life: 100_000, skillOrder: [], statuses: [STUN],
    gridPosition: { row: 2 as const, col: 2 as const } };
  const out = runBattleRecorded(snapshot([victim, spare], [converter]));
  expect(out.events.find(e => e.kind === 'status' && e.target === 'fire' && e.statusId === 'converted'))
    .toMatchObject({ simClockMs: 500 });
  expect(out.events.find(e => e.kind === 'death' && e.target === 'fire')).toMatchObject({ simClockMs: at });
  expect(bursts(out)).toHaveLength(at > 8500 ? 1 : 0);
});

it('does not mistake a fabricated Conversion marker for actual friendly allegiance', () => {
  const source = body();
  const out = runBattleRecorded(snapshot([{ ...source, statuses: [...source.statuses,
    { id: 'converted', sourceId: 'hero', stacks: 1, remaining: -1 }] }]));
  expect(bursts(out)).toHaveLength(1);
});
