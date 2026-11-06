import Ajv2020 from 'ajv/dist/2020';
import profileJson from '../quest-rewards/act3-gidbinn-ring-v1.json';
import { compileAuthoredValidator } from '../authored-validators';
import type { QuestUniqueProfile } from '@/engine/loot/quest-unique';

const ajv = new Ajv2020({ strict: true, allErrors: true });
const validate = compileAuthoredValidator<QuestUniqueProfile>(ajv, 'questUnique');

/** Load the closed v1 content profile; reject compatibility drift before selection. */
export function loadQuestUniqueProfile(): QuestUniqueProfile {
  if (!validate(profileJson)) {
    throw new Error(`Invalid quest unique profile: ${ajv.errorsText(validate.errors)}`);
  }
  return Object.freeze({ ...profileJson, entries: Object.freeze(
    profileJson.entries.map(entry => Object.freeze({ ...entry }))
  ) });
}
