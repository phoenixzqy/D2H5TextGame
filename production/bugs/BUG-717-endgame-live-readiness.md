# BUG-717 — Project live native endgame readiness before offering actions

Status: Fixed and verified locally, 2026-11-04; full P18/private-v1 acceptance remains open.
Severity: Medium; native actions refuse safely, but unavailable controls remain offered.
Owner: root / frontend and store integration. Affects P16/P18, D14 admission.

## Reproduction

Build `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited human2 changes.
WSL/Linux Vitest jsdom; en and zh-CN. No real-browser reproduction yet;
viewport and combat RNG seed are not applicable to these constructed UI fixtures.

1. Mount EndgamePanel with a native validated completed-campaign fixture and
   both trial counts positive, with an unclaimed achievement.
2. Remove the live hero, or reserve asynchronous restore ownership without
   changing map/inventory. Observe Enter and Claim.
3. Independently mount the same fixture with attemptOrdinal at MAX_SAFE_INTEGER.

Expected: live restrictions disable actions with localized explanations; release
recovers controls without a remount. Exhaustion disables Enter, while an earned
Claim stays available. Reading readiness never grants rewards or spends attempts.

Actual: Enter/Claim remain offered until clicked for missing hero/ownership;
exhausted Enter remains enabled. Native action-time checks already refuse these
conditions. No supported authority bypass, free reward or lost-save exploit is
established.

## Evidence and cause

`src/features/endgame/EndgamePanel.test.tsx`: six bilingual regression cases fail
with enabled Enter before source changes. Corrected RED JSON/logs are retained at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-endgame-readiness-3znqjoal`.
First test attempt leaked its second restore lease after an assertion failed;
that fixture cleanup is corrected and the original failure is retained.

The panel projects only hydration/recovery/campaign unlock, and lacks hero,
combat, complete map-validation and ownership subscriptions. Share native
preflight and entry evaluation instead of duplicating admission business rules
in React. Keep Claim transaction, rollback and click-time checks authoritative.

Workaround: finish/leave conflicting work and retry the native action.
No earned campaign, economy or formal balance acceptance is implied by fixtures.

## Resolution and verification

`readEndgameReadiness` shares native preflight, entry and achievement eligibility.
The panel subscribes to complete native validation inputs and transient ownership,
disables Enter and Claim independently, and links localized refusal explanations.
Native click-time throws, Claim publication/rollback and overflow handling stay
authoritative; advisory reads never spend attempts or grant rewards.

All32 affected cases pass (18 store/14 panel, no skips), including the six
original bilingual failures, native import recovery and map-only invalidation.
Final strict scoped types and four-file lint pass. Test setup corrections use
CombatScreen's actual abort-plus-endCombat sequence and the established jsdom
save-adapter boundary; native import persistence is exercised in Chromium.

Real WSL Chromium verifies12 bilingual locked/unlocked layouts, keyboard/ARIA,
44px targets, no horizontal overflow and unchanged native gameplay exports.
Six supplementary native-scroll checks verify controls remain unobscured.
Producer bounded review: APPROVE. Original failures and capture corrections are
retained; [full evidence](../../docs/plans/evidence/p18-live-readiness.md).
