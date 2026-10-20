import { expect, test } from '@playwright/test';

/** Actual shared components under Vite; this isolates media lifecycle from campaign state. */
test('shared image art recovers on source changes and preserves crop/stealth @responsive', async ({
  page,
  request
}) => {
  // Use Vite's exact optimized dependency URLs so the fixture and components
  // share one React instance, including after dependency cache invalidation.
  const [imageModule, appModule] = await Promise.all([
    request.get('/src/ui/GameImage.tsx').then((response) => response.text()),
    request.get('/src/app/main.tsx').then((response) => response.text())
  ]);
  const reactUrl = imageModule.match(/"([^"\n]*\/react\.js\?[^"\n]+)"/u)?.[1];
  const domUrl = appModule.match(/"([^"\n]*\/react-dom_client\.js\?[^"\n]+)"/u)?.[1];
  expect(reactUrl).toBeTruthy();
  expect(domUrl).toBeTruthy();

  await page.route('**/__image-recovery/art/*', async (route) => {
    if (route.request().url().endsWith('/valid-b.svg')) {
      await route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="32"><rect width="16" height="32" fill="gold"/></svg>'
      });
    } else {
      await route.abort('failed');
    }
  });
  await page.route('**/__image-recovery', async (route) => {
    await route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        </head><body><div id="root"></div><script type="module">
        import RefreshRuntime from '/@react-refresh';
        RefreshRuntime.injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => (type) => type;
        window.__vite_plugin_react_preamble_installed__ = true;
        const { default: React } = await import(${JSON.stringify(reactUrl)});
        const { default: ReactDOM } = await import(${JSON.stringify(domUrl)});
        const { GameImage } = await import('/src/ui/GameImage.tsx');
        const { GameCard } = await import('/src/ui/GameCard.tsx');
        await import('/src/styles/index.css');
        await import('/src/i18n/index.ts');
        const h = React.createElement;
        function Fixture() {
          const [src, setSrc] = React.useState('/__image-recovery/art/failed-a.svg');
          return h('main', null,
            h('button', { onClick: () => setSrc('/__image-recovery/art/valid-b.svg') }, 'Recover'),
            h('button', { onClick: () => setSrc('/__image-recovery/art/failed-b.svg') }, 'Fail replacement'),
            h('button', { onClick: () => setSrc(undefined) }, 'Missing source'),
            h('button', { onClick: () => document.body.classList.toggle('stealth') }, 'Stealth'),
            h('div', { 'data-testid': 'game-image' },
              h(GameImage, { src, alt: 'Portrait', fallbackIcon: 'P', objectPosition: 'top' })),
            h(GameCard, { image: src, variant: 'character', name: 'Hero', testId: 'character' }),
            h(GameCard, { image: src, variant: 'item', name: 'Item', testId: 'item' })
          );
        }
        ReactDOM.createRoot(document.getElementById('root')).render(h(Fixture));
        </script></body></html>`
    });
  });
  await page.goto('/__image-recovery');
  await expect(page.getByTestId('game-image')).toHaveText('P');
  await expect(page.getByTestId('character').locator('svg')).toHaveCount(1);
  await expect(page.getByTestId('item').locator('svg')).toHaveCount(1);
  await expect(page.locator('img')).toHaveCount(0);

  const wrappers = await Promise.all([
    page.getByTestId('game-image').locator(':scope > div').elementHandle(),
    page.getByTestId('character').elementHandle(),
    page.getByTestId('item').elementHandle()
  ]);
  await page.getByRole('button', { name: 'Stealth', exact: true }).click();
  await expect(page.getByTestId('character').locator('svg')).toHaveCSS('visibility', 'hidden');
  await page.getByRole('button', { name: 'Recover', exact: true }).click();
  await expect(page.locator('img')).toHaveCount(3);
  for (const image of await page.locator('img').all()) {
    await expect(image).toHaveCSS('visibility', 'hidden');
    await expect(image).toHaveCSS('opacity', '0');
  }
  await page.getByRole('button', { name: 'Stealth', exact: true }).click();
  for (const image of await page.locator('img').all()) {
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
      .toBe(16);
    await expect(image).toHaveAttribute('loading', 'lazy');
    await expect(image).toHaveAttribute('decoding', 'async');
  }
  await expect(page.getByTestId('game-image').locator('img')).toHaveCSS(
    'object-position',
    '50% 0%'
  );
  await expect(page.getByTestId('character').locator('img')).toHaveCSS('object-position', '50% 0%');
  await expect(page.getByTestId('item').locator('img')).toHaveCSS('object-position', '50% 50%');

  await page.getByRole('button', { name: 'Fail replacement', exact: true }).click();
  await expect(page.locator('img')).toHaveCount(0);
  await expect(page.getByTestId('game-image')).toHaveText('P');
  await expect(page.getByTestId('character').locator('svg')).toHaveCount(1);
  await expect(page.getByTestId('item').locator('svg')).toHaveCount(1);
  await page.getByRole('button', { name: 'Missing source', exact: true }).click();
  await expect(page.locator('img')).toHaveCount(0);
  await page.getByRole('button', { name: 'Recover', exact: true }).click();
  await expect(page.locator('img')).toHaveCount(3);
  for (const wrapper of wrappers) {
    expect(wrapper).not.toBeNull();
    expect(await wrapper?.evaluate((element) => element.isConnected)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
});
