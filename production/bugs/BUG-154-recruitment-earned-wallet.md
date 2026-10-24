# BUG-154 — Spend earned wishstones in recruitment

Severity: High. Status: Fixed in `b2ed62b` locally; independent acceptance pending.
Owners: engine-dev (store payment/roster boundary), frontend-dev (balance and failure feedback).

## Reproduction

Baseline `a0d7c7f`; Vitest UI/jsdom store entry points, no browser viewport;
locale-independent payment defect. Production browser verification is pending.
The genuine through271 save has inventory wishstone8790 and legacy meta currency0.

1. Set that same wallet tuple through the ordinary store state used by the save.
2. Call the existing `pullGacha(1)` action.
3. Separately try inventory90/meta0 and the displayed ten-pull action.

Expected: a single spends10 earned wishstones; ten spends the authored90;
all recruited ownership/progress and pity publish with payment or all roll back.
Actual: both return null despite sufficient earned currency. The UI gates on
meta currency0. When meta is funded, ten is priced as single×10=100. Invalid
count/wallet inputs and partial publication are also not reliably refused.

Evidence: `src/stores/gachaActions.test.ts`; baseline causal run25 failures and
13 controls, exit1 in5.43s. Raw retained log:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/bug154-red.log`.
The RNG compatibility case fixes Date.now1750000000123 and starting pity89;
the live earned save is not modified or used to select future recruits.

Root cause: kill/quest faucets use the D10 canonical inventory wallet, while
recruitment reads/debits a disconnected legacy meta wallet. It grants mercs
incrementally before the pity publication and refunds currency alone on error.
No ordinary player workaround makes earned inventory currency spendable here.

## Correction contract

Security check: pass. Scope is local earned-currency payment and conserved saved
ownership; no external I/O, permissions, dependencies or validation bypass.

Plan review: ready. Spend validated safe nonnegative inventory+legacy value,
consolidating the exact remainder into inventory only on successful payment.
Keep hydration/import byte-conserving; no saved shape/version change. Grant new
currency into inventory; use authored1/10 costs. Prepare every result first,
then publish wallet/roster/equipment/progress/pity under the existing material
lease, verify references, restore all participants on error, and block saves if
restoration fails. Keep rarity RNG order and SSR pity behavior unchanged.
Show the same combined wallet and localized failure feedback in the UI.

This slice does not accept independent SR pity, duplicate shards, star upgrades,
missing merc effects, campaign reachability or full economy balance.

## Verified correction

Implementation `b2ed62b`; full11550 tests/441 files pass with2 existing skips,
types/lint/build pass, production en/zh×five viewport sizes10/10 and two exact
Save-close-Continue pairs pass. [Earned evidence](../../docs/plans/evidence/d10-earned-recruitment.md).
Regression coverage: `src/stores/gachaActions.test.ts`,
`src/features/gacha/GachaScreen.test.tsx`, `src/app/gacha-route.test.tsx`;
BUG156 also has the measured production touch-target matrix.
