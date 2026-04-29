/**
 * Quest reward claim — Bug #9.
 *
 * `claimQuestReward(questId)` reads the matching quest's `rewards` object
 * from the loaded JSON and dispatches each reward kind into the right
 * frontend store. It refuses to run when the quest is not in the
 * `completed` state or has already been claimed; the UI button must
 * render disabled in those cases too.
 *
 * Reward keys handled:
 *   - `xp` (number)             → `usePlayerStore.gainExperience`
 *   - `gold` (number)           → `useInventoryStore.addCurrency('gold', n)`
 *   - `skillPoints` (number)    → bumps `player.skillPoints`
 *   - `statPoints` (number)     → bumps `player.statPoints`
 *   - `runes`/`runeShards`/`gems`/`wishstones` (number) → currency add
 *   - any other key            → ignored (cosmetic / future)
 *
 * On a successful XP grant, the active-party merc shares XP per
 * {@link MERC_XP_SHARE} (Bug #12).
 */
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { loadQuests, type QuestDef } from '@/data/loaders/quests';

export type ClaimResult =
  | 'ok'
  | 'unknown-quest'
  | 'not-completed'
  | 'already-claimed'
  | 'no-rewards';

function findQuest(questId: string): QuestDef | undefined {
  return loadQuests().find((q) => q.id === questId);
}

export function canClaim(questId: string): boolean {
  const progress = useMapStore.getState().questProgress[questId];
  if (!progress) return false;
  if (progress.status !== 'completed') return false;
  if (progress.rewardClaimed) return false;
  const quest = findQuest(questId);
  return Boolean(quest?.rewards && Object.keys(quest.rewards).length > 0);
}

export function claimQuestReward(questId: string): ClaimResult {
  const map = useMapStore.getState();
  const progress = map.questProgress[questId];
  if (!progress || progress.status !== 'completed') return 'not-completed';
  if (progress.rewardClaimed) return 'already-claimed';
  const quest = findQuest(questId);
  if (!quest) return 'unknown-quest';
  const rewards = quest.rewards;
  if (!rewards || Object.keys(rewards).length === 0) return 'no-rewards';

  const player = usePlayerStore.getState().player;

  for (const [k, raw] of Object.entries(rewards)) {
    if (k === 'xp' && typeof raw === 'number' && raw > 0) {
      const gained = usePlayerStore.getState().gainExperience(raw);
      // Bug #12 — share with active merc.
      useMercStore.getState().shareExperienceWithFielded(raw);
      void gained;
    } else if (k === 'gold' && typeof raw === 'number' && raw > 0) {
      useInventoryStore.getState().addCurrency('gold', raw);
    } else if (k === 'skillPoints' && typeof raw === 'number' && raw > 0 && player) {
      usePlayerStore.setState((s) =>
        s.player ? { player: { ...s.player, skillPoints: s.player.skillPoints + raw } } : s
      );
    } else if (k === 'statPoints' && typeof raw === 'number' && raw > 0 && player) {
      usePlayerStore.setState((s) =>
        s.player ? { player: { ...s.player, statPoints: s.player.statPoints + raw } } : s
      );
    } else if (
      (k === 'runes' || k === 'runeShards' || k === 'gems' || k === 'wishstones') &&
      typeof raw === 'number' &&
      raw > 0
    ) {
      useInventoryStore.getState().addCurrency(k, raw);
    }
    // Other keys (mercenaryUnlock / itemDrop / lootTable / npcUnlock / ...)
    // are content-defined and not auto-granted yet.
    // TODO(content-designer): wire mercenaryUnlock and itemDrop once the
    // engine exposes lookup helpers.
  }

  useMapStore.getState().markQuestRewardClaimed(questId);
  return 'ok';
}
