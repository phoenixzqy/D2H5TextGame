import { expect, it } from 'vitest';
import { createRng } from '../rng';
import { rollCurrencyDrops } from './orbs-and-currency';

const cases = ([1,2,3,4,5] as const).flatMap(act =>
  (['normal','nightmare','hell'] as const).map(difficulty => ({ act, difficulty })));

it.each(cases)('keeps mini and chapter budgets distinct in Act $act $difficulty', ({ act, difficulty }) => {
  const rng = createRng(61), chapterRng = createRng(61);
  const multiplier = { normal: 1, nightmare: 1.2, hell: 1.5 }[difficulty];
  const mini = [6,7,8,9,10][act-1], chapter = [8,12,16,24,40][act-1];
  if (mini === undefined || chapter === undefined) throw new Error('Missing fixture');
  expect(rollCurrencyDrops(70, 'boss', act, difficulty, 0, rng).wishstones)
    .toBe(Math.floor(mini * multiplier));
  expect(rollCurrencyDrops(70, 'chapter-boss', act, difficulty, 0, chapterRng).wishstones)
    .toBe(Math.floor(chapter * multiplier));
  expect(rng.next()).toBe(chapterRng.next());
});
