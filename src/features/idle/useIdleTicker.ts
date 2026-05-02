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
  resolveIdleEncounter,
  type IdleBonus,
  type TickReward
} from '@/engine/idle';
import { useInventoryStore, useMapStore, useMetaStore, usePlayerStore } from '@/stores';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { eliteConfig, monsters as monsterList } from '@/data/index';
import { loadAwardPools } from '@/data/loaders/loot';
import { rollKillRewards } from '@/engine/loot/award';
import { createRng, hashSeed } from '@/engine/rng';
import { xpForKill } from '@/engine/progression/xp';
import { deriveMonsterNameKey } from '@/stores/combatHelpers';
import { getIdleEliteMisses, resetIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import i18n from '@/i18n';

/** Default seconds-per-tick (matches engine default). */
export const DEFAULT_TICK_SECONDS = 6;

type ActNumber = 1 | 2 | 3 | 4 | 5;

function clampAct(act: number): ActNumber {
  return Math.min(5, Math.max(1, Math.trunc(act))) as ActNumber;
}

function pickFallbackArchetypeId(act: ActNumber): string {
  const prefix = `monsters/act${String(act)}.`;
  return (monsterList.find((m) => m.id.startsWith(prefix)) ?? monsterList[0])?.id ?? 'monsters/act1.fallen';
}

interface IdleTickerState {
  readonly tickSeconds: number;
  readonly lastReward: TickReward;
  readonly lastKillName: string | null;
  readonly lastEncounterKind: 'kill' | 'elite-kill' | 'pity-elite-kill' | null;
  readonly bonus: IdleBonus;
  readonly tickCount: number;
  readonly eliteMisses: number;
  /** Engine entry point — pure call, no side effects on engine. */
  applyTick: () => void;
  reset: () => void;
}

const initial: Pick<
  IdleTickerState,
  'tickSeconds' | 'lastReward' | 'lastKillName' | 'lastEncounterKind' | 'bonus' | 'tickCount' | 'eliteMisses'
> = {
  tickSeconds: DEFAULT_TICK_SECONDS,
  lastReward: EMPTY_REWARD,
  lastKillName: null,
  lastEncounterKind: null,
  bonus: NO_BONUS,
  tickCount: 0,
  eliteMisses: 0
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
    const tickCount = get().tickCount;
    const fallbackArchetypeId = pickFallbackArchetypeId(act);
    const eliteMisses = getIdleEliteMisses();
    const encounter = subArea
      ? resolveIdleEncounter({
          subArea,
          act,
          tickIndex: tickCount,
          seed: hashSeed(player.id),
          playerLevel: player.level,
          eliteMisses,
          eliteConfig,
          fallbackArchetypeId
        })
      : null;
    const arch = monsterList.find((m) => m.id === encounter?.monsterArchetypeId) ??
      monsterList.find((m) => m.id === fallbackArchetypeId);
    const baseXp = encounter ? xpForKill(encounter.monsterLevel) : arch?.baseExperience ?? 5;
    const raw: TickReward = {
      xp: baseXp,
      runeShards: encounter?.monsterTier === 'rare-elite' ? 3 : encounter?.monsterTier === 'champion' ? 2 : 1,
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
          tier: encounter?.monsterTier ?? 'trash',
          monsterLevel: encounter?.monsterLevel ?? subArea?.areaLevel ?? player.level,
          treasureClassId: encounter?.treasureClassId ?? subArea?.lootTable ?? `loot/trash-act${String(act)}`,
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

    if (encounter) setIdleEliteMisses(encounter.nextEliteMisses);
    set({
      lastReward: reward,
      lastKillName,
      lastEncounterKind: encounter?.feedback.kind ?? 'kill',
      bonus,
      tickCount: tickCount + 1,
      eliteMisses: encounter?.nextEliteMisses ?? eliteMisses
    });
  },

  reset: () => {
    resetIdleEliteMisses();
    set({ ...initial });
  }
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
