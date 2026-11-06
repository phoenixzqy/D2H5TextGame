import { loadQuests } from '@/data/loaders/quests';
import { findRegionalBounty } from '@/engine/map/regional-bounties';
import { useMapStore } from '@/stores/mapStore';
import { questActionPreflight, withQuestTransaction } from './questTransaction';

/** Ordinary activation outcome; transient wave/restore ownership errors retain their typed exceptions. */
export type StartQuestResult = 'ok' | 'unknown-quest' | 'not-eligible' | 'grant-failed' |
  'not-ready' | 'no-player' | 'combat-active' | 'claim-in-progress';

/** Start an ordinary journal quest from live state, under the shared quest lease. */
export function startQuest(questId: string): StartQuestResult {
  const refusal = questActionPreflight();
  if (refusal) return refusal;
  return withQuestTransaction(() => {
    const quest = loadQuests().find(row => row.id === questId);
    if (!quest) return 'unknown-quest';
    // Regional bounties have their own bounded, source-backed admission action.
    if (findRegionalBounty(questId)) return 'not-eligible';
    const before = useMapStore.getState().questProgress;
    const previous = Object.hasOwn(before, questId) ? before[questId] : undefined;
    if ((previous !== undefined && (previous.id !== questId || previous.status !== 'available' || previous.rewardClaimed === true)) ||
      (quest.prerequisites ?? []).some(id => !Object.hasOwn(before, id) || before[id]?.status !== 'completed')) return 'not-eligible';
    try {
      useMapStore.setState(state => ({ questProgress: { ...state.questProgress, [questId]: {
        ...previous, id: questId, status: 'inProgress',
        objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, false]))
      } } }));
      return 'ok';
    } catch (cause) {
      try {
        useMapStore.setState(state => {
          const restored = { ...state.questProgress };
          if (previous) restored[questId] = previous;
          else Reflect.deleteProperty(restored, questId);
          return { questProgress: restored };
        });
      } catch (error) {
        throw new AggregateError([error], 'Quest start restoration failed', { cause });
      }
      return 'grant-failed';
    }
  });
}
