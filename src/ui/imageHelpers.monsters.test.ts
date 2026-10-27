import { afterEach, expect, it, vi } from 'vitest';
import { getMonsterImageUrl } from './imageHelpers';
import { MONSTER_ART } from './generatedAssetMaps';
import * as overrides from './imageOverrides';

afterEach(() => { vi.restoreAllMocks(); });

it.each(['blood-lord', 'act5.blood-lord', 'monsters/act5.blood-lord', '', 'unknown-monster'])('returns no fabricated image for missing monster identity %s', (id) => {
    expect(getMonsterImageUrl(id)).toBeNull();
  });

it('keeps canonical act identity and legacy slug lookup on registered artwork', () => {
  expect(getMonsterImageUrl('Fallen')).toBe(MONSTER_ART['act1.fallen']);
  expect(getMonsterImageUrl('act1.fallen')).toBe(MONSTER_ART['act1.fallen']);
  expect(getMonsterImageUrl('monsters/act1.fallen')).toBe(MONSTER_ART['act1.fallen']);
  expect(getMonsterImageUrl('act5.fallen')).toBeNull();
});

it('honors curated overrides for both registered and otherwise absent canonical identities', () => {
  vi.spyOn(overrides, 'getImageOverride').mockImplementation((kind, key) =>
    kind === 'monster' && ['act1.fallen', 'act5.blood-lord'].includes(key) ? '/custom/' + key + '.webp' : null);
  expect(getMonsterImageUrl('fallen')).toBe('/custom/act1.fallen.webp');
  expect(getMonsterImageUrl('monsters/act5.blood-lord')).toBe('/custom/act5.blood-lord.webp');
});
