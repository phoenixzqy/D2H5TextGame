# P10 — `tsc` build redundancy audit

**Owner:** technical-director
**Branch:** `perf/test-p10-tsc-audit`
**Decision:** **REMOVE `tsc` from `build`** (low risk).
**Target met:** ≥ −5..−10 s wall on `build`. Observed savings ~22–27 s.

## Context

Original `package.json` script:

```json
"build": "tsc && vite build"
```

Vite/esbuild only *transforms* TypeScript (type-stripping); it does not
type-check. So the `tsc` prefix was the only thing producing
type-correctness signal at build time.

Question: is that signal redundant given how the rest of the pipeline
already enforces types? If yes, drop it from `build` (keep `typecheck`
script) to speed up the local build wall and the CI `prod-bundle`
rebuild fallback (relevant after P03 moved E2E off `build`).

## Type-check enforcement audit

`.github/workflows/ci.yml` runs jobs in this order on every PR:

1. `npm run lint`
2. `npm run typecheck` ← **dedicated `tsc --noEmit` gate, blocking**
3. unit tests
4. `npm run build`
5. Playwright E2E

`typecheck` is a separate, blocking step **before** `build`. So `tsc`
inside `build` is a duplicate execution of the same `tsc --noEmit`
config (`tsconfig.json` already has `"noEmit": true`). Removing it from
`build` does **not** lose any error class — every type error is still
caught at the `Type check` CI step, and `npm run typecheck` remains
available locally and as the gate-check entry point.

## Measurements (Windows 11, idle-ish, 3 runs each, median reported)

Each run cleared `dist/`, `node_modules/.vite`, and any `.tsbuildinfo`
between iterations. Variance was high (machine had background load); the
directional signal is nevertheless unambiguous.

| Variant                                | Run 1   | Run 2   | Run 3  | **Median** |
| -------------------------------------- | ------- | ------- | ------ | ---------- |
| `npm run build` (`tsc && vite build`)  | 102.70  | 96.19   | 71.64  | **96.19 s** |
| `npx vite build` alone                 | 69.60   | 100.58  | 21.41  | **69.60 s** |
| `npx tsc --noEmit` alone               | 22.44   | 35.07   | 10.63  | **22.44 s** |

**Wall-clock savings on `build`:** `96.19 − 69.60 = 26.6 s` (median).
Even taking the noise floor (min `tsc` = 10.6 s), savings are ≥ 10 s and
clearly above the P10 target of −5..−10 s.

### Incremental (`tsc --incremental`) probe

Tested for the standalone `typecheck` script only (since we are removing
`tsc` from `build`):

| Run            | Time     |
| -------------- | -------- |
| Cold (no info) | 47.90 s  |
| Warm #1        | 31.94 s  |
| Warm #2        | 11.27 s  |

**Decision: do NOT enable `incremental`.**

- CI is always cold-cache, so it would gain nothing in CI (the place
  where `typecheck` time matters most for gate latency).
- Locally devs already get instant type feedback via IDE language
  server; the CLI `typecheck` script is run rarely.
- Adds operational complexity: `*.tsbuildinfo` to `.gitignore`,
  potential stale-cache confusion, an extra place where "did you delete
  the buildinfo?" enters debugging conversations.
- Marginal warm-only win does not justify that complexity.

## Risk classification: LOW

Conditions for LOW met:

- ✅ `typecheck` script exists (`tsc --noEmit`).
- ✅ CI runs it as a dedicated, blocking step before `build`.
- ✅ `tsconfig.json` is `"noEmit": true` already — `tsc` in `build` was
  emitting nothing, only checking. The removed cost is pure duplication.
- ✅ `gate-check` skill (per repo conventions) runs `typecheck` locally.

No regression in error coverage; only duplicate work removed.

## Change

```diff
   "scripts": {
-    "build": "tsc && vite build",
+    "build": "vite build",
     "typecheck": "tsc --noEmit",
```

No change to `tsconfig.json`, `tsconfig.node.json`, or `.gitignore`.

## New contract (documented here for future contributors)

> `npm run build` does **not** type-check. Type errors are caught by
> `npm run typecheck` (and the dedicated `Type check` step in
> `.github/workflows/ci.yml`). Both must remain in CI as blocking gates.
> Do not delete the `typecheck` script or the CI step that runs it.

## Verification

- `npm run typecheck` — passes.
- `npm run lint` — passes.
- `npm test -- --run` — passes (unchanged from baseline).
- `npm run build` — produces a working `dist/`.

## Follow-ups

None. CI typecheck enforcement already in place; no new tickets needed.
