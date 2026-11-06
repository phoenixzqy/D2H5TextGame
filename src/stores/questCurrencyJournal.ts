/** Finite currency participants for one source, independent of stores and quest graphs. */
import { assertQuestTransactionActive, WaveGuardError } from './waveTransitionGuard';

const gemSources = new Set([
  'quests/side-act2-fara-favored',
  'quests/side-act1-gheeds-gamble',
  'quests/bounty-act1-moor-cull',
  'quests/bounty-act2-waste-cull',
  'quests/bounty-act3-forest-cull',
  'quests/bounty-act4-steppes-cull',
  'quests/bounty-act5-foothills-cull'
]);
const wishSources = new Set([
  'quests/act1-search-for-cain', 'quests/side-act1-cains-favor',
  'quests/act1-tools-of-the-trade', 'quests/side-act1-charsis-imbue',
  'quests/side-act1-rogue-merc-unlock', 'quests/side-act2-greiz-merc-roster',
  'quests/side-act3-asheara-merc', 'quests/side-act5-qual-kehk-merc',
  'quests/side-act1-gheeds-gamble', 'quests/side-act2-fara-favored',
  'quests/side-act3-alkors-experiment', 'quests/side-act3-jade-statuette',
  'quests/side-act4-jamella-trade', 'quests/side-act5-malahs-elixir',
  'quests/side-act1-pandemonium-cow-rumor', 'quests/side-act2-lost-caravan',
  'quests/side-act2-drognan-tome', 'quests/side-act2-summoners-secret',
  'quests/side-act3-ormus-charm', 'quests/side-act5-larzuks-sockets',
  'quests/side-act5-anyas-gift', 'quests/side-act5-nihlathaks-treasure'
]);
export type QuestCurrencyId = 'gem-shard' | 'wishstone';
const sources = new Map<QuestCurrencyId, ReadonlySet<string>>([['gem-shard', gemSources], ['wishstone', wishSources]]);
const brand = Symbol('questCurrencyPublication');
/** Opaque one-operation identity; never a persisted entitlement or source. */
export interface QuestCurrencyPublication { readonly [brand]: true }
interface Balance { readonly present: boolean; readonly value: number }
interface Owner {
  readonly handle: QuestCurrencyPublication;
  readonly source: string;
  readonly currencyId: QuestCurrencyId;
  readonly amount: number;
  readonly baseline: Balance;
  independent: number;
  independentPresence: boolean;
  granted: boolean;
  outstanding: boolean;
}
const active = new Map<string, Owner>();

function balance(wallet: Readonly<Record<string, number>>, currencyId: QuestCurrencyId): Balance {
  const descriptor = Object.getOwnPropertyDescriptor(wallet, currencyId);
  if (!descriptor) {
    if (currencyId in wallet) throw new Error(`Inherited ${currencyId} balance`);
    return { present: false, value: 0 };
  }
  if (!Object.hasOwn(descriptor, 'value') || !descriptor.enumerable ||
      !Number.isSafeInteger(descriptor.value) || descriptor.value < 0) {
    throw new Error(`Invalid ${currencyId} balance`);
  }
  return { present: true, value: descriptor.value as number };
}

function owner(handle: QuestCurrencyPublication): Owner {
  assertQuestTransactionActive();
  for (const current of active.values()) if (current.handle === handle) return current;
  throw new WaveGuardError('invalidLease');
}

function expected(current: Owner): Balance {
  const value = current.baseline.value + current.independent + (current.outstanding ? current.amount : 0);
  if (!Number.isSafeInteger(value)) throw new Error(`Unsafe ${current.currencyId} balance`);
  return {
    present: current.baseline.present || current.independentPresence || current.outstanding,
    value
  };
}

function verify(current: Owner, wallet: Readonly<Record<string, number>>): Balance {
  const actual = balance(wallet, current.currencyId);
  const wanted = expected(current);
  if (actual.present !== wanted.present || actual.value !== wanted.value) {
    throw new Error(`Unattributed ${current.currencyId} mutation`);
  }
  return actual;
}

/** Begin under the existing quest lease; distinct currencies must share its source. */
export function beginQuestCurrencyPublication(
  source: string,
  currencyId: QuestCurrencyId,
  amount: number,
  wallet: Readonly<Record<string, number>>
): QuestCurrencyPublication {
  assertQuestTransactionActive();
  if (active.has(currencyId) || [...active.values()].some(current => current.source !== source)) throw new WaveGuardError('questBusy');
  if (!sources.get(currencyId)?.has(source) || currencyId === 'gem-shard' && amount !== 1) {
    throw new Error('Unsupported quest currency source');
  }
  const baseline = balance(wallet, currencyId);
  if (!Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(baseline.value + amount)) {
    throw new Error(`Unsafe ${currencyId} grant`);
  }
  const handle = Object.freeze({ [brand]: true as const });
  active.set(currencyId, { handle, source, currencyId, amount, baseline, independent: 0, independentPresence: false,
    granted: false, outstanding: false });
  return handle;
}

/** Refuse direct spending only for the participating key while it is unsettled. */
export function assertQuestCurrencyDebitAllowed(currencyId: string): void {
  if (active.has(currencyId)) throw new WaveGuardError('questBusy');
}

/**
 * Inventory updater hook, immediately before its plain next-state return.
 * Attribution precedes observers; nested ordinary additions are independent.
 * Null preserves the existing nonparticipating currency behavior.
 */
export function prepareIndependentQuestCurrencyAddition(
  currencyId: string,
  amount: number,
  wallet: Readonly<Record<string, number>>
): number | null {
  const participant = active.get(currencyId);
  if (!participant) return null;
  const current = owner(participant.handle);
  const before = verify(current, wallet);
  if (!Number.isSafeInteger(amount) || amount < 0 ||
      !Number.isSafeInteger(before.value + amount) ||
      !Number.isSafeInteger(current.independent + amount)) {
    throw new Error(`Invalid independent ${currencyId} addition`);
  }
  current.independent += amount;
  current.independentPresence = true;
  return before.value + amount;
}

/** Inventory-only updater hook: publish the owner's exact amount at most once. */
export function prepareQuestCurrencyGrant(
  handle: QuestCurrencyPublication,
  wallet: Readonly<Record<string, number>>
): number {
  const current = owner(handle);
  const before = verify(current, wallet);
  if (current.granted) throw new WaveGuardError('invalidLease');
  if (!Number.isSafeInteger(before.value + current.amount)) throw new Error(`Unsafe ${current.currencyId} grant`);
  current.granted = true;
  current.outstanding = true;
  return before.value + current.amount;
}

/**
 * Inventory-only updater hook; remove only the committed owned amount.
 * Null means nothing remains to restore. Presence preserves absent versus zero.
 */
export function prepareQuestCurrencyRestoration(
  handle: QuestCurrencyPublication,
  wallet: Readonly<Record<string, number>>
): Balance | null {
  const current = owner(handle);
  verify(current, wallet);
  if (!current.outstanding) return null;
  current.outstanding = false;
  return expected(current);
}

/** Verify the actual wallet and expected successful grant or failed-operation cleanup. */
export function verifyQuestCurrencyPublication(
  handle: QuestCurrencyPublication,
  wallet: Readonly<Record<string, number>>,
  outstanding: boolean
): void {
  const current = owner(handle);
  verify(current, wallet);
  if (current.outstanding !== outstanding || (outstanding && !current.granted)) {
    throw new Error('Quest currency publication was not applied');
  }
}

/** Release only this identity, including an explicit unrestorable failure. */
export function endQuestCurrencyPublication(handle: QuestCurrencyPublication): void {
  active.delete(owner(handle).currencyId);
}

/** Resolve only the active owner's participating wallet key. */
export function questCurrencyKey(handle: QuestCurrencyPublication): QuestCurrencyId {
  return owner(handle).currencyId;
}
