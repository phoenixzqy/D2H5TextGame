/** Canonical player selection IDs. This domain does not assert runtime effect support. */
export const PLAYER_AURA_IDS = Object.freeze([
  'paladin.might', 'paladin.holy-fire', 'paladin.conviction', 'paladin.meditation',
  'paladin.thorns', 'paladin.blessed-aim', 'paladin.concentration', 'paladin.holy-freeze',
  'paladin.holy-shock', 'paladin.sanctuary', 'paladin.fanaticism', 'paladin.prayer',
  'paladin.resist-fire', 'paladin.defiance', 'paladin.resist-cold', 'paladin.cleansing',
  'paladin.resist-lightning', 'paladin.vigor', 'paladin.redemption', 'paladin.salvation'
] as const);

/** Exactly one player aura may be selected; absence on Player means None. */
export type PlayerAuraId = typeof PLAYER_AURA_IDS[number];

/** Check an untrusted selection without trimming, alias conversion or eligibility inference. */
export function isPlayerAuraId(value: unknown): value is PlayerAuraId {
  return PLAYER_AURA_IDS.some(id => id === value);
}
