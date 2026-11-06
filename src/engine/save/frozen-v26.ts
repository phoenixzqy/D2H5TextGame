import { FROZEN_V25, FROZEN_V25_ITEM_BASES } from './frozen-v25';
import type { FrozenNativeQuestDomain } from './quest-domain';

// Verified actual26 retains the entire accepted25 catalog and adds only this proof.
// Keep these identities literal: future live Larzuk definitions must not redefine26.
/** Accepted actual26 quest/action/campaign/charm authority, before Warband enlistment. */
export const FROZEN_V26: FrozenNativeQuestDomain = Object.freeze({ ...FROZEN_V25,
  larzuk: Object.freeze({ quest: 'quests/side-act5-larzuks-sockets', objective: 'obj-bring-item',
    proof: 'quests/side-act5-larzuks-sockets#action:present-item', prerequisite: 'quests/act5-siege-on-harrogath' }) });
/** Actual26 item bases are identical to the accepted25 snapshot, including charms. */
export const FROZEN_V26_ITEM_BASES = FROZEN_V25_ITEM_BASES;
