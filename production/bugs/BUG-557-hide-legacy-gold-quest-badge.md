# BUG-557 — Hide the obsolete Gold quest reward

Status: Locally fixed; affected checks passed. Severity: Low.
Owner: root, frontend/content. No commit/publication.

Branch `feat/playable-foundations`, HEAD `b5a0898` plus preserved changes.
Chromium147.0.7727.15 at360×640 zh-CN and640×360 en. No combat seed applies.

1. Create a fresh Amazon through ordinary New Game controls.
2. Open Quests; inspect the available Den of Evil reward badges.

Expected: advertise the XP/skill-point and other supported rewards under the
private-v1 no-gold contract (`docs/plans/playable-target.md`, inherited rules).
Actual: deprecated numeric `gold:0` renders a0Gold/0金币 badge. No actual Gold
award is observed; this is a misleading rendering defect. Workaround: ignore
that obsolete badge. Other supported rewards remain visible.

Evidence: `p16-critical-flow-audit-v2-zh-CN-quests.png` and
`p16-tab-contrast-fixed-v1-en-640x360.png` in retained packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Root cause: `src/features/quests/QuestsScreen.tsx` maps every raw reward field,
and `formatRewardValue` still formats legacy `gold`, independently of the
supported reward service. Confirm the smallest rendering-only correction before
editing; preserve data/save compatibility and actual reward settlement.

## Resolution — 2026-11-01

The renderer filters only legacy `gold:0`, matching settlement's existing no-op.
34 quest UI tests, scoped types/lint and ten ordinary-browser cases pass; XP and
skill badges stay visible and exported saves remain unchanged by the preview.
No data/schema/save/reward-service change. See
[verification](../../docs/plans/evidence/p16-quest-reward-preview.md).
