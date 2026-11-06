import Ajv2020 from 'ajv/dist/2020';
import { compileAuthoredValidator } from '../authored-validators';
import data from '../progression/kill-xp.json';

const validate = compileAuthoredValidator(new Ajv2020({ strict: true, allErrors: true }), 'killXp');
if (!validate(data)) throw new Error('Invalid kill XP policy');

/** Validated shared reward knobs; historical XP and level costs are independent. */
export const KILL_XP_POLICY = Object.freeze({ ...data });
