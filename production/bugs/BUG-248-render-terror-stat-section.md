# BUG-248 — Render Terror stat rows from the available display model

- Status: locally fixed/verified in a5008fce; independent review remains open.
- Severity: High — opening skill details throws in the uncommitted presentation draft.
- Owner: root frontend; independent review remains open.
- Original build: 1b192510 plus uncommitted Terror presentation; Node24.21.0/Vitest1.6.1/jsdom.
- Browser/viewport: jsdom component render, viewport independent; both en/zh-CN.
- Seed: not applicable to static presentation.

## Original reproduction

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

## Final local verification

Core1b192510, source-driven preview27f4acc9, bilingual renderinga5008fce,
native/public lifecycle7f7149b7.77new regressions; final full17,590passed/800files/
two existing skips, engine8745/327, types/lint/official build/bridge/precache PASS.
Production browser4/4: eight exact six-domain pairs/four actual offline Continues,
20geometry checks and16inspected PNGs with explicit mobile capture limits.
BUG248 uses available display-model status identity, with all eight original
component cases passing. No fallback, suppression or skip added.

[Final evidence](../../docs/plans/evidence/d04-terror.md) supplies causal outcomes,
original RED hashes, contract/commit traceability and exact durable archive paths.
The former task root named above is deleted;119raw members/23terminal receipts
are retained and verified,992exact files/32directories cleaned,remaining[]/failures[].
Exactly one Terror inventory credit;159bounded,52unverified,one engine-only,
one review-needed. Root author review is not independent approval; earned
balance/builds and C2-C4/fullG0-G7/full privatev1 remain open.
