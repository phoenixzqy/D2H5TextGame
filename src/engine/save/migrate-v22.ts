import type { SaveV21, SaveV22 } from '../types/save';
import { validateRespecSave } from './validate';

/** Freeze the complete v21 boundary before widening selection; no grants or resource changes. */
export function migrateSaveV22(old: SaveV21): SaveV22 {
  validateRespecSave(old);
  return { ...old, version: 22 };
}
