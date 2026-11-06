import Ajv2020 from 'ajv/dist/2020';
import { compileFirstErrorAuthoredValidator } from '../authored-validators';
import data from '../respec.json';

const validate = compileFirstErrorAuthoredValidator(new Ajv2020({ strict: true }), 'respec');
if (!validate(data)) throw new Error('Invalid respec policy');
/** Authored independent reset allowances and current-town service identities. */
export const RESPEC_POLICY = Object.freeze({ ...data, townNpcs: Object.freeze({ ...data.townNpcs }) });
