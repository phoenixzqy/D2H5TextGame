import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import schema from '../../data/schema/skill.schema.json';
import skills from '../../data/skills/druid.json';

const validate = new Ajv2020({ strict: true }).compile(schema);
const source = (slug: string): Record<string, unknown> => {
  const row = skills.find((s) => s.id === 'skills-druid-' + slug);
  if (!row) throw new Error('Missing authored Druid sustain row');
  return structuredClone(row);
};
const tuned = (slug: string): Record<string, unknown> => {
  const row = source(slug);
  row.onHitRecovery = { lifeFraction: slug === 'feral-rage' ? 0.1 : 0.5 };
  if (slug === 'feral-rage') {
    row.feralRage = { attackSpeedPctPerStack: 0.05, maxStacks: 5, durationMs: 8000 };
    row.appliesStatus = ['bleed'];
    row.statusEffect = { dotPctOfDamage: 0.1 };
  } else Reflect.deleteProperty(row, 'appliesStatus');
  return row;
};
describe.each(['feral-rage', 'hunger'])('strict authored %s hit recovery', (slug) => {
  it('authors explicit recovery and accepts the complete reconciled row', () => {
    expect(source(slug).onHitRecovery).toEqual({ lifeFraction: slug === 'feral-rage' ? 0.1 : 0.5 });
    expect(validate(tuned(slug))).toBe(true);
  });
  it('rejects an actual row with its required recovery payload removed', () => {
    const row = source(slug);
    Reflect.deleteProperty(row, 'onHitRecovery');
    expect(validate(row)).toBe(false);
  });
  it.each([undefined, 0, -0.1, NaN, Infinity, 1.1])('rejects recovery fraction %s', (value) => {
    expect(
      validate({
        ...tuned(slug),
        onHitRecovery: value === undefined ? {} : { lifeFraction: value }
      })
    ).toBe(false);
  });
  it('rejects extra tuning, foreign identities and contradictory attacks', () => {
    for (const patch of [
      { onHitRecovery: { lifeFraction: 0.5, lifeFracton: 0.5 } },
      { id: 'skills-amazon-jab' },
      { trigger: 'passive' },
      { target: 'all-enemies' },
      { damageType: 'fire' },
      { damage: undefined }
    ])
      expect(validate({ ...tuned(slug), ...patch })).toBe(false);
  });
});
describe('strict Feral speed and explicit primary Bleed', () => {
  it('requires the actual Feral row to author all finite stack tuning', () => {
    expect(source('feral-rage').feralRage).toEqual({
      attackSpeedPctPerStack: 0.05,
      maxStacks: 5,
      durationMs: 8000
    });
    const row = source('feral-rage');
    Reflect.deleteProperty(row, 'feralRage');
    expect(validate(row)).toBe(false);
  });
  it.each([
    {},
    { attackSpeedPctPerStack: 0, maxStacks: 5, durationMs: 8000 },
    { attackSpeedPctPerStack: NaN, maxStacks: 5, durationMs: 8000 },
    { attackSpeedPctPerStack: 0.05, maxStacks: 0, durationMs: 8000 },
    { attackSpeedPctPerStack: 0.05, maxStacks: 1.5, durationMs: 8000 },
    { attackSpeedPctPerStack: 0.05, maxStacks: 5, durationMs: 0 },
    { attackSpeedPctPerStack: 0.05, maxStacks: 5, durationMs: Infinity },
    { attackSpeedPctPerStack: 0.05, maxStacks: 5, durationMs: 8000, typo: 1 }
  ])('rejects malformed speed tuning %j', (feralRage) => {
    expect(validate({ ...tuned('feral-rage'), feralRage })).toBe(false);
  });
  it('rejects marker-only, absent or unsupported Bleed metadata', () => {
    for (const patch of [
      { appliesStatus: ['feral-rage', 'bleed'] },
      { appliesStatus: ['poison'] },
      { statusEffect: {} },
      { statusEffect: { dotPctOfDamage: 0 } },
      { statusEffect: { dotPctOfDamage: 0.1, durationMs: 2500 } }
    ])
      expect(validate({ ...tuned('feral-rage'), ...patch })).toBe(false);
  });
  it('does not grant speed or an inert enemy marker to Hunger or another skill', () => {
    const speed = { attackSpeedPctPerStack: 0.05, maxStacks: 5, durationMs: 8000 };
    expect(validate({ ...tuned('hunger'), feralRage: speed })).toBe(false);
    expect(validate({ ...tuned('hunger'), appliesStatus: ['hunger'] })).toBe(false);
    expect(validate({ ...source('tornado'), feralRage: speed })).toBe(false);
  });
});
