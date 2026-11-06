import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from '@/stores/mercFactory';
import { mercToCombatUnit } from '@/stores/mercToCombatUnit';
import * as rngModule from '../rng';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { MERC_BLESSED_AIM_SKILL } from '../skills/merc-blessed-aim';
import { composeStatAura } from '../skills/stat-auras';
import { buildSummon } from '../skills/summons';
import { ProjectileFlights } from './projectile-flight';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const realCreateRng = rngModule.createRng;
const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'aim-fixture', stacks: 1,
  remaining: -1, appliedAtMs });
const poison: ActiveStatus = { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1,
  dotPerStack: 10, damageType: 'poison' };
function source(patch: Partial<CombatUnit> = {}): CombatUnit {
  const def = loadMercPool().pool.find(row => row.id === 'mercs/act2-blessed-aim');
  if (!def) throw new Error('Missing native Blessed Aim merc');
  return { ...mercToCombatUnit(createMercFromDef(def, 'aim-combat')), statuses: [hold()], ...patch };
}
function actor(patch: Partial<CombatUnit> = {}): CombatUnit {
  const native = source();
  return { ...native, id: 'aim-actor', kind: 'hero', level: 99, skillOrder: [],
    life: 1000000, mana: 1000000, attackRange: [10, 10], statuses: [hold(401)],
    stats: { ...native.stats, life: 1000000, lifeMax: 1000000, mana: 1000000, manaMax: 1000000,
      attack: 10, attackSpeed: 263, critChance: 0, critDamage: 2, defense: 0, magicResist: 0,
      physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } }, ...patch };
}
function target(patch: Partial<CombatUnit> = {}): CombatUnit {
  return actor({ id: 'aim-target', kind: 'monster', side: 'enemy', statuses: [hold()], ...patch });
}
function snapshot(unit = actor(), merc = source()): CombatSnapshot {
  return { seed: 7, playerTeam: [unit, ...(merc.side === 'player' ? [merc] : [])],
    enemyTeam: [...(merc.side === 'enemy' ? [merc] : []), target()] };
}
function observe(input: CombatSnapshot) {
  const probabilities: number[] = [];
  const spy = vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
    const rng = realCreateRng(seed);
    return { ...rng, chance: probability => { probabilities.push(probability); return rng.chance(probability); } };
  });
  try {
    const before = structuredClone(input), out = runBattleRecorded(input);
    expect(input).toEqual(before);
    return { out, probabilities, thresholds: probabilities.filter(value => value > 0 && value < 1) };
  } finally { spy.mockRestore(); }
}
function native(id: string) {
  const skill = getSkill(id);
  if (!skill) throw new Error('Missing native skill: ' + id);
  return skill;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

it.each(['hero', 'merc', 'summon'] as const)('supports a living original allied %s, without a passive action', kind => {
  const result = observe(snapshot(actor({ kind, ...(kind === 'summon' ? { summon: true, ownerId: 'owner' } : {}) })));
  expect(result.thresholds).toEqual([.895]);
  expect(result.out.events.some(event => event.kind === 'action' && event.skillId === MERC_BLESSED_AIM_SKILL.id)).toBe(false);
  expect(result.out.result.playerTeam[1]?.activeBuffIds).toEqual([]);
  expect(result.out.result.playerTeam[1]?.cooldowns).toEqual({});
});

it('supports its own weapon attack and selects ordinary Jab immediately', () => {
  const merc = source(), out = observe({ seed: 7, playerTeam: [{ ...merc,
    statuses: [hold(401)], stats: { ...merc.stats, attackSpeed: 263, critChance: 0 } }], enemyTeam: [target()] });
  expect(out.out.events.find(event => event.kind === 'action')).toMatchObject({ actor: merc.id,
    skillId: 'mskill-jab', simClockMs: 400 });
  expect(out.thresholds).toEqual([.895, .895, .895]);
});

it.each([
  { id: 'merc-mercs/act2-blessed-aim-forged#1' },
  { kind: 'hero' as const }, { kind: 'monster' as const }, { kind: 'summon' as const },
  { summon: true }, { ownerId: 'owner' }, { summonOwnerId: 'owner' }, { summonTemplateId: 'minion' },
  { side: 'enemy' as const, stats: { ...target().stats, physDodge: 0, magicDodge: 0 } }, { life: 0 }, { life: NaN }, { life: Infinity },
  ...[0, NaN, Infinity, 1.5].map(level => ({ level })), { skillOrder: [] },
  ...[0, 21, NaN, Infinity, 1.5].map(rank => ({ skillLevels: { 'aura-blessed-aim': rank } }))
])('refuses an ineligible original source %j', patch => {
  expect(observe(snapshot(actor(), source(patch))).thresholds).toEqual([.85]);
});

it('requires factory qualification and exact native aura identity, regardless of visual markers', () => {
  const { mercBlessedAimAura: _marker, ...bare } = source();
  expect(observe(snapshot(actor(), { ...bare, activeBuffIds: ['blessed_aim', 'aura-blessed-aim'] })).thresholds).toEqual([.85]);
  registerSkill({ ...MERC_BLESSED_AIM_SKILL });
  expect(observe(snapshot()).thresholds).toEqual([.85]);
});

it('counts duplicate original sources once and keeps presence through stun/freeze', () => {
  const input = snapshot(), second = source({ id: source().id + '#second', statuses: [{ ...hold(), id: 'freeze' }] });
  expect(observe({ ...input, playerTeam: [...input.playerTeam, second] }).thresholds).toEqual([.895]);
});

it.each(['melee', 'ranged', 'spell', 'none', undefined] as const)('uses known basic delivery%s rather than basicHit/physical type', delivery => {
  const { basicAttackDelivery: _previous, ...body } = actor();
  expect(observe(snapshot({ ...body, ...(delivery !== undefined ? { basicAttackDelivery: delivery } : {}) })).thresholds)
    .toEqual([delivery === 'melee' || delivery === 'ranged' ? .895 : .85]);
});

it.each(['mskill-jab', 'mskill-basic-arrow', 'barbarian.berserk', 'paladin.vengeance'])('qualifies authenticated native %s', id => {
  expect(getSkillDamageDelivery(native(id))).toBeDefined();
  const out = observe(snapshot(actor({ skillOrder: [id] })));
  expect(out.thresholds[0]).toBe(.895);
  expect(out.out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'aim-actor', skillId: native(id).id }));
});

it('uses magical dodge for an elemental weapon while physical blindness affects physical attempts', () => {
  const a = actor(), enemy = target({ stats: { ...target().stats, physDodge: .2, magicDodge: .4 } });
  const input = { ...snapshot({ ...a, basicAttack: { damageType: 'fire', damage: [10, 10] },
    statuses: [...a.statuses, { ...hold(), id: 'blind' }] }), enemyTeam: [enemy] };
  expect(observe(input).thresholds[0]).toBeCloseTo(.615, 15);
  const physical = { ...input, playerTeam: [{ ...a, statuses: [...a.statuses, { ...hold(), id: 'blind' }] }, source()] };
  expect(observe(physical).thresholds[0]).toBeCloseTo(.615, 15);
});

it('keeps spells, physical custom skills and native same-ID replacements ineligible', () => {
  registerSkill({ id: 'fixture.physical', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
    cooldown: 1, manaCost: 0, effects: [{ kind: 'damage', damageType: 'physical', base: [10, 10] }] });
  for (const id of ['monster.fire_bolt', 'fixture.physical']) {
    const out = observe(snapshot(actor({ skillOrder: [id] })));
    expect(out.out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'aim-actor', skillId: native(id).id }));
    expect(out.thresholds[0]).toBe(.85);
  }
  const jab = native('monster.weak_melee'); registerSkill({ ...jab });
  const replaced = observe(snapshot(actor({ skillOrder: [jab.id] })));
  expect(replaced.out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'aim-actor', skillId: jab.id }));
  expect(replaced.thresholds[0]).toBe(.85);
});

it('gives only the original primary melee recipient accuracy, never its chain recipients', () => {
  const input = snapshot(actor({ skillOrder: ['amazon.lightning_strike'] }));
  const out = observe({ ...input, enemyTeam: [target(), target({ id: 'second' }), target({ id: 'third' })] });
  expect(out.thresholds).toEqual([.895, .85, .85]);
});

it('shares weighted component and Enchant accuracy rolls, while hit sequences draw per attempt', () => {
  const weighted = observe(snapshot(actor({ skillOrder: ['paladin.vengeance'] })));
  expect(weighted.thresholds).toEqual([.895]);
  expect(weighted.out.events.filter(event => event.kind === 'damage' && event.source === 'aim-actor').length).toBeGreaterThan(1);
  const enchanted = actor({ skillOrder: ['sorceress.enchant'],
    sorceressBuffRanks: { teleport: 0, enchant: 1 }, statuses: [hold(801)] });
  const out = observe(snapshot(enchanted));
  expect(out.thresholds).toEqual([.895]);
  expect(out.out.events).toContainEqual(expect.objectContaining({ kind: 'action', skillId: 'sorceress.enchant', simClockMs: 400 }));
  expect(out.out.events.flatMap(event => event.kind === 'damage' && event.source === 'aim-actor' ? [event.damageType] : []))
    .toEqual(['physical', 'fire']);
  expect(observe(snapshot(actor({ skillOrder: ['amazon.jab'] }))).thresholds).toEqual([.895, .895, .895]);
});

it('reduces actual seeded misses with unchanged action timing, damage stats and input', () => {
  let converted = 0;
  for (let seed = 0; seed < 80; seed++) {
    const input = { ...snapshot(), seed }, active = observe(input);
    const control = observe({ ...input, playerTeam: input.playerTeam.slice(0, 1) });
    const hit = (out: typeof active) => out.out.events.find(event => event.kind === 'damage' && event.source === 'aim-actor');
    const ordinary = hit(control), aimed = hit(active);
    if (ordinary?.kind === 'damage' && aimed?.kind === 'damage' && ordinary.dodged && !aimed.dodged) {
      converted++;
      expect(hit(active)).toMatchObject({ amount: 10, simClockMs: 400 });
    }
    const times = (out: typeof active) => out.out.events.flatMap(event => event.kind === 'action'
      ? [[event.actor, event.skillId, event.simClockMs]] : []);
    expect(times(active)).toEqual(times(control));
    expect(active.out.result.playerTeam[0]?.stats).toEqual(input.playerTeam[0]?.stats);
  }
  expect(converted).toBeGreaterThan(0);
});

it('composes the independent selected Paladin Attack bonus without changing accuracy tuning', () => {
  const statAura = composeStatAura({ id: 'aim-actor', class: 'paladin', level: 30,
    selectedAuraId: 'paladin.blessed-aim', skillLevels: { 'paladin.blessed-aim': 20 } });
  if (!statAura) throw new Error('Missing selected player Blessed Aim');
  const out = observe({ ...snapshot(), statAura });
  expect(out.thresholds).toEqual([.895]);
  expect(out.out.events.find(event => event.kind === 'damage' && event.source === 'aim-actor')).toMatchObject({ amount: 16 });
});

it('qualifies a newly registered native melee summon without granting authority to its owner spell', () => {
  const hero = actor({ skillOrder: ['necromancer.raise_skeleton'], statuses: [hold(401)] });
  const out = observe(snapshot(hero));
  const spawn = out.out.events.find(event => event.kind === 'summon');
  if (spawn?.kind !== 'summon') throw new Error('Missing actual native summon');
  expect(spawn.unit.basicAttackDelivery).toBe('melee');
  expect(out.thresholds.length).toBeGreaterThan(0);
  const bodies = out.out.result.playerTeam.filter(unit => unit.kind === 'summon');
  const attacks = out.out.events.filter(event => event.kind === 'damage' && bodies.some(body => body.id === event.source));
  expect(attacks.length).toBeGreaterThan(0);
  expect(out.thresholds).not.toContain(.85);
  expect(out.thresholds.every(probability => probability === .895 ||
    bodies.some(body => body.stats.critChance === probability))).toBe(true);
  expect(out.thresholds.filter(probability => probability === .895)).toHaveLength(
    out.out.events.filter(event => event.kind === 'damage').length);
});

it('excludes original enemy bodies even after an actual native Conversion hit', () => {
  const hero = actor({ conversionRank: 1, skillOrder: ['paladin.conversion'], skillLevels: { 'paladin.conversion': 1 }, statuses: [hold(401)] });
  const victim = target({ id: 'convertible', statuses: [], stats: { ...target().stats, attackSpeed: 100 },
    basicAttackDelivery: 'melee' });
  const out = observe({ ...snapshot(hero), enemyTeam: [victim, target({ id: 'reserve' })] });
  expect(out.out.events).toContainEqual(expect.objectContaining({ kind: 'status', target: victim.id, statusId: 'converted' }));
  expect(out.out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: victim.id }));
  expect(out.thresholds).toContain(.85);
  expect(out.thresholds.filter(p => p === .895)).toHaveLength(1);
});

it('keeps a native spell summon outside weapon accuracy', () => {
  const owner = actor(), mage = buildSummon(owner, 'skeletal_mage');
  if (!mage) throw new Error('Missing native mage');
  const out = observe(snapshot({ ...mage, statuses: [hold(401)], stats: { ...mage.stats, attackSpeed: 263, critChance: 0 } }));
  expect(mage.basicAttackDelivery).toBe('spell');
  expect(out.thresholds[0]).toBe(.85);
});

it.each([0, 9, 10])('checks actual living aura presence at projectile impact (source life%s)', life => {
  const merc = source({ life, statuses: [hold(), poison] });
  const input = snapshot(actor({ skillOrder: ['monster.weak_ranged'], statuses: [hold(401)] }), merc);
  const out = observe(input);
  expect(out.out.events.find(event => event.kind === 'damage' && event.source === 'aim-actor')).toMatchObject({ simClockMs: 900 });
  expect(out.thresholds[0]).toBe(life === 10 ? .895 : .85);
  if (life === 9) expect(out.out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: merc.id, simClockMs: 900 }));
});

it('keeps a dead shooter flight but withdraws its living-recipient accuracy', () => {
  const out = observe(snapshot(actor({ kind: 'merc', life: 9, skillOrder: ['monster.weak_ranged'], statuses: [hold(401), poison] })));
  expect(out.out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'aim-actor', simClockMs: 900 }));
  expect(out.out.events).toContainEqual(expect.objectContaining({ kind: 'damage', source: 'aim-actor', simClockMs: 900 }));
  expect(out.thresholds[0]).toBe(.85);
});

it.each(['replace-native', 'mutate-native', 'restore-after-custom'] as const)(
  'revalidates private original flight authority: %s', mode => {
    const skill = native('monster.weak_ranged'), cost = skill.manaCost;
    expect(getSkillDamageDelivery(skill)).toBe('ranged');
    if (mode === 'restore-after-custom') registerSkill({ ...skill });
    // eslint-disable-next-line @typescript-eslint/unbound-method -- The spy calls this saved method with its actual flight owner below.
    const original = ProjectileFlights.prototype.launch;
    vi.spyOn(ProjectileFlights.prototype, 'launch').mockImplementation(function (this: ProjectileFlights<unknown>, ...args) {
      original.call(this, ...args);
      if (mode === 'replace-native') registerSkill({ ...skill });
      else if (mode === 'mutate-native') Object.assign(skill, { manaCost: cost + 1 });
      else loadDefaultSkills();
    });
    try {
      const out = observe(snapshot(actor({ skillOrder: [skill.id] })));
      expect(out.out.events).toContainEqual(expect.objectContaining({ kind: 'damage', source: 'aim-actor', simClockMs: 900 }));
      expect(out.thresholds[0]).toBe(.85);
    } finally { Object.assign(skill, { manaCost: cost }); }
  });
