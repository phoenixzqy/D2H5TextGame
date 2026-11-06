import Ajv2020 from 'ajv/dist/2020';
import type { EquipmentGuarantee, EquipmentGuaranteePolicy } from '@/engine/loot/equipment-guarantees';
import { compileAuthoredValidator } from '../authored-validators';
import raw from '../loot/equipment-guarantees.json';

interface PolicyRow {
  readonly treasureClassId: string;
  readonly guarantees: readonly EquipmentGuarantee[];
}

const validate = compileAuthoredValidator<readonly PolicyRow[]>(new Ajv2020({ strict: true, allErrors: true }), 'equipmentGuarantees');
if (!validate(raw)) throw new Error('Invalid equipment guarantee policy');
const rows: readonly PolicyRow[] = raw;
if (new Set(rows.map(row => row.treasureClassId)).size !== rows.length) throw new Error('Duplicate equipment guarantee table');

/** Validated live-kill guarantees; source-table cross-references checked at pool assembly. */
export const EQUIPMENT_GUARANTEES: EquipmentGuaranteePolicy = new Map(rows.map(row => [
  row.treasureClassId, Object.freeze(row.guarantees.map(rule => Object.freeze({ ...rule })))
]));
