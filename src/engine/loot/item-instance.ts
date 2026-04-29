import type { Rng } from '../rng';
import type { Affix, Item } from '../types/items';
import type { DropResult } from './drop-roller';
import { rollItem, __resetRollItemSeqForTests, type ItemRollPools } from './rollItem';
export type JsonAffix = Affix;
export interface JsonUnique { readonly id: string; readonly name: string; readonly baseId: string; readonly reqLevel: number; readonly stats?: unknown }
export interface JsonSetPiece { readonly id: string; readonly setId: string; readonly baseId: string }
export interface ItemDataPools extends ItemRollPools { readonly uniques?: readonly JsonUnique[]; readonly setPieces?: readonly JsonSetPiece[] }
export function __resetItemSeqForTests(): void { __resetRollItemSeqForTests(); }
export function generateItem(drop: DropResult, pools: ItemDataPools, rng: Rng): Item | undefined { return rollItem(drop, pools, rng); }
