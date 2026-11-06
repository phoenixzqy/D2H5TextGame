import { beforeAll, describe, expect, it } from 'vitest';
import { REGIONAL_BOUNTY_DOMAIN } from '@/engine/map/regional-bounties';
import { subAreas } from '@/data';
import i18n from '@/i18n';
import { loadQuests, questI18nKey } from './quests';

beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});

it.each(REGIONAL_BOUNTY_DOMAIN)('$key loads exactly one finite full-area cull with only the one-shard reward', definition => {
  const rows = loadQuests().filter(row => row.id === definition.quest);
  expect(rows).toHaveLength(1);
  const row = rows[0];
  expect(Object.keys(row ?? {}).sort()).toEqual(['actId', 'description', 'id', 'name', 'objectives', 'rewards', 'type']);
  expect(row).toMatchObject({ id: definition.quest, type: 'bounty', actId: definition.actId, rewards: { gemShards: 1 } });
  expect(row?.objectives).toHaveLength(1);
  expect(Object.keys(row?.objectives[0] ?? {}).sort()).toEqual(['areaId', 'count', 'description', 'id', 'type']);
  expect(row?.objectives[0]).toMatchObject({ id: 'obj-cull', type: 'clear-area', areaId: definition.area, count: 1 });
  expect(typeof row?.objectives[0]?.description).toBe('string');
  expect(subAreas.filter(area => area.id === definition.area && area.actId === definition.actId)).toHaveLength(1);
  expect(row?.description).toContain('Normal');
  expect(row?.description).toContain('manual');
  expect(row?.description).toContain('Claim');
  expect(row?.description).toContain('Repeat');
});

describe.each(['en', 'zh-CN'])('regional bounty copy %s', locale => {
  it('resolves all five exact template names and honest separate Accept/source/Claim/Repeat copy', () => {
    expect(loadQuests().filter(row => row.type === 'bounty').map(row => row.id)).toEqual(REGIONAL_BOUNTY_DOMAIN.map(row => row.quest));
    for (const definition of REGIONAL_BOUNTY_DOMAIN) {
      const slug = questI18nKey(definition.quest);
      for (const leaf of ['name', 'desc', 'obj1']) {
        const key = `byId.${slug}.${leaf}`;
        expect(i18n.exists(key, { ns: 'quests', lng: locale })).toBe(true);
        expect(i18n.t(key, { ns: 'quests', lng: locale })).not.toMatch(/byId\.|quests\/|undefined/);
      }
    }
    for (const leaf of ['accept', 'repeat', 'source', 'progress', 'claims', 'exhausted',
      'stage.never-accepted', 'stage.active', 'stage.completed', 'stage.paid',
      'feedback.ok', 'feedback.not-eligible', 'feedback.not-ready', 'feedback.no-player', 'feedback.combat-active',
      'feedback.claim-in-progress', 'feedback.grant-failed', 'feedback.exhausted', 'feedback.busy', 'feedback.restoration-failed']) {
      const key = `regionalBounty.${leaf}`;
      expect(i18n.exists(key, { ns: 'quests', lng: locale })).toBe(true);
      expect(i18n.t(key, { ns: 'quests', lng: locale, area: 'Target', done: 0, count: 0 })).not.toMatch(/regionalBounty\.|undefined/);
    }
  });
});
