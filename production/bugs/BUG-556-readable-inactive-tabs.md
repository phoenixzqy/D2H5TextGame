# BUG-556 — Keep inactive tab labels readable

Status: Fixed and locally verified in the uncommitted worktree. Severity: Medium.
Owner: root, frontend/accessibility. No commit/publication.

## Reproduction

Branch `feat/playable-foundations`, HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`,
plus preserved working changes; pre-fix production source hash
`3ec0567f2eb3b29ecdc4d929d0e24b16d7bef11d5cfa84965860f9c24f3bd82c`.
Chromium147.0.7727.15,360×640, zh-CN (also en); no combat seed applies.

1. Create an ordinary fresh Amazon through New Game; navigate to Quests.
2. Leave Main selected and inspect Side/Bounties without hovering them.
3. Read computed foreground/background colors and WCAG contrast in the browser.

Expected: all enabled tab labels remain readable at≥4.5:1 normal-text contrast,
including inactive state, at every required viewport and both locales.
Actual: inactive labels render#4a3a2a on#0a0a0a, **1.819:1**. The tab still
responds to click/keyboard; hovering to reveal its label is the workaround.
Active gold labels have8.678:1. Touch geometry and Arrow/Home switching pass.

Root cause: shared `src/ui/Tabs.tsx` uses `text-d2-border` as its inactive
foreground. Border palette is unsuitable for readable control labels.
Smallest root fix: use the existing readable muted text color for inactive
labels in the shared component, retaining selected/hover states and behavior.
No palette, engine, schema, game data, save or public API change is needed.

Evidence: retained packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`p16-critical-flow-audit-v2-zh-CN-quests.png`,
`p16-tab-contrast-baseline-v1.json` and its viewport captures/terminal receipt.
Original Tabs bytes are retained as `bug556-tabs-before.tsx.txt`.
The audit uses ordinary fresh creation/navigation on a dev server; its available
development bridge is unused. It does not certify production/PWA or whole-app
accessibility. The initial general audit's invalid production-only bridge
assertion stopped before character creation and is retained separately.

Security check: pass. This is a local visual/accessibility correction with no
credentials, network destination, permission, data or validation changes.

Validation: original10-case browser contrast RED becomes10-case GREEN at6.576:1;
existing `src/ui/Tabs.test.tsx`1/1, scoped types and one-file lint pass. No new
implementation-mirroring unit was added for this reversible style fix.
[Evidence](../../docs/plans/evidence/p16-readable-tabs.md). Author verification;
independent/production/full-v1 acceptance stays open. No commit was created.
