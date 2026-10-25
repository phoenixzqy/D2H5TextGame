import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import schema from '../../data/schema/skill.schema.json';
import rows from '../../data/skills/paladin.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { composeStatAura, copyStatAuraProjection, resolveStatAuraDefinitions } from './stat-auras';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
const healing = { intervalMs: 5000, amount: 20 };
function prayer() {
  const row = rows.find(r => r.id === 'skills-paladin-prayer');
  if (!row) throw new Error('Missing Prayer'); return structuredClone(row);
}
describe('Prayer authored healing authority', () => {
  it('copies explicit eligible selection and authored healing without mutating or refilling the player', () => {
    const player = { ...createMockPlayer('Prayer', 'paladin'), selectedAuraId: 'paladin.prayer' as const,
      skillLevels: { 'paladin.prayer': 2, 'skills-paladin-prayer': 1 } };
    const before = structuredClone(player), aura = composeStatAura(player, 'merc');
    expect(aura).toMatchObject({ selectedAuraId: 'paladin.prayer', sourceHeroId: player.id,
      fieldedMercCombatId: 'merc', rank: 2, bonuses: { lifeRegenPct: .06 }, healing });
    expect(player).toEqual(before);
    expect(composeStatAura({ ...player, class: 'sorceress' })).toBeUndefined();
    expect(composeStatAura({ ...player, skillLevels: {} })).toBeUndefined();
    const { selectedAuraId: _selection, ...unselected } = player;
    expect(composeStatAura(unselected)).toBeUndefined();
  });
  it('requires exact Prayer-only finite healing data and an aura/passive/self/CD0 row', () => {
    const row = { ...prayer(), auraHealing: healing };
    expect(validate(row)).toBe(true);
    expect(validate({ ...row, auraHealing: undefined })).toBe(false);
    expect(validate({ ...row, id: 'skills-paladin-might' })).toBe(false);
    for (const patch of [{ aura: false }, { trigger: 'active' }, { target: 'all-allies' }, { cooldown: 1 },
      { damage: { physical: 1 } }, { appliesStatus: ['burn'] }]) expect(validate({ ...row, ...patch })).toBe(false);
    for (const invalid of [{ intervalMs: 999, amount: 20 }, { intervalMs: 60001, amount: 20 },
      { intervalMs: 5000.5, amount: 20 }, { intervalMs: 5000, amount: 0 }, { intervalMs: 5000, amount: NaN },
      { intervalMs: 5000, amount: Infinity }, { ...healing, extra: 1 }, { intervalMs: 5000 }, { amount: 20 }]) {
      expect(validate({ ...row, auraHealing: invalid })).toBe(false);
    }
  });
  it('copies alternate JSON/direct tuning and rejects missing or foreign healing metadata', () => {
    const changed = rows.map(r => r.id === 'skills-paladin-prayer' ? { ...r, auraHealing: { intervalMs: 1500, amount: 37.5 } } : r);
    const before = structuredClone(changed), definitions = resolveStatAuraDefinitions(changed);
    expect(definitions).toHaveProperty(['paladin.prayer', 'healing'], { intervalMs: 1500, amount: 37.5 });
    expect(changed).toEqual(before);
    const input = { selectedAuraId: 'paladin.prayer' as const, sourceHeroId: 'hero', rank: 1, maxRank: 20,
      bonuses: { lifeRegenPct: .03 }, healing: { ...healing } };
    const copy = copyStatAuraProjection(input); input.healing.amount = 99;
    expect(copy).toHaveProperty('healing', healing); expect(Object.isFrozen(copy?.healing)).toBe(true);
    const { healing: _healing, ...missing } = input;
    expect(copyStatAuraProjection(missing)).toBeUndefined();
    expect(copyStatAuraProjection({ ...input, selectedAuraId: 'paladin.thorns', bonuses: { thornsPct: .04 } })).toBeUndefined();
    for (const invalid of [{ ...healing, amount: NaN }, { ...healing, amount: Infinity }, { ...healing, amount: -1 },
      { ...healing, intervalMs: 0 }, { ...healing, intervalMs: 5000.5 }, { ...healing, extra: 1 }]) {
      expect(copyStatAuraProjection({ ...input, healing: invalid })).toBeUndefined();
    }
  });
});
