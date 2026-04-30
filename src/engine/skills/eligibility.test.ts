/**
 * Tests for {@link canCastSkill}.
 */

import { describe, it, expect } from 'vitest';
import { canCastSkill } from './eligibility';

describe('canCastSkill', () => {
  it('returns ok when skill has no requires', () => {
    expect(canCastSkill({}, undefined)).toEqual({ ok: true });
    expect(canCastSkill({}, { weaponType: 'sword', handedness: 'oneHanded' })).toEqual({ ok: true });
  });

  it('returns ok when requires is empty', () => {
    expect(canCastSkill({ requires: {} }, null)).toEqual({ ok: true });
    expect(
      canCastSkill({ requires: { weaponType: [], handedness: [] } }, null)
    ).toEqual({ ok: true });
  });

  it('returns no-weapon when weapon-type required and slot is empty (null)', () => {
    expect(
      canCastSkill({ requires: { weaponType: ['bow'] } }, null)
    ).toEqual({ ok: false, reason: 'no-weapon' });
  });

  it('returns no-weapon when weapon-type required and equipped is undefined', () => {
    expect(
      canCastSkill({ requires: { weaponType: ['bow'] } }, undefined)
    ).toEqual({ ok: false, reason: 'no-weapon' });
  });

  it('returns no-weapon when both fields of equipped are undefined', () => {
    expect(
      canCastSkill(
        { requires: { weaponType: ['bow'] } },
        {}
      )
    ).toEqual({ ok: false, reason: 'no-weapon' });
  });

  it('returns weapon-type when equipped weapon is wrong type', () => {
    expect(
      canCastSkill(
        { requires: { weaponType: ['bow', 'crossbow'] } },
        { weaponType: 'sword', handedness: 'oneHanded' }
      )
    ).toEqual({ ok: false, reason: 'weapon-type' });
  });

  it('returns ok when equipped weapon matches one of the allowed types', () => {
    expect(
      canCastSkill(
        { requires: { weaponType: ['bow', 'crossbow'] } },
        { weaponType: 'bow', handedness: 'twoHanded' }
      )
    ).toEqual({ ok: true });
    expect(
      canCastSkill(
        { requires: { weaponType: ['bow', 'crossbow'] } },
        { weaponType: 'crossbow', handedness: 'twoHanded' }
      )
    ).toEqual({ ok: true });
  });

  it('returns handedness when equipped weapon is wrong handedness', () => {
    expect(
      canCastSkill(
        { requires: { handedness: ['twoHanded'] } },
        { weaponType: 'sword', handedness: 'oneHanded' }
      )
    ).toEqual({ ok: false, reason: 'handedness' });
  });

  it('returns ok when handedness matches', () => {
    expect(
      canCastSkill(
        { requires: { handedness: ['twoHanded'] } },
        { weaponType: 'staff', handedness: 'twoHanded' }
      )
    ).toEqual({ ok: true });
  });

  it('reports weapon-type before handedness when both fail', () => {
    expect(
      canCastSkill(
        {
          requires: {
            weaponType: ['bow'],
            handedness: ['twoHanded']
          }
        },
        { weaponType: 'sword', handedness: 'oneHanded' }
      )
    ).toEqual({ ok: false, reason: 'weapon-type' });
  });

  it('combines weapon-type and handedness — both must match', () => {
    expect(
      canCastSkill(
        {
          requires: {
            weaponType: ['bow', 'crossbow'],
            handedness: ['twoHanded']
          }
        },
        { weaponType: 'bow', handedness: 'twoHanded' }
      )
    ).toEqual({ ok: true });
  });

  it('reports handedness when weapon-type is fine but handedness is missing', () => {
    expect(
      canCastSkill(
        {
          requires: {
            weaponType: ['bow'],
            handedness: ['twoHanded']
          }
        },
        { weaponType: 'bow' /* handedness undefined */ }
      )
    ).toEqual({ ok: false, reason: 'handedness' });
  });
});
