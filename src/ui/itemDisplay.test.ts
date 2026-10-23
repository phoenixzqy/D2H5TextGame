import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { formatDisplayStat } from './itemDisplay';

describe.each(['en', 'zh-CN'] as const)('item bonus units %s', locale => {
  beforeEach(async () => { await i18n.changeLanguage(locale); });
  it.each([
    { path: 'statMods.critChance', value: 0.05, amount: '+5%' },
    { path: 'statMods.critDamage', value: 0.2, amount: '+20%' },
    { path: 'statMods.physDodge', value: 0.07, amount: '+7%' },
    { path: 'statMods.magicDodge', value: 0.025, amount: '+2.5%' },
    { path: 'statMods.attackSpeed', value: 25, amount: '+25' },
    { path: 'coreStats.energy', value: 5, amount: '+5' }
  ])('preserves raw $path while displaying $amount', ({ path, value, amount }) => {
    const line = formatDisplayStat({ path, value }, i18n.getFixedT(locale, 'inventory'));
    expect(line.value).toBe(value);
    expect(line.text).toBe(`${amount} ${line.label}`);
    expect(line.label).not.toContain('detail.stat.');
  });
});
