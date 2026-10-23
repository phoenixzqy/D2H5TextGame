import { isReplacingSave, resumeWaveDeferredSave, useHydrationStore } from '@/stores/persistence';
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
import { useInventoryStore, useMapStore, useMetaStore, usePlayerStore, useMercStore } from '@/stores';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { eliteConfig, monsters as monsterList } from '@/data/index';
import { loadAwardPools } from '@/data/loaders/loot';
import { rollKillRewards } from '@/engine/loot/award';
import { mergeRewards, planRewardGrant, type RewardDestination } from '@/engine/loot/reward-plan';
import { MaterialRewardError } from '@/engine/loot/materials';
import { createRng, hashSeed } from '@/engine/rng';
import { awardXp, LEVEL_CAP, xpForKill, xpTotal } from '@/engine/progression/xp';
import { deriveMonsterNameKey } from '@/stores/combatHelpers';
import { getIdleEliteMisses, resetIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import i18n from '@/i18n';
import { beginWaveTransition, endWaveTransition } from '@/stores/waveTransitionGuard';
import { assertRecordedWaveNewTransitionAllowed } from '@/stores/recordedWaveAccess';

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
    if (isReplacingSave()) return;
    assertRecordedWaveNewTransitionAllowed();
    const lease = beginWaveTransition(useHydrationStore.getState().status === 'ready');
    try {
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

      const loot = arch ? rollKillRewards(
          {
            tier: encounter?.monsterTier ?? 'trash',
            monsterLevel: encounter?.monsterLevel ?? subArea?.areaLevel ?? player.level,
            treasureClassId: encounter?.treasureClassId ?? subArea?.lootTable ?? `loot/trash-act${String(act)}`,
            magicFind: reward.effectiveMagicFind,
            goldFind: player.derivedStats.goldFind,
            act,
            difficulty: map.selectedDifficulty
          },
          loadAwardPools(),
          createRng(hashSeed(`idle|${player.id}|${String(tickCount)}|${subArea?.id ?? map.currentSubAreaId ?? 'unknown'}`))
        ) : mergeRewards();
      const bag = mergeRewards(loot, { ...mergeRewards(), runeShards: reward.runeShards });
      const safe = (count: number): number => {
        if (!Number.isSafeInteger(count) || count < 0) throw new MaterialRewardError('Unsafe idle reward arithmetic');
        return count;
      };
      if (!Number.isSafeInteger(player.level) || player.level < 1 || player.level > LEVEL_CAP) {
        throw new MaterialRewardError('Invalid idle player level');
      }
      const xp = safe(safe(xpTotal(player.level) + safe(player.experience)) + safe(reward.xp));
      const growth = awardXp(xp - reward.xp, reward.xp);
      safe(safe(player.skillPoints) + growth.skillPointsGranted);
      safe(safe(player.statPoints) + growth.statPointsGranted);
      const prepareInventory = (destination: Omit<RewardDestination, 'mercEquipment'>) => {
        const currencies = { ...destination.currencies };
        for (const [id, amount] of Object.entries(reward.currencies)) {
          safe(amount);
          if (amount === 0) continue;
          const previous = Object.hasOwn(currencies, id) ? currencies[id] ?? 0 : 0;
          Object.defineProperty(currencies, id, { value: safe(safe(previous) + amount),
            enumerable: true, configurable: true, writable: true });
        }
        return planRewardGrant(bag, { ...destination, currencies, mercEquipment: useMercStore.getState().mercEquipment });
      };
      prepareInventory(inventory);

      // Lookup display name through monsters i18n namespace.
      const lastKillNameKey = arch ? `monsters:${deriveMonsterNameKey(arch)}` : null;
      const lastKillName = lastKillNameKey
        ? (i18n.exists(lastKillNameKey) ? i18n.t(lastKillNameKey) : arch?.name ?? lastKillNameKey)
        : null;

      void meta; // placeholder: future hook into metaStore.idleState

      const tickBefore = get();
      safe(tickCount + 1);
      try {
        if (reward.xp > 0) playerStore.gainExperience(reward.xp);
        // Rebase the already preflighted bag on any supported synchronous observer writes.
        useInventoryStore.setState(current => prepareInventory(current));
        if (encounter) setIdleEliteMisses(encounter.nextEliteMisses);
        set({ lastReward: reward, lastKillName,
          lastEncounterKind: encounter?.feedback.kind ?? 'kill', bonus,
          tickCount: tickCount + 1, eliteMisses: encounter?.nextEliteMisses ?? eliteMisses });
      } catch (cause) {
        const errors: unknown[] = [];
        const restore = (operation: () => void) => { try { operation(); } catch (error) { errors.push(error); } };
        restore(() => { usePlayerStore.setState({ player }); });
        restore(() => { useInventoryStore.setState({ backpack: inventory.backpack,
          currencies: inventory.currencies, materials: inventory.materials }); });
        restore(() => { setIdleEliteMisses(eliteMisses); });
        restore(() => { set(tickBefore); });
        if (errors.length) throw new AggregateError(errors, 'Idle reward restoration failed', { cause });
        throw cause;
      }
    } finally {
      if (endWaveTransition(lease)) resumeWaveDeferredSave();
    }
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
