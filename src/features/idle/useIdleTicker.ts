/**
 * useIdleTicker — drives a periodic UI tick that consumes the engine's
 * pure {@link onlineTick} helper (Bug #19). The engine is intentionally
 * timer-free, so the React layer is responsible for setInterval; we
 * keep the engine output in store-shaped state via a small zustand
 * slice.
 *
 * @module features/idle/useIdleTicker
 */

import { useEffect } from 'react';
import { create } from 'zustand';
import {
  EMPTY_REWARD,
  NO_BONUS,
  onlineTick,
  type IdleBonus,
  type TickReward
} from '@/engine/idle';
import { useMapStore, useMetaStore, usePlayerStore } from '@/stores';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { monsters as monsterList } from '@/data/index';
import { deriveMonsterNameKey } from '@/stores/combatHelpers';
import i18n from '@/i18n';

/** Default seconds-per-tick (matches engine default). */
export const DEFAULT_TICK_SECONDS = 6;

interface IdleTickerState {
  readonly tickSeconds: number;
  readonly lastReward: TickReward;
  readonly lastKillName: string | null;
  readonly bonus: IdleBonus;
  readonly tickCount: number;
  /** Engine entry point — pure call, no side effects on engine. */
  applyTick: () => void;
  reset: () => void;
}

const initial: Pick<
  IdleTickerState,
  'tickSeconds' | 'lastReward' | 'lastKillName' | 'bonus' | 'tickCount'
> = {
  tickSeconds: DEFAULT_TICK_SECONDS,
  lastReward: EMPTY_REWARD,
  lastKillName: null,
  bonus: NO_BONUS,
  tickCount: 0
};

export const useIdleTickerStore = create<IdleTickerState>((set, get) => ({
  ...initial,

  applyTick: () => {
    const player = usePlayerStore.getState().player;
    const map = useMapStore.getState();
    const meta = useMetaStore.getState();
    if (!player) return;

    // Raw reward shape: lift the engine's xpForKill curve indirectly
    // via baseExperience on the area's first archetype, multiplied by
    // a "1 kill per tick" approximation so the strip shows movement.
    const subArea = resolveSubArea(map.currentAct, map.currentSubAreaId);
    const archetypePrefix = `monsters/act${String(map.currentAct)}.`;
    const archetypes = monsterList.filter((m) => m.id.startsWith(archetypePrefix));
    const arch = archetypes[get().tickCount % Math.max(1, archetypes.length)] ?? archetypes[0];
    const baseXp = arch?.baseExperience ?? 5;
    const raw: TickReward = {
      xp: baseXp,
      runeShards: 1,
      effectiveMagicFind: player.derivedStats.magicFind,
      currencies: {}
    };

    const { reward, bonus } = onlineTick(raw, get().bonus, {
      tickSeconds: get().tickSeconds,
      baseMagicFind: player.derivedStats.magicFind
    });

    // Lookup display name through monsters i18n namespace.
    const lastKillName = arch
      ? i18n.t(`monsters:${deriveMonsterNameKey(arch)}`, {
          defaultValue: arch.name
        })
      : null;

    void meta; // placeholder: future hook into metaStore.idleState
    void subArea;

    set({
      lastReward: reward,
      lastKillName,
      bonus,
      tickCount: get().tickCount + 1
    });
  },

  reset: () => { set({ ...initial }); }
}));

/**
 * React hook that wires the engine tick to a `setInterval`. Keep one
 * mount per app — additional mounts no-op via the same store, but
 * burn unnecessary timers.
 */
export function useIdleTicker(tickSeconds: number = DEFAULT_TICK_SECONDS): void {
  const applyTick = useIdleTickerStore((s) => s.applyTick);
  useEffect(() => {
    const id = window.setInterval(() => { applyTick(); }, tickSeconds * 1000);
    return () => { window.clearInterval(id); };
  }, [applyTick, tickSeconds]);
}
