# BUG-391 — Make Fara's crafting favor executable

- Severity: High — advertised side quest has no useful supported reward loop.
- Status: Fixed locally; bounded current32 integrated acceptance APPROVED (see final acceptance below).
- Build: preserved feat/playable-foundations changes; HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce.
- Environment: WSL/Linux, Node/Vitest save boundaries; zh-CN/en consumer checks follow.
- Affected systems: root save/inventory/guard/dispatch; Producer finite quest runtime;
  Cobra actual town dialogue/content/UI; QA independent acceptance.

## Reproduction

1. Construct the exact completed Fara Talk row and completed canonical Radament row.
2. Add own true receipt `quests/side-act2-fara-favored#action:talk-fara`.
3. Validate, build, decode and repeat with malformed rows/receipt or a receipt getter.

Expected: the exact new graph roundtrips in32; contradictory/accessor graphs refuse
before normalization. Historical31 refuses the future receipt. Actual eligible Fara
conversation grants only completion/proof, then separate Claim pays1 gem-shard.
No XP/repair/cache normalization; actual existing gem fusion can consume the shard.

Actual baseline: new authority is unknown to raw validation; buildSave accepts six
invalid graphs and one getter form. Authored Fara currently promises unsupported
repair_discount and lacks its actual canonical town dialogue. Inventory direct
spending checks only material ownership; the unsettled one-key quest fence is absent.

Evidence: retained packet `d2-counted-source-z3jj3xa1/fara-save-root-red-v1.log`:
12 controls,9fail/3pass, using existing APIs with no missing imports. Two fail new
legal receipt admission; seven expose missing builder graph/getter refusal. Legacy
history and historical future-receipt rejection pass. No RNG is used in this repro.

Approved repair: docs/design/fara-favored.md and shared gem-shard seam review in
the retained packet. Exact finite Talk/Claim and proportional one-key journal under
the existing lease; no actor progression publication or general transaction rewrite.
Preserve a real public Claim observer/direct-spend RED before enabling the debit
fence; independent additions and absent/zero semantics must survive failure/retry.
Final batch checks/build/headed browser remain separate. CI excluded; no commit,
push or deployment. Owner earned playtest follows implementation.


## Focused result

Actual eligible Fara Talk publishes only its completed row and retained proof.
Separate Claim pays exactly1 canonical gem-shard with no XP/service or actor
publication. Both locales expose the real NPC and existing gem-fusion consumer.
The real public observer direct-spend RED was captured before the exact-key fence;
final journal10, owner61, independent32, content/UI10 and scoped save40 pass,
with zero-warning owned-path lint. Independent runtime/shared-seam and root
content/test reviews APPROVE. Preliminary independent-v1 milestone expectation
and root test lint fixes were test-only; the retained receipts disclose them.
Exact evidence: `d2-counted-source-z3jj3xa1/fara-focused-checkpoint.json`.
No interim release or completion of final batch/browser/pacing obligations.

## Final acceptance

The later [integrated current32 evidence](../../docs/plans/evidence/p14-successor32.md#final-bounded-local-acceptance) supersedes pending integration notes above. `d2-counted-source-z3jj3xa1/current32-acceptance.json` retains exact source, reconciled unit coverage, green terminal checks, headed-browser evidence and cleanup. Original failures stay retained; no uninterrupted full-green, earned pacing or full-v1 acceptance is claimed.
