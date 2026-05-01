# F1 — Test bridge tree-shake guarantee

**Status:** enforced by CI (`npm run check:test-bridge-shake`).
**Owner:** technical-director.
**Wave:** A follow-up landed in B (`perf/test-waveB-f1`).

## What

`src/app/test-bridge.ts` exposes `window.__GAME__` for E2E tests
(`seedItem`, `seedMerc`, `flushSave`, plus direct store handles). It is
strictly a test affordance — production end-users must never see it,
and its transitive dependencies (`rollItem`, `loadAwardPools`,
`createMercFromDef`, …) must not be paid for in the prod bundle.

## How it's gated

`src/app/main.tsx` only references the bridge from inside a
**build-time-replaced** conditional:

```ts
if (
  import.meta.env.DEV ||
  import.meta.env.MODE === 'test' ||
  import.meta.env.VITE_E2E === 'true'
) {
  const { installTestBridge } = await import('./test-bridge');
  installTestBridge();
}
```

Vite statically replaces all three `import.meta.env.*` reads at build
time. In a production build (no `VITE_E2E`) the expression collapses
to `false`, the dynamic `import('./test-bridge')` becomes unreachable
code, and Rollup tree-shakes the entire module — including its
transitive imports — out of the graph.

`vite dev`, Vitest, and Playwright (which sets `VITE_E2E=true` for
both the dev server and the `@prod-bundle` build, see
`playwright.config.ts`) all keep the bridge installed.

### Why a static `import` + runtime `if (!enabled) return` did **not** work

The previous shape was an unconditional top-level call:

```ts
import { installTestBridge } from './test-bridge';
installTestBridge(); // returns early in prod
```

Rollup cannot prove `installTestBridge` is side-effect-free (it
assigns to `window.__GAME__`), so it preserved the call. Verified:
all of `__GAME__`, `seedItem`, `seedMerc`, and `flushSave:` (the
bridge property form) appeared verbatim in `dist/assets/index-*.js`.

## How it's verified

`scripts/check-test-bridge-shaken.mjs`:

1. Wipes `dist/`.
2. Runs `vite build` with `VITE_E2E` explicitly removed from the env.
3. Scans every `dist/assets/*.js` for forbidden tokens:
   - `__GAME__`
   - `\bseedItem\b`
   - `\bseedMerc\b`
   - `\binstallTestBridge\b`
   - `[,{]flushSave:` (the bridge's *property* form — distinguishes
     from the legitimately-shipped `flushSave` store helper)
4. Exits non-zero on any match, with a chunk-name + snippet for
   each violation.

Wired as `npm run check:test-bridge-shake` and replaces the bare
`npm run build` step in `.github/workflows/ci.yml`, so every PR
enforces the guarantee at build time at no extra cost.

## How to update if the bridge surface grows

When you add a new public method to `TestBridge` in
`src/app/test-bridge.ts`:

1. Pick a distinctive identifier (no minifier collisions —
   `seedFoo`, `forceBar`, etc., not `set` or `get`).
2. Add a regex to the `FORBIDDEN` list in
   `scripts/check-test-bridge-shaken.mjs`.
3. Run `npm run check:test-bridge-shake` locally to confirm the new
   token also passes.
4. Update this doc's bullet list.

If you intentionally remove a method, drop both the regex and the
bullet — never silently weaken the guard.

## Manual recipe (one-off audit)

```powershell
$env:VITE_E2E=$null
Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue
npm run build
Select-String -Path dist/assets/*.js -Pattern '__GAME__','seedItem','seedMerc' -SimpleMatch
```

Expect zero hits. Any hit means the gate has broken.

## History

- **2026-04-30** — F1 landed. Bridge previously leaked
  (`__GAME__`/`seedItem`/`seedMerc` all present in
  `dist/assets/index-*.js`). After moving the import behind a
  build-time gate, prod chunk dropped from 920.41 kB → 919.54 kB
  (gzip 236.93 → 236.54 kB) and all bridge tokens are absent.
  Regression guard wired into CI.
