import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { getSummon, registerSummon, type SummonFactory } from '../skills/summons';
import { composeBoneArmor } from '../skills/bone-armor';
import { qualifyBloodGolem } from '../skills/blood-golem';
import { payColdArmor } from '../skills/cold-armors';

const hold = (start = 0): ActiveStatus => ({ id: 'stun', sourceId: 'isolation', stacks: 1,
  remaining: -1, appliedAtMs: start });
function unit(id: string, side: 'player' | 'enemy', kind: CombatUnit['kind'] = 'merc'): CombatUnit {
  return { id, name: id, side, kind, level: 30, tier: 'trash', life: 500, mana: 100,
    stats: { life: 500, lifeMax: 1000, mana: 100, manaMax: 100, attack: 100,
      defense: 0, magicResist: 0, attackSpeed: 0, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [hold()], cooldowns: {}, activeBuffIds: [], enraged: false, skillOrder: [] };
}
function fixture(): CombatSnapshot {
  const owner = { ...unit('hero', 'player', 'hero'), ...{ bloodGolemRank: 1 },
    skillOrder: ['necromancer.blood_golem'], skillLevels: { 'necromancer.blood_golem': 1 } };
  const striker = { ...unit('striker', 'player'), stats: { ...unit('striker', 'player').stats, attackSpeed: 300 },
    statuses: [hold(501)] };
  return { seed: 7, playerTeam: [owner, striker], enemyTeam: [unit('target', 'enemy', 'monster')] };
}
function patch(input: CombatSnapshot, id: string, change: Partial<CombatUnit>): CombatSnapshot {
  const update = (u: CombatUnit) => u.id === id ? { ...u, ...change } : u;
  return { ...input, playerTeam: input.playerTeam.map(update), enemyTeam: input.enemyTeam.map(update) };
}
function member(input: CombatSnapshot, id: string): CombatUnit {
  const found = [...input.playerTeam, ...input.enemyTeam].find(u => u.id === id);
  if (!found) throw new Error('Missing numeric fixture member');
  return found;
}
function heals(out: ReturnType<typeof runBattleRecorded>) {
  return out.events.flatMap(e => e.kind === 'heal' ? [[e.target, e.amount]] : []);
}
let factory: SummonFactory;
beforeEach(() => {
  resetRegistry(); loadDefaultSkills();
  const original = getSummon('blood_golem');
  if (!original) throw new Error('Missing unchanged Blood Golem template');
  factory = original;
  // Hold only the body in numeric party fixtures; native causal tests use its actual actions/stats.
  registerSummon('blood_golem', owner => ({ ...factory(owner), statuses: [hold()] }));
});
afterEach(() => { registerSummon('blood_golem', factory); resetRegistry(); loadDefaultSkills(); });

describe('paid Blood Golem actual-HP recovery aura', () => {
  it.each(['physical', 'fire', 'cold', 'lightning', 'poison', 'arcane', 'thorns'] as const)(
    'one ordinary 100 %s HP loss heals the actual injured merc source by 10', damageType => {
      const input = patch(fixture(), 'striker', { basicAttack: { damageType, damage: [100, 100] } });
      const before = structuredClone(input), out = runBattleRecorded(input);
      expect(out.events.filter(e => e.kind === 'damage')).toEqual([
        expect.objectContaining({ source: 'striker', target: 'target', amount: 100, damageType, simClockMs: 400 })]);
      expect(heals(out)).toEqual([['striker', 10]]);
      expect(out.result.playerTeam.find(u => u.id === 'striker')?.life).toBe(510);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
        expect.objectContaining({ target: 'hero', mana: 75, simClockMs: 0 })]);
      expect(input).toEqual(before);
    });
  it('heals the owner from its own hit, without sending that recovery to its body', () => {
    const input = fixture(), owner = member(input, 'hero');
    const out = runBattleRecorded(patch(patch(input, 'striker', { statuses: [hold()] }), 'hero', {
      stats: { ...owner.stats, attackSpeed: 300 }, statuses: [hold(501)] }));
    expect(out.events.filter(e => e.kind === 'damage')).toHaveLength(1);
    expect(heals(out)).toEqual([['hero', 10]]);
  });
  it('heals another original friendly summon from its own hit', () => {
    const out = runBattleRecorded(patch(fixture(), 'striker', { kind: 'summon', summon: true,
      summonOwnerId: 'hero', summonTemplateId: 'skeleton' }));
    expect(heals(out)).toEqual([['striker', 10]]);
  });
  it('heals the injured paid body from its own ordinary hit', () => {
    registerSummon('blood_golem', owner => {
      const body = factory(owner);
      return { ...body, stats: { ...body.stats, attack: 100, attackSpeed: 300,
        critChance: 0 }, statuses: [hold(501), { id: 'poison', sourceId: 'target',
          stacks: 1, remaining: .5, appliedAtMs: 0, expiresAtMs: 500, dotPerStack: 200, damageType: 'poison' }] };
    });
    const out = runBattleRecorded(patch(fixture(), 'striker', { statuses: [hold()] }));
    const summoned = out.events.find(e => e.kind === 'summon');
    if (summoned?.kind !== 'summon') throw new Error('Missing real paid registration');
    expect(out.events.filter(e => e.kind === 'damage' && e.source === summoned.unit.id)).toHaveLength(1);
    expect(out.events.reduce((sum, e) => sum + (e.kind === 'dot' && e.target === summoned.unit.id ? e.amount : 0), 0)).toBe(100);
    expect(heals(out)).toEqual([[summoned.unit.id, 10]]);
    expect(out.result.playerTeam.find(u => u.id === summoned.unit.id)?.life).toBe(summoned.unit.life - 90);
  });
  it.each([[9, 0], [19, 1], [100, 10]] as const)('floors %i actual HP loss to %i recovery', (amount, expected) => {
    const out = runBattleRecorded(patch(fixture(), 'striker', { basicAttack: { damageType: 'physical', damage: [amount, amount] } }));
    expect(heals(out)).toEqual(expected ? [['striker', expected]] : []);
  });
  it.each([[998, 2], [1000, 0]] as const)('caps actual source life %i at missing HP (%i)', (life, expected) => {
    const out = runBattleRecorded(patch(fixture(), 'striker', { life }));
    expect(heals(out)).toEqual(expected ? [['striker', expected]] : []);
    expect(out.result.playerTeam.find(u => u.id === 'striker')?.life).toBe(1000);
  });
  it('counts actual overkill-limited HP loss after ordinary death/orb settlement', () => {
    const input = patch(fixture(), 'target', { life: 19 }), out = runBattleRecorded(input);
    expect(out.events.find(e => e.kind === 'damage')).toMatchObject({ amount: 100 });
    expect(out.events.filter(e => e.kind === 'death' && e.target === 'target')).toHaveLength(1);
    expect(heals(out)).toEqual([['striker', 1]]);
  });
  it('does not heal a dodged strike', () => {
    const input = fixture(), target = member(input, 'target');
    const out = runBattleRecorded({ ...patch(input, 'target', { stats: { ...target.stats, physDodge: 1 } }), seed: 123456789 });
    expect(out.events.find(e => e.kind === 'damage')).toMatchObject({ amount: 0, dodged: true });
    expect(heals(out)).toEqual([]);
  });
  it('recovers once for total actual HP loss across typed components', () => {
    registerSkill({ id: 'fixture.blood-composite', archetype: 'fixture', minLevel: 1, target: 'single-enemy',
      cooldown: 100, manaCost: 0, effects: [{ kind: 'damage', damageType: 'physical', base: [100, 100],
        components: [{ damageType: 'physical', weight: 1 }, { damageType: 'fire', weight: 1 }] }] });
    const out = runBattleRecorded(patch(fixture(), 'striker', { skillOrder: ['fixture.blood-composite'] }));
    expect(out.events.filter(e => e.kind === 'damage')).toHaveLength(2);
    expect(heals(out)).toEqual([['striker', 10]]);
  });
  it('does not leech self-debits or overwrite self-debit settlement', () => {
    registerSkill({ id: 'fixture.blood-trade', archetype: 'fixture', minLevel: 1, target: 'single-enemy',
      cooldown: 100, manaCost: 0, effects: [{ kind: 'damage', damageType: 'physical', base: [100, 100],
        onHitSelfDamage: { lifeFraction: .08, minimumLifeLoss: 1 } }] });
    const out = runBattleRecorded(patch(fixture(), 'striker', { skillOrder: ['fixture.blood-trade'] }));
    expect(out.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'striker', target: 'target', amount: 100 }),
      expect.objectContaining({ source: 'striker', target: 'striker', amount: 8 })]);
    expect(heals(out)).toEqual([['striker', 10]]);
    expect(out.result.playerTeam.find(u => u.id === 'striker')?.life).toBe(502);
  });
  it('never resurrects a damage source killed by ordinary reflection', () => {
    const out = runBattleRecorded(patch(patch(fixture(), 'striker', { life: 50 }), 'target', { physicalReflectionPct: 1 }));
    expect(out.events.find(e => e.kind === 'damage' && e.damageType === 'thorns')).toMatchObject({ amount: 100 });
    expect(out.result.playerTeam.find(u => u.id === 'striker')?.life).toBe(0);
    expect(heals(out)).toEqual([]);
  });
  it('heals the original friendly reflector for actual hostile HP removed', () => {
    const input = fixture(), target = member(input, 'target');
    const out = runBattleRecorded(patch(patch(input, 'striker', { statuses: [hold()], physicalReflectionPct: 1 }),
      'target', { stats: { ...target.stats, attackSpeed: 300 }, statuses: [hold(501),
        { id: 'taunt', sourceId: 'striker', stacks: 1, remaining: 1, appliedAtMs: 0, expiresAtMs: 501 }] }));
    expect(out.events.filter(e => e.kind === 'damage' && e.damageType === 'thorns')).toEqual([
      expect.objectContaining({ source: 'striker', target: 'target', amount: 100 })]);
    expect(heals(out)).toEqual([['striker', 10]]);
    expect(out.result.playerTeam.find(u => u.id === 'striker')?.life).toBe(410);
  });
  it('heals actual periodic sources without changing aggregated damage or creating actions', () => {
    const input = patch(fixture(), 'striker', { stats: unit('striker', 'player').stats, statuses: [hold()] });
    const target = member(input, 'target');
    const out = runBattleRecorded(patch(input, 'target', { statuses: [...target.statuses,
      { id: 'poison', sourceId: 'striker', stacks: 1, remaining: 1, appliedAtMs: 0, expiresAtMs: 1000,
        dotPerStack: 60, damageType: 'poison' },
      { id: 'burn', sourceId: 'hero', stacks: 1, remaining: 1, appliedAtMs: 0, expiresAtMs: 1000,
        dotPerStack: 40, damageType: 'fire' }] }));
    expect(out.events.filter(e => e.kind === 'dot')).toEqual([expect.objectContaining({ target: 'target', amount: 100 })]);
    expect(heals(out)).toEqual([['striker', 6], ['hero', 4]]);
    expect(out.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: 'necromancer.blood_golem', simClockMs: 0 })]);
    expect(out.result.enemyTeam[0]?.life).toBe(400);
  });
  it('does not redirect the unknown periodic source share to the living party source', () => {
    const input = patch(fixture(), 'striker', { stats: unit('striker', 'player').stats, statuses: [hold()] });
    const out = runBattleRecorded(patch(input, 'target', { statuses: [hold(),
      { id: 'poison', sourceId: 'striker', stacks: 1, remaining: 1, appliedAtMs: 0, expiresAtMs: 1000,
        dotPerStack: 50, damageType: 'poison' },
      { id: 'burn', sourceId: 'missing', stacks: 1, remaining: 1, appliedAtMs: 0, expiresAtMs: 1000,
        dotPerStack: 50, damageType: 'fire' }] }));
    expect(heals(out)).toEqual([['striker', 5]]);
  });
  it('no unpaid preloaded body or imported name grants the aura', () => {
    const input = fixture(), body = factory(member(input, 'hero'));
    const out = runBattleRecorded({ ...input, playerTeam: [...input.playerTeam, { ...body, statuses: [hold()] }] });
    expect(out.events.filter(e => e.kind === 'summon')).toEqual([]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    expect(heals(out)).toEqual([]);
  });
  it.each([0, -1, 1.5, 21, NaN, Infinity])('refuses native authority rank %s while retaining generic preparation', rank => {
    const input = fixture(), owner = member(input, 'hero');
    const out = runBattleRecorded(patch(input, 'hero', { ...owner, ...{ bloodGolemRank: rank } }));
    expect(out.events.filter(e => e.kind === 'summon')).toHaveLength(1);
    expect(heals(out)).toEqual([]);
  });
  it('refuses missing native authority while retaining generic preparation', () => {
    const input = fixture(), owner = { ...member(input, 'hero') };
    Reflect.deleteProperty(owner, 'bloodGolemRank');
    const actual = runBattleRecorded({ ...input, playerTeam: [owner, member(input, 'striker')] });
    expect(actual.events.filter(e => e.kind === 'summon')).toHaveLength(1);
    expect(heals(actual)).toEqual([]);
  });
  it('an altered registered source retains generic payment but cannot empower the aura', () => {
    const skill = getSkill('necromancer.blood_golem');
    if (!skill) throw new Error('Missing actual source');
    registerSkill({ ...skill, manaCost: 1 });
    const out = runBattleRecorded(fixture());
    expect(out.events.filter(e => e.kind === 'summon')).toHaveLength(1);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 99 })]);
    expect(heals(out)).toEqual([]);
  });
  it('uses the existing finite defense HP loss for a reflected hit, not its absorbed amount', () => {
    const input = fixture(), owner = member(input, 'hero');
    const armor = composeBoneArmor({ id: 'hero', class: 'necromancer', level: 30,
      skillLevels: { 'skills-necromancer-bone-armor': 20 } });
    registerSkill({ id: 'fixture.enemy-area', archetype: 'fixture', minLevel: 1, target: 'all-enemies',
      cooldown: 100, manaCost: 0, effects: [{ kind: 'damage', damageType: 'physical', base: [100, 100] }] });
    // A real finite pool absorbs the hero hit; neither that HP loss nor reflection supplies healing.
    const target = member(input, 'target');
    const out = runBattleRecorded({ ...patch(patch(patch(input, 'striker', { statuses: [hold()] }), 'hero', {
      statuses: [...owner.statuses, ...armor], physicalReflectionPct: 1 }), 'target', {
      stats: { ...target.stats, attackSpeed: 300 }, statuses: [hold(501)], skillOrder: ['fixture.enemy-area'] }), seed: 123456789 });
    expect(out.events.find(e => e.kind === 'damage' && e.target === 'hero'))
      .toMatchObject({ source: 'target', target: 'hero', amount: 0, absorbed: 100 });
    expect(out.events.filter(e => e.kind === 'damage' && e.damageType === 'thorns')).toEqual([]);
    expect(heals(out)).toEqual([]);
  });
  it('recovers actual Static Field damage through its separate nonlethal settlement path', () => {
    const input = patch(patch(fixture(), 'striker', { kind: 'hero',
      staticFieldRank: 1, skillLevels: { 'sorceress.static_field': 1 }, skillOrder: ['sorceress.static_field'] }),
      'target', { life: 1000 });
    const out = runBattleRecorded(input);
    expect(out.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'striker', target: 'target', damageType: 'lightning', amount: 250 })]);
    expect(heals(out)).toEqual([['striker', 25]]);
  });
  it.each<Partial<CombatUnit>>([{ id: '' }, { side: 'enemy' }, { kind: 'merc' }, { summon: true },
    { ownerId: 'borrowed' }, { summonOwnerId: 'borrowed' }, { level: 17 }, { level: 18.5 },
    { life: 0 }, { life: NaN }, { skillOrder: [] }, { skillLevels: {} },
    { skillLevels: { 'necromancer.blood_golem': 1.5 } }])('rejects contradictory owner authority %#', change => {
    const skill = getSkill('necromancer.blood_golem');
    if (!skill) throw new Error('Missing Blood Golem source');
    expect(qualifyBloodGolem({ ...member(fixture(), 'hero'), ...change }, skill, 1)).toBe(false);
  });
  it('cannot grant aura benefits through a borrowed paid body owner', () => {
    registerSummon('blood_golem', owner => ({ ...factory(owner), ownerId: 'foreign', statuses: [hold()] }));
    const out = runBattleRecorded(fixture());
    expect(out.events.filter(e => e.kind === 'summon')).toHaveLength(1);
    expect(heals(out)).toEqual([]);
  });
  it('stops the aura immediately after the actual body dies without refund or replacement', () => {
    registerSummon('blood_golem', owner => ({ ...factory(owner), statuses: [hold(),
      { id: 'poison', sourceId: 'target', stacks: 1, remaining: 1,
        appliedAtMs: 0, expiresAtMs: 1000, dotPerStack: 1000, damageType: 'poison' }] }));
    const out = runBattleRecorded(fixture()), created = out.events.find(e => e.kind === 'summon');
    if (created?.kind !== 'summon') throw new Error('Missing paid body');
    expect(out.events.find(e => e.kind === 'death' && e.target === created.unit.id)).toMatchObject({ simClockMs: 180 });
    expect(out.events.find(e => e.kind === 'damage' && e.source === 'striker')).toMatchObject({ amount: 100, simClockMs: 400 });
    expect(out.events.filter(e => e.kind === 'summon')).toHaveLength(1);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'summon-refund')).toEqual([]);
    expect(heals(out)).toEqual([]);
  });
  it.each(['hero', 'striker'] as const)('settles simultaneous periodic death of %s before any leech', id => {
    const input = patch(fixture(), 'striker', { stats: unit('striker', 'player').stats, statuses: [hold()] });
    const victim = member(input, id);
    const out = runBattleRecorded(patch(patch(input, id, { statuses: [...victim.statuses,
      { id: 'poison', sourceId: 'target', stacks: 1, remaining: 1, appliedAtMs: 0, expiresAtMs: 1000,
        dotPerStack: 500, damageType: 'poison' }] }), 'target', { statuses: [hold(),
      { id: 'poison', sourceId: 'striker', stacks: 1, remaining: 1, appliedAtMs: 0, expiresAtMs: 1000,
        dotPerStack: 100, damageType: 'poison' }] }));
    expect(out.events.find(e => e.kind === 'dot' && e.target === 'target')).toMatchObject({ amount: 100 });
    expect(out.events.find(e => e.kind === 'death' && e.target === id)).toMatchObject({ simClockMs: 1000 });
    if (id === 'hero') {
      const created = out.events.find(e => e.kind === 'summon');
      if (created?.kind !== 'summon') throw new Error('Missing orphaned body');
      expect(out.events.find(e => e.kind === 'death' && e.target === created.unit.id)).toMatchObject({ simClockMs: 1000 });
    }
    expect(heals(out)).toEqual([]);
  });
  it('does not grant recovery from friendly periodic HP loss', () => {
    const input = patch(fixture(), 'striker', { stats: unit('striker', 'player').stats, statuses: [hold()] });
    const owner = member(input, 'hero');
    const out = runBattleRecorded(patch(input, 'hero', { statuses: [...owner.statuses,
      { id: 'poison', sourceId: 'striker', stacks: 1, remaining: 1, appliedAtMs: 0, expiresAtMs: 1000,
        dotPerStack: 100, damageType: 'poison' }] }));
    expect(out.events.find(e => e.kind === 'dot')).toMatchObject({ target: 'hero', amount: 100 });
    expect(heals(out)).toEqual([]);
  });
  it('does not stack the recovery percentage across two qualified paid bodies', () => {
    const input = fixture(), other = { ...member(input, 'hero'), id: 'other-owner' };
    const out = runBattleRecorded({ ...input, playerTeam: [...input.playerTeam, other] });
    expect(out.events.filter(e => e.kind === 'summon')).toHaveLength(2);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(2);
    expect(heals(out)).toEqual([['striker', 10]]);
  });
  it('attributes periodic overkill once, including stable indivisible-HP rounding', () => {
    const input = patch(fixture(), 'striker', { stats: unit('striker', 'player').stats, statuses: [hold()] });
    const out = runBattleRecorded(patch(input, 'target', { life: 100, statuses: [hold(),
      { id: 'poison', sourceId: 'hero', stacks: 1, remaining: 1, appliedAtMs: 0, expiresAtMs: 1000,
        dotPerStack: 105, damageType: 'poison' },
      { id: 'burn', sourceId: 'striker', stacks: 1, remaining: 1, appliedAtMs: 0, expiresAtMs: 1000,
        dotPerStack: 95, damageType: 'fire' }] }));
    expect(out.events.filter(e => e.kind === 'dot')).toEqual([expect.objectContaining({ amount: 100, simClockMs: 500 })]);
    expect(heals(out)).toEqual([['hero', 5], ['striker', 4]]);
  });
  it('heals the actual ordinary Cold armor reaction source', () => {
    const input = fixture(), striker = payColdArmor({ ...member(input, 'striker'), kind: 'hero',
      coldArmorRanks: { 'shiver-armor': 20, 'chilling-armor': 0 }, statuses: [hold()] }, 'shiver-armor', 20);
    const target = member(input, 'target');
    const out = runBattleRecorded({ ...patch(patch(input, 'striker', striker), 'target', {
      stats: { ...target.stats, attackSpeed: 300 }, statuses: [hold(501),
        { id: 'taunt', sourceId: 'striker', stacks: 1, remaining: 1, appliedAtMs: 0, expiresAtMs: 501 }] }), seed: 1 });
    const hit = out.events.find(e => e.kind === 'damage' && e.source === 'striker');
    if (hit?.kind !== 'damage') throw new Error('Missing actual armor counterattack');
    expect(hit.damageType).toBe('cold'); expect(hit.amount).toBeGreaterThanOrEqual(10);
    expect(heals(out)).toEqual([['striker', Math.floor(hit.amount / 10)]]);
    expect(out.result.playerTeam.find(u => u.id === 'striker')?.life).toBe(400 + Math.floor(hit.amount / 10));
  });
  it('does not grant original-party recovery to an actual converted enemy source', () => {
    const input = fixture(), striker = member(input, 'striker'), target = member(input, 'target');
    const out = runBattleRecorded({ ...patch(input, 'striker', { ...striker, kind: 'hero', conversionRank: 1,
      skillOrder: ['paladin.conversion'], skillLevels: { 'paladin.conversion': 1 } }),
      enemyTeam: [{ ...target, statuses: [hold(2001)] }, { ...target, id: 'former-ally' }] });
    expect(out.events.some(e => e.kind === 'status' && e.statusId === 'converted')).toBe(true);
    expect(out.events.some(e => e.kind === 'damage' && e.source === 'target' && e.target === 'former-ally' && e.amount > 0)).toBe(true);
    expect(heals(out).some(([recipient]) => recipient === 'target')).toBe(false);
  });
  it.each([1, 20])('keeps learned rank%i aura authority under an actual carried paid Battle Command', rank => {
    registerSkill({ id: 'fixture.command-finish', archetype: 'fixture', minLevel: 1, target: 'all-enemies',
      cooldown: 100, manaCost: 0, effects: [{ kind: 'damage', damageType: 'physical', base: [2000, 2000] }] });
    const input = fixture(), owner = { ...member(input, 'hero'), bloodGolemRank: rank,
      skillLevels: { 'necromancer.blood_golem': rank } };
    const commander = { ...unit('commander', 'player', 'hero'), battleCommandRank: 1,
      stats: { ...unit('commander', 'player').stats, attackSpeed: 300 }, statuses: [hold(801)],
      skillOrder: ['barbarian.battle_command', 'fixture.command-finish'],
      skillLevels: { 'barbarian.battle_command': 1, 'fixture.command-finish': 1 } };
    const first = runBattleRecorded({ ...input, playerTeam: [owner, commander,
      { ...member(input, 'striker'), statuses: [hold()] }] });
    expect(first.result.winner).toBe('player');
    expect(first.events.some(e => e.kind === 'action' && e.skillId === 'barbarian.battle_command')).toBe(true);
    if (!first.battleCommandCarry) throw new Error('Missing actual paid Command carry');
    const next = { ...input, playerTeam: [owner, member(input, 'striker')] }, before = structuredClone(next);
    const out = runBattleRecorded(next, first.battleCommandCarry);
    const body = out.events.find(e => e.kind === 'summon');
    if (body?.kind !== 'summon') throw new Error('Missing boosted paid body');
    expect(body.unit.stats.lifeMax).toBe(180 + 14 * rank); // Effective rank2 or21; learned authority stays1 or20.
    expect(heals(out)).toEqual([['striker', 10]]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 75, simClockMs: 0 })]);
    expect(next).toEqual(before);
  });
  it('preserves recorded/unrecorded, A/A, A/B/A and caller input determinism', () => {
    const input = fixture(), before = structuredClone(input), first = runBattleRecorded(input);
    expect(runBattleRecorded(input)).toEqual(first);
    expect(runBattle(input)).toEqual(first.result);
    runBattleRecorded({ ...input, seed: 100 });
    expect(runBattleRecorded(input)).toEqual(first);
    expect(input).toEqual(before);
  });
});
