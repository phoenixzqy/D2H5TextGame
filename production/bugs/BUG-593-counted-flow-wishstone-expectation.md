# BUG-593 — Include the authored wishstones in counted-flow assertions

Status: test correction in working tree (uncommitted). Severity: Low.
Affected systems: qa-engineer; regression expectation only.

## Reproduction

Source authority32; HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce.
Vitest 1.4 / jsdom, both en and zh-CN. Browser viewport and RNG seed are not
applicable to this deterministic DOM flow.

1. Run `CountedQuestFlow.test.tsx` with the current counted quest data.
2. Recover each family's literal sources and explicitly Claim the reward.
3. Compare the complete currency wallet after Claim.

Expected: all five families award their authored 10 wishstones, preserving other
wallet fields and the distinct Jade rune-shard/Gheed gem-shard rewards.
Actual: ten bilingual cases expect no wishstone entry and fail at the full-wallet
assertion. Eight companion cases pass. Source32 hash readback confirms side.json,
claimReward.ts and this test are unchanged since before BUG592 counter batching.
The authored rewards and Gheed's separate current test both pin 10 wishstones.

## Cause and correction

The full-wallet fixture predates the finite side-quest wishstone implementation.
Add the exact 10-wishstone delta to its existing deep-equality assertion. Keep all
source recovery, consumption, separate Claim, XP, repeated-Claim and other-wallet
checks. Do not change production rewards or soften the assertion.

Evidence: retained packet `bug592-counter-flows-v1.json` (10 expected-wallet
failures, 8 passes); follow-up `bug592-counter-flows-v2.json` records verification.
The packet is `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Root retains it for full-v1/review and owns cleanup afterwards.

Verification: `bug592-counter-flows-v2.json` passes all18 bilingual companion
cases. Scoped strict types and final lint pass; the final dot-notation-only
correction is recorded in `bug593-notation-readback-v1.json`. Production reward
code/data is unchanged.
