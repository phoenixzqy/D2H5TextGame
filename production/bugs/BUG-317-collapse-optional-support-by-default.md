# BUG-317 — Collapse optional support in Settings by default

Status: Locally resolved in1037886f; scoped native/production checks pass; fresh whole integration/retention complete; independent acceptance pending. Root sole executor/author.
Severity: Medium — optional support treatment violates the explicit GDD; workaround: ignore link.
Build: c882dfe642e9bdbd5e0f4567e14b7ab261a1e258; ordinary production build from6480ac15.
Environment: Chromium production preview,360×640,en/zh-CN; disposable no-character browser contexts; no engine/RNG dependency.

## Reproduction

1. Open Settings in either locale in a new disposable browser context.
2. Scroll to the bottom without opening a support section.
3. Observe the coffee link already visible. There is no details/summary disclosure.

Expected: per Diablo2TextGame.md line280, optional support is collapsed by default in Settings. Opening by pointer/keyboard reveals its link; leaving/re-entering Settings starts collapsed. Both disclosure and link meet44px touch height; version stays visible while collapsed.
Actual: both locales show the generic service homepage link immediately, with32px height. The GDD treatment is unmet.

Evidence: root task `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-support-disclosure-1rp6gaoa`, corrected `baseline/report.json` and two original screenshots. First harness used an incorrect Chinese label and timed out; its original script/report remain separately, and do not supply Chinese acceptance.
Affected systems: frontend/UX/a11y/localization. Root cause: Settings footer renders a bare anchor; existing supportDev translation is unused. Workaround: ignore the expanded support link.

## Bounded correction plan

Native details/summary, default closed without persistent state/custom handlers; existing translated supportDev label,44px-plus controls, visible keyboard focus and protected external-link attributes; keep version outside hidden content. Actual developer support destination remains separately pending an asynchronous user question; do not invent a profile URL or claim full F20 acceptance. No payment/power/purchase flow.

Security check: pass for authorized first-party local presentation; no new dependencies/permissions/telemetry/save-format change. Plan review: ready for default-collapse slice; author review is not independent acceptance. Browser baseline→fixed keyboard/pointer/remount/no-overflow checks in both locales/five sizes, existing Settings regressions, explicit lint/types/build and final integrated whole checks before handoff.

## Implementation checkpoint

Native default-closed details/summary is committed, existing Settings11tests/types/lintPASS. Final production20/20both-locale/five-size/no-character-and-fresh-character cases verify keyboard/pointer/remount,44px-plus controls, hit testing and no overflow; all20character originals viewed. Actual developer support profile remains pending user answer; fullF20 is not accepted.

[Scoped evidence and continuing root ownership](../../docs/plans/evidence/p16-support-pwa-install-icons.md). Fresh frozen8fc0ae32 full19935/940/two existing opt-in skips, types and lint/purityPASS;2693repository/769external inputs and HEAD exact/rehashed.1691archive members read-back verified,1691files/32dirs/rawroot exactly removed;remaining[]/failures[]. Root retains archive/manifest/receipt linked in the evidence through consumers. No independent/full-v1 acceptance or remote action.
