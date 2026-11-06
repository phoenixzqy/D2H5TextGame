import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { monsters } from '../../data';
import act4Areas from '../../data/maps/sub-areas/act4.json';
import type { SubAreaDef } from '../types/maps';
import { chooseSkill } from '../ai/policy';
import * as damage from './damage';
import { createRng } from '../rng';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import { buildMonsterUnit } from './monster-factory';
import { DEFAULT_ELITE_CONFIG, resolveChallengeWavePlan } from './sub-area-run';
import type { CombatUnit } from './types';

const ID = 'monster.corpse_explosion', ALIAS = 'monster-corpse-explosion';
const STUN = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 } as const;
function doll(id = 'doll', level = 1): CombatUnit {
  const def = monsters.find(row => row.id === 'monsters/act4.stygian-doll');
  if (!def) throw new Error('Missing Doll');
  return buildMonsterUnit({ def, id, level, tier: 'trash', rng: createRng(7) });
}
function tank(id = 'hero'): CombatUnit {
  const base = doll();
  return { ...base, id, kind: 'hero', side: 'player', life: 100_000, mana: 100,
    skillOrder: [], statuses: [STUN], stats: { ...base.stats, life: 100_000, lifeMax: 100_000,
      mana: 100, manaMax: 100, attack: 1, attackSpeed: 100, critChance: 0, critDamage: 2,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function dying(id = 'doll', at = 500): CombatUnit {
  const base = doll(id);
  return { ...base, life: 1, stats: { ...base.stats, critChance: 0 }, statuses: [STUN,
    { id: 'ignite', sourceId: 'hero', stacks: 1, remaining: at / 1000,
      expiresAtMs: at, dotPerStack: 1000 / at }] };
}
function snapshot(enemies: readonly CombatUnit[] = [dying()], players: readonly CombatUnit[] = [tank()]): CombatSnapshot {
  return { seed: 7, act: 4, playerTeam: players, enemyTeam: enemies };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  return out;
}
function bursts(events: readonly RecordedBattleEvent[], id = 'doll') {
  return events.filter(e => e.kind === 'damage' && e.source === id);
}
function noCasts(events: readonly RecordedBattleEvent[]) {
  expect(events.filter(e => e.kind === 'action' && [ID, ALIAS].includes(e.skillId ?? ''))).toEqual([]);
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('Stygian Doll native death explosion', () => {
  it('authors an on-death marker and agile ordinary curve', () => {
    expect(getSkill(ID)).toMatchObject({ trigger: 'on-death', cooldown: 0, manaCost: 0 });
    const def = monsters.find(row => row.id === 'monsters/act4.stygian-doll');
    expect(def).toMatchObject({ skills: [ALIAS], attack: [35.2, 35.2], attackGrowth: [5.5, 5.5] });
    expect(doll().stats.attack).toBe(35);
    expect(doll('doll', 53).stats.attack).toBe(321);
  });
  it('uses ordinary melee every 1540ms while alive, with no active explosion', () => {
    const body = doll(), out = record(snapshot([body]));
    expect(chooseSkill(body, true)).toBeUndefined();
    expect(out.events.filter(e => e.kind === 'action' && e.actor === body.id).slice(0, 3))
      .toMatchObject([{ skillId: null, simClockMs: 1540 }, { skillId: null, simClockMs: 3080 },
        { skillId: null, simClockMs: 4620 }]);
    noCasts(out.events);
  });
  it.each([ID, ALIAS])('never actively casts a replaced %s', id => {
    const native = getSkill(ID);
    if (!native) throw new Error('Missing native skill');
    registerSkill({ ...native, id, trigger: 'active', effects: [{ kind: 'damage', damageType: 'fire', base: [999, 999] }] });
    const body = { ...doll(), skillOrder: [id] }, out = record(snapshot([body]));
    expect(chooseSkill(body, true)).toBeUndefined();
    noCasts(out.events);
    expect(bursts(out.events).every(e => e.kind === 'damage' && e.damageType === 'physical')).toBe(true);
  });
  it('explodes once after periodic death, with independent component floors and no Ignite', () => {
    const out = record(snapshot());
    expect(bursts(out.events)).toHaveLength(2);
    expect(bursts(out.events)).toMatchObject([{ damageType: 'physical', simClockMs: 500 },
      { damageType: 'fire', simClockMs: 500 }]);
    const hits = bursts(out.events).filter(e => e.kind === 'damage');
    expect(hits[0]?.amount).toBe(hits[1]?.amount);
    expect(hits[0]?.amount).toBeGreaterThanOrEqual(17);
    expect(hits[0]?.amount).toBeLessThanOrEqual(30);
    expect(out.events.findIndex(e => e.kind === 'death' && e.target === 'doll'))
      .toBeLessThan(out.events.findIndex(e => e.kind === 'damage' && e.source === 'doll'));
    expect(out.events.some(e => e.kind === 'status' && e.target === 'hero' && e.statusId === 'ignite')).toBe(false);
    expect(out.result.enemyTeam[0]?.life).toBe(0);
    noCasts(out.events);
  });
  it('can kill the hero after the last enemy dies, retaining both outcome bodies', () => {
    const out = record(snapshot(undefined, [{ ...tank(), life: 1 }]));
    expect(out.result.winner).toBe('enemy');
    expect(out.result.playerTeam[0]?.life).toBe(0);
    expect(out.result.enemyTeam[0]?.life).toBe(0);
    expect(out.events.filter(e => e.kind === 'death').map(e => e.target)).toEqual(['doll', 'hero']);
  });
  it('closes simultaneous original deaths before all their bursts and recovery', () => {
    const summon = { ...tank('summon'), kind: 'summon' as const, life: 1,
      summonOwnerId: 'hero', summon: true };
    const hero = { ...tank(), mana: 0, skillOrder: ['necromancer.raise_skeleton'],
      statuses: [STUN] };
    const out = record(snapshot([{ ...dying('first'), tier: 'rare-minion' }, dying('second')], [hero, summon]));
    expect(out.events.filter(e => e.kind === 'death').slice(0, 2).map(e => e.target)).toEqual(['first', 'second']);
    const lastBurst = Math.max(...out.events.map((e, index) => e.kind === 'damage' && e.source === 'second' ? index : -1));
    const refund = out.events.findIndex(e => e.kind === 'mana' && e.reason === 'summon-refund');
    expect(bursts(out.events, 'first')).toHaveLength(4);
    expect(bursts(out.events, 'second')).toHaveLength(2);
    expect(refund).toBeGreaterThan(lastBurst);
    const orbs = out.events.filter(e => e.kind === 'orb');
    expect(orbs.length).toBeGreaterThan(0);
    expect(orbs.every(e => out.events.indexOf(e) > lastBurst)).toBe(true);
  });
  it.each([{ life: 0 }, { summon: true }, { kind: 'summon' as const }, { ownerId: 'x' },
    { summonOwnerId: 'x' }, { summonTemplateId: 'x' }, { monsterArchetypeId: 'monsters/act4.damned' }])(
    'does not grant original death authority to %j', fields => {
      expect(bursts(record(snapshot([{ ...dying(), ...fields }])).events)).toEqual([]);
    });
  it('does not grant authority to friendly, overwritten or orphan-only Dolls', () => {
    expect(bursts(record(snapshot([], [tank(), { ...dying(), side: 'player' }])).events)).toEqual([]);
    expect(bursts(record(snapshot([dying(), { ...dying(), monsterArchetypeId: 'monsters/act4.damned' }])).events)).toEqual([]);
    const child = { ...doll(), summonOwnerId: 'owner', statuses: [STUN] };
    const owner = { ...dying('owner'), monsterArchetypeId: 'monsters/act4.damned' };
    expect(bursts(record(snapshot([owner, child])).events)).toEqual([]);
  });
  it('does not accept fabricated Conversion markers as friendly allegiance', () => {
    const body = dying();
    const out = record(snapshot([{ ...body, statuses: [...body.statuses,
      { id: 'converted', sourceId: 'hero', stacks: 1, remaining: -1 }] }]));
    expect(bursts(out.events)).toHaveLength(2);
  });
  it('preserves the authored single L53 treasure Doll in City Damned W6', () => {
    const area = (act4Areas as SubAreaDef[]).find(row => row.id === 'areas/act4-city-of-the-damned');
    if (!area) throw new Error('Missing City Damned');
    const before = structuredClone(area), plan = resolveChallengeWavePlan({ subArea: area, mode: 'manual',
      fallbackArchetypeId: 'monsters/act4.damned', fallbackLevel: 50, seed: 7,
      challengeOrdinal: 0, idleEliteMisses: 0 });
    const wave = plan.waves.find(row => row.source?.kind === 'wave' && row.source.waveId === 'w6');
    if (!wave) throw new Error('Missing W6');
    expect(wave.source).toEqual({ kind: 'wave', waveId: 'w6', encounterIds: ['act4-cd-w6-e1'] });
    expect(wave.spawns.map(row => [row.archetypeId, row.level, row.tier])).toEqual([
      ['monsters/act4.stygian-doll', 53, 'rare-elite']]);
    const units = wave.spawns.map((spawn, index) => {
      const def = monsters.find(row => row.id === spawn.archetypeId);
      if (!def) throw new Error('Missing native spawn');
      return buildMonsterUnit({ def, id: `native-${String(index)}`, level: spawn.level, tier: spawn.tier,
        rng: createRng(7 + index), extraSkillIds: spawn.eliteAffix ? [spawn.eliteAffix.skillId] : [],
        resistanceBonus: DEFAULT_ELITE_CONFIG.rareEliteResistanceBonus });
    });
    expect(units.map(unit => unit.stats.attack)).toEqual([482]);
    expect(area).toEqual(before);
  });
});


describe('Doll damage authority and native pipeline', () => {
  it.each([ID, ALIAS])('accepts native %s plus an appended elite spell', id => {
    const body = { ...dying(), skillOrder: [id, 'monster-arcane-bolt'] };
    expect(bursts(record(snapshot([body])).events)).toHaveLength(2);
    const living = { ...doll(), skillOrder: [id, 'monster-arcane-bolt'] };
    const out = record(snapshot([living]));
    expect(out.events.find(e => e.kind === 'action' && e.actor === 'doll'))
      .toMatchObject({ skillId: 'monster.arcane_bolt', simClockMs: 1540 });
    noCasts(out.events);
  });
  it('does not bind a missing or replaced native marker', () => {
    expect(bursts(record(snapshot([{ ...dying(), skillOrder: [] }])).events)).toEqual([]);
    const native = getSkill(ID);
    if (!native) throw new Error('Missing native skill');
    registerSkill({ ...native, effects: [{ kind: 'damage', damageType: 'fire', base: [999, 999] }] });
    expect(bursts(record(snapshot()).events)).toEqual([]);
  });
  it('excludes arbitrary on-death skills from both active selectors', () => {
    registerSkill({ id: 'fixture.death', archetype: 'fixture', trigger: 'on-death',
      cooldown: 0, manaCost: 0, minLevel: 1, target: 'all-enemies',
      effects: [{ kind: 'damage', damageType: 'fire', base: [999, 999] }] });
    const body = { ...doll(), skillOrder: ['fixture.death'] };
    expect(chooseSkill(body, true)).toBeUndefined();
    expect(record(snapshot([body])).events.filter(e => e.kind === 'action' && e.skillId === 'fixture.death')).toEqual([]);
  });
  it('uses the same spell hit/base/crit for both components, including odd roll35', () => {
    const spy = vi.spyOn(damage, 'rollDamage');
    let foundOdd = false, landed = 0, avoided = 0;
    for (let seed = 0; seed < 100; seed++) {
      spy.mockClear();
      const out = runBattleRecorded({ ...snapshot(), seed });
      const hits = bursts(out.events).filter(e => e.kind === 'damage');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(hits).toHaveLength(2);
      expect(hits[0]?.dodged).toBe(hits[1]?.dodged);
      expect(hits[0]?.crit).toBe(hits[1]?.crit);
      const roll = spy.mock.results[0];
      if (roll?.type !== 'return') throw new Error('Missing actual roll');
      const value = roll.value;
      if (!value.hit) { avoided++; expect(hits.map(e => e.amount)).toEqual([0, 0]); continue; }
      landed++;
      expect(hits.map(e => e.amount)).toEqual([Math.floor(value.base / 2), Math.floor(value.base / 2)]);
      if (value.base === 35) { foundOdd = true; expect(hits.map(e => e.amount)).toEqual([17, 17]); }
    }
    expect(foundOdd).toBe(true);
    expect(landed).toBeGreaterThan(0);
    expect(avoided).toBeGreaterThan(0);
  });
  it('mitigates physical/fire separately and spends one shared Bone Armor pool', () => {
    const hero = tank(), body = dying();
    const plain = record(snapshot([body], [hero]));
    const shielded = record(snapshot([body], [{ ...hero, statuses: [STUN,
      { id: 'bone-armor', sourceId: 'hero', stacks: 1, remaining: -1, boneArmor: { rank: 1, remaining: 12 } }] }]));
    const raw = bursts(plain.events).filter(e => e.kind === 'damage'), absorbed = bursts(shielded.events).filter(e => e.kind === 'damage');
    expect(absorbed).toMatchObject([{ damageType: 'physical', absorbed: 12 }, { damageType: 'fire' }]);
    expect(absorbed[0]?.amount).toBe((raw[0]?.amount ?? 0) - 12);
    expect(absorbed[1]?.amount).toBe(raw[1]?.amount);
    const resistant = record(snapshot([body], [{ ...hero, stats: { ...hero.stats,
      resistances: { ...hero.stats.resistances, physical: 50 } } }]));
    const mitigated = bursts(resistant.events).filter(e => e.kind === 'damage');
    expect(mitigated[0]?.amount).toBeLessThan(raw[0]?.amount ?? 0);
    expect(mitigated[1]?.amount).toBe(raw[1]?.amount);
  });
  it.each(['direct', 'reflection'] as const)('uses the death trigger after a %s lethal hit', mode => {
    const base = doll(), body = { ...base, life: 1, skillOrder: [ALIAS],
      statuses: mode === 'direct' ? [STUN] : [], stats: { ...base.stats, critChance: 0 } };
    const h = tank(), hero = mode === 'direct'
      ? { ...h, attackRange: [1000, 1000] as const, statuses: [], stats: { ...h.stats, attack: 1000, attackSpeed: 250 } }
      : { ...h, physicalReflectionPct: 1 };
    const out = record(snapshot([body], [hero]));
    const index = out.events.findIndex(e => e.kind === 'death' && e.target === 'doll');
    expect(index).toBeGreaterThanOrEqual(0);
    expect(bursts(out.events.slice(index))).toHaveLength(2);
    expect(out.events.filter(e => e.kind === 'death' && e.target === 'doll')).toHaveLength(1);
    expect(out.result.enemyTeam[0]?.life).toBe(0);
    noCasts(out.events);
  });
  it('does not scale the death budget with Attack or charge MP', () => {
    const body = dying(), plain = record(snapshot([body]));
    const powered = record(snapshot([{ ...body, stats: { ...body.stats, attack: 1_000_000 },
      attackRange: [1_000_000, 1_000_000], mana: 0 }]));
    expect(bursts(powered.events)).toEqual(bursts(plain.events));
    expect(powered.events.filter(e => e.kind === 'mana' && e.target === 'doll')).toEqual([]);
  });
  it('publishes the dead Doll once for the separate player Corpse Explosion', () => {
    const spare = { ...doll('spare'), life: 100_000, statuses: [STUN], monsterArchetypeId: 'monsters/act4.damned' };
    const h = tank(), input = { ...snapshot([dying(), spare], [{ ...h, level: 6, statuses: [],
      skillOrder: ['necromancer.corpse_explosion'] }]), corpseExplosion: [{ sourceHeroId: 'hero', rank: 1 }] };
    const out = record(input), feedback = out.events.filter(e => e.kind === 'message' && e.messageKey.startsWith('combat:corpses.'));
    expect(feedback).toMatchObject([{ messageKey: 'combat:corpses.available', params: { count: 1 } },
      { messageKey: 'combat:corpses.consumed', params: { count: 0 } }]);
    expect(out.events.filter(e => e.kind === 'action' && e.skillId === 'necromancer.corpse_explosion')).toHaveLength(1);
    expect(bursts(out.events)).toHaveLength(2);
    expect(out.result.enemyTeam.find(u => u.id === 'doll')?.life).toBe(0);
  });
  it('keeps A/B/A recordings and no-Doll controls independent', () => {
    const a = snapshot(), before = runBattleRecorded(a);
    const control = snapshot([{ ...dying(), monsterArchetypeId: 'monsters/act4.damned' }]);
    expect(bursts(record(control).events)).toEqual([]);
    record(snapshot([dying('first'), dying('second')]));
    expect(runBattleRecorded(a)).toEqual(before);
  });
});


function converter(): CombatUnit {
  const h = tank();
  return { ...h, level: 30, mana: 25, conversionRank: 1, skillOrder: ['paladin.conversion'],
    skillLevels: { 'paladin.conversion': 1 }, stats: { ...h.stats, attackSpeed: 250 },
    statuses: [{ ...STUN, appliedAtMs: 501 }] };
}
function conversionBody(at = 1000): CombatUnit {
  const h = tank(), base = doll();
  // Huge armor makes the paid Conversion hit remove exactly the native minimum1HP.
  // Initial2HP and periodic1HP then close exactly at the authored boundary.
  return { ...base, life: 2, gridPosition: { row: 0, col: 0 },
    stats: { ...h.stats, defense: 1_000_000_000 }, statuses: [STUN,
      { id: 'ignite', sourceId: 'fixture', stacks: 1, remaining: at / 1000,
        expiresAtMs: at, dotPerStack: 1000 / at }] };
}
function spareEnemy(): CombatUnit {
  return { ...doll('spare'), life: 100_000, skillOrder: [], statuses: [STUN],
    monsterArchetypeId: 'monsters/act4.damned', gridPosition: { row: 2, col: 2 } };
}
describe('Doll authentic allegiance at death', () => {
  it.each([1000, 8500, 16000])('periodic death at %sms uses final-interval Conversion authority', at => {
    const out = record(snapshot([conversionBody(at), spareEnemy()], [converter()]));
    expect(out.events.find(e => e.kind === 'status' && e.target === 'doll' && e.statusId === 'converted'))
      .toMatchObject({ simClockMs: 500 });
    expect(out.events.find(e => e.kind === 'death' && e.target === 'doll')).toMatchObject({ simClockMs: at });
    expect(bursts(out.events)).toHaveLength(at > 8500 ? 2 : 0);
  });
  it('does not reclassify a converted Doll when its caster dies in the same periodic set', () => {
    const h = converter(), out = record(snapshot([conversionBody(), spareEnemy()], [{ ...h, life: 1,
      statuses: [...h.statuses, { id: 'ignite', sourceId: 'fixture', stacks: 1, remaining: 1,
        expiresAtMs: 1000, dotPerStack: 1 }] }]));
    expect(out.events.some(e => e.kind === 'status' && e.target === 'doll' && e.statusId === 'converted')).toBe(true);
    expect(out.events.filter(e => e.kind === 'death')).toMatchObject([
      { target: 'hero', simClockMs: 1000 }, { target: 'doll', simClockMs: 1000 }]);
    expect(bursts(out.events)).toEqual([]);
  });
  it('a direct hit exactly at Conversion expiry sees the returned hostile Doll', () => {
    registerSkill({ id: 'fixture.kill', archetype: 'fixture', target: 'single-enemy',
      minLevel: 1, cooldown: 60, manaCost: 0,
      effects: [{ kind: 'damage', damageType: 'arcane', base: [1000, 1000], alwaysHits: true }] });
    const h = tank('killer'), killer = { ...h, kind: 'merc' as const,
      skillOrder: ['fixture.kill'], stats: { ...h.stats, attackSpeed: 250 },
      statuses: [{ ...STUN, remaining: 8.5, expiresAtMs: 8500 }] };
    const body = { ...conversionBody(), statuses: [STUN] };
    const out = record(snapshot([body, spareEnemy()], [converter(), killer]));
    expect(out.events.find(e => e.kind === 'status' && e.statusId === 'converted'))
      .toMatchObject({ simClockMs: 500 });
    expect(out.events.find(e => e.kind === 'death' && e.target === 'doll'))
      .toMatchObject({ simClockMs: 8500 });
    expect(bursts(out.events)).toHaveLength(4);
  });
  it("defers a converted poisoned victim's spread and corpse tail until both original bursts finish", () => {
    const body = { ...conversionBody(), statuses: [STUN,
      { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: 20, expiresAtMs: 20000, dotPerStack: 0.1 }] };
    const h = { ...converter(), skillOrder: ['paladin.conversion', 'necromancer.corpse_explosion'] };
    // Player targeting chooses lowest current HP. Siblings retain >1HP at500ms,
    // so Conversion hits the first2HP victim, then both siblings die at1000ms.
    const sibling = (id: string): CombatUnit => {
      const unit = dying(id, 1000);
      return { ...unit, life: 3, statuses: unit.statuses.map(status => status.id === 'ignite'
        ? { ...status, dotPerStack: 3 } : status) };
    };
    const out = record({ ...snapshot([body, sibling('first'), sibling('second'), spareEnemy()], [h]),
      corpseExplosion: [{ sourceHeroId: 'hero', rank: 1 }] });
    expect(out.events.find(e => e.kind === 'action' && e.actor === 'hero'))
      .toMatchObject({ skillId: 'paladin.conversion', simClockMs: 500 });
    expect(out.events.find(e => e.kind === 'mana' && e.target === 'hero' && e.reason === 'cast'))
      .toMatchObject({ simClockMs: 500, mana: 0 });
    expect(out.events.find(e => e.kind === 'status' && e.target === 'doll' && e.statusId === 'converted'))
      .toMatchObject({ simClockMs: 500 });
    expect(out.events.find(e => e.kind === 'death' && e.target === 'doll'))
      .toMatchObject({ simClockMs: 1000 });
    expect(bursts(out.events)).toEqual([]);
    const death = out.events.findIndex(e => e.kind === 'death' && e.target === 'doll');
    const first = out.events.findIndex(e => e.kind === 'damage' && e.source === 'first');
    const second = out.events.findIndex(e => e.kind === 'damage' && e.source === 'second');
    expect(death).toBeGreaterThan(first);
    expect(death).toBeLessThan(second);
    const last = Math.max(...out.events.map((e, index) => e.kind === 'damage' && e.source === 'second' ? index : -1));
    expect(last).toBeGreaterThan(0);
    const spread = out.events.findIndex(e => e.kind === 'status-state' && e.target === 'spare' && e.statuses.some(s => s.id === 'poison'));
    expect(spread).toBeGreaterThan(last);
    const corpses = out.events.map((e, index) => e.kind === 'message' && e.messageKey === 'combat:corpses.available' ? index : -1).filter(index => index >= 0);
    expect(corpses).toHaveLength(3);
    expect(corpses.every(index => index > last)).toBe(true);
  });
});


it('retains a positive shared source crit and uses spell dodge rather than physical dodge', () => {
  const body = dying(), critical = { ...body, stats: { ...body.stats, critChance: 1, critDamage: 2 } };
  const h = tank(), hero = { ...h, stats: { ...h.stats, physDodge: 0.9, magicDodge: 0 } };
  const spy = vi.spyOn(damage, 'rollDamage'), out = runBattleRecorded(snapshot([critical], [hero]));
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy.mock.calls[0]?.[0]).toMatchObject({ type: 'fire', defenderDodge: 0, critChance: 1 });
  const result = spy.mock.results[0];
  if (result?.type !== 'return') throw new Error('Missing native roll');
  const roll = result.value;
  expect(roll).toMatchObject({ hit: true, crit: true });
  if (!roll.hit) throw new Error('Expected fixed-seed landed crit');
  expect(bursts(out.events)).toMatchObject([{ damageType: 'physical', amount: roll.base, crit: true },
    { damageType: 'fire', amount: roll.base, crit: true }]);
});
