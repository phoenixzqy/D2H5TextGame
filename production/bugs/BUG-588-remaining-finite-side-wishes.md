# BUG-588 — Finish remaining finite side wish rewards

- Status: Fixed in working tree; no commit created.
- Severity: Medium; the finite recruitment economy is incomplete.
- Build/environment: b5a08988 plus authority27 working tree; local Node/Vitest real stores. Deterministic rewards, no RNG/browser/viewport/locale dependency.
- Reproduction: Complete the established Cow, Act II cache, Drognan, Ormus, Larzuk, Anya or Nihlathak source proof and Claim; inspect canonical wishstone balance and authored reward data.
- Expected: Each of the remaining8 finite side quests grants10 additional wishes once inside its native transaction; preserve every existing reward, proof and rollback participant.
- Actual: Eight authored bonuses and their native payments are missing.16 original assertions fail in the retained `bug588-red-v1.json`.
- Evidence: External packet `bug588-baseline-v1.json` retains original source bytes; `bug588-plan-v1.json` records the reviewed eight-quest plan and passing local security assessment.
- Root cause: Specialized dispatch and exact reward contracts bypass generic numeric publication, so data-only additions would reject or silently omit payment.
- Affected systems/owner: content, finite side claims, currency journal; root is sole writer.
- Constraints: No historical compensation, main/bounty reward changes, new save state, unrelated campaign replay, install, commit or publication.

## Resolution

The eight bonuses now settle inside their native source-owned transactions,
with claimed-last, independent additions and scoped rollback preserved.
Exact reward contracts and Anya's engine entitlement allowlist include wish10.
Original16 failures are retained;478 distinct affected cases across25 suites,
scoped strict types and explicit lint pass. Exact inverse preserves all old
side fields; main and bounty authoring remain unchanged. See
[implementation report](../../docs/balance/2026-11-02-remaining-finite-side-wishes.md).
Full-v1 balance, income, fairness, pacing and final gates remain open.
