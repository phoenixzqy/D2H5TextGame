import {
  planMaterialAction,
  type MaterialActionContext,
  type MaterialActionInventory,
  type MaterialActionPlan,
  type MaterialActionRequest
} from '@/engine/crafting/material-actions';
import { beginMaterialTransaction, endMaterialTransaction } from './waveTransitionGuard';

/** Authoritative synchronous inventory boundary; restore must replace the complete snapshot. */
export interface MaterialActionPort {
  hydrationReady: () => boolean;
  read: () => { inventory: MaterialActionInventory; context: MaterialActionContext };
  publish: (next: MaterialActionInventory) => void;
  restore: (snapshot: MaterialActionInventory) => void;
  onReleased: (wakeSave: boolean) => void;
}

/** Both failures remain available; this outcome must never be retried against partial state. */
export class MaterialActionRestorationError extends AggregateError {
  constructor(publicationError: unknown, restorationError: unknown) {
    super([publicationError, restorationError], 'Material publication and rollback failed');
    this.name = 'MaterialActionRestorationError';
  }
}

/** Hold shared ownership from live preflight through publication and every rollback attempt. */
export function runMaterialActionTransaction(port: MaterialActionPort, request: MaterialActionRequest): MaterialActionPlan {
  const lease = beginMaterialTransaction(port.hydrationReady());
  let outcome: { ok: true; plan: MaterialActionPlan } | { ok: false; error: unknown };
  try {
    const { inventory, context } = port.read();
    const plan = planMaterialAction(inventory, context, request);
    if (plan.next) {
      const snapshot = structuredClone(inventory);
      try {
        port.publish(plan.next);
      } catch (error) {
        try {
          port.restore(snapshot);
        } catch (rollbackError) {
          throw new MaterialActionRestorationError(error, rollbackError);
        }
        throw error;
      }
    }
    outcome = { ok: true, plan };
  } catch (error) {
    outcome = { ok: false, error };
  }
  const wakeSave = endMaterialTransaction(lease);
  try {
    port.onReleased(wakeSave);
  } catch (error) {
    if (!outcome.ok) throw new AggregateError([outcome.error, error], 'Material action and release notification failed');
    throw error;
  }
  if (!outcome.ok) throw outcome.error;
  return outcome.plan;
}
