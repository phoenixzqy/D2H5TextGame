import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { subAreas } from '@/data/index';
import type { ReplayProfileId } from '@/engine/map/replay-profile';
import { monsterLevelForReplay } from '@/engine/map/replay-profile';
import { NIGHTMARE_UNLOCK } from '@/engine/save/act5-campaign';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useCombatStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore } from '@/stores';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { MapScreen } from './MapScreen';

const stores = [useCombatStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore] as const;
const areas = [
  { profile: 'normal', id: 'areas/act1-blood-moor', alias: 'a1-blood-moor' },
  { profile: 'nightmare', id: 'areas/act1-cold-plains', alias: 'a1-cold-plains' },
  { profile: 'hell', id: 'areas/act1-dark-wood', alias: 'a1-dark-wood' }
] as const;

beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});

beforeEach(async () => {
  __resetPersistenceForTests(); abortSubAreaRun();
  stores.forEach(store => { store.getState().reset(); });
  usePlayerStore.getState().setPlayer(createMockPlayer('Replay map', 'sorceress'));
  useHydrationStore.getState().setStatus('ready');
  const { questProgress, questReceipts, questItems } = campaignEvidence();
  // Constructed valid history isolates UI integration; it is not an earned campaign.
  useMapStore.setState({ questProgress, questReceipts, questDifficulties: { [NIGHTMARE_UNLOCK]: true },
    clearedSubAreas: [areas[0].id], nightmareClearedSubAreas: [areas[1].id], hellClearedSubAreas: [areas[2].id] });
  useInventoryStore.setState({ questItems });
  await i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup(); abortSubAreaRun();
  stores.forEach(store => { store.getState().reset(); });
  __resetPersistenceForTests();
});

describe('MapScreen three-profile presentation', () => {
  it.each(['en', 'zh-CN'])('uses each exact clear namespace and native projected level in %s', async language => {
    await i18n.changeLanguage(language);
    const original = useMapStore.getState();
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={['/map']}>
        <MapScreen />
      </MemoryRouter>
    </Suspense></I18nextProvider>);
    await screen.findByTestId('map-screen');

    const assertProfile = (profile: ReplayProfileId) => {
      expect(useMapStore.getState().selectedDifficulty).toBe(profile);
      for (const area of areas) {
        const row = screen.getByTestId(`sub-area-row-${area.alias}`);
        const data = subAreas.find(candidate => candidate.id === area.id);
        if (!data) throw new Error(`Missing canonical area ${area.id}`);
        const expectedLevel = monsterLevelForReplay(data.areaLevel, profile);
        expect(within(row).getByText(i18n.t('map:recommendedLevel', { level: expectedLevel }), { exact: false })).toBeInTheDocument();
        if (area.profile === profile) {
          expect(within(row).getByTestId(`cleared-badge-${area.alias}`)).toBeInTheDocument();
          expect(within(row).getByTestId(`farm-here-${area.alias}`)).toBeEnabled();
          expect(within(row).queryByTestId(`farm-locked-${area.alias}`)).toBeNull();
        } else {
          expect(within(row).getByTestId(`uncleared-badge-${area.alias}`)).toBeInTheDocument();
          expect(within(row).getByTestId(`farm-locked-${area.alias}`)).toBeDisabled();
          expect(within(row).queryByTestId(`farm-here-${area.alias}`)).toBeNull();
        }
      }
    };

    assertProfile('normal');
    for (const profile of ['nightmare', 'hell', 'normal'] as const) {
      const control = screen.getByTestId(`replay-profile-${profile}`);
      expect(control).toBeEnabled();
      act(() => { fireEvent.click(control); });
      assertProfile(profile);
    }
    expect(useMapStore.getState().clearedSubAreas).toBe(original.clearedSubAreas);
    expect(useMapStore.getState().nightmareClearedSubAreas).toBe(original.nightmareClearedSubAreas);
    expect(useMapStore.getState().hellClearedSubAreas).toBe(original.hellClearedSubAreas);
    expect(useMapStore.getState().challengeOrdinals).toBe(original.challengeOrdinals);
  });
});
