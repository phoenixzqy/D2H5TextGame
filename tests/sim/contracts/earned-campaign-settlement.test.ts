import { expect, it } from 'vitest';
import { assertCampaignSettlement, type CampaignSettlement } from '../../campaign/settlement';

/** Constructed negative controls; no production realm, save, RNG or gameplay. */
function loss(): CampaignSettlement {
  const state = { player: { experience: 20 }, merc: { experience: 10 },
    inventory: { items: [], materials: {}, currencies: {} },
    map: { clearedSubAreas: [], questProgress: {}, questReceipts: {} } };
  return { beforeAward: structuredClone(state), afterAward: structuredClone(state),
    opening: { enemyTeam: [{ id: 'enemy' }] },
    played: { outcome: { winner: 'enemy', finalEnemyTeam: [{ id: 'enemy', life: 15 }] } },
    advanceResult: 'defeat', won: false,
    actualDelta: { xp: 0, mercXp: { rogue: 0 }, addedItems: [], removedItemIds: [],
      addedClears: [], currencies: { 'rune-shard': 0 }, materials: {} },
    rawRewardDelta: { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} } };
}

it('allows an ordinary loss only with zero rewards and unchanged persistent gameplay state', () => {
  expect(() => assertCampaignSettlement(loss())).not.toThrow();
});

it('rejects every nonwin reward channel independently, even if the ending ledger conserves it', () => {
  for (const patch of [{ xp: 1 }, { mercXp: { rogue: 1 } }, { addedItems: [{}] },
    { removedItemIds: ['lost'] }, { addedClears: ['area'] }, { materials: { gem: 1 } },
    { currencies: { wishstone: 1 } }]) {
    const row = loss(); Object.assign(row.actualDelta, patch);
    expect(() => assertCampaignSettlement(row)).toThrow();
  }
  for (const patch of [{ items: [{}] }, { runeShards: 1 }, { runes: 1 }, { gems: 1 },
    { wishstones: 1 }, { materials: { gem: 1 } }]) {
    const row = loss(); Object.assign(row.rawRewardDelta, patch);
    expect(() => assertCampaignSettlement(row)).toThrow();
  }
});

it('rejects hidden inventory, hero, mercenary, quest and clear mutations after a loss', () => {
  for (const domain of ['inventory', 'player', 'merc', 'map'] as const) {
    const row = loss(); row.afterAward[domain].forged = true;
    expect(() => assertCampaignSettlement(row)).toThrow();
  }
  const row = loss(); row.advanceResult = 'victory';
  expect(() => assertCampaignSettlement(row)).toThrow();
});

it('requires every original hostile dead and represented before crediting a living-hero win', () => {
  const row = loss(); row.won = true; row.advanceResult = 'victory';
  const outcome = row.played.outcome;
  if (!outcome) throw new Error('Missing constructed outcome');
  const enemy = outcome.finalEnemyTeam[0];
  if (!enemy) throw new Error('Missing constructed hostile');
  outcome.winner = 'player'; enemy.life = 0;
  expect(() => assertCampaignSettlement(row)).not.toThrow();
  enemy.life = 1;
  expect(() => assertCampaignSettlement(row)).toThrow();
  outcome.finalEnemyTeam = [];
  expect(() => assertCampaignSettlement(row)).toThrow();
});
