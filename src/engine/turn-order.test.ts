/**
 * Tests for turn order calculation
 */

import { describe, it, expect } from 'vitest';
import { createRng } from './rng';
import {
  calculateTurnOrder,
  getNextActorIndex,
  isNewTurn,
  recalculateTurnOrder
} from './turn-order';

describe('turn-order', () => {
  describe('calculateTurnOrder', () => {
    it('orders units by attack speed descending', () => {
      const units = [
        { id: 'slow', attackSpeed: 10 },
        { id: 'fast', attackSpeed: 30 },
        { id: 'medium', attackSpeed: 20 }
      ];
      const rng = createRng(12345);
      
      const order = calculateTurnOrder(units, rng);
      
      expect(order).toEqual(['fast', 'medium', 'slow']);
    });

    it('uses deterministic tie-breaking for same speed', () => {
      const units = [
        { id: 'unit-a', attackSpeed: 20 },
        { id: 'unit-b', attackSpeed: 20 },
        { id: 'unit-c', attackSpeed: 20 }
      ];
      const rng1 = createRng(12345);
      const rng2 = createRng(12345);
      
      const order1 = calculateTurnOrder(units, rng1);
      const order2 = calculateTurnOrder(units, rng2);
      
      // Same seed = same order
      expect(order1).toEqual(order2);
      
      // All units present
      expect(order1).toHaveLength(3);
      expect(order1).toContain('unit-a');
      expect(order1).toContain('unit-b');
      expect(order1).toContain('unit-c');
    });

    it('produces different tie-breaks with different seeds', () => {
      const units = [
        { id: 'unit-a', attackSpeed: 20 },
        { id: 'unit-b', attackSpeed: 20 }
      ];
      const rng1 = createRng(111);
      const rng2 = createRng(222);
      
      const order1 = calculateTurnOrder(units, rng1);
      const order2 = calculateTurnOrder(units, rng2);
      
      // Different seeds likely produce different orders
      // (not guaranteed, but very likely)
      expect(order1).not.toEqual(order2);
    });

    it('handles empty unit list', () => {
      const rng = createRng(12345);
      const order = calculateTurnOrder([], rng);
      
      expect(order).toEqual([]);
    });

    it('handles single unit', () => {
      const units = [{ id: 'solo', attackSpeed: 15 }];
      const rng = createRng(12345);
      
      const order = calculateTurnOrder(units, rng);
      
      expect(order).toEqual(['solo']);
    });

    it('does not mutate input', () => {
      const units = [
        { id: 'unit-a', attackSpeed: 10 },
        { id: 'unit-b', attackSpeed: 20 }
      ];
      const originalUnits = [...units];
      const rng = createRng(12345);
      
      calculateTurnOrder(units, rng);
      
      expect(units).toEqual(originalUnits);
    });
  });

  describe('getNextActorIndex', () => {
    it('advances to next index', () => {
      expect(getNextActorIndex(0, 5)).toBe(1);
      expect(getNextActorIndex(2, 5)).toBe(3);
    });

    it('wraps around at the end', () => {
      expect(getNextActorIndex(4, 5)).toBe(0);
    });

    it('handles length 1', () => {
      expect(getNextActorIndex(0, 1)).toBe(0);
    });

    it('handles length 0', () => {
      expect(getNextActorIndex(0, 0)).toBe(0);
    });
  });

  describe('isNewTurn', () => {
    it('returns true when wrapping around', () => {
      expect(isNewTurn(4, 0)).toBe(true);
    });

    it('returns false when advancing normally', () => {
      expect(isNewTurn(0, 1)).toBe(false);
      expect(isNewTurn(2, 3)).toBe(false);
    });

    it('returns true when starting from -1', () => {
      expect(isNewTurn(-1, 0)).toBe(true);
    });

    it('returns false when both indices are the same', () => {
      expect(isNewTurn(2, 2)).toBe(false);
    });
  });

  describe('recalculateTurnOrder', () => {
    it('recalculates turn order and finds current actor', () => {
      const units = [
        { id: 'unit-a', attackSpeed: 10 },
        { id: 'unit-b', attackSpeed: 30 },
        { id: 'unit-c', attackSpeed: 20 }
      ];
      const rng = createRng(12345);
      
      const result = recalculateTurnOrder('unit-b', units, rng);
      
      expect(result.turnOrder).toEqual(['unit-b', 'unit-c', 'unit-a']);
      expect(result.currentActorIndex).toBe(0); // unit-b is now first
    });

    it('starts from 0 if current actor died', () => {
      const units = [
        { id: 'unit-b', attackSpeed: 30 },
        { id: 'unit-c', attackSpeed: 20 }
      ];
      const rng = createRng(12345);
      
      const result = recalculateTurnOrder('unit-a', units, rng);
      
      expect(result.turnOrder).toEqual(['unit-b', 'unit-c']);
      expect(result.currentActorIndex).toBe(0);
    });

    it('handles no current actor', () => {
      const units = [
        { id: 'unit-a', attackSpeed: 10 },
        { id: 'unit-b', attackSpeed: 20 }
      ];
      const rng = createRng(12345);
      
      const result = recalculateTurnOrder(undefined, units, rng);
      
      expect(result.turnOrder).toEqual(['unit-b', 'unit-a']);
      expect(result.currentActorIndex).toBe(0);
    });

    it('handles empty unit list', () => {
      const rng = createRng(12345);
      
      const result = recalculateTurnOrder(undefined, [], rng);
      
      expect(result.turnOrder).toEqual([]);
      expect(result.currentActorIndex).toBe(0);
    });
  });
});
