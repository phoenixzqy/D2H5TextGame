import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { usePlayerStore } from './playerStore';
import { captureAnyaResistanceParticipant } from './anyaResistanceParticipant';

function actor() {
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('Missing test actor');
  return player;
}
beforeEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset();
  const player = createMockPlayer('Resistance participant', 'sorceress');
  usePlayerStore.setState({ player: { ...player, derivedStats: { ...player.derivedStats,
    life: 7, mana: 3, defense: 12345,
    resistances: { fire: 991, cold: 992, lightning: 993, poison: 994, arcane: 995, physical: 996 } } } });
});
afterEach(() => { usePlayerStore.getState().reset(); useInventoryStore.getState().reset(); useMapStore.getState().reset(); });
describe('Anya resistance-only participant', () => {
  it('publishes just resistances and restores the exact stale vector with damage and raw XP retained', () => {
    const before = structuredClone(actor()), participant = captureAnyaResistanceParticipant(actor());
    try {
      const expected = participant.plan({}, {}, {}); participant.publish(expected);
      expect(actor()).toEqual({ ...before, derivedStats: { ...before.derivedStats, resistances: expected } });
      usePlayerStore.getState().addXP(100000);
      usePlayerStore.setState(state => ({ player: state.player && { ...state.player,
        derivedStats: { ...state.player.derivedStats, life: 2, mana: 1 } } }));
      participant.restore(); participant.verifyRestored();
      expect(actor().experience).toBe(before.experience + 100000);
      expect(actor().derivedStats).toEqual({ ...before.derivedStats, life: 2, mana: 1 });
    } finally { participant.dispose(); }
  });
  it('preserves independent real XP recomposition and progression after failure', () => {
    const participant = captureAnyaResistanceParticipant(actor());
    try {
      participant.publish(participant.plan({}, {}, {}));
      usePlayerStore.getState().gainExperience(4500);
      const independent = structuredClone(actor());
      participant.restore(); participant.verifyRestored();
      expect(actor()).toEqual(independent);
      expect(actor().derivedStats.resistances.fire).toBe(0);
      expect(actor().derivedStats.life).toBe(7);
    } finally { participant.dispose(); }
  });
  it('observes nested recomposition even when an earlier listener receives the owned publication first', () => {
    let fired = false;
    const stop = usePlayerStore.subscribe(() => {
      if (fired) return; fired = true; usePlayerStore.getState().gainExperience(4500);
    });
    const participant = captureAnyaResistanceParticipant(actor());
    try {
      participant.publish(participant.plan({}, {}, {}));
      const independent = structuredClone(actor());
      participant.restore(); participant.verifyRestored();
      expect(actor()).toEqual(independent);
    } finally { stop(); participant.dispose(); }
  });
  it('never restores a removed or foreign replacement actor', () => {
    const participant = captureAnyaResistanceParticipant(actor());
    try {
      participant.publish(participant.plan({}, {}, {}));
      usePlayerStore.setState({ player: null }); participant.restore(); participant.verifyRestored();
      expect(usePlayerStore.getState().player).toBeNull();
      const foreign = createMockPlayer('Foreign actor', 'barbarian');
      usePlayerStore.setState({ player: foreign }); participant.restore(); participant.verifyRestored();
      expect(usePlayerStore.getState().player).toBe(foreign);
    } finally { participant.dispose(); }
  });
});
