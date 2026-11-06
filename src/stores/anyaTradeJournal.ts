import type { MaterialLedger } from '@/engine/loot/materials';
import type { Item } from '@/engine/types/items';
import { assertMaterialTransactionOwner, type MaterialTransactionLease, WaveGuardError } from './waveTransitionGuard';

const brand = Symbol('anyaTradeCost');
/** One process-local paid-trade owner, valid only under its original material lease. */
export interface AnyaTradeCostPublication { readonly [brand]: true }
type Entry = 'frostburn-gauntlet' | 'waterwalk';
interface Balance { readonly present: boolean; readonly value: number }
interface Owner {
  readonly handle: AnyaTradeCostPublication;
  readonly lease: MaterialTransactionLease;
  readonly entry: Entry;
  readonly scrap: Balance;
  readonly shards: Balance;
  debited: boolean;
  spent: boolean;
  item?: Item;
  itemId?: string;
  itemAdded: boolean;
}
let active: Owner | null = null;
function balance(ledger: Readonly<Record<string, number>>, key: string): Balance {
  const descriptor = Object.getOwnPropertyDescriptor(ledger, key);
  if (!descriptor) {
    if (key in ledger) throw new Error('Inherited Anya cost balance');
    return { present: false, value: 0 };
  }
  if (!Object.hasOwn(descriptor, 'value') || !descriptor.enumerable || !Number.isSafeInteger(descriptor.value) || descriptor.value < 0) {
    throw new Error('Invalid Anya cost balance');
  }
  return { present: true, value: descriptor.value as number };
}
function owner(handle: AnyaTradeCostPublication): Owner {
  if (!active || active.handle !== handle) throw new WaveGuardError('invalidLease');
  assertMaterialTransactionOwner(active.lease);
  return active;
}
function expected(initial: Balance, amount: number, debited: boolean): Balance {
  return debited ? { present: true, value: initial.value - amount } : initial;
}
function verify(value: Owner, currencies: Readonly<Record<string, number>>, materials: MaterialLedger): void {
  for (const [actual, wanted] of [[balance(currencies, 'rune-shard'), expected(value.shards, 2000, value.debited)],
    [balance(materials, 'materials/scrap'), value.debited && value.scrap.value === 40
      ? { present: false, value: 0 } : expected(value.scrap, 40, value.debited)]]) {
    if (!actual || !wanted || actual.present !== wanted.present || actual.value !== wanted.value) {
      throw new Error('Unattributed Anya cost mutation');
    }
  }
}
/** Acquire the finite exact costs; preview and insufficient funds never create an owner. */
export function beginAnyaTradeCostPublication(lease: MaterialTransactionLease, entry: Entry,
  currencies: Readonly<Record<string, number>>, materials: MaterialLedger): AnyaTradeCostPublication {
  assertMaterialTransactionOwner(lease);
  if (active) throw new WaveGuardError('materialBusy');
  if (!new Set<string>(['frostburn-gauntlet', 'waterwalk']).has(entry)) throw new Error('Unsupported Anya trade');
  const scrap = balance(materials, 'materials/scrap'), shards = balance(currencies, 'rune-shard');
  if (scrap.value < 40 || shards.value < 2000) throw new Error('Insufficient Anya trade funds');
  const handle = Object.freeze({ [brand]: true as const });
  active = { handle, lease, entry, scrap, shards, debited: false, spent: false, itemAdded: false };
  return handle;
}
/** Pin one actual privately constructed unique before payment; callers cannot replace it. */
export function prepareAnyaTradeItem(handle: AnyaTradeCostPublication, item: Item): void {
  const value = owner(handle);
  if (value.item !== undefined || value.spent || !item.id || item.uniqueId !== `items/unique/${value.entry}` || item.level !== 66 ||
    item.rarity !== 'unique' || item.equipped || !item.identified) throw new Error('Invalid prepared Anya item');
  value.item = item; value.itemId = item.id;
}
/** Inventory-only updater: attribute both exact debits before subscribers run. */
export function prepareAnyaTradeDebit(handle: AnyaTradeCostPublication, currencies: Readonly<Record<string, number>>, materials: MaterialLedger) {
  const value = owner(handle); verify(value, currencies, materials);
  if (value.spent || !value.item) throw new Error('Anya payment already used or unprepared');
  value.spent = true; value.debited = true;
  return { shards: value.shards.value - 2000, scrap: value.scrap.value - 40 };
}
/** Inventory-only updater: restore just the attributable debit, retaining all other keys. */
export function prepareAnyaTradeRestoration(handle: AnyaTradeCostPublication, currencies: Readonly<Record<string, number>>, materials: MaterialLedger) {
  const value = owner(handle); verify(value, currencies, materials);
  if (!value.debited) return null;
  value.debited = false;
  return { shards: value.shards, scrap: value.scrap };
}
/** Inventory-only append authorization; exact item, one append and completed payment. */
export function authorizeAnyaTradeItem(handle: AnyaTradeCostPublication, item: Item): void {
  const value = owner(handle);
  if (!value.debited || value.itemAdded || value.item !== item || value.itemId !== item.id ||
    item.uniqueId !== `items/unique/${value.entry}`) throw new Error('Invalid Anya item publication');
  value.itemAdded = true;
}
/** Verify actual paid or restored balances, including silent setters and direct mutation. */
export function verifyAnyaTradeCostPublication(handle: AnyaTradeCostPublication,
  currencies: Readonly<Record<string, number>>, materials: MaterialLedger, debited: boolean): void {
  const value = owner(handle); verify(value, currencies, materials);
  if (value.debited !== debited) throw new Error('Anya cost publication not applied');
}
/** Release only this bounded owner; caller retains responsibility for recovery failures. */
export function endAnyaTradeCostPublication(handle: AnyaTradeCostPublication): void { owner(handle); active = null; }
