# BUG-396 — Restore the application entry to the offline precache

- Status: Fixed locally; bounded current32 integrated acceptance APPROVED (see final acceptance below).
- Severity: High — offline reload cannot load the application entry.
- Build: uncommitted successor32 on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.
- Environment: WSL/Linux production Vite build; browser-independent emitted-asset
  check. Browser locale/viewport and engine seed do not affect reproduction.
- Affected systems: build/PWA (`technical-director`, `frontend-dev`).

## Reproduction

1. Build the complete successor32 application using the installed Vite binary.
2. Run `node scripts/check-offline-precache.mjs <production-output-directory>`.
3. Inspect the emitted Workbox precache and build warnings.

Expected: every application JavaScript/CSS chunk, the entry document, registration
script and installation icons appear in the actual service-worker precache.

Actual: the emitted application entry is 2,211,233 bytes, exceeding Workbox's
unchanged 2 MiB limit. Workbox excludes it and the existing offline guard fails.
An online boot does not prove offline reload works.

## Cause and correction

The growing engine implementation remains in the application entry after game
data and third-party packages are separated. A task-local experiment assigns
`src/engine/**` to its own `engine-core` chunk, preserving the existing data and
vendor groups and the 2 MiB limit. It emits approximately 908 kB of engine code
and a 1,195 kB entry; the actual precache guard passes. Data-loader initialization
crosses this boundary, so production boot and offline reload must also pass.

## Evidence

Retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

- `successor32-production-build-v1.log`: original missing-entry warning.
- `successor32-offline-precache-red-v1.log` and matching exit receipt: real failure.
- `successor32-engine-chunk-experiment-v1.log`: bounded output chunks.
- `successor32-offline-chunk-experiment-green-v1.log` and matching exit receipt:
  actual emitted assets are all precached in the experiment.

No cache-limit increase or missing-asset suppression is proposed. The final repository
configuration builds successfully as `successor32-production-build-v3`; its
763-file bundle and `successor32-offline-precache-green-v3` pass. Final actual
offline-browser verification passes in the combined Chinese v3/English v5
baseline cases, including real offline reload, navigation and export. Root
verified the final browser artifact manifest and production source pins with
zero drift. Full-unit integration acceptance remains pending.

## Final acceptance

The later [integrated current32 evidence](../../docs/plans/evidence/p14-successor32.md#final-bounded-local-acceptance) supersedes pending integration notes above. `d2-counted-source-z3jj3xa1/current32-acceptance.json` retains exact source, reconciled unit coverage, green terminal checks, headed-browser evidence and cleanup. Original failures stay retained; no uninterrupted full-green, earned pacing or full-v1 acceptance is claimed.
