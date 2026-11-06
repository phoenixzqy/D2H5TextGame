import { afterEach, describe, expect, it, vi } from 'vitest';
import * as quests from '@/data/loaders/quests';
import { REGIONAL_BOUNTY_DOMAIN } from '@/engine/map/regional-bounties';
import { captureBountyAuthority, sameBountyAuthority } from './bountyContract';

afterEach(() => { vi.restoreAllMocks(); });
describe('canonical five regional bounty authoring', () => {
  it('pins the exact five canonical templates and notices later authoring changes', () => {
    const before = captureBountyAuthority();
    expect(before.map(quest => quest.id)).toEqual(REGIONAL_BOUNTY_DOMAIN.map(definition => definition.quest));
    expect(sameBountyAuthority(before)).toBe(true);
    const changed = quests.loadQuests().map(quest => quest.id === REGIONAL_BOUNTY_DOMAIN[0].quest
      ? { ...quest, description: `${quest.description} changed` } : quest);
    vi.spyOn(quests, 'loadQuests').mockReturnValue(changed);
    expect(sameBountyAuthority(before)).toBe(false);
  });
  it.each(['missing', 'duplicate', 'extra-bounty', 'wrong-type', 'wrong-act', 'extra-prerequisite', 'extra-unlock',
    'extra-giver', 'wrong-area', 'wrong-objective', 'wrong-count', 'extra-objective', 'extra-stage',
    'missing-reward', 'reward-zero', 'reward-extra', 'reward-xp'] as const)('rejects %s authoring', fault => {
      const rows = [...structuredClone(quests.loadQuests())], quest = rows.find(row => row.id === REGIONAL_BOUNTY_DOMAIN[0].quest);
      if (!quest) throw new Error('Missing bounty authoring fixture');
      const objective = quest.objectives[0]; if (!objective) throw new Error('Missing bounty objective fixture');
      if (fault === 'missing') rows.splice(rows.indexOf(quest), 1);
      if (fault === 'duplicate') rows.push(quest);
      if (fault === 'extra-bounty') rows.push({ ...quest, id: 'quests/bounty-future' });
      if (fault === 'wrong-type') Reflect.set(quest, 'type', 'side');
      if (fault === 'wrong-act') Reflect.set(quest, 'actId', 'acts/act2');
      if (fault === 'extra-prerequisite') Reflect.set(quest, 'prerequisites', []);
      if (fault === 'extra-unlock') Reflect.set(quest, 'unlocks', 'acts/act2');
      if (fault === 'extra-giver') Reflect.set(quest, 'giver', 'npc/akara');
      if (fault === 'wrong-area') Reflect.set(objective, 'areaId', 'areas/act1-cold-plains');
      if (fault === 'wrong-objective') Reflect.set(objective, 'id', 'obj-future');
      if (fault === 'wrong-count') Reflect.set(objective, 'count', 2);
      if (fault === 'extra-objective') Reflect.set(quest, 'objectives', [objective, { ...objective, id: 'obj-future' }]);
      if (fault === 'extra-stage') Reflect.set(quest, 'objectiveStages', [['obj-cull']]);
      if (fault === 'missing-reward') Reflect.deleteProperty(quest, 'rewards');
      if (fault === 'reward-zero') Reflect.set(quest, 'rewards', { gemShards: 0 });
      if (fault === 'reward-extra') Reflect.set(quest, 'rewards', { gemShards: 1, gold: 0 });
      if (fault === 'reward-xp') Reflect.set(quest, 'rewards', { gemShards: 1, xp: 0 });
      vi.spyOn(quests, 'loadQuests').mockReturnValue(rows);
      expect(captureBountyAuthority).toThrow('bounty');
    });
});
