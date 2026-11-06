import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import schema from '../schema/cow-runtime.schema.json';
import document from '../quests/cow-runtime.json';
import { cowRuntime } from './cow-runtime';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);

describe('finite Cow leaf runtime manifest', () => {
  it('admits its exact manifest and deeply freezes source and recipe authority', () => {
    expect(validate(document)).toBe(true);
    expect(cowRuntime).toEqual(document);
    expect(Object.isFrozen(cowRuntime)).toBe(true);
    expect(Object.isFrozen(cowRuntime.recipe.inputs[0])).toBe(true);
    expect(Object.isFrozen(cowRuntime.actions.receiveTome)).toBe(true);
  });
  it.each(['host', 'encounter', 'victory', 'tool', 'input', 'recipe', 'npc', 'action', 'extra'])(
    'rejects changed %s authority', fault => {
      const copy = structuredClone(document);
      if (fault === 'host') copy.hostAreaId = 'areas/act1-cold-plains';
      if (fault === 'encounter') copy.encounterId = 'act1-bm-countess';
      if (fault === 'victory') copy.victoryReceipt += '-forged';
      if (fault === 'tool') copy.recipe.requiredTool.source += '-forged';
      if (fault === 'input') Reflect.set(copy.recipe.inputs[0] ?? {}, 'source', 'forged');
      if (fault === 'recipe') copy.recipe.id = 'forged';
      if (fault === 'npc') copy.actions.receiveTome.npcId = 'npc/charsi';
      if (fault === 'action') copy.actions.openPortal.receiptSource += '-forged';
      if (fault === 'extra') Reflect.set(copy.actions, 'repeat', copy.actions.openPortal);
      expect(validate(copy)).toBe(false);
    });
});
