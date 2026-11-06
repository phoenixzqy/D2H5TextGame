import type { SaveCurrent } from '@/engine/types/save';

type CampaignMap = Pick<SaveCurrent['map'], 'questTitles' | 'questDifficulties' | 'selectedTitle' |
  'selectedDifficulty' | 'nightmareClearedSubAreas' | 'hellClearedSubAreas' | 'challengeOrdinals'> &
  { readonly endgame: SaveCurrent['endgame'] };

/** Durable campaign ownership and unused replay/endgame namespaces, without the live Normal ordinal. */
export function campaignState(map: CampaignMap) {
  return structuredClone({ questTitles: map.questTitles, questDifficulties: map.questDifficulties,
    selectedTitle: map.selectedTitle, selectedDifficulty: map.selectedDifficulty,
    nightmareClearedSubAreas: map.nightmareClearedSubAreas, hellClearedSubAreas: map.hellClearedSubAreas,
    replayOrdinals: { nightmare: map.challengeOrdinals.nightmare, hell: map.challengeOrdinals.hell },
    endgame: map.endgame });
}
export type CampaignState = ReturnType<typeof campaignState>;

/** Save checkpoints keep endgame beside the map; native observations keep it inside the map store. */
export const savedCampaignState = (save: SaveCurrent): CampaignState =>
  campaignState({ ...save.map, endgame: save.endgame });
