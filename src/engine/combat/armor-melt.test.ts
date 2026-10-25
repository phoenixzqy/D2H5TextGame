import { legacyRecording } from '@/test/combat-oracle';
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sorceressSkills from '../../data/skills/sorceress.json';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from '../skills/dataCatalog';
import type { DamageType } from '../types/attributes';
import * as rngModule from '../rng';
import { applyStatus, activeStatusView, statusActiveAt } from './status';
import { comboMultiplier } from './combo';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleResult } from './combat';
import type { ActiveStatus, CombatUnit, MonsterTier } from './types';

const authoredId = 'skills-sorceress-meteor';
const canonicalId = 'sorceress.meteor';
const meltId = 'armor-melt';
function marker(id: string, appliedAtMs = 0, expiresAtMs?: number): ActiveStatus {
  return { id, sourceId: 'first-source', stacks: 1, remaining: -1, appliedAtMs,
    ...(expiresAtMs === undefined ? {} : { expiresAtMs }) };
}
function poison(rate: number): ActiveStatus {
  return { ...marker('poison'), dotPerStack: rate, damageType: 'poison' };
}
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 24, tier: 'trash',
    life: 100, mana: 50,
    stats: { life: 100, lifeMax: 100, mana: 100, manaMax: 100, attack: 100, defense: 20, magicResist: 20,
      attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
/** Explicit engine fixture: one real Meteor at1700, original hero dies at2000. */
function meteor(rank = 1, tier: MonsterTier = 'trash', seed = 5): CombatSnapshot {
  return { seed,
    playerTeam: [{ ...unit('hero', 'player'), skillOrder: [authoredId], skillLevels: { [authoredId]: rank },
      statuses: [marker('stun', 1701), poison(50)] }],
    enemyTeam: [{ ...unit('target', 'enemy'), tier, life: 10000,
      stats: { ...unit('target', 'enemy').stats, life: 10000, lifeMax: 10000 }, statuses: [marker('stun')] }]
  };
}
function targetUnit(input: CombatSnapshot): CombatUnit {
  const target = input.enemyTeam[0];
  if (!target) throw new Error('Missing fixture target');
  return target;
}
function row() {
  const skill = PLAYABLE_CLASS_SKILL_DATA.sorceress.find(skill => skill.id === authoredId);
  if (!skill) throw new Error('Actual Meteor is missing');
  return skill;
}
function record(input: CombatSnapshot): RecordedBattleResult {
  const before = structuredClone({ input, data: sorceressSkills, registered: getSkill(canonicalId) });
  const result = runBattleRecorded(input);
  expect({ input, data: sorceressSkills, registered: getSkill(canonicalId) }).toEqual(before);
  return result;
}
function replay(input: CombatSnapshot): RecordedBattleResult {
  const result = record(input);
  expect(runBattle(input)).toEqual(result.result);
  expect(record(input)).toEqual(result);
  return result;
}
function hits(result: RecordedBattleResult) { return result.events.filter(event => event.kind === 'damage'); }
function direct(type: DamageType = 'fire', statuses: readonly ActiveStatus[] = [marker(meltId)], defense = 20, seed = 7): CombatSnapshot {
  registerSkill({ id: 'fixture.melt-hit', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
    manaCost: 0, cooldown: 100, effects: [{ kind: 'damage', damageType: type, base: [100, 100] }] });
  const input = meteor(1, 'trash', seed);
  return { ...input,
    playerTeam: input.playerTeam.map(hero => ({ ...hero, skillOrder: ['fixture.melt-hit'] })),
    enemyTeam: input.enemyTeam.map(target => ({ ...target, stats: { ...target.stats, defense },
      statuses: [marker('stun'), ...statuses] })) };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('P08a08 actual Meteor to registry to recorded combat', () => {
  it('forwards ordered Burn metadata separately from the exact authored timed Melt', () => {
    expect(getSkill(authoredId)).toBe(getSkill(canonicalId));
    expect(getSkill(canonicalId)?.effects).toEqual([{ kind: 'damage', damageType: 'fire',
      base: [100, 150], perRank: [10, 10], tags: ['fire', 'burn', 'amp-damage'],
      applyStatuses: [{ id: 'burn', dotPctOfDamage: 0.1 }, { id: meltId, chance: 1, durationMs: 3000 }] }]);
    expect(registeredSkillFromJson(row())).toEqual(getSkill(canonicalId));
    const { additionalStatusEffects: _metadata, ...legacy } = row();
    expect(registeredSkillFromJson(legacy).effects).toEqual([{ kind: 'damage', damageType: 'fire',
      base: [100, 150], perRank: [10, 10], tags: ['fire', 'burn', 'amp-damage'],
      applyStatus: { id: 'burn', dotPctOfDamage: 0.1 } }]);
    for (const fields of [{ id: 'mskill-meteor' }, { damageType: 'cold' as const },
      { appliesStatus: ['armor-melt', 'burn'] }, { appliesStatus: ['burn', 'armor-melt', 'freeze'] }]) {
      expect(registeredSkillFromJson({ ...row(), ...fields }).effects.some(effect =>
        effect.kind === 'damage' && effect.applyStatuses !== undefined)).toBe(false);
    }
  });

  for (const tier of ['trash', 'boss', 'chapter-boss'] as const) {
    it.each([1, 20])(`rank%s applies ordered three-second Melt to ${tier} after the unchanged triggering hit`, rank => {
      const input = meteor(rank, tier);
      const r = replay(input);
      expect(hits(r)).toEqual([expect.objectContaining({ source: 'hero', target: 'target',
        damageType: 'fire', amount: rank === 1 ? 119 : 309, dodged: false, crit: false, simClockMs: 1700 })]);
      expect(r.events.filter(e => e.kind === 'status').map(e => [e.target, e.statusId, e.simClockMs]))
        .toEqual([['target', 'burn', 1700], ['target', meltId, 1700]]);
      expect(r.events.filter(e => e.kind === 'mana')).toEqual([
        expect.objectContaining({ target: 'hero', mana: 0, reason: 'cast', simClockMs: 1700 })]);
      const target = r.result.enemyTeam[0];
      expect(target?.statuses.find(s => s.id === meltId)).toEqual({ id: meltId, sourceId: 'hero',
        stacks: 1, remaining: 3, appliedAtMs: 1700, expiresAtMs: 4700, damageType: 'fire' });
      expect(target?.statuses.find(s => s.id === 'ignite')?.dotPerStack).toBe(rank === 1 ? 11 : 30);
      expect(target?.statuses.find(s => s.id === meltId)).not.toHaveProperty('dotPerStack');
      expect(target?.stats).toEqual(input.enemyTeam[0]?.stats);
    });
  }

  it('uses already active Melt for the triggering Meteor but never applies the new one early', () => {
    const input = meteor();
    const active = { ...input, enemyTeam: input.enemyTeam.map(target => ({ ...target,
      statuses: [...target.statuses, marker(meltId)] })) };
    expect(hits(replay(input))[0]?.amount).toBe(119);
    expect(hits(replay(active))[0]?.amount).toBe(125);
    const { additionalStatusEffects: _metadata, ...legacy } = row();
    registerSkill(registeredSkillFromJson(legacy));
    expect(hits(replay(input))[0]?.amount).toBe(119);
  });

  it('consumes hit/range/crit/Burn/Melt in per-target AoE order using the real seeded RNG', () => {
    const input = meteor();
    const targets = ['first-monster', 'taunting-summon', 'last-monster'].map((id, index) => ({ ...targetUnit(input), id,
      gridPosition: { row: id === 'taunting-summon' ? 0 : 1, col: index },
      kind: id === 'taunting-summon' ? 'summon' as const : 'monster' as const }));
    const random = rngModule.createRng(5);
    const chance = vi.spyOn(random, 'chance');
    const range = vi.spyOn(random, 'nextInt');
    const original = rngModule.createRng;
    vi.spyOn(rngModule, 'createRng').mockImplementation(seed => seed === 5 ? random : original(seed));
    const r = record({ ...input, enemyTeam: targets });
    expect(r.events.filter(e => e.kind === 'damage' || e.kind === 'status').map(e => e.kind === 'damage'
      ? ['hit', e.target, e.amount] : ['status', e.target, e.statusId])).toEqual([
      ['hit', 'taunting-summon', 119], ['status', 'taunting-summon', 'burn'], ['status', 'taunting-summon', meltId],
      ['hit', 'first-monster', 116], ['status', 'first-monster', 'burn'], ['status', 'first-monster', meltId],
      ['hit', 'last-monster', 117], ['status', 'last-monster', 'burn'], ['status', 'last-monster', meltId]
    ]);
    expect(chance.mock.calls.map(call => call[0])).toEqual([0.85, 0, 1, 1, 0.85, 0, 1, 1, 0.85, 0, 1, 1]);
    expect(range.mock.calls).toEqual([[100, 150], [100, 150], [100, 150]]);
    expect(random.next()).toBe(0.30045507149770856);
  });

  it('spends mana on a natural miss and skips both status draws before the next target', () => {
    const input = meteor(1, 'trash', 4);
    const r = replay({ ...input, enemyTeam: ['missed', 'hit'].map((id, col) => ({ ...targetUnit(input), id, gridPosition: { row: 1, col } })) });
    expect(hits(r).map(e => [e.target, e.amount, e.dodged])).toEqual([['missed', 0, true], ['hit', 91, false]]);
    expect(r.events.filter(e => e.kind === 'status').map(e => [e.target, e.statusId]))
      .toEqual([['hit', 'burn'], ['hit', meltId]]);
    expect(r.result.playerTeam[0]?.mana).toBe(0);
    expect(r.result.enemyTeam[0]?.statuses.some(s => s.id === meltId)).toBe(false);
  });

  it.each([{ mana: 49, level: 24 }, { mana: 50, level: 23 }])('keeps $mana MP/level$level ineligible', fields => {
    const input = meteor();
    const r = replay({ ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero, ...fields })) });
    expect(r.events.filter(e => e.kind === 'status' || e.kind === 'mana')).toEqual([]);
    expect(r.result.playerTeam[0]?.mana).toBe(fields.mana);
    expect(r.events.some(e => e.kind === 'action' && e.skillId === canonicalId)).toBe(false);
  });

  it('applies both statuses before lethal finalization and ignores already dead targets', () => {
    const input = meteor();
    const r = replay({ ...input, enemyTeam: [{ ...targetUnit(input), id: 'dead', life: 0 },
      { ...targetUnit(input), id: 'lethal', life: 1 }] });
    expect(r.events.filter(e => e.kind === 'damage' || e.kind === 'status' || e.kind === 'death').map(e =>
      e.kind === 'damage' ? ['hit', e.target, e.amount] : e.kind === 'status'
        ? ['status', e.target, e.statusId] : ['death', e.target]))
      .toEqual([['hit', 'lethal', 119], ['status', 'lethal', 'burn'], ['status', 'lethal', meltId], ['death', 'lethal']]);
  });

  it('passes an explicit on-hit duration through the canonical resolver', () => {
    const input = direct();
    registerSkill({ id: 'fixture.melt-hit', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
      manaCost: 0, cooldown: 100, effects: [{ kind: 'damage', damageType: 'fire', base: [100, 100],
        applyStatus: { id: meltId, chance: 1, durationMs: 1234 } }] });
    const fresh = { ...input, enemyTeam: input.enemyTeam.map(target => ({ ...target, statuses: [marker('stun')] })) };
    expect(replay(fresh).result.enemyTeam[0]?.statuses.find(s => s.id === meltId)?.expiresAtMs).toBe(2934);
  });
});

describe('Armor Melt shared pre-hit defense and single fire-combo bonus', () => {
  it.each(['physical', 'fire', 'poison', 'thorns'] as const)('reduces ordinary defense for %s once', type => {
    const input = direct(type);
    const r = replay(input);
    expect(hits(r)[0]?.amount).toBe(type === 'physical' ? 111 : 86);
    expect(hits(replay(direct(type, [])))[0]?.amount).toBe(80);
    expect(r.result.enemyTeam[0]?.stats).toEqual(input.enemyTeam[0]?.stats);
    expect(hits(replay(direct(type, [marker(meltId), marker(meltId)])))[0]?.amount)
      .toBe(type === 'physical' ? 111 : 86);
  });
  it.each(['cold', 'lightning', 'arcane'] as const)('preserves magicResist for %s', type => {
    expect(hits(replay(direct(type)))[0]?.amount).toBe(80);
    expect(hits(replay(direct(type, [])))[0]?.amount).toBe(80);
  });
  it('composes with Inner Sight multiplicatively without early flooring', () => {
    const statuses = [marker(meltId), marker('merc-inner-sight')];
    expect(hits(replay(direct('fire', statuses, 21)))[0]?.amount).toBe(88);
    expect(hits(replay(direct('physical', statuses, 21)))[0]?.amount).toBe(113);
    expect(hits(replay(direct('fire', [], 21)))[0]?.amount).toBe(79);
  });
  it.each([
    { label: 'onset', status: marker(meltId, 1700, 1701), amount: 86 },
    { label: 'expiry', status: marker(meltId, 0, 1700), amount: 80 },
    { label: 'future', status: marker(meltId, 1700.25, 2000), amount: 80 }
  ])('honors half-open $label for both projection and combo', ({ status, amount }) => {
    expect(hits(replay(direct('fire', [status])))[0]?.amount).toBe(amount);
    expect(hits(replay(direct('physical', [status])))[0]?.amount).toBe(amount === 86 ? 111 : 80);
  });
  for (const tier of ['trash', 'boss', 'chapter-boss'] as const) {
    it.each(['burn', 'ignite'])(`${tier}: %s-only, Melt-only, both share one physical bonus`, burn => {
      const target = { ...unit('target', 'enemy'), tier };
      for (const statuses of [[marker(burn)], [marker(meltId)], [marker(burn), marker(meltId)]]) {
        expect(comboMultiplier({ ...target, statuses }, 'physical')).toBe(tier === 'trash' ? 1.25 : 1.125);
      }
      const statuses = [marker(burn), marker(meltId)];
      const input = direct('physical', statuses);
      expect(hits(replay({ ...input, enemyTeam: input.enemyTeam.map(target => ({ ...target, tier })) }))[0]?.amount)
        .toBe(tier === 'trash' ? 111 : 98);
    });
  }
  it('preserves Burn→poison and other combo branches while keeping periodic rates unmitigated', () => {
    expect(comboMultiplier({ ...unit('target', 'enemy'), statuses: [marker('burn'), marker(meltId)] }, 'poison')).toBe(1.15);
    const target = { ...unit('target', 'enemy'), statuses: [marker('chill'), marker('bleed'), marker(meltId)] };
    expect(comboMultiplier(target, 'physical')).toBeCloseTo(1.1 * 1.1 * 1.25);
    const input = direct('fire', [marker(meltId), poison(3)]);
    const control = { ...input, enemyTeam: input.enemyTeam.map(target => ({ ...target,
      statuses: target.statuses.filter(s => s.id !== meltId) })) };
    const r = replay(input);
    expect(r.events.filter(e => e.kind === 'dot')).toEqual(replay(control).events.filter(e => e.kind === 'dot'));
    expect(r.events.reduce((sum, e) => sum + (e.kind === 'dot' && e.target === 'target' ? e.amount : 0), 0)).toBe(6);
  });
  it('preserves the prepatch no-Melt control apart from corrected terminal cooldown publication', () => {
    const r = replay(direct('fire', []));
    expect(r.result.playerTeam[0]?.cooldowns).toEqual({ 'fixture.melt-hit': 99700 });
    const hero = r.result.playerTeam[0];
    if (!hero) throw new Error('Missing golden hero');
    const control = { ...r, result: { ...r.result, playerTeam: [{ ...hero, cooldowns: {} }] } };
    // Preserve all other fields of the full original recording; BUG235 changes only this cache.
    expect(createHash('sha256').update(JSON.stringify(legacyRecording(control))).digest('hex'))
      .toBe('bc410c62608c3265818f4f00473705edca576549f4fc6321574ac5e7c05d3484');
    expect(hits(r)[0]?.amount).toBe(80);
  });
  it('preserves natural miss and crit rolls through the same damage pipeline', () => {
    expect(hits(replay(direct('physical', [marker(meltId)], 20, 4)))[0]).toMatchObject({ amount: 0, dodged: true });
    const input = direct('fire');
    const critical = { ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
      stats: { ...hero.stats, critChance: 1 } })) };
    expect(hits(replay(critical))[0]).toMatchObject({ amount: 186, crit: true, dodged: false });
  });
});

describe('Armor Melt canonical lifecycle without source/stat drift', () => {
  it('retains original source/start/payload, maximum expiry and indefinite state without stacking', () => {
    const target = unit('target', 'enemy');
    const rng = rngModule.createRng(5);
    const apply = (value: CombatUnit, sourceId: string, simClockMs: number, durationMs = 3000) =>
      applyStatus(value, { id: meltId, sourceId, simClockMs, durationMs }, rng);
    const first = apply(target, 'first', 100);
    expect(first.statuses).toEqual([{ id: meltId, sourceId: 'first', stacks: 1, remaining: 3, appliedAtMs: 100, expiresAtMs: 3100 }]);
    expect(apply(first, 'second', 200).statuses).toEqual([{ ...first.statuses[0], expiresAtMs: 3200 }]);
    expect(apply(first, 'second', 200, 1).statuses).toEqual(first.statuses);
    const indefinite = { ...first, statuses: [marker(meltId)] };
    const refreshed = apply(indefinite, 'second', 200).statuses;
    expect(refreshed).toEqual([{ ...indefinite.statuses[0], remaining: 3 }]);
    expect(refreshed[0]).not.toHaveProperty('expiresAtMs');
    expect(refreshed[0] && statusActiveAt(refreshed[0], 1_000_000)).toBe(true);
    for (const old of [marker(meltId, 0, 100), marker(meltId, 200, 400)]) {
      expect(apply({ ...target, statuses: [old] }, 'fresh', 100).statuses).toEqual(first.statuses.map(s => ({ ...s, sourceId: 'fresh' })));
    }
    expect(target.statuses).toEqual([]);
    expect(first.stats).toEqual(target.stats);
    expect(activeStatusView(first, 3100).statuses).toEqual([]);
  });

  it('keeps source death from dispelling real Meteor Melt before a later ally hit', () => {
    const input = direct('fire');
    const hero = { ...unit('hero', 'player'), skillOrder: ['fixture.melt-hit'],
      statuses: [marker('stun', 0, 3400), poison(25)] };
    const caster = { ...unit('caster', 'player'), kind: 'merc' as const, skillOrder: [authoredId],
      statuses: [marker('stun', 1701), { ...poison(50), id: 'bleed', damageType: 'physical' as const }] };
    const r = replay({ ...input, seed: 5, playerTeam: [hero, caster],
      enemyTeam: input.enemyTeam.map(target => ({ ...target, statuses: [marker('stun')] })) });
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'caster', simClockMs: 2000 }));
    expect(hits(r).filter(e => e.source === 'hero')).toEqual([
      expect.objectContaining({ target: 'target', amount: 86, simClockMs: 3400 })]);
    expect(r.result.enemyTeam[0]?.statuses.find(s => s.id === meltId)?.sourceId).toBe('caster');
  });
});
