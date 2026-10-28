/** BUG347: project the real native settlement log into the actual UI. No earned play. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { xpForKill, xpRequired, xpTotal } from '@/engine/progression/xp';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore, type CombatLogEntry } from '@/stores/combatStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { CombatScreen } from '@/features/combat/CombatScreen';

const stores = [usePlayerStore, useInventoryStore, useMercStore, useMapStore, useMetaStore, useFormationStore] as const;
let language = 'zh-CN';
function reset() {
  abortSubAreaRun(); __resetPersistenceForTests(); useCombatStore.getState().reset();
  for (const store of stores) store.getState().reset();
}
beforeEach(() => {
  language = i18n.language; reset(); loadDefaultSkills();
  // Disclosed deterministic combat control; production enemy, XP and settlement paths stay native.
  registerSkill({ id: 'fixture.level-up-log-finisher', archetype: 'fixture', target: 'all-enemies', cooldown: 1,
    manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [100_000, 100_000] }] });
  const hero = createMockPlayer('Level-up log', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, experience: xpRequired(hero.level) - 1,
    comboOrder: ['fixture.level-up-log-finisher'] });
  useHydrationStore.getState().setStatus('ready');
});
afterEach(async () => { cleanup(); reset(); resetRegistry(); await i18n.changeLanguage(language); });

describe('native level-up combat log localization', () => {
  it.each(['en', 'zh-CN'] as const)('shows the actual reached level in %s without changing earned XP', async locale => {
    await i18n.changeLanguage(locale);
    const hero = usePlayerStore.getState().player; if (!hero) throw new Error('Missing hero');
    const before = xpTotal(hero.level) + hero.experience;
    const run = startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', runSeed: 7, mode: 'idle', challengeOrdinal: 0 });
    expect(run).not.toBeNull();
    for (const _event of useCombatStore.getState().recordedEvents) useCombatStore.getState().advanceEvent();
    const outcome = useCombatStore.getState().outcome;
    expect(useCombatStore.getState().playbackComplete).toBe(true); expect(outcome?.winner).toBe('player');
    if (!outcome) throw new Error('Missing native outcome');
    const expectedXp = outcome.finalEnemyTeam.filter(enemy => enemy.life <= 0)
      .reduce((sum, enemy) => sum + xpForKill(enemy.level), 0);
    const seen = new Set(useCombatStore.getState().log.map(entry => entry.id));
    const emitted: CombatLogEntry[] = [];
    const stop = useCombatStore.subscribe(state => {
      for (const entry of state.log) if (!seen.has(entry.id)) { seen.add(entry.id); emitted.push(entry); }
    });
    try { expect(advanceWaveOrFinish()).toBe('next-wave'); } finally { stop(); }
    const current = usePlayerStore.getState().player; if (!current) throw new Error('Missing progressed hero');
    expect(current.level).toBeGreaterThan(hero.level);
    expect(xpTotal(current.level) + current.experience).toBe(before + expectedXp);
    const expected = locale === 'en' ? `Level up! You are now level ${String(current.level)}`
      : `升级！现在是 ${String(current.level)} 级`;
    const entry = emitted.find(row => row.type === 'system' && row.message === expected);
    expect(entry).toMatchObject({ type: 'system', actorId: 'system',
      actorName: locale === 'en' ? 'System' : '系统', message: expected });
    if (!entry) throw new Error('Native settlement did not emit a localized level-up log');
    expect(emitted.some(row => row.message.includes('combat:levelUp'))).toBe(false);
    // The next wave resets its log. Project the unmodified observed payload to verify rendering.
    act(() => { useCombatStore.setState({ log: [entry], isPaused: true }); });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CombatScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    expect(screen.getByRole('log')).toHaveTextContent(expected);
    expect(screen.getByRole('log')).not.toHaveTextContent('combat:levelUp');
  });
});
