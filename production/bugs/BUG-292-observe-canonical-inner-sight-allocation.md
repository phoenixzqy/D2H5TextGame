# BUG-292 — Observe the canonical ID of newly allocated Inner Sight

- Severity: Low (acceptance observer, no observed product defect).
- Status: Reproduced; test correction pending.
- Build: ae60f9cdb1ee21bb1ec0f973f1acd49e9b64d966; real production build, no test bridge.
- Environment: local Chromium desktop 1280×800; en; fixed browser date 2026-10-26; constructed L30/20-point Amazon, not earned balance. No fixed battle seed is used: failure occurs before combat.
- Owner: QA/browser acceptance; root executes without delegation.

## Reproduction

1. Run tests/pwa/amazon-inner-sight-acceptance.config.ts against the task-owned production build.
2. Import the declared constructed fixture with no allocated skills, then allocate one Inner Sight point through the public skill panel.
3. Export through Settings; the test expects player.skillLevels["skills-amazon-inner-sight"] to equal 1.

Expected: assert the fresh canonical allocation player.skillLevels["amazon.inner_sight"] equals 1, the exact remaining point count and selected priority still match, then continue the cast/save/offline proof.

Actual: the test receives undefined for the data ID and stops before combat. Existing playerStore.ts allocateSkillPoint chooses an existing saved alias when present, otherwise canonicalSkillIdFromData(tmpl.id). The preceding area fixture supplied existing data-ID allocations; this fixture starts with an empty map. This difference is established in source, not a reason to change allocation or weaken the assertion.

Evidence: root retains /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-support-ssrbktv_/inner-sight-public-browser.log, inner-sight-public-report.json, original test source and inner-sight-public-output/ trace/screenshot. Original result: one failed, three not run, no passing browser claim.

## Required correction

Change only the two exported-rank key lookups to the canonical runtime ID. Preserve the actual public allocation, exact rank/points/priority, cast/chip, viewport, save and offline assertions. Keep all original evidence. Rerun using new task-isolated output/report names. No product, migration, skill data or production build change.
