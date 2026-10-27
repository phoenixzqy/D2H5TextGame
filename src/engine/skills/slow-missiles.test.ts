import { expect, it } from 'vitest';
import rows from '../../data/skills/amazon.json';
import { createSkillValidator } from './skill-validator';
const validate = createSkillValidator();
function row() { const r = rows.find(row => row.id === 'skills-amazon-slow-missiles'); if (!r) throw new Error('Missing Slow Missiles'); return structuredClone(r); }
it('authors finite actual projectile speed without passive dodge', () => {
 expect(row()).toHaveProperty('statusEffect', { durationMs: 6000, projectileSpeedPct: 33 });
 expect(row().scaling).not.toHaveProperty('passiveStatsPerLevel'); expect(validate(row())).toBe(true);
});
it('accepts finite authored tuning and rejects incomplete or unrelated packets', () => {
 expect(validate({ ...row(), statusEffect: { durationMs: 123.5, projectileSpeedPct: 25 } })).toBe(true);
 for (const patch of [
  { statusEffect: undefined }, { statusEffect: {} }, { statusEffect: { durationMs: 6000 } },
  ...[0, -1, 100, NaN, Infinity, '33', null].map(projectileSpeedPct => ({ statusEffect: { durationMs: 6000, projectileSpeedPct } })),
  ...[0, -1, NaN, Infinity, '6000', null].map(durationMs => ({ statusEffect: { durationMs, projectileSpeedPct: 33 } })),
  { statusEffect: { durationMs: 6000, projectileSpeedPct: 33, chance: 1 } }, { target: 'self' },
  { appliesStatus: ['slow-missiles', 'chill'] }, { damage: { min: 1, max: 2 }, damageType: 'cold' },
  { scaling: { passiveStatsPerLevel: { physDodgePct: .5 } } }, { trigger: 'passive' },
  { cooldown: .5 }, { cost: {} }, { maxLevel: 21 }
 ]) expect(validate({ ...row(), ...patch })).toBe(false);
 expect(validate({ ...row(), id: 'skills-amazon-inner-sight', statusEffect: { durationMs: 6000, projectileSpeedPct: 33 } })).toBe(false);
});

it('copies exactly one complete definition without retaining mutable data', async () => {
 const { resolveSlowMissilesDefinition, SLOW_MISSILES_DEFINITION } = await import('./slow-missiles');
 const r = row(), before = structuredClone(r), d = resolveSlowMissilesDefinition([r]);
 expect(d).toEqual({ durationMs: 6000, projectileSpeedPct: 33, requiredLevel: 12, maxRank: 20 });
 expect(d).toEqual(SLOW_MISSILES_DEFINITION); expect(Object.isFrozen(d)).toBe(true); expect(r).toEqual(before);
 for (const list of [[], [r, r], [null, 42, {}], [{ ...r, statusEffect: {} }]])
  expect(() => resolveSlowMissilesDefinition(list)).toThrow(/Slow Missiles/);
 expect(resolveSlowMissilesDefinition([{ ...r, statusEffect: { durationMs: .5, projectileSpeedPct: 25.5 } }]))
  .toEqual({ durationMs: .5, projectileSpeedPct: 25.5, requiredLevel: 12, maxRank: 20 });
});
