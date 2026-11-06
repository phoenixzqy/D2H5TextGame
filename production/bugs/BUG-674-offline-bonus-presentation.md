# BUG-674 — Show the XP/MF bonus, depletion and offline rules

- **Status:** Fixed locally and verified; no new commit. Retained HEAD plus dirty source.
- **Severity:** Medium; the engine applies both bonuses, but the UI hides MF and the rules.
- **Owner / affected systems:** Root / frontend; offline bonus HUD, home and Settings.
- **Build:** Retained HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus dirty source.
- **Environment:** Chromium in WSL, desktop1280×800/mobile360×640, en/zh-CN. No engine seed.

## Reproduction

1. Save a normally created character, close the page and return after eight hours.
2. Read the home bonus and HUD chip after Continue; open Settings.

**Expected:** `docs/design/idle-offline.md` §5.1/5.4 requires XP/MF identification,
a depleting bonus bar and a Settings explainer for §3's capped, decaying online
bonus. No direct offline income is implied.

**Actual:** common locale strings name XP alone, the chip omits the boosted
stats entirely, neither bonus surface has a bar, and Settings has no bonus help.
The engine already applies XP and effective MF together.

## Evidence

Original component/locale/Settings snapshots and all source hashes are in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-bonus-ui-v1/before/`.
The existing hook tests explicitly expect XP-only strings. Reproduce the
missing meter and MF label with those lifecycle tests before changing source.

## Resolution and verification

`OfflineBonusBanner.tsx` now identifies XP/MF in the banner and HUD chip and
shares an accessible current-strength meter. Settings has bilingual native
disclosure help. Existing read-only projection, expiry and persistence behavior
are preserved; no gameplay/save fields or extra timers were introduced.

Regression: `src/features/idle/useOfflineBonus.test.ts`, expected RED
2 failed/10 passed before source, then all12 pass. Production
`tests/pwa/offline-bonus-ui.spec.ts` passes all4 desktop/mobile×en/zh-CN cases
in27.8s, plus one mobile-Chinese visible-help check in14.2s. Complete-save
comparisons, expiry, meter decay, keyboard help, five-size reflow, no bridge and
no page errors pass. Scoped strict types/explicit lint and production build pass.
Original lint/type-harness failures are retained without suppressions.

[Full evidence and remaining scope](../../docs/plans/evidence/p17-offline-bonus-ui.md).
Required packet `p17-bonus-ui-v1` remains root-owned through umbrella review;
exact disposables removed and verified. This closes only §5.1/5.4 presentation;
returning-player toast and attack-speed indicator remain separate open items.

## Scope

Use the authoritative read-only bonus projection. The bar measures current
bonus on its existing 0–50% scale; the original window/peak cannot be recovered
from the persisted tuple. No new gameplay/save field or fake original duration.
Returning-player toast and attack-speed indicator are separate open §5 items.
