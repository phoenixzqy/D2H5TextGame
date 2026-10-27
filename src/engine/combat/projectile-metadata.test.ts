import { expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import amazon from '../../data/skills/amazon.json';
import { createSkillValidator } from '../skills/skill-validator';
const ids = ['monster-blood-raven-fire-arrow', 'monster-poison-spit', 'monster-lightning-bolt',
 'monster-ice-shard', 'monster-arcane-bolt', 'monster-frozen-orb', 'monster-weak-ranged',
 'monster-fire-bolt', 'monster-frost-bolt', 'monster-fire-arrow', 'monster-fire-ball',
 'monster-bone-spirit', 'monster-plague-spit'];
const validate = createSkillValidator();
function row(id = 'monster-weak-ranged') {
 const r = rows.find(row => row.id === id); if (!r) throw new Error('Missing missile source'); return structuredClone(r);
}
it.each(ids)('authors actual normal flight for %s', id => {
 const r = row(id); expect(r).toHaveProperty('projectileFlightMs', 500); expect(validate(r)).toBe(true);
});
it('keeps immediate monster skills and all current Amazon attacks immediate', () => {
 for (const r of [...rows.filter(r => !ids.includes(r.id)), ...amazon]) expect(r).not.toHaveProperty('projectileFlightMs');
});
it.each([0, -1, 5001, NaN, Infinity, '500', null])('rejects invalid authored flight %j', projectileFlightMs => {
 expect(validate({ ...row(), projectileFlightMs })).toBe(false);
});
it('accepts finite fractional flight, requires exact missile identities and rejects missing capability', () => {
 expect(validate({ ...row(), projectileFlightMs: .5 })).toBe(true);
 expect(validate({ ...row(), projectileFlightMs: 5000 })).toBe(true);
 expect(validate({ ...row(), id: 'monster-weak-melee', projectileFlightMs: 500 })).toBe(false);
 const missing: Record<string, unknown> = { ...row() }; delete missing.projectileFlightMs;
 expect(validate(missing)).toBe(false);
});
