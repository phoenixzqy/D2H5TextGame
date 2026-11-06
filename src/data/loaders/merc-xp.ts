import Ajv2020 from 'ajv/dist/2020';
import { compileAuthoredValidator } from '../authored-validators';
import data from '../progression/merc-xp.json';

const validate = compileAuthoredValidator(new Ajv2020({ strict: true, allErrors: true }), 'mercXp');
if (!validate(data)) throw new Error('Invalid mercenary XP policy');

/** Validated immutable costs for future thresholds; saved thresholds remain authoritative. */
export const MERC_XP_POLICY = Object.freeze({ ...data });
