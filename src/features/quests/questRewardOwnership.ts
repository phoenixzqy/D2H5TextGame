import type { Item } from '@/engine/types/items';
import type { Unit } from '@/engine/types/entities';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { sameCainData as sameData } from './cainPublication';

type Inventory = ReturnType<typeof useInventoryStore.getState>;
type Mercs = ReturnType<typeof useMercStore.getState>;
type Origin = { kind: 'backpack' | 'stash'; index: number } |
  { kind: 'hero' | 'merc'; owner: string; slot: string } |
  { kind: 'legacy' | 'socket'; index: number };
interface Original { reference: object; id: string; item: Item; origin: Origin }

/** A transaction-local physical journal. Actor equipment arrays are mirrors. */
export function captureQuestRewardOwnership(reward: Item) {
  const originalId = reward.id, expectedReward = structuredClone(reward);
  const originals: Original[] = [], rewardReferences = new Set<object>([reward]), aliases = new Set([originalId]);
  const affected = new Set<Original>(), touchedMercs = new Set<string>();
  let touchedHero = false, disposed = false, wasPublished = false;
  const initialInventory = useInventoryStore.getState(), initialMercs = useMercStore.getState();
  const initialHeroSlots = new Set(Object.keys(initialInventory.equipped));
  const initialMercSlots = new Map(Object.entries(initialMercs.mercEquipment).map(([id, gear]) => [id, new Set(Object.keys(gear))]));
  const initialHero = usePlayerStore.getState().player;
  const initialMap = useMapStore.getState();
  const heroCache = initialHero && {
    level: initialHero.level, cores: structuredClone(initialHero.coreStats),
    equipped: structuredClone(initialInventory.equipped), accepted: structuredClone(initialHero.derivedStats),
    canonical: deriveEquippedPlayerStats(initialHero, initialHero.level, initialInventory.equipped,
      initialMap.questProgress, initialInventory.questItems, initialMap.questReceipts)
  };
  let independentXpRecomposition = false;
  const identity = (actor: Unit) => ({ reference: actor, id: actor.id, type: actor.type,
    skills: actor.skills, effects: actor.statusEffects, cooldowns: actor.cooldowns });
  const heroIdentity = initialHero && identity(initialHero);
  const mercIdentities = new Map(initialMercs.ownedMercs.map(row => [row.id, identity(row)]));
  const survives = (actor: Unit | null | undefined, witness: ReturnType<typeof identity> | null | undefined): boolean =>
    actor != null && witness != null && (actor === witness.reference || actor.id === witness.id && actor.type === witness.type &&
      [actor.skills === witness.skills, actor.statusEffects === witness.effects, actor.cooldowns === witness.cooldowns].filter(Boolean).length >= 2);
  const remember = (item: Item | null | undefined, origin: Origin): void => {
    if (item) originals.push({ reference: item, id: item.id, item: structuredClone(item), origin });
  };
  initialInventory.backpack.forEach((item, index) => { remember(item, { kind: 'backpack', index }); });
  initialInventory.stash.forEach((item, index) => { remember(item, { kind: 'stash', index }); });
  Object.entries(initialInventory.equipped).forEach(([slot, item]) => { remember(item, { kind: 'hero', owner: '', slot }); });
  initialInventory.legacyGearQuarantine.forEach((row, index) => { remember(row.item, { kind: 'legacy', index }); });
  initialInventory.socketQuarantine.forEach((row, index) => { remember(row.item, { kind: 'socket', index }); });
  Object.entries(initialMercs.mercEquipment).forEach(([owner, gear]) => {
    Object.entries(gear).forEach(([slot, item]) => { remember(item, { kind: 'merc', owner, slot }); });
  });
  const beforeReferences = new Set<object>([...originals.map(row => row.reference),
    ...(initialHero?.equipment ?? []), ...initialMercs.ownedMercs.flatMap(row => row.equipment)]);
  const sharedPayload = (left: object, right: object): boolean =>
    ['affixes', 'baseRolls', 'statRolls', 'generatedName', 'socketContents', 'personalizedBy'].some(key => {
      const value: unknown = Reflect.get(left, key);
      return value !== null && typeof value === 'object' && value === Reflect.get(right, key);
    });
  const own = (item: { readonly id: string }): boolean => {
    if (rewardReferences.has(item)) { aliases.add(item.id); return true; }
    // Store equip/unequip spreads preserve the instance's nested payload refs.
    // An ID (including one introduced by another observer) is never lineage.
    if (!beforeReferences.has(item) && aliases.has(item.id) && [...rewardReferences].some(reference => sharedPayload(item, reference))) {
      rewardReferences.add(item); return true;
    }
    return false;
  };
  const observe = (inventory: Pick<Inventory, 'backpack' | 'stash' | 'equipped' | 'legacyGearQuarantine' | 'socketQuarantine'>,
    mercs: Pick<Mercs, 'mercEquipment' | 'ownedMercs'>, hero = usePlayerStore.getState().player): void => {
    // Discover aliases before clones, independent of the order of containers.
    const items = [...inventory.backpack, ...inventory.stash, ...Object.values(inventory.equipped),
      ...inventory.legacyGearQuarantine.map(row => row.item), ...inventory.socketQuarantine.map(row => row.item),
      ...Object.values(mercs.mercEquipment).flatMap(gear => Object.values(gear)),
      ...mercs.ownedMercs.flatMap(row => row.equipment), ...(hero?.equipment ?? [])].filter(item => item != null);
    items.forEach(item => { if (rewardReferences.has(item)) aliases.add(item.id); });
    if (items.some(own)) wasPublished = true;
    const slot = (item: Item | null | undefined, kind: 'hero' | 'merc', owner: string, key: string): void => {
      if (!item || !own(item)) return;
      if (kind === 'hero') touchedHero = true; else touchedMercs.add(owner);
      const original = originals.find(row => row.origin.kind === kind && row.origin.owner === owner && row.origin.slot === key);
      if (original) affected.add(original);
    };
    Object.entries(inventory.equipped).forEach(([key, item]) => { slot(item, 'hero', '', key); });
    Object.entries(mercs.mercEquipment).forEach(([owner, gear]) => {
      Object.entries(gear).forEach(([key, item]) => { slot(item, 'merc', owner, key); });
    });
    mercs.ownedMercs.forEach(row => { if (row.equipment.some(own)) touchedMercs.add(row.id); });
    if (hero?.equipment.some(own)) touchedHero = true;
  };
  const stopHeroCache = usePlayerStore.subscribe((next, previous) => {
      const before = previous.player, after = next.player;
      // Observe real progression recomposition without journaling or restoring XP.
      // Raw addXP preserves the stat object and must remain nonrecomposing.
      if (before && after && survives(before, heroIdentity) && survives(after, heroIdentity) &&
        after.derivedStats !== before.derivedStats && (after.level !== before.level ||
          after.experience !== before.experience || after.experienceToNextLevel !== before.experienceToNextLevel)) {
        independentXpRecomposition = true;
      }
  });
  const stops = [
    useInventoryStore.subscribe((next, previous) => { observe(previous, useMercStore.getState()); observe(next, useMercStore.getState()); }),
    useMercStore.subscribe((next, previous) => { observe(useInventoryStore.getState(), previous); observe(useInventoryStore.getState(), next); }),
    usePlayerStore.subscribe((next, previous) => {
      observe(useInventoryStore.getState(), useMercStore.getState(), previous.player);
      observe(useInventoryStore.getState(), useMercStore.getState(), next.player);
    })
  ];
  let restoringPhysical = false;
  const dispose = (): void => {
    if (!disposed) { disposed = true; stops.forEach(stop => { stop(); }); }
    if (!restoringPhysical) stopHeroCache();
  };
  const preflight = (): void => {
    const inventory = useInventoryStore.getState(), mercs = useMercStore.getState();
    const all = [...inventory.backpack, ...inventory.stash, ...Object.values(inventory.equipped),
      ...Object.values(mercs.mercEquipment).flatMap(gear => Object.values(gear)),
      ...inventory.legacyGearQuarantine.map(row => row.item), ...inventory.socketQuarantine.map(row => row.item),
      ...(usePlayerStore.getState().player?.equipment ?? []), ...mercs.ownedMercs.flatMap(row => row.equipment)];
    if (all.some(item => item?.id === originalId || item && rewardReferences.has(item))) throw new Error('Quest reward identity already owned');
  };
  const checkPublished = (): void => {
    const inventory = useInventoryStore.getState(), mercs = useMercStore.getState();
    observe(inventory, mercs);
    const bag = inventory.backpack.filter(own);
    const elsewhere = [...inventory.stash, ...Object.values(inventory.equipped),
      ...Object.values(mercs.mercEquipment).flatMap(gear => Object.values(gear)),
      ...inventory.legacyGearQuarantine.map(row => row.item), ...inventory.socketQuarantine.map(row => row.item),
      ...(usePlayerStore.getState().player?.equipment ?? []), ...mercs.ownedMercs.flatMap(row => row.equipment)];
    if (bag.length !== 1 || !sameData(bag[0], expectedReward) || elsewhere.some(item => item && own(item))) {
      throw new Error('Quest reward physical publication changed');
    }
  };
  const restore = (): void => {
    observe(useInventoryStore.getState(), useMercStore.getState());
    restoringPhysical = true;
    try {
    dispose();
    const errors: unknown[] = [];
    const attempt = (operation: () => void): void => { try { operation(); } catch (error) { errors.push(error); } };
    const originalOwns = (item: { readonly id: string }): boolean => [...affected].some(row => row.reference === item || row.id === item.id);
    const participating = (item: { readonly id: string }): boolean => own(item) || originalOwns(item);
    const cleanSlots = <T extends Record<string, Item | null | undefined>>(gear: T, before: ReadonlySet<string>): T => {
      const next = { ...gear };
      Object.entries(next).forEach(([key, item]) => { if (item && participating(item)) {
        if (before.has(key)) Reflect.set(next, key, null); else Reflect.deleteProperty(next, key);
      } });
      return next;
    };
    const recovery: Item[] = [];
    const recover = (item: Item): void => {
      const { equipSlot: _slot, ...fields } = structuredClone(item); recovery.push({ ...fields, equipped: false });
    };
    const expectedLocations: { container: string; item: Item }[] = [];
    // Each domain derives its own delta from its current state at the write.
    // In particular a merc restoration observer may legitimately add inventory.
    attempt(() => { useMercStore.setState(state => {
      const mercEquipment = Object.fromEntries(Object.entries(state.mercEquipment).map(([id, gear]) =>
        [id, cleanSlots(gear, initialMercSlots.get(id) ?? new Set<string>())]));
      for (const original of affected) if (original.origin.kind === 'merc') {
        const origin = original.origin, item = structuredClone(original.item);
        const gear: Record<string, Item | null | undefined> | undefined = mercEquipment[origin.owner];
        const owner = state.ownedMercs.find(row => row.id === origin.owner);
        const survivingOwner = !mercIdentities.has(origin.owner) || survives(owner, mercIdentities.get(origin.owner));
        if (gear && !gear[origin.slot] && survivingOwner) {
          gear[origin.slot] = item; expectedLocations.push({ container: `merc:${origin.owner}:${origin.slot}`, item: structuredClone(item) });
        } else recover(item);
      }
      return { mercEquipment };
    }); });
    attempt(() => { useInventoryStore.setState(state => {
      const next = { backpack: state.backpack.filter(item => !participating(item)), stash: state.stash.filter(item => !participating(item)),
        equipped: cleanSlots(state.equipped, initialHeroSlots),
        legacyGearQuarantine: state.legacyGearQuarantine.filter(row => !participating(row.item)),
        socketQuarantine: state.socketQuarantine.filter(row => !participating(row.item)) };
      for (const original of affected) if (original.origin.kind === 'hero') {
        const origin = original.origin, item = structuredClone(original.item);
        if (!next.equipped[origin.slot] && survives(usePlayerStore.getState().player, heroIdentity)) {
          next.equipped[origin.slot] = item; expectedLocations.push({ container: `hero:${origin.slot}`, item: structuredClone(item) });
        } else recover(item);
      }
      next.backpack.push(...recovery);
      recovery.forEach(item => { expectedLocations.push({ container: 'backpack', item: structuredClone(item) }); });
      return next;
    }); });
    attempt(() => { useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.map(row => {
      if (!touchedMercs.has(row.id) && !row.equipment.some(participating)) return row;
      if (!survives(row, mercIdentities.get(row.id))) return row.equipment.some(own)
        ? { ...row, equipment: row.equipment.filter(item => !own(item)) } : row;
      return { ...row, equipment: Object.values(state.mercEquipment[row.id] ?? {}).filter((item): item is Item => item != null) };
    }) })); });
    const restoredHero = () => {
      const player = usePlayerStore.getState().player;
      if (!player) return player;
      if (!survives(player, heroIdentity)) return player.equipment.some(own)
        ? { ...player, equipment: player.equipment.filter(item => !own(item)) } : player;
      const inv = useInventoryStore.getState(), map = useMapStore.getState();
      const hero = { ...player, equipment: Object.values(inv.equipped).filter((item): item is Item => item != null) };
      const derivedStats = deriveEquippedPlayerStats(hero, hero.level, inv.equipped, map.questProgress, inv.questItems, map.questReceipts);
      const originalComposition = heroCache && !independentXpRecomposition && hero.level === heroCache.level &&
        sameData(hero.coreStats, heroCache.cores) && sameData(inv.equipped, heroCache.equipped) &&
        sameData({ ...derivedStats, life: heroCache.canonical.life, mana: heroCache.canonical.mana }, heroCache.canonical);
      return { ...hero, derivedStats: originalComposition ? { ...heroCache.accepted,
        life: Math.min(player.derivedStats.life, heroCache.accepted.lifeMax),
        mana: Math.min(player.derivedStats.mana, heroCache.accepted.manaMax) } : derivedStats };
    };
    if (touchedHero) attempt(() => { usePlayerStore.setState({ player: restoredHero() }); });
    attempt(() => {
      const inv = useInventoryStore.getState(), current = useMercStore.getState();
      const locations: { container: string; item: Item }[] = [];
      inv.backpack.forEach(item => { if (originalOwns(item)) locations.push({ container: 'backpack', item }); });
      inv.stash.forEach(item => { if (originalOwns(item)) locations.push({ container: 'stash', item }); });
      Object.entries(inv.equipped).forEach(([slot, item]) => { if (item && originalOwns(item)) locations.push({ container: `hero:${slot}`, item }); });
      Object.entries(current.mercEquipment).forEach(([id, gear]) => {
        Object.entries(gear).forEach(([slot, item]) => { if (item && originalOwns(item)) locations.push({ container: `merc:${id}:${slot}`, item }); });
      });
      // Quarantined originals are not a planned recovery destination.
      if ([...inv.legacyGearQuarantine, ...inv.socketQuarantine].some(row => originalOwns(row.item)) ||
        locations.length !== expectedLocations.length || expectedLocations.some(expected =>
          locations.filter(row => row.container === expected.container && sameData(row.item, expected.item)).length !== 1) ||
        touchedHero && !sameData(usePlayerStore.getState().player, restoredHero())) throw new Error('Quest reward ownership restoration postcondition failed');
      const all = [...inv.backpack, ...inv.stash, ...Object.values(inv.equipped),
        ...Object.values(current.mercEquipment).flatMap(gear => Object.values(gear)),
        ...inv.legacyGearQuarantine.map(row => row.item), ...inv.socketQuarantine.map(row => row.item),
        ...(usePlayerStore.getState().player?.equipment ?? []), ...current.ownedMercs.flatMap(row => row.equipment)];
      if (all.some(item => item && own(item))) throw new Error('Failed quest reward remains owned');
      if (wasPublished && all.some(item => item && aliases.has(item.id) && !beforeReferences.has(item) && !originalOwns(item))) {
        throw new Error('Quest reward lineage is ambiguous after identity collision');
      }
      for (const row of current.ownedMercs) if (touchedMercs.has(row.id) && survives(row, mercIdentities.get(row.id)) &&
        !sameData(row.equipment, Object.values(current.mercEquipment[row.id] ?? {}).filter(item => item != null))) {
        throw new Error('Quest reward mercenary mirror restoration failed');
      }
    });
    if (errors.length) throw new AggregateError(errors, 'Quest reward physical restoration failed');
    } finally { restoringPhysical = false; stopHeroCache(); }
  };
  return { preflight, checkPublished, restore, dispose };
}
