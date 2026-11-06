# BUG-671 — Freeze acceptance time before application startup

- **Status:** Fixed and verified locally; uncommitted on retained HEAD `b5a0898`.
- **Severity:** Medium; blocks verification, with a deterministic setup correction.
- **Owner / affected systems:** Root / QA; `tests/pwa/offline-rewards.spec.ts`.

## Reproduction

HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained dirty source;
production Chromium in WSL, desktop 1280×800 zh-CN and mobile 360×640 en.
No combat seed applies: both failures precede character creation or admission.

1. Install the browser clock at `createdAt - 1000` on a blank page.
2. Navigate to the application, allowing real startup time to pass.
3. Pause at `createdAt`.

**Expected:** deterministic character creation at the declared timestamp.

**Actual:** startup can exceed the one-second allowance; `clock.pauseAt` rejects
with `Cannot fast-forward to the past`. Desktop English passed earlier, so the
fixture is sensitive to startup duration rather than game behavior.

## Evidence and correction

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-integrated-rewards-v1`:
`browser-v3.json`, `browser-v3.log`, failed screenshot/trace in `playwright-v3/`.
All three V3 cases are terminal: two clock failures and a separate mobile zh-CN
notification interception timeout (BUG-672). No V3 combat admission occurred.

Install and pause the context-wide clock on the blank page before navigation.
Keep exact whole-save/time/reward expectations; no timeout increase or retry.

## Verification

V4 reaches the separate notification hit-test failure with deterministic time.
V5 passes all four locale/viewport cases, including exact saved timestamps and
award-time decay. [Evidence](../../docs/plans/evidence/p17-integrated-rewards.md).
Regression: `tests/pwa/offline-rewards.spec.ts`; no commit created.
