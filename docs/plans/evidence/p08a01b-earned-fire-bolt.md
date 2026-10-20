# P08a01b — Ordinary earned Fire Bolt browser proof

- Status: accepted for this bounded card. Root and producer independently
  returned `[P08a01b-FINAL-REVIEW]: APPROVE / ADEQUATE`; both reviewed the
  final source/evidence/report and initial raw browser DOM/status evidence.
  This does not close every P08 skill gate.
- Runtime input: `f3892e9d04032c4cdbf650893ee4af56cc6a7477`.
- Changes: new `tests/pwa/fire-bolt-earned.spec.ts`, production-PWA discovery
  append, this evidence. Root separately delegated the Open BUG-033 report.
  No runtime, data, locale, save-version or migration changes.
- Own human-pool claim: `D2H5TextGame-human-worktree-4`, branch
  `qa/p08a01b-earned-fire-bolt`; fetched `main`, created from `origin/main`,
  then deliberately fast-forwarded the input. Other edits preserved.

## Ordinary browser acceptance

Four Chromium cases: desktop1280×800/mobile360×640 × `en`/`zh-CN`; fresh
contexts and production service-worker activation, no `window.__GAME__`,
no document horizontal overflow or page errors. Only Date is fixed to
`2026-10-20T12:00:00.000Z`; native timers run normally. Only the ordinary
`createCharacter` and `navTo` helpers are used. No imports of runtime modules,
state/storage writes, bridge, boosted saves, forced clicks, conditional
fallback, skips or retries.

1. Fresh Sorceress: L1 XP0/100, spare1 skill point,0 stat points, exact core
   10/25/10/35, HP120/120, MP102/102 and complete literal fresh-player payload.
   Hire the authored free Inner Sight rogue through the UI in every case;
   verify its default fielding, unchanged inventory, L3/core12/22/16/14,
   HP148 and XP0/304. This route never changes after a loss.
2. First Skills visit sanitizes the starter Frost Nova out of the active combo
   because its authored level requirement is6; both existing learned ranks
   remain. This known ordinary mutation is checked before baseline capture.
   Real Allocate learns canonical `sorceress.fire_bolt`: rank1, spare0,
   disabled No Points control. The **whole expected save** differs from the
   pre-allocation export only by that rank/point change. Native slot controls
   then configure the sole combo `skills-sorceress-fire-bolt`; the next whole
   expected save differs only by combo. Other eight slots are explicitly empty.
3. Ordinary Blood Moor entry displays wave1 and8 monsters, counting each compact
   representative plus its stack badge. The exact first Fallen target card is
   `unit-card-enemy-act1.fallen-0-db2c`, initially full.
   Independent arithmetic: timestamp1792497600000 → runSeed2330410254 →
   waveSeed349193407; first target life47/defense12; hit roll0.687659794697538,
   base roll33, crit roll0.8561408745590597 → **noncritical21 damage**.
   Hero's first action is scheduled1500ms (merc1524ms, first enemy1540ms).
   Browser assertions pair the actual first hero cast/damage log with the
   exact target bar **55.32% =26/47**, then ordinary Pause freezes the state.
   The milliseconds are a source-derived schedule oracle, not independently
   measured browser latency. The bar has two-decimal precision; log arithmetic
   supplies the exact remaining-HP interpretation.
4. Resume/Skip requires all original enemies dead and the original hero alive;
   numeric wave2 → Pause within500ms → Flee. A missed window or extra award
   fails. The exported whole player is independently expected at **L2 XP60/565**
   (160total), **5 stat points/1 skill point**, unchanged core/rank1/sole combo,
   maxHP128/maxMP106/attack24/defense23, and persistent currentHP120/currentMP102.
   Merc remains L3, unchanged complete merc payload, XP120/304.
5. Real Allocate spends the earned point: rank2/spare0, Current numeric34–49.
   The **whole expected save** differs from the earned export only by rank/point.
   Ordinary Save, readonly IndexedDB, export, close page, new page with the same
   fixed Date, Continue and re-export agree on the whole payload. The locale,
   rank2, disabled No Points and sole nine-slot configuration remain visible.

The independent oracle covers fresh/learning/earned XP and points/rank/config
deltas. The **actual post-reward payload is only a persistence baseline** for
unrelated random materialized loot; this is not independent loot certification.
Persistent resources are distinct from battle resources. No battle-MP, complete
burn-duration, rank2 browser-damage, full-area clear or truthful/localized-copy
acceptance is claimed. Existing engine scaling evidence remains separate.

## Verification and observed defects

- `npm run typecheck`: exit0.
- `npm run lint`: exit0; engine purity scan43 test files, no forbidden imports.
- `npx eslint --no-ignore tests/pwa/fire-bolt-earned.spec.ts tests/pwa/playwright.config.ts --max-warnings=0`: exit0.
- `git diff --check`: exit0.
- `PWA_PORT=4337 npx playwright test --config=tests/pwa/playwright.config.ts fire-bolt-earned.spec.ts --output=/tmp/d2h5-p08a01b-earned-browser-1`:
  exit1, **0passed/4failed/0skipped**, retries0. Fixture labels omitted the
  actual paragraph's Active suffix; corrected to exact rendered full labels.
  Before rerun, source-pinned target hit copy was corrected for the ordinary
  instance suffix A/lowercase fire and hero log filtering was narrowed to actor
  prefix so enemy hits targeting the hero cannot pollute the first-hero pair.
  No runtime change or weaker HP/XP oracle.
- Same command with output `/tmp/d2h5-p08a01b-earned-browser-2`:
  exit0, **4passed/0failed/0skipped (1.3m)**, retries0. Guard rebuilt production
  with `VITE_E2E` unset and checked the bridge was absent; server not reused.
- Build warnings: stale Browserslist data, >500kB chunk, 2.57MB generated asset
  manifest omitted from precache, and environment NO_COLOR/FORCE_COLOR warning.
  No dependency/cache-policy changes made for these unrelated warnings.
- Browser reproduced percentage/turn tooltip units and raw canonical Fire Bolt
  cast-name fallback. [BUG-033](../../../production/bugs/BUG-033-fire-bolt-copy-units.md)
  is Open and preserves the exact rendered text; this card makes no copy fix.

## Handoff and cleanup

Root owns final integration/ledger and combined-head validation. Both reviewers
declared artifact consumer-done. QA removed and verified absence of exact owned
paths `/tmp/d2h5-p08a01b-earned-browser-1`,
`/tmp/d2h5-p08a01b-earned-browser-2`, and this worktree's generated `dist`.
Downloads were deleted immediately in `finally`; `.vite`/test output directories
were absent and pre-existing `node_modules` was preserved. No task process
remained; Playwright stopped its own server. The four owned source/evidence/report
files are selectively committed for root integration, with claim release through
the worktree skill. No push, PR, deployment or runtime/copy fix in this card.
