# BUG-106 — Require actual prerequisite graphs for side services

- **Severity:** High
- **Status:** Fixed in `4f526d7`; reproduced at `2fd0aec`
- **Affected systems:** engine-dev / save validation and shared quest service rewards
- **Environment:** Vitest engine and UI projects, jsdom (no browser viewport), fixture locales; no engine RNG required

## Reproduction

1. At `2fd0aec`, run `npx vitest run src/engine/save/act5-save.test.ts src/features/quests/act5Main.test.ts` with the retained regression cases.
2. Create canonical completed/claimed side and prerequisite rows for Larzuk/Siege, Anya/Prison, or Halbu/Hellforge, with no victory/action receipts or physical quest-item graph.
3. Decode a native17 save carrying the corresponding available service. Separately leave the side row unclaimed and invoke `canClaim` and `claimQuestReward`.

## Expected

The native17 service is rejected. Claim availability is false, Claim returns `not-completed`, and all store bytes remain unchanged. Siege and Prison require their actual main completion graphs; Hellforge requires its actual Hephasto/shatter and consumed-input graph. Completing the prerequisite does not require claiming its main reward. Migrating claimed historical rows preserves history and grants no service or inferred proof.

## Actual and evidence

The command reproduces **6 failures / 53 tests**. All three forged native17 wallets decode successfully and `canClaim` returns true. Larzuk and Halbu Claim return `ok` and publish new available charges; Anya reaches `unsupported-rewards`. The retained tests in the two reproduction paths capture these outcomes without browser or random inputs. Independent service-candidate QA also reproduces all three forged-side acceptances.

## Root cause

The finite wallet validates the claimed side source row, but the shared campaign validator checks actual source graphs only for main Siege/Prison charges. Claim also passes side IDs to a main-only completion predicate. The authored prerequisite graph is therefore absent at both boundaries.

## Validation

The native17 save and Act V Claim regressions pass (55 tests), including valid actual Siege/Prison prerequisites whose main rewards remain unclaimed, removing each required Act V source edge, and historical16 migration preserving side history without grants. Existing Claim and real-persistence suites pass (77 tests). The Act IV suite passes its 40 behavioral tests; its independent historical15 fixture still carries reserved native17 keys and is assigned to integration fixture repair. Typecheck passes. The shared graph predicate is reused by native17 validation and Claim, with reciprocal item/action validation retained at each caller.

The full engine suite passes (128 files / 4670 tests), and full repository lint passes. Independent service QA passes all 84 cases, including valid unclaimed-main prerequisite graphs and causal removal of required victory/action/item edges.
