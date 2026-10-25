import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Suspense } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { STAT_AURA_IDS } from '@/engine/skills/stat-auras';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useMetaStore } from '@/stores/metaStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { SkillsScreen } from './SkillsScreen';

const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore, useMercStore, useFormationStore, useMetaStore] as const;
beforeEach(() => {
  abortSubAreaRun(); for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { cleanup(); abortSubAreaRun(); useHydrationStore.getState().setStatus('idle'); });
function mount(learned: boolean, level = 30) {
  const base = createMockPlayer('AuraUI', 'paladin');
  act(() => { usePlayerStore.getState().setPlayer({ ...base, level,
    skillLevels: learned ? Object.fromEntries(STAT_AURA_IDS.map(id => [id.replace(/-/g, '_'), 1])) : {} }); });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
}
for (const locale of ['en', 'zh-CN'] as const) {
  describe(`selected stat aura UI ${locale}`, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it('selects each learned aura explicitly, preserves all other player data and clears to None', () => {
      mount(true);
      const before = structuredClone(usePlayerStore.getState().player);
      const group = screen.getByRole('group', { name: locale === 'en' ? 'Aura for next wave' : '下一波光环' });
      for (const id of STAT_AURA_IDS) {
        const name = i18n.t(`paladin.${id.slice('paladin.'.length)}.name`, { ns: 'skills' });
        const radio = within(group).getByRole('radio', { name });
        expect(radio).toBeEnabled(); fireEvent.click(radio);
        expect(radio).toBeChecked();
        expect(within(group).getByRole('status')).toHaveTextContent(name);
        expect(usePlayerStore.getState().player).toEqual({ ...before, selectedAuraId: id });
      }
      fireEvent.click(within(group).getByRole('radio', { name: locale === 'en' ? 'None' : '无' }));
      expect(usePlayerStore.getState().player).toEqual(before);
    });
    it('disables unlearned auras and explains that rank bonuses require selection', () => {
      mount(false);
      for (const id of STAT_AURA_IDS) {
        const slug = id.slice('paladin.'.length);
        expect(screen.getByRole('radio', { name: i18n.t(`paladin.${slug}.name`, { ns: 'skills' }) })).toBeDisabled();
      }
      fireEvent.click(screen.getByTestId('skill-node-skills-paladin-resist-fire'));
      const detail = screen.getByTestId('skill-detail-panel');
      expect(within(detail).getByText(locale === 'en'
        ? 'These rank bonuses require selecting this aura.' : '这些等级加成仅在选择此光环时生效。')).toBeVisible();
      expect(detail).toHaveTextContent(locale === 'en'
        ? '+1 percentage point to all six resistances' : '全部六种抗性各增加1个百分点');
    });
    it('explains actual enemy effects and recipient rank bonuses for Freeze and Conviction', () => {
      mount(true);
      fireEvent.click(screen.getByTestId('skill-node-skills-paladin-holy-freeze'));
      const detail = screen.getByTestId('skill-detail-panel');
      expect(detail).toHaveTextContent(locale === 'en' ? 'Attack Speed by 50%' : '攻击速度降低50%');
      expect(detail).toHaveTextContent(locale === 'en' ? 'cold damage +3%' : '冰冷伤害+3%');
      expect(detail).toHaveTextContent(locale === 'en' ? 'Physical Dodge +0.5' : '物理闪避+0.5');
      fireEvent.click(screen.getByTestId('skill-node-skills-paladin-conviction'));
      expect(detail).toHaveTextContent(locale === 'en' ? 'all six enemy resistances by 25 percentage points' : '敌人全部六种抗性各降低25个百分点');
      expect(detail).toHaveTextContent(locale === 'en' ? 'elemental damage +2%' : '元素伤害+2%');
      expect(detail).toHaveTextContent(locale === 'en' ? 'arcane damage +1%' : '奥术伤害+1%');
      expect(detail).not.toHaveTextContent('{{');
    });
    it('explains actual Fire and Shock pulse timing, base damage, Burn and rank bonuses', () => {
      mount(true);
      for (const slug of ['holy-fire', 'holy-shock']) {
        fireEvent.click(screen.getByTestId('skill-node-skills-paladin-' + slug));
        const detail = screen.getByTestId('skill-detail-panel');
        expect(detail).toHaveTextContent(locale === 'en' ? 'every 1 second' : '每1秒');
        expect(detail).toHaveTextContent(locale === 'en' ? '20 base' : '20点基础');
        expect(detail).toHaveTextContent(locale === 'en' ? 'damage +3%' : '伤害+3%');
        if (slug === 'holy-fire') {
          expect(detail).toHaveTextContent(locale === 'en' ? '10% of mitigated pulse damage per second' : '每秒造成脉冲减伤后伤害的10%');
          expect(detail).toHaveTextContent(locale === 'en' ? '3 seconds' : '3秒');
        }
        expect(detail).not.toHaveTextContent('{{');
      }
    });
    it('explains Redemption actual corpse cost, life/mana recovery, timing, scaling and full-resource preservation', () => {
      mount(true);
      fireEvent.click(screen.getByTestId('skill-node-skills-paladin-redemption'));
      const detail = screen.getByTestId('skill-detail-panel');
      for (const text of locale === 'en'
        ? ['one corpse', 'every 5 seconds', '20 base HP', '10 base MP', '+2% per rank', 'living fielded mercenary', 'full resources', 'never revives']
        : ['一具尸体', '每5秒', '20点基础生命', '10点基础法力', '每级+2%', '存活的上阵佣兵', '资源全满', '不会复活']) expect(detail).toHaveTextContent(text);
      expect(detail).not.toHaveTextContent('{{');
    });
    it('explains Cleansing finite one-time duration reduction, independent recovery and magical dodge', () => {
      mount(true);
      fireEvent.click(screen.getByTestId('skill-node-skills-paladin-cleansing'));
      const detail = screen.getByTestId('skill-detail-panel');
      for (const text of locale === 'en'
        ? ['50%', 'finite', 'once', 'Poison', 'Plague', 'Amplify Damage', 'every 5 seconds', '20 base HP', '+1.5% per rank', 'Magical Dodge +0.5', 'living fielded mercenary']
        : ['50%', '有限', '一次', '中毒', '瘟疫', '伤害加深', '每5秒', '20点基础生命', '每级+1.5%', '魔法闪避+0.5', '存活的上阵佣兵']) {
        expect(detail).toHaveTextContent(text);
      }
      expect(detail).not.toHaveTextContent('{{');
    });
    it('explains actual Prayer healing, first interval, rank scaling and living recipient restrictions', () => {
      mount(true);
      fireEvent.click(screen.getByTestId('skill-node-skills-paladin-prayer'));
      const detail = screen.getByTestId('skill-detail-panel');
      for (const text of (locale === 'en'
        ? ['every 5 seconds', '20 base HP', '+3% per rank', 'living fielded mercenary', 'first heal after 5 seconds', 'rounded down', 'missing HP']
        : ['每5秒', '20点基础生命', '每级+3%', '存活的上阵佣兵', '首次治疗在5秒后', '向下取整', '已损失生命'])) expect(detail).toHaveTextContent(text);
      expect(detail).not.toHaveTextContent('{{');
    });
    it('lets a fresh level-one Paladin learn then explicitly select Prayer without a refill or automatic selection', () => {
      mount(false, 1);
      const before = structuredClone(usePlayerStore.getState().player);
      const radio = screen.getByRole('radio', { name: locale === 'en' ? 'Prayer' : '祈祷' });
      expect(radio).toBeDisabled();
      fireEvent.click(screen.getByTestId('skill-node-skills-paladin-prayer'));
      fireEvent.click(within(screen.getByTestId('skill-detail-panel')).getByRole('button'));
      expect(usePlayerStore.getState().player?.skillLevels).toEqual({ 'paladin.prayer': 1 });
      expect(usePlayerStore.getState().player?.skillPoints).toBe(0);
      expect(usePlayerStore.getState().player).not.toHaveProperty('selectedAuraId');
      expect(usePlayerStore.getState().player?.derivedStats).toEqual(before?.derivedStats);
      expect(radio).toBeEnabled(); fireEvent.click(radio);
      expect(usePlayerStore.getState().player?.selectedAuraId).toBe('paladin.prayer');
      expect(usePlayerStore.getState().player?.derivedStats).toEqual(before?.derivedStats);
    });
  });
}
