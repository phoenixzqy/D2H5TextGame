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
function mount(learned: boolean) {
  const base = createMockPlayer('AuraUI', 'paladin');
  act(() => { usePlayerStore.getState().setPlayer({ ...base, level: 30,
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
  });
}
