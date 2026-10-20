# BUG-025 — Apply the online bonus to production wave rewards

- **Severity:** High — the next-online XP/MF reward feature has no production effect.
- **Status:** Fixed in this BUG-025 commit (SHA supplied in handoff), 2026-10-20.
- **Affected systems / owner:** engine-dev / stores combat reward integration.
- **Build:** `2fdf9e7c27970728c4c948c034bbb3415c97ab2d`.
- **Environment:** Vitest 1.6.1 UI/jsdom project, Linux; no browser viewport involved. Store integration is locale-independent (normal test locale); no localized UI is changed.
- **Seed:** production run seed `7`, challenge ordinal `0`, `areas/act1-blood-moor`.

## Reproduction

1. Create the controlled high-power sorceress fixture through the real player and inventory stores; equip MF300/GF19 gear and field a level-one mercenary.
2. Set the raw idle tuple at `1792454400000` to multiplier1.5 with1000seconds remaining.
3. Start the seeded production sub-area run, let real combat record its first win, then drain playback.
4. Move wall time to anchor+70seconds and call `advanceWaveOrFinish`.
5. Run `npx vitest run --project ui src/stores/combatHelpers.idle-bonus.test.ts --reporter=dot`.

## Expected

At award time the current multiplier is1.465. Award232XP, summing per-kill floors, and share floor(232×0.75) with the mercenary. Scale effective MF for the same wave using the same sample; leave the raw tuple and transient anchor unchanged. Ineligible or incomplete outcomes receive no reward.

## Actual / evidence

Behavioral RED at2026-10-20 06:24:12UTC:4failed/13passed, Vitest duration5.44s. The production path awarded160XP instead of232 and never read the shared bonus. A tight rarity boundary returned normal instead of magic for raw MF300 × effective-MF multiplier1.5 (327×1.5=490.5). The test file is the retained reproduction evidence; no screenshot or external log file was created.

## Root cause and scope

The production playback finalizer sums baseline XP and invokes loot with raw MF only. `KillRewardInput` / `DropContext` do not carry the award-time effective-MF multiplier. The unmounted legacy idle ticker is not this production path.

Security check: local arithmetic and defaulted engine input only; no credentials, external IO, permissions, CI or agent-behavior change. Preserve the existing shared RNG sequence, currency/GF/material rules, forced rarity/direct TC paths and idle-pity policy. Imported/high-power fixtures prove wiring, not earned progression or balance.

## Resolution and validation

The production finalizer now reads one shared projected multiplier at award time,
floors XP per kill, shares the resulting total through existing mercenary logic,
and passes the same multiplier through the optional default-one MF field. The
rarity roller multiplies effective MF without another floor/cap or RNG fork.
Both root and producer independently approved the exact six-file source/test/
control change before commit; neither reran validation. Regression test:
`src/stores/combatHelpers.idle-bonus.test.ts`.

Validation (implementer evidence, final runtime source):

- Focused:19passed,2.74s; after test-only lint cleanup19passed,3.19s.
- Engine:42files/497passed,3.61s (preceding first pass5.29s).
- Related:37files/408passed/1existing skip,17.51s.
- Full:111files/1251passed/1existing skip,26.97s.
- Final typecheck and lint pass. Production build passes (Vite6.22s).
- Engine3s, related5s and full15s elapsed budgets remain unaccepted; functional
  passes do not establish timing-budget acceptance. No limits weakened.
- Related emits existing Router/React act warnings; build reports stale
  Browserslist data, a large bundle and an oversized manifest excluded from
  precache. No unrelated fixtures/tests/tool configuration changed.

The two-wave MF test uses a controlled unforced TC only at the data-loader
boundary: actual authored Act I trash entries force normal rarity. A separate
real-data production control proves complete loot/currency equality with the
baseline while XP is boosted. Default-one has an exact reward/next-RNG oracle;
forced/direct/noDrop/missing-TC controls preserve rewards and stream state.
The test does not claim unchanged same-seed currency after changed rarity
consumes different materialization draws.

All test/build processes finished before cleanup. Task-created `dist` and
`node_modules/.vite/vitest` removed and absence verified; the empty task-created
`node_modules/.vite` parent was removed. No coverage, .vite, test-results or
playwright-report output remains. Installed tools and pre-existing node_modules
were preserved. No temporary spill files were created.

Reward wiring alone does not accept full P17, hidden farming, browser/PWA
lifecycle or campaign progression.
