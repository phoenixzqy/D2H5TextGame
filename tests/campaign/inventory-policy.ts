import assert from 'node:assert/strict';

export type CampaignInventoryPolicy = 'salvage-overflow-normals-v1' | 'retain-earned-overflow-v1';

/** Explicit diagnostic housekeeping; native reward and equip capacity rules remain authoritative. */
export function campaignInventoryPolicy(value = 'salvage-overflow-normals-v1'): CampaignInventoryPolicy {
  assert.ok(value === 'salvage-overflow-normals-v1' || value === 'retain-earned-overflow-v1',
    'Invalid campaign inventory policy');
  return value;
}
