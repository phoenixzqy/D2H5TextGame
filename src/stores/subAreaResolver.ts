/**
 * Sub-area data resolver — translates the various sub-area identifier
 * forms used in the codebase to a canonical {@link SubAreaDef} from the
 * JSON dataset.
 *
 * Lookup order (first match wins):
 *   1. exact id (already in `areas/...` form)
 *   2. `areas/${alias}`
 *   3. `areas/act${act}-${slug}` where `slug = alias.replace(/^a\d+-/, '')`
 *
 * Returns `null` if no match is found, in which case callers should fall
 * back to a synthetic plan (see {@link import('@/engine/combat').synthDefaultPlan}).
 *
 * @module stores/subAreaResolver
 */

import { subAreas as subAreaList } from '@/data/index';
import type { SubAreaDef } from '@/engine/types/maps';

let cached: ReadonlyMap<string, SubAreaDef> | null = null;

function getMap(): ReadonlyMap<string, SubAreaDef> {
  if (cached) return cached;
  const m = new Map<string, SubAreaDef>();
  for (const sa of subAreaList) {
    m.set(sa.id, sa);
  }
  cached = m;
  return m;
}

/** Resolve a sub-area by id/alias, or `null` when not found. */
export function resolveSubArea(
  act: number,
  alias: string | null
): SubAreaDef | null {
  if (!alias) return null;
  const map = getMap();
  const candidates = [
    alias,
    `areas/${alias}`,
    `areas/act${String(act)}-${alias.replace(/^a\d+-/, '')}`
  ];
  for (const id of candidates) {
    const sa = map.get(id);
    if (sa) return sa;
  }
  return null;
}

/**
 * List sub-areas for an act in their JSON declaration order.
 * Used by the UI's "Continue to next sub-area" CTA.
 */
export function listSubAreasForAct(act: number): readonly SubAreaDef[] {
  return subAreaList.filter((sa) => sa.actId === `acts/act${String(act)}`);
}

/**
 * Resolve the "next" sub-area within the same act (the area declared
 * immediately after `currentSubAreaId` in JSON order). Returns `null`
 * when current is the act's last area or not found.
 */
export function nextSubAreaInAct(
  act: number,
  currentId: string | null
): SubAreaDef | null {
  if (!currentId) return null;
  const list = listSubAreasForAct(act);
  const current = resolveSubArea(act, currentId);
  if (!current) return null;
  const idx = list.findIndex((sa) => sa.id === current.id);
  if (idx < 0 || idx >= list.length - 1) return null;
  return list[idx + 1] ?? null;
}
