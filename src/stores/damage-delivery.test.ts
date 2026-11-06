import { afterEach, beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { loadItemBases } from '@/data/loaders/loot';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';
import { getSkill, getSkillDamageDelivery } from '@/engine/skills/registry';
import { resolveBasicAttackDelivery } from '@/engine/items/equipped-weapon';
import { playerToCombatUnit } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import { useInventoryStore } from './inventoryStore';

const originalInventory = useInventoryStore.getState();
beforeEach(() => { useInventoryStore.setState({ equipped: {} }); });
afterEach(() => { useInventoryStore.setState(originalInventory, true); });
const item = (baseId: string): Item => ({ id: 'delivery-weapon', baseId,
  rarity: 'normal', level: 1, identified: true, equipped: false });
const rogue = () => {
  const def = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-trainee');
  if (!def) throw new Error('Missing actual trainee Rogue');
  return createMercFromDef(def, 'delivery');
};

it('projects the actual unequipped Rogue fallback as melee while her native Arrow stays ranged', () => {
  const owned = rogue(), before = structuredClone(owned);
  const unit = mercToCombatUnit(owned);
  expect(unit.basicAttackDelivery).toBe('melee');
  expect(unit.skillOrder).toContain('mskill-basic-arrow');
  const arrow = getSkill('mskill-basic-arrow');
  if (!arrow) throw new Error('Missing native Basic Arrow');
  expect(getSkillDamageDelivery(arrow)).toBe('ranged');
  expect(unit.stats).not.toHaveProperty('basicAttackDelivery');
  expect(owned).toEqual(before);
  expect(JSON.stringify(owned)).not.toContain('basicAttackDelivery');
});

it.each([
  ['items/base/wp1h-short-sword', 'melee'], ['items/base/weapon-staff', 'melee'],
  ['items/base/weapon-bow', 'ranged'], ['items/base/weapon-crossbow', 'ranged'],
  ['items/base/weapon-throwing-knife', 'ranged'], ['unknown', undefined],
  ['items/base/sh-buckler', undefined]
] as const)('projects original %s equipment through both native factories as %s', (baseId, delivery) => {
  const equipped = { weapon: item(baseId) }, equipmentBefore = structuredClone(equipped);
  const player = createMockPlayer('Delivery', 'sorceress'), owned = rogue();
  const sourceBefore = structuredClone({ player, owned });
  useInventoryStore.setState({ equipped });
  const hero = playerToCombatUnit(player), merc = mercToCombatUnit(owned, undefined, equipped);
  expect(hero.basicAttackDelivery).toBe(delivery);
  expect(merc.basicAttackDelivery).toBe(delivery);
  if (delivery === undefined) {
    expect(hero).not.toHaveProperty('basicAttackDelivery');
    expect(merc).not.toHaveProperty('basicAttackDelivery');
  }
  expect(hero.stats).not.toHaveProperty('basicAttackDelivery');
  expect(merc.stats).not.toHaveProperty('basicAttackDelivery');
  expect(equipped).toEqual(equipmentBefore);
  expect(useInventoryStore.getState().equipped).toBe(equipped);
  expect({ player, owned }).toEqual(sourceBefore);
});

it('takes each mercenary equipment map independently of hero and legacy entity equipment', () => {
  const heroBow = { weapon: item('items/base/weapon-bow') };
  useInventoryStore.setState({ equipped: heroBow });
  const owned = { ...rogue(), equipment: [heroBow.weapon] };
  expect(mercToCombatUnit(owned).basicAttackDelivery).toBe('melee');
  expect(mercToCombatUnit(owned, undefined, { weapon: item('unknown') }).basicAttackDelivery).toBeUndefined();
  expect(mercToCombatUnit(owned, undefined, heroBow).basicAttackDelivery).toBe('ranged');
  expect(heroBow.weapon).not.toHaveProperty('basicAttackDelivery');
});

it('distinguishes fresh empty equipment from missing legacy snapshots', () => {
  expect(resolveBasicAttackDelivery()).toBeUndefined();
  for (const equipped of [{}, { weapon: null }]) {
    useInventoryStore.setState({ equipped });
    expect(playerToCombatUnit(createMockPlayer('Unarmed', 'sorceress')).basicAttackDelivery).toBe('melee');
    expect(mercToCombatUnit(rogue(), undefined, equipped).basicAttackDelivery).toBe('melee');
  }
});

it('projects every available native item weapon type through its actual base', () => {
  const byType = new Map([...loadItemBases().values()].flatMap(base =>
    base.type === 'weapon' && base.weaponType !== undefined ? [[base.weaponType, base.id] as const] : []));
  expect([...byType.keys()].sort()).toEqual([
    'axe', 'bow', 'claw', 'crossbow', 'mace', 'polearm', 'scepter', 'spear', 'staff', 'sword', 'throwing', 'wand'
  ]);
  for (const [type, baseId] of byType) {
    expect(resolveBasicAttackDelivery({ weapon: item(baseId) }), type)
      .toBe(['bow', 'crossbow', 'throwing'].includes(type) ? 'ranged' : 'melee');
  }
});
