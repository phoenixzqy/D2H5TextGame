# BUG-303 — Translate Cobra Strike recovery status labels

Status: Reproduced; source correction pending.
Severity: Low — Chinese skill details show English recovery labels.
Build: 81fbd496a7ca081910137c21956e100811b0fefb.
Environment: Chromium production preview, 360×640 mobile emulation, zh-CN. Constructed public imported level30 Assassin; no earned progression or combat claim.

## Reproduction

1. Create/import the documented constructed Assassin and choose 简体中文.
2. Allocate Cobra Strike and open its current rank details.
3. Read the 附加 row beneath cooldown.

Expected: 生命偷取, 法力偷取 in Chinese; English remains Life Steal, Mana Steal. Both current and prospective ranks use the same labels.
Actual: Chinese current details show Life Steal, Mana Steal.
Evidence: charge-hover-public4/4 PASS; preview-hover-public-report.json inline original captures and hover-captures/preview-mobile-zh-CN-cobra-strike-values.png in the root-owned active charge task. Eight originals individually viewed. Existing public assertions did not check this row.
Affected systems: frontend-dev/writer/localization and qa-engineer; root sole executor.
Root cause: shared damage-types:status dictionary lacks life-steal and mana-steal in both locales. SkillsScreen correctly asks that dictionary, then falls back to humanized English IDs. Add shared translations rather than a Cobra-only UI exception.

Exact root-owned task: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-charges-zt17emhc. Full charge lifecycle/public-combat, earned/independent and whole-v1 acceptance remain open.

Automated reproduction: cobra-label-red4FAIL/76PASS; all2519repository/fourexternalinputs/HEAD exact. The four failures are Chinese ranks0/1/19/20; English and other martial cases pass.
