# BUG-248 — Render Terror stat rows from the available display model

- Status: reproduced before repair; root author fix in progress.
- Severity: High — opening skill details throws in the uncommitted presentation draft.
- Owner: root frontend; independent review remains open.
- Build: 1b192510 plus uncommitted Terror presentation; Node24.21.0/Vitest1.6.1/jsdom.
- Browser/viewport: jsdom component render, viewport independent; both en/zh-CN.
- Seed: not applicable to static presentation.

## Reproduction

1. Run src/features/skills/SkillsScreen.terror.test.tsx against the draft.
2. Select Terror at ranks0/1/18/20 in either locale.

Expected: localized finite fear rows, current/next/MAX and no mutation/crash.
Actual: all eight component cases throw ReferenceError: skill is not defined.
StatSection receives stats, not the source skill. The newly added condition
incorrectly references a variable outside that function's scope.

Evidence: terror-presentation-green.json/log in root-owned
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-terror-7j9sws2f;
exit1,8failed/10passed,7.7s; log SHA256
9e5ff1662013c2c91e1b5af36bcf69c5e90599ce1fa523c4bed15bd3f5b31a1c.

Repair boundary: use the existing status identity in the validated display
model to choose Terror's rows. No new prop, business formula, fallback or
suppression. The same eight real component regressions must pass.
