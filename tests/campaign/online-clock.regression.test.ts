/** Constructed transport arithmetic; native seed generation is also checked in earned journals. */
import { afterEach, expect, it } from 'vitest';
import { useMetaStore } from '@/stores/metaStore';
import { hashSeed } from '@/engine/rng';
import { installCampaignOnlineClock } from './online-clock';

const originalNow = Date.now, originalMeta = useMetaStore.getState();
afterEach(() => { Date.now = originalNow; useMetaStore.setState(originalMeta); });

it('advances later admission time by consumed combat and preserves an empty bonus', () => {
  const start = 1793304000000;
  useMetaStore.getState().updateIdleState({ lastOnline: start, offlineTime: 0,
    activeMultiplier: 1, multiplierSecondsRemaining: 0 });
  const clock = installCampaignOnlineClock(start);
  const first = hashSeed(`areas/act4-plains-of-despair|${String(Date.now())}`);
  clock.advance(32000); clock.advance(10498.071625344352);
  expect(Date.now()).toBe(start + 42499);
  expect(hashSeed(`areas/act4-plains-of-despair|${String(Date.now())}`)).not.toBe(first);
  expect(useMetaStore.getState().idleState).toEqual({ lastOnline: start + 42499,
    offlineTime: 0, activeMultiplier: 1, multiplierSecondsRemaining: 0 });
  clock.dispose(); expect(Date.now).toBe(originalNow);
});

it('consumes the native online bonus without creating an offline return window', () => {
  const start = 1793304000000;
  useMetaStore.getState().updateIdleState({ lastOnline: start, offlineTime: 600,
    activeMultiplier: 1.5, multiplierSecondsRemaining: 6 });
  const expected = useMetaStore.getState().readIdleBonus(start + 2000);
  const clock = installCampaignOnlineClock(start); clock.advance(2000);
  expect(useMetaStore.getState().idleState).toEqual(expected);
  clock.advance(10000);
  expect(useMetaStore.getState().idleState).toEqual({ lastOnline: start + 12000,
    offlineTime: 600, activeMultiplier: 1, multiplierSecondsRemaining: 0 });
  clock.dispose();
});

it('refuses invalid time atomically and leaves an unplayed wave at zero elapsed time', () => {
  const clock = installCampaignOnlineClock(1793304000000), before = useMetaStore.getState();
  for (const elapsed of [-1, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
    expect(() => clock.advance(elapsed)).toThrow(RangeError);
    expect(clock.now()).toBe(1793304000000);
    expect(useMetaStore.getState()).toBe(before);
  }
  clock.advance(0); expect(clock.now()).toBe(1793304000000); clock.dispose();
});
