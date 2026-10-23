# BUG-098 — Reject native non-record quest ledgers before normalization

Status: Fixed; validated with the D11 Claim/Read transactions.
Severity: Medium; malformed native ledgers can be silently emptied.
Owner: engine-dev / save and quest transaction integrator.

## Reproduction

- Build: `2d0d94f` plus pending Claim/Read and shared ledger validator changes.
- Environment: Node24.21.0 / Vitest1.6.1; browser, locale, viewport N/A.
- Seed: N/A; no RNG.
1. Create a valid v12 save with claimed Radament progress.
2. Replace its ledger with a Date, Map, or object with inherited receipt/entry fields.
3. Call the standalone ledger validator or decode the native save.
4. Try Claim/Read with a live Date or Map ledger.

Expected: reject malformed non-JSON records before any normalization or grant.
Actual: Ajv considers Date/Map objects; enumerable normalization erases a Date
or inherited fields, and the raw transaction validator accepts them as empty.

Evidence: `src/engine/save/quest-items.test.ts` and
`src/features/quests/bookReward.test.ts`; causal run6failed/74controls.
Raw log: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-book-transactions-egvdwhnu/record-red.log`.
Fix: require plain or null-prototype JSON records, reject inherited entry shapes,
and validate the current raw ledger before generic Map normalization.

Validation: final focused242tests/6files, engine4283/110 and full8850/287
pass; typecheck, lint, production build and four-chunk bridge scan pass.
Independent QA APPROVE/security PASS. See
`docs/plans/evidence/radament-book-transactions.md` for scope and retained evidence.
