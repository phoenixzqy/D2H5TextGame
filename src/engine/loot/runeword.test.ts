import { describe, it, expect } from 'vitest';
import { matchRuneword, BUILTIN_RUNEWORDS } from './runeword';

describe('runeword matching', () => {
  it('matches Stealth (Tal + Eth, 2-soc armor)', () => {
    expect(
      matchRuneword({
        baseType: 'armor',
        sockets: 2,
        runes: ['tal', 'eth'],
        isWhiteBase: true
      })
    ).toBe('rw_stealth');
  });

  it('matches Spirit (Tal + Thul + Ort + Amn, 4-soc weapon)', () => {
    expect(
      matchRuneword({
        baseType: 'weapon',
        sockets: 4,
        runes: ['tal', 'thul', 'ort', 'amn'],
        isWhiteBase: true
      })
    ).toBe('rw_spirit');
  });

  it('matches Enigma (Jah + Ith + Ber, 3-soc armor)', () => {
    expect(
      matchRuneword({
        baseType: 'armor',
        sockets: 3,
        runes: ['jah', 'ith', 'ber'],
        isWhiteBase: true
      })
    ).toBe('rw_enigma');
  });

  it('rejects non-white bases', () => {
    expect(
      matchRuneword({
        baseType: 'armor',
        sockets: 2,
        runes: ['tal', 'eth'],
        isWhiteBase: false
      })
    ).toBeUndefined();
  });

  it('rejects wrong rune order', () => {
    expect(
      matchRuneword({
        baseType: 'armor',
        sockets: 2,
        runes: ['eth', 'tal'],
        isWhiteBase: true
      })
    ).toBeUndefined();
  });

  it('rejects wrong socket count or base type', () => {
    expect(
      matchRuneword({
        baseType: 'weapon',
        sockets: 2,
        runes: ['tal', 'eth'],
        isWhiteBase: true
      })
    ).toBeUndefined();
    expect(
      matchRuneword({
        baseType: 'armor',
        sockets: 3,
        runes: ['tal', 'eth'],
        isWhiteBase: true
      })
    ).toBeUndefined();
  });

  it('returns undefined when recipe pool is empty', () => {
    expect(
      matchRuneword(
        {
          baseType: 'armor',
          sockets: 2,
          runes: ['tal', 'eth'],
          isWhiteBase: true
        },
        []
      )
    ).toBeUndefined();
  });

  it('exposes builtin pool with at least the 3 minimum recipes', () => {
    const ids = BUILTIN_RUNEWORDS.map((r) => r.id);
    expect(ids).toContain('rw_stealth');
    expect(ids).toContain('rw_spirit');
    expect(ids).toContain('rw_enigma');
  });
});
