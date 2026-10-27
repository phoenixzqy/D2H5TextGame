/** Reserved D11 action identities; each needs its reciprocal graph before admission. */
export const ACT1_QUEST_RECEIPTS = Object.freeze({
  rescueCain: 'quests/act1-search-for-cain#action:rescue-cain',
  cainTalk: 'quests/side-act1-cains-favor#action:cain-talk',
  countessVictory: 'quests/act1-forgotten-tower#action:countess-victory',
  presentItem: 'quests/side-act1-charsis-imbue#action:present-item'
} as const);

/** Independent source-bound imbues; these are not active wallet mappings yet. */
export const ACT1_IMBUE_SOURCES = Object.freeze({
  main: 'quests/act1-tools-of-the-trade#reward:service',
  side: 'quests/side-act1-charsis-imbue#reward:service'
} as const);
