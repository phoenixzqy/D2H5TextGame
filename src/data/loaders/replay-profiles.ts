import Ajv2020 from 'ajv/dist/2020';
import data from '../maps/replay-profiles.json';
import schema from '../schema/replay-profiles.schema.json';
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
if (!validate(data)) throw new Error('Invalid replay profiles');
/** Finite level-only profiles, validated once at the content boundary. */
export const replayProfiles = Object.freeze({ normal: Object.freeze(data.normal), nightmare: Object.freeze(data.nightmare), hell: Object.freeze(data.hell) });
