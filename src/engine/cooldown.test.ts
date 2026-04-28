/**
 * Tests for cooldown tracker
 */

import { describe, it, expect } from 'vitest';
import {
  createCooldownTracker,
  startCooldown,
  tickCooldowns,
  isReady,
  getRemaining,
  resetCooldowns,
  resetCooldown
} from './cooldown';

describe('cooldown', () => {
  describe('createCooldownTracker', () => {
    it('creates an empty tracker', () => {
      const tracker = createCooldownTracker();
      expect(tracker.cooldowns).toHaveLength(0);
    });
  });

  describe('startCooldown', () => {
    it('starts a cooldown for a skill', () => {
      const tracker = createCooldownTracker();
      const updated = startCooldown(tracker, 'fireball', 3);
      
      expect(updated.cooldowns).toHaveLength(1);
      expect(updated.cooldowns[0]).toEqual({
        skillId: 'fireball',
        remaining: 3,
        total: 3
      });
    });

    it('replaces existing cooldown for the same skill', () => {
      let tracker = createCooldownTracker();
      tracker = startCooldown(tracker, 'fireball', 3);
      tracker = startCooldown(tracker, 'fireball', 5);
      
      expect(tracker.cooldowns).toHaveLength(1);
      expect(tracker.cooldowns[0]?.remaining).toBe(5);
    });

    it('does not add cooldown for duration <= 0', () => {
      const tracker = createCooldownTracker();
      const updated = startCooldown(tracker, 'instant', 0);
      
      expect(updated.cooldowns).toHaveLength(0);
    });

    it('tracks multiple skill cooldowns', () => {
      let tracker = createCooldownTracker();
      tracker = startCooldown(tracker, 'fireball', 3);
      tracker = startCooldown(tracker, 'ice-blast', 2);
      
      expect(tracker.cooldowns).toHaveLength(2);
    });
  });

  describe('tickCooldowns', () => {
    it('decrements all cooldowns by 1', () => {
      let tracker = createCooldownTracker();
      tracker = startCooldown(tracker, 'fireball', 3);
      tracker = startCooldown(tracker, 'ice-blast', 2);
      
      const ticked = tickCooldowns(tracker);
      
      expect(ticked.cooldowns).toHaveLength(2);
      expect(ticked.cooldowns.find((cd) => cd.skillId === 'fireball')?.remaining).toBe(2);
      expect(ticked.cooldowns.find((cd) => cd.skillId === 'ice-blast')?.remaining).toBe(1);
    });

    it('removes cooldowns that reach 0', () => {
      let tracker = createCooldownTracker();
      tracker = startCooldown(tracker, 'fireball', 1);
      tracker = startCooldown(tracker, 'ice-blast', 2);
      
      const ticked = tickCooldowns(tracker);
      
      expect(ticked.cooldowns).toHaveLength(1);
      expect(ticked.cooldowns[0]?.skillId).toBe('ice-blast');
    });

    it('handles empty tracker', () => {
      const tracker = createCooldownTracker();
      const ticked = tickCooldowns(tracker);
      
      expect(ticked.cooldowns).toHaveLength(0);
    });
  });

  describe('isReady', () => {
    it('returns true if skill is not on cooldown', () => {
      const tracker = createCooldownTracker();
      expect(isReady(tracker, 'fireball')).toBe(true);
    });

    it('returns false if skill is on cooldown', () => {
      let tracker = createCooldownTracker();
      tracker = startCooldown(tracker, 'fireball', 3);
      
      expect(isReady(tracker, 'fireball')).toBe(false);
    });

    it('returns true after cooldown expires', () => {
      let tracker = createCooldownTracker();
      tracker = startCooldown(tracker, 'fireball', 1);
      tracker = tickCooldowns(tracker);
      
      expect(isReady(tracker, 'fireball')).toBe(true);
    });
  });

  describe('getRemaining', () => {
    it('returns 0 if skill is not on cooldown', () => {
      const tracker = createCooldownTracker();
      expect(getRemaining(tracker, 'fireball')).toBe(0);
    });

    it('returns remaining turns if skill is on cooldown', () => {
      let tracker = createCooldownTracker();
      tracker = startCooldown(tracker, 'fireball', 5);
      
      expect(getRemaining(tracker, 'fireball')).toBe(5);
    });

    it('updates after ticking', () => {
      let tracker = createCooldownTracker();
      tracker = startCooldown(tracker, 'fireball', 3);
      tracker = tickCooldowns(tracker);
      
      expect(getRemaining(tracker, 'fireball')).toBe(2);
    });
  });

  describe('resetCooldowns', () => {
    it('clears all cooldowns', () => {
      const reset = resetCooldowns();
      
      expect(reset.cooldowns).toHaveLength(0);
    });
  });

  describe('resetCooldown', () => {
    it('clears a specific cooldown', () => {
      let tracker = createCooldownTracker();
      tracker = startCooldown(tracker, 'fireball', 3);
      tracker = startCooldown(tracker, 'ice-blast', 2);
      
      const reset = resetCooldown(tracker, 'fireball');
      
      expect(reset.cooldowns).toHaveLength(1);
      expect(reset.cooldowns[0]?.skillId).toBe('ice-blast');
    });

    it('is idempotent if skill is not on cooldown', () => {
      const tracker = createCooldownTracker();
      const reset = resetCooldown(tracker, 'fireball');
      
      expect(reset.cooldowns).toHaveLength(0);
    });
  });
});
