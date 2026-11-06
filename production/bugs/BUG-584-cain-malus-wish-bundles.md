# BUG-584 — Include wishes in Cain and Malus claim bundles

- Status: Fixed in the working tree; no commit requested.
- Severity: Medium; the finite quest recruitment faucet is incomplete.
- Build: inherited private-v1 worktree, source authority24; commit b5a0898806bfba369a2d84a1b6c41d0bbb057fce.
- Environment: local Node/Vitest, store transactions; browser/viewport/locale and RNG seed not applicable to deterministic authored currency grants.
- Reproduction: (1) Load main/side quest JSON through the quest loader. (2) Inspect Cain rescue/Talk and Malus hand-in/Present reward bundles. (3) Claim with their existing real-store constructed source proofs.
- Expected: main20/15 and side10/10 wishes, once, in the canonical wallet, atomically with XP and existing service rewards. Preserve source proofs, replay refusal, independent observer additions, absent/zero balances, and explicit restoration errors.
- Actual: all four authored bundles omit wishes; both specialized publishers have no currency participant, and generic dispatch rejects currency additions.
- Evidence: retained packet `bug584-source-reproduction-v1.json`, original source baselines, and `specializedClaimWishes.test.ts` failing before implementation.
- Affected systems: quests, inventory currency journal, JSON quest content. Root is sole writer.
- Root cause: source-specific publishers bypass generic currency publication and require an owned currency participant.
- Workaround: none for missing rewards; historical claims must remain closed without compensation.

- Fix: the four authored bonuses use the source publishers' existing rollback and one shared finite-currency journal; no old saves are paid.
- Regression: `src/features/quests/specializedClaimWishes.test.ts`, `src/stores/questCurrencyJournal.test.ts`, existing Cain/Malus/Fara/Gheed/bounty/journal claim cases.614 distinct affected cases pass incrementally; final86 core cases pass after source corrections, scoped types/lint pass. Exact original failures retained in the external packet.
- Receipt: `docs/balance/2026-11-02-cain-malus-wishes.md`, source authority25 and `bug584-final-checks-v1.json`. Full side/repeatable economy and v1 acceptance remain open.
