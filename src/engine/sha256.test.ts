import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { sha256 } from './sha256';

describe('portable synchronous SHA256 request identity', () => {
  it.each([
    ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    ['abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq', '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1']
  ])('matches published vector %j', (source, hash) => {
    expect(sha256(source)).toBe(hash);
  });
  it.each(['a'.repeat(55), 'a'.repeat(56), 'a'.repeat(63), 'a'.repeat(64), 'a'.repeat(65),
    '符文🔥\u0000\ud800', 'boundary'.repeat(1024)])('matches independent UTF8 and block-boundary reference %#', source => {
    expect(sha256(source)).toBe(createHash('sha256').update(source, 'utf8').digest('hex'));
  });
});
