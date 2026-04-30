/**
 * Bug A — skill alias resolution.
 *
 * Regression suite: ensures monster JSON ids (`monster-weak-melee`),
 * merc data ids (`mskill-jab`, `aura-might`) and player skill bar ids
 * (`barbarian.bash`, `necromancer.raise_skeleton`) all resolve through
 * the skill registry instead of silently collapsing to basic-attacks.
 */
import { describe, it, expect } from 'vitest';
import { getSkill } from './registry';
import { aliasToCanonical } from './aliases';

describe('skill alias resolution', () => {
  it('resolves monster-* kebab ids → monster.* canonical ids', () => {
    expect(aliasToCanonical('monster-weak-melee')).toBe('monster.weak_melee');
    expect(aliasToCanonical('monster-fire-breath')).toBe('monster.fire_breath');
    expect(aliasToCanonical('monster-strong-melee')).toBe('monster.strong_melee');
  });

  it('resolves skills-CLASS-foo-bar → CLASS.foo_bar', () => {
    expect(aliasToCanonical('skills-necromancer-raise-skeleton')).toBe(
      'necromancer.raise_skeleton'
    );
    expect(aliasToCanonical('skills-barbarian-bash')).toBe('barbarian.bash');
  });

  it('returns undefined for unmappable ids', () => {
    expect(aliasToCanonical('barbarian.bash')).toBeUndefined();
    expect(aliasToCanonical('totally_unknown')).toBeUndefined();
  });
});

describe('getSkill — id normalization', () => {
  it('finds canonical engine ids verbatim', () => {
    expect(getSkill('barbarian.bash')).toBeDefined();
    expect(getSkill('necromancer.raise_skeleton')).toBeDefined();
    expect(getSkill('monster.weak_melee')).toBeDefined();
  });

  it('finds monster JSON kebab ids via alias', () => {
    expect(getSkill('monster-weak-melee')).toBeDefined();
    expect(getSkill('monster-strong-melee')).toBeDefined();
    expect(getSkill('monster-fire-breath')).toBeDefined();
    expect(getSkill('monster-charge')).toBeDefined();
  });

  it('finds merc/aura JSON ids (registered as engine stubs)', () => {
    expect(getSkill('mskill-jab')).toBeDefined();
    expect(getSkill('mskill-bash')).toBeDefined();
    expect(getSkill('mskill-fire-ball')).toBeDefined();
    expect(getSkill('aura-might')).toBeDefined();
    expect(getSkill('aura-holy-freeze')).toBeDefined();
    expect(getSkill('aura-thorns')).toBeDefined();
  });

  it('finds player skill-bar JSON ids via alias', () => {
    expect(getSkill('skills-barbarian-bash')).toBeDefined();
    expect(getSkill('skills-necromancer-raise-skeleton')).toBeDefined();
  });

  it('returns undefined for genuinely unknown ids without throwing', () => {
    expect(getSkill('totally-unknown-skill')).toBeUndefined();
  });
});
