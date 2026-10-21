import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { createMockPlayer, type CharacterClass } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useMetaStore } from '@/stores/metaStore';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { SkillsScreen } from './SkillsScreen';

const stores = [usePlayerStore, useInventoryStore, useCombatStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
const copy = {
  en: { generic: (name: string, count: number) => `${name}: summon up to ${String(count)} allies.` },
  'zh-CN': { generic: (name: string, count: number) => `${name}：最多召唤 ${String(count)} 名随从。` }
} as const;
function arrange(cls: CharacterClass = 'druid', levels: Record<string, number> = { 'druid.raven': 2 }): void {
  act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Summon UI', cls),
    level: 30, skillPoints: 2, skills: [], skillLevels: levels, comboOrder: [] }); });
}
function mount(): void {
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
}
function detail(id: string): HTMLElement {
  fireEvent.click(screen.getByTestId(`skill-node-${id}`));
  return screen.getByTestId('skill-detail-panel');
}
beforeEach(() => {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
});
afterEach(() => { cleanup(); abortSubAreaRun(); });
// Canonical corpse-summon cases relocated unchanged before the D06 v1c switch.
for (const locale of ['en', 'zh-CN'] as const) {
  describe(`D06 corpse-summon preparation detail (${locale})`, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it.each([
      ['raise-skeleton', 'Raise Skeleton', '召唤骷髅', 1],
      ['raise-skeletal-mage', 'Raise Skeletal Mage', '召唤骷髅法师', 2],
      ['revive', 'Revive', '复生', 2]
    ] as const)('keeps the excluded %s generic summon description', (slug, en, zh, cap) => {
      arrange('necromancer', { [`necromancer.${slug.replace(/-/g, '_')}`]: 2 }); mount();
      const panel = detail(`skills-necromancer-${slug}`);
      expect(panel).toHaveTextContent(copy[locale].generic(locale === 'en' ? en : zh, cap));
      expect(panel).not.toHaveTextContent(locale === 'en' ? 'once at each wave start' : '每波开始仅准备一次');
    });
  });
}
