import { vi } from 'vitest';
import * as staging from '@/stores/recordedWaveStaging';
import { usePlayerStore } from '@/stores/playerStore';

/**
 * Explicit depleted-resource scenarios for skill/receipt/playback integration
 * tests. Production challenge entry starts full (BUG088); these fixtures instead
 * exercise affordability and recovery from the pools authored in their setup.
 * Feed the override through real staging so simulation, frozen receipt, initial
 * publication and replay share the same input. Later waves remain untouched.
 * Install per test, restore with vi.restoreAllMocks; never use for entry tests
 * or evidence of an earned campaign run.
 */
export function mockSyntheticEntryPools() {
  const stage = staging.stageRecordedWave;
  const baselines = new Map<string, { id: string; life: number; mana: number }>();
  return vi.spyOn(staging, 'stageRecordedWave').mockImplementation(input => {
    if (input.resetRunRewards) {
      const player = usePlayerStore.getState().player;
      if (player) baselines.set(input.subAreaRunId, { id: player.id,
        life: player.derivedStats.life, mana: player.derivedStats.mana });
    }
    const baseline = baselines.get(input.subAreaRunId);
    if (input.waveIdx !== 0 || !baseline) return stage(input);
    return stage({ ...input, snapshot: { ...input.snapshot,
      playerTeam: input.snapshot.playerTeam.map(unit => unit.id === baseline.id
        ? { ...unit, life: Math.max(0, Math.min(baseline.life, unit.stats.lifeMax)),
          mana: Math.max(0, Math.min(baseline.mana, unit.stats.manaMax)) }
        : unit) } });
  });
}
