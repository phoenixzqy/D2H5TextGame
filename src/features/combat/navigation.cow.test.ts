import { expect, it } from 'vitest';
import { readCombatRequest } from './navigation';

it('routes only the exact Cow request while preserving Countess and ordinary routes', () => {
  expect(readCombatRequest('?questEncounter=act1-dw-cow-king')).toEqual({ kind: 'cow' });
  expect(readCombatRequest('?questEncounter=act1-dw-countess')).toEqual({ kind: 'countess' });
  expect(readCombatRequest('')).toEqual({ kind: 'none' });
});

it.each([
  '?questEncounter=',
  '?questEncounter=act1-dw-cow-king-forged',
  '?questEncounter=act1-dw-cow-king&questEncounter=act1-dw-cow-king',
  '?questEncounter=act1-dw-cow-king&questEncounter=act1-dw-countess',
  '?questEncounter=act1-dw-cow-king&endgame=',
  '?questEncounter=act1-dw-cow-king&endgame=forged'
])('refuses malformed or mixed explicit source %s without ordinary fallback', search => {
  expect(readCombatRequest(search)).toEqual({ kind: 'invalid', target: 'questEncounter' });
});
