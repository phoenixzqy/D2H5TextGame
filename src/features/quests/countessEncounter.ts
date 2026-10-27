import { COUNTESS, isCountessAdmissionEligible } from '@/engine/map/countess-admission';
import { questActionPreflight } from './questTransaction';
import { useMapStore } from '@/stores/mapStore';

type CountessMap = Pick<ReturnType<typeof useMapStore.getState>,
  'selectedDifficulty' | 'questProgress' | 'questReceipts' | 'isActUnlocked'>;

/** Available on the map even before the ordinary Dark Wood clear. */
export function canSelectCountessEncounter(map: CountessMap): boolean {
  return map.selectedDifficulty === 'normal' && map.isActUnlocked(1) &&
    isCountessAdmissionEligible(map.questProgress, map.questReceipts);
}

/** Direct combat entry also requires the exact canonical current location. */
export function canStartCountessEncounter(): boolean {
  const map = useMapStore.getState();
  return canSelectCountessEncounter(map) && map.currentAct === 1 && map.currentSubAreaId === COUNTESS.area;
}

/** Guard explicit map travel before publishing a location or navigating to combat. */
export function travelToCountessEncounter(): boolean {
  if (questActionPreflight() !== null || !canSelectCountessEncounter(useMapStore.getState())) return false;
  useMapStore.getState().setCurrentLocation(1, COUNTESS.area);
  return true;
}
