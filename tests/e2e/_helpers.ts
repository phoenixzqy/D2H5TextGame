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
  // Load a static same-origin page first so the app/Dexie connection is not open
  // while IndexedDB is deleted.
  await page.goto('/e2e-reset.html');
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
      const deleteDb = (name: string) =>
        new Promise<void>((resolve) => {
          const req = indexedDB.deleteDatabase(name);
          const done = () => { resolve(); };
          req.onsuccess = done;
          req.onerror = done;
          req.onblocked = done;
          setTimeout(done, 1_000);
        });
      await Promise.all([deleteDb('D2H5TextGame'), deleteDb('d2h5-game')]);
    }
  });
  await page.goto('/');
  await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 10_000 });
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

/** Return to town from combat, regardless of whether the run is mid-fight or resolved. */
export async function returnToTownFromCombat(page: Page): Promise<void> {
  const postRunTown = page.getByTestId('return-to-town');
  if (await postRunTown.isVisible({ timeout: 500 }).catch(() => false)) {
    await postRunTown.click();
  } else {
    await page.getByRole('button', { name: /逃跑|Flee/i }).click();
  }

  if (!(await page.getByTestId('town-screen').isVisible({ timeout: 1_000 }).catch(() => false))) {
    await page.goto('/town');
  }

  const continueButton = page.getByTestId('home-continue');
  if (await continueButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await continueButton.click();
  }

  await expect(page.getByTestId('town-screen')).toBeVisible({ timeout: 10_000 });
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
  timeoutMs = 30_000
): Promise<{ playerWon: boolean; lootItems: Locator | null }> {
  await expect(page.getByTestId('combat-screen')).toBeVisible({ timeout: 10_000 });

  // Auto-mode is engine-driven; toggle on if not already, defensively.
  const autoCheckbox = page.locator('input[type="checkbox"]').first();
  if (await autoCheckbox.count()) {
    const checked = await autoCheckbox.isChecked().catch(() => false);
    if (!checked) {
      await autoCheckbox.check().catch(() => undefined);
    }
  }

  await expect
    .poll(
      async () => {
        const victoryVisible = await page.getByTestId('victory-panel').isVisible().catch(() => false);
        const defeatVisible = await page.getByTestId('defeat-panel').isVisible().catch(() => false);
        const logText = (await page.getByTestId('combat-log').textContent().catch(() => '')) ?? '';
        return victoryVisible || defeatVisible || /wins|draw|victory|defeat|胜利|失败|倒下/i.test(logText);
      },
      { timeout: timeoutMs, intervals: [250, 500, 1_000] }
    )
    .toBe(true);

  const log = page.getByTestId('combat-log');
  const logText = (await log.textContent()) ?? '';
  const victoryVisible = await page.getByTestId('victory-panel').isVisible().catch(() => false);
  const playerWon = victoryVisible || /player side wins|victory|胜利/i.test(logText);

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
