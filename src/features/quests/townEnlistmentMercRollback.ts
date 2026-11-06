import type { Mercenary, Unit } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { usePlayerStore } from '@/stores/playerStore';
import { sameCainData as sameData } from './cainPublication';

type Mercs = ReturnType<typeof useMercStore.getState>;
type Inventory = ReturnType<typeof useInventoryStore.getState>;
type Origin = { kind: 'backpack' | 'stash' | 'legacy' | 'socket'; index: number } |
  { kind: 'hero'; owner: string; slot: string } | { kind: 'merc'; owner: string; slot: string };
interface Physical { reference: Item; id: string; item: Item; origin: Origin | null; references: Set<Item>; aliases: Set<string> }
function identity(actor: Unit) {
  return { actor, id: actor.id, type: actor.type, skills: actor.skills, effects: actor.statusEffects, cooldowns: actor.cooldowns };
}
function survives(actor: Unit | null | undefined, witness: ReturnType<typeof identity> | null | undefined): boolean {
  return !!actor && !!witness && (actor === witness.actor || actor.id === witness.id && actor.type === witness.type
    && [actor.skills === witness.skills, actor.statusEffects === witness.effects, actor.cooldowns === witness.cooldowns].filter(Boolean).length >= 2);
}
function sharedPayload(left: Item, right: Item): boolean {
  return ['affixes', 'baseRolls', 'statRolls', 'generatedName', 'socketContents', 'personalizedBy'].some(key => {
    const value: unknown = Reflect.get(left, key);
    return value !== null && typeof value === 'object' && value === Reflect.get(right, key);
  });
}

/**
 * Journal one actual family participant. Unlike accepted Warband restoration,
 * absent retained actors and independent fielding are never resurrected/rewound.
 * Item IDs alone are not lineage; ambiguous opaque collisions remain explicit.
 */
export function captureTownEnlistmentMercParticipant(participant: Mercenary, fresh: boolean) {
  const mercs = useMercStore.getState(), inv = useInventoryStore.getState(), hero = usePlayerStore.getState().player;
  const participantIdentity = identity(participant), originalId = participant.id, beforeActor = structuredClone(participant);
  const beforeIndex = mercs.ownedMercs.indexOf(participant), beforeEquipment = structuredClone(mercs.mercEquipment[originalId]);
  const equipmentPresent = Object.hasOwn(mercs.mercEquipment, originalId);
  const beforeProgress = structuredClone(mercs.mercProgress[originalId]), progressPresent = Object.hasOwn(mercs.mercProgress, originalId);
  const beforeField = mercs.fieldedMercId, actors = new Map(mercs.ownedMercs.map(row => [row.id, identity(row)]));
  const heroIdentity = hero && identity(hero), actorRefs = new Set([participant]), mapAliases = new Set([originalId]);
  const originals: Physical[] = [], affected = new Set<Physical>(), touchedMercs = new Set<string>();
  const initialMirrorRefs = new Set<Item>([...(hero?.equipment ?? []), ...mercs.ownedMercs.flatMap(row => row.equipment)]);
  const remember = (item: Item | null | undefined, origin: Origin): void => {
    if (item) originals.push({ reference: item, id: item.id, item: structuredClone(item), origin,
      references: new Set([item]), aliases: new Set([item.id]) });
  };
  inv.backpack.forEach((item, index) => { remember(item, { kind: 'backpack', index }); });
  inv.stash.forEach((item, index) => { remember(item, { kind: 'stash', index }); });
  inv.legacyGearQuarantine.forEach((row, index) => { remember(row.item, { kind: 'legacy', index }); });
  inv.socketQuarantine.forEach((row, index) => { remember(row.item, { kind: 'socket', index }); });
  Object.entries(inv.equipped).forEach(([slot, item]) => { remember(item, { kind: 'hero', owner: '', slot }); });
  Object.entries(mercs.mercEquipment).forEach(([owner, gear]) => {
    Object.entries(gear).forEach(([slot, item]) => { remember(item, { kind: 'merc', owner, slot }); });
  });
  const initialHeroSlots = new Set(Object.keys(inv.equipped));
  const initialMercSlots = new Map(Object.entries(mercs.mercEquipment).map(([id, gear]) => [id, new Set(Object.keys(gear))]));
  let touchedHero = false, disposed = false, fieldPublicationBefore: Mercs | undefined, fieldTarget: string | null = null, independentField = false;
  const ownsActor = (row: Mercenary): boolean => actorRefs.has(row) || survives(row, participantIdentity);
  const owns = (row: Physical, item: Item): boolean => {
    if (row.references.has(item)) { row.aliases.add(item.id); return true; }
    if (!initialMirrorRefs.has(item) && !originals.some(original => original !== row && original.reference === item)
      && row.aliases.has(item.id) && [...row.references].some(reference => sharedPayload(reference, item))) {
      row.references.add(item); return true;
    }
    return false;
  };
  const physical = (inventory: Pick<Inventory, 'backpack' | 'stash' | 'equipped' | 'legacyGearQuarantine' | 'socketQuarantine'>,
    state: Pick<Mercs, 'mercEquipment'>): { item: Item; location: string }[] => [
    ...inventory.backpack.map((item, index) => ({ item, location: `backpack:${String(index)}` })),
    ...inventory.stash.map((item, index) => ({ item, location: `stash:${String(index)}` })),
    ...inventory.legacyGearQuarantine.map((row, index) => ({ item: row.item, location: `legacy:${String(index)}` })),
    ...inventory.socketQuarantine.map((row, index) => ({ item: row.item, location: `socket:${String(index)}` })),
    ...Object.entries(inventory.equipped).flatMap(([slot, item]) => item ? [{ item, location: `hero:${slot}` }] : []),
    ...Object.entries(state.mercEquipment).flatMap(([owner, gear]) => Object.entries(gear).flatMap(([slot, item]) => item ? [{ item, location: `merc:${owner}:${slot}` }] : []))
  ];
  const initialPhysical = physical(inv, mercs);
  const collect = (state: Pick<Mercs, 'ownedMercs' | 'mercEquipment'>): void => {
    for (const actor of state.ownedMercs) if (ownsActor(actor)) { actorRefs.add(actor); mapAliases.add(actor.id); }
    const gear = [...actorRefs].flatMap(row => row.equipment);
    for (const id of mapAliases) if (!state.ownedMercs.some(row => row.id === id && !ownsActor(row))) {
      gear.push(...Object.values(state.mercEquipment[id] ?? {}).filter((item): item is Item => item != null));
    }
    for (const item of gear) {
      let row = [...affected, ...originals].find(candidate => owns(candidate, item));
      if (!row) row = { reference: item, id: item.id, item: structuredClone(item), origin: null,
        references: new Set([item]), aliases: new Set([item.id]) };
      affected.add(row);
    }
    // A participating item can displace a different physical original. Capture
    // that original before restoring slots, including observer-only movements.
    for (const location of physical(useInventoryStore.getState(), state)) {
      if (!location.location.startsWith('hero:') && !location.location.startsWith('merc:')) continue;
      if (![...affected].some(row => owns(row, location.item))) continue;
      const displaced = initialPhysical.find(before => before.location === location.location);
      const original = displaced && originals.find(row => row.reference === displaced.item);
      if (original) affected.add(original);
    }
  };
  collect(mercs);
  const initialAffected = new Set(affected);
  const view = (inventory: typeof inv, state: typeof mercs) => physical(inventory, state)
    .filter(({ item }) => [...initialAffected].some(row => owns(row, item)))
    .map(({ item, location }) => ({ location, item }));
  const beforePhysical = structuredClone(view(inv, mercs));
  const stops = [useMercStore.subscribe((next, previous) => {
    collect(previous); collect(next);
    if (fieldPublicationBefore && previous !== fieldPublicationBefore && previous.fieldedMercId !== next.fieldedMercId) independentField = true;
  }), useInventoryStore.subscribe(() => { collect(useMercStore.getState()); })];
  const dispose = (): void => { if (!disposed) { disposed = true; stops.forEach(stop => { stop(); }); } };
  const beginFieldPublication = (target: string): void => { fieldPublicationBefore = useMercStore.getState(); fieldTarget = target; };
  const checkUnchanged = (): void => {
    collect(useMercStore.getState());
    if (independentField || affected.size !== initialAffected.size || !sameData(view(useInventoryStore.getState(), useMercStore.getState()), beforePhysical)) {
      throw new Error('Town enlistment physical participant changed');
    }
  };
  const restore = (): void => {
    collect(useMercStore.getState()); dispose();
    const errors: unknown[] = [], expected: { location: string; item: Item }[] = [], recovery: Item[] = [];
    const attempt = (fn: () => void): void => { try { fn(); } catch (error) { errors.push(error); } };
    const participating = (item: Item): boolean => [...affected].some(row => owns(row, item));
    const cleanSlots = <T extends Record<string, Item | null | undefined>>(current: T, before: ReadonlySet<string>): T => {
      const next = { ...current };
      for (const [slot, item] of Object.entries(next)) if (item && participating(item)) {
        if (before.has(slot)) Reflect.set(next, slot, null); else Reflect.deleteProperty(next, slot);
      }
      return next;
    };
    const recover = (row: Physical): void => {
      const { equipSlot: _slot, ...fields } = structuredClone(row.item);
      const item = { ...fields, equipped: false }; row.references.add(item); recovery.push(item);
    };
    let expectedActor: Mercenary | undefined, expectedProgress: typeof beforeProgress, expectedField: string | null | undefined;
    let expectedEquipment: typeof beforeEquipment, expectedEquipmentPresent = false;
    let expectedActorAbsent = false;
    attempt(() => { useMercStore.setState(state => {
      const mercEquipment = Object.fromEntries(Object.entries(state.mercEquipment).map(([id, gear]) => [id,
        cleanSlots(gear, initialMercSlots.get(id) ?? new Set<string>())]));
      const mercProgress = { ...state.mercProgress };
      const retained = state.ownedMercs.find(ownsActor);
      let ownedMercs = state.ownedMercs;
      if (fresh) {
        ownedMercs = ownedMercs.filter(row => !ownsActor(row));
        for (const id of mapAliases) if (!ownedMercs.some(row => row.id === id)) {
          Reflect.deleteProperty(mercEquipment, id); Reflect.deleteProperty(mercProgress, id);
        }
      } else if (retained) {
        const snapshot = structuredClone(beforeActor);
        const restored = { ...snapshot, derivedStats: { ...snapshot.derivedStats,
          life: Math.min(snapshot.derivedStats.life, retained.derivedStats.life, snapshot.derivedStats.lifeMax),
          mana: Math.min(snapshot.derivedStats.mana, retained.derivedStats.mana, snapshot.derivedStats.manaMax) } };
        ownedMercs = ownedMercs.filter(row => !ownsActor(row));
        ownedMercs.splice(Math.min(Math.max(0, beforeIndex), ownedMercs.length), 0, restored);
        if (equipmentPresent) {
          const gear: Partial<Record<string, Item | null>> = { ...mercEquipment[originalId] };
          for (const [slot, item] of Object.entries(beforeEquipment ?? {})) if (!Object.hasOwn(gear, slot)) {
            gear[slot] = item ? null : item;
          }
          mercEquipment[originalId] = gear;
        } else if (Object.values(mercEquipment[originalId] ?? {}).every(item => item == null)) Reflect.deleteProperty(mercEquipment, originalId);
        if (progressPresent && beforeProgress) mercProgress[originalId] = structuredClone(beforeProgress);
        else Reflect.deleteProperty(mercProgress, originalId);
        expectedActor = restored; expectedProgress = structuredClone(mercProgress[originalId]);
        for (const id of mapAliases) if (id !== originalId && !ownedMercs.some(row => row.id === id)) {
          Reflect.deleteProperty(mercEquipment, id); Reflect.deleteProperty(mercProgress, id);
        }
      }
      expectedActorAbsent = !retained || fresh;
      for (const row of affected) if (row.origin?.kind === 'merc') {
        const origin = row.origin, owner = state.ownedMercs.find(actor => actor.id === origin.owner);
        const liveOwner = origin.owner === originalId ? !fresh && !!retained : survives(owner, actors.get(origin.owner));
        const gear: Partial<Record<string, Item | null>> | undefined = mercEquipment[origin.owner];
        if (liveOwner && gear && !gear[origin.slot]) {
          const item = structuredClone(row.item); row.references.add(item); gear[origin.slot] = item;
          expected.push({ location: `merc:${origin.owner}:${origin.slot}`, item: structuredClone(item) });
        } else recover(row);
      }
      for (const row of affected) if (row.origin === null) recover(row);
      ownedMercs = ownedMercs.map(actor => {
        if (actor === expectedActor || actor.equipment.some(participating)) {
          if (actor !== expectedActor && !survives(actor, actors.get(actor.id))) {
            return { ...actor, equipment: actor.equipment.filter(item => !participating(item)) };
          }
          touchedMercs.add(actor.id);
          return { ...actor, equipment: Object.values(mercEquipment[actor.id] ?? {}).filter((item): item is Item => item != null) };
        }
        return actor;
      });
      if (expectedActor) expectedActor = ownedMercs.find(actor => actor.id === originalId);
      expectedEquipment = structuredClone(mercEquipment[originalId]); expectedEquipmentPresent = Object.hasOwn(mercEquipment, originalId);
      let fieldedMercId = state.fieldedMercId;
      if (fieldPublicationBefore && !independentField && fieldedMercId === fieldTarget) {
        fieldedMercId = beforeField !== null && ownedMercs.some(actor => actor.id === beforeField) ? beforeField : null;
      }
      if (fieldedMercId !== null && !ownedMercs.some(actor => actor.id === fieldedMercId)
        && mapAliases.has(fieldedMercId)) fieldedMercId = null;
      expectedField = fieldedMercId;
      return { ownedMercs, mercEquipment, mercProgress, fieldedMercId };
    }); });
    attempt(() => { useInventoryStore.setState(state => {
      const next = { backpack: state.backpack.filter(item => !participating(item)), stash: state.stash.filter(item => !participating(item)),
        equipped: cleanSlots(state.equipped, initialHeroSlots),
        legacyGearQuarantine: state.legacyGearQuarantine.filter(row => !participating(row.item)),
        socketQuarantine: state.socketQuarantine.filter(row => !participating(row.item)) };
      for (const row of affected) {
        const origin = row.origin; if (!origin || origin.kind === 'merc') continue;
        const item = structuredClone(row.item); row.references.add(item);
        if (origin.kind === 'hero') {
          touchedHero = true;
          if (!next.equipped[origin.slot] && survives(usePlayerStore.getState().player, heroIdentity)) {
            next.equipped[origin.slot] = item; expected.push({ location: `hero:${origin.slot}`, item: structuredClone(item) });
          } else recover(row);
        } else {
          if (origin.kind === 'backpack' || origin.kind === 'stash') next[origin.kind].splice(Math.min(origin.index, next[origin.kind].length), 0, item);
          else if (origin.kind === 'legacy') {
            const original = inv.legacyGearQuarantine[origin.index];
            if (original) next.legacyGearQuarantine.splice(Math.min(origin.index, next.legacyGearQuarantine.length), 0, { ...structuredClone(original), item });
          } else {
            const original = inv.socketQuarantine[origin.index];
            if (original) next.socketQuarantine.splice(Math.min(origin.index, next.socketQuarantine.length), 0, { ...structuredClone(original), item });
          }
          expected.push({ location: origin.kind, item: structuredClone(item) });
        }
      }
      next.backpack.push(...recovery);
      recovery.forEach(item => { expected.push({ location: 'backpack', item: structuredClone(item) }); });
      return next;
    }); });
    const restoreHero = () => {
      const player = usePlayerStore.getState().player; if (!player) return player;
      const inventory = useInventoryStore.getState(), map = useMapStore.getState();
      if (!survives(player, heroIdentity)) return player.equipment.some(participating)
        ? { ...player, equipment: player.equipment.filter(item => !participating(item)) } : player;
      const equipment = Object.values(inventory.equipped).filter((item): item is Item => item != null);
      const result = { ...player, equipment }, stats = deriveEquippedPlayerStats(result, result.level, inventory.equipped, map.questProgress, inventory.questItems, map.questReceipts);
      return { ...result, derivedStats: { ...stats, life: Math.min(player.derivedStats.life, stats.lifeMax), mana: Math.min(player.derivedStats.mana, stats.manaMax) } };
    };
    if (touchedHero || usePlayerStore.getState().player?.equipment.some(participating)) {
      touchedHero = true; attempt(() => { usePlayerStore.setState({ player: restoreHero() }); });
    }
    attempt(() => {
      const current = useMercStore.getState(), inventory = useInventoryStore.getState();
      const locations = physical(inventory, current).filter(({ item }) => participating(item));
      const locationMatches = (actual: string, wanted: string) => actual === wanted || !wanted.includes(':') && actual.startsWith(`${wanted}:`);
      if (locations.length !== expected.length || expected.some(row => locations.filter(actual => locationMatches(actual.location, row.location) && sameData(actual.item, row.item)).length !== 1)
        || expectedField !== undefined && current.fieldedMercId !== expectedField
        || expectedActor !== undefined && (!sameData(current.ownedMercs.find(actor => actor.id === originalId), expectedActor)
          || current.ownedMercs.filter(actor => actor.id === originalId).length !== 1
          || !sameData(current.mercProgress[originalId], expectedProgress)
          || Object.hasOwn(current.mercEquipment, originalId) !== expectedEquipmentPresent
          || !sameData(current.mercEquipment[originalId], expectedEquipment))
        || expectedActorAbsent && current.ownedMercs.some(ownsActor)
        || touchedHero && !sameData(usePlayerStore.getState().player, restoreHero())) throw new Error('Town enlistment participant restoration postcondition failed');
      for (const actor of current.ownedMercs) if (touchedMercs.has(actor.id)
        && !sameData(actor.equipment, Object.values(current.mercEquipment[actor.id] ?? {}).filter(item => item != null))) {
        throw new Error('Town enlistment mercenary mirror restoration failed');
      }
      const all = [...physical(inventory, current).map(row => row.item), ...(usePlayerStore.getState().player?.equipment ?? []), ...current.ownedMercs.flatMap(actor => actor.equipment)];
      if (all.some(item => [...affected].some(row => row.aliases.has(item.id) && !owns(row, item)
        && !initialPhysical.some(before => before.item === item) && !initialMirrorRefs.has(item)))) {
        throw new Error('Town enlistment gear lineage is ambiguous');
      }
    });
    if (errors.length) throw new AggregateError(errors, 'Town enlistment physical restoration failed');
  };
  return { beginFieldPublication, checkUnchanged, restore, dispose };
}
