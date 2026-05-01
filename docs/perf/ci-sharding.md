# CI sharding — E2E topology (Wave C / P11)

## Shape

```
e2e-build ────────────────► e2e-prod-bundle ─┐
                                              │
e2e-shard         (matrix 1..4) ──────────────┼──► e2e-merge
e2e-mobile-shard  (matrix 1..2) ──────────────┘
```

| Job                | Project              | Webserver            | Needs        |
| ------------------ | -------------------- | -------------------- | ------------ |
| `e2e-build`        | —                    | —                    | —            |
| `e2e-shard`        | `chromium-desktop`   | `vite dev`           | —            |
| `e2e-mobile-shard` | `mobile-portrait`    | `vite dev`           | —            |
| `e2e-prod-bundle`  | `prod-bundle`        | `vite preview` (no rebuild) | `e2e-build` |
| `e2e-merge`        | —                    | —                    | all of the above (`if: always()`) |

## Why this shape

- **Build-once**: `vite build` is the heaviest step in the pipeline. Only
  the `prod-bundle` project actually needs the built `dist/`, so we
  build it once in `e2e-build`, ship `dist/` as a 1-day-retention
  artifact (`prod-dist`), and let `e2e-prod-bundle` consume it.
  `playwright.config.ts` honors `SKIP_BUILD_FOR_E2E=1` to skip the
  inner `npm run build` that `prodWebServer` would otherwise re-run,
  so the build truly happens exactly once per CI run.
- **Dev projects skip the build**: `chromium-desktop` and
  `mobile-portrait` run against `vite dev` (Wave A / P03). They do
  **not** download `prod-dist`. Their shards start in parallel with
  `e2e-build`.
- **Blob reporter + merge-reports**: each shard writes a
  `blob-report/`, uploaded as `blob-report-<who>-<n>`. `e2e-merge`
  downloads all `blob-report-*` artifacts (`merge-multiple: true`)
  and runs `npx playwright merge-reports --reporter html` to produce
  the single `playwright-report` artifact engineers download.

## Why mobile is sharded 2-way (not 1, not 4)

The repo currently has **26 mobile-portrait specs across 16 files**
(post-Wave A grepInvert split — `@desktop-only` is excluded, so this
is less than the desktop count). The P11 brief says: *"single job is
fine — confirm via spec count check; if mobile suite > 8 specs in
repo state, shard 2-way instead"*. 16 > 8, so the suite is sharded
2-way.

We did not go to 4 shards on mobile because:

- Per-shard fixed cost (runner spin-up + `npm ci` + Playwright browser
  install) is ~45–60 s. With 4 shards we'd spend more time in setup
  than in test execution.
- Mobile suite wall-time is roughly half the desktop suite, so 2 ≈
  the desktop shards' per-shard wall-time.

If the mobile spec count grows past ~50, revisit and bump to 4.

## Why desktop is 4-way

71 specs, balanced split observed locally (P11 verification):

| Shard | Spec count |
| ----- | ---------- |
| 1/4   | 18         |
| 2/4   | 18         |
| 3/4   | 19         |
| 4/4   | 16         |

Playwright's shard hashing is deterministic; the split stays balanced
as we add specs.

## Mobile shard balance (measured)

Wave C verification (after playthrough split):

| Shard | Spec count | File count |
| ----- | ---------- | ---------- |
| 1/2   | 10         | 7          |
| 2/2   | 9          | 6          |

Imbalance: 5.3% (1 spec difference). Well within acceptable range.
Re-verify if mobile suite grows past 30 specs.

## Caching

- Node modules: `actions/setup-node@v4` with `cache: npm` (keyed on
  `package-lock.json`).
- Playwright browsers: `actions/cache@v4` with key
  `playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}`,
  path `~/.cache/ms-playwright`. We still run
  `npx playwright install --with-deps chromium` after restore so the
  apt-level OS deps land; the binary download is cheap on cache hit.

## Wall-time budget

Target: **≤ 5 min end-to-end**. Bottleneck of the critical path is
`e2e-prod-bundle` because of the `e2e-build → download artifact →
preview + run` sequence. Estimated wall: build ~50 s, prod-bundle
job ~90 s, merge ~20 s ⇒ ~3 min critical path. The 4-way desktop
shard runs in parallel and lands in ~2½–3 min per shard, so it does
not extend the critical path.

## Process safety

This pipeline never uses `taskkill`, `kill-port`, `pkill node`, or
`Stop-Process -Name node`. If a port collision is ever observed in CI,
the fix is to bump `E2E_PORT` / `E2E_PROD_PORT` in the job env, not to
nuke processes. See `playwright.config.ts` header comment.

## Local repro

```pwsh
$env:E2E_PORT=4279
npx playwright test --project=chromium-desktop --shard=1/4
npx playwright test --project=chromium-desktop --shard=2/4
# …
npx playwright test --project=mobile-portrait --shard=1/2
```

For the prod-bundle path locally:

```pwsh
$env:VITE_E2E='true'; npm run build
$env:RUN_PROD_BUNDLE='1'; $env:SKIP_BUILD_FOR_E2E='1'
npx playwright test --project=prod-bundle
```
