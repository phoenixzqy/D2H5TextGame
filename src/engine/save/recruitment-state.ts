import { loadMercPool } from '../../data/loaders/mercs';
import {
  createRecruitmentState, readRecruitmentState,
  type MercRecruitmentProgress, type RecruitmentState
} from '../gacha/recruitment-state';

/** The SSR counter keeps its historical gacha owner; new state contains no duplicate. */
export type RecruitmentHistoryState = Omit<RecruitmentState, 'pityCounter'>;

function ownData(value: unknown, key: string, allowAbsent = false): unknown {
  if (value === null || typeof value !== 'object') throw new Error('Invalid recruitment save container');
  const field = Object.getOwnPropertyDescriptor(value, key);
  if (!field && allowAbsent && !(key in value)) return undefined;
  if (!field || field.enumerable !== true || !Object.hasOwn(field, 'value')) {
    throw new Error('Invalid recruitment save field');
  }
  return field.value;
}
function historyData(value: unknown): RecruitmentHistoryState {
  if (value === null || typeof value !== 'object' ||
    (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) ||
    Reflect.ownKeys(value).length !== 3) throw new Error('Invalid recruitment history state');
  return { srPityCounter: ownData(value, 'srPityCounter') as number,
    totalPulls: ownData(value, 'totalPulls') as number,
    history: ownData(value, 'history') as RecruitmentHistoryState['history'] };
}

/** Read durable fields before normalization; only a wholly absent trusted builder field defaults. */
export function readRecruitmentSaveFields(value: unknown, allowAbsent = false): {
  readonly recruitmentState: RecruitmentHistoryState;
  readonly recruitmentProgress: MercRecruitmentProgress;
} {
  const meta = ownData(value, 'meta'), mercs = ownData(value, 'mercs');
  const gacha = ownData(meta, 'gachaState');
  const pityCounter = ownData(gacha, 'pityCounter') as number;
  const history = ownData(meta, 'recruitmentState', allowAbsent);
  const progress = ownData(mercs, 'recruitmentProgress', allowAbsent);
  const defaultState = createRecruitmentState(pityCounter);
  const recruitmentState = history === undefined && allowAbsent &&
    !Object.hasOwn(meta as object, 'recruitmentState')
    ? { srPityCounter: defaultState.srPityCounter, totalPulls: 0, history: [] }
    : historyData(history);
  const recruitmentProgress = progress === undefined && allowAbsent &&
    !Object.hasOwn(mercs as object, 'recruitmentProgress') ? {} : progress;
  const checked = readRecruitmentState({ pityCounter, ...recruitmentState }, recruitmentProgress, loadMercPool().banner);
  return { recruitmentState, recruitmentProgress: checked.progress };
}

/** Reject reserved fields in every historical input before migration can drop them. */
export function rejectPreRecruitmentState(value: unknown): void {
  if (value === null || typeof value !== 'object') return;
  const version: unknown = Object.getOwnPropertyDescriptor(value, 'version')?.value;
  if (typeof version !== 'number' || version < 1 || version > 32) return;
  const field = (object: object, key: string): unknown => {
    let owner: object | null = object;
    while (owner !== null) {
      const descriptor = Object.getOwnPropertyDescriptor(owner, key);
      if (descriptor) {
        if (!Object.hasOwn(descriptor, 'value')) throw new Error('Invalid recruitment historical accessor');
        return descriptor.value;
      }
      owner = Object.getPrototypeOf(owner) as object | null;
    }
    return undefined;
  };
  const meta = version === 1 ? value : field(value, 'meta'), mercs = field(value, 'mercs');
  for (const [container, key] of [[meta, 'recruitmentState'], [mercs, 'recruitmentProgress']] as const) {
    if (container !== null && typeof container === 'object' &&
      (key in container || (container instanceof Map && Map.prototype.has.call(container, key)))) {
      throw new Error('Invalid recruitment reserved historical state');
    }
  }
}
