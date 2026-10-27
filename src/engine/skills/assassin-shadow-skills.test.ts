import { describe, expect, it } from 'vitest';
import policy from '../../data/summons/assassin-shadow-skills.json';
import authored from '../../data/skills/assassin.json';
import { composeAssassinShadowSkills, copyAssassinShadowSkills, qualifyAssassinShadow,
  resolveAssassinShadowPolicy } from './assassin-shadow-skills';
import type { CombatUnit } from '../combat/types';
import { getAssassinSummonStats } from './assassin-summon-definition';
import { getSkill } from './registry';

const levels: Record<string, number> = Object.fromEntries(authored.map(row => [row.id, 1]));
const player = (comboOrder = ['assassin.shadow_warrior', 'assassin.fire_blast']) => ({
  class: 'assassin' as const, level: 30, skillLevels: { ...levels }, comboOrder
});

describe('native shadow captured skill policy', () => {
  it('captures ordered selected legal attacks once with literal learned/shadow rank caps', () => {
    const owner = player(['skills-assassin-shadow-warrior', 'skills-assassin-fire-blast',
      'assassin.fire_blast', 'assassin.dragon_talon', 'assassin.fade', 'assassin.burst_of_speed',
      'assassin.cloak_of_shadows', 'assassin.shadow_master', 'sorceress.fire_bolt']);
    owner.skillLevels['skills-assassin-shadow-warrior'] = 6;
    owner.skillLevels['skills-assassin-fire-blast'] = 20;
    owner.skillLevels['skills-assassin-dragon-talon'] = 3;
    expect(composeAssassinShadowSkills(owner).shadow_warrior).toEqual({ summonRank: 6,
      attacks: [{ id: 'assassin.fire_blast', rank: 6 }, { id: 'assassin.dragon_talon', rank: 3 }] });
  });

  it.each([1, 20])('Master rank %i uses the authored independent pool with no selected attacks', rank => {
    const owner = player(['assassin.shadow_master']);
    owner.skillLevels['skills-assassin-shadow-master'] = rank;
    expect(composeAssassinShadowSkills(owner).shadow_master).toEqual({ summonRank: rank,
      attacks: policy.master.attackSkills.map(id => ({ id, rank })) });
    expect(composeAssassinShadowSkills(player(['assassin.shadow_warrior'])).shadow_warrior)
      .toEqual({ summonRank: 1, attacks: [] });
  });

  it('keeps exact authored/canonical aliases and selects their highest valid allocation', () => {
    const owner = player();
    Object.assign(owner.skillLevels, { 'assassin.shadow_warrior': 6, 'assassin.fire_blast': 4,
      'skills-assassin-fire-blast': 2 });
    expect(composeAssassinShadowSkills(owner).shadow_warrior?.attacks)
      .toEqual([{ id: 'assassin.fire_blast', rank: 4 }]);
    expect(composeAssassinShadowSkills({ ...owner,
      comboOrder: ['shadow-warrior', 'assassin.fire_blast'] })).toEqual({});
  });

  it('rejects foreign, low-level, unslotted and transitively unowned shadows', () => {
    expect(composeAssassinShadowSkills({ ...player(), class: 'amazon' })).toEqual({});
    expect(composeAssassinShadowSkills({ ...player(), level: 17 })).toEqual({});
    expect(composeAssassinShadowSkills(player(['assassin.fire_blast']))).toEqual({});
    const owner = player();
    delete owner.skillLevels['skills-assassin-claw-mastery'];
    expect(composeAssassinShadowSkills(owner)).toEqual({});
    delete owner.skillLevels['skills-assassin-shadow-warrior'];
    owner.skillLevels['assassin.shadow_warrior'] = 1;
    expect(composeAssassinShadowSkills({ ...owner, level: Number.NaN })).toEqual({});
  });

  it.each([0, -1, 1.5, 21, Number.NaN, Number.POSITIVE_INFINITY])('rejects illegal shadow allocation %s', rank => {
    const owner = player();
    owner.skillLevels['skills-assassin-shadow-warrior'] = rank;
    expect(composeAssassinShadowSkills(owner)).toEqual({});
  });

  it('excludes unlearned, locked and transitively unowned selected attacks', () => {
    const owner = player(['assassin.shadow_warrior', 'assassin.fire_blast',
      'assassin.phoenix_strike', 'assassin.dragon_claw', 'assassin.mind_blast']);
    delete owner.skillLevels['skills-assassin-fire-blast'];
    delete owner.skillLevels['skills-assassin-dragon-talon'];
    delete owner.skillLevels['skills-assassin-psychic-hammer'];
    expect(composeAssassinShadowSkills({ ...owner, level: 18 }).shadow_warrior?.attacks).toEqual([]);
  });

  it('captures fresh frozen ranks/order without freezing or mutating owner input', () => {
    const owner = player(), before = structuredClone(owner);
    const captured = composeAssassinShadowSkills(owner), copied = copyAssassinShadowSkills(captured);
    expect(owner).toEqual(before);
    expect(Object.isFrozen(owner.skillLevels)).toBe(false);
    owner.comboOrder.length = 0;
    owner.skillLevels['skills-assassin-fire-blast'] = 20;
    expect(captured.shadow_warrior?.attacks).toEqual([{ id: 'assassin.fire_blast', rank: 1 }]);
    expect(copied).toEqual(captured);
    expect(copied).not.toBe(captured);
    expect(copied.shadow_warrior).not.toBe(captured.shadow_warrior);
    expect(Object.isFrozen(copied.shadow_warrior?.attacks[0])).toBe(true);
  });

  it.each([
    null, [], { foreign: {} }, { shadow_warrior: { summonRank: 1, attacks: [], extra: true } },
    { shadow_warrior: { summonRank: 1, attacks: [{ id: 'assassin.fire_blast', rank: 2 }] } },
    { shadow_warrior: { summonRank: 1, attacks: [{ id: 'assassin.fade', rank: 1 }] } },
    { shadow_warrior: { summonRank: 1, attacks: [{ id: 'assassin.fire_blast', rank: 1 },
      { id: 'assassin.fire_blast', rank: 1 }] } },
    { shadow_master: { summonRank: 1, attacks: [] } }
  ])('refuses malformed or expanded captured authority %#', value => {
    expect(copyAssassinShadowSkills(value)).toEqual({});
  });

  it.each(['assassin.fade', 'assassin.shadow_warrior', 'assassin.cloak_of_shadows',
    'sorceress.fire_bolt', 'assassin.unknown', 'skills-assassin-fire-blast'])('refuses nonattack or noncanonical policy entry %s', id => {
    expect(() => resolveAssassinShadowPolicy({ ...policy,
      master: { ...policy.master, attackSkills: [id] } })).toThrow();
  });

  it('strictly validates policy and makes an independent immutable copy', () => {
    const raw = structuredClone(policy), resolved = resolveAssassinShadowPolicy(raw);
    raw.master.attackSkills.reverse();
    expect(resolved.master.attackSkills).toEqual(policy.master.attackSkills);
    expect(Object.isFrozen(raw)).toBe(false);
    expect(Object.isFrozen(resolved.master.attackSkills)).toBe(true);
    expect(() => resolveAssassinShadowPolicy({ ...policy, extra: true })).toThrow();
    expect(() => resolveAssassinShadowPolicy({ ...policy,
      master: { ...policy.master, attackSkills: ['assassin.fire_blast', 'assassin.fire_blast'] } })).toThrow();
  });

  it('requires own plan and attack fields rather than inherited rank authority', () => {
    const plan: unknown = Object.assign(Object.create({ summonRank: 1,
      attacks: [{ id: 'assassin.fire_blast', rank: 1 }] }) as Record<string, unknown>, { first: true, second: true });
    expect(copyAssassinShadowSkills({ shadow_warrior: plan })).toEqual({});
    const entry: unknown = Object.assign(Object.create({ id: 'assassin.fire_blast', rank: 1 }) as
      Record<string, unknown>, { first: true, second: true });
    expect(copyAssassinShadowSkills({ shadow_warrior: { summonRank: 1, attacks: [entry] } })).toEqual({});
  });
});

describe('paid shadow source qualification', () => {
  const skill = getSkill('assassin.shadow_warrior');
  if (!skill) throw new Error('Missing registered shadow source');
  const stats = getAssassinSummonStats('shadow_warrior');
  if (!stats) throw new Error('Missing shadow body tuning');
  const owner: CombatUnit & { assassinShadowSkills: ReturnType<typeof composeAssassinShadowSkills> } = {
    id: 'hero', name: 'Synthetic owner', side: 'player', kind: 'hero', level: 30,
    life: stats.lifeMax, mana: stats.manaMax, stats, tier: 'trash', statuses: [],
    cooldowns: {}, activeBuffIds: [], enraged: false,
    skillOrder: player().comboOrder, skillLevels: levels,
    assassinShadowSkills: composeAssassinShadowSkills(player()) };

  it('requires the exact authored source, allocated rank and native selected plan', () => {
    expect(qualifyAssassinShadow(owner, skill, 1)?.template).toBe('shadow_warrior');
    expect(qualifyAssassinShadow({ ...owner, assassinShadowSkills: {} }, skill, 1)).toBeUndefined();
    expect(qualifyAssassinShadow(owner, { ...skill, manaCost: skill.manaCost + 1 }, 1)).toBeUndefined();
    expect(qualifyAssassinShadow(owner, skill, 2)).toBeUndefined();
    expect(qualifyAssassinShadow({ ...owner, skillOrder: [] }, skill, 1)).toBeUndefined();
    expect(qualifyAssassinShadow({ ...owner, skillLevels: {} }, skill, 1)).toBeUndefined();
  });

  it('refuses a stale or forged plan whose attacks or transitive allocation disagree with the owner', () => {
    expect(qualifyAssassinShadow({ ...owner, skillOrder: ['assassin.shadow_warrior'] }, skill, 1)).toBeUndefined();
    expect(qualifyAssassinShadow({ ...owner, skillLevels: { ...levels,
      'skills-assassin-fire-blast': 0 } }, skill, 1)).toBeUndefined();
    expect(qualifyAssassinShadow({ ...owner, skillLevels: { ...levels,
      'skills-assassin-claw-mastery': 0 } }, skill, 1)).toBeUndefined();
  });

  it.each([{ side: 'enemy' as const }, { kind: 'summon' as const }, { summon: true },
    { ownerId: 'other' }, { summonOwnerId: 'other' }, { life: 0 }, { level: 17 }, { id: '' }])(
    'refuses wrong/dead/forged source roles %#', delta => {
      expect(qualifyAssassinShadow({ ...owner, ...delta }, skill, 1)).toBeUndefined();
    });
});
