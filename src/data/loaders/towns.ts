import { dialogues } from '../index';

/** Authored NPC presence projected for both current-town rendering and quest events. */
export interface TownNpc {
  readonly id: string;
  readonly portraitId: string;
  readonly nameKey: string;
}

/** Resolve only canonical, matching dialogue/NPC identities in the requested act. */
export function loadTownNpcs(act: number): readonly TownNpc[] {
  const npcs: TownNpc[] = [];
  for (const doc of dialogues) {
    const match = /^dialogue\/act([1-5])\/([a-z0-9-]+)$/.exec(doc.id);
    const slug = match?.[2];
    if (!slug || Number(match[1]) !== act || !('npcId' in doc) || doc.npcId !== slug) continue;
    npcs.push({ id: `npc/${slug}`, portraitId: slug, nameKey: `town.npc.${slug}` });
  }
  return npcs;
}
