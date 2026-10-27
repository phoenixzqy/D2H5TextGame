import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import skills from '@/data/skills/assassin.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, playerToCombatUnit } from '@/stores/combatHelpers';
import { useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore, useFormationStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit, ActiveStatus } from '@/engine/combat/types';
import { CombatScreen } from '@/features/combat/CombatScreen';
const stores = [useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore, useFormationStore];
beforeEach(() => { abortSubAreaRun(); for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); abortSubAreaRun(); for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) for (const rank of [1, 20])
  it(`shows actual paid Flight rank${String(rank)} lifetime and expiry in ${locale}`, async () => {
    await i18n.changeLanguage(locale);
    const alias = 'skills-assassin-dragon-flight', levels = Object.fromEntries(skills.map(row => [row.id, 1]));
    levels[alias] = rank;
    const player = { ...createMockPlayer('Constructed Flight feedback', 'assassin'), id: 'hero', level: 30,
      skillLevels: levels, comboOrder: [alias] };
    usePlayerStore.getState().setPlayer(player);
    const native = playerToCombatUnit(player);
    const hold: ActiveStatus = { id: 'stun', sourceId: 'constructed-hold', stacks: 1, remaining: -1 };
    const hero: CombatUnit = { ...native, life: 2000, mana: 1000, manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
      stats: { ...native.stats, lifeMax: 2000, manaMax: 1000, attackSpeed: 100, critChance: 0 },
      statuses: [{ ...hold, appliedAtMs: 1701 }] };
    const enemy: CombatUnit = { id: 'target', name: 'Constructed target', side: 'enemy', kind: 'monster', tier: 'trash',
      level: 30, life: 99999, mana: 0, stats: { ...hero.stats, lifeMax: 99999 },
      skillOrder: [], skillLevels: {}, cooldowns: {}, activeBuffIds: [], statuses: [hold], enraged: false };
    const out = runBattleRecorded({ seed: 19, playerTeam: [hero], enemyTeam: [enemy] });
    const observations = out.events.filter(e => e.kind === 'status-state').filter(e => e.target === 'hero');
    const id = 'dragon-flight', seconds = 1;
    const gain = observations.find(e => e.statuses.some(s => s.id === id));
    const expiry = observations.find(e => e.simClockMs === 1700 + seconds * 1000 && !e.statuses.some(s => s.id === id));
    if (!gain || !expiry) throw new Error('Missing actual paid Flight observations');
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
    useCombatStore.setState({ inCombat: true, isPaused: true,
      playerTeam: [{ ...hero, statuses: gain.statuses }], enemyTeam: [enemy] });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}><MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CombatScreen /></MemoryRouter></Suspense></I18nextProvider>);
    const card = screen.getByTestId('unit-card-hero'), name = locale === 'en' ? 'Dragon Flight' : '龙飞';
    const label = `${name} · ${String(seconds)}${locale === 'en' ? 's' : '秒'}`;
    expect(within(card).getByText(label)).toHaveClass('text-blue-200');
    expect(within(card).getByTestId('unit-effect-chips').textContent).not.toMatch(/trap-|skills:|undefined|NaN/);
    act(() => { useCombatStore.setState({ playerTeam: [{ ...hero, statuses: expiry.statuses }] }); });
    expect(within(card).queryByText(label)).not.toBeInTheDocument();
  });
