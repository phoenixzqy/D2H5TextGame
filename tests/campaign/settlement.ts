import assert from 'node:assert/strict';

type AwardState = Record<'player' | 'merc' | 'inventory' | 'map', Record<string, unknown>>;
export interface CampaignSettlement {
  beforeAward: AwardState;
  afterAward: AwardState;
  opening: { enemyTeam: readonly { id: string }[] };
  played: { outcome: { winner: 'player' | 'enemy' | null; finalEnemyTeam: readonly { id: string; life: number }[] } | null };
  advanceResult: string;
  won: boolean;
  actualDelta: { xp: number; mercXp: Record<string, number>; addedItems: readonly unknown[];
    removedItemIds: readonly string[]; addedClears: readonly string[];
    materials: Record<string, number>; currencies: Record<string, number> };
  rawRewardDelta: { items: readonly unknown[]; runeShards: number; runes: number;
    gems: number; wishstones: number; materials: Record<string, number> };
}

/** Ordinary manual campaign settlements: losses cannot publish income or progression. */
export function assertCampaignSettlement(wave: CampaignSettlement): void {
  const { actualDelta: delta, rawRewardDelta: raw } = wave;
  if (!wave.won) {
    assert.equal(wave.advanceResult, 'defeat', 'Nonwin advanced as a victory');
    assert.equal(delta.xp, 0, 'Nonwin hero XP');
    for (const ledger of [delta.mercXp, delta.materials, delta.currencies, raw.materials])
      assert.ok(Object.values(ledger).every(count => count === 0), 'Nonwin reward ledger');
    for (const values of [delta.addedItems, delta.removedItemIds, delta.addedClears, raw.items])
      assert.equal(values.length, 0, 'Nonwin item/clear delta');
    for (const count of [raw.runeShards, raw.runes, raw.gems, raw.wishstones])
      assert.equal(count, 0, 'Nonwin raw reward');
    for (const domain of ['player', 'merc', 'inventory', 'map'] as const)
      assert.deepEqual(wave.afterAward[domain], wave.beforeAward[domain], `Nonwin changed ${domain}`);
    return;
  }
  assert.ok(wave.advanceResult === 'victory' || wave.advanceResult === 'next-wave');
  assert.equal(wave.played.outcome?.winner, 'player');
  assert.ok(wave.opening.enemyTeam.length > 0);
  for (const original of wave.opening.enemyTeam) {
    const final = wave.played.outcome?.finalEnemyTeam.find(unit => unit.id === original.id);
    assert.ok(final && final.life <= 0, 'Victory retained or lost an original living hostile');
  }
}
