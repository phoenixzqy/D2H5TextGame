import { expect, it } from 'vitest';
import { ASSASSIN_TRAP_IDS, ASSASSIN_TRAP_TUNING, assassinTrapDefinition, assassinTrapId,
  resolveAssassinTrapTuning, matchesAssassinTrap, composeAssassinTrapRanks, copyAssassinTrapRanks } from './assassin-traps';
import { getSkill, loadDefaultSkills } from '@/engine/skills/registry';
loadDefaultSkills();
it('loads eight exact finite identities and preserves the actual authored rank/payment values', () => {
  expect(ASSASSIN_TRAP_TUNING.skills).toHaveLength(8);
  expect(assassinTrapDefinition('assassin.lightning_sentry')).toMatchObject({ durationMs: 3000, intervalMs: 1000,
    pulse: { base: [75, 110], perRank: [24, 24], damageType: 'lightning' }, skill: { manaCost: 22, cooldown: 2 } });
  expect(assassinTrapDefinition('assassin.blade_sentinel')).toMatchObject({ durationMs: 3000, intervalMs: 1000,
    pulse: { base: [50, 75], perRank: [120, 120], damageType: 'physical' }, skill: { manaCost: 15, cooldown: 2 } });
  expect(assassinTrapDefinition('assassin.death_sentry')).toMatchObject({ mode: 'corpse', lightning: {
    base: [85, 125], perRank: [7, 7] }, pulse: { damageType: 'fire', applyStatus: { dotPctOfDamage: .1 } } });
  expect(assassinTrapDefinition('assassin.blade_shield')).toMatchObject({ mode: 'reactive', durationMs: 6000, intervalMs: 1000 });
});
it('refuses missing, duplicate, foreign, expanded, nonfinite and impossible authored timing', () => {
  for (const change of [
    (x: typeof ASSASSIN_TRAP_TUNING) => ({ ...x, extra: true }),
    (x: typeof ASSASSIN_TRAP_TUNING) => ({ ...x, skills: x.skills.slice(1) }),
    (x: typeof ASSASSIN_TRAP_TUNING) => ({ ...x, skills: Array(8).fill(x.skills[0]) }),
    ...[0, 999, 3000, Infinity, NaN].map(intervalMs => (x: typeof ASSASSIN_TRAP_TUNING) => ({ ...x,
      skills: x.skills.map((row, i) => i ? row : { ...row, intervalMs }) })),
    (x: typeof ASSASSIN_TRAP_TUNING) => ({ ...x, skills: x.skills.map((row, i) => i ? row : { ...row, mode: 'corpse' }) })
  ]) expect(() => resolveAssassinTrapTuning(change(ASSASSIN_TRAP_TUNING))).toThrow();
});
it('copies and deeply freezes authored data without freezing the caller', () => {
  const input = structuredClone(ASSASSIN_TRAP_TUNING), copy = resolveAssassinTrapTuning(input);
  expect(copy).toEqual(input); expect(copy).not.toBe(input);
  expect(Object.isFrozen(copy.skills[6]?.lightning?.base)).toBe(true);
  expect(Object.isFrozen(input)).toBe(false);
});
it.each(ASSASSIN_TRAP_IDS)('%s requires exact real registration rather than an identity marker', id => {
  const skill = getSkill(id); if (!skill) throw new Error('Missing authored trap');
  expect(matchesAssassinTrap(skill)).toBe(true);
  for (const patch of [{ manaCost: 0 }, { cooldown: 0 }, { archetype: 'amazon' }, { effects: [] }, { hiddenAuthority: true }])
    expect(matchesAssassinTrap({ ...skill, ...patch })).toBe(false);
  expect(assassinTrapId('skills-assassin-' + id.slice(9).replaceAll('_', '-'))).toBe(id);
});
it('projects only selected native learned traps and refuses class/level/transitive prerequisite violations', () => {
  const player = { class: 'assassin' as const, level: 30, comboOrder: ['skills-assassin-lightning-sentry', 'assassin.lightning_sentry'],
    skillLevels: { 'assassin.fire_blast': 1, 'assassin.shock_web': 1, 'assassin.charged_bolt_sentry': 1,
      'skills-assassin-lightning-sentry': 20, 'assassin.lightning_sentry': 1 } };
  expect(composeAssassinTrapRanks(player)).toEqual({ 'assassin.lightning_sentry': 20 });
  expect(composeAssassinTrapRanks({ ...player, class: 'amazon' })).toEqual({});
  expect(composeAssassinTrapRanks({ ...player, level: 23 })).toEqual({});
  expect(composeAssassinTrapRanks({ ...player, comboOrder: [] })).toEqual({});
  expect(composeAssassinTrapRanks({ ...player, skillLevels: { ...player.skillLevels, 'assassin.fire_blast': 0 } })).toEqual({});
});
it('copies native ranks without accepting extra capability, aliases, fractional rank or Command as learning', () => {
  const input = { 'assassin.shock_web': 20 }, copy = copyAssassinTrapRanks(input);
  expect(copy).toEqual(input); expect(copy).not.toBe(input); expect(Object.isFrozen(copy)).toBe(true);
  for (const invalid of [null, [], { ...input, 'assassin.tiger_strike': 1 }, { 'skills-assassin-shock-web': 1 },
    ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ 'assassin.shock_web': rank }))])
    expect(copyAssassinTrapRanks(invalid)).toEqual({});
});
