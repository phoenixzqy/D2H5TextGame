import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore, useInventoryStore, useMapStore, useCombatStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { TownRespecPanel } from './TownRespecPanel';

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  useCombatStore.getState().reset(); useMapStore.getState().reset(); useInventoryStore.getState().reset();
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Reset', 'sorceress'));
});
describe.each(['en', 'zh-CN'])('town reset confirmation %s', locale => {
  it('cancels without mutation, then explicitly refunds and shows remaining uses', async () => {
    await i18n.changeLanguage(locale);
    render(<I18nextProvider i18n={i18n}><TownRespecPanel npcId="npc/akara" /></I18nextProvider>);
    const before = usePlayerStore.getState().player;
    fireEvent.click(screen.getByTestId('town-reset-skill'));
    expect(screen.getByRole('dialog')).toHaveTextContent(locale === 'en' ? 'Refund 2 skill points' : '返还 2 点技能点');
    fireEvent.click(screen.getByTestId('town-reset-cancel'));
    expect(usePlayerStore.getState().player).toBe(before);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('town-reset-skill'));
    fireEvent.click(screen.getByTestId('town-reset-confirm'));
    expect(usePlayerStore.getState().player).toMatchObject({ skillPoints: 3, skillLevels: {}, respecsRemaining: { stat: 3, skill: 2 } });
    expect(screen.getByTestId('town-reset-feedback')).toHaveTextContent(locale === 'en' ? 'Points refunded' : '点数已返还');
  });
  it('does not offer reset at another NPC', async () => {
    await i18n.changeLanguage(locale);
    render(<I18nextProvider i18n={i18n}><TownRespecPanel npcId="npc/kashya" /></I18nextProvider>);
    expect(screen.queryByTestId('town-respec')).not.toBeInTheDocument();
  });
});
