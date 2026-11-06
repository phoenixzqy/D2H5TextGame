import { afterEach, beforeEach, expect, it } from 'vitest';
import { monsters } from '../../data';
import { createRng } from '../rng';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { buildMonsterUnit } from './monster-factory';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import { applyStatus, applyStatusWithResult, spreadPlague, STATUS_DEFAULTS } from './status';
import type { CombatUnit } from './types';

function native(id = 'monsters/act5.baal'): CombatUnit {
  const def = monsters.find(row => row.id === id);
  if (!def) throw new Error('Missing native monster');
  return buildMonsterUnit({ def, level: 82, tier: id === 'monsters/act5.baal' ? 'chapter-boss' : 'trash', rng: createRng(13) });
}
// Diagnostic pools/cadence isolate status mechanics, without campaign or balance credit.
function subject(id: string, side: CombatUnit['side'], archetype = side === 'player' ? 'monsters/act5.baal-tentacle' : 'monsters/act5.baal'): CombatUnit {
  const base = native(archetype);
  return { ...base, id, name: id, side, kind: side === 'player' ? 'hero' : 'monster',
    life: 100_000, mana: 100, manaRegenPerSecond: 0,
    stats: { ...base.stats, life: 100_000, lifeMax: 100_000, mana: 100, manaMax: 100,
      attack: 100, attackSpeed: 100, defense: 0, magicResist: 0, critChance: 0,
      physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    skillOrder: [], cooldowns: {}, statuses: [], enraged: false };
}
function record(playerTeam: readonly CombatUnit[], enemy = subject('baal', 'enemy')) {
  const input: CombatSnapshot = { seed: 13, maxRounds: 6, playerTeam, enemyTeam: [enemy] };
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  return out;
}
const held = [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }];
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it('rejects every non-Stun status, aliases and future IDs without consuming RNG or mutating native Baal', () => {
  const boss = native(), before = structuredClone(boss), rng = createRng(13), control = createRng(13);
  expect(boss.statusImmunities).toEqual(['all-except-stun']);
  expect(Object.isFrozen(boss.statusImmunities)).toBe(true);
  expect(boss.statusImmunities).not.toBe(monsters.find(row => row.id === boss.monsterArchetypeId)?.statusImmunities);
  for (const id of [...Object.keys(STATUS_DEFAULTS).filter(id => id !== 'stun'),
    'burn', 'amplify', 'slow-missiles', 'battle-cry', 'taunt', 'future-debuff']) {
    const input = { id, sourceId: 'hero', simClockMs: 1700, durationMs: 3000, dotPerStack: 20 };
    const application = applyStatusWithResult(boss, input, rng);
    expect(application.applied, id).toBe(false);
    expect(application.unit, id).toBe(boss);
    expect(applyStatus(boss, input, rng), id).toBe(boss);
  }
  expect(boss).toEqual(before);
  expect(rng.next()).toBe(control.next());
});

it.each([1, 1000, 3000])('allows Stun with half-duration millisecond expiry for %ims', durationMs => {
  const boss = native();
  const result = applyStatusWithResult(boss, { id: 'stun', sourceId: 'hero', simClockMs: 1700, durationMs }, createRng(13));
  expect(result.applied).toBe(true);
  expect(result.unit.statuses).toMatchObject([{ id: 'stun', appliedAtMs: 1700,
    expiresAtMs: 1700 + Math.max(1, Math.floor(durationMs / 2)) }]);
  expect(boss.statuses).toEqual([]);
});

it('keeps ordinary tentacles susceptible to statuses and excludes Baal from death-spread Poison', () => {
  const boss = native(), body = native('monsters/act5.baal-tentacle');
  expect(body.statusImmunities).toBeUndefined();
  const poisoned = { ...body, life: 0, statuses: [{ id: 'poison', sourceId: 'hero', stacks: 4,
    remaining: 5, dotPerStack: 20, damageType: 'poison' as const }] };
  const targets = spreadPlague(poisoned, [boss, body], .5, createRng(13), 1700);
  expect(targets[0]).toBe(boss);
  expect(targets[1]?.statuses).toMatchObject([{ id: 'poison', stacks: 2, dotPerStack: 20 }]);
  expect(applyStatusWithResult(body, { id: 'freeze', sourceId: 'hero' }, createRng(13)).applied).toBe(true);
});

it('does not expose ambient Holy Freeze Chill, slow Baal cadence or grant its physical combo', () => {
  const hero = { ...subject('hero', 'player'), skillOrder: [] };
  const merc = { ...subject('merc', 'player'), kind: 'merc' as const, statuses: held };
  const baseline = record([hero, merc]), aura = record([hero, { ...merc, holyFreezeAura: true }]);
  const actions = (out: typeof aura) => out.events.filter(e => e.kind === 'action' && e.actor === 'baal').map(e => e.simClockMs);
  expect(actions(aura).slice(0, 2)).toEqual([1700, 3400]);
  expect(actions(aura)).toEqual(actions(baseline));
  expect(aura.events.filter(e => e.kind === 'status-state' && e.target === 'baal')
    .every(e => e.kind === 'status-state' && !e.statuses.some(s => s.id === 'chill'))).toBe(true);
  const damage = (out: typeof aura) => out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e.amount] : []);
  expect(damage(aura)).toEqual(damage(baseline));
  expect(damage(aura).some(amount => amount > 0)).toBe(true);
  const body = subject('body', 'enemy', 'monsters/act5.baal-tentacle');
  const control = record([hero, { ...merc, holyFreezeAura: true }], body);
  expect(control.events.some(e => e.kind === 'status-state' && e.target === 'body' && e.statuses.some(s => s.id === 'chill'))).toBe(true);
});

it('rejects Slow Missiles before both its displayed status and private projectile-speed binding', () => {
  registerSkill({ id: 'fixture.projectile', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
    cooldown: 100, manaCost: 0, effects: [{ kind: 'damage', damageType: 'physical',
      base: [100, 100], projectileFlightMs: 500 }] });
  const caster = { ...subject('amazon', 'player'), slowMissilesRank: 1,
    skillLevels: { 'amazon.slow_missiles': 1 }, skillOrder: ['amazon.slow_missiles'],
    stats: { ...subject('amazon', 'player').stats, attackSpeed: 200 } };
  const boss = { ...subject('baal', 'enemy'), skillOrder: ['fixture.projectile'] };
  const out = record([caster], boss);
  expect(out.events.some(e => e.kind === 'action' && e.skillId === 'amazon.slow_missiles')).toBe(true);
  expect(out.events.filter(e => e.kind === 'status' && e.target === 'baal' && e.statusId === 'slow-missiles')).toEqual([]);
  const hit = out.events.find(e => e.kind === 'damage' && e.source === 'baal');
  expect(hit).toMatchObject({ simClockMs: 2200 });
  const body = { ...subject('baal', 'enemy', 'monsters/act5.baal-tentacle'), skillOrder: boss.skillOrder };
  const control = record([caster], body);
  expect(control.events.some(e => e.kind === 'status' && e.statusId === 'slow-missiles')).toBe(true);
  expect(control.events.find(e => e.kind === 'damage' && e.source === 'baal')?.simClockMs).toBeGreaterThan(2200);
});

it('retains landed direct arcane damage but rejects Mana Burn drain and feedback', () => {
  registerSkill({ id: 'fixture.burn', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
    cooldown: 100, manaCost: 0, effects: [{ kind: 'damage', damageType: 'arcane', base: [100, 100],
      applyStatus: { id: 'mana-burn' } }] });
  const hero = { ...subject('hero', 'player'), skillOrder: ['fixture.burn'] };
  const out = record([hero]);
  expect(out.events.some(e => e.kind === 'damage' && e.damageType === 'arcane' && e.target === 'baal' && !e.dodged && e.amount > 0)).toBe(true);
  expect(out.events.filter(e => e.kind === 'mana' && e.target === 'baal' && e.reason === 'mana-burn')).toEqual([]);
  expect(out.events.some(e => e.kind === 'status' && e.target === 'baal' && e.statusId === 'mana-burn')).toBe(false);
  expect(out.result.enemyTeam[0]?.mana).toBe(100);
});

it('does not falsely report Frozen Armor retaliation Chill on Baal', () => {
  const hero = { ...subject('hero', 'player'), statuses: held, frozenArmor: { rank: 1, defensePct: 0 } };
  const out = record([hero]);
  expect(out.events.some(e => e.kind === 'damage' && e.source === 'baal' && !e.dodged && e.amount > 0)).toBe(true);
  expect(out.events.filter(e => e.kind === 'status' && e.target === 'baal' && e.statusId === 'chill')).toEqual([]);
  expect(out.result.enemyTeam[0]?.statuses.some(s => s.id === 'chill')).toBe(false);
});
