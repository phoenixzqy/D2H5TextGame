import Ajv2020 from 'ajv/dist/2020';
import schema from '../schema/respec.schema.json';
import data from '../respec.json';

const validate = new Ajv2020({ strict: true }).compile(schema);
if (!validate(data)) throw new Error('Invalid respec policy');
/** Authored independent reset allowances and current-town service identities. */
export const RESPEC_POLICY = Object.freeze({ ...data, townNpcs: Object.freeze({ ...data.townNpcs }) });
