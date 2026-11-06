import { expect, it } from 'vitest';
import { monsters } from '../../data';
import { createRng } from '../rng';
import type { MonsterDef, MonsterStatusImmunity } from '../types/monsters';
import { buildMonsterUnit } from './monster-factory';
import { applyStatusWithResult, spreadPlague } from './status';

it.each(['monsters/act1.andariel', 'monsters/act3.mephisto'])(
  '%s copies/freeze-protects immunity and rejects Poison/Plague without changing the unit or RNG', id => {
    const native = monsters.find(row => row.id === id);
    if (!native) throw new Error('Missing native boss');
    const immunities: MonsterStatusImmunity[] = ['poison', 'plague'];
    const def: MonsterDef = { ...native, statusImmunities: immunities };
    const unit = buildMonsterUnit({ def, level: 40, tier: 'chapter-boss', rng: createRng(13) });
    expect(unit.statusImmunities).toEqual(['poison', 'plague']);
    expect(unit.statusImmunities).not.toBe(immunities);
    expect(Object.isFrozen(unit.statusImmunities)).toBe(true);
    immunities.push('freeze');
    expect(unit.statusImmunities).toEqual(['poison', 'plague']);
    const before = structuredClone(unit), rng = createRng(13), controlRng = createRng(13);
    for (const statusId of ['poison', 'plague']) {
      const applied = applyStatusWithResult(unit, { id: statusId, sourceId: 'hero',
        simClockMs: 1700, durationMs: 5000, dotPerStack: 8, damageType: 'poison' }, rng);
      expect(applied).toEqual({ unit, applied: false });
      expect(applied.unit).toBe(unit);
      const source = { ...unit, id: 'dead', life: 0, statuses: [{ id: statusId,
        sourceId: 'hero', stacks: 4, remaining: 5, dotPerStack: 8, damageType: 'poison' as const }] };
      const { statusImmunities: omitted, ...susceptible } = unit;
      expect(omitted).toEqual(['poison', 'plague']);
      const targets = [unit, { ...susceptible, id: 'recipient' }];
      const targetsBefore = structuredClone(targets), sourceBefore = structuredClone(source);
      const spread = spreadPlague(source, targets, 0.5, rng, 1700);
      expect(spread[0]).toBe(unit);
      expect(spread[1]?.statuses).toMatchObject([{ id: 'poison', stacks: 2,
        sourceId: 'dead', dotPerStack: 8, damageType: 'poison' }]);
      expect(source).toEqual(sourceBefore);
      expect(targets).toEqual(targetsBefore);
    }
    expect(unit).toEqual(before);
    expect(rng.next()).toBe(controlRng.next());
  }
);
