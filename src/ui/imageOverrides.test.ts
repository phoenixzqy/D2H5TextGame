import { describe, it, expect } from 'vitest';
import { getImageOverride, _getImageOverridesFile } from './imageOverrides';

describe('imageOverrides module', () => {
  it('loads and validates the bundled JSON at module-load (no throw)', () => {
    const file = _getImageOverridesFile();
    expect(file.version).toBe(1);
    expect(Object.keys(file.overrides).sort()).toEqual([
      'class',
      'item',
      'merc',
      'monster',
      'skill'
    ]);
  });

  it('returns null for unknown kind/id pairs', () => {
    expect(getImageOverride('class', 'nope')).toBeNull();
    expect(getImageOverride('monster', 'act99.boss')).toBeNull();
    expect(getImageOverride('item', '')).toBeNull();
    expect(getImageOverride('merc', 'ghost')).toBeNull();
  });
});
