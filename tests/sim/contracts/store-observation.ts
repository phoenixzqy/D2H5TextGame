import type { StoreApi } from 'zustand';

type Data<S> = { [K in keyof S as S[K] extends (...args: never[]) => unknown ? never : K]: S[K] };

/** Independently clone every nonfunction field, including Maps and optional fields. */
export function observeStore<S extends object>(store: Pick<StoreApi<S>, 'getState'>): Data<S> {
  return structuredClone(Object.fromEntries(Object.entries(store.getState())
    .filter(([, value]) => typeof value !== 'function'))) as Data<S>;
}

