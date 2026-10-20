# P05a / P06a integrated foundation evidence

2026-10-20; `phoenixzqy/D2H5TextGame`; implementation head `2458ee7`.
P06a `10ce45d`; P05a `2458ee7` (from independently implemented `d681d0a`).
Node 24.21.0, npm 11.19.0, Vitest 1.6.1, Playwright 1.59.1.

P05a scopes image failure state to the requested source while preserving the
parent shell, crop, fallback and stealth behavior. Agent test-first result:
4 failed / 9 passed before, 13 focused passing after. Parent independently
reviewed component and browser diffs with no blocking findings. No resolver
precedence, metadata or art-policy changes; D13 and full F19 remain open.

P06a removes module-global summon allocation. Battle state allocates before
position lookup and skips living/dead IDs. Full recorded A/A and A/B/A replay,
normal-wrapper parity, snapshot immutability, owner/template uniqueness and
damaged-placeholder preservation are asserted. Independent design/technical
source gate `[TD-ARCH-REVIEW]: APPROVE`; optional dead-ID fixture added.
See BUG-004 and D06 v1a. Timing, caps, corpses/resources and passives remain open.

## Integrated commands

All exit 0 in the claimed worktree:

- `npm run test:engine -- --reporter=dot`: 37 files / 346 tests, 3.94 s.
- `npm test -- --reporter=dot`: 86 files / 807 passed / 1 pre-existing skipped,
  31.30 s. The merc XP quarantine remains open; no new skipped tests.
- `npm run typecheck`, `npm run lint`: pass, including engine purity check.
- `npm run build`: pass. Existing large-bundle and manifest precache warnings
  remain P16/P17 evidence gaps; a successful build accepts no offline gate.
- `E2E_PORT=4287 npx playwright test tests/e2e/save-management.spec.ts tests/e2e/image-source-recovery.spec.ts --project=chromium-desktop --project=mobile-portrait --workers=2 --reporter=line --output=/tmp/d2h5-foundations-browser-2458ee7`:
  12/12 passed, 47.6 s. Covers actual mounted shared components and previous
  save-management paths, both locales, viewport checks and storage failure.

Engine/full-unit timings exceed their 3 s / 15 s budgets. Unit, type/lint and
build were launched concurrently; record these observed times without claiming
performance acceptance. Existing React act/router warnings remain visible.
Chromium shell revision 1217 uses the previously documented Ubuntu platform
override; no claim of a supported Ubuntu 26.04 browser platform.

Security check: pass; source-state/identity fixes add no dependency, network,
credential, permission, export, save-shape or policy change.
No PR, push, merge or deployment. No full feature, checkpoint or G0–G7 accepted.

Disposable browser output, `dist` and task-created Vite cache are removed after
their consumers finish. Installed dependencies/shared browser cache preserved.
