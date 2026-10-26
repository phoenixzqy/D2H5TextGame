import { afterEach, expect, it } from 'vitest';
import rows from '../../data/skills/necromancer.json';
import { createRng } from '../rng';
import { createSkillValidator } from '../skills/skill-validator';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from '../skills/dataCatalog';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { composeBoneArmor } from '../skills/bone-armor';
import { activeDamageCurse, damageCurseId, DAMAGE_CURSE_DEFINITIONS, paidDamageCurse,
  resolveDamageCurseDefinitions, type DamageCurseId } from './damage-curse-definition';
import { applyStatus, rebaseStatusClock, shortenCleansingStatuses, statusActiveAt } from './status';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from '../../stores/combatPlayback';

const ids = ['iron-maiden', 'life-tap', 'lower-resist'] as const;
const fields = { 'iron-maiden': 'reflectedPhysicalDamagePct', 'life-tap': 'lifeTapHealingPct',
  'lower-resist': 'allResistReductionPct' } as const;
const validate = createSkillValidator();
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 1000, mana: 0, skillOrder: [], activeBuffIds: [], cooldowns: {}, statuses: [], enraged: false,
    stats: { life: 1000, lifeMax: 1000, mana: 0, manaMax: 0, attack: 100, attackSpeed: 250,
      defense: 0, magicResist: 0, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
const hold = (start?: number): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1,
  ...(start === undefined ? {} : { appliedAtMs: start }) });
function curse(id: DamageCurseId, start = 0, end = start + 3000): ActiveStatus {
  return { id, sourceId: 'absent-paid-caster', stacks: 1, remaining: 3,
    appliedAtMs: start, expiresAtMs: end, damageCurse: paidDamageCurse(id) };
}
function fixture(id: DamageCurseId): CombatSnapshot {
  return { seed: 1,
    playerTeam: [{ ...unit('attacker', 'player'), life: 900, statuses: [hold(501), ...(id === 'iron-maiden' ? [curse(id)] : [])] }],
    enemyTeam: [{ ...unit('target', 'enemy'), statuses: [hold(), ...(id !== 'iron-maiden' ? [curse(id)] : [])] }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattle(input)).toEqual(out.result); expect(runBattleRecorded(input)).toEqual(out);
  const staged = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(staged ? { statusPlayback: staged } : {}) };
  for (const event of out.events) teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event, teams.statusPlayback);
  const clock = out.events.at(-1)?.simClockMs ?? 0;
  const view = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana,
    statuses: u.life > 0 ? u.statuses.filter(s => statusActiveAt(s, clock)) : [] }));
  expect(view(teams.playerTeam)).toEqual(view(out.result.playerTeam));
  expect(view(teams.enemyTeam)).toEqual(view(out.result.enemyTeam));
  return out;
}
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
it.each(ids)('strictly validates and copies the complete %s authored contract', id => {
  const row = rows.find(r => r.id === 'skills-necromancer-' + id);
  const typed = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(r => r.id === 'skills-necromancer-' + id);
  if (!row || !typed) throw new Error('Missing authored curse');
  expect(validate(row)).toBe(true);
  expect(registeredSkillFromJson(typed).effects).toEqual([{ kind: 'debuff', statusId: id, durationMs: 3000, damageCurse: id }]);
  for (const patch of [{ statusEffect: undefined }, { statusEffect: {} }, { statusEffect: { durationMs: 3000 } },
    { statusEffect: { ...row.statusEffect, durationMs: 0 } }, { statusEffect: { ...row.statusEffect, durationMs: Infinity } },
    ...[0, -1, NaN, Infinity, 1001].map(percent => ({ statusEffect: { ...row.statusEffect, [fields[id]]: percent } })),
    { statusEffect: { ...row.statusEffect, damageReductionPct: 33 } }, { trigger: 'passive' }, { target: 'self' },
    { cooldown: 0 }, { cost: { mana: 0 } }, { prerequisites: [] }, { appliesStatus: [id, 'weaken'] }]) {
    const invalid = { ...row, ...patch };
    expect(validate(invalid)).toBe(false); expect(damageCurseId(invalid)).toBeUndefined();
    expect(() => resolveDamageCurseDefinitions(rows.map(r => r.id === row.id ? invalid : r))).toThrow();
  }
  for (const statusEffect of [{}, { durationMs: 3000 }, { ...row.statusEffect, durationMs: Infinity }])
    expect(registeredSkillFromJson({ ...typed, statusEffect }).effects).toEqual([{ kind: 'debuff', statusId: id }]);
  const cloned = structuredClone(rows), definition = resolveDamageCurseDefinitions(cloned);
  const copied = cloned.find(r => r.id === row.id);
  if (!copied?.statusEffect) throw new Error('Missing copied metadata');
  copied.statusEffect.durationMs = 2000;
  expect(definition[id]).toEqual(DAMAGE_CURSE_DEFINITIONS[id]);
  expect(Object.isFrozen(definition[id])).toBe(true); expect(Object.isFrozen(copied.statusEffect)).toBe(false);
  expect(resolveDamageCurseDefinitions(cloned)[id].durationMs).toBe(2000);
  expect(() => resolveDamageCurseDefinitions([...rows, row])).toThrow();
  expect(() => resolveDamageCurseDefinitions(rows.filter(r => r.id !== row.id))).toThrow();
});
it.each(ids)('%s rejects unrelated healing, summon, buff and area authoring', id => {
  const row = rows.find(r => r.id === 'skills-necromancer-' + id);
  if (!row) throw new Error('Missing authored curse');
  for (const patch of [{ heal: { min: 10, max: 10, target: 'self' } }, { summon: true }, { summonId: 'skeleton-warrior' },
    { timedBuff: { durationMs: 3000 } }, { aoeShape: 'cone-2' }, { maxTargets: 1 }, { appliesTags: ['fire'] }]) {
    const invalid = { ...row, ...patch };
    expect(validate(invalid)).toBe(false);
    expect(damageCurseId(invalid)).toBeUndefined();
  }
});
it.each(ids)('%s copies paid potency, refreshes without stacking, and supports Cleansing/rebasing', id => {
  const input = { ...unit('target', 'enemy'), statuses: [hold()] };
  const payload = { ...paidDamageCurse(id) };
  const first = applyStatus(input, { id, sourceId: 'first', simClockMs: 400.1, durationMs: 3000, damageCurse: payload }, createRng(1));
  payload.percent = 999;
  expect(activeDamageCurse(first, 400.099, id)).toBe(0);
  expect(activeDamageCurse(first, 400.1, id)).toBe(DAMAGE_CURSE_DEFINITIONS[id].percent);
  expect(activeDamageCurse(first, 3400.1, id)).toBe(0);
  const rebased = rebaseStatusClock(first, 1000.2);
  expect(activeDamageCurse(rebased, 0, id)).toBe(DAMAGE_CURSE_DEFINITIONS[id].percent);
  const before = structuredClone(first), second = applyStatus(first, { id, sourceId: 'second', simClockMs: 1000,
    durationMs: 3000, damageCurse: paidDamageCurse(id) }, createRng(1));
  expect(first).toEqual(before);
  expect(second.statuses.filter(s => s.id === id)).toEqual([expect.objectContaining({ sourceId: 'second',
    stacks: 1, appliedAtMs: 1000, expiresAtMs: 4000, damageCurse: paidDamageCurse(id) })]);
  expect(Object.isFrozen(second.statuses.find(s => s.id === id)?.damageCurse)).toBe(true);
  const shortened = shortenCleansingStatuses(second, 1000, .5);
  expect(shortened.statuses.find(s => s.id === id)).toMatchObject({ expiresAtMs: 2500, cleansingShortened: true });
  expect(activeDamageCurse(shortened, 2499.9, id)).toBe(DAMAGE_CURSE_DEFINITIONS[id].percent);
  expect(activeDamageCurse(shortened, 2500, id)).toBe(0);
  expect(shortenCleansingStatuses(shortened, 1500, .5)).toBe(shortened);
  const fresh = applyStatus(shortened, { id, sourceId: 'third', simClockMs: 2000, durationMs: 3000,
    damageCurse: paidDamageCurse(id), cleansingDurationMultiplier: .5 }, createRng(1));
  expect(fresh.statuses.find(s => s.id === id)).toMatchObject({ sourceId: 'third', appliedAtMs: 2000, expiresAtMs: 3500 });
});
it.each(ids)('%s rejects bare, malformed, mismatched and nonfinite packets', id => {
  const missing = (['damageCurse', 'appliedAtMs', 'expiresAtMs'] as const).map(field => {
    const status = { ...curse(id) };
    Reflect.deleteProperty(status, field);
    return status;
  });
  const malformed = [{ appliedAtMs: NaN }, { expiresAtMs: Infinity }, { expiresAtMs: 3000.01 }, { expiresAtMs: 0 }, { stacks: 2 },
    { damageCurse: { ...paidDamageCurse(id), percent: 999 } },
    { damageCurse: paidDamageCurse(id === 'iron-maiden' ? 'life-tap' : 'iron-maiden') }].map(patch => ({ ...curse(id), ...patch }));
  for (const status of [...missing, ...malformed]) {
    expect(activeDamageCurse({ ...unit('target', 'enemy'), statuses: [status] }, 1000, id)).toBe(0);
  }
  for (const clock of [NaN, Infinity, -Infinity])
    expect(activeDamageCurse({ ...unit('target', 'enemy'), statuses: [curse(id)] }, clock, id)).toBe(0);
});
it.each(ids)('%s changes real settlement only on its exact active interval', id => {
  for (const [start, end, active] of [[500, 3500, true], [500.25, 3500.25, false], [-2500, 500, false], [-2499.75, 500.25, true]] as const) {
    const input = fixture(id), patch = (u: CombatUnit) => ({ ...u,
      statuses: u.statuses.map(s => s.id === id ? curse(id, start, end) : s) });
    const out = record({ ...input, playerTeam: input.playerTeam.map(patch), enemyTeam: input.enemyTeam.map(patch) });
    if (id === 'iron-maiden') expect(out.events.filter(e => e.kind === 'damage' && e.damageType === 'thorns')).toHaveLength(active ? 1 : 0);
    if (id === 'life-tap') expect(out.events.filter(e => e.kind === 'heal')).toEqual(active ? [expect.objectContaining({ target: 'attacker', amount: 25 })] : []);
    if (id === 'lower-resist') expect(out.events.find(e => e.kind === 'damage')).toMatchObject({ amount: active ? 130 : 100 });
  }
});
it.each(ids)('%s leaves an existing DoT rate untouched and adds no reflection/healing from it', id => {
  const input = fixture(id), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [hold(), ...u.statuses.filter(s => s.id === id)] })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, statuses: [...u.statuses, { id: 'poison', sourceId: 'attacker',
      stacks: 1, remaining: 1, appliedAtMs: 0, expiresAtMs: 1000, dotPerStack: 100, damageType: 'poison' }] })) });
  expect(out.events.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(100);
  expect(out.events.filter(e => e.kind === 'heal' || e.kind === 'damage')).toEqual([]);
});
it('Iron Maiden excludes absorbed HP and mitigates reflection once without a new roll', () => {
  const input = fixture('iron-maiden'), target = input.enemyTeam[0];
  if (!target) throw new Error('Missing target');
  const armor = composeBoneArmor({ id: target.id, class: 'necromancer', level: 30,
    skillLevels: { 'skills-necromancer-bone-armor': 2 } });
  const attacker = input.playerTeam[0];
  if (!attacker) throw new Error('Missing attacker');
  // Bone Armor belongs only to a player hero; the cursed hostile attacks that real eligible pool.
  const out = record({ seed: 1,
    playerTeam: [{ ...target, side: 'player', kind: 'hero', statuses: [...target.statuses, ...armor] }],
    enemyTeam: [{ ...attacker, side: 'enemy', kind: 'monster',
      stats: { ...attacker.stats, defense: 10, resistances: { ...attacker.stats.resistances, physical: 50 } } }] });
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'attacker')).toMatchObject({ amount: 76, absorbed: 24 });
  expect(out.events.find(e => e.kind === 'damage' && e.damageType === 'thorns')).toMatchObject({ amount: 28, crit: false, dodged: false });
});
it('Iron Maiden reflects actual overkill-limited HP loss from a lethal victim without duplicating death', () => {
  const input = fixture('iron-maiden'), out = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 3 })) });
  expect(out.events.filter(e => e.kind === 'damage' && e.damageType === 'thorns')).toEqual([expect.objectContaining({ amount: 3 })]);
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'target')).toHaveLength(1);
});
it('Life Tap floors small/lethal HP loss, caps recovery and never counts overkill', () => {
  for (const [life, expected] of [[3, 0], [8, 2]] as const) {
    const input = fixture('life-tap'), out = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, life })) });
    expect(out.events.filter(e => e.kind === 'heal')).toEqual(expected ? [expect.objectContaining({ amount: expected, target: 'attacker' })] : []);
    expect(out.events.filter(e => e.kind === 'death' && e.target === 'target')).toHaveLength(1);
  }
  const input = fixture('life-tap'), capped = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, life: 999 })) });
  expect(capped.events.filter(e => e.kind === 'heal')).toEqual([expect.objectContaining({ amount: 1 })]);
  expect(capped.result.playerTeam[0]?.life).toBe(1000);
});
it('Life Tap does not resurrect an attacker killed by Iron Maiden reflection', () => {
  const input = fixture('life-tap'), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, life: 50, statuses: [...u.statuses, curse('iron-maiden')] })) });
  expect(out.events.find(e => e.kind === 'damage' && e.damageType === 'thorns')).toMatchObject({ amount: 100 });
  expect(out.result.playerTeam[0]?.life).toBe(0); expect(out.events.filter(e => e.kind === 'heal')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'attacker')).toHaveLength(1);
});
it('settles one Physical reflection and one total-HP Life Tap recovery for a composite strike', () => {
  registerSkill({ id: 'fixture.composite-curse', archetype: 'fixture', minLevel: 1, target: 'single-enemy', cooldown: 100,
    manaCost: 0, effects: [{ kind: 'damage', damageType: 'physical', base: [100, 100],
      components: [{ damageType: 'physical', weight: 1 }, { damageType: 'fire', weight: 1 }] }] });
  const input = fixture('life-tap'), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, skillOrder: ['fixture.composite-curse'], statuses: [...u.statuses, curse('iron-maiden')] })) });
  expect(out.events.flatMap(e => e.kind === 'damage' ? [[e.damageType, e.amount]] : []))
    .toEqual([['physical', 50], ['fire', 50], ['thorns', 50]]);
  expect(out.events.filter(e => e.kind === 'heal')).toEqual([expect.objectContaining({ amount: 25 })]);
  expect(out.result.playerTeam[0]?.life).toBe(875);
});
it('Lower Resist adds with Amplify and Cold Mastery before act clamps, preserving base resistances', () => {
  for (const type of ['physical', 'cold'] as const) {
    registerSkill({ id: 'fixture.lower-compose', archetype: 'fixture', minLevel: 1, target: 'single-enemy', cooldown: 100,
      manaCost: 0, effects: [{ kind: 'damage', damageType: type, base: [100, 100] }] });
    const input = fixture('lower-resist'), out = record({ ...input,
      playerTeam: input.playerTeam.map(u => ({ ...u, skillOrder: ['fixture.lower-compose'], coldResistanceReductionPct: 15 })),
      enemyTeam: input.enemyTeam.map(u => ({ ...u, resistPenalty: 20,
        stats: { ...u.stats, resistances: { ...u.stats.resistances, physical: 50, cold: 50 } },
        statuses: [...u.statuses, { id: 'amplify-damage', sourceId: 'absent', stacks: 1, remaining: 3,
          appliedAtMs: 0, expiresAtMs: 3000, physicalResistReductionPct: 50 }] })) });
    // Preserve the existing integer floor:100*(1-(-15/100)) is114.99999999999999 in JS.
    expect(out.events.find(e => e.kind === 'damage')).toMatchObject({ amount: type === 'physical' ? 150 : 114 });
    expect(out.result.enemyTeam[0]?.stats.resistances).toEqual({ physical: 50, cold: 50, fire: 0, lightning: 0, arcane: 0, poison: 0 });
  }
});
it('Lower Resist snapshots a new hit-derived Poison rate once from actual landed damage', () => {
  registerSkill({ id: 'fixture.lower-poison', archetype: 'fixture', minLevel: 1, target: 'single-enemy', cooldown: 100,
    manaCost: 0, effects: [{ kind: 'damage', damageType: 'poison', base: [100, 100],
      applyStatus: { id: 'poison', chance: 1, dotPctOfDamage: .1 } }] });
  const input = fixture('lower-resist'), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, skillOrder: ['fixture.lower-poison'] })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats, defense: 10,
      resistances: { ...u.stats.resistances, poison: 50 } } })) });
  expect(out.events.find(e => e.kind === 'damage')).toMatchObject({ amount: 70 });
  const applied = out.events.find(e => e.kind === 'status-state' && e.target === 'target' && e.statuses.some(s => s.id === 'poison'));
  expect(applied?.kind === 'status-state' ? applied.statuses.find(s => s.id === 'poison') : undefined).toMatchObject({ dotPerStack: 7 });
});
it.each(['fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns'] as const)(
  'Iron Maiden excludes a direct %s hit from its Physical HP basis', type => {
    registerSkill({ id: 'fixture.elemental-curse', archetype: 'fixture', minLevel: 1, target: 'single-enemy',
      cooldown: 100, manaCost: 0, effects: [{ kind: 'damage', damageType: type, base: [100, 100] }] });
    const input = fixture('iron-maiden'), out = record({ ...input,
      playerTeam: input.playerTeam.map(u => ({ ...u, skillOrder: ['fixture.elemental-curse'] })) });
    expect(out.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'attacker', target: 'target', damageType: type, amount: 100 })]);
    expect(out.result.playerTeam[0]?.life).toBe(900);
  });
it.each(['fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns'] as const)(
  'Life Tap heals actual direct %s HP loss without relying on Physical damage', type => {
    registerSkill({ id: 'fixture.elemental-tap', archetype: 'fixture', minLevel: 1, target: 'single-enemy',
      cooldown: 100, manaCost: 0, effects: [{ kind: 'damage', damageType: type, base: [100, 100] }] });
    const input = fixture('life-tap'), out = record({ ...input,
      playerTeam: input.playerTeam.map(u => ({ ...u, skillOrder: ['fixture.elemental-tap'] })) });
    expect(out.events.filter(e => e.kind === 'heal')).toEqual([expect.objectContaining({ target: 'attacker', amount: 25 })]);
    expect(out.result.playerTeam[0]?.life).toBe(925);
  });
it.each(['iron-maiden', 'life-tap'] as const)('%s gains nothing from completely absorbed Physical damage', id => {
  const victim = { ...unit('victim', 'player'), statuses: [hold(), ...(id === 'life-tap' ? [curse(id)] : [])] };
  const armor = composeBoneArmor({ id: victim.id, class: 'necromancer', level: 30,
    skillLevels: { 'skills-necromancer-bone-armor': 20 } });
  const striker = { ...unit('striker', 'enemy'), life: 900,
    statuses: [hold(501), ...(id === 'iron-maiden' ? [curse(id)] : [])] };
  const out = record({ seed: 1, playerTeam: [{ ...victim, statuses: [...victim.statuses, ...armor] }], enemyTeam: [striker] });
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: 0, absorbed: 100 })]);
  expect(out.events.filter(e => e.kind === 'heal')).toEqual([]);
  expect(out.result.playerTeam[0]?.life).toBe(1000);
  expect(out.result.enemyTeam[0]?.life).toBe(900);
});
it.each(['iron-maiden', 'life-tap'] as const)('%s gains nothing from a missed strike', id => {
  const input = fixture(id), out = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u,
    stats: { ...u.stats, physDodge: 1 } })) });
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: 0, dodged: true })]);
  expect(out.events.filter(e => e.kind === 'heal')).toEqual([]);
  expect(out.result.playerTeam[0]?.life).toBe(900);
  expect(out.result.enemyTeam[0]?.life).toBe(1000);
});
it('a Sacrifice-style self debit supplies no extra Life Tap healing or Iron Maiden reflection', () => {
  registerSkill({ id: 'fixture.self-curse', archetype: 'fixture', minLevel: 1, target: 'single-enemy', cooldown: 100,
    manaCost: 0, effects: [{ kind: 'damage', damageType: 'physical', base: [100, 100],
      onHitSelfDamage: { lifeFraction: .08, minimumLifeLoss: 1 } }] });
  const input = fixture('life-tap'), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, skillOrder: ['fixture.self-curse'],
      statuses: [...u.statuses, curse('iron-maiden'), curse('life-tap')] })) });
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ source: 'attacker', target: 'target', amount: 100 }),
    expect.objectContaining({ source: 'target', target: 'attacker', amount: 100, damageType: 'thorns' }),
    expect.objectContaining({ source: 'attacker', target: 'attacker', amount: 8 })]);
  expect(out.events.filter(e => e.kind === 'heal')).toEqual([expect.objectContaining({ target: 'attacker', amount: 25 })]);
  expect(out.result.playerTeam[0]?.life).toBe(817);
});
it('Lower Resist preserves the existing upper and lower resistance clamps', () => {
  for (const [resistance, expected] of [[200, 25], [-90, 200]] as const) {
    const input = fixture('lower-resist'), out = record({ ...input,
      enemyTeam: input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats,
        resistances: { ...u.stats.resistances, physical: resistance } } })) });
    expect(out.events.find(e => e.kind === 'damage')).toMatchObject({ amount: expected });
    expect(out.result.enemyTeam[0]?.stats.resistances.physical).toBe(resistance);
  }
});
it.each([0, .1])('Iron Maiden floors sub-1 HP loss while preserving ordinary Thorns minimum (%s)', ordinaryReflection => {
  const victim = unit('victim', 'player');
  const armor = composeBoneArmor({ id: victim.id, class: 'necromancer', level: 30,
    skillLevels: { 'skills-necromancer-bone-armor': 20 } }).map(status => ({ ...status,
      boneArmor: { rank: 20, remaining: 99.5 } }));
  const out = record({ seed: 1,
    playerTeam: [{ ...victim, physicalReflectionPct: ordinaryReflection, statuses: [hold(), ...armor] }],
    enemyTeam: [{ ...unit('striker', 'enemy'), life: 900, statuses: [hold(501), curse('iron-maiden')] }] });
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'striker'))
    .toMatchObject({ amount: .5, absorbed: 99.5 });
  expect(out.events.filter(e => e.kind === 'damage' && e.damageType === 'thorns'))
    .toEqual(ordinaryReflection > 0 ? [expect.objectContaining({ amount: 1 })] : []);
  expect(out.result.enemyTeam[0]?.life).toBe(ordinaryReflection > 0 ? 899 : 900);
  expect(out.result.playerTeam[0]?.life).toBe(999.5);
});
