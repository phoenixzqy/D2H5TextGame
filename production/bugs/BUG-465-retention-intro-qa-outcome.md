# BUG-465 — Preserve the native full-intro outcome in retention QA

Status: fixed locally and verified; no commit. Severity: Medium.

Environment: HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained local
changes, Node24.21.0/Vitest1.6.1/WSL. Browser/viewport/locale do not apply.
The corrected fixture adds one above the canonical backpack capacity in
explicitly constructed owned normal caps at creation, then
uses the native runner clock1793304000000 and actual Blood Moor combat. No
supplied encounter seed; this fixture cannot prove fresh viability.

## Reproduction

1. Run `tests/campaign/inventory-policy.regression.test.ts` before policy wiring.
2. Observe the full native introductory Blood Moor challenge.

Expected: compare conserved ownership and native earned wave income across
policies, retaining actual terminal outcomes. The first wave must win and earn
positive XP; the complete starter challenge is allowed to lose.

Actual: the new fixture incorrectly requires `intro-complete`, despite the
starter having a native later-wave nonwin. This premature QA assertion hides
the actual unwired retention-policy assertion. Native nonwin is not a defect
established by this test.

Evidence: packet `p15-gear-retention-red-v2.log` and completed exit receipt in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
one selector check passes, two runner checks fail. Root sole writer owns campaign
QA. Correct the unsupported success expectation, retain equal native outcomes
and reward accounting, then reproduce missing policy wiring separately. No
gameplay change, suppressed failure, installed tool or commit.

The first wiring-green attempt passes selector/rejection checks but finds a
second oracle error:60 caps do not overflow the actual100-item backpack. The
fixture now derives its item count from `BACKPACK_CAPACITY + 1`; salvage must
consume that exact count and retention must preserve it. Evidence:
`p15-gear-retention-green-v1.log`,1FAIL/2PASS. No capacity constant was changed.

The next run reaches retention successfully, then finds that the existing
economy summary omits `removedItems` when zero. The fixture now interprets that
documented omission as zero while still asserting every retained initial item
and no sink records. Evidence: `p15-gear-retention-green-v2.log`,1FAIL/2PASS;
`tests/campaign/economy.ts` conditionally includes the summary property. Scoped
lint also requires explicit string conversion for the numeric fixture ID.

Final corrected fixture3PASS18.225s verifies both policies, identical actual
native waves/status/income, exact101-item initial salvage versus retention,
complete economy/export checks and realm restoration. Scoped TypeScript passes
25.286s; explicit-file lint passes16.435s after ID conversion. The broader
49-check run retains48PASS and the known old zero-summary expectation failure;
its46 other dispatch/budget checks pass. Do not claim an uninterrupted49PASS
from that run. Logs/receipts remain root-owned evidence through acceptance.
