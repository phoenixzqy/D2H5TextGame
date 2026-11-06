import { FROZEN_V26, FROZEN_V26_ITEM_BASES } from './frozen-v26';
import type { FrozenNativeQuestDomain } from './quest-domain';

/** Accepted actual27 authority, captured before the Drognan physical source. */
export const FROZEN_V27: FrozenNativeQuestDomain = Object.freeze({ ...FROZEN_V26,
  quests: Object.freeze(FROZEN_V26.quests.map(quest => quest.id === 'quests/side-act5-qual-kehk-merc'
    ? Object.freeze({ ...quest, giver: 'npc/qual-kehk' }) : quest)),
  warband: Object.freeze({ quest: 'quests/side-act5-qual-kehk-merc', objective: 'obj-hire',
    proof: 'quests/side-act5-qual-kehk-merc#action:enlist-recruit', prerequisite: 'quests/act5-rescue-on-mount-arreat' }) });
export const FROZEN_V27_ITEM_BASES = FROZEN_V26_ITEM_BASES;
