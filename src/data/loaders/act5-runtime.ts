import Ajv2020 from 'ajv/dist/2020';
import document from '../quests/act5-runtime.json';
import { compileAuthoredValidator } from '../authored-validators';
const validator = compileAuthoredValidator(new Ajv2020({ strict: true, allErrors: true }), 'act5');
if (!validator(document)) throw new Error('Invalid finite Act V source contracts');
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}
/** Validated, deeply immutable authored source manifests. */
export const act5Runtime = deepFreeze(document);
