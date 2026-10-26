import { expect, it } from 'vitest';
import rows from '../../data/skills/necromancer.json';
import { createRng } from '../rng';
import { createSkillValidator } from '../skills/skill-validator';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from '../skills/dataCatalog';
import { activeTerror, resolveTerrorDefinition, TERROR_DEFINITION } from './terror-definition';
import { applyStatus, rebaseStatusClock, shortenCleansingStatuses } from './status';
import { runBattle, runBattleRecorded } from './combat';
import type { ActiveStatus, CombatUnit, MonsterTier } from './types';

const row = rows.find(r => r.id === 'skills-necromancer-terror');
if (!row) throw new Error('Missing authored Terror');
const validate = createSkillValidator();
function unit(tier: MonsterTier = 'trash'): CombatUnit {
  return { id: 'target', name: 'Synthetic fear target', side: 'enemy', kind: 'monster', tier, level: 30,
    life: 100000, mana: 0, cooldowns: {}, skillOrder: [], activeBuffIds: [], statuses: [], enraged: false,
    stats: { life: 100000, lifeMax: 100000, mana: 0, manaMax: 0, attack: 100, defense: 0, magicResist: 0,
      attackSpeed: 250, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function paid(tier: MonsterTier = 'trash', start = 400): CombatUnit {
  return applyStatus(unit(tier), { id: 'terror', sourceId: 'absent-paid-owner', terror: true,
    simClockMs: start, durationMs: 1000 }, createRng(1));
}
it('requires complete finite authored fear and grants one nondamaging paid adapter effect', () => {
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
  expect(TERROR_DEFINITION).toEqual({ durationMs: 1000, bossDurationMultiplier: .5 });
  const typed = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(r => r.id === row.id);
  if (!typed) throw new Error('Missing typed fear');
  expect(registeredSkillFromJson(typed).effects).toEqual([{ kind: 'debuff', statusId: 'terror', durationMs: 1000, terror: true }]);
  expect(registeredSkillFromJson({ ...typed, statusEffect: { durationMs: 1000 } }).effects)
    .toEqual([{ kind: 'debuff', statusId: 'terror' }]);
});
it.each([
  { statusEffect: undefined }, { statusEffect: {} }, { statusEffect: { durationMs: 1000 } },
  ...[0, -1, .5, NaN, Infinity].map(durationMs => ({ statusEffect: { durationMs, bossDurationMultiplier: .5 } })),
  ...[0, -1, 1.1, NaN, Infinity].map(bossDurationMultiplier => ({ statusEffect: { durationMs: 1000, bossDurationMultiplier } })),
  { statusEffect: { durationMs: 1000, bossDurationMultiplier: .5, chance: .5 } },
  { trigger: 'passive' }, { target: 'self' }, { maxLevel: 21 }, { requiredLevel: 11 },
  { prerequisites: [] }, { cost: { mana: 0 } }, { cooldown: 0 }, { scaling: { cooldownPerLevel: -.1 } },
  { appliesStatus: ['howl'] }, { damage: { min: 1, max: 1 } }
])('rejects incomplete or contradictory fear metadata %j', patch => {
  const invalid = { ...row, ...patch };
  expect(validate(invalid)).toBe(false); expect(() => resolveTerrorDefinition([invalid])).toThrow();
});
it('copies immutable tuning while preserving source ownership and refusing duplicate definitions', () => {
  const source = structuredClone(rows), definition = resolveTerrorDefinition(source);
  const changed = source.find(r => r.id === row.id);
  if (!changed?.statusEffect) throw new Error('Missing copied fear');
  changed.statusEffect.durationMs = 2500;
  expect(definition.durationMs).toBe(1000); expect(Object.isFrozen(definition)).toBe(true);
  expect(resolveTerrorDefinition(source).durationMs).toBe(2500);
  expect(() => resolveTerrorDefinition([])).toThrow(); expect(() => resolveTerrorDefinition([row, row])).toThrow();
});
it.each(['trash', 'elite', 'champion', 'rare-elite', 'rare-minion', 'boss', 'chapter-boss'] as const)(
  'uses exact finite %s timing without a living source and survives fractional rebasing', tier => {
    const target = paid(tier, 400.1), duration = tier === 'boss' || tier === 'chapter-boss' ? 500 : 1000;
    expect(target.statuses[0]).toMatchObject({ terror: true, appliedAtMs: 400.1, expiresAtMs: 400.1 + duration });
    expect(activeTerror(target, 400.099)).toBe(false); expect(activeTerror(target, 400.1)).toBe(true);
    expect(activeTerror(target, 400.1 + duration)).toBe(false);
    expect(activeTerror(rebaseStatusClock(target, 500.2), 0)).toBe(true);
  });
it('replaces source/interval without stacking, while Cleansing shortens each paid application only once', () => {
  const first = paid(), before = structuredClone(first);
  const shortened = shortenCleansingStatuses(first, 600, .5);
  expect(shortened.statuses[0]).toMatchObject({ appliedAtMs: 400, expiresAtMs: 1000, terror: true, cleansingShortened: true });
  expect(shortenCleansingStatuses(shortened, 700, .5)).toBe(shortened);
  const refreshed = applyStatus(shortened, { id: 'terror', sourceId: 'second-owner', terror: true,
    simClockMs: 800, durationMs: 1000, cleansingDurationMultiplier: .5 }, createRng(1));
  expect(first).toEqual(before);
  expect(refreshed.statuses).toEqual([expect.objectContaining({ sourceId: 'second-owner', stacks: 1,
    appliedAtMs: 800, expiresAtMs: 1300, terror: true })]);
  expect(activeTerror(refreshed, 1299.9)).toBe(true); expect(activeTerror(refreshed, 1300)).toBe(false);
  const boss = applyStatus(unit('boss'), { id: 'terror', sourceId: 'owner', terror: true,
    simClockMs: 400, durationMs: 1000, cleansingDurationMultiplier: .5 }, createRng(1));
  expect(boss.statuses[0]?.expiresAtMs).toBe(650);
});
it.each<Partial<ActiveStatus>>([
  { id: 'howl' }, { stacks: 0 }, { stacks: 2 }, { appliedAtMs: Infinity }, { appliedAtMs: NaN },
  { expiresAtMs: Infinity }, { expiresAtMs: NaN }, { expiresAtMs: 400 }, { expiresAtMs: 399 }, { expiresAtMs: 1400.01 }
])('rejects a malformed paid fear packet %j', patch => {
  const target = paid();
  expect(activeTerror({ ...target, statuses: target.statuses.map(s => ({ ...s, ...patch })) }, 500)).toBe(false);
});
it('bare, indefinite, incomplete and nonfinite control views grant no fear', () => {
  const target = paid(), marker = { id: 'terror', sourceId: 'marker', stacks: 1, remaining: -1 };
  for (const status of [marker, { ...marker, terror: true as const },
    { ...marker, appliedAtMs: 400, expiresAtMs: 1400 },
    { ...marker, terror: true as const, appliedAtMs: 400 }])
    expect(activeTerror({ ...target, statuses: [status] }, 500)).toBe(false);
  for (const clock of [NaN, Infinity, -Infinity]) expect(activeTerror(target, clock)).toBe(false);
});
it('suppresses real actions only on the exact interval and leaves source inputs/replay/cadence intact', () => {
  const target = paid('trash', 500), hold: ActiveStatus = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
  const hero: CombatUnit = { ...unit(), id: 'hero', kind: 'hero', side: 'player', statuses: [hold] };
  const input = { seed: 1, playerTeam: [hero], enemyTeam: [{ ...target,
    statuses: [...target.statuses, { ...hold, appliedAtMs: 2501 }] }] };
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(out.events.flatMap(e => e.kind === 'action' && e.actor === 'target' ? [e.simClockMs] : []))
    .toEqual([1500, 2000, 2500]);
  expect(out.result.playerTeam[0]?.life).toBe(99800);
  expect(input).toEqual(before); expect(runBattle(input)).toEqual(out.result); expect(runBattleRecorded(input)).toEqual(out);
});
