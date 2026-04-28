import { describe, it, expect } from 'vitest';
import { createMockPlayer, CHARACTER_CLASSES } from './createMockPlayer';

describe('createMockPlayer', () => {
  it('grants new level-1 characters 1 skill point', () => {
    const p = createMockPlayer('Hero', 'barbarian');
    expect(p.level).toBe(1);
    expect(p.skillPoints).toBe(1);
    expect(p.statPoints).toBe(0);
  });

  it('grants 1 skill point for every supported class', () => {
    for (const cls of CHARACTER_CLASSES) {
      const p = createMockPlayer('A', cls);
      expect(p.skillPoints, `class ${cls}`).toBe(1);
    }
  });
});
