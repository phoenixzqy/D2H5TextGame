import { Suspense } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useMapStore, usePlayerStore, useCombatStore, useInventoryStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { QuestItemsPanel } from '@/features/inventory/QuestItemsPanel';
import { AreaObjectsPanel } from './AreaObjectsPanel';

const quest = 'quests/act2-horadric-staff', tombQuest = 'quests/act2-seven-tombs';
const source = (id: string) => `${quest}#objective:obj-${id}`;
const hydration = useHydrationStore.getState();
beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});
beforeEach(() => {
  for (const domain of [useInventoryStore, useMapStore, useCombatStore]) domain.getState().reset();
  usePlayerStore.getState().setPlayer(createMockPlayer('Staff UI', 'sorceress'));
  useHydrationStore.getState().setStatus('ready');
  useMapStore.setState({ currentAct: 2, currentSubAreaId: 'areas/act2-far-oasis', clearedSubAreas: ['areas/act1-catacombs'],
    questProgress: {
      [quest]: { id: quest, status: 'inProgress', objectives: {
        'obj-cube': true, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } },
      [tombQuest]: { id: tombQuest, status: 'inProgress', objectives: { 'obj-open-tomb': false, 'obj-kill-duriel': false } }
    } });
  useInventoryStore.setState({ questItems: { [source('cube')]: { itemId: 'quest/horadric_cube', state: 'owned' } } });
});
afterEach(() => {
  for (const domain of [useInventoryStore, useMapStore, useCombatStore, usePlayerStore]) domain.getState().reset();
  useHydrationStore.setState(hydration);
});
function view(area: string) {
  return render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <AreaObjectsPanel act={2} areaId={area} onClose={() => undefined} /><QuestItemsPanel />
  </Suspense></I18nextProvider>);
}
describe.each(['en', 'zh-CN'])('Staff player actions %s', locale => {
  it('recovers, assembles and inserts with localized ownership/consumption, no Read on components', async () => {
    const en = locale === 'en'; await i18n.changeLanguage(locale);
    let rendered = view('areas/act2-far-oasis');
    const shaft = within(screen.getByTestId('area-object-panel')).getByTestId('quest-recover-quest/staff_of_kings');
    expect(shaft).toHaveAccessibleName(en ? 'Recover' : '取回');
    fireEvent.click(shaft);
    expect(useInventoryStore.getState().questItems[source('shaft')]).toEqual({ itemId: 'quest/staff_of_kings', state: 'owned' });
    rendered.unmount(); useMapStore.getState().setCurrentLocation(2, 'areas/act2-lost-city');
    rendered = view('areas/act2-lost-city');
    const objects = screen.getByTestId('area-object-panel');
    expect(within(objects).getByRole('button', { name: en ? 'Destroy altar' : '摧毁祭坛' })).toBeDisabled();
    const amulet = within(objects).getByTestId('quest-recover-quest/viper_amulet');
    expect(amulet).toHaveAccessibleName(en ? 'Recover' : '取回');
    fireEvent.click(amulet);
    const inventory = screen.getByTestId('quest-items-panel');
    expect(within(inventory).queryByRole('button', { name: en ? 'Read' : '阅读' })).toBeNull();
    const assemble = within(inventory).getByRole('button', { name: en ? 'Assemble Horadric Staff' : '合成赫拉迪克法杖' });
    expect(assemble).toBeEnabled(); fireEvent.click(assemble); expect(assemble).toBeDisabled();
    expect(inventory).toHaveTextContent(en ? 'Used in assembly' : '已用于合成');
    expect(inventory).toHaveTextContent(en ? 'Horadric Staff assembled.' : '赫拉迪克法杖已合成。');
    expect(useMapStore.getState().questProgress[quest]?.status).toBe('completed');
    rendered.unmount(); useMapStore.getState().setCurrentLocation(2, 'areas/act2-tomb-of-tal-rasha');
    rendered = view('areas/act2-tomb-of-tal-rasha');
    const insert = within(screen.getByTestId('area-object-panel')).getByRole('button', { name: en ? 'Insert Staff' : '嵌入法杖' });
    fireEvent.click(insert); expect(insert).toBeDisabled();
    expect(screen.getByTestId('area-object-panel')).toHaveTextContent(en ? 'Staff inserted. The chamber is open.' : '法杖已嵌入，墓室已开启。');
    expect(screen.getByTestId('quest-items-panel')).toHaveTextContent(en ? 'Used at its destination' : '已在目标地点使用');
    expect(screen.getByTestId('quest-items-panel').textContent).not.toMatch(/questItems\.|quest\/|undefined/);
    expect(useMapStore.getState().isActUnlocked(3)).toBe(false);
    // Restored ledger subscriptions update both consumption feedback and the action.
    act(() => { const ledger = useInventoryStore.getState().questItems;
      useInventoryStore.setState({ questItems: { ...ledger, [source('transmute')]: { itemId: 'quest/horadric_staff', state: 'owned' } } }); });
    expect(insert).toBeEnabled(); rendered.unmount();
  });
});
