/**
 * imageOverrides — presentation-layer escape hatch for manually pinning
 * a specific asset URL to a `{kind, id}` pair, bypassing the inferred
 * resolver logic in {@link ./cardAssets}.
 *
 * The data file lives at `src/data/imageOverrides.json` and is validated
 * at module-load time against `src/data/schema/image-overrides.schema.json`.
 * Validation failures throw loudly during import — there's no recovery.
 *
 * **Override wins over inference.** A miss returns `null` and the resolver
 * falls through to its existing behavior unchanged.
 *
 * Note: this lives outside `src/engine/` on purpose — the engine never
 * sees asset URLs. Override authoring is a UI/dev-tool concern.
 *
 * @module ui/imageOverrides
 */

import Ajv2020 from 'ajv/dist/2020';
import overridesJson from '../data/imageOverrides.json';
import overridesSchema from '../data/schema/image-overrides.schema.json';

/** The four kinds of subject we resolve art for. */
export type ImageOverrideKind = 'class' | 'monster' | 'item' | 'merc';

/** Shape of `src/data/imageOverrides.json`. */
export interface ImageOverridesFile {
  readonly version: 1;
  readonly overrides: Readonly<Record<ImageOverrideKind, Readonly<Record<string, string>>>>;
}

// ---- module-load validation -------------------------------------------------

const ajv = new Ajv2020({ strict: true, allErrors: true });
const validate = ajv.compile<ImageOverridesFile>(overridesSchema);

if (!validate(overridesJson)) {
  // Throw loudly — a malformed override file should never silently degrade.
  throw new Error(
    `[imageOverrides] src/data/imageOverrides.json failed schema validation: ${JSON.stringify(
      validate.errors,
      null,
      2
    )}`
  );
}

const FILE: ImageOverridesFile = overridesJson as ImageOverridesFile;

// ---- public API -------------------------------------------------------------

/**
 * Look up a curated override for `{kind, id}`.
 *
 * Key shapes (must match exactly what the corresponding resolver receives
 * **after** any prefix stripping it does internally):
 *
 * - `class`   → class slug (e.g. `barbarian`, `sorceress`). Same key space
 *               as `CLASS_PORTRAITS`.
 * - `monster` → `act<N>.<slug>` (e.g. `act1.fallen`, `act1.andariel`).
 *               Same key space as `MONSTER_ART`.
 * - `item`    → the *post-strip* key passed into `resolveItemIcon`,
 *               e.g. `unique.shako`, `base.wp1h-short-sword`, or a bare
 *               archetype like `sword`. No new ID space is introduced.
 * - `merc`    → the post-strip key consumed by `resolveMercArt`,
 *               i.e. either a canonical archetype (`rogue-archer`,
 *               `iron-wolf`, `desert-mercenary`, `barbarian-warrior`) or
 *               the merc id with `mercs/` already stripped (e.g.
 *               `act1-rogue-pierce`).
 *
 * @returns the override URL, or `null` if no entry exists.
 */
export function getImageOverride(
  kind: ImageOverrideKind,
  id: string
): string | null {
  if (!id) return null;
  const map = FILE.overrides[kind];
  const hit = map[id];
  return typeof hit === 'string' && hit.length > 0 ? hit : null;
}

/** Test-only: expose the validated file (read-only). */
export function _getImageOverridesFile(): ImageOverridesFile {
  return FILE;
}
