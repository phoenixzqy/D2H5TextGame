import Ajv2020 from 'ajv/dist/2020';
import document from '../quests/cow-runtime.json';
import { compileAuthoredValidator } from '../authored-validators';

const validator = compileAuthoredValidator(new Ajv2020({ strict: true, allErrors: true }), 'cow');
if (!validator(document)) throw new Error('Invalid finite Cow portal source contracts');

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}

/** Validated immutable leaf manifest; source resolution never imports a quest loader. */
export const cowRuntime = deepFreeze(document);
