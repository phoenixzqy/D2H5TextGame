/** Controlled integration fixtures; native browser/save/earned acceptance is separate. */
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { SkillsScreen } from './SkillsScreen';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { deriveStats } from '@/engine/progression/stats';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMercStore } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useIronGolemSelectionStore } from '@/stores/ironGolemSelectionStore';
import { abortSubAreaRun } from '@/stores/combatHelpers';

const IRON = 'skills-necromancer-iron-golem';
const OTHER = 'skills-necromancer-blood-golem';
const text = (key: string) => i18n.t('skills:ironGolem.' + key);
const node = (id = IRON) => screen.getByTestId('skill-node-' + id);
const choose = () => fireEvent.change(screen.getByRole('combobox', { name: text('choose') }), { target: { value: 'chosen' } });
const ack = () => fireEvent.click(screen.getByRole('checkbox', { name: text('acknowledge') }));
const panel = () => screen.getByTestId('iron-golem-panel');
function mount() {
  return render(<I18nextProvider i18n={i18n}><MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter></I18nextProvider>);
}
function totals(testId: string, expected: readonly string[]) {
  const view = within(screen.getByTestId(testId));
  for (const value of expected) expect(view.getByText(value)).toBeVisible();
}
beforeEach(() => {
  abortSubAreaRun();
  for (const store of [useCombatStore, usePlayerStore, useInventoryStore, useMercStore, useMapStore, useMetaStore, useFormationStore]) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
  const coreStats = { strength: 15, dexterity: 25, vitality: 100, energy: 100 };
  usePlayerStore.getState().setPlayer({
    ...createMockPlayer('Skills fixture', 'necromancer'), id: 'skills-iron-hero', level: 24, coreStats,
    derivedStats: { ...deriveStats(coreStats, 24), mana: 35 }, skillPoints: 1,
    skillLevels: { 'necromancer.iron_golem': 6, 'necromancer.blood_golem': 1 }, comboOrder: [IRON]
  });
  useInventoryStore.setState({ backpack: [{ id: 'chosen', baseId: 'items/base/wp1h-short-sword', rarity: 'normal', level: 1, identified: true, equipped: false }] });
});
afterEach(() => { abortSubAreaRun(); useHydrationStore.getState().setStatus('idle'); });

describe.each(['en', 'zh-CN'])('committed Iron Golem controls in %s', (locale) => {
  beforeEach(async () => { await i18n.changeLanguage(locale); });
  it('requires committed selection, while previews only show labeled base stats', () => {
    mount();
    expect(screen.queryByTestId('iron-golem-panel')).toBeNull();
    fireEvent.mouseEnter(node());
    expect(within(screen.getByTestId('skill-detail-panel')).getByText(text('basePreview'))).toBeVisible();
    expect(screen.queryByTestId('iron-golem-panel')).toBeNull();
    fireEvent.mouseLeave(node());
    fireEvent.focus(node());
    expect(screen.queryByTestId('iron-golem-panel')).toBeNull();
    fireEvent.blur(node());
    fireEvent.click(node());
    expect(screen.getAllByTestId('iron-golem-panel')).toHaveLength(1);
    expect(screen.getByRole('combobox', { name: text('choose') })).toHaveValue('');
    expect(screen.getByRole('checkbox', { name: text('acknowledge') })).not.toBeChecked();
    expect(within(panel()).getByRole('heading', { name: text('title') })).toBeVisible();
  });
  it('preserves the mounted draft and acknowledgement through hover, focus and Tab restoration', () => {
    mount(); fireEvent.click(node()); choose(); ack();
    const original = panel(), select = screen.getByRole('combobox', { name: text('choose') });
    const inventory = useInventoryStore.getState(), combo = usePlayerStore.getState().player?.comboOrder;
    fireEvent.mouseEnter(node(OTHER));
    expect(within(screen.getByTestId('skill-detail-panel')).queryByText(text('basePreview'))).toBeNull();
    expect(panel()).toBe(original);
    fireEvent.mouseLeave(node(OTHER));
    fireEvent.focus(node(OTHER));
    fireEvent.keyDown(node(OTHER), { key: 'Tab' });
    expect(within(screen.getByTestId('skill-detail-panel')).getByText(text('basePreview'))).toBeVisible();
    fireEvent.blur(node(OTHER));
    act(() => { select.focus(); });
    expect(select).toHaveFocus();
    expect(select).toHaveValue('chosen');
    expect(screen.getByRole('checkbox', { name: text('acknowledge') })).toBeChecked();
    expect(panel()).toBe(original);
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
    expect(useInventoryStore.getState()).toBe(inventory);
    expect(usePlayerStore.getState().player?.comboOrder).toBe(combo);
  });
  it('resets local controls after a committed skill change while preserving an armed instruction', () => {
    mount(); fireEvent.click(node()); choose(); ack();
    const before = useInventoryStore.getState(), combo = usePlayerStore.getState().player?.comboOrder;
    fireEvent.click(screen.getByRole('button', { name: text('arm') }));
    const armed = useIronGolemSelectionStore.getState().selection;
    expect(armed).toEqual({ heroId: 'skills-iron-hero', itemId: 'chosen' });
    fireEvent.click(node(OTHER));
    expect(screen.queryByTestId('iron-golem-panel')).toBeNull();
    fireEvent.click(node());
    expect(screen.getByRole('combobox', { name: text('choose') })).toHaveValue('');
    expect(screen.getByRole('checkbox', { name: text('acknowledge') })).not.toBeChecked();
    expect(useIronGolemSelectionStore.getState().selection).toBe(armed);
    expect(screen.getByRole('status')).toHaveTextContent(i18n.t('skills:ironGolem.armed', { item: locale === 'en' ? 'Short Sword' : '短剑' }));
    fireEvent.click(screen.getByRole('button', { name: text('clear') }));
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
    expect(useInventoryStore.getState()).toBe(before);
    expect(usePlayerStore.getState().player?.derivedStats.mana).toBe(35);
    expect(usePlayerStore.getState().player?.comboOrder).toBe(combo);
  });
  it('keeps base rows separate and updates selected-item current/next totals after native allocation', () => {
    mount(); fireEvent.click(node()); choose();
    const detail = within(screen.getByTestId('skill-detail-panel'));
    expect(detail.getByText(text('basePreview'))).toBeVisible();
    const baseCurrent = detail.getByRole('heading', { name: i18n.t('skills:details.current') }).closest('section');
    if (!baseCurrent) throw new Error('Missing current base section');
    expect(within(baseCurrent).getByText('46')).toBeVisible();
    totals('iron-preview-current', ['340', '54', '63']);
    totals('iron-preview-next', ['356', '56', '66']);
    fireEvent.click(detail.getByRole('button', { name: i18n.t('skills:allocate') }));
    expect(usePlayerStore.getState().player?.skillLevels?.['necromancer.iron_golem']).toBe(7);
    expect(usePlayerStore.getState().player?.skillPoints).toBe(0);
    totals('iron-preview-current', ['356', '56', '66']);
    totals('iron-preview-next', ['372', '58', '69']);
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
  });
});
