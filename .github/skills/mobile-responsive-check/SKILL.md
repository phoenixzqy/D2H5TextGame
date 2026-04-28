---
name: mobile-responsive-check
description: Verify a screen or component renders correctly on mobile (360×640 portrait, 412×915, landscape) and desktop (1280×800, 1920×1080), with safe-area insets, touch targets ≥ 44px, and no horizontal overflow. Use before any UI handoff.
allowed-tools: shell
---

# Mobile Responsive Check Skill

This game is mobile-first. Any new UI must pass these checks before review.

## Manual checks (5 minutes)
1. Run `npm run dev` and open in Chrome.
2. DevTools → Device toolbar → cycle through:
   - **iPhone SE** (375×667) — small portrait
   - **Pixel 5** (393×851) — modern Android portrait
   - **iPad Mini** (768×1024) — small tablet
   - **Desktop** (1280×800)
3. For each:
   - No horizontal scrollbar (unless intentional).
   - All interactive elements ≥ 44×44 CSS pixels.
   - Text readable without zoom; min 14px body, 16px on inputs (avoids iOS auto-zoom).
   - Combat log scroll uses momentum and pause-on-hover/touch.
   - Bottom nav respects safe-area-inset-bottom (iOS notched devices).
4. Rotate to landscape on a phone profile — content reflows, no clipped controls.

## Automated checks (Playwright)
A baseline test lives at `tests/e2e/responsive.spec.ts`. Extend it for new screens:

```ts
import { test, expect, devices } from '@playwright/test';

for (const profile of ['Pixel 5', 'iPhone SE', 'iPad Mini'] as const) {
  test.describe(profile, () => {
    test.use({ ...devices[profile] });
    test('inventory has no horizontal overflow', async ({ page }) => {
      await page.goto('/inventory');
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}
```

Run:
```sh
npx playwright test tests/e2e/responsive.spec.ts
```

## Tailwind tips
- Mobile-first: write base styles unprefixed, then `sm:` `md:` `lg:` for upscale.
- Use `min-h-dvh` instead of `min-h-screen` to handle mobile address-bar resize.
- Use `safe-area` plugin classes (`pb-safe`) for bottom nav.
- Avoid fixed pixel widths on containers; prefer `max-w-*` + `w-full`.

## Don'ts
- Don't hide critical controls behind hover-only interactions.
- Don't use `100vh` (broken on iOS Safari with toolbar).
- Don't ship a screen tested only on desktop.
