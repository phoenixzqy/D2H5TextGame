# BUG-586 — Verify source restoration after currency rollback

- Status: Fixed in working tree; no commit requested.
- Severity: Medium; a synchronous observer can leave a claim flag changed after failed publication.
- Environment/build: local Vitest real stores; BUG585 uncommitted source transition from authority25. No browser/viewport/locale or RNG dependency.
- Reproduction: Prepare a valid fresh town/Warband claim. Make its first direct map publication silently do nothing. On the wish rollback publication, change the same quest's rewardClaimed flag to true. Claim reports grant-failed but retains that changed flag.
- Expected: attempt every participant restoration; restore/verify the source after currency restoration, or explicitly report a failed restoration. Preserve independent currency additions and held guards.
- Actual: the source is checked before the new currency restoration boundary, allowing the late flag change to escape that verification.
- Evidence: `bug586-red-v2.json`, two real-store cases named currency rollback observer. The initial test targeted markQuestRewardClaimed, while these publishers use direct map setState; that harness mistake is corrected before the genuine state failure is reproduced. Original failed byte assertions retained.
- Root cause: wrong restoration order when adding the currency participant, not the existing source/mercenary restoration machinery.
- Owner: root. Fix: restore currency first, then existing scoped source/physical participants and final source checks; verify the wallet last. No whole-wallet/source snapshots or repeated restoration loop.

- Fix/validation: currency restoration precedes scoped source/physical restoration and final source checks, then wallet verification. Both original failed byte comparisons pass; final99 affected claim cases, scoped types/lint pass. See BUG585 report and `bug585-586-final-claims-v1.json`.
