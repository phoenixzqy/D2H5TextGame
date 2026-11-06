import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { monsters } from '@/data';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, playerToCombatUnit } from '@/stores/combatHelpers';
import { useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore, useFormationStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { runBattleRecorded } from '@/engine/combat/combat';
import { buildMonsterUnit } from '@/engine/combat/monster-factory';
import { createRng } from '@/engine/rng';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from '@/stores/combatPlayback';
import { eventToLocalizedLogEntry } from '@/stores/eventToLogI18n';
import { CombatScreen } from './CombatScreen';

const stores = [useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore, useFormationStore];
const cases = [['bone-prison', 'monsters/act1.bone-ash', 2000]] as const;
beforeEach(() => { abortSubAreaRun(); for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); abortSubAreaRun(); for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN']) for (const [key, archetype, duration] of cases)
  it(`replays actual monster ${key} as a localized finite trap in ${locale}`, async () => {
    await i18n.changeLanguage(locale);
    const player = { ...createMockPlayer('Constructed feedback', 'sorceress'), id: 'hero' };
    usePlayerStore.getState().setPlayer(player);
    const hold: ActiveStatus = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
    const baseHero = playerToCombatUnit(player);
    const hero = { ...baseHero, life: 100000, stats: { ...baseHero.stats, life: 100000, lifeMax: 100000, magicDodge: 0 }, skillOrder: [], statuses: [hold] };
    const def = monsters.find(row => row.id === archetype); if (!def) throw new Error('Missing native monster');
    const native = buildMonsterUnit({ def, level: 20, tier: 'trash', id: 'enemy', rng: createRng(7) });
    const enemy = { ...native, gridPosition: { row: 1, col: 1 }, life: 99999, stats: { ...native.stats, life: 99999, lifeMax: 99999, attackSpeed: 100 },
      skillOrder: ['monster-' + key], statuses: [{ ...hold, appliedAtMs: 1701 }] };
    const out = runBattleRecorded({ seed: 13, playerTeam: [hero], enemyTeam: [enemy] });
    const statusPlayback = stageStatusPlayback([hero], [enemy], out.events);
    if (!statusPlayback) throw new Error('Missing status prefix');
    let view: PlaybackStepResult = { playerTeam: [hero], enemyTeam: [enemy], statusPlayback };
    let paid: CombatUnit | undefined, expired = false;
    for (const event of out.events) {
      view = applyEventToTeams(view.playerTeam, view.enemyTeam, event, view.statusPlayback);
      if (event.kind === 'status-state' && event.target === 'hero' && event.simClockMs === 1700) {
        const body = view.playerTeam[0]; if (!body) throw new Error('Missing replay body');
        paid = { ...hero, statuses: body.statuses.map(s => ({ ...s })) };
        expect(paid.statuses).toContainEqual(expect.objectContaining({ id: 'monster-' + key,
          appliedAtMs: 1700, expiresAtMs: 1700 + duration }));
      }
      if (event.kind === 'status-state' && event.target === 'hero' && event.simClockMs === 1700 + duration)
        expired = !view.playerTeam[0]?.statuses.some(s => s.id === 'monster-' + key);
    }
    if (!paid) throw new Error('Missing actual paid observation');
    expect(expired).toBe(true);
    const label = i18n.t('skills:monster.' + key + '.name');
    const log = out.events.find(e => e.kind === 'status' && e.statusId === 'monster-' + key);
    if (!log) throw new Error('Missing paid trap event');
    expect(eventToLocalizedLogEntry(log, new Map([['hero', 'Hero']]))?.message).toContain(label);
    useCombatStore.setState({ inCombat: true, isPaused: true, playerTeam: [paid], enemyTeam: [enemy] });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}><MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CombatScreen /></MemoryRouter></Suspense></I18nextProvider>);
    const card = screen.getByTestId('unit-card-hero');
    expect(within(card).getByText(label)).toHaveClass('text-purple-200');
    expect(within(card).getByTestId('unit-effect-chips').textContent).not.toMatch(/monster-|skills:|undefined|NaN/);
    act(() => { useCombatStore.setState({ playerTeam: [hero] }); });
    expect(within(card).queryByText(label)).not.toBeInTheDocument();
  });
