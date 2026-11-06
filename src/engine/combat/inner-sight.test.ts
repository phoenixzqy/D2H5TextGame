import { MERC_ELEMENTAL_ARROWS } from '../skills/merc-elemental-arrows';
import { MERC_BLESSED_AIM_SKILL } from '../skills/merc-blessed-aim';
import { MERC_FROZEN_ARMOR_SKILL } from '../skills/merc-frozen-armor';
import { MERC_PILFER_SKILL } from '../skills/merc-pilfer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMercFromDef } from '../../stores/mercFactory';
import { mercToCombatUnit } from '../../stores/mercToCombatUnit';
import { loadMercPool } from '../../data/loaders/mercs';
import { getSkill, listSkills, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { MERC_STUB_SKILLS } from '../skills/aliases';
import { MERC_INNER_SIGHT_SKILL } from '../skills/inner-sight';
import type { DamageType } from '../types/attributes';
import * as rngModule from '../rng';
import { applyStatus } from './status';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleResult } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const skillId = 'mskill-inner-sight';
const statusId = 'merc-inner-sight';
function status(id: string, appliedAtMs = 0, expiresAtMs?: number): ActiveStatus {
  return { id, sourceId: 'first-source', stacks: 1, remaining: -1, appliedAtMs,
    ...(expiresAtMs === undefined ? {} : { expiresAtMs }) };
}
function poison(rate: number): ActiveStatus {
  return { ...status('poison'), dotPerStack: rate, damageType: 'poison' };
}
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 100, mana: 0,
    stats: { life: 100, lifeMax: 100, mana: 100, manaMax: 100, attack: 100, defense: 20, magicResist: 20,
      attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [status('stun')], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function replay(snapshot: CombatSnapshot): RecordedBattleResult {
  const before = structuredClone(snapshot);
  const result = runBattleRecorded(snapshot);
  expect(runBattle(snapshot)).toEqual(result.result);
  expect(runBattleRecorded(snapshot)).toEqual(result);
  expect(snapshot).toEqual(before);
  return result;
}
function hits(result: RecordedBattleResult) {
  return result.events.filter(event => event.kind === 'damage');
}
function direct(type: DamageType = 'physical', statuses: readonly ActiveStatus[] = [status(statusId)],
  defense = 20, base = 100, seed = 7): CombatSnapshot {
  registerSkill({ id: 'fixture.inner-sight-hit', archetype: 'fixture', minLevel: 1,
    target: 'single-enemy', cooldown: 100, manaCost: 0,
    effects: [{ kind: 'damage', damageType: type, base: [base, base] }] });
  const hero = { ...unit('hero', 'player'), statuses: [status('stun', 1701), poison(50)],
    skillOrder: ['fixture.inner-sight-hit'] };
  const enemy = { ...unit('enemy', 'enemy'), life: 1000,
    stats: { ...unit('enemy', 'enemy').stats, life: 1000, lifeMax: 1000, defense },
    statuses: [status('stun'), ...statuses] };
  return { seed, playerTeam: [hero], enemyTeam: [enemy] };
}
function rogue() {
  const definition = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight');
  if (!definition) throw new Error('Actual starter Rogue is missing');
  const before = structuredClone(definition);
  const merc = createMercFromDef(definition);
  const saved = structuredClone(merc);
  const runtime = mercToCombatUnit(merc);
  expect(definition).toEqual(before);
  expect(merc).toEqual(saved);
  expect(runtime.skillOrder).toEqual([skillId, 'mskill-basic-arrow', 'mskill-pierce-arrow']);
  expect(runtime.stats.attackSpeed).toBe(122);
  return runtime;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('Rogue Inner Sight registration and native lifecycle', () => {
  it('restores the exact authored skill on repeated default loads and preserves unrelated stubs', () => {
    const ids = [...listSkills()].sort();
    for (let i = 0; i < 3; i++) {
      registerSkill({ ...MERC_INNER_SIGHT_SKILL, effects: [], manaCost: 999 });
      loadDefaultSkills();
      expect(getSkill(skillId)).toBe(MERC_INNER_SIGHT_SKILL);
      expect([...listSkills()].sort()).toEqual(ids);
    }
    expect(getSkill(skillId)).not.toHaveProperty('isBuff');
    expect(getSkill('mskill-frozen-armor')).toBe(MERC_FROZEN_ARMOR_SKILL);
    expect(getSkill('mskill-pilfer')).toBe(MERC_PILFER_SKILL);
    expect(getSkill('aura-blessed-aim')).toBe(MERC_BLESSED_AIM_SKILL);
    for (const arrow of MERC_ELEMENTAL_ARROWS) expect(getSkill(arrow.id)).toBe(arrow);
    for (const stub of MERC_STUB_SKILLS.filter(row => row.id !== skillId && row.id !== 'mskill-minor-heal' && row.id !== 'mskill-frozen-armor' && row.id !== 'mskill-pilfer' && row.id !== 'aura-blessed-aim' && !MERC_ELEMENTAL_ARROWS.some(arrow => arrow.id === row.id))) {
      expect(getSkill(stub.id)).toBe(stub);
    }
  });

  it('casts from the unchanged real factory Rogue, then recasts at 7620ms while the status is active', () => {
    const native = rogue();
    const hero = { ...unit('hero', 'player'), statuses: [status('stun'), poison(100 / 7.8)] };
    const enemy = { ...unit('enemy', 'enemy'), life: 10000,
      stats: { ...unit('enemy', 'enemy').stats, life: 10000, lifeMax: 10000 } };
    const r = replay({ seed: 7, playerTeam: [hero, native], enemyTeam: [enemy] });
    expect(r.events.filter(e => e.kind === 'action' && e.skillId === skillId).map(e => e.simClockMs))
      .toEqual([1524, 7620]);
    expect(r.events.filter(e => e.kind === 'status' && e.statusId === statusId).map(e => e.simClockMs))
      .toEqual([1524, 7620]);
    expect(hits(r).some(e => e.simClockMs === 1524 || e.simClockMs === 7620)).toBe(false);
    expect(r.result.enemyTeam[0]?.statuses.filter(s => s.id === statusId)).toEqual([
      { id: statusId, sourceId: native.id, stacks: 1, remaining: 8, appliedAtMs: 1524, expiresAtMs: 15620, innerSight: { defenseReductionPct: 25 } }
    ]);
    const resultMerc = r.result.playerTeam.find(row => row.id === native.id);
    expect(resultMerc?.stats).toEqual(native.stats);
    expect(resultMerc?.skillOrder).toEqual(native.skillOrder);
    expect(resultMerc?.activeBuffIds).toEqual([]);
    expect(resultMerc?.mana).toBe(native.mana);
  });

  it.each([1, 20])('applies rank %s to every living tier in existing order without RNG or damage', rank => {
    const caster = { ...unit('caster', 'player'), kind: 'merc' as const,
      statuses: [status('stun', 1701)], skillOrder: [skillId], skillLevels: { [skillId]: rank } };
    const hero = { ...unit('hero', 'player'), statuses: [status('stun'), poison(50)] };
    const enemies = (['trash', 'elite', 'boss', 'chapter-boss'] as const).map(tier => ({
      ...unit(tier, 'enemy'), tier, stats: { ...unit(tier, 'enemy').stats, physDodge: 0.8, magicDodge: 0.8 }
    }));
    const dead = { ...unit('dead', 'enemy'), life: 0 };
    const random = rngModule.createRng(7);
    const chance = vi.spyOn(random, 'chance');
    const range = vi.spyOn(random, 'nextInt');
    const next = vi.spyOn(random, 'next');
    const original = rngModule.createRng;
    vi.spyOn(rngModule, 'createRng').mockImplementation(seed => seed === 7 ? random : original(seed));
    const r = runBattleRecorded({ seed: 7, playerTeam: [hero, caster], enemyTeam: [...enemies, dead] });
    expect(r.events.filter(e => e.kind === 'status')).toEqual(enemies.map((e): unknown =>
      expect.objectContaining({ kind: 'status', target: e.id, statusId, simClockMs: 1700 })));
    for (const enemy of r.result.enemyTeam.slice(0, 4)) {
      expect(enemy.statuses.filter(s => s.id === statusId)).toEqual([
        { id: statusId, sourceId: 'caster', stacks: 1, remaining: 8, appliedAtMs: 1700, expiresAtMs: 9700, innerSight: { defenseReductionPct: 25 } }
      ]);
    }
    expect(r.result.enemyTeam.at(-1)?.statuses.some(s => s.id === statusId)).toBe(false);
    expect(hits(r)).toEqual([]);
    expect(chance).not.toHaveBeenCalled();
    expect(range).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(random.next()).toBe(0.011704753153026104);
  });

  it('keeps the first active source and max expiry without stacking or refreshing Amazon status', () => {
    const target = { ...unit('enemy', 'enemy'), statuses: [status('inner-sight', 0, 20000)] };
    const random = rngModule.createRng(7);
    const apply = (value: CombatUnit, sourceId: string, simClockMs: number) => applyStatus(value,
      { id: statusId, sourceId, simClockMs, duration: 8, durationMs: 8000 }, random);
    const first = apply(target, 'first', 1524);
    expect(first.statuses.find(s => s.id === statusId)?.expiresAtMs).toBe(9524);
    const refreshed = apply(first, 'second', 7620);
    expect(refreshed.statuses).toEqual([target.statuses[0],
      { id: statusId, sourceId: 'first', stacks: 1, remaining: 8, appliedAtMs: 1524, expiresAtMs: 15620 }]);
    const longer = { ...first, statuses: first.statuses.map(s => s.id === statusId ? { ...s, expiresAtMs: 25000 } : s) };
    expect(apply(longer, 'second', 7620).statuses.find(s => s.id === statusId)?.expiresAtMs).toBe(25000);
    for (const stored of [status(statusId, 0, 1524), status(statusId, 2000, 25000)]) {
      expect(apply({ ...target, statuses: [stored] }, 'fresh', 1524).statuses).toEqual([
        { id: statusId, sourceId: 'fresh', stacks: 1, remaining: 8, appliedAtMs: 1524, expiresAtMs: 9524 }
      ]);
    }
  });

  it('retains the debuff after its Rogue source dies and strengthens the later hero hit', () => {
    const native = rogue();
    const hero = { ...unit('hero', 'player'), statuses: [poison(25)] };
    const dyingRogue = { ...native, statuses: [{ ...poison(native.life / 2), id: 'ignite', damageType: 'fire' as const }] };
    const enemy = { ...unit('enemy', 'enemy'), life: 1000,
      stats: { ...unit('enemy', 'enemy').stats, life: 1000, lifeMax: 1000 } };
    const r = replay({ seed: 1, playerTeam: [hero, dyingRogue], enemyTeam: [enemy] });
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'death', target: native.id, simClockMs: 2000 }));
    expect(hits(r).filter(e => e.source === 'hero').map(e => [e.simClockMs, e.amount])).toEqual([[1700, 85], [3400, 85]]);
    expect(r.result.enemyTeam[0]?.statuses.find(s => s.id === statusId)?.sourceId).toBe(native.id);
  });
});

describe('Inner Sight active pre-hit defense projection', () => {
  it.each(['physical', 'fire', 'poison', 'thorns'] as const)('projects ordinary defense for %s without mutating stats', type => {
    const snapshot = direct(type);
    const r = replay(snapshot);
    expect(hits(r)).toEqual([expect.objectContaining({ amount: 85, damageType: type, dodged: false, simClockMs: 1700 })]);
    expect(r.result.enemyTeam[0]?.life).toBe(915);
    expect(r.result.enemyTeam[0]?.stats).toEqual(snapshot.enemyTeam[0]?.stats);
    expect(hits(replay(direct(type, [])))[0]?.amount).toBe(80);
  });

  it.each(['cold', 'lightning', 'arcane'] as const)('keeps magic mitigation unchanged for %s', type => {
    expect(hits(replay(direct(type)))[0]?.amount).toBe(80);
    expect(hits(replay(direct(type, [])))[0]?.amount).toBe(80);
  });

  it.each([[21, 100, 84], [0, 100, 100], [200, 100, 1]] as const)(
    'retains fractional defense and ordinary minimum: defense%s base%s final%s', (defense, base, amount) => {
      expect(hits(replay(direct('physical', [status(statusId)], defense, base)))[0]?.amount).toBe(amount);
    });

  it.each([
    { label: 'onset', effect: status(statusId, 1700, 1701), amount: 85 },
    { label: 'expiry', effect: status(statusId, 0, 1700), amount: 80 },
    { label: 'future', effect: status(statusId, 1700.25, 2000), amount: 80 },
    { label: 'legacy Amazon', effect: status('inner-sight'), amount: 80 },
    { label: 'obsolete merc buff marker', effect: status('inner_sight'), amount: 80 }
  ])('honors $label at the shared pre-hit boundary', ({ effect, amount }) => {
    expect(hits(replay(direct('physical', [effect])))[0]).toMatchObject({ amount, simClockMs: 1700 });
  });

  it('preserves the natural seed4 miss without removing dodge or changing damage RNG', () => {
    const cursed = replay(direct('physical', [status(statusId)], 20, 100, 4));
    const control = replay(direct('physical', [], 20, 100, 4));
    expect(hits(cursed)).toEqual(hits(control));
    expect(hits(cursed)[0]).toMatchObject({ amount: 0, dodged: true });
  });

  it('does not reduce existing periodic poison rates', () => {
    const snapshot = direct('physical', [status(statusId), { ...poison(3), expiresAtMs: 2000 }]);
    const r = replay(snapshot);
    const control = replay({ ...snapshot, enemyTeam: snapshot.enemyTeam.map(e => ({ ...e,
      statuses: e.statuses.filter(s => s.id !== statusId) })) });
    expect(r.events.filter(e => e.kind === 'dot')).toEqual(control.events.filter(e => e.kind === 'dot'));
    expect(r.events.reduce((sum, e) => sum + (e.kind === 'dot' && e.target === 'enemy' ? e.amount : 0), 0)).toBe(6);
  });

  it('uses one reduction for duplicate markers and leaves on-hit poison based on ordinary direct damage', () => {
    const snapshot = direct('physical', [status(statusId), status(statusId)]);
    registerSkill({ id: 'fixture.inner-sight-hit', archetype: 'fixture', minLevel: 1,
      target: 'single-enemy', cooldown: 100, manaCost: 0, effects: [{ kind: 'damage', damageType: 'physical',
        base: [100, 100], applyStatus: { id: 'poison', chance: 1, dotPctOfDamage: 0.5 } }] });
    const r = replay(snapshot);
    expect(hits(r)[0]?.amount).toBe(85);
    expect(r.result.enemyTeam[0]?.statuses.find(s => s.id === 'poison')?.dotPerStack).toBe(42);
  });

  it('preserves the complete true no-status control recording and result', () => {
    const r = replay(direct('physical', []));
    console.log('INNER_SIGHT_NO_STATUS_CONTROL', JSON.stringify(r));
    expect(hits(r)).toEqual([expect.objectContaining({ amount: 80, dodged: false, simClockMs: 1700 })]);
    expect(r.result.enemyTeam[0]?.life).toBe(920);
  });
});
