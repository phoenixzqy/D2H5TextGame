import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { formatDisplayStat, resolveSocketDisplayLines } from './itemDisplay';
import type { Item } from '@/engine/types/items';

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
  it('describes Exile as self-only defense without promising a party aura', () => {
    const item: Item = { id: 'display-exile', baseId: 'items/base/sh-monarch', rarity: 'runeword',
      level: 60, identified: true, equipped: false, socketCapacity: 4, runewordId: 'runewords/exile',
      socketContents: ['vex', 'ohm', 'ist', 'dol'].map(id => ({ kind: 'rune', id: `runes/${id}` })) };
    const lines = resolveSocketDisplayLines(item, i18n.getFixedT(locale, 'inventory'));
    const grant = lines.find(line => line.key === 'grant.aura-defiance');
    expect(grant?.value).toBe(.20);
    expect(grant?.text).toBe(locale === 'en' ? 'While equipped: +20% Defense (self only)' : '装备时：自身防御 +20%');
    expect(lines.filter(line => line.key === 'statMods.defense')).toHaveLength(1);
  });
  it.each([
    { word: 'leaf', base: 'weapon-staff', runes: ['tir', 'ral'],
      id: 'skill-fire-bolt.damage.fire', value: .12,
      en: 'While equipped: +12% Fire Damage (self only)', zh: '装备时：自身火焰伤害 +12%' },
    { word: 'dream', base: 'helm-war-hat', runes: ['io', 'jah', 'pul'],
      id: 'aura-holy-shock.damage.lightning', value: .15,
      en: 'While equipped: +15% Lightning Damage (self only)', zh: '装备时：自身闪电伤害 +15%' },
    { word: 'bramble', base: 'armor-archon-plate', runes: ['ral', 'ohm', 'sur', 'eth'],
      id: 'aura-thorns-aura', value: .2,
      en: 'While equipped: survive a direct physical hit to reflect 20% of Life lost as Thorns Damage (self only)',
      zh: '装备时：承受直接物理攻击后若存活，将所失生命的 20% 以荆棘伤害反弹（仅自身）' },
    { word: 'phoenix', base: 'sh-monarch', runes: ['vex', 'vex', 'lo', 'jah'],
      id: 'aura-redemption.recovery', value: .1,
      en: 'While equipped: +10% to existing Mana Regeneration (self only)',
      zh: '装备时：自身已有法力回复速率 +10%' }
  ])('describes implemented $word combat contribution with exact units', row => {
    const item: Item = { id: row.word, baseId: `items/base/${row.base}`, rarity: 'runeword',
      level: 70, identified: true, equipped: false, socketCapacity: row.runes.length,
      runewordId: `runewords/${row.word}`,
      socketContents: row.runes.map(id => ({ kind: 'rune', id: `runes/${id}` })) };
    const grant = resolveSocketDisplayLines(item, i18n.getFixedT(locale, 'inventory'))
      .find(line => line.key === `grant.${row.id}`);
    expect(grant?.value).toBe(row.value);
    expect(grant?.text).toBe(locale === 'en' ? row.en : row.zh);
  });
  it.each([
    { word: 'beast', base: 'wp2h-thunder-maul', runes: ['ber', 'tir', 'um', 'mal', 'lum'],
      id: 'skill-lycanthropy', value: .15,
      en: 'While equipped: +15% maximum Life and +5% Attack Speed (self only)',
      zh: '装备时：自身生命上限 +15%，攻击速度 +5%' },
    { word: 'last-wish', base: 'wp1h-legend-sword', runes: ['jah', 'mal', 'jah', 'sur', 'jah', 'ber'],
      id: 'skill-fade', value: 10,
      en: 'While equipped: +10 to all six resistances and +2.5% Magic Dodge (self only)',
      zh: '装备时：自身六系抗性 +10，魔法闪避 +2.5%' }
  ])('describes $word with exact self-only units', row => {
    const item: Item = { id: row.word, baseId: `items/base/${row.base}`, rarity: 'runeword',
      level: 70, identified: true, equipped: false, socketCapacity: row.runes.length,
      runewordId: `runewords/${row.word}`,
      socketContents: row.runes.map(id => ({ kind: 'rune', id: `runes/${id}` })) };
    const grant = resolveSocketDisplayLines(item, i18n.getFixedT(locale, 'inventory'))
      .find(line => line.key === `grant.${row.id}`);
    expect(grant?.value).toBe(row.value);
    expect(grant?.text).toBe(locale === 'en' ? row.en : row.zh);
    expect(grant?.label).toBe(locale === 'en' ? row.word === 'beast' ? 'Life' : 'All Resistances'
      : row.word === 'beast' ? '生命' : '所有抗性');
  });
});
