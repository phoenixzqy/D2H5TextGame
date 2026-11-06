import assert from 'node:assert/strict';
import { useMapStore } from '@/stores/mapStore';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { startEarnedRun } from '../sim/production/earned-playback';

/** Use one actual act for access, canonical resolution, saved alias and native admission. */
export function startCampaignAdmission(act: number, area: string) {
  assert.equal(useMapStore.getState().isActUnlocked(act), true, 'Campaign act locked');
  const location = area.replace(/^areas\/act([1-5])-/, 'a$1-');
  assert.equal(resolveSubArea(act, location)?.id, area, 'Campaign act/area mismatch');
  useMapStore.getState().setCurrentLocation(act, location);
  return { location, handle: startEarnedRun({ act, subAreaId: location, mode: 'manual' }) };
}
