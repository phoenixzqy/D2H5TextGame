import { describe, expect, it } from 'vitest';
import banner from '../gacha/banner-config.json';
import mercs from '../gacha/mercenaries.json';
import { validateRecruitmentDefinitions } from './recruitment';

describe('closed authored recruitment definitions', () => {
  it('returns the exact authored catalogs after structural and cross-reference validation', () => {
    const result = validateRecruitmentDefinitions(mercs, banner);
    expect(result.pool).toBe(mercs);
    expect(result.banner).toBe(banner);
    expect(result.pool).toHaveLength(25);
  });
  it.each([
    { ...banner, typo: true },
    { ...banner, cost: { single: '10', tenPull: 90 } },
    { ...banner, cost: { single: 10, tenPull: 0 } },
    { ...banner, rates: { SSR: .1, SR: .3, R: .5 } },
    { ...banner, rates: { SSR: -.1, SR: .3, R: .8 } },
    { ...banner, rates: { SSR: .1, SR: .3, R: .6, unexpected: 0 } },
    { ...banner, pity: { ...banner.pity, sr: { ...banner.pity.sr, threshold: 0 } } },
    { ...banner, pity: { ...banner.pity, sr: { ...banner.pity.sr, threshold: 91 } } },
    { ...banner, pool: { ...banner.pool, SSR: [] } },
    { ...banner, pool: { ...banner.pool, SSR: Array.from({ length: 5 }, () => banner.pool.SSR[0]) } },
    { ...banner, pool: { ...banner.pool, SSR: ['mercs/missing', ...banner.pool.SSR.slice(1)] } },
    { ...banner, shardConversion: { ...banner.shardConversion, perDuplicate: { SSR: 15, SR: 5, R: -1 } } },
    { ...banner, uiHistoryCap: 0 }
  ])('refuses malformed banner data without mutation %#', bad => {
    const before = structuredClone(bad);
    expect(() => validateRecruitmentDefinitions(mercs, bad)).toThrow(/recruitment/i);
    expect(bad).toEqual(before);
  });
  it('refuses tier-swapped identities despite otherwise valid shape and complete coverage', () => {
    const bad = structuredClone(banner);
    const ssr = bad.pool.SSR[0], sr = bad.pool.SR[0];
    if (!ssr || !sr) throw new Error('Missing authored pools');
    bad.pool.SSR[0] = sr; bad.pool.SR[0] = ssr;
    expect(() => validateRecruitmentDefinitions(mercs, bad)).toThrow(/recruitment/i);
  });
  it.each([
    mercs.slice(1),
    [mercs[0], ...mercs.slice(0, -1)],
    [{ ...mercs[0], signatureSkillId: 'missing-skill' }, ...mercs.slice(1)],
    [{ ...mercs[0], baseStats: { strength: '1', dexterity: 1, vitality: 1, energy: 1 } }, ...mercs.slice(1)],
    [{ ...mercs[0], unknown: true }, ...mercs.slice(1)]
  ].map(catalog => ({ catalog })))('refuses missing, duplicate or invalid mercenary definitions %#', ({ catalog }) => {
    expect(() => validateRecruitmentDefinitions(catalog, banner)).toThrow(/recruitment/i);
  });
  it('rechecks a previously valid catalog after in-place mutation and repair', () => {
    const mutable = structuredClone(banner);
    expect(validateRecruitmentDefinitions(mercs, mutable).banner).toBe(mutable);
    mutable.rates.R = .5;
    expect(() => validateRecruitmentDefinitions(mercs, mutable)).toThrow(/recruitment/i);
    mutable.rates.R = banner.rates.R;
    expect(validateRecruitmentDefinitions(mercs, mutable).banner).toBe(mutable);
  });
});
