import { afterEach, beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import { chooseSkill } from '@/engine/ai/policy';
import { getSkill, loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import en from '@/i18n/locales/en/mercs.json';
import zh from '@/i18n/locales/zh-CN/mercs.json';
import enSkills from '@/i18n/locales/en/skills.json';
import zhSkills from '@/i18n/locales/zh-CN/skills.json';
import { playerToCombatUnit } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';

const def = loadMercPool().pool.find(row => row.id === 'mercs/act2-prayer');
if (!def) throw new Error('Missing authored Prayer mercenary');
const hold = { id: 'stun', stacks: 1, sourceId: 'constructed-hold', remaining: -1 };
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it('gives the real recruited Prayer merc flat party healing each second without casting', () => {
  const nativeHero = playerToCombatUnit(createMockPlayer('Prayer', 'sorceress'));
  const hero = { ...nativeHero, life: 50, skillOrder: [], statuses: [hold],
    stats: { ...nativeHero.stats, lifeMax: 100 } };
  const nativeMerc = mercToCombatUnit(createMercFromDef(def, 'prayer-regression'));
  const merc = { ...nativeMerc, statuses: [hold] };
  const enemy = { ...hero, id: 'attacker', side: 'enemy' as const, kind: 'monster' as const,
    life: 100000, stats: { ...hero.stats, lifeMax: 100000 } };
  const snapshot = { seed: 7, playerTeam: [hero, merc], enemyTeam: [enemy] };
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  const heals = out.events.filter(e => e.kind === 'heal' && e.target === hero.id);
  expect(heals.slice(0, 3)).toEqual([
    expect.objectContaining({ amount: 5, simClockMs: 1000 }),
    expect.objectContaining({ amount: 5, simClockMs: 2000 }),
    expect.objectContaining({ amount: 5, simClockMs: 3000 })
  ]);
  expect(heals.every(e => e.simClockMs >= 1000)).toBe(true);
  expect(getSkill('aura-prayer')).toMatchObject({ trigger: 'passive', effects: [] });
  expect(chooseSkill(nativeMerc, true)).toBe('mskill-jab');
  expect(out.events.some(e => e.kind === 'action' && e.skillId === 'aura-prayer')).toBe(false);
  expect(snapshot).toEqual(before);
  expect(runBattleRecorded(snapshot)).toEqual(out);
});

it('qualifies only the native identity with its aura and a valid level', () => {
  const owned = createMercFromDef(def, 'owned');
  expect(mercToCombatUnit(owned)).toHaveProperty('mercPrayerAura', true);
  expect(mercToCombatUnit({ ...owned, id: 'mercs/act2-defiance#forged' }))
    .not.toHaveProperty('mercPrayerAura');
  const noAura = { ...owned, comboOrder: ['mskill-jab'] };
  delete noAura.signatureSkillId;
  expect(mercToCombatUnit(noAura)).not.toHaveProperty('mercPrayerAura');
  for (const level of [0, NaN, Infinity, 1.5]) {
    expect(mercToCombatUnit({ ...owned, level })).not.toHaveProperty('mercPrayerAura');
  }
});

it('describes flat five HP each second in both locale surfaces', () => {
  for (const text of [en.byId['act2-prayer'].lore, enSkills.mercenary.prayer.desc]) {
    expect(text).toContain('5 HP every second');
    expect(text).not.toContain('%');
  }
  for (const text of [zh.byId['act2-prayer'].lore, zhSkills.mercenary.prayer.desc]) {
    expect(text).toContain('每秒恢复5点生命');
    expect(text).not.toContain('%');
  }
});
