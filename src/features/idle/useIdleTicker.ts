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
import { useInventoryStore, useMapStore, useMetaStore, usePlayerStore } from '@/stores';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { monsters as monsterList } from '@/data/index';
import { loadAwardPools } from '@/data/loaders/loot';
import { rollKillRewards } from '@/engine/loot/award';
import { createRng, hashSeed } from '@/engine/rng';
import { deriveMonsterNameKey } from '@/stores/combatHelpers';
import i18n from '@/i18n';

/** Default seconds-per-tick (matches engine default). */
export const DEFAULT_TICK_SECONDS = 6;

type ActNumber = 1 | 2 | 3 | 4 | 5;

function clampAct(act: number): ActNumber {
  return Math.min(5, Math.max(1, Math.trunc(act))) as ActNumber;
}

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
    const playerStore = usePlayerStore.getState();
    const player = playerStore.player;
    const map = useMapStore.getState();
    const inventory = useInventoryStore.getState();
    const meta = useMetaStore.getState();
    if (!player) return;

    // Raw reward shape: lift the engine's xpForKill curve indirectly
    // via baseExperience on the area's first archetype, multiplied by
    // a "1 kill per tick" approximation so the strip shows movement.
    const act = clampAct(map.currentAct);
    const subArea = resolveSubArea(act, map.currentSubAreaId);
    const archetypePrefix = `monsters/act${String(act)}.`;
    const archetypes = monsterList.filter((m) => m.id.startsWith(archetypePrefix));
    const tickCount = get().tickCount;
    const arch = archetypes[tickCount % Math.max(1, archetypes.length)] ?? archetypes[0];
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

    if (reward.xp > 0) playerStore.gainExperience(reward.xp);
    if (reward.runeShards > 0) inventory.addCurrency('rune-shard', reward.runeShards);
    for (const [currencyId, amount] of Object.entries(reward.currencies)) {
      if (amount > 0) inventory.addCurrency(currencyId, amount);
    }

    if (arch) {
      const loot = rollKillRewards(
        {
          tier: 'trash',
          monsterLevel: subArea?.areaLevel ?? player.level,
          treasureClassId: subArea?.lootTable ?? `loot/trash-act${String(act)}`,
          magicFind: reward.effectiveMagicFind,
          goldFind: player.derivedStats.goldFind,
          act,
          difficulty: 'normal'
        },
        loadAwardPools(),
        createRng(hashSeed(`idle|${player.id}|${String(tickCount)}|${subArea?.id ?? map.currentSubAreaId ?? 'unknown'}`))
      );
      for (const item of loot.items) inventory.addItem(item);
      const totalRuneShards = loot.runeShards + loot.runes;
      if (totalRuneShards > 0) inventory.addCurrency('rune-shard', totalRuneShards);
      if (loot.gems > 0) inventory.addCurrency('gem-shard', loot.gems);
      if (loot.wishstones > 0) inventory.addCurrency('wishstone', loot.wishstones);
    }

    // Lookup display name through monsters i18n namespace.
    const lastKillNameKey = arch ? `monsters:${deriveMonsterNameKey(arch)}` : null;
    const lastKillName = lastKillNameKey
      ? (i18n.exists(lastKillNameKey) ? i18n.t(lastKillNameKey) : arch?.name ?? lastKillNameKey)
      : null;

    void meta; // placeholder: future hook into metaStore.idleState

    set({
      lastReward: reward,
      lastKillName,
      bonus,
      tickCount: tickCount + 1
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
