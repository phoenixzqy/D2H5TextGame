import { describe, it, expect, vi, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';

interface OverrideStore {
  class: Record<string, string>;
  monster: Record<string, string>;
  item: Record<string, string>;
  merc: Record<string, string>;
}

const overrideStore: OverrideStore = {
  class: {},
  monster: {},
  item: {},
  merc: {}
};

vi.mock('./imageOverrides', () => ({
  getImageOverride: (kind: string, id: string): string | null => {
    const map = (overrideStore as unknown as Record<string, Record<string, string>>)[kind];
    return map && typeof map[id] === 'string' ? map[id] : null;
  }
}));

// Import AFTER mock is registered.
import {
  resolveClassPortrait,
  resolveMonsterArt,
  resolveItemIcon,
  resolveMercArt
} from './cardAssets';
import overridesJson from '../data/imageOverrides.json';
import overridesSchema from '../data/schema/image-overrides.schema.json';

beforeEach(() => {
  overrideStore.class = {};
  overrideStore.monster = {};
  overrideStore.item = {};
  overrideStore.merc = {};
});

describe('cardAssets — image overrides take precedence', () => {
  describe('class', () => {
    it('override-hit returns override path', () => {
      overrideStore.class.barbarian = '/custom/barb.png';
      expect(resolveClassPortrait('barbarian')).toBe('/custom/barb.png');
      expect(resolveClassPortrait('classes/barbarian')).toBe('/custom/barb.png');
    });

    it('override-miss falls through to inferred path', () => {
      expect(resolveClassPortrait('barbarian')).toMatch(/classes\.barbarian\.png$/);
    });
  });

  describe('monster', () => {
    it('override-hit returns override path', () => {
      overrideStore.monster['act1.fallen'] = '/custom/fallen.webp';
      expect(resolveMonsterArt('monsters/act1.fallen')).toBe('/custom/fallen.webp');
      expect(resolveMonsterArt('act1.fallen')).toBe('/custom/fallen.webp');
    });

    it('override-miss falls through to MONSTER_ART', () => {
      expect(resolveMonsterArt('act1.fallen')).toMatch(/monsters\.act1\.fallen\.png$/);
    });
  });

  describe('item', () => {
    it('override-hit returns override path (post-strip key)', () => {
      overrideStore.item['unique.shako'] = '/custom/shako.png';
      expect(resolveItemIcon('unique.shako')).toBe('/custom/shako.png');
      expect(resolveItemIcon('items/unique.shako')).toBe('/custom/shako.png');
    });

    it('override-hit on archetype key', () => {
      overrideStore.item.sword = '/custom/sword.png';
      expect(resolveItemIcon('sword')).toBe('/custom/sword.png');
    });

    it('override-miss falls through to UNIQUE_ITEM_ICONS', () => {
      expect(resolveItemIcon('unique.shako')).toMatch(/unique\.shako\.png$/);
    });

    it('override-miss + unmapped base returns null (silhouette)', () => {
      expect(resolveItemIcon('items/normal.crystal-sword')).toBeNull();
    });
  });

  describe('merc', () => {
    it('override-hit returns override path', () => {
      overrideStore.merc['act1-rogue-pierce'] = '/custom/rogue.png';
      expect(resolveMercArt('mercs/act1-rogue-pierce')).toBe('/custom/rogue.png');
      expect(resolveMercArt('act1-rogue-pierce')).toBe('/custom/rogue.png');
    });

    it('override-hit on canonical archetype', () => {
      overrideStore.merc['rogue-archer'] = '/custom/rogue-archer.png';
      expect(resolveMercArt('rogue-archer')).toBe('/custom/rogue-archer.png');
    });

    it('override-miss falls through to prefix-rule proxy', () => {
      expect(resolveMercArt('act1-rogue-pierce')).toMatch(/classes\.amazon\.png$/);
    });
  });
});

describe('imageOverrides JSON ↔ schema round-trip', () => {
  it('the committed imageOverrides.json validates against its schema', () => {
    const ajv = new Ajv2020({ strict: true, allErrors: true });
    const validate = ajv.compile(overridesSchema);
    const ok = validate(overridesJson);
    if (!ok) {
      // surface the errors in test output
      // eslint-disable-next-line no-console
      console.error(validate.errors);
    }
    expect(ok).toBe(true);
  });

  it('rejects a malformed file (extra kind, wrong version)', () => {
    const ajv = new Ajv2020({ strict: true, allErrors: true });
    const validate = ajv.compile(overridesSchema);
    expect(
      validate({
        version: 2,
        overrides: { class: {}, monster: {}, item: {}, merc: {} }
      })
    ).toBe(false);
    expect(
      validate({
        version: 1,
        overrides: { class: {}, monster: {}, item: {}, merc: {}, zone: {} }
      })
    ).toBe(false);
    expect(
      validate({
        version: 1,
        overrides: {
          class: { barbarian: 123 },
          monster: {},
          item: {},
          merc: {}
        }
      })
    ).toBe(false);
  });
});
