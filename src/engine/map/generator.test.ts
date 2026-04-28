import { describe, it, expect } from 'vitest';
import { generateWaves, type MonsterRef } from './generator';

const pool: MonsterRef[] = [
  { id: 'fallen', tier: 'trash', roles: ['trash'] },
  { id: 'fallen_shaman', tier: 'trash', roles: ['trash'] },
  { id: 'zombie', tier: 'trash', roles: ['trash'] },
  { id: 'corrupt_archer', tier: 'elite', roles: ['elite'] },
  { id: 'rogue_captain', tier: 'champion', roles: ['champion', 'elite'] },
  { id: 'andariel', tier: 'boss', roles: ['boss'] },
  { id: 'treasure_goblin', tier: 'elite', roles: ['treasure'] }
];

describe('generateWaves', () => {
  it('produces deterministic output for the same seed', () => {
    const a = generateWaves({ seed: 42, waveCount: 10, pool, hasBoss: true, includeTreasure: true });
    const b = generateWaves({ seed: 42, waveCount: 10, pool, hasBoss: true, includeTreasure: true });
    expect(a).toEqual(b);
  });

  it('produces different output for different seeds', () => {
    const a = generateWaves({ seed: 1, waveCount: 10, pool });
    const b = generateWaves({ seed: 2, waveCount: 10, pool });
    expect(a).not.toEqual(b);
  });

  it('places boss at the last wave when hasBoss is true', () => {
    const waves = generateWaves({ seed: 5, waveCount: 8, pool, hasBoss: true });
    expect(waves[waves.length - 1]?.tier).toBe('boss');
    expect(waves[waves.length - 1]?.monsters).toEqual(['andariel']);
  });

  it('omits boss when hasBoss is false', () => {
    const waves = generateWaves({ seed: 5, waveCount: 8, pool, hasBoss: false });
    expect(waves.every((w) => w.tier !== 'boss')).toBe(true);
  });

  it('includes elite and champion at expected slots', () => {
    const waves = generateWaves({ seed: 1, waveCount: 12, pool, hasBoss: true });
    const tiers = waves.map((w) => w.tier);
    expect(tiers).toContain('elite');
    expect(tiers).toContain('champion');
  });

  it('trash waves carry 2-4 monsters', () => {
    const waves = generateWaves({ seed: 7, waveCount: 20, pool });
    for (const w of waves) {
      if (w.tier === 'trash') {
        expect(w.monsters.length).toBeGreaterThanOrEqual(2);
        expect(w.monsters.length).toBeLessThanOrEqual(4);
      }
    }
  });
});
