/**
 * _setup.ts — Shared helpers for the bug-regression E2E suite.
 *
 * Imported by every spec under tests/e2e/playthrough/.
 * Re-exports the common helpers from the parent _helpers module and adds
 * regression-suite–specific utilities.
 *
 * Hooks added to window.__GAME__ (all gated to VITE_E2E=true):
 *   - window.__GAME__.seedItem()   (already in test-bridge.ts)
 *   - window.__GAME__.seedMerc()   (added to test-bridge.ts — seeds + fields a merc)
 *   - window.__GAME__.inventory    (already in test-bridge.ts)
 *   - window.__GAME__.player       (already in test-bridge.ts)
 *   - window.__GAME__.combat       (already in test-bridge.ts)
 *   - window.__GAME__.merc         (added to test-bridge.ts — useMercStore reference)
 */
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
export {
  clearGameStorage,
  createCharacter,
  navTo,
  waitForBattleResolution,
  bbox,
  rectsIntersect,
  type CharacterClass,
} from '../_helpers';

/** The 7 playable classes. */
export const ALL_CLASSES = [
  'barbarian',
  'sorceress',
  'necromancer',
  'paladin',
  'amazon',
  'druid',
  'assassin',
] as const;

/**
 * Navigate from current location to the first sub-area combat screen.
 * Assumes we are on town-screen or that town-screen is reachable via nav.
 */
export async function enterFirstCombat(page: Page): Promise<void> {
  // Go to town first if not already there
  const townVisible = await page
    .getByTestId('town-screen')
    .isVisible()
    .catch(() => false);
  if (!townVisible) {
    const link = page.locator('a[href="/town"]').first();
    const linkExists = await link.count().then((c) => c > 0);
    if (linkExists) {
      await link.click();
      await expect(page.getByTestId('town-screen')).toBeVisible({ timeout: 8_000 });
    }
  }

  // Click "Set Out" / "探索" to reach the map
  await page.getByTestId('town-set-out').click();
  await expect(page.getByTestId('map-screen')).toBeVisible({ timeout: 8_000 });

  // Click the first "Enter" button (Blood Moor, always unlocked at L1)
  const enterBtn = page.getByRole('button', { name: /进入|Enter/i }).first();
  await enterBtn.click();

  await expect(page.getByTestId('combat-screen')).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Store-level helpers — bypass the UI for reliable fast-forwarding
// ---------------------------------------------------------------------------

type GameBridge = {
  combat: {
    getState: () => {
      inCombat: boolean;
      recordedEvents: unknown[];
      playbackComplete: boolean;
      isPaused: boolean;
      runVictory: boolean;
      runDefeat: boolean;
      log: Array<{ message: string }>;
      resumePlayback: () => void;
      advanceEvent: () => void;
    };
  };
};

declare global {
  interface Window {
    __GAME__?: GameBridge;
  }
}

/**
 * Wait until the combat store has battle events ready to drain.
 * Returns false if the timeout expires (run may have already ended).
 */
export async function waitForBattleLoaded(page: Page, timeout = 10_000): Promise<boolean> {
  return page
    .waitForFunction(
      () => {
        const s = window.__GAME__?.combat?.getState();
        return !!(s?.inCombat && (s.recordedEvents?.length ?? 0) > 0 && !s.playbackComplete);
      },
      { timeout }
    )
    .then(() => true)
    .catch(() => false);
}

/**
 * Drain the current wave's recorded events directly through the Zustand store
 * (no UI interaction). Returns the log messages from the drained wave.
 */
export async function drainCurrentWave(page: Page): Promise<string> {
  return page.evaluate(() => {
    const store = window.__GAME__?.combat;
    if (!store) return '';
    const s = store.getState();
    if (s.isPaused) s.resumePlayback();
    let safety = 100_000;
    while (!store.getState().playbackComplete && safety-- > 0) {
      store.getState().advanceEvent();
    }
    // Return log text so callers can assert on it without waiting for DOM
    return store.getState().log.map((e) => e.message).join('\n');
  });
}

/**
 * Skip ALL waves in the current sub-area run via the Zustand store
 * (bypasses UI click, avoids race conditions).
 * Waits up to `timeoutMs` for the run to end (victory or defeat).
 */
export async function skipViaStore(page: Page, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    // Check if run has already ended
    const runEnded = await page
      .evaluate(() => {
        const s = window.__GAME__?.combat?.getState();
        return !!(s?.runVictory || s?.runDefeat);
      })
      .catch(() => false);
    if (runEnded) break;

    const panelVisible =
      (await page.getByTestId('victory-panel').isVisible().catch(() => false)) ||
      (await page.getByTestId('defeat-panel').isVisible().catch(() => false));
    if (panelVisible) break;

    // Wait for the current wave's events to be ready
    const loaded = await waitForBattleLoaded(page, Math.min(5_000, deadline - Date.now()));
    if (!loaded) break;

    // Drain all events for this wave
    await drainCurrentWave(page);

    // Wait for the 1.5s wave-advance timer OR run end / next wave to load
    await page
      .waitForFunction(
        () => {
          const s = window.__GAME__?.combat?.getState();
          return !!(
            s?.runVictory ||
            s?.runDefeat ||
            (s?.inCombat && !s?.playbackComplete && (s?.recordedEvents?.length ?? 0) > 0)
          );
        },
        { timeout: 5_000 }
      )
      .catch(() => undefined);
  }
}

/**
 * Skip battle to the end quickly by draining events through the Zustand store.
 * Handles multi-wave sub-areas and both EN/ZH locales.
 */
export async function skipToResolution(page: Page, timeoutMs = 60_000): Promise<void> {
  await expect(page.getByTestId('combat-screen')).toBeVisible({ timeout: 10_000 });
  await skipViaStore(page, timeoutMs);
}

/**
 * Get current character XP via the test bridge.
 * Returns 0 if the bridge is unavailable.
 */
export async function getXP(page: Page): Promise<number> {
  return page.evaluate(() => {
    const game = (
      window as unknown as {
        __GAME__?: { player: { getState: () => { player: { xp?: number; experience?: number } | null } } };
      }
    ).__GAME__;
    if (!game) return 0;
    const p = game.player.getState().player;
    if (!p) return 0;
    // field may be `xp` or `experience` depending on schema version
    return (p as unknown as Record<string, number>).xp ?? (p as unknown as Record<string, number>).experience ?? 0;
  });
}

/**
 * Get backpack item count via the test bridge.
 */
export async function getBackpackCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const game = (
      window as unknown as {
        __GAME__?: { inventory: { getState: () => { backpack: unknown[] } } };
      }
    ).__GAME__;
    if (!game) return 0;
    return game.inventory.getState().backpack.length;
  });
}

/**
 * Boost the player's derived stats to guarantee combat victory.
 * Replaces the player entity with a copy that has very high attack and life.
 * Safe to call after createCharacter, before entering combat.
 */
export async function boostPlayer(page: Page): Promise<void> {
  await page.evaluate(() => {
    const game = (
      window as unknown as {
        __GAME__?: {
          player: {
            getState: () => {
              player: Record<string, unknown> | null;
              setPlayer: (p: Record<string, unknown>) => void;
            };
          };
        };
      }
    ).__GAME__;
    if (!game) return;
    const state = game.player.getState();
    const p = state.player;
    if (!p) return;
    const derived = (p.derivedStats ?? {}) as Record<string, unknown>;
    state.setPlayer({
      ...p,
      derivedStats: {
        ...derived,
        life: 99999,
        lifeMax: 99999,
        mana: 9999,
        manaMax: 9999,
        attack: 9999,
        defense: 999,
      },
    });
  });
}

/**
 * Wait until the victory or defeat panel is visible after all waves resolve.
 */
export async function waitForRunEnd(page: Page, timeoutMs = 60_000): Promise<{ victory: boolean }> {
  const victory = page.getByTestId('victory-panel');
  const defeat = page.getByTestId('defeat-panel');

  await Promise.race([
    expect(victory).toBeVisible({ timeout: timeoutMs }),
    expect(defeat).toBeVisible({ timeout: timeoutMs }),
  ]).catch(() => undefined);

  const isVictory = await victory.isVisible().catch(() => false);
  return { victory: isVictory };
}
