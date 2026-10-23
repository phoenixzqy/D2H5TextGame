# BUG-105 — Preserve quest transaction refusal ordering

- **Severity:** High
- **Status:** Fixed; reproduced at `3715d28`
- **Affected systems:** engine-dev / quest transaction and persistence integration
- **Environment:** Vitest UI project, jsdom (no browser viewport), fixture locales; no engine RNG required

## Reproduction

1. At `3715d28`, run `npx vitest run --project ui src/features/quests/staffQuest.test.ts src/features/quests/questTableReward.test.ts src/features/quests/claimReward.persistence.test.ts`.
2. During a quest publication/rollback, invoke Assemble or Insert from a synchronous store observer.
3. Independently, hold a real import's persistence promise while hydration remains ready, then Claim.

## Expected

Nested quest actions return `claim-in-progress` without writes throughout publication and rollback. Public Claim/Read during real save replacement return `not-ready`; exact Iron Golem debit continues to take precedence. Primitive wave/restore and snapshot guards remain enforced.

## Actual and evidence

The command reproduces **8 failures / 47 tests**: five Staff observer/rollback cases throw `AggregateError` rooted in `questBusy`; a quest-table nested result remains undefined; two real-import cases throw `restorePending`. The regression fixtures above are the retained executable evidence.

`questActionPreflight` reaches the snapshot guard before the synchronous transaction's reentry check. `withQuestTransaction` acquires a restore-excluding lease before the operation can observe real save replacement.

## Validation

The existing Staff, quest-table, real-import, Claim and exact Iron ownership suites pass (163 tests). The expanded Guardian suite preserves all 28 ownership/rollback tests; its remaining current-save capacity fixture fails independently and is assigned to integration fixture repair. Typecheck and scoped ESLint pass. The shared fix translates only this transaction’s `questBusy` result and preserves outer wave/restore/receipt refusal precedence. The Staff guard regression also exercises exact-debit precedence before preflight.
