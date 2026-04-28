/**
 * Shared E2E helpers — character creation, storage cleanup, navigation.
 *
 * All helpers assume `baseURL` from `playwright.config.ts`. They never use
 * wall-clock waits unless absolutely necessary.
 */
import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export type CharacterClass =
  | 'barbarian'
  | 'sorceress'
  | 'necromancer'
  | 'paladin'
  | 'amazon'
  | 'druid'
  | 'assassin';

/**
 * Wipe localStorage + IndexedDB save so each test gets a virgin state.
 * Safe to call before any `page.goto`.
 */
export async function clearGameStorage(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(async () => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
    try {
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
    if (typeof indexedDB !== 'undefined') {
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('d2h5-game');
        req.onsuccess = () => { resolve(); };
        req.onerror = () => { resolve(); };
        req.onblocked = () => { resolve(); };
      });
    }
  });
  await page.reload();
}

/**
 * Create a character end-to-end and land in the Town screen.
 * Throws via Playwright if any expected element is missing.
 */
export async function createCharacter(
  page: Page,
  opts: { class: CharacterClass; name: string }
): Promise<void> {
  await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('home-new-game').click();
  await expect(page.getByTestId('character-create')).toBeVisible();
  await page.getByTestId(`class-${opts.class}`).click();
  await page.getByTestId('character-name-input').fill(opts.name);
  await page.getByTestId('character-start-btn').click();
  await expect(page.getByTestId('town-screen')).toBeVisible({ timeout: 10000 });
}

/**
 * Click a bottom-nav link by route segment ('town' | 'map' | …).
 * Resilient to locale because it uses the href instead of aria-name.
 */
export async function navTo(page: Page, route: string): Promise<void> {
  const link = page.locator(`a[href="/${route}"]`).first();
  await link.click();
}

/**
 * Wait for the combat screen to resolve. The current engine resolves the
 * entire battle synchronously on mount, so the "wins!" / "draw" log line
 * appears almost immediately. We give it up to `timeoutMs` anyway.
 *
 * Returns `{ playerWon, lootItems }` describing the outcome.
 * Throws if neither a victory nor a draw is detected within the budget.
 */
export async function waitForBattleResolution(
  page: Page,
  timeoutMs = 60_000
): Promise<{ playerWon: boolean; lootItems: Locator | null }> {
  await expect(page.getByTestId('combat-screen')).toBeVisible({ timeout: 10_000 });

  // Move the cursor away from the combat log — the log pauses playback
  // while hovered (pause-on-hover UX) which would otherwise stall the
  // tests if Playwright's pointer happens to land over the log panel.
  await page.mouse.move(0, 0);

  // Fast-forward by cycling the speed button to "skip" (1× → 2× → 4× → skip).
  const speedBtn = page.getByTestId('combat-speed-btn');
  if (await speedBtn.count()) {
    for (let i = 0; i < 3; i++) {
      await speedBtn.click().catch(() => undefined);
      await page.waitForTimeout(20);
    }
  }

  // Re-park the cursor in case the click left it over the log.
  await page.mouse.move(0, 0);

  // The 'end' BattleEvent emits a log line containing "wins" or
  // "ended in a draw". Either signals resolution.
  const log = page.getByTestId('combat-log');
  await expect(log).toContainText(/wins|draw/i, { timeout: timeoutMs });

  const logText = (await log.textContent()) ?? '';
  const playerWon = /player side wins/i.test(logText);

  // If the player won, the loot-summary panel appears (when any reward rolls).
  const summary = page.getByTestId('loot-summary');
  const summaryVisible = await summary.isVisible().catch(() => false);
  if (summaryVisible) {
    const items = page.getByTestId('loot-items');
    return {
      playerWon,
      lootItems: (await items.count()) > 0 ? items : null,
    };
  }
  return { playerWon, lootItems: null };
}

/** Returns the bounding box of a locator, or null if not present. */
export async function bbox(loc: Locator): Promise<{
  x: number;
  y: number;
  width: number;
  height: number;
} | null> {
  return loc.boundingBox();
}

/** True if two axis-aligned rects intersect. */
export function rectsIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
