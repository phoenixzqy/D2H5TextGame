# BUG-079 — Localize all known status names in combat logs

Status: fix validated; local commit pending. Actual SHA recorded in a following bounded increment.
Severity: Medium — known status IDs are shown instead of their existing translated
names. Status badges already use translations; combat behavior still works.

## Reproduction

Baseline `ab0bbe208bcfdfd73ae63cb745663f526a05407e`; Linux/Node24.21.0/Vitest1.6.1/jsdom UI project.
Locales en/zh-CN; browser viewport N/A for direct production renderer reproduction.
Seed N/A: this pure event conversion consumes no combat RNG.

1. Switch i18next to zh-CN.
2. Render `{kind:'status',target:'enemy',statusId:'poison'}` using the actual
   eventToLocalizedLogEntry and unit name Target.
3. Compare the log message with existing combat:effect.status.poison.

Expected: `Target 进入【中毒】状态。`; actual: `Target 进入【poison】状态。`.
English likewise shows lowercase raw poison rather than Poison. Only mercenary
Inner Sight has an explicit translation branch. Other known status labels already
exist in both locales; no new strings are needed. Unknown IDs must retain their
exact original fallback, including punctuation.

Command: `node_modules/.bin/vitest run --project ui src/stores/eventToLogI18n.test.ts`.
Meaningful RED43/112:21 known statuses in both locales plus locale-switch case
fail; Inner Sight and unknown controls pass. Raw source/log/receipt retained at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-status-log-l5xknylw/red.log`.
Root owns evidence until umbrella consumers finish, then removes it.

Affected systems: frontend-dev shared combat-log renderer, writer/localization,
QA regression. Proposed root fix: resolve every status through existing
combat:effect.status.<id> with exact raw-ID default; preserve Inner Sight behavior.
The existing InnerSight test's raw-poison expectation is superseded by this
explicit bilingual known-status rule; keep its actual unknown controls.
No engine, status timing, save, reward or locale-file change belongs to this fix.


## Resolution and validation

Resolve each status name through its existing combat:effect.status.<id> key with
the raw ID as defaultValue. This replaces the mercenary-only special case at the
shared conversion boundary; no new locale strings or PE-specific branch. Inner
Sight's exact messages remain unchanged. The stale raw-poison unknown-control
entry was removed under the accepted known-status translation rule; unknown
controls remain alongside independent explicit Poison expectations.

Literal tests cover all22 existing status keys in both locales, six exact unknown
IDs (including dot/slash/colon), en→zh-CN→en, and existing CE/PE feedback, silent
mana and skill-name controls. Focused143/3 pass4.87s (wrapper5.886s), full8192/257
pass138.05s (wrapper139.674s), types22.529s, lint/purity51.007s and production
build/bridge10.404s pass. Four JS chunks contain no bridge. Independent source/TDD
QA ADEQUATE; final publication follows ledger v1ci. Full15s budget and existing
Browserslist/chunk/precache warnings remain open. Engine timing/live badges,
production browser/mobile, earned progression, balance and feel remain separate.
