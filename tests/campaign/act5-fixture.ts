/** Disclosed constructed encounter publications; native actions, never earned campaign wins. */
import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { useMapStore } from '@/stores/mapStore';
import { campaignState } from './campaign-state';
import { constructActFourPrefix, constructedQuestGraph } from './act4-fixture';
import { runActFour } from './act4-route';

export const constructedActFiveQuestGraph = () => ({ ...constructedQuestGraph(),
  campaign: campaignState(useMapStore.getState()) });

/** Keep all actual preceding action services; only combat proofs are constructed. */
export function constructActFivePrefix(...args: Parameters<typeof constructActFourPrefix>) {
  const f = constructActFourPrefix(...args);
  runActFour(f.profile, f.record, area => { f.enter(4, area); }, f.actions);
  const act4Entries = f.actions.entries.slice(f.act4Start), act5Start = f.actions.entries.length;
  assert.equal(act5Start, 45);
  return { ...f, act4Entries, act5Start };
}

/** Publish only native-shaped proof points, with mandatory guard waves leaving the graph alone. */
export function publishConstructedActFiveWave(index: number) {
  assert.ok(Number.isInteger(index) && index >= 0 && index < 8);
  const id = 'quests/act5-eve-of-destruction', map = useMapStore.getState();
  map.setCurrentLocation(5, 'a5-throne-of-destruction');
  if (index !== 4 && index !== 7) return;
  const row = useMapStore.getState().questProgress[id]; assert.ok(row);
  map.updateQuestProgress(id, { ...row, status: index === 7 ? 'completed' : 'inProgress',
    objectives: { 'obj-throne-waves': true, 'obj-kill-baal': index === 7 } });
  const proof = `${id}#action:${index === 7 ? 'baal-victory' : 'throne-waves-victory'}`;
  useMapStore.setState({ questReceipts: { ...useMapStore.getState().questReceipts, [proof]: true } });
  if (index === 7) map.markCleared('areas/act5-throne-of-destruction');
}

/** Constructed observer evidence keeps both proof transitions in the same admission. */
export function settleConstructedActFiveWave(f: ReturnType<typeof constructActFivePrefix>, index: number) {
  const before = constructedActFiveQuestGraph(); publishConstructedActFiveWave(index);
  const after = constructedActFiveQuestGraph();
  if (!isDeepStrictEqual(before, after)) {
    const ordinal = Math.max(...f.settlements.filter(row => row.act !== 5).map(row => row.ordinal)) + 1;
    f.settlements.push({ act: 5, area: 'areas/act5-throne-of-destruction', ordinal, index,
      actionIndex: f.actions.entries.length, nativeReturned: true, winner: 'player', heroLife: 1,
      advance: index === 7 ? 'victory' : 'next-wave', before, after });
  }
}
