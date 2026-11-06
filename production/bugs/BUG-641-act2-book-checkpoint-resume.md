# BUG-641 — Resume Act II after the Book of Skill checkpoint

Status: fixed locally; affected regression/type/lint checks and earned continuation verified.
Severity: Medium (diagnostic continuation unavailable; native player save remains valid).
Affected systems: QA campaign route/preparation controller (root-owned this session).
Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained dirty source;
exact affected-source hashes will accompany local validation.
Environment: Node 24.21.0 / Vitest 1.6.1, Linux WSL; browser viewport/locale/seed
not applicable to this orchestration failure. No combat is simulated by the repro.

## Reproduction

1. Complete the canonical five Starts, Dry Hills visit, Cube/shaft recovery,
   Radament Claim and Book read: ten successful native quest actions.
2. Stop before Lost City entry. Preserve native state and action custody.
3. Pass that prefix to `resumeActTwoAfterCube` / `runAreaPreparedActTwo`.

Expected: resume Lost City preparation without repeating Oasis, Radament income,
or the consumed Book. Retain all earlier training costs and limits.
Actual: `assertActTwoResumePrefix` only accepts lengths 7/16/20 and rejects
this lawful checkpoint before mutation. The prepared controller also has no
custody for prior training limits, which must be addressed before native reuse.

## Evidence

`tests/campaign/act2-route.regression.test.ts` and
`tests/campaign/act2-area-preparation.regression.test.ts`: the two ten-action
regressions fail on the original prefix assertion. Retained log:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-act2-book-resume-v1-red-v2.log`.
The initial CLI-only failure using deprecated `--cache.dir` is retained separately;
it did not execute a test. Corrected invocation selects only these two cases.
The real earned checkpoint is recorded in
`docs/balance/2026-11-03-javelin-earned-act2-checkpoint.md`.

Root cause: the route groups Oasis and Lost City under one prefix-length branch,
and preparation assumes every new invocation receives a fresh training budget.
Workaround: no fresh route replay authorized; implement checkpoint support.

## Local resolution (2026-11-03)

The route accepts the exact ten-action prefix and skips Oasis, shaft recovery,
Radament Claim and Book consumption. Preparation accepts a retained training
checkpoint, audits its settled waves and ordinal/XP/clear custody before native
mutation, and carries total/per-area/nonwin/fallback counters. The successor
owns only new actions and income. Route-retry carry and training carry are
exclusive; incompatible or missing retained evidence is refused.

Four affected campaign files changed: `act2-route.ts`,
`act2-area-preparation.ts` and their two `.regression.test.ts` files.
The reproduced prefix and budget-renewal failures are retained. The final
affected run passes 65 checks (63 unrelated cases excluded); scoped strict
TypeScript and explicit `eslint --no-ignore` pass. Evidence packet above uses
prefix `p15-act2-book-resume-v1`, with `-related-green`, `-types` and `-lint`
JSON/log receipts. Constructed fixtures establish controller behavior, not
earned gameplay or balance acceptance. Root self-review only; no commit,
publication, agent review, CI or production damage/reward-law change.

Native continuation must authenticate the verified level23/next291 predecessor,
retain its ten quest actions and 156 training admissions (26 toward Lost City),
and preserve all prior execution costs. This fix does not renew the predecessor's
closed 120-second process slice. A separately declared suffix must fit the
remaining canonical global envelope. No fresh native suffix has run yet.

## Earned continuation (2026-11-03)

[Verified Javelin Act II completion](../../docs/balance/2026-11-03-javelin-act2-completion.md)
resumes exactly the retained checkpoint and completes at32/next447. All eleven
remaining actions, native export and cumulative training/economy/point custody
pass V2 independent retained-output readback. The original process slice remains
closed; all prior costs remain charged. This supersedes the pending suffix above.
Formal balance acceptance remains0/210; no population or pacing claim.
