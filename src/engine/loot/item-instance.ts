import type { Rng } from '../rng';
import type { Affix, Item, SetPieceDef, UniqueItemDef } from '../types/items';
import type { DropResult } from './drop-roller';
import { rollItem, __resetRollItemSeqForTests, type ItemRollPools } from './rollItem';
export type JsonAffix = Affix;
export type JsonUnique = UniqueItemDef;
export type JsonSetPiece = SetPieceDef;
export interface ItemDataPools extends ItemRollPools { readonly uniques?: readonly JsonUnique[]; readonly setPieces?: readonly JsonSetPiece[] }
export function __resetItemSeqForTests(): void { __resetRollItemSeqForTests(); }
export function generateItem(drop: DropResult, pools: ItemDataPools, rng: Rng): Item | undefined { return rollItem(drop, pools, rng); }
