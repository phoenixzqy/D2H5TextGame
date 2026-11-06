import { afterAll, expect, it, vi } from 'vitest';

vi.mock('../../data/skills/monsters.json', async importOriginal => {
  const original = await importOriginal<{ default: Record<string, unknown>[] }>();
  const rows = structuredClone(original.default);
  const row = rows.find(value => value.id === 'monster-summon-adds');
  if (!row) throw new Error('Missing Summon Adds fixture');
  row.cooldown = 7;
  return { default: rows };
});

vi.mock('../../data/summons/monster.json', async importOriginal => {
  const original = await importOriginal<{ default: { templates: { minion: { lifeMax: number; attack: number } } } }>();
  const data = structuredClone(original.default);
  data.templates.minion.lifeMax = 60;
  data.templates.minion.attack = 14;
  return { default: data };
});

import { DEFAULT_SKILLS } from './builders';
import { getSkill, loadDefaultSkills, resetRegistry } from './registry';
import { getSummonStats, buildSummon } from './summons';
import type { CombatUnit } from '../combat/types';

afterAll(() => {
  vi.doUnmock('../../data/skills/monsters.json');
  vi.doUnmock('../../data/summons/monster.json');
  vi.resetModules();
});

it('registers the authored Summon Adds cooldown without a hardcoded default', () => {
  resetRegistry(); loadDefaultSkills();
  expect(getSkill('monster-summon-adds')?.cooldown).toBe(7);
  expect(getSkill('monster.summon_adds')).toBe(getSkill('monster-summon-adds'));
  expect(DEFAULT_SKILLS.some(skill => skill.id === 'monster.summon_adds')).toBe(false);
});

it('uses the authored minion body for both previews and real template factories', () => {
  const stats = getSummonStats('minion');
  expect(stats).toMatchObject({ life: 60, lifeMax: 60, attack: 14 });
  if (!stats) throw new Error('Missing minion body');
  const owner: CombatUnit = { id: 'enemy', name: 'Owner', side: 'enemy', kind: 'monster', tier: 'boss',
    level: 71, stats: { ...stats, attack: 9999 }, life: 60, mana: 0, statuses: [], cooldowns: {},
    skillOrder: [], activeBuffIds: [], enraged: false, summonedAdds: false };
  expect(buildSummon(owner, 'minion')).toMatchObject({ level: 71, side: 'enemy', kind: 'summon',
    life: 60, stats: { lifeMax: 60, attack: 14 }, summonOwnerId: 'enemy', summonTemplateId: 'minion' });
});
